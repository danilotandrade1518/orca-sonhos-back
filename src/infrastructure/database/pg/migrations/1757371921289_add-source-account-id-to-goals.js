/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Remove the constraint that prevents over-reserving (accumulated_amount <= total_amount)
  // This constraint was added in the original goals table creation
  pgm.dropConstraint('goals', 'goals_accumulated_amount_check');

  // Add source_account_id column to link goals to accounts
  pgm.addColumn('goals', {
    source_account_id: {
      type: 'uuid',
      notNull: false, // Initially null to allow existing records
      references: 'accounts(id)',
      onDelete: 'CASCADE',
      comment: 'ID of the account that provides funds for this goal'
    }
  });

  // Create index for better query performance when finding goals by account
  pgm.createIndex('goals', 'source_account_id');
  pgm.createIndex('goals', ['source_account_id', 'is_deleted']);

  // Note: In a real migration, we would need to populate source_account_id for existing records
  // or make it required after data migration. For now, keeping it nullable for development.
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('goals', ['source_account_id', 'is_deleted']);
  pgm.dropIndex('goals', 'source_account_id');
  
  // Remove the source_account_id column
  pgm.dropColumn('goals', 'source_account_id');

  // Restore the original constraint that prevented over-reserving
  pgm.addConstraint(
    'goals',
    'goals_accumulated_amount_check',
    'CHECK (accumulated_amount <= total_amount)',
  );
};
