"use strict";
var moment = require("moment");
const Database = use("Database");
const User = use("App/Models/User");
const Task = use("App/Models/Task");
const TaskUser = use("App/Models/TaskUser");
const Hash = use("Hash");

class ModuleController {
  
  async index({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const page = params.page ? params.page : 1;
      const id_project = params.id;
      const tasks = await Database.select(
        "tasks.*",
        Database.raw("projects.name as project"),
        Database.raw(
          'GROUP_CONCAT(CONCAT(users.firstname, " ",users.familyname)) as subteam'
        )
      )
        .from("tasks")
        .innerJoin("projects", "projects.id", "tasks.project_id")
        .innerJoin("task_users", "task_users.task_id", "tasks.id")
        .innerJoin("users", "task_users.user_id", "users.id")
        .where("projects.id", id_project)
        .groupBy("tasks.id");
      /* *** */
      const projects = await Database.select(
        "projects.*",
        Database.raw(
          'GROUP_CONCAT(distinct CONCAT(u2.firstname, " ", u2.familyname, " ") ) as members'
        ),
        Database.raw('CONCAT(u1.firstname, " ",u1.familyname) as leader'),
        Database.raw("GROUP_CONCAT( distinct technologies.name) as tech")
      )
        .from("projects")
        .innerJoin("teams", "projects.team_id", "teams.id")
        .innerJoin("users as u1", "projects.leader_id", "u1.id")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .leftJoin("users as u2", "team_users.user_id", "u2.id")
        .leftJoin("tech_pros", "tech_pros.project_id", "projects.id")
        .leftJoin("technologies", "tech_pros.technology_id", "technologies.id")
        .where("projects.id", id_project);
      var project = projects[0];

      console.table(project);
      var status = "";
      var start = new Date(project.start_date);
      var end = new Date(project.end_date);
      var current = new Date();

      if (start > current) {
        status = "haven't started yet";
      } else {
        if (project.actual_date == undefined || project.actual_date == null) {
          var finished = await Database.select(
            Database.raw("SUM(weight) as val")
          )
            .from("sub_tasks")
            .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
            .innerJoin("projects", "tasks.project_id", "projects.id")
            .where("projects.id", project.id)
            .whereNotNull("sub_tasks.actual_date")
            .groupBy("projects.id");
          var total = await Database.select(Database.raw("SUM(weight) as val"))
            .from("sub_tasks")
            .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
            .innerJoin("projects", "tasks.project_id", "projects.id")
            .where("projects.id", project.id)
            .groupBy("projects.id");
          var f;
          if (finished[0] == undefined || finished[0] == null) {
            f = 0;
          } else {
            f = finished[0].val;
          }
          var t;
          if (finished[0] == undefined || finished[0] == null) {
            t = 1;
          } else {
            t = total[0].val;
          }
          var prog = (f * 100) / t;
          status = "in progress " + prog + "%";
        } else {
          status = "finished";
        }
      }
      project.status = status;
      project.start_date = dateMaker(project.start_date);
      project.end_date = dateMaker(project.end_date);
      /* *** */
      for (var i = 0; i < tasks.length; i++) {
        var status = "";
        var start = new Date(tasks[i].start_date);
        var end = new Date(tasks[i].end_date);
        var current = new Date();

        if (start > current) {
          status = "haven't started yet";
        } else {
          if (tasks[i].end_date == undefined || tasks[i].end_date == null) {
            status = "in progress";
          } else {
            if (
              tasks[i].actual_date == undefined ||
              tasks[i].actual_date == null
            ) {
              status = "in progress";
            } else {
              status = "finished";
            }
          }
        }
        tasks[i].status = status;
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      var int;

      var isTeamLeaderOrAdmin;
      project.leader_id == user.id || user.role == "adm"
        ? (isTeamLeaderOrAdmin = true)
        : (isTeamLeaderOrAdmin = false);

      console.log(isTeamLeaderOrAdmin);
      if (user.role == "int" || user.role == "emp") {
        int = true;
      }
      return view.render("dashboard.module.index", {
        modules: tasks,
        id_project: id_project,
        project: project,
        img: i,
        myname: n,
        myrole: user.role,
        isTeamLeaderOrAdmin: isTeamLeaderOrAdmin,
        restriction: int,
      });
    } else {
      return view.render("inv.index");
    }
  }

  // ----------------------------------------------------------------------------------

  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm" || user.role == "tl") {
      const id_project = params.id;

      const users = await Database.select("users.*")
        .from("users")
        .innerJoin("team_users", "team_users.user_id", "users.id")
        .innerJoin("teams", "team_users.team_id", "teams.id")
        .innerJoin("projects", "projects.team_id", "teams.id")
        .where("projects.id", id_project);
      const team = await Database.select("teams.name")
        .from("teams")
        .innerJoin("projects", "projects.team_id", "teams.id")
        .where("projects.id", id_project);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.module.create", {
        users: users,
        team: team[0].name,
        id: id_project,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else if (user.role == "int") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  //----------------------------------------------------------------------------

  async store({ request, response, auth, params }) {
    const user = await auth.getUser();

    const { team, name, start_date, end_date, description } = request.all();
    const id_project = params.id;
    const module = new Task();
    module.project_id = id_project;
    if (name != "" && name != undefined) {
      module.name = name;
    }
    if (start_date != "" && start_date != undefined) {
      module.start_date = start_date;
    }
    if (end_date != "" && end_date != undefined) {
      module.end_date = end_date;
    }
    if (description != "" && description != undefined) {
      module.description = description;
    }
    await module.save().then(function () {
      console.log("a task has been add");
    });
    for (var i = 0; i < team.length; i++) {
      const tu = new TaskUser();
      tu.task_id = module.id;
      tu.user_id = parseInt(team[i]);
      await tu.save().then(function () {
        console.log("a user task has been add");
      });
    }

    return response.redirect("/project/" + id_project + "/module");
  }
  /************************************************************************** */

  async validate({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm" || user.role == "tl") {
      const module_id = params.module_id;
      const id_pro = params.id_pro;
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.module.validate", {
        module_id: module_id,
        id_pro: id_pro,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else if (user.role == "int") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async finish({ request, auth, view, params, response }) {
    const user = await auth.getUser();

    const { actual_date } = request.all();

    const module_id = params.module_id;
    const id_pro = params.id_pro;
    const task = await Task.find(module_id);
    task.actual_date = actual_date;
    await task.save().then(function () {
      console.log("A module has been updated");
    });
    return response.redirect(
      "/project/" + id_pro + "/module/" + module_id + "/task"
    );
  }
  /************************************************************************** */

  async edit({ auth, view, params }) {
    const user = await auth.getUser();

    if (user.role == "adm" || user.role == "tl") {
      const users = await Database.from("users");

      const module_id = params.module_id;
      const modules = await Database.select(
        "tasks.*",
        Database.raw("GROUP_CONCAT(task_users.user_id) as team")
      )
        .from("tasks")
        .innerJoin("task_users", "task_users.task_id", "tasks.id")
        .where("tasks.id", module_id);
      var module = modules[0];
      module.start_date = dateInputMaker(module.start_date);
      module.end_date = dateInputMaker(module.end_date);

      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.module.update", {
        module: module,
        img: i,
        myname: n,
        users: users,
        myrole: user.role,
      });
    } else if (user.role == "int" || user.role == "emp") {
      return view.render("pages.403");
    }
    return view.render("inv.index");
  }

  async update({ request, response, auth, params }) {
    const user = await auth.getUser();

    const { name, description, start_date, end_date, team, oldteam } =
      request.all();
    const module_id = params.module_id;
    const modules = await Task.find(module_id);

    var x;
    if (oldteam == "null") {
      x = [];
    } else {
      x = oldteam.split(",");
    }
    var y;
    if (Array.isArray(team) == false) {
      var y = [];
      y.push(team);
    } else {
      y = team;
    }
    var to_del = arr_diff(x, y);
    var to_add = arr_diff(y, x);
    console.log(to_add);
    console.log(to_del);
    if (name != "" && name != undefined) {
      modules.name = name;
    }
    if (description != "" && description != undefined) {
      modules.description = description;
    }
    if (start_date != "" && start_date != undefined) {
      modules.start_date = start_date;
    }
    if (end_date != "" && end_date != undefined) {
      modules.end_date = end_date;
    }

    await modules.save().then(function () {
      console.log("a module has been updated");
    });
    for (var i = 0; i < to_add.length; i++) {
      const tu = new TaskUser();
      tu.task_id = modules.id;
      tu.user_id = parseInt(to_add[i]);
      await tu.save().then(function () {
        console.log("a user task has been add");
      });
    }
    for (var i = 0; i < to_del.length; i++) {
      const taskUser = await TaskUser.findBy({
        user_id: to_del[i],
        task_id: modules.id,
      });
      await taskUser
        .delete()
        .then((data) => {
          console.log("deleted");
        })
        .catch((e) => {
          console.log(e);
        });
    }

    return response.redirect("/project/" + modules.project_id + "/module/");
  }

  async delete({ response, auth, view, params }) {
    const { id } = params;

    const module = await Task.find(id);
    await module
      .delete()
      .then((data) => {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }
}

function arr_diff(a1, a2) {
  return a1.filter((x) => !a2.includes(x));
}

function dateMaker(d) {
  var date = new Date(d);
  var day = date.getDate();
  var month = date.getMonth() + 1 + "";
  if (month.length == 1) {
    month = "0" + month;
  }
  var year = date.getFullYear();
  return day + "/" + month + "/" + year;
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
module.exports = ModuleController;
