const { getEmailOutboxStatus } = require("../repositories/emailOutboxRepository");

async function emailOutboxStatus(req, res) {
  try {
    res.set("Cache-Control", "no-store");
    const status = await getEmailOutboxStatus();
    return res.json(status);
  } catch (error) {
    console.error("Erro ao consultar a saúde da fila de e-mails:", error.message);
    return res.status(500).json({ error: "Erro ao consultar a fila de e-mails" });
  }
}

module.exports = { emailOutboxStatus };
