require("dotenv").config();

const { pool } = require("../src/config/db");
const { hashPassword } = require("../src/services/authService");

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
const name = String(process.env.ADMIN_NAME || "Administrador").trim();

async function createAdmin() {
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Defina ADMIN_EMAIL com um endereço de e-mail válido");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD deve possuir pelo menos 12 caracteres");
  }
  if (!name) {
    throw new Error("ADMIN_NAME não pode ser vazio");
  }

  const existing = await pool.query(
    "SELECT 1 FROM bd.usuario WHERE LOWER(usuario_login) = LOWER($1) LIMIT 1",
    [email],
  );
  if (existing.rows.length > 0) {
    throw new Error("Já existe um usuário com esse e-mail");
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO bd.usuario
       (usuario_nome, usuario_login, usuario_senha, usuario_funcao, municipio_cod_ibge)
     VALUES ($1, $2, $3, 'admin', NULL)
     RETURNING usuario_id, usuario_nome, usuario_login, usuario_funcao`,
    [name, email, passwordHash],
  );
  console.log("Conta administrativa criada:", result.rows[0]);
}

createAdmin()
  .catch((error) => {
    console.error("Não foi possível criar a conta administrativa:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
