require("dotenv").config();
const { validateRuntimeConfiguration } = require("./config/runtimeConfig");
const app = require("./app");

const port = process.env.PORT || 3001;
validateRuntimeConfiguration();

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
