-- =============================================================
-- 005_compras_monto.sql
-- Rellenar y exigir el monto total pagado en compras
-- =============================================================

UPDATE compras
SET monto = total_boletos * 2
WHERE monto IS NULL;

ALTER TABLE compras
  ALTER COLUMN monto SET NOT NULL;

