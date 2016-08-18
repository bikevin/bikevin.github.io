/**
 * Created by kevin on 8/16/16.
 */

function bindToTable(element, data){
    
    var options = {
        rowHeaders: true,
        colHeaders: true
    };
    
    options['data'] = data;

    new Handsontable(element, options);
}

function transpose(a) {
    return Object.keys(a[0]).map(
        function (c) { return a.map(function (r) { return r[c]; }); }
    );
}

function isCategorical(data){

    data = transpose(data);

    var categorical = new Array(data.length);

    $.each(data, function(index, value){

        var allNumeric = 1;

        $.each(value, function(innerIndex, innerValue){

           if(!$.isNumeric(innerValue)){
               allNumeric *= 0;
           }
        });

        categorical[index] = allNumeric != 1;


    });

    return categorical;
}

function toFinalData(preData, categorical){
    
}