"use strict";

const Database = use("Database");

class CalenderController {
    
    async index({ response, auth, view, params }) {
        const user = await auth.getUser()
        const tasks = await Database.select('sub_tasks.*').from('sub_tasks')
      .innerJoin('sub_task_users', 'sub_task_users.sub_task_id', 'sub_tasks.id')
      .where('sub_task_users.user_id',user.id ).where('sub_tasks.status',"pg")
      .orderBy('sub_tasks.created_at','desc');
      var mytasks = []
      for(var i=0;i<tasks.length;i++){
        var task = {}
        task.start = dateMaker(tasks[i].start_date)
        task.end = dateMaker(tasks[i].end_date)
        task.title = tasks[i].name
        task.id = tasks[i].id
        task.url = "/task/" + tasks[i].id + "/details"
        mytasks.push(task)
      }
      var i = user.img
      var n = user.firstname + " " + user.familyname
      var r
      if (user.role != 'adm') {
          r = 'x'
      }
      console.log(JSON.stringify(mytasks))
        return view.render("dashboard.calendar.index",
        {mytasks:JSON.stringify(mytasks),               
             img: i,
            myname: n,
            myrole: r,});
    }
}
function dateMaker(d){
    var date = new Date(d)
    var day = date.getDate()+''
    var month = (date.getMonth()+1)+''
    if (month.length ==1){
      month = '0'+ month
    }
    if (day.length ==1){
      day = '0'+ day
    }
    var year = date.getFullYear()
    return  year + "-" +   month+ "-" + day
  
  }
module.exports = CalenderController;