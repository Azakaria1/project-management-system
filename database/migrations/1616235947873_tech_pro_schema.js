'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TechProSchema extends Schema {
  up () {
    this.create('tech_pros', (table) => {
      table.integer('project_id', 25).unsigned().references('id').inTable('projects').onDelete('CASCADE');
      table.integer('technology_id', 25).unsigned().references('id').inTable('technologies').onDelete('CASCADE');
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('tech_pros')
  }
}

module.exports = TechProSchema
