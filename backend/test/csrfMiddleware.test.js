const test = require("node:test");
const assert = require("node:assert/strict");
const { createCsrfProtection } = require("../src/middleware/csrfMiddleware");

function execute({ cookie = "", method = "POST", origin, referer } = {}) {
  const req = { headers: { cookie, origin, referer }, method };
  const response = { body: null, statusCode: 200 };
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (body) => {
    response.body = body;
    return response;
  };
  let nextCalled = false;
  createCsrfProtection(["https://portal.exemplo.gov.br"])(req, response, () => {
    nextCalled = true;
  });
  return { nextCalled, response };
}

test("permite métodos seguros e requisições sem sessão", () => {
  assert.equal(execute({ method: "GET", cookie: "city_hall_session=token" }).nextCalled, true);
  assert.equal(execute({ method: "POST" }).nextCalled, true);
});

test("exige origem confiável em mutações autenticadas", () => {
  const cookie = "city_hall_session=token";
  assert.equal(execute({ cookie }).response.statusCode, 403);
  assert.equal(
    execute({ cookie, origin: "https://site-malicioso.example" }).response.statusCode,
    403,
  );
  assert.equal(
    execute({ cookie, origin: "https://portal.exemplo.gov.br" }).nextCalled,
    true,
  );
  assert.equal(
    execute({ cookie, referer: "https://portal.exemplo.gov.br/tela" }).nextCalled,
    true,
  );
});
