'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use("App/Models/User");

class RememberMe {

  async handle({ auth, request }, next) {
    const excludedRoutes = ['/logout']; // Add routes you want to exclude

    if (!auth.user && request.cookie('remember_token')) {
      const shouldExclude = excludedRoutes.some(route => request.url().startsWith(route));

      if (!shouldExclude) {
        const user = await User.query().where('remember_token', request.cookie('remember_token'))
        .where('token_expires_at', '>', new Date()) // Check token expiration
        .first()

        console.table("retrieved user " + user);
        if (user) {
          const userInstance = new User();

          const isValidToken = await userInstance.validateRememberToken(request.cookie('remember_token'));

          console.log("efsdc " + isValidToken);
          if (isValidToken) {
            await auth.login(user);
          }
        }
      }
    }

    await next();
  }

}

module.exports = RememberMe
