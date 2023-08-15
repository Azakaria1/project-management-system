
'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SubTaskUser extends Model {
    static get table() {
        return 'sub_task_users';
      }
    
      subTask() {
        return this.belongsTo('App/Models/SubTask', 'sub_task_id', 'id');
      }
}

module.exports = SubTaskUser