-- Migration: Add payment_method to users, enrich plans table
-- Run this on your production database (Render PostgreSQL)

-- 1. Add payment_method column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'qr', 'transferencia'));

-- 2. Add descriptive columns to plans if not exists
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS classes_per_week INT DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS sessions_per_month INT DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS modality_type VARCHAR(50) DEFAULT 'funcional';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Clear old generic plans and insert the 4 official plans
DELETE FROM plans;

INSERT INTO plans (name, description, classes_per_week, sessions_per_month, modality_type, default_classes, price, is_active)
VALUES
  (
    'Entrenamiento Funcional - Plan Básico',
    'Entrenamiento semipersonalizado con máximo 5 personas. Cada atleta entrena a su ritmo en un ambiente de grupo pequeño y enfocado.',
    3,
    12,
    'funcional',
    12,
    170000,
    true
  ),
  (
    'Entrenamiento Funcional - Plan Avanzado',
    'Entrenamiento semipersonalizado con máximo 5 personas. Cada atleta entrena a su ritmo en un ambiente de grupo pequeño y enfocado.',
    5,
    20,
    'funcional',
    20,
    230000,
    true
  ),
  (
    'Plan Élite Básico (Deportistas)',
    'Entrenamiento 100% personalizado, enfocado a la necesidad específica de cada deportista.',
    1,
    4,
    'personalizado',
    4,
    160000,
    true
  ),
  (
    'Plan Élite Avanzado',
    'Entrenamiento 100% personalizado, enfocado a la necesidad específica del deportista. Máxima dedicación y seguimiento.',
    2,
    8,
    'personalizado',
    8,
    280000,
    true
  );
