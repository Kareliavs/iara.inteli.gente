const { hashPassword } = require("../src/services/authService");

const password = process.env.USER_PASSWORD;

if (!password) {
  console.error(
    "Defina USER_PASSWORD somente para este comando. Exemplo no PowerShell: " +
      "$env:USER_PASSWORD='sua-senha'; npm run auth:hash-password",
  );
  process.exit(1);
}

(async () => {
  console.log(await hashPassword(password));
})().catch((error) => {
  console.error("Não foi possível gerar o hash:", error.message);
  process.exit(1);
});
