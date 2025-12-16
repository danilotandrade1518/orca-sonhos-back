/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Remove constraint first
  pgm.dropConstraint('envelopes', 'envelopes_balance_check', {
    ifExists: true,
  });
  // Remove column
  pgm.dropColumn('envelopes', 'current_balance');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Add column back
  pgm.addColumn('envelopes', {
    current_balance: {
      type: 'bigint',
      notNull: true,
      default: 0,
      comment: 'Current balance in cents for precision',
    },
  });
  // Add constraint back
  pgm.addConstraint(
    'envelopes',
    'envelopes_balance_check',
    'CHECK (current_balance >= 0 AND current_balance <= monthly_limit * 2)',
  );
};
