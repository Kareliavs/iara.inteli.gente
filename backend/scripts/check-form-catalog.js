require("dotenv").config();

const { pool } = require("../src/config/db");
const {
  multipleChoiceQuestions,
  singleChoiceQuestions,
} = require("../src/config/formularioQuestions");

(async () => {
  const expectedSignatures = [
    ...Object.values(multipleChoiceQuestions).flat(),
    ...Object.values(singleChoiceQuestions).map((question) => question.variavelSigla),
  ];
  const result = await pool.query(
    `SELECT variavel_sigla
     FROM bd.variavel
     WHERE variavel_sigla = ANY($1::varchar[])`,
    [expectedSignatures],
  );
  const existing = new Set(result.rows.map((row) => row.variavel_sigla));
  const missing = expectedSignatures.filter((signature) => !existing.has(signature));

  if (missing.length > 0) {
    console.error(`Variáveis ausentes em bd.variavel: ${missing.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`${expectedSignatures.length} variáveis do formulário validadas no catálogo.`);
  }

  const schemaResult = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'stg'
       AND table_name = 'municipio_apresenta_variavel'
       AND column_name = ANY($1::varchar[])`,
    [["submissao_id", "variavel_valor_textual"]],
  );
  const submissionTableResult = await pool.query(
    `SELECT to_regclass('stg.formulario_submissao') AS table_name`,
  );

  if (
    schemaResult.rows.length !== 2 ||
    submissionTableResult.rows[0]?.table_name !== "stg.formulario_submissao"
  ) {
    console.error("A migração do formulário ainda não foi aplicada integralmente.");
    process.exitCode = 1;
  } else {
    console.log("Schema de submissão e aprovação validado.");
  }

  await pool.end();
})().catch(async (error) => {
  console.error(error.message);
  await pool.end();
  process.exit(1);
});
