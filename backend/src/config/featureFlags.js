function isFeatureEnabled(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

module.exports = {
  isFeatureEnabled,
};
