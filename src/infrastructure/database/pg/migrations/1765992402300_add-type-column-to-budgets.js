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

  // Verificar se a coluna type já existe antes de adicionar
  pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budgets' 
        AND column_name = 'type'
      ) THEN
        ALTER TABLE budgets ADD COLUMN type budget_type_enum;
      END IF;
    END $$;
  `);

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

  // Tornar a coluna NOT NULL após popular valores (se a coluna existir)
  pgm.sql(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budgets' 
        AND column_name = 'type'
        AND is_nullable = 'YES'
      ) THEN
        ALTER TABLE budgets ALTER COLUMN type SET NOT NULL;
      END IF;
    END $$;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumn('budgets', 'type');
  // Não removemos o tipo ENUM pois pode ser usado por outras migrations
};
