'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
const Helpers = use('Helpers');
var moment = require("moment");


/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
    
  }

  async validateRememberToken(token) {
    const rememberToken = await User.query().where('remember_token', token).first();

    console.log("rememberToken " + rememberToken);

    if (!rememberToken) {
      return false;
    }

    const expirationTime = moment(rememberToken.expires_at);

    if (expirationTime.isBefore(moment())) {
      this.remember_token = null;

      await this.save();
      return false;
    }

    return true;
  }
  tokens() {
    return this.hasMany('App/Models/Token');
  }
  
  static scopeHasSubTask (query) {
    return query.has('subTask')
  }

  subTask() {
    return this
    .belongsToMany('App/Models/SubTask')
    .pivotTable('sub_task_users')
  }
  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
 
}

module.exports = User
