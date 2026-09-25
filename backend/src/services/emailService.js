const nodemailer = require("nodemailer");

const SMTP_VARIABLES = [
  "APP_BASE_URL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];

let cachedTransport = null;

const EMAIL_COPY = {
  pt: {
    greeting: "Olá",
    confirmSubject: "Confirme sua conta no Portal da Gestão Municipal",
    confirmInstruction: "Confirme sua conta acessando o link abaixo:",
    confirmTitle: "Confirme sua conta",
    confirmBody: "Confirme seu e-mail para concluir o cadastro no Portal da Gestão Municipal.",
    confirmButton: "Confirmar minha conta",
    expires: "Este link expira em 30 minutos.",
    resetSubject: "Redefinição de senha do Portal da Gestão Municipal",
    resetInstruction: "Redefina sua senha acessando o link abaixo:",
    resetTitle: "Redefina sua senha",
    resetBody: "Recebemos uma solicitação para redefinir sua senha.",
    resetButton: "Redefinir minha senha",
    resetExpires: "O link expira em 30 minutos. Se você não solicitou a alteração, ignore este e-mail.",
  },
  en: {
    greeting: "Hello",
    confirmSubject: "Confirm your account on the Municipal Management Portal",
    confirmInstruction: "Confirm your account using the link below:",
    confirmTitle: "Confirm your account",
    confirmBody: "Confirm your email address to complete your registration on the Municipal Management Portal.",
    confirmButton: "Confirm my account",
    expires: "This link expires in 30 minutes.",
    resetSubject: "Municipal Management Portal password reset",
    resetInstruction: "Reset your password using the link below:",
    resetTitle: "Reset your password",
    resetBody: "We received a request to reset your password.",
    resetButton: "Reset my password",
    resetExpires: "This link expires in 30 minutes. If you did not request this change, ignore this email.",
  },
  fr: {
    greeting: "Bonjour",
    confirmSubject: "Confirmez votre compte sur le Portail de gestion municipale",
    confirmInstruction: "Confirmez votre compte en utilisant le lien ci-dessous :",
    confirmTitle: "Confirmez votre compte",
    confirmBody: "Confirmez votre adresse e-mail pour terminer votre inscription sur le Portail de gestion municipale.",
    confirmButton: "Confirmer mon compte",
    expires: "Ce lien expire dans 30 minutes.",
    resetSubject: "Réinitialisation du mot de passe du Portail de gestion municipale",
    resetInstruction: "Réinitialisez votre mot de passe en utilisant le lien ci-dessous :",
    resetTitle: "Réinitialisez votre mot de passe",
    resetBody: "Nous avons reçu une demande de réinitialisation de votre mot de passe.",
    resetButton: "Réinitialiser mon mot de passe",
    resetExpires: "Ce lien expire dans 30 minutes. Si vous n'avez pas demandé cette modification, ignorez cet e-mail.",
  },
  es: {
    greeting: "Hola",
    confirmSubject: "Confirma tu cuenta en el Portal de Gestión Municipal",
    confirmInstruction: "Confirma tu cuenta mediante el siguiente enlace:",
    confirmTitle: "Confirma tu cuenta",
    confirmBody: "Confirma tu correo electrónico para completar el registro en el Portal de Gestión Municipal.",
    confirmButton: "Confirmar mi cuenta",
    expires: "Este enlace caduca en 30 minutos.",
    resetSubject: "Restablecimiento de contraseña del Portal de Gestión Municipal",
    resetInstruction: "Restablece tu contraseña mediante el siguiente enlace:",
    resetTitle: "Restablece tu contraseña",
    resetBody: "Recibimos una solicitud para restablecer tu contraseña.",
    resetButton: "Restablecer mi contraseña",
    resetExpires: "Este enlace caduca en 30 minutos. Si no solicitaste este cambio, ignora este correo electrónico.",
  },
};

function emailCopy(language) {
  return EMAIL_COPY[["pt", "en", "fr", "es"].includes(language) ? language : "pt"];
}

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

function isEmailDeliveryConfigured() {
  return SMTP_VARIABLES.every((variableName) =>
    Boolean(String(process.env[variableName] || "").trim()),
  );
}

function assertEmailDeliveryConfigured() {
  for (const variableName of SMTP_VARIABLES) requiredEnvironment(variableName);
}

function smtpConfiguration() {
  assertEmailDeliveryConfigured();
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error("Envio de e-mail não configurado: SMTP_PORT inválida");
    error.status = 503;
    throw error;
  }
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const configuration = {
    auth: {
      pass: requiredEnvironment("SMTP_PASSWORD"),
      user: requiredEnvironment("SMTP_USER"),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    host: requiredEnvironment("SMTP_HOST"),
    port,
    requireTLS: process.env.NODE_ENV === "production" && !secure,
    secure,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  };
  const dkimSelector = String(process.env.DKIM_SELECTOR || "").trim();
  const dkimPrivateKey = String(process.env.DKIM_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
  const dkimDomainName = String(process.env.DKIM_DOMAIN_NAME || "").trim();
  if (dkimSelector && dkimPrivateKey && dkimDomainName) {
    configuration.dkim = {
      domainName: dkimDomainName,
      keySelector: dkimSelector,
      privateKey: dkimPrivateKey,
    };
  }
  return configuration;
}

function createTransport() {
  return nodemailer.createTransport(smtpConfiguration());
}

function getTransport() {
  if (!cachedTransport) cachedTransport = createTransport();
  return cachedTransport;
}

function resetEmailTransportForTests() {
  cachedTransport = null;
}

async function verifyEmailTransport({ required = false, transport } = {}) {
  if (!isEmailDeliveryConfigured()) {
    if (required) assertEmailDeliveryConfigured();
    return { configured: false, verified: false };
  }
  const activeTransport = transport || getTransport();
  await activeTransport.verify();
  return { configured: true, verified: true };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function accountConfirmationMessage({ email, language = "pt", name, token }) {
  const appBaseUrl = requiredEnvironment("APP_BASE_URL").replace(/\/$/, "");
  const confirmationUrl = `${appBaseUrl}/prefeitura/confirmar-conta?token=${encodeURIComponent(token)}`;
  const copy = emailCopy(language);
  return {
    from: requiredEnvironment("SMTP_FROM"),
    to: email,
    subject: copy.confirmSubject,
    text: [
      `${copy.greeting}, ${name}.`,
      "",
      copy.confirmInstruction,
      confirmationUrl,
      "",
      copy.expires,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#26364d;line-height:1.6">
        <h2>${copy.confirmTitle}</h2>
        <p>${copy.greeting}, ${escapeHtml(name)}.</p>
        <p>${copy.confirmBody}</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(confirmationUrl)}" style="background:#2f66d0;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">
            ${copy.confirmButton}
          </a>
        </p>
        <p style="font-size:13px;color:#6b788c">${copy.expires}</p>
      </div>
    `,
  };
}

function passwordResetMessage({ email, language = "pt", name, token }) {
  const appBaseUrl = requiredEnvironment("APP_BASE_URL").replace(/\/$/, "");
  const resetUrl = `${appBaseUrl}/prefeitura/redefinir-senha?token=${encodeURIComponent(token)}`;
  const copy = emailCopy(language);
  return {
    from: requiredEnvironment("SMTP_FROM"),
    to: email,
    subject: copy.resetSubject,
    text: [
      `${copy.greeting}, ${name}.`,
      "",
      copy.resetInstruction,
      resetUrl,
      "",
      copy.resetExpires,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#26364d;line-height:1.6">
        <h2>${copy.resetTitle}</h2>
        <p>${copy.greeting}, ${escapeHtml(name)}.</p>
        <p>${copy.resetBody}</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(resetUrl)}" style="background:#2f66d0;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">
            ${copy.resetButton}
          </a>
        </p>
        <p style="font-size:13px;color:#6b788c">${copy.resetExpires}</p>
      </div>
    `,
  };
}

async function deliverEmailJob(job, { transport } = {}) {
  assertEmailDeliveryConfigured();
  const message = job.type === "ACCOUNT_CONFIRMATION"
    ? accountConfirmationMessage(job)
    : job.type === "PASSWORD_RESET"
      ? passwordResetMessage(job)
      : null;
  if (!message) throw new Error(`Tipo de e-mail não suportado: ${job.type}`);

  const info = await (transport || getTransport()).sendMail(message);
  if (Array.isArray(info?.rejected) && info.rejected.length > 0) {
    throw new Error("O servidor SMTP rejeitou o destinatário");
  }
  return info;
}

async function sendAccountConfirmationEmail({ email, name, token }, options) {
  return deliverEmailJob({ email, name, token, type: "ACCOUNT_CONFIRMATION" }, options);
}

async function sendPasswordResetEmail({ email, name, token }, options) {
  return deliverEmailJob({ email, name, token, type: "PASSWORD_RESET" }, options);
}

module.exports = {
  accountConfirmationMessage,
  assertEmailDeliveryConfigured,
  deliverEmailJob,
  isEmailDeliveryConfigured,
  passwordResetMessage,
  resetEmailTransportForTests,
  sendAccountConfirmationEmail,
  sendPasswordResetEmail,
  verifyEmailTransport,
};
