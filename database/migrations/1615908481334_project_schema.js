'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProjectSchema extends Schema {
  up () {
    this.create('projects', (table) => {
      table.string('name', 80).notNullable();
      table.string('description', 1025);
      table.string('type', 80);
      table.date('start_date').notNullable();
      table.date('end_date');
      table.date('actual_date');
      table.integer('team_id', 25).unsigned().references('id').inTable('teams');
      table.integer('leader_id', 25).unsigned().references('id').inTable('users');
      table.string('git_link', 80).notNullable();
      table.string("img")
      table.increments();
      table.timestamps();
    })
  }

  down () {
    this.drop('projects')
  }
}

module.exports = ProjectSchema
