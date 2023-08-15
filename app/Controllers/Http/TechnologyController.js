"use strict";

const Database = use("Database");
const User = use("App/Models/User");
const Technology = use("App/Models/Technology");
const Hash = use("Hash");
class TechnologyController {

  async index({ response, auth, view, params }) {
  
    const user = await auth.getUser();
    if (user.role == "adm") {
      const page = params.page ? params.page : 1;
      const technologies = await Database.select(
        "technologies.*",
        Database.raw("COUNT(DISTINCT projects.id) as projects"),
        Database.raw("COUNT(DISTINCT errors.id) as errors")
      )
        .from("technologies")
        .leftJoin("tech_pros", "tech_pros.technology_id", "technologies.id")
        .leftJoin("projects", "tech_pros.project_id", "projects.id")
        .leftJoin("errors", "errors.technology_id", "technologies.id")
        .groupBy("technologies.id");
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.technology.index", {
        technologies: technologies,
        page: page,
        user: user,
        img: i,
        myrole: user.role,
        myname: n,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.technology.create", {
        user: user,
        img: i,
        myrole: user.role,
        myname: n,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async store({ request, response, auth }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      const { name } = request.all();

      const technology = new Technology();
      if (name != "" && name != undefined) {
        technology.name = name;
      }
      await technology.save().then(function () {
        console.log("a technology has been add");
      });

      return response.redirect("/technology");
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async edit({ resolve, auth, view, params }) {
    const user = await auth.getUser();

    if (user.role == "adm") {
      const users = await Database.from("users");

      const technology_id = params.technology_id;
      const technologies = await Database.from("technologies").where(
        "technologies.id",
        technology_id
      );
      var technology = technologies[0];
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
     
      return view.render("dashboard.technology.update", {
        technology: technology,
        img: i,
        myrole: user.role,
        myname: n,
        users: users,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return view.render("team.index");
    } else {
      return view.render("inv.index");
    }
  }

  async update({ request, response, auth, params }) {
    const user = await auth.getUser();

    const { name } = request.all();
    const technology_id = params.technology_id;
    const technologies = await Technology.find(technology_id);

    if (name != "" && name != undefined) {
      technologies.name = name;
    }

    await technologies.save().then(function () {
      console.log("a technology has been updated");
    });

    return response.redirect("/technology");
  }

  async delete({ response, auth, view, params }) {
    const { id } = params;

    const technology = await Technology.find(id);
    await technology
      .delete()
      .then((data) => {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }
}

module.exports = TechnologyController;
