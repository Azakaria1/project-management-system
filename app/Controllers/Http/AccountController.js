"use strict";

const { name } = require("@adonisjs/ace/lib/commander");

const Database = use("Database");

const SubTask = use("App/Models/SubTask");
const SubTaskUser = use("App/Models/SubTaskUser");

const User = use("App/Models/User");
const TrelloAccounts = use("App/Models/TrelloAccounts");
const TrelloBoards = use("App/Models/TrelloBoards");
const Hash = use("Hash");
const Helpers = use("Helpers");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class AccountController {
  async edit({ auth, view, response, params }) {
    const user = await auth.getUser();
    user.password = "";
    var i = user.img;
    var n = user.firstname + " " + user.familyname;
    var r;

    response.cookie("remember_token", user.remember_token, {
      httpOnly: true, // Cookie cannot be accessed via JavaScript
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration (e.g., 7 days)
      sameSite: "strict", // Control cookie sharing with cross-site requests
    });

    return view.render("dashboard.account.update", {
      user: user,
      img: i,
      myname: n,
      myrole: user.role,
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
            myrole: user.role,
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

  async checkCardExists(boardId, cardNameOrId) {
    try {
      const response = await TrelloApi.get(`/boards/${boardId}/cards`, {
        params: {
          fields: "name", // You can request additional fields as needed
        },
      });

      const matchingCard = response.data.find(
        (card) => card.name === cardNameOrId || card.id === cardNameOrId
      );

      if (matchingCard) {
        console.log("Card exists:", matchingCard.name);
      } else {
        console.log("Card does not exist.");
      }
    } catch (error) {
      console.error("Error checking card existence:", error);
    }
  }

  async addtrello({ auth, request, response }) {
    const user = await auth.getUser();
    const { id, key, token, board, td, ip, dn } = request.all();

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

        const boardExists = await Database.from("trello_boards")
          .where("id_board", trelloBoards.id_board)
          .first();

        if (!boardExists) {
          await trelloBoards.save().then(function () {
            console.log("A trello Board has been saved");
          });
        } else {
          console.log("Board already exists !");
        }

        const trelloAccounts = new TrelloAccounts();
        trelloAccounts.key = key;
        trelloAccounts.token = token;
        trelloAccounts.trello_board_id = trelloBoards.id;

        const subTasksTodo = await SubTask.query()
          .where("status", "td")
          .leftJoin(
            "sub_task_users",
            "sub_tasks.id",
            "sub_task_users.sub_task_id"
          )
          .where("sub_task_users.user_id", user.id)
          .fetch();

        if (subTasksTodo.rows != []) {
          subTasksTodo.rows.forEach(async (element) => {
            await this.moveEachCardToTrello(
              trelloBoards.todo,
              trelloAccounts.key,
              trelloAccounts.token,
              element.name,
              element.description,
              new Date(element.start_date).toISOString(),
              element.end_date,
              0
            );
          });
        }

        const subTasksInProgress = await SubTask.query()
          .where("status", "pg")
          .leftJoin(
            "sub_task_users",
            "sub_tasks.id",
            "sub_task_users.sub_task_id"
          )
          .where("sub_task_users.user_id", user.id)
          .fetch();

        if (subTasksInProgress.rows != []) {
          subTasksInProgress.rows.forEach(async (element) => {
            this.checkCardExists(trelloBoards.id_board, element.name);
            console.log(element.name);
            console.log(trelloBoards.id_board);
            await this.moveEachCardToTrello(
              trelloBoards.going,
              trelloAccounts.key,
              trelloAccounts.token,
              element.name,
              element.description,
              new Date(element.start_date).toISOString(),
              element.end_date,
              0
            );
          });
        }

        const subTasksDone = await SubTask.query()
          .where("status", "fn")
          .leftJoin(
            "sub_task_users",
            "sub_tasks.id",
            "sub_task_users.sub_task_id"
          )
          .where("sub_task_users.user_id", user.id)
          .fetch();

        if (subTasksDone.rows != []) {
          subTasksDone.rows.forEach(async (element) => {
            /* 
            
            const userIds = await SubTaskUser.query()
              .where("sub_task_users.sub_task_id", element.id)
              .pluck("sub_task_users.user_id");
              
              userIds.forEach( async element => {
              console.log(" => " + element)

            const trelloAccount = await Database.from('trello_accounts')
              .select('id_trello')
              .where('user_id', element)
              .first();
            
            if (trelloAccount) {
              console.log("Trello ID:", trelloAccount.trello_id);
            } else {
              console.log("No Trello account found for the specified user ID.");
            }
            
            }) */

            await this.moveEachCardToTrello(
              trelloBoards.done,
              trelloAccounts.key,
              trelloAccounts.token,
              element.name,
              element.description,
              new Date(element.start_date).toISOString(),
              element.end_date,
              1
            );
          });
        }

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

        const accountExists = await Database.from("trello_accounts")
          .where("id_trello", trelloAccounts.id_trello)
          .first();

        if (!accountExists) {
          await trelloAccounts.save().then(function () {
            console.log("A trello Accounts has been saved");
          });
        } else {
          console.log("Account already exists !");
        }
      }
    }
  }

  async moveEachCardToTrello(
    idList,
    trelloKey,
    trelloToken,
    name,
    description,
    start_date,
    end_date,
    completed
  ) {
    const apiUrl = `https://api.trello.com/1/cards?key=${trelloKey}&token=${trelloToken}&idList=${idList}&name=${encodeURIComponent(
      name
    )}
&desc=${encodeURIComponent(
      description
    )}&due=${end_date}&start=${start_date}&dueComplete=${completed}`;
    fetch(apiUrl, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("New card created:", data);
      })
      .catch((error) => {
        console.error("Error creating card:", error);
      });
  }
}

module.exports = AccountController;
