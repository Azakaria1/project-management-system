"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class TrelloBoardSchema extends Schema {
  up() {
    this.create("trello_boards", (table) => {
      table.string("id_board", 80);
      table.string("todo", 80);
      table.string("going", 80);
      table.string("done", 80);
      table
        .integer("sub_task_id", 25)
        .unsigned()
        .references("id")
        .inTable("sub_tasks")
        .onDelete("CASCADE");
      table.increments();
      table.timestamps();
    });
  }

  down() {
    this.drop("trello_boards");
  }
}

module.exports = TrelloBoardSchema;
