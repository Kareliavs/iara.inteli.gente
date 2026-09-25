const { mock, test } = require("node:test");
const assert = require("node:assert/strict");

process.env.ASSISTANT_RATE_LIMIT_MAX = "10";
const rateLimitRepository = require("../src/repositories/rateLimitRepository");
mock.method(rateLimitRepository, "consumeRateLimit", async () => ({
  count: 1,
  resetAt: Date.now() + 60_000,
}));
const app = require("../src/app");

test("expõe a consulta orientada com no-store, rate limit e validação antes do banco", async (t) => {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  t.after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/assistente/consultar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: "pergunta_livre", contexto: {} }),
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("ratelimit-limit"), "10");
  assert.deepEqual(await response.json(), { error: "Consulta orientada inválida" });
});
