require("dotenv").config();

const { verifyEmailTransport } = require("../src/services/emailService");

verifyEmailTransport({ required: true })
  .then(() => console.log("Configuração SMTP validada com sucesso; nenhum e-mail foi enviado."))
  .catch((error) => {
    console.error("Falha na configuração SMTP:", error.message);
    process.exitCode = 1;
  });
