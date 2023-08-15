
'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SubTask extends Model {
    User () {
        return this
        .belongsToMany('App/Models/User')
        .pivotTable('sub_task_users')
      }
      static formatDates (field, value) {
        if (field === 'end_date') {
          return value.format('YYYY-MM-DD')
        }
        return super.formatDates(field, value)
      }

      static get table() {
        return 'sub_tasks';
      }
    
      subTaskUsers() {
        return this.hasMany('App/Models/SubTaskUser', 'id', 'sub_task_id');
      }
}

module.exports = SubTask