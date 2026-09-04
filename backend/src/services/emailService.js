const nodemailer = require("nodemailer");

function configurationError(variableName) {
  const error = new Error(`Envio de e-mail não configurado: ${variableName}`);
  error.status = 503;
  return error;
}

function requiredEnvironment(variableName) {
  const value = String(process.env[variableName] || "").trim();
  if (!value) throw configurationError(variableName);
  return value;
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: requiredEnvironment("SMTP_HOST"),
    port,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
    auth: {
      user: requiredEnvironment("SMTP_USER"),
      pass: requiredEnvironment("SMTP_PASSWORD"),
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendAccountConfirmationEmail({ email, name, token }) {
  const appBaseUrl = requiredEnvironment("APP_BASE_URL").replace(/\/$/, "");
  const confirmationUrl = `${appBaseUrl}/prefeitura/confirmar-conta?token=${encodeURIComponent(token)}`;
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (!from) throw configurationError("SMTP_FROM");

  await createTransport().sendMail({
    from,
    to: email,
    subject: "Confirme sua conta no Portal da Gestão Municipal",
    text: [
      `Olá, ${name}.`,
      "",
      "Confirme sua conta acessando o link abaixo:",
      confirmationUrl,
      "",
      "Este link expira em 30 minutos.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#26364d;line-height:1.6">
        <h2>Confirme sua conta</h2>
        <p>Olá, ${escapeHtml(name)}.</p>
        <p>Confirme seu e-mail para concluir o cadastro no Portal da Gestão Municipal.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(confirmationUrl)}" style="background:#2f66d0;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">
            Confirmar minha conta
          </a>
        </p>
        <p style="font-size:13px;color:#6b788c">Este link expira em 30 minutos.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail({ email, name, token }) {
  const appBaseUrl = requiredEnvironment("APP_BASE_URL").replace(/\/$/, "");
  const resetUrl = `${appBaseUrl}/prefeitura/redefinir-senha?token=${encodeURIComponent(token)}`;
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (!from) throw configurationError("SMTP_FROM");

  await createTransport().sendMail({
    from,
    to: email,
    subject: "Redefinição de senha do Portal da Gestão Municipal",
    text: [
      `Olá, ${name}.`,
      "",
      "Redefina sua senha acessando o link abaixo:",
      resetUrl,
      "",
      "Este link expira em 30 minutos. Se você não fez esta solicitação, ignore a mensagem.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#26364d;line-height:1.6">
        <h2>Redefina sua senha</h2>
        <p>Olá, ${escapeHtml(name)}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(resetUrl)}" style="background:#2f66d0;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size:13px;color:#6b788c">O link expira em 30 minutos. Se você não solicitou a alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}

module.exports = { sendAccountConfirmationEmail, sendPasswordResetEmail };
