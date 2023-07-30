"use strict";

class EhandlerController {
  async 404({ auth, view }) {
    return view.render("pages.404");
  }
}

module.exports = EhandlerController;
