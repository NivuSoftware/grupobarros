-- =============================================================
-- 003_pagos.sql
-- Soporte para métodos de pago y validación de transferencias
-- =============================================================

-- Enums de pago
CREATE TYPE metodo_pago AS ENUM ('TARJETA', 'TRANSFERENCIA');
CREATE TYPE estado_pago AS ENUM ('PENDIENTE', 'VALIDADO', 'RECHAZADO');

-- Agregar columnas a compras
ALTER TABLE compras
  ADD COLUMN metodo_pago    metodo_pago  NOT NULL DEFAULT 'TARJETA',
  ADD COLUMN estado_pago    estado_pago  NOT NULL DEFAULT 'VALIDADO',
  ADD COLUMN comprobante_url TEXT,
  ADD COLUMN validado_en    TIMESTAMPTZ,
  ADD COLUMN validado_por   UUID REFERENCES usuarios(id);

-- Índice para filtrar compras pendientes rápidamente
CREATE INDEX idx_compras_estado_pago ON compras (estado_pago)
  WHERE estado_pago = 'PENDIENTE';

-- Las compras por transferencia arrancan en PENDIENTE;
-- las de TC arrancan en VALIDADO (integración futura).
-- Los boletos de compras PENDIENTES no se asignan hasta validar.
