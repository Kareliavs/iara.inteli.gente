const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRuntimeConfiguration } = require("../src/config/runtimeConfig");

const NAMES = [
  "ALLOW_PERSONAL_EMAIL_REGISTRATION", "APP_BASE_URL", "AUTH_SECRET", "CORS_ORIGIN", "NODE_ENV",
  "DKIM_DOMAIN_NAME", "DKIM_PRIVATE_KEY", "DKIM_SELECTOR",
  "PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE", "SMTP_FROM",
  "SMTP_HOST", "SMTP_PASSWORD", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER",
];

function withEnvironment(values, callback) {
  const previous = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]));
  for (const name of NAMES) delete process.env[name];
  Object.assign(process.env, values);
  try {
    return callback();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("permite desenvolvimento sem SMTP para preservar login de contas existentes", () =>
  withEnvironment(
    { AUTH_SECRET: "segredo-de-desenvolvimento-com-mais-de-32-caracteres", NODE_ENV: "development" },
    () => assert.doesNotThrow(validateRuntimeConfiguration),
  ));

test("exige configuração completa de e-mail em produção", () =>
  withEnvironment(
    {
      AUTH_SECRET: "segredo-de-producao-com-mais-de-32-caracteres",
      CORS_ORIGIN: "https://portal.exemplo.gov.br",
      NODE_ENV: "production",
    },
    () => assert.throws(validateRuntimeConfiguration, /SMTP_HOST.*APP_BASE_URL/s),
  ));

test("rejeita porta e opção de segurança SMTP inválidas", () =>
  withEnvironment(
    {
      APP_BASE_URL: "http://localhost:8080",
      AUTH_SECRET: "segredo-de-desenvolvimento-com-mais-de-32-caracteres",
      NODE_ENV: "development",
      SMTP_FROM: "Portal <nao-responda@exemplo.gov.br>",
      SMTP_HOST: "smtp.exemplo.gov.br",
      SMTP_PASSWORD: "senha",
      SMTP_PORT: "invalida",
      SMTP_SECURE: "talvez",
      SMTP_USER: "usuario",
    },
    () => assert.throws(validateRuntimeConfiguration, /SMTP_PORT.*SMTP_SECURE/s),
  ));

test("impede a exceção de e-mail pessoal em produção", () =>
  withEnvironment(
    {
      ALLOW_PERSONAL_EMAIL_REGISTRATION: "true",
      APP_BASE_URL: "https://portal.exemplo.gov.br",
      AUTH_SECRET: "segredo-de-producao-com-mais-de-32-caracteres",
      CORS_ORIGIN: "https://portal.exemplo.gov.br",
      NODE_ENV: "production",
      PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE: "3548906",
      SMTP_FROM: "Portal <nao-responda@exemplo.gov.br>",
      SMTP_HOST: "smtp.exemplo.gov.br",
      SMTP_PASSWORD: "senha",
      SMTP_USER: "usuario",
    },
    () => assert.throws(validateRuntimeConfiguration, /não pode ser habilitado em produção/),
  ));

test("exige configuração DKIM completa quando a assinatura local é usada", () =>
  withEnvironment(
    {
      AUTH_SECRET: "segredo-de-desenvolvimento-com-mais-de-32-caracteres",
      DKIM_SELECTOR: "portal",
      NODE_ENV: "development",
    },
    () => assert.throws(validateRuntimeConfiguration, /devem ser configurados juntos/),
  ));

test("rejeita placeholders de segredos no ambiente de produção", () =>
  withEnvironment(
    {
      APP_BASE_URL: "https://portal.exemplo.gov.br",
      AUTH_SECRET: "gere-um-segredo-aleatorio-com-no-minimo-32-caracteres",
      CORS_ORIGIN: "https://portal.exemplo.gov.br",
      NODE_ENV: "production",
      SMTP_FROM: "Portal <nao-responda@exemplo.gov.br>",
      SMTP_HOST: "smtp.exemplo.gov.br",
      SMTP_PASSWORD: "use-um-secret-manager",
      SMTP_USER: "usuario",
    },
    () => assert.throws(validateRuntimeConfiguration, /AUTH_SECRET.*SMTP_PASSWORD/s),
  ));
