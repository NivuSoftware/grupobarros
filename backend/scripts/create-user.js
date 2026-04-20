const { randomBytes, scrypt: scryptCallback } = require("crypto");
const { promisify } = require("util");
const { Pool } = require("pg");

const scrypt = promisify(scryptCallback);

const SCRYPT_COST = 32768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_OPTIONS = {
  cost: SCRYPT_COST,
  blockSize: SCRYPT_BLOCK_SIZE,
  parallelization: SCRYPT_PARALLELIZATION,
  maxmem: 64 * 1024 * 1024,
};

async function hashPassword(password) {
  const salt = randomBytes(24);
  const derivedKey = await scrypt(password, salt, 64, SCRYPT_OPTIONS);

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const name = process.argv[4] || process.env.ADMIN_NAME || "Administrador";

if (!email || !password) {
  console.error("Uso: node scripts/create-user.js correo@dominio.com 'contrasena-segura' [nombre]");
  process.exit(1);
}

if (password.length < 12) {
  console.error("La contrasena debe tener al menos 12 caracteres.");
  process.exit(1);
}

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
  const passwordHash = await hashPassword(password);

  const { rows } = await pool.query(
    `
      INSERT INTO usuarios (correo, password_hash, nombre, rol)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (correo_normalizado)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        nombre = EXCLUDED.nombre,
        activo = true,
        intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        password_actualizado_en = now()
      RETURNING id, correo, rol
    `,
    [email.trim().toLowerCase(), passwordHash, name],
  );

  console.log(`Usuario listo: ${rows[0].correo} (${rows[0].rol})`);
}

main()
  .catch((error) => {
    console.error("No se pudo crear el usuario:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
