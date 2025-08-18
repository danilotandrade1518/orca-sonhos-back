/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createIndex('budgets', 'participant_ids', {
    name: 'budgets_participant_ids_gin',
    method: 'gin',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropIndex('budgets', 'participant_ids', {
    name: 'budgets_participant_ids_gin',
    ifExists: true,
  });
};
