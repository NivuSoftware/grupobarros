-- =============================================================
-- 002_rifas.sql
-- Sistema de venta de boletos para rifas
-- =============================================================

-- ─────────────────────────────────────────
-- ENUMS (tipos personalizados PostgreSQL)
-- ─────────────────────────────────────────

CREATE TYPE estado_sorteo AS ENUM ('DRAFT', 'ACTIVO', 'CERRADO');
CREATE TYPE tipo_numero_especial AS ENUM ('ORO', 'NARANJA');

-- ─────────────────────────────────────────
-- SORTEOS
-- ─────────────────────────────────────────

CREATE TABLE sorteos (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                      VARCHAR(100)  NOT NULL,
  descripcion                 TEXT,
  estado                      estado_sorteo NOT NULL DEFAULT 'DRAFT',
  numero_maximo_boletos       INTEGER       NOT NULL CHECK (numero_maximo_boletos >= 9),

  -- Premio mayor (embebido en sorteo para simplicidad)
  premio_mayor_nombre         VARCHAR(100)  NOT NULL,
  premio_mayor_descripcion    TEXT,
  premio_mayor_imagenes       TEXT[]        NOT NULL DEFAULT '{}',  -- hasta 5 URLs

  -- Ganador del premio mayor (boleto ganador, asignado manualmente)
  premio_mayor_boleto_id      UUID          UNIQUE,  -- FK diferida (boletos aún no existe)

  creado_en                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  cerrado_en                  TIMESTAMPTZ
);

-- Solo puede haber 1 sorteo ACTIVO a la vez
CREATE UNIQUE INDEX idx_sorteos_un_activo
  ON sorteos (estado)
  WHERE estado = 'ACTIVO';

CREATE INDEX idx_sorteos_estado ON sorteos (estado);

-- ─────────────────────────────────────────
-- COMPRADORES
-- ─────────────────────────────────────────

CREATE TABLE compradores (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula      VARCHAR(20)  NOT NULL UNIQUE,
  nombre      VARCHAR(120) NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  email       VARCHAR(254) NOT NULL,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compradores_cedula ON compradores (cedula);
CREATE INDEX idx_compradores_email  ON compradores (lower(email));

-- ─────────────────────────────────────────
-- COMPRAS
-- ─────────────────────────────────────────

CREATE TABLE compras (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id       UUID        NOT NULL REFERENCES sorteos(id),
  comprador_id    UUID        NOT NULL REFERENCES compradores(id),
  total_boletos   INTEGER     NOT NULL CHECK (total_boletos >= 1),
  monto           NUMERIC(10,2),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_sorteo_id    ON compras (sorteo_id);
CREATE INDEX idx_compras_comprador_id ON compras (comprador_id);

-- ─────────────────────────────────────────
-- BOLETOS
-- ─────────────────────────────────────────

CREATE TABLE boletos (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id             UUID        NOT NULL REFERENCES sorteos(id),
  compra_id             UUID        NOT NULL REFERENCES compras(id),
  numero                INTEGER     NOT NULL CHECK (numero >= 0),
  tiene_numero_especial BOOLEAN     NOT NULL DEFAULT FALSE,
  numero_especial_id    UUID,       -- FK a numeros_especiales (diferida abajo)
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CONSTRAINT CRÍTICO: número único por sorteo
  CONSTRAINT uq_boleto_sorteo_numero UNIQUE (sorteo_id, numero)
);

CREATE INDEX idx_boletos_sorteo_id ON boletos (sorteo_id);
CREATE INDEX idx_boletos_compra_id ON boletos (compra_id);
CREATE INDEX idx_boletos_numero    ON boletos (sorteo_id, numero);

-- ─────────────────────────────────────────
-- NUMEROS ESPECIALES
-- ─────────────────────────────────────────

CREATE TABLE numeros_especiales (
  id                    UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id             UUID                 NOT NULL REFERENCES sorteos(id),
  numero                INTEGER              NOT NULL,  -- negativos = placeholder, >= 0 = número real
  tipo                  tipo_numero_especial NOT NULL,
  nombre_premio         VARCHAR(100),
  descripcion           TEXT,
  imagen                TEXT,
  es_ganador            BOOLEAN              NOT NULL DEFAULT FALSE,
  boleto_ganador_id     UUID                 UNIQUE,  -- FK a boletos (diferida abajo)
  admin_marcador_id     UUID                 REFERENCES usuarios(id),
  fecha_marcado_ganador TIMESTAMPTZ,
  creado_en             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  -- Un número no puede repetirse en el mismo sorteo
  CONSTRAINT uq_numero_especial_sorteo UNIQUE (sorteo_id, numero)
);

CREATE INDEX idx_ne_sorteo_id ON numeros_especiales (sorteo_id);
CREATE INDEX idx_ne_tipo      ON numeros_especiales (sorteo_id, tipo);

-- ─────────────────────────────────────────
-- FOREIGN KEYS DIFERIDAS (ciclos / orden)
-- ─────────────────────────────────────────

ALTER TABLE sorteos
  ADD CONSTRAINT fk_sorteos_premio_mayor_boleto
  FOREIGN KEY (premio_mayor_boleto_id)
  REFERENCES boletos(id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE boletos
  ADD CONSTRAINT fk_boletos_numero_especial
  FOREIGN KEY (numero_especial_id)
  REFERENCES numeros_especiales(id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE numeros_especiales
  ADD CONSTRAINT fk_ne_boleto_ganador
  FOREIGN KEY (boleto_ganador_id)
  REFERENCES boletos(id)
  DEFERRABLE INITIALLY DEFERRED;

-- ─────────────────────────────────────────
-- TRIGGERS: actualizado_en automático
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sorteos_actualizado_en
  BEFORE UPDATE ON sorteos
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TRIGGER trg_compradores_actualizado_en
  BEFORE UPDATE ON compradores
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TRIGGER trg_ne_actualizado_en
  BEFORE UPDATE ON numeros_especiales
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- ─────────────────────────────────────────
-- VALIDACIÓN: imagenes del premio mayor (máx 5)
-- ─────────────────────────────────────────

ALTER TABLE sorteos
  ADD CONSTRAINT chk_premio_imagenes_max5
  CHECK (array_length(premio_mayor_imagenes, 1) IS NULL
      OR array_length(premio_mayor_imagenes, 1) <= 5);
