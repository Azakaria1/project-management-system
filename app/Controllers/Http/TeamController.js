"use strict";

const Database = use("Database");
const User = use("App/Models/User");
const Team = use("App/Models/Team");
const TeamUsers = use("App/Models/TeamUsers");
const Hash = use("Hash");
class TeamController {
  async index({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      const Teams = await Database.select(
        "teams.*",
        Database.raw(
          'GROUP_CONCAT(CONCAT(users.firstname, " ", users.familyname, " ") ) as members'
        )
      )
        .from("teams")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .leftJoin("users", "team_users.user_id", "users.id")
        .groupBy("teams.id");
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.team.index", {
        Teams: Teams,
        user: user,
        img: i,
        myname: n,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async myteam({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (
      user.role == "adm" ||
      user.role == "int" ||
      user.role == "emp" ||
      user.role == "tl"
    ) {
      const subquery = Database.select(Database.raw("teams.id as theid"))
        .from("teams")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .leftJoin("users", "team_users.user_id", "users.id")
        .where("users.id", user.id)
        .groupBy("teams.id");

      var Teams;

      const userTeams = await Database.select(
        "teams.*",
        Database.raw(
          'GROUP_CONCAT(CONCAT(users.firstname, " ", users.familyname, " ") ) as members'
        )
      )
        .from("teams")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .leftJoin("users", "team_users.user_id", "users.id")
        .whereIn("teams.id", subquery)
        .groupBy("teams.id");

      const leaderTeams = await Database.select(
        "teams.*",
        Database.raw(
          'GROUP_CONCAT(CONCAT(users.firstname, " ", users.familyname, " ") ) as members'
        )
      )
        .from("teams")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .leftJoin("users", "team_users.user_id", "users.id")
        .innerJoin("projects", "teams.id", "projects.team_id")
        .where("projects.leader_id", user.id)
        .groupBy("teams.id");
      user.role != "tl" ? (Teams = userTeams) : (Teams = leaderTeams);
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var r;
      var int;
      if (user.role == "adm" || user.role != "tl") {
        r = "x";
      }
      if (user.role == "int" || user.role == "emp") {
        int = true;
      }
      return view.render("dashboard.team.index", {
        Teams: Teams,
        user: user,
        img: i,
        myname: n,
        myrole: r,
        restriction: int,
      });
    } else {
      return view.render("inv.index");
    }
  }

  async create({ response, auth, view, params }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      const users = await Database.from("users");
      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      return view.render("dashboard.team.create", {
        users: users,
        user: user,
        img: i,
        myname: n,
      });
    } else if (user.role == "int" || user.role == "emp" || user.role == "tl") {
      return response.redirect("/index");
    } else {
      return view.render("inv.index");
    }
  }

  async delete({ response, auth, view, params }) {
    const { id } = params;

    const affectedRows = await Database.table("projects")
      .where("team_id", id)
      .update("team_id", null);

    const team = await Team.find(id);
    await team
      .delete()
      .then((data) => {
        return response.status(200).send({ data: "yes" });
      })
      .catch((e) => {
        return response.status(500).json({ error: e });
      });
  }

  async store({ request, response, auth }) {
    const user = await auth.getUser();
    if (user.role == "adm") {
      const { team, name } = request.all();

      const teams = new Team();
      if (name != "" && name != undefined) {
        teams.name = name;
      }
      await teams.save().then(function () {
        console.log("a team has been add");
      });
      for (var i = 0; i < team.length; i++) {
        const tu = new TeamUsers();
        tu.team_id = teams.id;
        tu.user_id = team[i];
        await tu.save().then(function () {
          console.log("a user team has been add");
        });
      }

      return response.redirect("/team");
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

      const team_id = params.team_id;
      const teams = await Database.select(
        "teams.*",
        Database.raw("GROUP_CONCAT(team_users.user_id) as users")
      )
        .from("teams")
        .leftJoin("team_users", "team_users.team_id", "teams.id")
        .where("teams.id", team_id);
      var team = teams[0];

      var i = user.img;
      var n = user.firstname + " " + user.familyname;
      var r;
      if (user.role != "adm") {
        r = "x";
      }
      return view.render("dashboard.team.update", {
        team: team,
        img: i,
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

    const { name, oldteam, team } = request.all();
    const team_id = params.team_id;
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

    console.log(to_del);
    console.log(to_add);
    const teams = await Team.find(team_id);

    if (name != "" && name != undefined) {
      teams.name = name;
    }

    await teams.save().then(function () {
      console.log("a team has been updated");
    });

    for (var i = 0; i < to_add.length; i++) {
      const tu = new TeamUsers();
      tu.team_id = teams.id;
      tu.user_id = to_add[i];
      await tu.save().then(function () {
        console.log("a Tech Pro has been add");
      });
    }
    for (var i = 0; i < to_del.length; i++) {
      const tu = await TeamUsers.findBy({
        user_id: to_del[i],
        team_id: teams.id,
      });
      await tu
        .delete()
        .then((data) => {
          console.log("deleted");
        })
        .catch((e) => {
          console.log(e);
        });
    }

    return response.redirect("/team");
  }
}
function arr_diff(a1, a2) {
  return a1.filter((x) => !a2.includes(x));
}
module.exports = TeamController;
