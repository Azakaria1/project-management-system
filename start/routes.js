'use strict'

const { route } = require('@adonisjs/framework/src/Route/Manager');

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
Route.get("/reset/:id/:password", "AuthenticatorController.reset").middleware(["auth", "rememberMe"]);
Route.get("/register", "UserController.create");
Route.get("/", "AuthenticatorController.login");
Route.get("/404", "EhandlerController.404");
Route.post("/login", "UserController.login");
Route.post("/register", "UserController.register");
/* account */
Route.post("/account/edit", "AccountController.update").middleware(["auth", "rememberMe"]);
Route.get("/myaccount", "AccountController.edit").middleware(["auth", "rememberMe"]);
Route.get("/search_lists", "AccountController.search_lists");
Route.post("/uploadimage/:id", "AccountController.uploadImage");
Route.post("/addtrello", "AccountController.addtrello");
/* admin */
Route.get("/index", "DashboardController.index").middleware(["auth", "rememberMe"]);
Route.get("/calendar", "CalendarController.index").middleware(["auth", "rememberMe"]);
Route.post("/edit_canvan", "DashboardController.edit").middleware(["auth", "rememberMe"]);
Route.get("/move_canvan", "DashboardController.move").middleware(["auth", "rememberMe"]);
Route.get("/add_canvan", "DashboardController.add").middleware(["auth", "rememberMe"]);
/* staff */
Route.group(() => {
    Route.get("/index", "StaffController.index").as("staff_index");
    Route.get("/:staff_id/edit", "StaffController.edit_staff").as("staff_edit");
    Route.get("/:staff_id/profil", "StaffController.profil").as("profil");
    Route.post("/:staff_id/update", "StaffController.update_staff").as("update_staff");
    Route.get("/delete/:id", "StaffController.delete").as("delete_staff");
    Route.get("/usertasks/:type?", "StaffController.userTasks");
}).prefix("/staff").middleware(["auth", "rememberMe"]);
Route.group(() => {
    /* projects */
    Route.get("/", "ProjectController.index").as("project_index");
    Route.get("/add", "ProjectController.create").as("project_create");
    Route.post("/add", "ProjectController.store").as("project_store");
    Route.get(":project_id/validate", "ProjectController.validate").as("project_validate").middleware(["auth", "rememberMe"]);
    Route.post(":project_id/finish", "ProjectController.finish").as("project_finish").middleware(["auth", "rememberMe"]);
    Route.get("/delete/:id", "ProjectController.delete").as("delete_project");
    Route.get(":project_id/edit", "ProjectController.edit").as("project_edit");
    Route.post(":project_id/update", "ProjectController.update").as("project_update");
    /* module */

    Route.get(":id/module", "ModuleController.index").as("module_index");
    Route.get(":id/add_module", "ModuleController.create").as("module_create");
    Route.post(":id/add_module", "ModuleController.store").as("module_store");
    Route.get(":id_pro/module/:module_id/validate", "ModuleController.validate").as("module_validate").middleware(["auth", "rememberMe"]);
    Route.post(":id_pro/module/:module_id/finish", "ModuleController.finish").as("module_finish").middleware(["auth", "rememberMe"]);

    /* tasks */

    Route.get(":id_pro/module/:id_mod/task", "TaskController.index").as("task_index");
    Route.get(":id_pro/module/:id_mod/add_module", "TaskController.create").as("task_create");
    Route.post(":id_pro/module/:id_mod/add_module", "TaskController.store").as("task_store");


}).prefix("/project").middleware(["auth", "rememberMe"]);

/* module */
Route.get("/module/:module_id/update", "ModuleController.edit").as("module_edit");
Route.post("/module/:module_id/update", "ModuleController.update").as("module_update");
Route.get("/module/delete/:id", "ModuleController.delete").as("delete_project");
/* my project */
Route.get("/myprojects", "ProjectController.myIndex").middleware(["auth", "rememberMe"]);

/* tasks */
Route.get("/task", "TaskController.index2").middleware(["auth", "rememberMe"]);
Route.post("task/search", "TaskController.search").middleware(["auth", "rememberMe"]);
Route.get("/task/:task_id/details", "TaskController.details").as("task_details").middleware(["auth", "rememberMe"]);
Route.get("/task/:task_id/validate", "TaskController.validate").as("task_validate").middleware(["auth", "rememberMe"]);
Route.post("/task/:task_id/finish", "TaskController.finish").as("task_finish").middleware(["auth", "rememberMe"]);
Route.get("/task/add", "TaskController.create2").middleware(["auth", "rememberMe"]);
Route.post("/task/store", "TaskController.store2").middleware(["auth", "rememberMe"]);
Route.get("/task/:task_id/errors", "ErrorController.index2").as("error_list").middleware(["auth", "rememberMe"]);
Route.get("/task/delete/:id", "TaskController.delete").as("delete_task").middleware(["auth", "rememberMe"]);
Route.get("/task/:task_id/edit", "TaskController.edit").as("task_edit").middleware(["auth", "rememberMe"]);
Route.post("/task/:task_id/update", "TaskController.update").as("task_update").middleware(["auth", "rememberMe"]);
/* errors */
Route.group(() => {
    Route.get("/index", "ErrorController.index").as("error_index");
    Route.get("/task/:task_id/add", "ErrorController.create").as("error_create");
    Route.post("/task/:task_id/store", "ErrorController.store").as("error_store");
    Route.get("/:error_id/edit", "ErrorController.edit").as("error_edit");
    Route.post("/:error_id/update", "ErrorController.update").as("error_update");
    Route.get("/:error_id/solve", "ErrorController.solving").as("error_solving");
    Route.post("/:error_id/solve", "ErrorController.solve").as("error_solve");
    Route.get("/:error_id/details", "ErrorController.details").as("error_details");
    Route.get("/delete/:id", "ErrorController.delete");
}).prefix("/error").middleware(["auth", "rememberMe"]);
/* teams */
Route.get("/team", "TeamController.index").middleware(["auth", "rememberMe"]);
Route.get("/myteam", "TeamController.myteam").middleware(["auth", "rememberMe"]);
Route.get("/add_team", "TeamController.create").middleware(["auth", "rememberMe"]);
Route.post("/add_team", "TeamController.store").middleware(["auth", "rememberMe"]);
Route.get("/team/delete/:id", "TeamController.delete").middleware(["auth", "rememberMe"]);
Route.get("/team/:team_id/update", "TeamController.edit").as("team_edit").middleware(["auth", "rememberMe"]);
Route.post("/team/:team_id/update", "TeamController.update").as("team_update").middleware(["auth", "rememberMe"]);

/* technologies */
Route.get("/technology", "TechnologyController.index").middleware(["auth", "rememberMe"]);
Route.get("/add_technology", "TechnologyController.create").middleware(["auth", "rememberMe"]);
Route.post("/add_technology", "TechnologyController.store").middleware(["auth", "rememberMe"]);
Route.get("/technology/:technology_id/update", "TechnologyController.edit").as("technology_edit").middleware(["auth", "rememberMe"]);
Route.post("/technology/:technology_id/update", "TechnologyController.update").as("technology_update").middleware(["auth", "rememberMe"]);
Route.get("/technology/delete/:id", "TechnologyController.delete").middleware(["auth", "rememberMe"]);
Route.get("/technology/:tech_id/projects", "ProjectController.index").as("technology_project").middleware(["auth", "rememberMe"]);

/* staff */
Route.get("/index_staff", "DashboardController.index").middleware(["auth"]);
/* inv */
Route.get("/inv", "DashboardController.index").middleware(["auth", "rememberMe"]);
Route.get("/logout", async ({ auth, response, session }) => {
    const user = await auth.getUser();

    await auth.logout();
    
    session.clear(); 
    
    response.clearCookie('remember_token');

    response.clearCookie('adonis-session');

    return response.redirect("/");
});