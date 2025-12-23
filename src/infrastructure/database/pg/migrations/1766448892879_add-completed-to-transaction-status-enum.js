/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Add COMPLETED to transaction_status_enum if it doesn't exist
  // Note: PostgreSQL doesn't support IF NOT EXISTS for enum values directly,
  // so we use a DO block to check and add conditionally
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'COMPLETED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_status_enum')
      ) THEN
        ALTER TYPE transaction_status_enum ADD VALUE 'COMPLETED';
      END IF;
    END $$;
  `);

  // Also add OVERDUE and LATE if they don't exist
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'OVERDUE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_status_enum')
      ) THEN
        ALTER TYPE transaction_status_enum ADD VALUE 'OVERDUE';
      END IF;
    END $$;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'LATE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_status_enum')
      ) THEN
        ALTER TYPE transaction_status_enum ADD VALUE 'LATE';
      END IF;
    END $$;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = () => {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum type, which is complex
  // For now, we'll leave the enum values in place
  // If needed, a more complex migration would be required
};
