"use strict";
const User = use("App/Models/User");
const Hash = use("Hash");

class UserController {
  async login({ request, response, auth }) {
    const { username, password } = request.all();

    try {
      await auth.attempt(username, password);
      return response.redirect("/index");
    } catch (error) {
      console.log(error);
    }

    return response.redirect("/");
  }

  async register({ request, response, auth, view }) {
    const { username,firstname,familyname,phonenumber,email, password } = request.all();
      const user = new User();
      if (username != '' && username != undefined) {
        user.username = username;
      }
      if (firstname != '' && firstname != undefined) {
        user.firstname = firstname;
      }
      if (familyname != '' && familyname != undefined) {
        user.familyname = familyname;
      }
      if (phonenumber != '' && phonenumber != undefined) {
        user.phonenumber = phonenumber;
      }
      if (email != '' && email != undefined) {
        user.email = email;
      }
      if (password != '' && password != undefined) {
        user.password = password;
      }
      try {
        await user.save()
        console.log("a user has been add")
        await auth.login(user);
        return response.redirect("/index");
    } catch (error) {
        return view.render("auth.register",{err:error.code});
    }
      
 
      
    }
  
    
  
  async create({ view , auth, response, params }) {
    try {
      await auth.check()
      return response.redirect('/index')
    } catch (error) {
        return view.render("auth.register");

    }
  }
}

module.exports = UserController;
