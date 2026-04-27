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
  const migrationPath = path.join(__dirname, "..", "db", "migrations", "007_ciudad_comprador.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pool.query(sql);
  console.log("Migración 007_ciudad_comprador aplicada: columna ciudad en compradores");
}

main()
  .catch((e) => { console.error("Error en migración ciudad:", e); process.exitCode = 1; })
  .finally(() => pool.end());
