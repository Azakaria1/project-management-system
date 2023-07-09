"use strict";

const Database = use("Database");
const User = use('App/Models/User');
const Hash = use("Hash");
class StaffController {
    async index({ response, auth, view, params }) {
        const user = await auth.getUser()
        if (user.role == "adm") {
            //const users = await Database.from('users')
            var i = user.img
            var n = user.firstname + " " + user.familyname
            return view.render("dashboard.staff.index", {
                img: i,
                myname: n
            });
        } else if (user.role == "int" || user.role == "emp") {
            return response.redirect("/index");
        } else {
            return view.render("inv.index");
        }
    }
    async profil({ response, auth, view, params }) {
        const user = await auth.getUser()
        if (user.role == "adm") {
            const id = params.staff_id
            const users = await Database.from('users').where("id",id)
            var staff = users[0]
            var ii = user.img
            var n = user.firstname + " " + user.familyname
            if(staff.role=="adm"){
                staff.role = "Admin"
            }else if(staff.role=="int"){
                staff.role = "Intern"
            }else if(staff.role=="emp"){
                staff.role = "Employee"
            }else{
                staff.role = "No role yet"
            }
            const projects = await Database
        .select('projects.*', Database.raw('GROUP_CONCAT( DISTINCT technologies.name) as tech'),)
        .from('projects').innerJoin('teams', 'projects.team_id', 'teams.id')
        .innerJoin('users', 'projects.leader_id', 'users.id')
        .innerJoin('team_users', 'team_users.team_id', 'teams.id')
        .innerJoin('tech_pros', 'tech_pros.project_id', 'projects.id')
        .innerJoin('technologies', 'tech_pros.technology_id', 'technologies.id')
        .where('users.id',staff.id).orWhere('team_users.user_id', staff.id)
        .groupBy('projects.id')

    for (var i = 0; i < projects.length; i++) {
        var status = ''
        var start = new Date(projects[i].start_date)
        var current = new Date
        if (start > current) {
            status = "haven't started yet"
        } else {
            if (projects[i].actual_date == undefined || projects[i].actual_date == null) {
                status = "In progress"
            } else {

                status = "finished"

            }
        }

        projects[i].status = status
        projects[i].end_date = dateMaker(projects[i].end_date)

    }
            return view.render("dashboard.staff.profil", {
                user:staff,
                projects:projects,
                img: ii,
                myname: n
            });
        } else if (user.role == "int" || user.role == "emp") {
            return response.redirect("/index");
        } else {
            return view.render("inv.index");
        }
    }
    async userTasks({ response,params }) {
        const role = params.type
        try {
            var users =  User.query().with("subTask", builder =>{builder.where('status', 'pg').orWhere('status', 'td')})
            if(role != 'all' && role != undefined && role != null){
                users = users.where('role', role)
            }
            users = await users.fetch()
            users = users.toJSON()
            console.log(users.length)
            for(var i=0; i<users.length;i++){
                console.log(users[i].role)
                switch (users[i].role) {
                    case 'adm':
                        users[i].role = "Admin"
                        break;
                    case 'int':
                        users[i].role = "Intern"
                        break;
                    case 'emp':
                        users[i].role = "Employee"
                        break;
                    case 'not':
                        users[i].role = "Still not confirmed"
                        break;
                    default:
                        console.log('something wrong happend')
                }
                users[i].fullname = users[i].firstname+ " " + users[i].familyname
            }
            return response.status(200).send({ data: users })
        }
        catch (e) {
           console.log(e)
           return response.status(500).send({ data: "users" })
        }

    }


    async delete({ response, request, view, params }) {
        const { id } = params

        const user = await User.find(id)
        await user.delete()
            .then((data) => { return response.status(200).send({ data: 'yes' }) })
            .catch(e => {
                return response.status(500).json({ "error": e })
            });
    }

    async edit_staff({ response, auth, view, params }) {
        const user = await auth.getUser()
        if (user.role == "adm") {
            const staff_id = params.staff_id;
            const staff = await Database.from('users').where('users.id', staff_id)
            var i = user.img
            var n = user.firstname + " " + user.familyname
            return view.render("dashboard.staff.update", {
                staff: staff[0],
                img: i,
                myname: n
            });
        } else if (user.role == "int" || user.role == "emp") {
            return response.redirect("/index");
        } else {
            return view.render("inv.index");
        }
    }

    async update_staff({ request, auth, view, params, response }) {
        const user = await auth.getUser()
        if (user.role == "adm") {
            const { role } = request.all();

            const staff_id = params.staff_id;
            const staff = await User.find(staff_id)
            staff.role = role;
            await staff.save().then(function() {
                console.log("A user has been updated")
            });
            return response.redirect("/staff/index");
        } else if (user.role == "int" || user.role == "emp") {
            return response.redirect("/index");
        } else {
            return view.render("inv.index");
        }
    }

}
function dateMaker(d) {
    var date = new Date(d)
    var day = date.getDate()
    var month = (date.getMonth() + 1) + ''
    if (month.length == 1) {
        month = '0' + month
    }
    var year = date.getFullYear()
    return day + "-" + month + "-" + year

}
module.exports = StaffController;