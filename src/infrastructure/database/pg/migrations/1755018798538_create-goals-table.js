/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('goals', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    total_amount: {
      type: 'bigint',
      notNull: true,
      comment: 'Total amount in cents for precision',
    },
    accumulated_amount: {
      type: 'bigint',
      notNull: true,
      default: 0,
      comment: 'Accumulated amount in cents for precision',
    },
    deadline: {
      type: 'date',
      notNull: false,
      comment: 'Optional deadline date for the goal',
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
  pgm.createIndex('goals', 'budget_id');
  pgm.createIndex('goals', 'deadline');
  pgm.createIndex('goals', ['budget_id', 'is_deleted']);
  
  // Add constraint to ensure accumulated amount doesn't exceed total amount
  pgm.addConstraint('goals', 'goals_accumulated_amount_check', 
    'CHECK (accumulated_amount <= total_amount)');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('goals');
};
