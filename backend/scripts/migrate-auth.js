const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "grupobarros",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
});

async function main() {
  const migrationPath = path.join(__dirname, "..", "db", "migrations", "001_auth.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  await pool.query(sql);
  console.log("Migracion auth aplicada: usuarios + auth_refresh_tokens");
}

main()
  .catch((error) => {
    console.error("No se pudo aplicar la migracion auth:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
