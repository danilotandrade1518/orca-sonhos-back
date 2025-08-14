/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create enum types for transaction status and type
  pgm.createType('transaction_status_enum', [
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'OVERDUE',
    'LATE',
  ]);
  pgm.createType('transaction_type_enum', ['INCOME', 'EXPENSE', 'TRANSFER']);

  pgm.createTable('transactions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    description: {
      type: 'varchar(255)',
      notNull: true,
    },
    amount: {
      type: 'bigint',
      notNull: true,
      comment: 'Transaction amount in cents for precision',
    },
    type: {
      type: 'transaction_type_enum',
      notNull: true,
    },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts(id)',
      onDelete: 'CASCADE',
    },
    category_id: {
      type: 'uuid',
      notNull: false,
      references: 'categories(id)',
      onDelete: 'SET NULL',
      comment: 'Optional category for transaction classification',
    },
    budget_id: {
      type: 'uuid',
      notNull: true,
      references: 'budgets(id)',
      onDelete: 'CASCADE',
    },
    credit_card_id: {
      type: 'uuid',
      notNull: false,
      references: 'credit_cards(id)',
      onDelete: 'SET NULL',
      comment: 'Optional credit card for credit card transactions',
    },
    transaction_date: {
      type: 'date',
      notNull: true,
      comment: 'Date when the transaction occurred or is scheduled',
    },
    status: {
      type: 'transaction_status_enum',
      notNull: true,
      default: 'SCHEDULED',
    },
    cancellation_reason: {
      type: 'text',
      notNull: false,
      comment: 'Reason for cancellation if status is CANCELLED',
    },
    cancelled_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when the transaction was cancelled',
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
  pgm.createIndex('transactions', 'account_id');
  pgm.createIndex('transactions', 'category_id');
  pgm.createIndex('transactions', 'budget_id');
  pgm.createIndex('transactions', 'credit_card_id');
  pgm.createIndex('transactions', 'transaction_date');
  pgm.createIndex('transactions', 'status');
  pgm.createIndex('transactions', 'type');
  pgm.createIndex('transactions', ['budget_id', 'is_deleted']);
  pgm.createIndex('transactions', ['account_id', 'transaction_date']);
  pgm.createIndex('transactions', ['budget_id', 'transaction_date']);
  pgm.createIndex('transactions', ['status', 'transaction_date']);

  // Add constraints for business rules
  pgm.addConstraint(
    'transactions',
    'transactions_amount_check',
    'CHECK (amount > 0)',
  );

  // Ensure cancellation fields are consistent
  pgm.addConstraint(
    'transactions',
    'transactions_cancellation_check',
    "CHECK ((status = 'CANCELLED' AND cancellation_reason IS NOT NULL AND cancelled_at IS NOT NULL) OR " +
      "(status != 'CANCELLED' AND cancellation_reason IS NULL AND cancelled_at IS NULL))",
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('transactions');
  pgm.dropType('transaction_status_enum');
  pgm.dropType('transaction_type_enum');
};
