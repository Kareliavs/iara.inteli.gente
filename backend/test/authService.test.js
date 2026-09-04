const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const {
  createEmailConfirmationToken,
  hashEmailConfirmationToken,
  hashPassword,
  needsPasswordRehash,
  signAuthToken,
  validateInstitutionalEmail,
  validateNewPassword,
  validateRegistrationInput,
  verifyAuthToken,
  verifyPassword,
} = require("../src/services/authService");

test("gera e valida hash scrypt parametrizado", async () => {
  const hash = await hashPassword("senha-segura-123");
  assert.match(hash, /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(await verifyPassword("senha-segura-123", hash), true);
  assert.equal(await verifyPassword("senha-incorreta", hash), false);
  assert.equal(needsPasswordRehash(hash), false);
});

test("aceita hash legado e indica atualização necessária", async () => {
  const password = "senha-legada-123";
  const salt = crypto.randomBytes(16);
  const legacyHash = crypto.scryptSync(password, salt, 64);
  const storedHash = `scrypt$${salt.toString("hex")}$${legacyHash.toString("hex")}`;

  assert.equal(await verifyPassword(password, storedHash), true);
  assert.equal(needsPasswordRehash(storedHash), true);
});

test("rejeita hash de senha malformado", async () => {
  assert.equal(await verifyPassword("senha-segura-123", "scrypt$invalido"), false);
  assert.equal(needsPasswordRehash("scrypt$invalido"), true);
});

test("gera token de confirmação aleatório e armazena somente seu hash", () => {
  const firstToken = createEmailConfirmationToken();
  const secondToken = createEmailConfirmationToken();

  assert.match(firstToken, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(firstToken, secondToken);
  assert.match(hashEmailConfirmationToken(firstToken), /^[a-f0-9]{64}$/);
  assert.equal(
    hashEmailConfirmationToken(firstToken),
    hashEmailConfirmationToken(firstToken),
  );
});

test("normaliza e valida dados de cadastro", () => {
  assert.deepEqual(
    validateRegistrationInput({
      nome: "  Maria   da Silva  ",
      login: "MARIA@SAOPAULO.SP.GOV.BR",
      senha: "senha-segura-123",
    }),
    {
      estadoSigla: "SP",
      municipioDominio: "saopaulo",
      senha: "senha-segura-123",
      usuarioLogin: "maria@saopaulo.sp.gov.br",
      usuarioNome: "Maria da Silva",
    },
  );
});

test("rejeita cadastro com e-mail institucional ou senha inválidos", () => {
  const base = {
    nome: "Maria da Silva",
    login: "maria@saopaulo.sp.gov.br",
    senha: "senha-segura-123",
  };

  assert.throws(() => validateRegistrationInput({ ...base, login: "email-invalido" }));
  assert.throws(() => validateRegistrationInput({ ...base, login: "maria@gmail.com" }));
  assert.throws(() => validateRegistrationInput({ ...base, login: "maria@saopaulo.zz.gov.br" }));
  assert.throws(() => validateRegistrationInput({ ...base, senha: "curta" }));
});

test("assina e valida token de autenticação", () => {
  process.env.AUTH_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
  const token = signAuthToken(42);
  assert.equal(verifyAuthToken(token).sub, "42");
  assert.equal(verifyAuthToken(`${token}adulterado`), null);
});

test("cada sessão recebe um identificador único", () => {
  process.env.AUTH_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
  const firstToken = signAuthToken(42);
  const secondToken = signAuthToken(42);
  assert.notEqual(firstToken, secondToken);
  assert.notEqual(verifyAuthToken(firstToken).jti, verifyAuthToken(secondToken).jti);
});

test("valida e normaliza e-mail institucional isoladamente", () => {
  assert.deepEqual(validateInstitutionalEmail("Gestor@SAOCARLOS.SP.GOV.BR"), {
    estadoSigla: "SP",
    municipioDominio: "saocarlos",
    usuarioLogin: "gestor@saocarlos.sp.gov.br",
  });
  assert.throws(() => validateInstitutionalEmail("gestor@gmail.com"));
});

test("valida os limites da nova senha", () => {
  assert.equal(validateNewPassword("12345678"), "12345678");
  assert.throws(() => validateNewPassword("1234567"));
  assert.throws(() => validateNewPassword("x".repeat(129)));
});
