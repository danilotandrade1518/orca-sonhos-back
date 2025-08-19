/** Ensure pgcrypto extension for gen_random_uuid() defaults */
/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = () => {
  // Usually we don't drop pgcrypto because other objects may depend on it.
  // Leaving empty to keep safe rollback.
};
