require("dotenv").config();
const { validateRuntimeConfiguration } = require("./config/runtimeConfig");
const app = require("./app");
const { verifyEmailTransport } = require("./services/emailService");
const { startEmailOutboxWorker } = require("./services/emailOutboxWorker");

const port = process.env.PORT || 3001;

async function startServer() {
  validateRuntimeConfiguration();
  const emailStatus = await verifyEmailTransport({
    required: process.env.NODE_ENV === "production",
  });
  if (emailStatus.verified) console.log("Transporte SMTP verificado com sucesso.");

  const emailWorker = startEmailOutboxWorker();
  const server = app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
  });

  const shutdown = () => {
    emailWorker.stop();
    server.close(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Falha ao iniciar a API:", error.message);
  process.exit(1);
});
