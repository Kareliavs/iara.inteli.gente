const emailOutboxRepository = require("../repositories/emailOutboxRepository");
const { decryptEmailJob } = require("./emailOutboxCrypto");
const { deliverEmailJob, isEmailDeliveryConfigured } = require("./emailService");

const MAX_ATTEMPTS = 6;
const RETRY_DELAYS_SECONDS = [15, 45, 120, 300, 600, 900];

function safeErrorMessage(error) {
  return String(error?.message || "Falha ao enviar e-mail")
    .replace(/(pass(?:word)?|token|secret)=?[^\s,;]*/gi, "$1=[oculto]")
    .slice(0, 1000);
}

async function processEmailOutboxBatch({
  deliver = deliverEmailJob,
  maxItems = 10,
  repository = emailOutboxRepository,
} = {}) {
  let processed = 0;
  while (processed < maxItems) {
    const row = await repository.claimNextEmail();
    if (!row) break;
    try {
      await deliver(decryptEmailJob(row.payload_criptografado));
      await repository.markEmailDelivered(row.email_id);
    } catch (error) {
      const attempts = Number(row.tentativas || 0);
      await repository.markEmailFailed(row.email_id, safeErrorMessage(error), {
        maxAttempts: MAX_ATTEMPTS,
        retryDelaySeconds: RETRY_DELAYS_SECONDS[Math.min(attempts, RETRY_DELAYS_SECONDS.length - 1)],
      });
      console.error(`Falha ao entregar e-mail da outbox ${row.email_id}:`, safeErrorMessage(error));
    }
    processed += 1;
  }
  return processed;
}

function startEmailOutboxWorker({ intervalMs = 5_000 } = {}) {
  if (!isEmailDeliveryConfigured()) return { enabled: false, stop() {} };
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await processEmailOutboxBatch();
    } catch (error) {
      console.error("Falha ao processar a outbox de e-mail:", safeErrorMessage(error));
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, intervalMs);
  timer.unref();
  setImmediate(run);
  return { enabled: true, stop: () => clearInterval(timer) };
}

module.exports = { processEmailOutboxBatch, startEmailOutboxWorker };
