require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

(async () => {
  const migrationsDirectory = path.resolve(__dirname, "../migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsDirectory, migrationFile);
    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    const concurrentIndexMarker = "CREATE INDEX CONCURRENTLY";
    const concurrentIndexPosition = migrationSql.indexOf(concurrentIndexMarker);

    if (concurrentIndexPosition === -1) {
      await pool.query(migrationSql);
    } else {
      await pool.query(migrationSql.slice(0, concurrentIndexPosition));
      await pool.query(migrationSql.slice(concurrentIndexPosition));
    }
  }
  console.log("Migrações do formulário aplicadas com sucesso.");
  await pool.end();
})().catch(async (error) => {
  console.error("Falha ao aplicar migração:", error.message);
  await pool.end();
  process.exit(1);
});
