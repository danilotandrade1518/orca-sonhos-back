/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create enum type for bill status
  pgm.createType('bill_status_enum', ['OPEN', 'PAID', 'OVERDUE']);

  pgm.createTable('credit_card_bills', {
    id: {
      type: 'uuid',
      primaryKey: true,
    },
    credit_card_id: {
      type: 'uuid',
      notNull: true,
      references: 'credit_cards(id)',
      onDelete: 'CASCADE',
    },
    closing_date: {
      type: 'date',
      notNull: true,
      comment: 'Date when the bill closes',
    },
    due_date: {
      type: 'date',
      notNull: true,
      comment: 'Date when the bill is due for payment',
    },
    amount: {
      type: 'bigint',
      notNull: true,
      comment: 'Bill amount in cents for precision',
    },
    status: {
      type: 'bill_status_enum',
      notNull: true,
      default: 'OPEN',
    },
    paid_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when the bill was paid',
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
  pgm.createIndex('credit_card_bills', 'credit_card_id');
  pgm.createIndex('credit_card_bills', 'status');
  pgm.createIndex('credit_card_bills', 'due_date');
  pgm.createIndex('credit_card_bills', ['credit_card_id', 'is_deleted']);
  pgm.createIndex('credit_card_bills', ['status', 'due_date']);

  // Add constraint to ensure closing date is before due date
  pgm.addConstraint(
    'credit_card_bills',
    'credit_card_bills_dates_check',
    'CHECK (closing_date < due_date)',
  );

  // Add constraint to ensure paid_at is set when status is PAID
  pgm.addConstraint(
    'credit_card_bills',
    'credit_card_bills_paid_status_check',
    "CHECK ((status = 'PAID' AND paid_at IS NOT NULL) OR (status != 'PAID'))",
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('credit_card_bills');
  pgm.dropType('bill_status_enum');
};
