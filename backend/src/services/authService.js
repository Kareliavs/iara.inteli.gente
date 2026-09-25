const crypto = require("crypto");
const { promisify } = require("util");

const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const EMAIL_CONFIRMATION_TOKEN_BYTES = 32;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 2 ** 15;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 3;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const LEGACY_SCRYPT_PARAMETERS = {
  cost: 2 ** 14,
  blockSize: 8,
  parallelization: 1,
};
const DUMMY_PASSWORD_HASH = {
  blockSize: SCRYPT_BLOCK_SIZE,
  cost: SCRYPT_COST,
  hash: Buffer.alloc(SCRYPT_KEY_LENGTH),
  parallelization: SCRYPT_PARALLELIZATION,
  salt: crypto.randomBytes(16),
};
const scryptAsync = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MUNICIPAL_EMAIL_PATTERN = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\.gov\.br$/i;

function personalEmailRegistrationEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    String(process.env.ALLOW_PERSONAL_EMAIL_REGISTRATION || "").toLowerCase() === "true"
  );
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function getAuthSecret() {
  const secret = String(process.env.AUTH_SECRET || "");

  if (secret.length < 32) {
    const error = new Error("AUTH_SECRET deve possuir pelo menos 32 caracteres");
    error.status = 503;
    throw error;
  }

  return secret;
}

async function derivePasswordHash(password, salt, keyLength, parameters) {
  return scryptAsync(password, salt, keyLength, {
    N: parameters.cost,
    r: parameters.blockSize,
    p: parameters.parallelization,
    maxmem: SCRYPT_MAX_MEMORY,
  });
}

function parsePasswordHash(storedHash) {
  const parts = String(storedHash || "").split("$");
  if (parts[0] !== "scrypt") return null;

  const legacy = parts.length === 3;
  const [cost, blockSize, parallelization, saltHex, hashHex] = legacy
    ? [
        LEGACY_SCRYPT_PARAMETERS.cost,
        LEGACY_SCRYPT_PARAMETERS.blockSize,
        LEGACY_SCRYPT_PARAMETERS.parallelization,
        parts[1],
        parts[2],
      ]
    : [Number(parts[1]), Number(parts[2]), Number(parts[3]), parts[4], parts[5]];

  const memoryCost = 128 * cost * blockSize;
  const validParameters =
    Number.isSafeInteger(cost) &&
    cost > 1 &&
    (cost & (cost - 1)) === 0 &&
    Number.isSafeInteger(blockSize) &&
    blockSize > 0 &&
    Number.isSafeInteger(parallelization) &&
    parallelization > 0 &&
    memoryCost < SCRYPT_MAX_MEMORY;
  if (
    (!legacy && parts.length !== 6) ||
    !validParameters ||
    !/^[a-f0-9]{32}$/i.test(saltHex || "") ||
    !/^[a-f0-9]{128}$/i.test(hashHex || "")
  ) {
    return null;
  }

  return {
    blockSize,
    cost,
    hash: Buffer.from(hashHex, "hex"),
    legacy,
    parallelization,
    salt: Buffer.from(saltHex, "hex"),
  };
}

async function hashPassword(password) {
  const normalizedPassword = String(password || "");
  if (!normalizedPassword) {
    throw new Error("A senha não pode ser vazia");
  }

  const salt = crypto.randomBytes(16);
  const hash = await derivePasswordHash(normalizedPassword, salt, SCRYPT_KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
  });
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

function createEmailConfirmationToken() {
  return crypto.randomBytes(EMAIL_CONFIRMATION_TOKEN_BYTES).toString("base64url");
}

function hashEmailConfirmationToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

async function verifyPassword(password, storedHash) {
  const parsedHash = parsePasswordHash(storedHash);
  const hashToVerify = parsedHash || DUMMY_PASSWORD_HASH;

  try {
    const actualHash = await derivePasswordHash(
      String(password || ""),
      hashToVerify.salt,
      hashToVerify.hash.length,
      hashToVerify,
    );
    const matches = Boolean(parsedHash) && crypto.timingSafeEqual(actualHash, parsedHash.hash);
    if (parsedHash?.legacy && !matches) {
      await derivePasswordHash(
        String(password || ""),
        DUMMY_PASSWORD_HASH.salt,
        DUMMY_PASSWORD_HASH.hash.length,
        DUMMY_PASSWORD_HASH,
      );
    }
    return matches;
  } catch {
    return false;
  }
}

function needsPasswordRehash(storedHash) {
  const parsedHash = parsePasswordHash(storedHash);
  return (
    !parsedHash ||
    parsedHash.legacy ||
    parsedHash.cost !== SCRYPT_COST ||
    parsedHash.blockSize !== SCRYPT_BLOCK_SIZE ||
    parsedHash.parallelization !== SCRYPT_PARALLELIZATION
  );
}

function registrationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateInstitutionalEmail(value) {
  const usuarioLogin = String(value || "").trim().toLowerCase();
  const emailMatch = usuarioLogin.match(MUNICIPAL_EMAIL_PATTERN);
  if (usuarioLogin.length > 254 || !EMAIL_PATTERN.test(usuarioLogin)) {
    throw registrationError("Informe um endereço de e-mail válido");
  }
  if (!emailMatch && !personalEmailRegistrationEnabled()) {
    throw registrationError(
      "Use um e-mail institucional no formato usuario@cidade.estado.gov.br",
    );
  }
  if (!emailMatch) {
    const municipioCodIbge = Number(process.env.PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE);
    if (!Number.isSafeInteger(municipioCodIbge) || municipioCodIbge <= 0) {
      const error = new Error(
        "PERSONAL_EMAIL_TEST_MUNICIPIO_COD_IBGE deve identificar o município do cadastro de teste",
      );
      error.status = 503;
      throw error;
    }
    return { municipioCodIbge, usuarioLogin };
  }
  return {
    estadoSigla: emailMatch[2].toUpperCase(),
    municipioDominio: emailMatch[1].replace(/[^a-z0-9]/g, ""),
    usuarioLogin,
  };
}

function validateNewPassword(value) {
  const senha = String(value || "");
  if (senha.length < 8 || senha.length > 128) {
    throw registrationError("A senha deve possuir entre 8 e 128 caracteres");
  }
  return senha;
}

function validateRegistrationInput(input = {}) {
  const usuarioNome = String(input.nome || "").trim().replace(/\s+/g, " ");
  const email = validateInstitutionalEmail(input.login);
  const senha = validateNewPassword(input.senha);

  if (usuarioNome.length < 3 || usuarioNome.length > 150) {
    throw registrationError("Informe um nome entre 3 e 150 caracteres");
  }
  return { ...email, senha, usuarioNome };
}

function signAuthToken(userId, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: String(userId),
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
      jti: crypto.randomUUID(),
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

function verifyAuthToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;

  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(unsignedToken)
    .digest();
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsedPayload.sub || Number(parsedPayload.exp) <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsedPayload;
  } catch {
    return null;
  }
}

module.exports = {
  createEmailConfirmationToken,
  hashEmailConfirmationToken,
  hashPassword,
  needsPasswordRehash,
  signAuthToken,
  validateInstitutionalEmail,
  validateNewPassword,
  validateRegistrationInput,
  verifyAuthToken,
  verifyPassword,
};
