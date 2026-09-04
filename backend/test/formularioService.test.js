const test = require("node:test");
const assert = require("node:assert/strict");
const {
  multipleChoiceQuestions,
  questionIds,
  singleChoiceQuestions,
} = require("../src/config/formularioQuestions");
const {
  buildAnswersFromStagedVariableRows,
  buildVariableRows,
  validateStagedVariableRows,
} = require("../src/services/formularioService");

function completeAnswers() {
  return questionIds.map((questionId) => ({
    pergunta_id: questionId,
    opcoes_selecionadas: [0],
  }));
}

test("converte múltipla escolha em variáveis binárias e escolha única em texto", () => {
  const rows = buildVariableRows(completeAnswers());
  const expectedRows =
    Object.values(multipleChoiceQuestions).reduce((total, values) => total + values.length, 0) +
    Object.keys(singleChoiceQuestions).length;

  assert.equal(rows.length, expectedRows);

  const multipleRows = rows.filter((row) => row.questionId === 1);
  assert.equal(multipleRows[0].variavelValor, 1);
  assert.ok(multipleRows.slice(1).every((row) => row.variavelValor === 0));
  assert.ok(multipleRows.every((row) => row.variavelValorTextual === null));

  const singleRow = rows.find((row) => row.questionId === 7);
  assert.equal(singleRow.variavelSigla, "F7");
  assert.equal(singleRow.variavelValor, null);
  assert.equal(singleRow.variavelValorTextual, singleChoiceQuestions[7].options[0]);
});

test("rejeita formulário incompleto", () => {
  assert.throws(() => buildVariableRows(completeAnswers().slice(1)), {
    message: "Todas as perguntas devem ser respondidas",
  });
});

test("rejeita mais de uma alternativa em pergunta de escolha única", () => {
  const answers = completeAnswers();
  answers.find((answer) => answer.pergunta_id === 7).opcoes_selecionadas = [0, 1];

  assert.throws(() => buildVariableRows(answers), {
    message: "A pergunta 7 aceita somente uma opção",
  });
});

test("revalida as linhas da staging antes da promoção", () => {
  const stagedRows = buildVariableRows(completeAnswers()).map((row) => ({
    variavel_sigla: row.variavelSigla,
    variavel_valor: row.variavelValor,
    variavel_valor_textual: row.variavelValorTextual,
  }));

  assert.doesNotThrow(() => validateStagedVariableRows(stagedRows));

  stagedRows.find((row) => row.variavel_sigla === "F1_1EAD").variavel_valor = 3;
  assert.throws(() => validateStagedVariableRows(stagedRows), {
    message: "Valor binário inválido para F1_1EAD",
  });
});

test("reconstrói as respostas para edição a partir da staging", () => {
  const originalAnswers = completeAnswers();
  originalAnswers.find((answer) => answer.pergunta_id === 1).opcoes_selecionadas = [1, 3];
  originalAnswers.find((answer) => answer.pergunta_id === 23).opcoes_selecionadas = [2];
  const stagedRows = buildVariableRows(originalAnswers).map((row) => ({
    variavel_sigla: row.variavelSigla,
    variavel_valor: row.variavelValor,
    variavel_valor_textual: row.variavelValorTextual,
  }));

  assert.deepEqual(buildAnswersFromStagedVariableRows(stagedRows), originalAnswers);
});
