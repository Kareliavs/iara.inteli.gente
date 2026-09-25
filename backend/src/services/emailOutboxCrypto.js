const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const CONTEXT = "inteligente-email-outbox-v1";

function encryptionKey() {
  const secret = String(process.env.AUTH_SECRET || "");
  if (secret.length < 32) {
    const error = new Error("AUTH_SECRET deve possuir pelo menos 32 caracteres");
    error.status = 503;
    throw error;
  }
  return crypto.createHash("sha256").update(`${CONTEXT}:${secret}`).digest();
}

function encryptEmailJob(job) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(job), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decryptEmailJob(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 3) throw new Error("Payload de e-mail inválido");
  const [iv, authTag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
  if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Payload de e-mail inválido");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const job = JSON.parse(plaintext.toString("utf8"));
  if (!job?.type || !job?.email || !job?.token) throw new Error("Payload de e-mail incompleto");
  return job;
}

function createEncryptedEmailJob({ email, language = "pt", name, token, type }) {
  return {
    destination: String(email || "").trim().toLowerCase(),
    encryptedPayload: encryptEmailJob({
      email: String(email || "").trim().toLowerCase(),
      language: ["pt", "en", "fr", "es"].includes(language) ? language : "pt",
      name: String(name || "usuário").trim() || "usuário",
      token: String(token || ""),
      type,
    }),
    type,
  };
}

module.exports = { createEncryptedEmailJob, decryptEmailJob, encryptEmailJob };
