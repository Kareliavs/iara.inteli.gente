function configured(value) {
  return Boolean(String(value || "").trim());
}

function validateRuntimeConfiguration() {
  const errors = [];
  const authSecret = String(process.env.AUTH_SECRET || "");
  const production = process.env.NODE_ENV === "production";
  const allowPersonalEmail =
    String(process.env.ALLOW_PERSONAL_EMAIL_REGISTRATION || "").toLowerCase() === "true";

  if (
    authSecret.length < 32 ||
    authSecret.includes("troque-por-um-segredo") ||
    authSecret.includes("gere-um-segredo")
  ) {
    errors.push("AUTH_SECRET deve possuir pelo menos 32 caracteres aleatórios");
  }
  if (production && !configured(process.env.CORS_ORIGIN)) {
    errors.push("CORS_ORIGIN é obrigatório em produção");
  }
  if (production && configured(process.env.CORS_ORIGIN)) {
    const origins = String(process.env.CORS_ORIGIN).split(",").map((value) => value.trim());
    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (parsed.origin !== origin.replace(/\/$/, "") || parsed.protocol !== "https:") {
          errors.push(`CORS_ORIGIN deve conter somente origens HTTPS válidas: ${origin}`);
        }
      } catch {
        errors.push(`CORS_ORIGIN contém uma origem inválida: ${origin}`);
      }
    }
  }
  if (allowPersonalEmail && production) {
    errors.push("ALLOW_PERSONAL_EMAIL_REGISTRATION não pode ser habilitado em produção");
  }
  if (allowPersonalEmail) {
    const municipioCodIbge = Number(process.env.PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE);
    if (!Number.isSafeInteger(municipioCodIbge) || municipioCodIbge <= 0) {
      errors.push("PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE deve ser um código IBGE válido");
    }
  }
  if (
    production &&
    configured(process.env.APP_BASE_URL) &&
    !String(process.env.APP_BASE_URL).startsWith("https://")
  ) {
    errors.push("APP_BASE_URL deve usar HTTPS em produção");
  }

  const smtpVariables = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const emailVariables = [...smtpVariables, "APP_BASE_URL"];
  const smtpConfigured = emailVariables.some((name) => configured(process.env[name]));
  if (smtpConfigured || production) {
    for (const variableName of emailVariables) {
      if (!configured(process.env[variableName])) {
        errors.push(`${variableName} é obrigatório quando o SMTP está habilitado`);
      }
    }
  }
  if (
    production &&
    String(process.env.SMTP_PASSWORD || "").includes("use-um-secret-manager")
  ) {
    errors.push("SMTP_PASSWORD deve vir de um gerenciador de segredos");
  }
  if (configured(process.env.SMTP_PORT)) {
    const smtpPort = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      errors.push("SMTP_PORT deve ser uma porta válida entre 1 e 65535");
    }
  }
  if (
    configured(process.env.SMTP_SECURE) &&
    !["true", "false"].includes(String(process.env.SMTP_SECURE).toLowerCase())
  ) {
    errors.push("SMTP_SECURE deve ser true ou false");
  }

  const dkimVariables = ["DKIM_DOMAIN_NAME", "DKIM_PRIVATE_KEY", "DKIM_SELECTOR"];
  const configuredDkimVariables = dkimVariables.filter((name) => configured(process.env[name]));
  if (configuredDkimVariables.length > 0 && configuredDkimVariables.length !== dkimVariables.length) {
    errors.push("DKIM_DOMAIN_NAME, DKIM_PRIVATE_KEY e DKIM_SELECTOR devem ser configurados juntos");
  }

  if (errors.length > 0) {
    throw new Error(`Configuração inválida:\n- ${errors.join("\n- ")}`);
  }
}

module.exports = { validateRuntimeConfiguration };
