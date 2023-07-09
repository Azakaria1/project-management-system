'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TrelloAccountSchema extends Schema {
  up () {
    this.create('trello_accounts', (table) => {
      table.string('key', 80).notNullable()
      table.string('id_trello', 80)
      table.string('token', 80).notNullable()
      table.integer('trello_board_id', 25).unsigned().references('id').inTable('trello_boards').onDelete('CASCADE');
      table.integer('user_id', 25).unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('trello_accounts')
  }
}

module.exports = TrelloAccountSchema
