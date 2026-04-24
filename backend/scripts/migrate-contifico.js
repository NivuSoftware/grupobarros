const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "grupobarros",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  const migrationPath = path.join(__dirname, "..", "db", "migrations", "004_contifico.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pool.query(sql);
  console.log("Migración 004_contifico aplicada: columnas contifico + dirección");
}

main()
  .catch((e) => { console.error("Error en migración contifico:", e); process.exitCode = 1; })
  .finally(() => pool.end());
