const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'grupobarros',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

async function run() {
  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../db/migrations/003_pagos.sql'),
      'utf-8',
    )
    console.log('Ejecutando migración 003_pagos.sql...')
    await client.query(sql)
    console.log('✓ Migración completada exitosamente')
  } catch (err) {
    console.error('✗ Error en migración:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
