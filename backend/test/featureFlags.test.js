const test = require("node:test");
const assert = require("node:assert/strict");

const { isFeatureEnabled } = require("../src/config/featureFlags");

test("mantém recursos opcionais desativados por padrão", () => {
  assert.equal(isFeatureEnabled(undefined), false);
  assert.equal(isFeatureEnabled(""), false);
  assert.equal(isFeatureEnabled("false"), false);
  assert.equal(isFeatureEnabled("1"), false);
});

test("habilita o recurso somente com true explícito", () => {
  assert.equal(isFeatureEnabled("true"), true);
  assert.equal(isFeatureEnabled(" TRUE "), true);
});
