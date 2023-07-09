'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TaskUserSchema extends Schema {
  up () {
    this.create('task_users', (table) => {
      table.integer('user_id', 25).unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('task_id', 25).unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('task_users')
  }
}

module.exports = TaskUserSchema
