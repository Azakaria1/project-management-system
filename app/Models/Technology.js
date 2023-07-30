'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Technology extends Model {
    static get table() {
        return 'technologies';
      }
}

module.exports = Technology