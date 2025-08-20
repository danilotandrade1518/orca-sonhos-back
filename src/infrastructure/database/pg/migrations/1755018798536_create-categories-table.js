/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create enum type for category types
  pgm.createType('category_type_enum', ['INCOME', 'EXPENSE', 'TRANSFER']);

  pgm.createTable('categories', {
    id: {
      type: 'uuid',
      primaryKey: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    type: {
      type: 'category_type_enum',
      notNull: true,
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
  pgm.createIndex('categories', 'budget_id');
  pgm.createIndex('categories', 'type');
  pgm.createIndex('categories', ['budget_id', 'is_deleted']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('categories');
  pgm.dropType('category_type_enum');
};
