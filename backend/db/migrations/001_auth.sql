CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo varchar(254) NOT NULL,
  correo_normalizado varchar(254) GENERATED ALWAYS AS (lower(correo)) STORED,
  password_hash text NOT NULL,
  nombre varchar(120),
  rol varchar(40) NOT NULL DEFAULT 'admin',
  activo boolean NOT NULL DEFAULT true,
  intentos_fallidos integer NOT NULL DEFAULT 0,
  bloqueado_hasta timestamptz,
  ultimo_login_en timestamptz,
  password_actualizado_en timestamptz NOT NULL DEFAULT now(),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_correo_formato CHECK (
    correo ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT usuarios_intentos_fallidos_no_negativo CHECK (intentos_fallidos >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_normalizado_uidx
  ON usuarios (correo_normalizado);

CREATE INDEX IF NOT EXISTS usuarios_activo_idx
  ON usuarios (activo);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL,
  familia_id uuid NOT NULL DEFAULT gen_random_uuid(),
  expira_en timestamptz NOT NULL,
  revocado_en timestamptz,
  reemplazado_por uuid REFERENCES auth_refresh_tokens(id) ON DELETE SET NULL,
  user_agent text,
  ip inet,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_refresh_tokens_token_hash_uidx
  ON auth_refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_usuario_idx
  ON auth_refresh_tokens (usuario_id);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_activos_idx
  ON auth_refresh_tokens (usuario_id, expira_en)
  WHERE revocado_en IS NULL;

CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS trigger AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_set_actualizado_en ON usuarios;

CREATE TRIGGER usuarios_set_actualizado_en
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_actualizado_en();
