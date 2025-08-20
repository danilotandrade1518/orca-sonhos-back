/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('credit_cards', {
    id: {
      type: 'uuid',
      primaryKey: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    credit_limit: {
      type: 'bigint',
      notNull: true,
      comment: 'Credit limit in cents for precision',
    },
    closing_day: {
      type: 'integer',
      notNull: true,
      comment: 'Day of the month when the bill closes (1-31)',
    },
    due_day: {
      type: 'integer',
      notNull: true,
      comment: 'Day of the month when the bill is due (1-31)',
    },
    budget_id: {
      type: 'uuid',
      notNull: true,
      references: 'budgets(id)',
      onDelete: 'CASCADE',
    },
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for better query performance
  pgm.createIndex('credit_cards', 'budget_id');
  pgm.createIndex('credit_cards', ['budget_id', 'is_deleted']);

  // Add constraints for day validation
  pgm.addConstraint(
    'credit_cards',
    'credit_cards_closing_day_check',
    'CHECK (closing_day >= 1 AND closing_day <= 31)',
  );
  pgm.addConstraint(
    'credit_cards',
    'credit_cards_due_day_check',
    'CHECK (due_day >= 1 AND due_day <= 31)',
  );
  pgm.addConstraint(
    'credit_cards',
    'credit_cards_limit_check',
    'CHECK (credit_limit >= 0)',
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('credit_cards');
};
