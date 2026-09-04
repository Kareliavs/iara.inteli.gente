const test = require("node:test");
const assert = require("node:assert/strict");

process.env.AI_ASSISTANT_ENABLED = "false";
const app = require("../src/app");

test("não expõe a rota do assistente quando a flag está desativada", async (t) => {
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
      body: JSON.stringify({ pergunta: "Teste", contexto: {} }),
    },
  );

  assert.equal(response.status, 404);
});
