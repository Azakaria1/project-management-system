'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('username', 80).notNullable().unique()
      table.string('firstname', 80).notNullable()
      table.string('familyname', 80).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('phonenumber', 60)
      table.boolean('status', 60).defaultTo(true)
      table.string('role', 60).defaultTo("not")
      table.string("img").defaultTo("images/user.png")
      table.string('telegram_id', 80)
      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema
