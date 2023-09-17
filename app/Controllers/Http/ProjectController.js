"use strict";
var moment = require("moment");
const Database = use("Database");
const User = use("App/Models/User");
const Project = use("App/Models/Project");
const TechPro = use("App/Models/TechPro");
const Hash = use("Hash");

class ProjectController {
  
  async index({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      const tech_id = params.tech_id;
      var tech = "";
      var projects = Database.select(
        "projects.*",
        Database.raw("teams.name as team"),
        Database.raw('CONCAT(users.firstname, " ",users.familyname) as leader')
      )
        .from("projects")
        .innerJoin("teams", "projects.team_id", "teams.id")
        .innerJoin("users", "projects.leader_id", "users.id");
      if (tech_id != undefined && tech_id != null) {
        projects = projects
          .innerJoin("tech_pros", "tech_pros.project_id", "projects.id")
          .innerJoin(
            "technologies",
            "tech_pros.technology_id",
            "technologies.id"
          )
          .where("technologies.id", tech_id)
          .groupBy("projects.id");
        const technologies = await Database.from("technologies").where(
          "technologies.id",
          tech_id
        );
        tech = "with " + technologies[0].name;
      }
      projects = await projects;
      for (var i = 0; i < projects.length; i++) {
        var status = "";
        var start = new Date(projects[i].start_date);
        var end = new Date(projects[i].end_date);
        var current = new Date();

        if (start > current) {
          status = "haven't started yet";
        } else {
          if (
            projects[i].actual_date == undefined ||
            projects[i].actual_date == null
          ) {
            var finished = await Database.select(
              Database.raw("SUM(weight) as val")
            )
              .from("sub_tasks")
              .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
              .innerJoin("projects", "tasks.project_id", "projects.id")
              .where("projects.id", projects[i].id)
              .whereNotNull("sub_tasks.actual_date")
              .groupBy("projects.id");
            var total = await Database.select(
              Database.raw("SUM(weight) as val")
            )
              .from("sub_tasks")
              .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
              .innerJoin("projects", "tasks.project_id", "projects.id")
              .where("projects.id", projects[i].id)
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
        projects[i].status = status;
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.project.index", {
        projects: projects,
        img: i,
        myname: n,
        myrole: user.role,
        tech: tech,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  /* ********************************************************** */

  async myIndex({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const projects = await Database.select(
        "projects.*",
        Database.raw("teams.name as team"),
        Database.raw('CONCAT(users.firstname, " ",users.familyname) as leader')
      )
        .from("projects")
        .innerJoin("teams", "projects.team_id", "teams.id")
        .innerJoin("users", "projects.leader_id", "users.id")
        .innerJoin("team_users", "team_users.team_id", "teams.id")
        .where("users.id", user.id)
        .orWhere("team_users.user_id", user.id)
        .groupBy("projects.id");

      for (var i = 0; i < projects.length; i++) {
        var status = "";
        var start = new Date(projects[i].start_date);
        var end = new Date(projects[i].end_date);
        var current = new Date();
        if (start > current) {
          status = "haven't started yet";
        } else {
          if (
            projects[i].actual_date == undefined ||
            projects[i].actual_date == null
          ) {
            status = "In progress";
          } else {
            status = "finished";
          }
        }
        var finished = await Database.select(Database.raw("SUM(weight) as val"))
          .from("sub_tasks")
          .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
          .innerJoin("projects", "tasks.project_id", "projects.id")
          .where("projects.id", projects[i].id)
          .whereNotNull("sub_tasks.actual_date")
          .groupBy("projects.id");
        var total = await Database.select(Database.raw("SUM(weight) as val"))
          .from("sub_tasks")
          .innerJoin("tasks", "tasks.id", "sub_tasks.task_id")
          .innerJoin("projects", "tasks.project_id", "projects.id")
          .where("projects.id", projects[i].id)
          .groupBy("projects.id");

          console.log("total => ", total);
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

        projects[i].prog = Math.ceil(prog);
        projects[i].status = status;
        if (
          projects[i].description != undefined &&
          projects[i].description != null
        ) {
          projects[i].description = projects[i].description.substring(0, 255);
        }
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var int;
      if (user.role == "int" || user.role == "emp") {
        int = true;
      }
      return view.render("dashboard.project.myIndex", {
        projects: projects,
        img: i,
        myname: n,
        myrole: user.role,
        restriction: int,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /* ********************************************************** */

  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm" || user.role == "tl") {
      // const users = await Database.from("users");
      const users = await Database.from("users").where("role", "=", "tl");
      const teams = await Database.from("teams");
      const technologies = await Database.from("technologies");
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.project.create", {
        users: users,
        teams: teams,
        technologies: technologies,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else if (user.role == "int" || user.role == "emp") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async store({ request, response, auth }) {
    const user = await auth.getUser();

    const {
      type,
      name,
      git_link,
      start_date,
      end_date,
      leader_id,
      team_id,
      technologies,
      description,
    } = request.all();

    const project = new Project();
    if (name != "" && name != undefined) project.name = name;

    if (type != "" && type != undefined) project.type = type;

    if (git_link != "" && git_link != undefined) project.git_link = git_link;

    if (start_date != "" && start_date != undefined)
      project.start_date = start_date;

    if (end_date != "" && end_date != undefined) project.end_date = end_date;

    if (user.role == "tl") project.leader_id = user.id;

    if (leader_id != "" && leader_id != undefined)
      project.leader_id = leader_id;

    if (team_id != "" && team_id != undefined) project.team_id = team_id;

    if (description != "" && description != undefined)
      project.description = description;

    await project.save().then(function () {
      console.log("a team has been add");
    });
    for (var i = 0; i < technologies.length; i++) {
      const tp = new TechPro();
      tp.project_id = project.id;
      tp.technology_id = technologies[i];
      await tp.save().then(function () {
        console.log("a Tech Pro has been add");
      });
    }

    return response.redirect("/myprojects");
  }
  /************************************************************************** */

  async validate({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm" || user.role == "tl") {
      const project_id = params.project_id;
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.project.validate", {
        project_id: project_id,
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

    const project_id = params.project_id;
    const project = await Project.find(project_id);
    project.actual_date = actual_date;
    await project.save().then(function () {
      console.log("A project has been updated");
    });
    return response.redirect("/project/" + project_id + "/module/");
  }
  /************************************************************************** */

  async delete({ response, request, view, params }) {
    const { id } = params;

    const project = await Project.find(id);
    await project
      .delete()
      .then((data) => {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }

  async edit({ resolve, auth, view, params }) {
    const user = await auth.getUser();

    if (user.role == "adm" || user.role == "tl") {
      const users = await Database.from("users");
      const teams = await Database.from("teams");
      const technologies = await Database.from("technologies");

      const project_id = params.project_id;
      const projects = await Database.select(
        "projects.*",
        Database.raw("GROUP_CONCAT(technologies.id) as tech")
      )
        .from("projects")
        .leftJoin("tech_pros", "tech_pros.project_id", "projects.id")
        .leftJoin("technologies", "tech_pros.technology_id", "technologies.id")
        .where("projects.id", project_id);
      var project = projects[0];
      console.log(projects);
      project.start_date = dateInputMaker(project.start_date);
      project.end_date = dateInputMaker(project.end_date);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;

      return view.render("dashboard.project.update", {
        project: project,
        img: i,
        myname: n,
        teams: teams,
        user: user,
        users: users,
        myrole: user.role,
        technologies: technologies,
      });
    } else if (user.role == "int" || user.role == "emp") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async update({ request, response, auth, params }) {
    const user = await auth.getUser();

    const {
      name,
      start_date,
      end_date,
      description,
      type,
      git_link,
      img,
      team_id,
      leader_id,
      technologies,
      oldtech,
    } = request.all();
    const project_id = params.project_id;
    const projects = await Project.find(project_id);

    if (user.role == "tl") {
      projects.leader_id = user.id;
    }
    var x;
    if (oldtech == "null") {
      x = [];
    } else {
      x = oldtech.split(",");
    }
    var y;
    if (Array.isArray(technologies) == false) {
      var y = [];
      y.push(technologies);
    } else {
      y = technologies;
    }
    var to_del = arr_diff(x, y);
    var to_add = arr_diff(y, x);
    if (name != "" && name != undefined) {
      projects.name = name;
    }

    if (type != "" && type != undefined) {
      projects.type = type;
    }
    if (git_link != "" && git_link != undefined) {
      projects.git_link = git_link;
    }
    if (start_date != "" && start_date != undefined) {
      projects.start_date = start_date;
    }
    if (end_date != "" && end_date != undefined) {
      projects.end_date = end_date;
    }

    if (img != "" && img != undefined) {
      projects.img = img;
    }
    if (description != "" && description != undefined) {
      projects.description = description;
    }
    if (team_id != "" && team_id != undefined) {
      projects.team_id = team_id;
    }
    if (leader_id != "" && leader_id != undefined) {
      projects.leader_id = leader_id;
    }

    await projects.save().then(function () {
      console.log("a project has been add");
    });

    for (var i = 0; i < to_add.length; i++) {
      const tp = new TechPro();
      tp.project_id = projects.id;
      tp.technology_id = to_add[i];
      console.log("to add => " + to_add);
      console.log("to del => " + to_del);
      await tp.save().then(function () {
        console.log("a Tech Pro has been add");
      });
    }
    for (var i = 0; i < to_del.length; i++) {
      const techPro = await TechPro.findBy({
        technology_id: to_del[i],
        project_id: project_id,
      });
      await techPro
        .delete()
        .then((data) => {
          console.log("deleted");
        })
        .catch((e) => {
          console.log(e);
        });
    }

    return response.redirect("/project");
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

function arr_diff(a1, a2) {
  return a1.filter((x) => !a2.includes(x));
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

module.exports = ProjectController;
