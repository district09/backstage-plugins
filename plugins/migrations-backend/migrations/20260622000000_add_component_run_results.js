/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('migration_component_run_results', table => {
    table.comment(
      'Per-component pass/fail state for each migration check run, enabling filtered history queries',
    );
    table.increments('id', { primaryKey: true });
    table
      .integer('run_id')
      .notNullable()
      .references('id')
      .inTable('migration_check_runs')
      .onDelete('CASCADE')
      .index();
    table.string('migrationReference', 255).notNullable().index();
    table.string('componentReference', 255).notNullable();
    table.boolean('passed').notNullable().defaultTo(false);
    table.boolean('partial').notNullable().defaultTo(false);
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('migration_component_run_results');
};
