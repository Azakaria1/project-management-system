function cleant(id) {

    "use strict";


    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        type: "warning",
        showCancelButton: !0,
        confirmButtonColor: "#34c38f",
        cancelButtonColor: "#f46a6a",
        confirmButtonText: "Yes, delete it!"
    }).then(function(t) {
        if (t.value) {
            $.ajax({
                url: '/module/delete/' + id,
                method: 'get',
                success: function(response) {
                    if (response.data == "yes") {
                        Swal.fire({
                            title: "a task has been deleted",
                            type: "success",
                        }).then(function(t) {
                            location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: "erreur!",
                            text: response.data,
                            type: "error",
                        });

                    }
                },
                error: function(response) {
                    Swal.fire({
                        title: "erreur!",
                        text: "Erreur d'enregistrement",
                        type: "error",
                    });
                }
            });
        }

    })




};