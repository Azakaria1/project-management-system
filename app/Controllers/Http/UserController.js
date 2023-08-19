"use strict";
const User = use("App/Models/User");
const Hash = use("Hash");

class UserController {
  async login({ request, response, session, auth }) {
    const { username, password, remember } = request.all();

    try {
      console.table(auth);
      console.log("gdv");
      await auth.attempt(username, password);
      auth
        .getUser()
        .then(async (user) => {
          if (user.role != "not") session.put("role", user.role);
          else {
            await auth.logout();

            session.clear();
            console.log("deco");
            response.clearCookie("remember_token");

            response.clearCookie("adonis-session");
            response.redirect("/");
          }
        })
        .catch((error) => {
          // Handle errors
          console.error(error);
        });

      return response.redirect("/index");
    } catch (error) {
      console.log(error);
    }

    return response.redirect("/");
  }

  async register({ request, response, view }) {
    try {
      const { username, firstname, familyname, phonenumber, email, password } =
        request.all();

      // Add validation checks here

      const user = new User();
      user.username = username;
      user.firstname = firstname;
      user.familyname = familyname;
      user.phonenumber = phonenumber;
      user.email = email;
      user.password = password;

      console.log(user);

      await user.save();
      console.log("A User has been added !");

      return response.redirect("/");
    } catch (error) {
      console.error(error);
      return view.render("auth.register", { err: error.code });
    }
  }

  async create({ view, auth, response, params }) {
    try {
      await auth.check();
      return response.redirect("/index");
    } catch (error) {
      return view.render("auth.register");
    }
  }
}

module.exports = UserController;
