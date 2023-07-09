$(document).ready(function () {
    var kanban_curr_el, kanban_curr_item_id, kanban_item_title, kanban_data, kanban_item, kanban_users, kanban_curr_item_date;
    // Kanban Board and Item Data passed by json
    var kanban_board_data = JSON.parse(document.getElementById("data").value);
    // Kanban Board
    var KanbanExample = new jKanban({
        element: "#kanban-app", // selector of the kanban container
        buttonContent: "+ Add New Task", // text or html content of the board button
        widthBoard: '300px',
        // click on current kanban-item
        click: function (el) {
            // kanban-overlay and sidebar display block on click of kanban-item
            $(".kanban-overlay").addClass("show");
            $(".kanban-sidebar").addClass("show");

            // Set el to var kanban_curr_el, use this variable when updating title
            kanban_curr_el = el;

            // Extract  the kan ban item & id and set it to respective vars
            kanban_item_title = $(el).contents()[0].data;
            kanban_curr_item_id = $(el).attr("data-eid");
            kanban_curr_item_date = $(el).contents()[0].parentElement.dataset.duedate;
            console.log(kanban_curr_item_date)
            // set edit title
            $(".edit-kanban-item .edit-kanban-item-title").val(kanban_item_title);
            document.getElementById('edit-item-date').value = kanban_curr_item_date;
            document.getElementById('edit-item-hidden').value = kanban_curr_item_id;
        },
        dropEl: function(el, target, source, sibling){
      
            var id = target.parentElement.getAttribute('data-id');
            var eid = $(el).contents()[0].parentElement.dataset.eid
            $.ajax({  
                url:'/move_canvan',  
                method:'get',  
                dataType:'json',
                data:{id,eid},  
                success:function(response){  
                    if(response.data=='yes'){  
                        console.log("yeees")
                    }
                },  
                error:function(response){  
                    console.log(response)
                }  
            });
            
          },
        buttonClick: function (el, boardId) {
            // create a form to add add new element
            var formItem = document.createElement("form");
            formItem.setAttribute("class", "itemform");
            formItem.innerHTML =
                '<div class="container"><div class="form-group row"><div class="col-md-12">' +
                '<textarea class="form-control add-new-item" placeholder="Your task name" rows="1" autofocus required></textarea>' +
                "</div></div> " +
                '<div class="form-group row"><div class="col-md-12">' +
                '<input class="form-control add-new-date" name="date" type="date" required>' +
                "</div></div> " +
                '<div class="form-group row display-flex"><div class="col-md-12">' +
                '<button type="submit" class="btn btn-primary waves-effect waves-light btn-small mr-2"><i class="bx bx-plus">add</i></button>' +
                '<button type="button" id="CancelBtn" class=" btn btn-secondary waves-effect btn-floating btn-small"><i class="material-icons">clear</i></button>' +
                "</div></div></div>";

            // add new item on submit click
            KanbanExample.addForm(boardId, formItem);
            formItem.addEventListener("submit", function (e) {
                //here
                e.preventDefault();
                var text = e.target[0].value;
                var date = e.target[1].value;
                var id = boardId
                $.ajax({  
                    url:'/add_canvan',  
                    method:'get',  
                    dataType:'json',
                    data:{text,id,date},  
                    success:function(response){  
                        if(response.data=='yes'){  
                            console.log("yeees")
                        }
                    },  
                    error:function(response){  
                        console.log(response)
                    }  
                });
                KanbanExample.addElement(boardId, {
                    title: text
                });
                formItem.parentNode.removeChild(formItem);
            });
            $(document).on("click", "#CancelBtn", function () {
                $(this).closest(formItem).remove();
            })
        },
        addItemButton: true, // add a button to board for easy item creation
        boards: kanban_board_data // data passed from defined variable
    });

    // Add html for Custom Data-attribute to Kanban item
    var board_item_id, board_item_el;
    // Kanban board loop

    for (kanban_data in kanban_board_data) {
        // Kanban board items loop
        for (kanban_item in kanban_board_data[kanban_data].item) {

            var board_item_details = kanban_board_data[kanban_data].item[kanban_item]; // set item details
            board_item_id = $(board_item_details).attr("id"); // set 'id' attribute of kanban-item

            (board_item_el = KanbanExample.findElement(board_item_id)), // find element of kanban-item by ID
                (board_item_users = board_item_dueDate = board_item_comment = board_item_attachment = board_item_image = board_item_badge =
                    " ");


            // check if dueDate is defined or not
            if (typeof $(board_item_el).attr("data-dueDate") !== "undefined") {
                board_item_dueDate =
                    '<div class="kanban-due-date center lighten-5 ' + $(board_item_el).attr("data-border") + '"><span class="' + $(board_item_el).attr("data-border") + '-text center"> ' +
                    $(board_item_el).attr("data-dueDate") +
                    "</span>" +
                    "</div>";
            }


            // check if Badge is defined or not
            if (typeof $(board_item_el).attr("data-badgeContent") !== "undefined") {
                board_item_badge =
                    '<div class="kanban-badge circle lighten-4 ' +
                    kanban_board_data[kanban_data].item[kanban_item].badgeColor +
                    '">' +
                    '<span class="' + kanban_board_data[kanban_data].item[kanban_item].badgeColor + '-text">' +
                    kanban_board_data[kanban_data].item[kanban_item].badgeContent +
                    "</span>";
                ("</div>");
            }
            // add custom 'kanban-footer'
            if (
                typeof (
                    $(board_item_el).attr("data-dueDate") 
                ) !== "undefined"
            ) {
                $(board_item_el).append(
                    '<div class="kanban-footer mt-1">' +
                    board_item_dueDate +
                    

                    board_item_badge +

                    "</div>"
                );
            }

        }
    }
    kanban_board_data.map(function (obj) {
        $(".kanban-board[data-id='" + obj.id + "']").find(".kanban-board-header").addClass(obj.headerBg)
    })

    

    // Kanban-overlay and sidebar hide
    // --------------------------------------------
    $(
        ".kanban-sidebar .delete-kanban-item, .kanban-sidebar .close-icon, .kanban-sidebar .update-kanban-item, .kanban-overlay"
    ).on("click", function () {
        $(".kanban-overlay").removeClass("show");
        $(".kanban-sidebar").removeClass("show");
    });

    // Delete Kanban Item
    
    
    $(".edit-kanban-item").on("submit", function(e) {
        e.preventDefault();
        var title = $( "#edit-item-title" ).val()
        var date = $( "#edit-item-date" ).val()
        var id = $( "#edit-item-hidden" ).val()
        //here
        $.ajax({  
            url:'/edit_canvan',  
            method:'post',  
            dataType:'json',
            headers: {'x-csrf-token': $('[name=csrf_token]').val()}, 
            data:{id,date,title},  
            success:function(response){  
                if(response.data=='yes'){  
                    console.log("yeees")
                    location.reload(); 
                }
            },  
            error:function(response){  
                console.log(response)
            }  
        });
    });
    

    // Making Title of Board editable
    // ------------------------------
    $(document).on("mouseenter", ".kanban-title-board", function () {
        $(this).attr("contenteditable", "true");
        $(this).addClass("line-ellipsis");
    });
    // Perfect Scrollbar - card-content on kanban-sidebar
    if ($(".kanban-sidebar").length > 0) {
        var ps_sidebar = new PerfectScrollbar(".kanban-sidebar", {
            theme: "dark",
            wheelPropagation: false
        });
    }
    // set unique id on all dropdown trigger
    for (var i = 1; i <= $(".kanban-board").length; i++) {
        $(".kanban-board[data-id='" + i + "']").find(".kanban-board-header .dropdown-trigger").attr("data-target", i);
        $(".kanban-board[data-id='" + i + "']").find("ul").attr("id", i);
    }
    // materialise dropdown initialize
    $('.dropdown-trigger').dropdown({
        constrainWidth: false
    });
});
$(window).on('resize', function () {
    // sidebar display none on screen resize
    $(".kanban-sidebar").removeClass("show");
    $(".kanban-overlay").removeClass("show");
});