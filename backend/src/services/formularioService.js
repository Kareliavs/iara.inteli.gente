const {
  multipleChoiceQuestions,
  questionIds,
  singleChoiceQuestions,
} = require("../config/formularioQuestions");

function validationError(message, details) {
  const error = new Error(message);
  error.status = 400;
  if (details) error.details = details;
  return error;
}

function normalizeSelectedOptions(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number))];
}

function buildVariableRows(respostas) {
  if (!Array.isArray(respostas)) {
    throw validationError("As respostas do formulário são obrigatórias");
  }

  const answersByQuestion = new Map();
  for (const resposta of respostas) {
    const questionId = Number(resposta?.pergunta_id);
    if (!Number.isInteger(questionId) || answersByQuestion.has(questionId)) {
      throw validationError("O formulário contém perguntas inválidas ou duplicadas");
    }
    answersByQuestion.set(questionId, normalizeSelectedOptions(resposta.opcoes_selecionadas));
  }

  const missingQuestions = questionIds.filter((questionId) => !answersByQuestion.has(questionId));
  if (missingQuestions.length > 0) {
    throw validationError("Todas as perguntas devem ser respondidas", {
      perguntas_pendentes: missingQuestions,
    });
  }

  const rows = [];

  for (const questionId of questionIds) {
    const selectedOptions = answersByQuestion.get(questionId);
    if (selectedOptions.length === 0 || selectedOptions.some((index) => !Number.isInteger(index))) {
      throw validationError(`A pergunta ${questionId} deve possuir uma resposta válida`);
    }

    const singleChoice = singleChoiceQuestions[questionId];
    if (singleChoice) {
      if (
        selectedOptions.length !== 1 ||
        selectedOptions[0] < 0 ||
        selectedOptions[0] >= singleChoice.options.length
      ) {
        throw validationError(`A pergunta ${questionId} aceita somente uma opção`);
      }

      rows.push({
        questionId,
        variavelSigla: singleChoice.variavelSigla,
        variavelValor: null,
        variavelValorTextual: singleChoice.options[selectedOptions[0]],
      });
      continue;
    }

    const variableSignatures = multipleChoiceQuestions[questionId];
    if (
      selectedOptions.some(
        (optionIndex) => optionIndex < 0 || optionIndex >= variableSignatures.length,
      )
    ) {
      throw validationError(`A pergunta ${questionId} contém uma opção inexistente`);
    }

    const selectedSet = new Set(selectedOptions);
    variableSignatures.forEach((variavelSigla, optionIndex) => {
      rows.push({
        questionId,
        variavelSigla,
        variavelValor: selectedSet.has(optionIndex) ? 1 : 0,
        variavelValorTextual: null,
      });
    });
  }

  return rows;
}

function validateYear(value) {
  const year = Number(value);
  const maximumYear = new Date().getFullYear() + 1;

  if (!Number.isInteger(year) || year < 2000 || year > maximumYear) {
    throw validationError("Ano de referência inválido");
  }

  return year;
}

function validateStagedVariableRows(rows) {
  const expectedMultiple = new Set(Object.values(multipleChoiceQuestions).flat());
  const expectedSingle = new Map(
    Object.values(singleChoiceQuestions).map((question) => [
      question.variavelSigla,
      new Set(question.options),
    ]),
  );
  const expectedSignatures = new Set([...expectedMultiple, ...expectedSingle.keys()]);
  const seenSignatures = new Set();

  if (!Array.isArray(rows) || rows.length !== expectedSignatures.size) {
    const error = validationError("A submissão possui uma quantidade inválida de variáveis");
    error.status = 422;
    throw error;
  }

  for (const row of rows) {
    const signature = row.variavel_sigla;
    if (!expectedSignatures.has(signature) || seenSignatures.has(signature)) {
      const error = validationError("A submissão contém variáveis inválidas ou duplicadas");
      error.status = 422;
      throw error;
    }
    seenSignatures.add(signature);

    if (expectedSingle.has(signature)) {
      if (
        row.variavel_valor != null ||
        !expectedSingle.get(signature).has(row.variavel_valor_textual)
      ) {
        const error = validationError(`Valor textual inválido para ${signature}`);
        error.status = 422;
        throw error;
      }
    } else if (
      row.variavel_valor_textual != null ||
      !new Set([0, 1]).has(Number(row.variavel_valor))
    ) {
      const error = validationError(`Valor binário inválido para ${signature}`);
      error.status = 422;
      throw error;
    }
  }

  const missing = [...expectedSignatures].filter((signature) => !seenSignatures.has(signature));
  if (missing.length > 0) {
    const error = validationError("A submissão não contém todas as variáveis esperadas", {
      variaveis_ausentes: missing,
    });
    error.status = 422;
    throw error;
  }
}

function buildAnswersFromStagedVariableRows(rows) {
  validateStagedVariableRows(rows);
  const rowsBySignature = new Map(rows.map((row) => [row.variavel_sigla, row]));

  return questionIds.map((questionId) => {
    const singleChoice = singleChoiceQuestions[questionId];
    if (singleChoice) {
      const row = rowsBySignature.get(singleChoice.variavelSigla);
      return {
        pergunta_id: questionId,
        opcoes_selecionadas: [singleChoice.options.indexOf(row.variavel_valor_textual)],
      };
    }

    return {
      pergunta_id: questionId,
      opcoes_selecionadas: multipleChoiceQuestions[questionId]
        .map((signature, index) =>
          Number(rowsBySignature.get(signature).variavel_valor) === 1 ? index : null,
        )
        .filter((index) => index != null),
    };
  });
}

module.exports = {
  buildAnswersFromStagedVariableRows,
  buildVariableRows,
  validateStagedVariableRows,
  validateYear,
};
