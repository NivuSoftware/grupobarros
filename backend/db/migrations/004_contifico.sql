-- Columnas para rastrear la factura emitida en Contifico
ALTER TABLE compras
  ADD COLUMN IF NOT EXISTS contifico_documento_id  TEXT,
  ADD COLUMN IF NOT EXISTS contifico_autorizacion   TEXT,
  ADD COLUMN IF NOT EXISTS contifico_numero_doc     TEXT;

-- Campo dirección en compradores (requerido por Contifico)
ALTER TABLE compradores
  ADD COLUMN IF NOT EXISTS direccion TEXT;
