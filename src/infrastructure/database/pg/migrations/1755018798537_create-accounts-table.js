/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create enum type for account types
  pgm.createType('account_type_enum', [
    'CHECKING_ACCOUNT',
    'SAVINGS_ACCOUNT',
    'INVESTMENT_ACCOUNT',
    'CASH',
  ]);

  pgm.createTable('accounts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    type: {
      type: 'account_type_enum',
      notNull: true,
    },
    budget_id: {
      type: 'uuid',
      notNull: true,
      references: 'budgets(id)',
      onDelete: 'CASCADE',
    },
    balance: {
      type: 'bigint',
      notNull: true,
      default: 0,
      comment: 'Balance in cents for precision',
    },
    description: {
      type: 'text',
      notNull: false,
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
  pgm.createIndex('accounts', 'budget_id');
  pgm.createIndex('accounts', 'type');
  pgm.createIndex('accounts', ['budget_id', 'is_deleted']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('accounts');
  pgm.dropType('account_type_enum');
};
