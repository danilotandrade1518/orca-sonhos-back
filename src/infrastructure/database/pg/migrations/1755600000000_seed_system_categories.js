/**
 * Seed system categories (Adjustment & Transfer) using env-provided UUIDs.
 * Idempotent: inserts only if not exists for a given id.
 * Relies on presence of at least one budget to attach categories. For MVP we attach to the first (smallest created) budget.
 * In production you might want a dedicated system budget or per-budget creation logic.
 */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = async (pgm) => {
  const adjustmentId =
    process.env.CATEGORY_ID_ADJUSTMENT ||
    '00000000-0000-0000-0000-000000000001';
  const transferId =
    process.env.CATEGORY_ID_TRANSFER || '00000000-0000-0000-0000-000000000002';

  // Basic UUID format guard (best-effort, keeps migration resilient)
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!uuidRegex.test(adjustmentId) || !uuidRegex.test(transferId)) {
    throw new Error(
      'Invalid CATEGORY_ID_ADJUSTMENT or CATEGORY_ID_TRANSFER UUID format',
    );
  }

  pgm.sql(`
    DO $$
    DECLARE
      v_adjustment_id UUID := '${adjustmentId}';
      v_transfer_id   UUID := '${transferId}';
      v_budget_id     UUID;
    BEGIN
      SELECT id INTO v_budget_id FROM budgets WHERE is_deleted = false ORDER BY created_at ASC LIMIT 1;
      IF v_budget_id IS NULL THEN
        RAISE NOTICE 'Skipping system categories seed: no budgets present.';
        RETURN;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM categories WHERE id = v_adjustment_id) THEN
        INSERT INTO categories (id, name, type, budget_id)
        VALUES (v_adjustment_id, 'Adjustment', 'INCOME', v_budget_id);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM categories WHERE id = v_transfer_id) THEN
        INSERT INTO categories (id, name, type, budget_id)
        VALUES (v_transfer_id, 'Transfer', 'TRANSFER', v_budget_id);
      END IF;
    END $$;`);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = async (pgm) => {
  const adjustmentId =
    process.env.CATEGORY_ID_ADJUSTMENT ||
    '00000000-0000-0000-0000-000000000001';
  const transferId =
    process.env.CATEGORY_ID_TRANSFER || '00000000-0000-0000-0000-000000000002';
  pgm.sql(
    `DELETE FROM categories WHERE id IN ('${adjustmentId}', '${transferId}');`,
  );
};
