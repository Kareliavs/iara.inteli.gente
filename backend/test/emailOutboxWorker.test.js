const test = require("node:test");
const assert = require("node:assert/strict");
const { createEncryptedEmailJob } = require("../src/services/emailOutboxCrypto");
const { processEmailOutboxBatch } = require("../src/services/emailOutboxWorker");

process.env.AUTH_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

function outboxRow(overrides = {}) {
  const job = createEncryptedEmailJob({
    email: "gestor@cidade.sp.gov.br",
    name: "Gestor",
    token: "token",
    type: "ACCOUNT_CONFIRMATION",
  });
  return {
    email_id: "email-1",
    payload_criptografado: job.encryptedPayload,
    tentativas: 0,
    ...overrides,
  };
}

test("remove da outbox uma mensagem entregue", async () => {
  const rows = [outboxRow(), null];
  const delivered = [];
  const repository = {
    claimNextEmail: async () => rows.shift(),
    markEmailDelivered: async (id) => delivered.push(id),
    markEmailFailed: async () => assert.fail("não deveria registrar falha"),
  };

  const processed = await processEmailOutboxBatch({
    deliver: async (job) => assert.equal(job.token, "token"),
    repository,
  });
  assert.equal(processed, 1);
  assert.deepEqual(delivered, ["email-1"]);
});

test("reprograma uma falha com atraso crescente e limite de tentativas", async () => {
  const rows = [outboxRow({ tentativas: 2 }), null];
  const failures = [];
  const repository = {
    claimNextEmail: async () => rows.shift(),
    markEmailDelivered: async () => assert.fail("não deveria registrar entrega"),
    markEmailFailed: async (...args) => failures.push(args),
  };
  const previousConsoleError = console.error;
  console.error = () => {};
  try {
    const processed = await processEmailOutboxBatch({
      deliver: async () => { throw new Error("SMTP temporariamente indisponível"); },
      repository,
    });
    assert.equal(processed, 1);
  } finally {
    console.error = previousConsoleError;
  }

  assert.equal(failures.length, 1);
  assert.equal(failures[0][0], "email-1");
  assert.match(failures[0][1], /temporariamente indisponível/);
  assert.deepEqual(failures[0][2], { maxAttempts: 6, retryDelaySeconds: 120 });
});
