"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class Error extends Model {
  static get table() {
    return "errors";
  }

  technology() {
    return this.belongsTo("App/Models/Technology", "technology_id", "id");
  }
}

module.exports = Error;
