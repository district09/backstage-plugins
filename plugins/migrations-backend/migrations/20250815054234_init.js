/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('migration_check_results', table => {
    table.comment('Table to store individual check results for migrations');
    table.increments('id', { primaryKey: true });
    table.string('checkId', 255).notNullable();
    table.string('description', 1024);
    table.boolean('result').notNullable().defaultTo(false);
    table.timestamp('checked_at').defaultTo(knex.fn.now());
    table.string('migrationReference', 255).notNullable();
    table.string('componentReference', 255).notNullable();
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('migration_check_results');
};
