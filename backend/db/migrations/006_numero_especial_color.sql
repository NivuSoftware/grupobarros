-- 006_numero_especial_color.sql
-- Permite configurar el color visual del "Número Naranja" desde admin.

ALTER TABLE numeros_especiales
  ADD COLUMN IF NOT EXISTS color VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_ne_color'
  ) THEN
    ALTER TABLE numeros_especiales
      ADD CONSTRAINT ck_ne_color
      CHECK (color IS NULL OR color IN ('ORANGE', 'BLACK', 'GREEN', 'BLUE', 'RED'));
  END IF;
END $$;

UPDATE numeros_especiales
SET color = 'ORANGE'
WHERE tipo = 'NARANJA'
  AND (color IS NULL OR color = '');
