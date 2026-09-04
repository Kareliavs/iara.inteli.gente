const test = require("node:test");
const assert = require("node:assert/strict");
process.env.AI_RATE_LIMIT_MAX = "10";
process.env.AI_ASSISTANT_ENABLED = "true";
const app = require("../src/app");

test("expõe a rota pública com no-store, rate limit e validação antes do banco", async (t) => {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const address = server.address();
  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/assistente/perguntar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta: "", contexto: {} }),
    },
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("ratelimit-limit"), "10");
  assert.deepEqual(await response.json(), {
    error: "Pergunta deve possuir ao menos 3 caracteres",
  });
});
