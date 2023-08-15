'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddRememberTokenToUsersSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.string('remember_token').nullable().unique();
      table.timestamp('token_expires_at').nullable()
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('remember_token');
      table.dropColumn('token_expires_at');
    })
  }
}

module.exports = AddRememberTokenToUsersSchema
