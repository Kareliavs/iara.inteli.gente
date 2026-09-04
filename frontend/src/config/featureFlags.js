export const isFeatureEnabled = (value) =>
  String(value || "").trim().toLowerCase() === "true";

// Ausência da variável equivale a false para manter o assistente desativado.
export const AI_ASSISTANT_ENABLED = isFeatureEnabled(
  import.meta.env.VITE_AI_ASSISTANT_ENABLED
);
