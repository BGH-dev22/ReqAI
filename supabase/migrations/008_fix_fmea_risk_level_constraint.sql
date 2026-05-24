-- Migration pour corriger la contrainte risk_level sur fmea_items
-- La contrainte était trop restrictive et rejetait certaines valeurs

BEGIN;

-- Supprimer l'ancienne contrainte
ALTER TABLE fmea_items DROP CONSTRAINT IF EXISTS fmea_items_risk_level_check;

-- Ajouter une contrainte plus permissive (accepte plus de variantes)
ALTER TABLE fmea_items ADD CONSTRAINT fmea_items_risk_level_check 
  CHECK (risk_level IN (
    'critique', 'critical', 
    'majeur', 'major', 
    'modéré', 'modere', 'moderate', 'moyen',
    'mineur', 'minor',
    'acceptable', 'low', 'faible'
  ));

COMMIT;
