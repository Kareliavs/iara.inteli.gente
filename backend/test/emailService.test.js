const test = require("node:test");
const assert = require("node:assert/strict");
const {
  accountConfirmationMessage,
  deliverEmailJob,
  passwordResetMessage,
  verifyEmailTransport,
} = require("../src/services/emailService");
const {
  createEncryptedEmailJob,
  decryptEmailJob,
} = require("../src/services/emailOutboxCrypto");

const ENVIRONMENT = {
  APP_BASE_URL: "https://portal.exemplo.gov.br",
  AUTH_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
  SMTP_FROM: "Portal <nao-responda@exemplo.gov.br>",
  SMTP_HOST: "smtp.exemplo.gov.br",
  SMTP_PASSWORD: "senha-de-teste",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "usuario-de-teste",
};

function withEmailEnvironment(callback) {
  const previous = {};
  for (const [name, value] of Object.entries(ENVIRONMENT)) {
    previous[name] = process.env[name];
    process.env[name] = value;
  }
  return Promise.resolve()
    .then(callback)
    .finally(() => {
      for (const [name, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    });
}

test("monta os links de confirmação e redefinição sem permitir HTML no nome", () =>
  withEmailEnvironment(() => {
    const confirmation = accountConfirmationMessage({
      email: "gestor@cidade.sp.gov.br",
      name: "<Gestor>",
      token: "token com espaços",
    });
    const reset = passwordResetMessage({
      email: "gestor@cidade.sp.gov.br",
      name: "Gestor",
      token: "token-reset",
    });

    assert.match(confirmation.text, /confirmar-conta\?token=token%20com%20espa%C3%A7os/);
    assert.doesNotMatch(confirmation.html, /<Gestor>/);
    assert.match(confirmation.html, /&lt;Gestor&gt;/);
    assert.match(reset.text, /redefinir-senha\?token=token-reset/);
  }));

test("envia pelo transporte injetado e detecta destinatário rejeitado", () =>
  withEmailEnvironment(async () => {
    const messages = [];
    const acceptedTransport = {
      async sendMail(message) {
        messages.push(message);
        return { accepted: [message.to], rejected: [] };
      },
    };
    await deliverEmailJob(
      {
        email: "gestor@cidade.sp.gov.br",
        name: "Gestor",
        token: "token",
        type: "ACCOUNT_CONFIRMATION",
      },
      { transport: acceptedTransport },
    );
    assert.equal(messages.length, 1);
    assert.equal(messages[0].to, "gestor@cidade.sp.gov.br");

    await assert.rejects(
      deliverEmailJob(
        {
          email: "rejeitado@cidade.sp.gov.br",
          name: "Gestor",
          token: "token",
          type: "PASSWORD_RESET",
        },
        { transport: { sendMail: async () => ({ rejected: ["rejeitado@cidade.sp.gov.br"] }) } },
      ),
      /rejeitou o destinatário/,
    );
  }));

test("verifica o transporte SMTP sem enviar mensagem", () =>
  withEmailEnvironment(async () => {
    let verified = false;
    const status = await verifyEmailTransport({
      transport: { verify: async () => { verified = true; } },
    });
    assert.equal(verified, true);
    assert.deepEqual(status, { configured: true, verified: true });
  }));

test("criptografa o token da outbox e rejeita payload adulterado", () =>
  withEmailEnvironment(() => {
    const queued = createEncryptedEmailJob({
      email: "GESTOR@CIDADE.SP.GOV.BR",
      name: "Gestor",
      token: "token-secreto",
      type: "ACCOUNT_CONFIRMATION",
    });
    assert.equal(queued.destination, "gestor@cidade.sp.gov.br");
    assert.doesNotMatch(queued.encryptedPayload, /token-secreto/);
    assert.deepEqual(decryptEmailJob(queued.encryptedPayload), {
      email: "gestor@cidade.sp.gov.br",
      name: "Gestor",
      token: "token-secreto",
      type: "ACCOUNT_CONFIRMATION",
    });

    const tampered = `${queued.encryptedPayload.slice(0, -1)}A`;
    assert.throws(() => decryptEmailJob(tampered));
  }));
