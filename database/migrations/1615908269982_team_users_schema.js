'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TeamUsersSchema extends Schema {
  up () {
    this.create('team_users', (table) => {
      table.integer('user_id', 25).unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('team_id', 25).unsigned().references('id').inTable('teams').onDelete('CASCADE');
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('team_users')
  }
}

module.exports = TeamUsersSchema
