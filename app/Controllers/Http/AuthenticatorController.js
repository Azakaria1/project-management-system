"use strict";
const User = use('App/Models/User');

class AuthenticatorController {
  async login({  view , auth, response, params}) {
    try {
      await auth.check()
      return response.redirect('/index')
    } catch (error) {

        return view.render("auth.login");

    }
  }
  async reset({  view , auth, params}) {
    const user = await auth.getUser()
    if(user.role== "adm"){
      const id = params.id;
      const password = params.password;
      const user = await User.find(id);
      user.password = password;
        await user.save().then(function () {
          console.log("A staff has been updated")
        });
}
    }

}

module.exports = AuthenticatorController;
