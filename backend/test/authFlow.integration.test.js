const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
require("dotenv").config({ quiet: true });

const integrationEnabled = process.env.RUN_DB_INTEGRATION_TESTS === "true";
const testOrigin = String(process.env.CORS_ORIGIN || "http://localhost:8080")
  .split(",")[0]
  .trim();
if (!process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = testOrigin;

test(
  "executa cadastro, confirmação, login, recuperação, revogação e autorização no PostgreSQL",
  { skip: !integrationEnabled },
  async () => {
    const app = require("../src/app");
    const { pool } = require("../src/config/db");
    const { decryptEmailJob } = require("../src/services/emailOutboxCrypto");
    const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const email = `integracao${suffix}@saocarlos.sp.gov.br`;
    const originalPassword = "Teste@123456";
    const newPassword = "Nova@12345678";
    const server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    async function request(path, { body, cookie, method = "GET", origin = false } = {}) {
      const headers = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (cookie) headers.Cookie = cookie;
      if (origin) headers.Origin = testOrigin;
      return fetch(`${baseUrl}${path}`, {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers,
        method,
      });
    }

    function sessionCookie(response) {
      const value = response.headers.get("set-cookie") || "";
      return value.split(";", 1)[0];
    }

    try {
      const registration = await request("/api/auth/register", {
        method: "POST",
        body: { email, nome: "Usuário de Integração", senha: originalPassword },
      });
      assert.equal(registration.status, 202, await registration.text());

      const confirmationRow = await pool.query(
        `SELECT payload_criptografado
         FROM stg.email_outbox
         WHERE LOWER(destinatario) = LOWER($1) AND email_tipo = 'ACCOUNT_CONFIRMATION'`,
        [email],
      );
      assert.equal(confirmationRow.rowCount, 1);
      const confirmationToken = decryptEmailJob(
        confirmationRow.rows[0].payload_criptografado,
      ).token;

      const confirmation = await request("/api/auth/register/confirm", {
        method: "POST",
        body: { token: confirmationToken },
      });
      assert.equal(confirmation.status, 200, await confirmation.text());
      const confirmedSession = sessionCookie(confirmation);
      assert.match(confirmedSession, /^city_hall_session=/);

      const currentSession = await request("/api/auth/session", {
        cookie: confirmedSession,
      });
      assert.equal(currentSession.status, 200);

      const login = await request("/api/auth/login", {
        method: "POST",
        body: { login: email, senha: originalPassword },
      });
      assert.equal(login.status, 200, await login.text());

      const forgot = await request("/api/auth/password/forgot", {
        method: "POST",
        body: { email },
      });
      assert.equal(forgot.status, 202, await forgot.text());
      const resetRow = await pool.query(
        `SELECT payload_criptografado
         FROM stg.email_outbox
         WHERE LOWER(destinatario) = LOWER($1) AND email_tipo = 'PASSWORD_RESET'`,
        [email],
      );
      assert.equal(resetRow.rowCount, 1);
      const resetToken = decryptEmailJob(resetRow.rows[0].payload_criptografado).token;

      const reset = await request("/api/auth/password/reset", {
        method: "POST",
        body: { token: resetToken, senha: newPassword },
      });
      assert.equal(reset.status, 200, await reset.text());
      assert.equal(
        (await request("/api/auth/session", { cookie: confirmedSession })).status,
        401,
      );

      const oldLogin = await request("/api/auth/login", {
        method: "POST",
        body: { login: email, senha: originalPassword },
      });
      assert.equal(oldLogin.status, 401);
      const newLogin = await request("/api/auth/login", {
        method: "POST",
        body: { login: email, senha: newPassword },
      });
      assert.equal(newLogin.status, 200, await newLogin.text());
      const activeSession = sessionCookie(newLogin);

      const monitorAsNonAdmin = await request("/api/admin/email-outbox/status", {
        cookie: activeSession,
      });
      assert.equal(monitorAsNonAdmin.status, 403);
      await pool.query(
        "UPDATE bd.usuario SET usuario_funcao = 'admin' WHERE LOWER(usuario_login) = LOWER($1)",
        [email],
      );
      const monitorAsAdmin = await request("/api/admin/email-outbox/status", {
        cookie: activeSession,
      });
      assert.equal(monitorAsAdmin.status, 200);
      const monitorPayload = await monitorAsAdmin.json();
      assert.equal(typeof monitorPayload.healthy, "boolean");
      assert.equal(typeof monitorPayload.counts.pending, "number");
      assert.equal("destinatario" in monitorPayload, false);
      const logoutWithoutOrigin = await request("/api/auth/logout", {
        cookie: activeSession,
        method: "POST",
      });
      assert.equal(logoutWithoutOrigin.status, 403);
      const logout = await request("/api/auth/logout", {
        cookie: activeSession,
        method: "POST",
        origin: true,
      });
      assert.equal(logout.status, 204);
    } finally {
      await pool.query(
        "DELETE FROM stg.email_outbox WHERE LOWER(destinatario) = LOWER($1)",
        [email],
      );
      await pool.query(
        "DELETE FROM stg.usuario_cadastro_pendente WHERE LOWER(usuario_login) = LOWER($1)",
        [email],
      );
      await pool.query(
        "DELETE FROM stg.autenticacao_evento WHERE LOWER(usuario_login) = LOWER($1)",
        [email],
      );
      await pool.query("DELETE FROM bd.usuario WHERE LOWER(usuario_login) = LOWER($1)", [email]);
      const rateLimitHashes = ["127.0.0.1", "::ffff:127.0.0.1"].flatMap((ip) =>
        [
          "login",
          "register",
          "register-confirm",
          "password-forgot",
          "password-reset",
        ].map((prefix) =>
          crypto.createHash("sha256").update(`${prefix}:${ip}`).digest("hex"),
        ),
      );
      await pool.query(
        "DELETE FROM stg.rate_limit_bucket WHERE chave_hash = ANY($1::varchar[])",
        [rateLimitHashes],
      );
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
    }
  },
);
