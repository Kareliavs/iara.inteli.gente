function configured(value) {
  return Boolean(String(value || "").trim());
}

function validateRuntimeConfiguration() {
  const errors = [];
  const authSecret = String(process.env.AUTH_SECRET || "");
  const production = process.env.NODE_ENV === "production";

  if (authSecret.length < 32 || authSecret.includes("troque-por-um-segredo")) {
    errors.push("AUTH_SECRET deve possuir pelo menos 32 caracteres aleatórios");
  }
  if (production && !configured(process.env.CORS_ORIGIN)) {
    errors.push("CORS_ORIGIN é obrigatório em produção");
  }
  if (
    production &&
    configured(process.env.APP_BASE_URL) &&
    !String(process.env.APP_BASE_URL).startsWith("https://")
  ) {
    errors.push("APP_BASE_URL deve usar HTTPS em produção");
  }

  const smtpVariables = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const smtpConfigured = smtpVariables.some((name) => configured(process.env[name]));
  if (smtpConfigured) {
    for (const variableName of [...smtpVariables, "APP_BASE_URL"]) {
      if (!configured(process.env[variableName])) {
        errors.push(`${variableName} é obrigatório quando o SMTP está habilitado`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuração inválida:\n- ${errors.join("\n- ")}`);
  }
}

module.exports = { validateRuntimeConfiguration };
