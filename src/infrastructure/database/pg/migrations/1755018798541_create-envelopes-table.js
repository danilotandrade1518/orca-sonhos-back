/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('envelopes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    monthly_limit: {
      type: 'bigint',
      notNull: true,
      comment: 'Monthly spending limit in cents for precision',
    },
    budget_id: {
      type: 'uuid',
      notNull: true,
      references: 'budgets(id)',
      onDelete: 'CASCADE',
    },
    category_id: {
      type: 'uuid',
      notNull: true,
      references: 'categories(id)',
      onDelete: 'CASCADE',
    },
    current_balance: {
      type: 'bigint',
      notNull: true,
      default: 0,
      comment: 'Current balance in cents for precision',
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
  pgm.createIndex('envelopes', 'budget_id');
  pgm.createIndex('envelopes', 'category_id');
  pgm.createIndex('envelopes', ['budget_id', 'is_deleted']);
  pgm.createIndex('envelopes', ['budget_id', 'category_id']);

  // Add constraint to ensure monthly_limit is positive
  pgm.addConstraint(
    'envelopes',
    'envelopes_monthly_limit_check',
    'CHECK (monthly_limit > 0)',
  );

  // Add constraint to ensure current_balance doesn't exceed monthly_limit significantly
  // (allowing some flexibility for real-world scenarios)
  pgm.addConstraint(
    'envelopes',
    'envelopes_balance_check',
    'CHECK (current_balance >= 0 AND current_balance <= monthly_limit * 2)',
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('envelopes');
};
