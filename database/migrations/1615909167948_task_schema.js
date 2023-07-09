'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TaskSchema extends Schema {
  up () {
    this.create('tasks', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 80).notNullable()
      table.string('description', 1025)
      table.date('start_date')
      table.date('end_date')
      table.date('actual_date');
      table.integer('project_id', 25).unsigned().references('id').inTable('projects').onDelete('CASCADE');
    })
  }

  down () {
    this.drop('tasks')
  }
}

module.exports = TaskSchema
