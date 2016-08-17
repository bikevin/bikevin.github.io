/**
 * Created by Kevin on 8/16/2016.
 */

var _data = [];


$(document).ready(function(){

    $("#demoStart").click(function(){
        $("#chooseStart").show();
        startDemo();
        $("#tableRow").show();
        $("#dataTable").height('500px');
        $(this).hide();
    });

    $("#chooseStart").click(function(){
        $(this).hide();
        $("#choose, #buildDialog").show();
        populateUnused();
    });

    $("#allIndependent").click(function(){
        $("#choose").find('#unused div.list-group-item').appendTo($("#predictors"));
    });

    $("#resetUnused").click(function(){
        $("#choose").find('div.list-group-item:not(.listHeader)').appendTo($("#unused"));
    });
    
    $("#buildStart").click(function(){
        buildCategoryChecker();
    });
    
    

});

function startDemo(){

    Papa.parse('boston_data.txt', {
        download:true,
        complete: function(results, file){

            $.each(results['data'], function(index, value){
               results['data'][index] = value.filter(function(n){return n.length != 0});
            });

            results['data'] = results['data'].filter(function(n){return n.length != 0;});

            bindToTable($("#dataTable")[0], results['data']);

            _data = results['data'];
        },
        delimiter: " ",
        dynamicTyping: true
    });

}

function populateUnused(){

    var length = _data[0].length;

    var unused = $("#unused");

    var choose = $("#choose");

    for(var i = 0; i < length; i++){

        var base = $("<div class='list-group-item'>").appendTo(unused);

        var div = $("<div>").appendTo(base);

        var left = $("<a class='left'>").appendTo(div);

        $("<i class='fa fa-chevron-left fa-lg'>").appendTo(left);

        $("<span>").text(i + 1).appendTo(div);

        var right = $("<a class='right'>").appendTo(div);

        $("<i class='fa fa-chevron-right fa-lg'>").appendTo(right);
    }

    choose.find('i.fa-chevron-left').parent('a').click(function(){
        var text = $(this).parents('.list-group').find('.listHeader span:not(.defaultFont)').text();
        if(text == "Unused"){
            $(this).parents('.list-group-item').appendTo($('#predictors'));
        } else {
            $(this).parents('.list-group-item').appendTo($('#unused'));
        }

    });
    choose.find('i.fa-chevron-right').parent('a').click(function(){
        var text = $(this).parents('.list-group').find('.listHeader span:not(.defaultFont)').text();

        if(text == "Unused"){
            $(this).parents('.list-group-item').appendTo($('#predicted'));
        } else {
            $(this).parents('.list-group-item').appendTo($('#unused'));
        }

    });
}

function buildCategoryChecker(){
    var categorical = isCategorical(_data);

    var indepBase = $("#indepChecker");
    var depBase = $("#depChecker");

    var predictors = $("#predictors").find('.list-group-item:not(.listHeader) span');
    var predicted = $("#predicted").find('.list-group-item:not(.listHeader) span');

    if(predictors.length == 0){
        alert('You need independent variables!');
        return -1;
    } else if(predicted.length == 0){
        alert('You need dependent variables!');
        return -1;
    } else {
        $("#networkBuild").show();
        $("#buildDialog").hide();
    }


    for(var i = 0; i < predictors.length; i++){

        var div = $("<div>").appendTo(
            $("<div class='list-group-item'>").appendTo(indepBase));

        $("<span>").text($(predictors[i]).text()).appendTo(div);

        var radioDiv = $("<div class='right'>").appendTo(div);

        var label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio'>")
            .attr('id', $(predictors[i]).text()).attr('name', i).appendTo(label);

        $("<span>").text('Categorical').appendTo(label);

        $("<div style='width: 5px'>").appendTo(div);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='continuous'>")
            .attr('id', $(predictors[i]).text()).attr('name', i).appendTo(label);

        $("<span>").text('Continuous').appendTo(label);
    }

    for(i = 0; i < predicted.length; i++){
        div = $("<div>").appendTo(
            $("<div class='list-group-item'>").appendTo(depBase));

        $("<span>").text($(predictors[i]).text()).appendTo(div);

        radioDiv = $("<div class='right'>").appendTo(div);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='categorical'>")
            .attr('id', $(predictors[i]).text()).attr('name', i).appendTo(label);

        $("<span>").text('Categorical').appendTo(label);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='continuous'>")
            .attr('id', $(predictors[i]).text()).attr('name', i).appendTo(label);

        $("<span>").text('Continuous').appendTo(label);
    }





}