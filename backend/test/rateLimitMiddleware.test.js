const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../src/middleware/rateLimitMiddleware");
const { hashRateLimitKey } = require("../src/repositories/rateLimitRepository");

function responseDouble() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
  };
}

test("permite até o limite compartilhado e responde 429 depois dele", async () => {
  let count = 0;
  const consume = async ({ key }) => ({
    count: ++count,
    resetAt: Date.now() + 60_000,
    key,
  });
  const middleware = createRateLimiter({ keyPrefix: "login", max: 2, windowMs: 60_000, consume });
  const request = { ip: "203.0.113.10" };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = responseDouble();
    let continued = false;
    await middleware(request, response, () => { continued = true; });
    assert.equal(continued, true);
    assert.equal(response.headers["RateLimit-Remaining"], String(2 - attempt));
  }

  const blockedResponse = responseDouble();
  await middleware(request, blockedResponse, () => assert.fail("não deveria continuar"));
  assert.equal(blockedResponse.statusCode, 429);
  assert.match(blockedResponse.body.error, /Muitas tentativas/);
  assert.ok(Number(blockedResponse.headers["Retry-After"]) > 0);
});

test("não persiste o endereço IP em texto puro na chave do rate limit", () => {
  const hash = hashRateLimitKey("login:203.0.113.10");
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(hash, /203\.0\.113\.10/);
});
