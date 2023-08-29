"use strict";
var moment = require("moment");
const Database = use("Database");
const User = use("App/Models/User");
const SubTask = use("App/Models/SubTask");
const SubTaskUser = use("App/Models/SubTaskUser");
const Hash = use("Hash");

class TaskController {
  
  async index({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const id_mod = params.id_mod;
      const id_pro = params.id_pro;
      const tasks = await Database.from("sub_tasks").where(
        "sub_tasks.task_id",
        id_mod
      );
      console.log(tasks);
      /* *** */
      var module = await Database.select(
        "tasks.*",
        Database.raw("projects.name as project")
      )
        .from("tasks")
        .innerJoin("projects", "projects.id", "tasks.project_id")
        .where("tasks.id", id_mod);
      module = module[0];

      var allowed = await Database.select(
        "tasks.*",
        Database.raw("projects.name as project")
      )
        .from("tasks")
        .innerJoin("projects", "projects.id", "tasks.project_id")
        .where("tasks.id", id_mod);

      var status = "";

      var start = new Date(module.start_date);
      var end = new Date(module.end_date);
      var current = new Date();

      if (start > current) {
        status = "haven't started yet";
      } else {
        if (module.actual_date == undefined || module.actual_date == null) {
          status = "in progress";
        } else {
          status = "finished";
        }

        module.status = status;
      }

      module.start_date = dateMaker(module.start_date);
      module.end_date = dateMaker(module.end_date);

      /* *** */
      for (var i = 0; i < tasks.length; i++) {
        tasks[i].bool = 0;
        if (tasks[i].status == "td") {
          tasks[i].status =
            "<span class='badge badge-soft-info font-size-12'>To do</span>";
        } else if (tasks[i].status == "pg") {
          tasks[i].status =
            "<span class='badge badge-soft-warning font-size-12'>In progress</span>";
        } else if (tasks[i].status == "fn") {
          tasks[i].status =
            "<span class='badge badge-soft-success font-size-12'>Finished</span>";
          tasks[i].bool = 1;
        } else {
          tasks[i].status = "";
        }
        tasks[i].start_date = dateMaker(tasks[i].start_date);
        tasks[i].end_date = dateMaker(tasks[i].end_date);
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var int;

      if (user.role == "int" || user.role == "emp") {
        console.log(user.role == "int");
        int = true;
      }
      return view.render("dashboard.task.index", {
        tasks: tasks,
        id_pro: id_pro,
        id_mod: id_mod,
        module: module,
        img: i,
        myname: n,
        myrole: user.role,
        restriction: int,
      });
    } else {
      return view.render("inv.index");
    }
  }
  /************************************************************************** */
  async details({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const task_id = params.task_id;
      var task = await Database.select(
        "sub_tasks.*",
        Database.raw("COUNT(errors.id) as errors"),
        Database.raw("projects.name as project"),
        Database.raw("tasks.name as module")
      )
        .from("sub_tasks")
        .leftJoin("errors", "errors.subtask_id", "sub_tasks.id")
        .leftJoin("tasks", "tasks.id", "sub_tasks.task_id")
        .leftJoin("projects", "projects.id", "tasks.project_id")
        .where("sub_tasks.id", task_id)
        .groupBy("sub_tasks.id");

      task = task[0];

      if (task.module == null || task.module == undefined) {
        task.module = "-";
      }
      if (task.project == null || task.project == undefined) {
        task.project = "-";
      }
      if (task.status == "td") {
        task.status = "To do";
      } else if (task.status == "pg") {
        task.status = "In progress";
      } else if (task.status == "fn") {
        task.status = "Finished";
      } else {
        task.status = "";
      }

      task.start_date = dateMaker(task.start_date);
      task.end_date = dateMaker(task.end_date);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.task.details", {
        task: task,
        task_id: task_id,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }
  /************************************************************************** */

  async validate({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const task_id = params.task_id;
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var r;
      if (user.role != "adm") {
        r = "x";
      }
      return view.render("dashboard.task.validate", {
        task_id: task_id,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  async finish({ request, auth, view, params, response }) {
    const user = await auth.getUser();

    const { actual_date } = request.all();

    const task_id = params.task_id;
    const task = await SubTask.find(task_id);
    task.actual_date = actual_date;
    task.status = "fn";
    await task.save().then(function () {
      console.log("A task has been updated");
    });
    return response.redirect("/task/" + task_id + "/details");
  }
  /************************************************************************** */

  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const id_mod = params.id_mod;
      const id_pro = params.id_pro;
      const users = await Database.select("users.*")
        .from("users")
        .innerJoin("team_users", "team_users.user_id", "users.id")
        .innerJoin("teams", "team_users.team_id", "teams.id")
        .innerJoin("projects", "projects.team_id", "teams.id")
        .where("projects.id", id_pro);
      const team = await Database.select("teams.name")
        .from("teams")
        .innerJoin("projects", "projects.team_id", "teams.id")
        .where("projects.id", id_pro);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var r;
      if (user.role != "adm") {
        r = "x";
      }
      return view.render("dashboard.task.create", {
        users: users,
        team: team[0].name,
        id_pro: id_pro,
        id_mod: id_mod,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  async store({ request, response, auth, params }) {
    const user = await auth.getUser();

    const {
      name,
      start_date,
      end_date,
      team,
      description,
      commit,
      start_time,
      end_time,
      weight,
    } = request.all();
    const id_mod = params.id_mod;
    const id_pro = params.id_pro;
    console.log(request.all());
    const task = new SubTask();
    task.task_id = id_mod;
    if (name != "" && name != undefined) {
      task.name = name;
    }
    if (weight != "" && weight != undefined) {
      task.weight = weight;
    }
    if (start_time != "" && start_time != undefined) {
      task.start_time = start_time;
    }
    if (end_time != "" && end_time != undefined) {
      task.end_time = end_time;
    }
    if (commit != "" && commit != undefined) {
      task.commit = commit;
    }
    if (start_date != "" && start_date != undefined) {
      task.start_date = start_date;
    }
    if (end_date != "" && end_date != undefined) {
      task.end_date = end_date;
    }
    if (description != "" && description != undefined) {
      task.description = description;
    }

    await task.save().then(function () {
      console.log("a task has been add");
    });
    for (var i = 0; i < team.length; i++) {
      const subTaskUser = new SubTaskUser();
      subTaskUser.sub_task_id = task.id;
      subTaskUser.user_id = team[i];
      await subTaskUser.save().then(function () {
        console.log("a Tech Pro has been add");
      });
    }

    return response.redirect(
      "/project/" + id_pro + "/module/" + id_mod + "/task"
    );
  }
  /************************************************************************* */
  // independent tasks

  async index2({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const tasks = await Database.select("sub_tasks.*")
        .from("sub_tasks")
        .innerJoin(
          "sub_task_users",
          "sub_task_users.sub_task_id",
          "sub_tasks.id"
        )
        .where("sub_task_users.user_id", user.id);
      console.log(tasks);
      for (var i = 0; i < tasks.length; i++) {
        tasks[i].bool = 0;
        if (tasks[i].status == "td") {
          tasks[i].status =
            "<span class='badge badge-soft-info font-size-12'>To do</span>";
        } else if (tasks[i].status == "pg") {
          tasks[i].status =
            "<span class='badge badge-soft-warning font-size-12'>In progress</span>";
        } else if (tasks[i].status == "fn") {
          tasks[i].status =
            "<span class='badge badge-soft-success font-size-12'>Finished</span>";
          tasks[i].bool = 1;
        } else {
          tasks[i].status = "";
        }
        tasks[i].start_date = dateMaker(tasks[i].start_date);
        tasks[i].end_date = dateMaker(tasks[i].end_date);
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.task.index", {
        tasks: tasks,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /****************************************************************************** */
  async search({ request, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const { state, weight } = request.all();
      var query = Database.select("sub_tasks.*")
        .from("sub_tasks")
        .innerJoin(
          "sub_task_users",
          "sub_task_users.sub_task_id",
          "sub_tasks.id"
        )
        .where("sub_task_users.user_id", user.id);

      if (weight == 0 && state != "all") {
        query = query.where("sub_tasks.status", state);
      } else if (weight != 0 && state == "all") {
        query = query.where("sub_tasks.weight", weight);
      } else if (weight != 0 && state != "all") {
        query = query
          .where("sub_tasks.weight", weight)
          .where("sub_tasks.status", state);
      }

      const tasks = await query;

      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].status == "td") {
          tasks[i].status = "To do";
        } else if (tasks[i].status == "pg") {
          tasks[i].status = "In progress";
        } else if (tasks[i].status == "fn") {
          tasks[i].status = "Finished";
        } else {
          tasks[i].status = "";
        }
        tasks[i].start_date = dateMaker(tasks[i].start_date);
        tasks[i].end_date = dateMaker(tasks[i].end_date);
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.task.index", {
        tasks: tasks,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }
  /****************************************************************************** */
  async create2({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.task.create", {
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  async store2({ request, response, auth, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const {
        name,
        start_date,
        end_date,
        description,
        commit,
        start_time,
        end_time,
        weight,
      } = request.all();
      const task = new SubTask();
      if (name != "" && name != undefined) {
        task.name = name;
      }
      if (start_time != "" && start_time != undefined) {
        task.start_time = start_time;
      }
      if (end_time != "" && end_time != undefined) {
        task.end_time = end_time;
      }
      if (commit != "" && commit != undefined) {
        task.commit = commit;
      }
      if (weight != "" && weight != undefined) {
        task.weight = weight;
      }
      if (start_date != "" && start_date != undefined) {
        task.start_date = start_date;
      }
      if (end_date != "" && end_date != undefined) {
        task.end_date = end_date;
      }
      if (description != "" && description != undefined) {
        task.description = description;
      }
      await task.save().then(function () {
        console.log("a task has been add");
      });

      const subTaskUser = new SubTaskUser();
      subTaskUser.sub_task_id = task.id;
      subTaskUser.user_id = user.id;
      await subTaskUser.save().then(function () {
        console.log("a Tech Pro has been add");
      });

      return response.redirect("/task");
    } else {
      return view.render("inv.index");
    }
  }

  async delete({ response, request, view, params }) {
    const { id } = params;

    const subTask = await SubTask.find(id);
    await subTask
      .delete()
      .then((data) => {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }

  async edit({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const task_id = params.task_id;
      const sub_tasks = await Database.from("sub_tasks").where(
        "sub_tasks.id",
        task_id
      );
      var sub_task = sub_tasks[0];

      sub_task.start_date = dateInputMaker(sub_task.start_date);
      sub_task.end_date = dateInputMaker(sub_task.end_date);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.task.update", {
        task: sub_task,
        task_id: task_id,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /*********************************** */

  async update({ request, response, auth, params }) {
    const user = await auth.getUser();

    const {
      name,
      start_date,
      end_date,
      description,
      commit,
      start_time,
      end_time,
      weight,
    } = request.all();
    const task_id = params.task_id;
    const task = await SubTask.find(task_id);

    if (name != "" && name != undefined) {
      task.name = name;
    }
    if (start_time != "" && start_time != undefined) {
      task.start_time = start_time;
    }
    if (end_time != "" && end_time != undefined) {
      task.end_time = end_time;
    }
    if (commit != "" && commit != undefined) {
      task.commit = commit;
    }
    if (weight != "" && weight != undefined) {
      task.weight = weight;
    }
    if (start_date != "" && start_date != undefined) {
      task.start_date = start_date;
    }
    if (end_date != "" && end_date != undefined) {
      task.end_date = end_date;
    }
    if (description != "" && description != undefined) {
      task.description = description;
    }
    await task.save().then(function () {
      console.log("a task has been add");
    });

    return response.redirect("/task");
  }
}

function dateMaker(d) {
  var date = new Date(d);
  var day = date.getDate();
  var month = date.getMonth() + 1 + "";
  if (month.length == 1) {
    month = "0" + month;
  }
  var year = date.getFullYear();
  return day + "-" + month + "-" + year;
}

function dateInputMaker(d) {
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
module.exports = TaskController;
