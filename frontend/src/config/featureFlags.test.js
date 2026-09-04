import { describe, expect, it } from "vitest";
import { AI_ASSISTANT_ENABLED, isFeatureEnabled } from "./featureFlags";

describe("feature flags", () => {
  it("mantém o assistente desativado quando a variável não está habilitada", () => {
    expect(AI_ASSISTANT_ENABLED).toBe(false);
    expect(isFeatureEnabled(undefined)).toBe(false);
    expect(isFeatureEnabled("false")).toBe(false);
  });

  it("aceita somente true explícito", () => {
    expect(isFeatureEnabled("true")).toBe(true);
    expect(isFeatureEnabled(" TRUE ")).toBe(true);
    expect(isFeatureEnabled("1")).toBe(false);
  });
});
