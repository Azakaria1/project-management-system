'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TrelloAccountSchema extends Schema {
  up () {
    this.create('tokens', (table) => {
      table.increments();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('token', 255).notNullable().unique();
      table.string('type', 80).notNullable();
      table.boolean('is_revoked').defaultTo(false);
      table.timestamps();
    });
  }

  down () {
    this.drop('trello_accounts')
  }
}

module.exports = TrelloAccountSchema
