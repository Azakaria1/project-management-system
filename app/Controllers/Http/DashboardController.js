"use strict";
const Database = use("Database");
const SubTask = use("App/Models/SubTask");
const SubTaskUser = use("App/Models/SubTaskUser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class DashboardController {
  async index({ auth, view, session }) {
    const user = await auth.getUser();

    var data, ii, n;

    //console.log("user role => " + user.role);
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      ii = user.img;
      n = user.firstname + " " + user.familyname;
      const todo = await Database.select("sub_tasks.*")
        .from("sub_tasks")
        .innerJoin(
          "sub_task_users",
          "sub_task_users.sub_task_id",
          "sub_tasks.id"
        )
        .where("sub_task_users.user_id", user.id)
        .where("sub_tasks.status", "td")
        .orderBy("sub_tasks.created_at", "desc");
      const progress = await Database.select("sub_tasks.*")
        .from("sub_tasks")
        .innerJoin(
          "sub_task_users",
          "sub_task_users.sub_task_id",
          "sub_tasks.id"
        )
        .where("sub_task_users.user_id", user.id)
        .where("sub_tasks.status", "pg")
        .orderBy("sub_tasks.created_at", "desc");

      const completed = await Database.select("sub_tasks.*")
        .from("sub_tasks")
        .innerJoin(
          "sub_task_users",
          "sub_task_users.sub_task_id",
          "sub_tasks.id"
        )
        .where("sub_task_users.user_id", user.id)
        .where("sub_tasks.status", "fn")
        .orderBy("sub_tasks.actual_date", "desc");
      var colors = [
        "green",
        "orange",
        "light-blue",
        "cyan",
        "blue-grey",
        "red",
      ];
      data = [];
      var td = { id: "1", title: "TO DO", headerBg: "red" };
      var td_items = [];
      for (var i = 0; i < todo.length; i++) {
        var x = {};
        x["id"] = todo[i].id;
        x["title"] = todo[i].name;
        x["border"] = colors[Math.floor(Math.random() * 6)];
        x["dueDate"] = dateMaker(todo[i].end_date);
        td_items.push(x);
      }
      td["item"] = td_items;
      var ip = { id: "2", title: "IN PROGRESS" };
      var ip_items = [];
      for (var i = 0; i < progress.length; i++) {
        var x = {};
        x["id"] = progress[i].id;
        x["title"] = progress[i].name;
        x["border"] = colors[Math.floor(Math.random() * 6)];
        x["dueDate"] = dateMaker(progress[i].end_date);
        ip_items.push(x);
      }
      ip["item"] = ip_items;
      var fn = { id: "3", title: "DONE" };
      var fn_items = [];
      for (var i = 0; i < completed.length; i++) {
        var x = {};
        x["id"] = completed[i].id;
        x["title"] = completed[i].name;
        x["border"] = "light-blue";
        x["dueDate"] = dateMaker(completed[i].end_date);
        fn_items.push(x);
      }
      fn["item"] = fn_items;
      data.push(td, ip, fn);

      return view.render("dashboard.index", {
        img: ii,
        myname: n,
        data: JSON.stringify(data),
        myrole: session.get("role"),
      });
    } /*  else {
      return view.render("inv.index", {
        img: ii,
        myname: n,
        data: JSON.stringify(data),
        myrole: r,
      });
    } */
  }

  async edit({ response, request }) {
    const { id, date, title } = request.all();
    const task = await SubTask.find(id);
    if (date != "" && date != undefined) {
      task.end_date = date;
    }
    if (title != "" && title != undefined) {
      task.name = title;
    }
    await task
      .save()
      .then(function () {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }

  async add({ response, request, auth }) {
    const { id, text, date } = request.all();
    console.log(date);
    const user = await auth.getUser();
    const task = new SubTask();
    task.name = text;
    if (id == "1") {
      task.status = "td";
      task.end_date = date;
      task.weight = 1;
      task.start_time = "00:00";
      task.end_time = "00:00";

      task.commit = "";
    } else if (id == "2") {
      task.status = "pg";
      task.start_date = new Date();
      task.end_date = date;
      task.weight = 1;
      task.start_time = "00:00";
      task.end_time = "00:00";

      task.commit = "";
    } else if (id == "3") {
      task.status = "fn";
      task.actual_date = new Date();
      task.end_date = new Date();
      task.weight = 1;
      task.start_time = "00:00";
      task.end_time = "00:00";
      task.commit = "";
    } else {
      return response.status(500).json({ error: "error" });
    }
    await task
      .save()
      .then(function () {
        var req = "https://api.trello.com/1/cards";
        req = req + "?key=53e3f526154023bd6336c565223adc29";
        req =
          req +
          "&token=b9d5a676cf703a60949e0a7746d030135e103acf24e6d153f445fbc1e89c71fd";
        req = req + "&idList=60cc7cc6a57a176c19bf2cf8";
        req = req + "&name=" + text;
        console.log(req);
        fetch(req, { method: "POST" })
          .then((response) => {
            console.log(`Response: ${response.status} ${response.statusText}`);
            return response.text();
          })
          .then((text) => console.log(JSON.parse(text)))
          .catch((err) => console.error(err));
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });

    if (task.id) {
      const subTaskUser = new SubTaskUser();
      subTaskUser.sub_task_id = task.id;
      subTaskUser.user_id = user.id;
      await subTaskUser
        .save()
        .then(function () {
          return response.status(200).send({ data: "yes" });
        })
        .catch((e) => {
          console.log(e);
          return response.status(500).json({ error: e });
        });
    }
  }

  async move({ response, request }) {
    const { id, eid } = request.all();
    const task = await SubTask.find(eid);
    if (id == "1") {
      task.status = "td";
      task.start_date = null;
      task.actual_date = null;
    } else if (id == "2") {
      task.status = "pg";
      task.start_date = new Date();
      task.actual_date = null;
    } else if (id == "3") {
      task.status = "fn";
      task.actual_date = new Date();
    } else {
      return response.status(500).json({ error: "error" });
    }
    await task
      .save()
      .then(function () {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }
}

function dateMaker(d) {
  var date = new Date(d);
  var day = date.getDate() + "";
  var month = date.getMonth() + 1 + "";
  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }
  var year = date.getFullYear();
  return year + "-" + month + "-" + day;
}

module.exports = DashboardController;
