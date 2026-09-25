import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { parseSync } from "@swc/core";
import uiSupplementalTranslations from "../src/lib/i18nUiSupplemental.js";

const root = process.cwd();
const languages = {
  en: "English",
  fr: "French",
  es: "Spanish",
};

const i18nSource = fs.readFileSync(path.join(root, "src/lib/i18n.jsx"), "utf8");
let executableI18n = i18nSource
  .slice(
    i18nSource.indexOf("const indicatorNameTranslations"),
    i18nSource.indexOf("const I18nContext"),
  )
  .replace(/export const /g, "const ");
executableI18n += "\nglobalThis.__audit = { translations, translateString };";

const supplementalPath = path.join(root, "src/lib/i18nSupplemental.json");
const uiSupplementalPath = path.join(root, "src/lib/i18nUiSupplemental.js");
const i18nContext = {
  supplementalTranslations: JSON.parse(fs.readFileSync(supplementalPath, "utf8")),
  uiSupplementalTranslations: (await import(pathToFileURL(uiSupplementalPath))).default,
  uiSupplementalTranslations,
};
vm.createContext(i18nContext);
vm.runInContext(executableI18n, i18nContext);
const currentTranslations = i18nContext.__audit.translations;
const translateString = i18nContext.__audit.translateString;

const sourceTexts = new Set(
  Object.values(currentTranslations).flatMap((dictionary) => Object.keys(dictionary)),
);
const catalogTexts = new Set(sourceTexts);
sourceTexts.add("Plataforma de análise do nível de maturidade dos municípios brasileiros.");
const formTexts = new Set();

const formSource = fs.readFileSync(path.join(root, "src/pages/CityHallPostLogin.jsx"), "utf8");
let executableForm = formSource.slice(
  formSource.indexOf("const questionSourceSections"),
  formSource.indexOf("const questionsById"),
);
executableForm += "\nglobalThis.__form = questionSourceSections;";
const formContext = {};
vm.createContext(formContext);
vm.runInContext(executableForm, formContext);
for (const section of formContext.__form) {
  formTexts.add(section.title);
  formTexts.add(section.description);
  sourceTexts.add(section.title);
  sourceTexts.add(section.description);
  for (const question of section.questions) {
    formTexts.add(question.text);
    sourceTexts.add(question.text);
    question.options.forEach((option) => {
      formTexts.add(option);
      sourceTexts.add(option);
    });
  }
}

if (process.argv.includes("--forms-missing")) {
  for (const languageCode of Object.keys(languages)) {
    const missing = [...formTexts].filter(
      (source) => !Object.prototype.hasOwnProperty.call(currentTranslations[languageCode], source),
    );
    process.stdout.write(`${languageCode} ${JSON.stringify(missing)}\n`);
  }
  process.exit();
}

const visibleAttributes = new Set([
  "alt",
  "aria-label",
  "description",
  "label",
  "labelHint",
  "placeholder",
  "title",
]);
const frontendTexts = new Set();
const backendTexts = new Set();
let currentFrontendFile = "";
const frontendTextsByFile = new Map();
const addFrontendText = (value) => {
  frontendTexts.add(value);
  if (!frontendTextsByFile.has(currentFrontendFile)) {
    frontendTextsByFile.set(currentFrontendFile, new Set());
  }
  frontendTextsByFile.get(currentFrontendFile).add(value);
};
const uiWord = /^(Abrir|Acesse|Acesso|Administrador|Administração|Aguardando|Ano|Apoio|Aprovar|Aprovadas|As |Atualizar|Avançar|Cancelar|Carregando|Close|Como |Confira|Confirmar|Concluir|Consultando|Conta|Criar|Crie|Defina|Digite|Diminuir|Editar|Encontre|Entrar|Enviar|Envio|Erro|Esqueci|Etapas|Exibindo|Fila|Formulário|Geometria|Gerencie|Indicadores|Informação|Manter|Menu|Motivo|Município|Nenhum|Nome|Nova|O |Pergunta|Pontuação|Preparação|Preencha|Progresso|Realização|Recuperar|Redefinir|Reenviar|Rejeitar|Rejeitadas|Respondentes|Respostas|Responsável|Resumo|Revisar|Revisão|Revise|Sair|Se |Selecione|Senha|Sessão|Status|Submissões|Sua |Tecnologia|Tentar|Todos|Uma |Use |Usuário|Validação|Validado|Variáveis|Ver |Voltar|Você|de$|perguntas|respondida)/;
const ignoredLiteral = /^(?:https?:|[/#.]|[\w-]+(?:\.[\w-]+)+$)/;

const shouldIncludeLiteral = (value) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return (
    normalized.length > 1 &&
    !ignoredLiteral.test(normalized) &&
    (/[À-ÿ]/.test(normalized) || uiWord.test(normalized))
  );
};

const walk = (node) => {
  if (!node || typeof node !== "object") return;

  if (node.type === "JSXText" && shouldIncludeLiteral(node.value)) {
    const value = node.value.replace(/\s+/g, " ").trim();
    sourceTexts.add(value);
    addFrontendText(value);
  }
  if (
    node.type === "JSXAttribute" &&
    visibleAttributes.has(node.name?.value) &&
    node.value?.type === "StringLiteral" &&
    shouldIncludeLiteral(node.value.value)
  ) {
    sourceTexts.add(node.value.value.trim());
    addFrontendText(node.value.value.trim());
  }
  if (node.type === "StringLiteral" && shouldIncludeLiteral(node.value)) {
    sourceTexts.add(node.value.trim());
    addFrontendText(node.value.trim());
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "span" || key === "ctxt") continue;
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") walk(value);
  }
};

const collectFiles = (directory, predicate) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(filePath, predicate));
    else if (predicate(filePath)) files.push(filePath);
  }
  return files;
};

const frontendFiles = collectFiles(path.join(root, "src"), (filePath) =>
  /\.(?:js|jsx|ts|tsx)$/.test(filePath) &&
  !filePath.includes(".test.") &&
  !filePath.endsWith(path.join("lib", "i18n.jsx")) &&
  !filePath.endsWith(path.join("lib", "i18nUiSupplemental.js")) &&
  !filePath.endsWith(path.join("city", "MunicipalAssistant.jsx")),
);
for (const filePath of frontendFiles) {
  currentFrontendFile = path.relative(root, filePath).replaceAll("\\", "/");
  walk(parseSync(fs.readFileSync(filePath, "utf8"), { syntax: "ecmascript", jsx: true }));
}

const backendFiles = collectFiles(path.join(root, "../backend/src"), (filePath) =>
  filePath.endsWith(".js") && !filePath.includes("test"),
);
for (const filePath of backendFiles) {
  const ast = parseSync(fs.readFileSync(filePath, "utf8"), { syntax: "ecmascript" });
  const visitApiMessages = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "KeyValueProperty") {
      const key = node.key?.value;
      if ((key === "error" || key === "message") && node.value?.type === "StringLiteral") {
        sourceTexts.add(node.value.value);
        backendTexts.add(node.value.value);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "span" || key === "ctxt") continue;
      if (Array.isArray(value)) value.forEach(visitApiMessages);
      else if (value && typeof value === "object") visitApiMessages(value);
    }
  };
  visitApiMessages(ast);
}

if (process.argv.includes("--app-missing")) {
  for (const languageCode of Object.keys(languages)) {
    process.stdout.write(`\n${languageCode}\n`);
    for (const [file, texts] of frontendTextsByFile) {
      const missing = [...texts].filter(
        (source) => !Object.prototype.hasOwnProperty.call(currentTranslations[languageCode], source),
      );
      if (missing.length) {
        process.stdout.write(`${file} (${missing.length})\n`);
        missing.forEach((source) => process.stdout.write(`  ${JSON.stringify(source)}\n`));
      }
    }
    const backendMissing = [...backendTexts].filter(
      (source) => !Object.prototype.hasOwnProperty.call(currentTranslations[languageCode], source),
    );
    if (backendMissing.length) {
      process.stdout.write(`backend (${backendMissing.length})\n`);
      backendMissing.forEach((source) => process.stdout.write(`  ${JSON.stringify(source)}\n`));
    }
  }
  process.exit();
}

if (process.argv.includes("--check")) {
  const activeTexts = new Set([
    ...formTexts,
    ...frontendTexts,
    ...backendTexts,
    "Plataforma de análise do nível de maturidade dos municípios brasileiros.",
  ]);
  let hasMissingTranslations = false;
  for (const languageCode of Object.keys(languages)) {
    const missing = [...activeTexts].filter(
      (source) =>
        !Object.prototype.hasOwnProperty.call(currentTranslations[languageCode], source),
    );
    process.stdout.write(`${languageCode}: ${activeTexts.size - missing.length}/${activeTexts.size} active texts covered\n`);
    if (missing.length) {
      hasMissingTranslations = true;
      if (process.argv.includes("--verbose")) {
        missing.forEach((source) => process.stdout.write(`  - ${source}\n`));
      }
    }
  }
  process.exitCode = hasMissingTranslations ? 1 : 0;
  process.exit();
}

if (process.argv.includes("--effective")) {
  const categories = {
    catalog: catalogTexts,
    form: formTexts,
    frontend: frontendTexts,
    backend: backendTexts,
  };
  for (const languageCode of Object.keys(languages)) {
    const summary = Object.entries(categories).map(([name, texts]) => {
      const unchanged = [...texts].filter(
        (source) => translateString(source, languageCode) === source,
      );
      return `${name}=${unchanged.length}/${texts.size}`;
    });
    process.stdout.write(`${languageCode}: ${summary.join(" ")}\n`);
  }
  process.exit();
}
