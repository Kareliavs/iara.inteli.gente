const crypto = require("crypto");
const { pool } = require("../config/db");

function hashRateLimitKey(key) {
  return crypto.createHash("sha256").update(String(key)).digest("hex");
}

async function consumeRateLimit({ key, windowMs }) {
  const now = Date.now();
  const bucketStartMs = Math.floor(now / windowMs) * windowMs;
  const expiresAtMs = bucketStartMs + windowMs;
  const result = await pool.query(
    `WITH limpeza AS (
       DELETE FROM stg.rate_limit_bucket WHERE expira_em <= NOW()
     )
     INSERT INTO stg.rate_limit_bucket
       (chave_hash, janela_inicio, contador, expira_em)
     VALUES ($1, TO_TIMESTAMP($2 / 1000.0), 1, TO_TIMESTAMP($3 / 1000.0))
     ON CONFLICT (chave_hash, janela_inicio)
     DO UPDATE SET contador = stg.rate_limit_bucket.contador + 1
     RETURNING contador`,
    [hashRateLimitKey(key), bucketStartMs, expiresAtMs],
  );
  return { count: Number(result.rows[0].contador), resetAt: expiresAtMs };
}

module.exports = { consumeRateLimit, hashRateLimitKey };
