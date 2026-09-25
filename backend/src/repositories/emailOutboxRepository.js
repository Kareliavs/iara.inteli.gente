const crypto = require("crypto");
const { pool } = require("../config/db");

async function enqueueEmail(client, job) {
  if (!job) return null;
  const emailId = crypto.randomUUID();
  await client.query(
    `DELETE FROM stg.email_outbox
     WHERE LOWER(destinatario) = LOWER($1) AND email_tipo = $2`,
    [job.destination, job.type],
  );
  await client.query(
    `INSERT INTO stg.email_outbox
       (email_id, email_tipo, destinatario, payload_criptografado, expira_em)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 minutes')`,
    [emailId, job.type, job.destination, job.encryptedPayload],
  );
  return emailId;
}

async function claimNextEmail() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM stg.email_outbox
       WHERE expira_em <= NOW() OR (status = 'FALHOU' AND atualizado_em <= NOW() - INTERVAL '7 days')`,
    );
    const result = await client.query(
      `WITH proximo AS (
         SELECT email_id
         FROM stg.email_outbox
         WHERE payload_criptografado IS NOT NULL
           AND expira_em > NOW()
           AND proxima_tentativa_em <= NOW()
           AND (status = 'PENDENTE' OR (status = 'PROCESSANDO' AND bloqueado_ate <= NOW()))
         ORDER BY criado_em
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       UPDATE stg.email_outbox e
       SET status = 'PROCESSANDO', bloqueado_ate = NOW() + INTERVAL '2 minutes', atualizado_em = NOW()
       FROM proximo
       WHERE e.email_id = proximo.email_id
       RETURNING e.*`,
    );
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markEmailDelivered(emailId) {
  await pool.query("DELETE FROM stg.email_outbox WHERE email_id = $1", [emailId]);
}

async function markEmailFailed(emailId, message, { maxAttempts, retryDelaySeconds }) {
  await pool.query(
    `UPDATE stg.email_outbox
     SET tentativas = tentativas + 1,
         status = CASE WHEN tentativas + 1 >= $3 THEN 'FALHOU' ELSE 'PENDENTE' END,
         payload_criptografado = CASE WHEN tentativas + 1 >= $3 THEN NULL ELSE payload_criptografado END,
         proxima_tentativa_em = NOW() + ($4 * INTERVAL '1 second'),
         bloqueado_ate = NULL,
         ultimo_erro = $2,
         atualizado_em = NOW()
     WHERE email_id = $1`,
    [emailId, String(message || "Erro desconhecido").slice(0, 1000), maxAttempts, retryDelaySeconds],
  );
}

async function getEmailOutboxStatus() {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PENDENTE')::integer AS pendentes,
       COUNT(*) FILTER (WHERE status = 'PROCESSANDO')::integer AS processando,
       COUNT(*) FILTER (WHERE status = 'FALHOU')::integer AS falhas,
       COUNT(*) FILTER (
         WHERE expira_em <= NOW() + INTERVAL '5 minutes' AND status <> 'FALHOU'
       )::integer AS expirando_em_cinco_minutos,
       MIN(criado_em) FILTER (WHERE status <> 'FALHOU') AS item_mais_antigo_em,
       MAX(atualizado_em) AS ultima_atualizacao_em
     FROM stg.email_outbox`,
  );
  const row = result.rows[0];
  const healthy = row.falhas === 0 && row.expirando_em_cinco_minutos === 0;
  return {
    healthy,
    counts: {
      failed: row.falhas,
      pending: row.pendentes,
      processing: row.processando,
      expiringSoon: row.expirando_em_cinco_minutos,
    },
    oldestQueuedAt: row.item_mais_antigo_em || null,
    updatedAt: row.ultima_atualizacao_em || null,
  };
}

module.exports = {
  claimNextEmail,
  enqueueEmail,
  getEmailOutboxStatus,
  markEmailDelivered,
  markEmailFailed,
};
