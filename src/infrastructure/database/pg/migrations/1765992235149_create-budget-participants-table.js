/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create enum type for participant roles
  pgm.createType('participant_role_enum', ['OWNER', 'PARTICIPANT']);

  pgm.createTable('budget_participants', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    budget_id: {
      type: 'uuid',
      notNull: true,
      references: 'budgets(id)',
      onDelete: 'CASCADE',
    },
    participant_id: {
      type: 'uuid',
      notNull: true,
      comment: 'User ID of the participant',
    },
    role: {
      type: 'participant_role_enum',
      notNull: true,
      default: 'PARTICIPANT',
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

  // Create unique constraint to prevent duplicate participants in the same budget
  pgm.addConstraint('budget_participants', 'budget_participants_budget_participant_unique', {
    unique: ['budget_id', 'participant_id'],
  });

  // Create indexes for common queries
  pgm.createIndex('budget_participants', 'budget_id');
  pgm.createIndex('budget_participants', 'participant_id');
  pgm.createIndex('budget_participants', ['budget_id', 'role']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('budget_participants');
  pgm.dropType('participant_role_enum');
};
