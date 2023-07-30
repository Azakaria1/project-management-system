"use strict";

const Database = use("Database");
const User = use('App/Models/User');
const TrelloAccounts = use('App/Models/TrelloAccounts');
const TrelloBoards = use('App/Models/TrelloBoards');
const Hash = use("Hash");
const Helpers = use("Helpers");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class AccountController {

  async edit({ auth, view, params }) {
    const user = await auth.getUser();
    user.password = "";
    var i = user.img;
    var n = user.firstname + " " + user.familyname;
    var r;
    if (user.role != "adm") {
      r = "x";
    }
    return view.render("dashboard.account.update", {
      user: user,
      img: i,
      myname: n,
      myrole: r,
    });
  }
  async update({ request, response, view }) {
    const { id, useremail, username, firstname, familyname, phone } =
      request.all();
    const user = await User.find(id);
    if (useremail != "" && useremail != undefined) {
      user.email = useremail;
    }
    if (username != "" && username != undefined) {
      user.username = username;
    }
    if (firstname != "" && firstname != undefined) {
      user.firstname = firstname;
    }
    if (familyname != "" && familyname != undefined) {
      user.familyname = familyname;
    }
    if (phone != "" && phone != undefined) {
      user.phonenumber = phone;
    }
    await user.save().then(function () {
      console.log("A staff has been updated");
    });
    return response.redirect("/index");
  }

  async passwordUpdate({ request, response, view }) {
    const { id, userpassword, newpassword, newpassword2 } = request.all();
    const user = await User.find(id);
    const isSame = await Hash.verify(userpassword, user.password);
    if (isSame) {
      if (
        newpassword != undefined &&
        newpassword != null &&
        newpassword2 != undefined &&
        newpassword2 != null
      ) {
        if (newpassword == newpassword2) {
          user.password = newpassword;
          await user.save().then(function () {
            console.log("A staff has been updated");
          });
          return response.redirect("/index");
        } else {
          return view.render("dashboard.staff.update", {
            user: user,
            error: 1,
          });
        }
      } else {
        await user.save().then(function () {
          console.log("A staff has been updated");
        });
        return response.redirect("/index");
      }
    } else {
      return view.render("dashboard.staff.update", { user: user, error: 2 });
    }
  }

  async uploadImage({ request, response, params }) {
    console.log("something happened");
    const id = params.id;
    //console.log(request._files);
    const user = await User.find(id);
    const filetoUpload = request.file("file", {
      types: ["jpg", "jpeg", "jpeg", "gif", "png"],
      size: "10mb",
    });
    console.log(filetoUpload);
    if (filetoUpload != undefined && filetoUpload != null) {
      var find = " ";
      var re = new RegExp(find, "g");
      const name = Date.now() + filetoUpload.clientName.replace(re, "");
      console.log(name);
      await filetoUpload.move(Helpers.publicPath("images/users"), {
        name: name,
        overwrite: true,
      });
      if (!filetoUpload.moved()) {
        return filetoUpload.error();
      }
      user.img = "images/users/" + name;
      await user.save();
    }
    return response.status(200).send({ data: "yes" });
  }
  async search_lists({ request, response }) {
    const { key, token, board } = request.all();

    var req = "https://api.trello.com/1/board/";
    req = req + board + "/lists?key=";
    req = req + key + "&token=" + token;
    var resp = await fetch(req, { method: "GET" })
      .then((response) => {
        return response;
      })
      .then((text) => text)
      .catch((err) => err);
    var value = await resp.text();
    if (resp.status == 200) {
      return response.status(200).send(JSON.parse(value));
    } else {
      return response.status(500).send({ data: "error" });
    }
  }
  async addtrello({ auth, request, response }) {
    const { id, key, token, board, td, ip, dn } = request.all();
    console.table(request.all());

    if (key != "" && key != undefined && token != "" && token != undefined) {
      if (
        board != "" &&
        board != undefined &&
        td != "" &&
        td != undefined &&
        ip != "" &&
        ip != undefined &&
        dn != "" &&
        dn != undefined
      ) {
        const trelloBoards = new TrelloBoards();
        trelloBoards.id_board = board;
        trelloBoards.todo = td;
        trelloBoards.going = ip;
        trelloBoards.done = dn;
        console.table(trelloBoards);
        await trelloBoards.save().then(function () {
          console.log("A trello Board has been saved");
        });

        const trelloAccounts = new TrelloAccounts();
        trelloAccounts.key = key;
        trelloAccounts.token = token;
        trelloAccounts.trello_board_id = trelloBoards.id;
        await this.moveEachCardToTrello(
          trelloBoards.going,
          trelloAccounts.key,
          trelloAccounts.token
        );
        await this.moveEachCardToTrello(
          trelloBoards.todo,
          trelloAccounts.key,
          trelloAccounts.token
        );
        await this.moveEachCardToTrello(
          trelloBoards.done,
          trelloAccounts.key,
          trelloAccounts.token
        );
        var req = "https://api.trello.com/1/members/me?key=";
        req = req + key + "&token=" + token;
        var resp = await fetch(req, { method: "GET" })
          .then((response) => {
            return response;
          })
          .then((text) => text)
          .catch((err) => err);
        var value = await resp.text();
        var x = JSON.parse(value);
        trelloAccounts.id_trello = x.id;
        trelloAccounts.user_id = auth.user.id;

        await trelloAccounts.save().then(function () {
          console.log("A trello Accounts has been saved");
          console.table(trelloAccounts);
        });
      }
    }
  }

  async moveEachCardToTrello(idList, trelloKey, trelloToken) {
    fetch(
      "https://api.trello.com/1/cards?idList=" +
        idList +
        "&key=" +
        trelloKey +
        "&token=" +
        trelloToken,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    )
      .then((response) => {
        console.log(`Response: ${response.status} ${response.statusText}`);
        return response.text();
      })
      .then((text) => console.log(text))
      .catch((err) => console.error(err));
  }
}

module.exports = AccountController;
