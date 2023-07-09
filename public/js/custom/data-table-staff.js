/* Formatting function for row details - modify as you need */
function format ( d ) {
    // `d` is the original data object for the row
    
    var table =  '<table class="table table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">'
    for(var i =0;i<d.length;i++){
        var date
        if(d[i].end_date != null && d[i].end_date != undefined){
            date = d[i].end_date.split("T")[0]
        }
        else{
            date = ''
        }
        table = table +  '<tr>'+
            '<td>Task:</td>'+
            '<td>'+d[i].name+'</td>'+
            '<td>'+date+'</td>'+
        '</tr>'
    }
       

        table = table + '</table>';
    return table 
}

$(document).ready(function() {
    var table = $('#staff').DataTable( {
        "ajax": "/staff/usertasks/",
        "bFilter": false ,
        "columns": [
            {
                "className":      'details-control',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            },
            { "data": "fullname" },
            { "data": "role" },
            { "data": "phonenumber" },
            { "defaultContent": "<div style='text-align: center;'>"+
            "    <a  href='#' class='delete' data-toggle='tooltip' data-placement='top' title='delete'>"+
            "        <i class='mdi mdi-account-remove-outline font-size-22 align-middle mr-2'></i>"+
            "    </a>"+
            "    <a href='#' class='update' data-toggle='tooltip' data-placement='top' title='edit'>"+
            "        <i class='mdi mdi-account-edit-outline font-size-22 align-middle mr-2'></i>"+
            "    </a >"+
            "    <a href='#' class='profil' data-toggle='tooltip' data-placement='top' title='profil'>"+
            "        <i class=' mdi mdi-account-box-multiple-outline   font-size-22 align-middle mr-2'></i>"+
            "    </a >"+
            "</div>",
            
            
        
        },
        
        ],
        "order": [[1, 'asc']]
    } );
     
    // Add event listener for opening and closing details
    $('#staff tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
        //console.log(row.data());
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        
        else {
            // Open this row
            row.child( format(row.data().subTask) ).show();
            tr.addClass('shown');
        }
    } );
    $('#staff tbody').on( 'click', 'a.delete', function () {
        var data = table.row( $(this).parents('tr') ).data();
        var id = data.id;
        clean(id);
        //alert( data[0] +"'s salary is: "+ data[ 5 ] );
    } );
    $('#staff tbody').on( 'click', 'a.update', function () {
        var data = table.row( $(this).parents('tr') ).data();
        var id = data.id;
        window.location.href = '/staff/'+id+'/edit';
        //alert( data[0] +"'s salary is: "+ data[ 5 ] );
    } );
    $('#staff tbody').on( 'click', 'a.profil', function () {
        var data = table.row( $(this).parents('tr') ).data();
        var id = data.id;
        window.location.href = '/staff/'+id+'/profil';
        //alert( data[0] +"'s salary is: "+ data[ 5 ] );
    } );

    $( "#role" ).on('change', function() {
      table.ajax.url( '/staff/usertasks/'+ document.getElementById("role").value).load()
      //cleartable()
    });

} );