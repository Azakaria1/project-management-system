'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubTaskUserSchema extends Schema {
  up () {
    this.create('sub_task_users', (table) => {
      table.integer('user_id', 25).unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('sub_task_id', 25).unsigned().references('id').inTable('sub_tasks').onDelete('CASCADE');
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('sub_task_users')
  }
}

module.exports = SubTaskUserSchema
