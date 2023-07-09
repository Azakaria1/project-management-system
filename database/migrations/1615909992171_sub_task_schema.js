'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubTaskSchema extends Schema {
  up () {
    this.create('sub_tasks', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 80).notNullable()
      table.string('description', 1025)
      table.string('commit', 80).notNullable()
      table.date('start_date').notNullable()
      table.string('start_time')
      table.string('status', 80).notNullable().defaultTo("td");
      table.string('flag', 80);
      table.string('id_card', 80);
      table.date('end_date')
      table.date('actual_date');
      table.integer('weight').defaultTo(1)
      table.string('end_time').notNullable()
      table.integer('task_id', 25).unsigned().references('id').inTable('tasks').onDelete('CASCADE');
    })
  }

  down () {
    this.drop('sub_tasks')
  }
}

module.exports = SubTaskSchema
