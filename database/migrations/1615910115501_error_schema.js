'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ErrorSchema extends Schema {
  up () {
    this.create('errors', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 80).notNullable()
      table.string('commit', 80).notNullable()
      table.string('description', 255)
      table.string('resolve', 255)
      table.boolean('is_resolved').defaultTo(false)
      table.date('error_date').notNullable()
      table.integer('subtask_id', 25).unsigned().references('id').inTable('sub_tasks').onDelete('CASCADE');
      table.integer('technology_id', 25).unsigned().references('id').inTable('technologies').onDelete('CASCADE');
      table.integer('user_id', 25).unsigned().references('id').inTable('users').onDelete('CASCADE');
      
    })
  }

  down () {
    this.drop('errors')
  }
}

module.exports = ErrorSchema
