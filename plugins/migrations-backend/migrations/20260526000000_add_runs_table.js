/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('migration_check_runs', table => {
    table.comment('Table which holds check run history');
    table.increments('id', { primaryKey: true });
    table.timestamp('started_at').defaultTo(knex.fn.now()).index();
    table.string('migrationReference', 255).notNullable().index();
    table.integer('passed_count').notNullable().defaultTo(0);
    table.integer('partially_passed_count').notNullable().defaultTo(0);
    table.integer('total_count').notNullable().defaultTo(0);
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('migration_check_runs');
};
