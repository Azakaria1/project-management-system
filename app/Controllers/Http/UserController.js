"use strict";
const User = use("App/Models/User");
const Hash = use("Hash");
const { v4: uuidv4 } = require("uuid");

class UserController {
  
  async login({ request, response, session, auth }) {
    const { username, password, remember } = request.all();

    try {
      await auth.attempt(username, password);
      const user = await auth.getUser();

      if (user.role !== "not") {
        if (remember) {
          const maxAgeMilliseconds = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

          const rememberToken = uuidv4();

          user.remember_token = rememberToken;
          user.token_expires_at = new Date(Date.now() + maxAgeMilliseconds);
          await user.save();

          response.cookie("remember_token", rememberToken, {
            httpOnly: true,
            maxAge: maxAgeMilliseconds,
            sameSite: "strict",
          });
        }

        session.put("role", user.role);
        return response.redirect("/index");
      } else {
        await auth.logout();
        session.clear();

        response.clearCookie("remember_token");
        response.clearCookie("adonis-session");

        return response.redirect("/");
      }
    } catch (error) {
      console.error(error);
      return response.redirect("/");
    }
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
