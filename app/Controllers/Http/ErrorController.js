"use strict";

const Database = use("Database");
const User = use("App/Models/User");
const Error = use("App/Models/Error");
const Hash = use("Hash");

class ErrorController {
  async index({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      var errors;
      if (user.role == "adm") {
        errors = await Database.select(
          "errors.*",
          Database.raw("technologies.name as technology")
        )
          .from("errors")
          .innerJoin("technologies", "technologies.id", "errors.technology_id");
      } else if (user.role == "tl") {
        errors = await Database.select("errors.*")
          .from("errors")
          .distinct()
          .leftJoin("sub_tasks", "sub_tasks.id", "errors.subtask_id")
          .leftJoin("tasks", "tasks.id", "sub_tasks.task_id")
          .leftJoin("projects", "projects.id", "tasks.project_id")
          .where("projects.leader_id", user.id);
      } else {
        errors = await Database.select(
          "errors.*",
          Database.raw("technologies.name as technology")
        )
          .from("errors")
          .innerJoin("technologies", "technologies.id", "errors.technology_id")
          .where("errors.user_id", user.id);
      }

      for (var i = 0; i < errors.length; i++) {
        errors[i].error_date = dateMaker(errors[i].error_date);
        if (errors[i].is_resolved == 1) {
          errors[i].status = "resolved";
        } else {
          errors[i].status = "not yet";
        }
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
     
      var isUserAuthorizedToModifyError = await Error.query()
        .where("user_id", user.id)
        .first();

      isUserAuthorizedToModifyError != null
        ? (isUserAuthorizedToModifyError = true)
        : (isUserAuthorizedToModifyError = false);

      console.table(isUserAuthorizedToModifyError);
      return view.render("dashboard.error.index", {
        errors: errors,
        img: i,
        myname: n,
        myrole: user.role,
        allowed: isUserAuthorizedToModifyError,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /************************************************ */
  async details({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const error_id = params.error_id;

      const errors = await Database.select(
        "errors.*",
        Database.raw(
          'CONCAT(users.firstname, " ", users.familyname, " ") as user'
        ),
        Database.raw("technologies.name as technology"),
        Database.raw("sub_tasks.name as task")
      )
        .from("errors")
        .innerJoin("technologies", "technologies.id", "errors.technology_id")
        .innerJoin("sub_tasks", "sub_tasks.id", "errors.subtask_id")
        .innerJoin("users", "users.id", "errors.user_id")
        .where("errors.id", error_id);
      for (var i = 0; i < errors.length; i++) {
        errors[i].error_date = dateMaker(errors[i].error_date);
        if (errors[i].is_resolved == 1) {
          errors[i].status = "resolved";
        } else {
          errors[i].status = "not yet";
        }
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      
      return view.render("dashboard.error.details", {
        error: errors[0],
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /************************************************ Substask Error */

  async index2({ response, auth, view, params }) {
    const user = await auth.getUser();

    if (user.role == "adm" || user.role == "int" || user.role == "emp") {
      const task_id = params.task_id;

      const errors = await Database.select(
        "errors.*",
        Database.raw("technologies.name as technology")
      )
        .from("errors")
        .innerJoin("technologies", "technologies.id", "errors.technology_id")
        .where("errors.subtask_id", task_id);

      for (var i = 0; i < errors.length; i++) {
        errors[i].error_date = dateMaker(errors[i].error_date);
        if (errors[i].is_resolved == 1) {
          errors[i].is_resolved = "resolved";
        } else {
          errors[i].is_resolved = "not yet";
        }
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      
      return view.render("dashboard.error.index", {
        errors: errors,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /************************************************ */
  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const task_id = params.task_id;
      const technologies = await Database.from("technologies");
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      
      return view.render("dashboard.error.create", {
        technologies: technologies,
        task_id: task_id,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }

  /************************************************* */
  async solving({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      const error_id = params.error_id;
   
      return view.render("dashboard.error.solve", {
        error_id: error_id,
        img: i,
        myname: n,
        myrole: user.role,
      });
    } else {
      return view.render("inv.index");
    }
  }
  /************************************************* */

  async solve({ request, auth, view, params, response }) {
    const user = await auth.getUser();

    const { resolve } = request.all();

    const error_id = params.error_id;
    const error = await Error.find(error_id);
    error.resolve = resolve;
    error.is_resolved = true;
    await error.save().then(function () {
      console.log("A error has been updated");
    });
    return response.redirect("/error/index");
  }

  /************************************************* */
  async store({ request, response, auth, params }) {
    const user = await auth.getUser();

    var {
      name,
      commit,
      error_date,
      technology,
      resolve,
      description,
      is_resolved,
    } = request.all();

    const error = new Error();
    const task_id = params.task_id;
    error.subtask_id = task_id;
    error.user_id = user.id;
    if (is_resolved) {
      is_resolved = true;
      if (resolve != "" && resolve != undefined) {
        error.resolve = resolve;
      }
    } else {
      is_resolved = false;
    }
    error.is_resolved = is_resolved;
    if (name != "" && name != undefined) {
      error.name = name;
    }
    if (technology != "" && technology != undefined) {
      error.technology_id = technology;
    }

    if (commit != "" && commit != undefined) {
      error.commit = commit;
    }
    if (error_date != "" && error_date != undefined) {
      error.error_date = error_date;
    }

    if (description != "" && description != undefined) {
      error.description = description;
    }

    await error.save().then(function () {
      console.log("a error has been add");
    });

    return response.redirect("/error/index");
  }

  /************************************ */

  async delete({ response, request, view, params }) {
    const { id } = params;

    const error = await Error.find(id);
    await error
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
      const error_id = params.error_id;
      const technologies = await Database.from("technologies");

      const errors = await Database.select(
        "errors.*",
        Database.raw(
          'CONCAT(users.firstname, " ", users.familyname, " ") as user'
        ),
        Database.raw("technologies.id as technology"),
        Database.raw("sub_tasks.name as task")
      )
        .from("errors")
        .innerJoin("technologies", "technologies.id", "errors.technology_id")
        .innerJoin("sub_tasks", "sub_tasks.id", "errors.subtask_id")
        .innerJoin("users", "users.id", "errors.user_id")
        .where("errors.id", error_id);

      console.log(errors[0]);
      for (var i = 0; i < errors.length; i++) {
        errors[i].error_date = dateInputMaker(errors[i].error_date);
      }
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
    
      return view.render("dashboard.error.update", {
        error: errors[0],
        error_id: error_id,
        technologies: technologies,
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

    var { name, commit, error_date, technology, description, resolve } =
      request.all();

    console.log(request.all());

    const error_id = params.error_id;
    const error = await Error.find(error_id);
    if (name != "" && name != undefined) {
      error.name = name;
    }
    if (technology != "" && technology != undefined) {
      error.technology_id = technology;
    }

    if (commit != "" && commit != undefined) {
      error.commit = commit;
    }
    if (error_date != "" && error_date != undefined) {
      error.error_date = error_date;
    }

    if (description != "" && description != undefined) {
      error.description = description;
    }
    if (resolve != "" && resolve != undefined) {
      error.resolve = resolve;
    }

    await error.save().then(function () {
      console.log("a error has been updated");
    });

    return response.redirect("/error/index");
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

module.exports = ErrorController;
