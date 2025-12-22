/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Criar o tipo ENUM se não existir
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE budget_type_enum AS ENUM ('PERSONAL', 'SHARED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Adicionar coluna type à tabela budgets
  pgm.addColumn('budgets', {
    type: {
      type: 'budget_type_enum',
      notNull: false, // Permitir NULL temporariamente para dados existentes
    },
  });

  // Atualizar valores existentes: se não tem participantes, é PERSONAL, senão SHARED
  pgm.sql(`
    UPDATE budgets
    SET type = CASE
      WHEN array_length(participant_ids, 1) IS NULL OR array_length(participant_ids, 1) = 0
      THEN 'PERSONAL'::budget_type_enum
      ELSE 'SHARED'::budget_type_enum
    END
    WHERE type IS NULL;
  `);

  // Tornar a coluna NOT NULL após popular valores
  pgm.alterColumn('budgets', 'type', {
    notNull: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumn('budgets', 'type');
  // Não removemos o tipo ENUM pois pode ser usado por outras migrations
};
