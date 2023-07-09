'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TechnologySchema extends Schema {
  up () {
    this.create('technologies', (table) => {
      table.string('name', 80).notNullable()
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('technologies')
  }
}

module.exports = TechnologySchema
