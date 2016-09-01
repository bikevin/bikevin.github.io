/**
 * Created by Kevin on 8/16/2016.
 */

var _data = [];
var _categorical = [];
var _table;
var _classes = [];
var _layerArray = [];
var _isinput = [];
var _network;
var _error = [];
var _errorMinMax = [Number.MAX_VALUE, Number.MIN_VALUE];
var _x, _y;
var _skips = 1;
var _normalize;


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

    $("#check").click(function(){
        buildCategoryChecker();
    });

    $("#buildStart").click(function(){
        getCategoricalFromChecker();
        var variables  = getFromCategorySetter();
        var out = toFinalData(_data, _categorical, variables.input, variables.output);
        _data = out.data;
        _classes = out.classes;
        _isinput = out.isInput;
        _table.loadData(_data);
        populateLayerWizard();
        $(this).hide();
        $("#networkWizard").show();
        $("#startTraining").show();
        $("#trainingOptions").show();
    });

    $("#addLayer").click(function(){

        var layers = $('#notOutputLayer');

        var newDiv = $('<div class="list-group-item">').appendTo(layers);

        var numLayers = layers.find('div').length - 1;

        newDiv.html('<span>Hidden Layer ' + numLayers + '</span>').attr('id', numLayers).data('type', 'hidden')
            .data('size', 1).data('nonlin', 'ReLU').click(function(){
            $('#layerOptions').data('current', numLayers);
            $("#layerType").text($(this).data('type'));
            $("#size").val($(this).data('size'));
            $("#nonlin").val($(this).data('nonlin'));
        });

        newDiv.click();
    });

    $("#layerType, #size, #nonLinearity").change(function(){
        var currentLayerNum = $("#layerOptions").data('current');
        var currentLayer = $("#" + currentLayerNum + ".list-group-item");

        currentLayer.data('size', $("#size").val()).data('nonlin', $("#nonlin").val());
    });

    $("#trainStart").click(function(){
        generateLayerArray();
        _network = createNetwork(_layerArray);
        _normalize = normalize(_data);
        trainNetwork(_network, createTrainingData(_data, _isinput, _normalize), getTrainingInfo());
        createErrorGraph();
        $("#startNetworkStats").show();
        $("#performance").show();
    });

    $("#statsStart").click(function(){
        createImportanceGraph();
        var select = $("#selectPoint").find('select');
        select.html('');
        $("<option value='all'>").text('All').appendTo(select);

        $.each(_data, function(index, value){
            $("<option value='" + index + "'>").text(index).appendTo(select);
        })
    });

    $("#importance").click(function(){

        var value = $("#selectPoint").find('select').val();

        if(value == "all"){
            createImportanceGraph();
        } else {
            createIndividualImportanceGraph(value);
        }
    })



});

function startDemo(){

    Papa.parse('boston_data.txt', {
        download:true,
        complete: function(results, file){

            $.each(results['data'], function(index, value){
               results['data'][index] = value.filter(function(n){return n.length != 0});
            });

            results['data'] = results['data'].filter(function(n){return n.length != 0;});

            _table = bindToTable($("#dataTable")[0], results['data']);

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
    _categorical = isCategorical(_data);

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
        $("#category, #networkBuild").show();
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
            .attr('id', $(predictors[i]).text()).attr('name', 'indep' + i).appendTo(label);

        $("<span>").text('Categorical').appendTo(label);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='continuous'>")
            .attr('id', $(predictors[i]).text()).attr('name', 'indep' + i).appendTo(label);

        $("<span>").text('Continuous').appendTo(label);


        if(_categorical[$(predictors[i]).text()]){
            $(div.find('input').get(0)).prop('checked', true);
        } else {
            $(div.find('input').get(1)).prop('checked', true);
        }
    }

    for(i = 0; i < predicted.length; i++){
        div = $("<div>").appendTo(
            $("<div class='list-group-item'>").appendTo(depBase));

        $("<span>").text($(predicted[i]).text()).appendTo(div);

        radioDiv = $("<div class='right'>").appendTo(div);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='categorical'>")
            .attr('id', $(predicted[i]).text()).attr('name', 'dep' + i).appendTo(label);

        $("<span>").text('Categorical').appendTo(label);

        label = $("<label class='radio-inline'>")
            .appendTo(radioDiv);

        $("<input type='radio' name='continuous'>")
            .attr('id', $(predicted[i]).text()).attr('name', 'dep' + i).appendTo(label);

        $("<span>").text('Continuous').appendTo(label);

        if(_categorical[$(predicted[i]).text()]){
            $(div.find('input').get(0)).prop('checked', true);
        } else {
            $(div.find('input').get(1)).prop('checked', true);
        }
    }

}

function getCategoricalFromChecker(){
    if(_categorical.length == 0){
        return -1;
    }

    $.each(_categorical, function(index, value){
        var inputs = $("#category")
            .find('input[id=' + (index + 1) + ']:checked').parent();
        if(inputs.length == 1){
            _categorical[index] = inputs.find('span').text() == 'Categorical';
        }
    });
}

function populateLayerWizard(){

    var inputLength = 0;
    var outputLength = 0;

    $.each(_isinput, function(index, value){
        if(value){
            inputLength++;
        } else {
            outputLength++;
        }
    });

    $("#0").data('size', inputLength);
    $("#end").data('size', outputLength);

    $("#layerList").find('.list-group-item').click(function(){
        $('#layerOptions').data('current', $(this).attr('id'));
        $("#layerType").text($(this).data('type'));
        $("#size").val($(this).data('size'));
        $("#nonlin").val($(this).data('nonlin'));
    });

}

function generateLayerArray(){

    _layerArray = [];

    var layers = $("#layerList").find('div.list-group-item:not([id="addLayer"])');

    layers.each(function(index, value){

        var valueJQ = $(value);

        var size = valueJQ.data('size');
        var nonlin = valueJQ.data('nonlin');

        var layer = new synaptic.Layer(size);

        if(valueJQ.attr('id') != '0'){
            layer.set({squash: returnNonlin(nonlin)})
        }

        _layerArray.push(layer);

    });
}

function returnNonlin(nonlin){

    if(nonlin == 'identity'){
        return synaptic.Neuron.squash.IDENTITY;
    } else if (nonlin == 'TanH'){
        return synaptic.Neuron.squash.TANH;
    } else if (nonlin == 'Sigmoid'){
        return synaptic.Neuron.squash.LOGISTIC;
    } else if (nonlin == 'ReLU'){
        return synaptic.Neuron.squash.RELU;
    }

}

function getFromCategorySetter(){

    var inputs = $("#indepChecker").find('div:not(.listHeader)').children('span');
    var outputs = $("#depChecker").find('div:not(.listHeader)').children('span');

    var inputArray = [];

    inputs.each(function(index, value){
        var pos = parseInt($(value).text()) - 1;
        inputArray.push(pos);
    });

    var outputArray = [];

    outputs.each(function(index, value){
       outputArray.push(parseInt($(value).text()) - 1);
    });

    return {input:inputArray, output:outputArray};

}

function getTrainingInfo(){
    return {rate: parseFloat($("#rate").val()),
            iterations: parseFloat($("#iterations").val()),
            error: parseFloat($("#error").val())};
}

function trainNetwork(network, trainingData, trainingInfo){

    var trainer = new synaptic.Trainer(network);

    _error = [];

    _errorMinMax = [Number.MAX_VALUE, Number.MIN_VALUE];

    trainer.trainAsync(trainingData, {
        rate: Math.pow(10, -1 * trainingInfo.rate),
        iterations: trainingInfo.iterations,
        error: Math.pow(10, -1 * trainingInfo.error),
        cost: synaptic.Trainer.cost.MSE,
        schedule:{
            every: 1,
            do: function(data){
                if(data.iterations % _skips == 0){
                    _error.push([data.iterations, data.error]);
                }

                if(data.error > _errorMinMax[1]){
                    _errorMinMax[1] = data.error;
                }

                if(data.error < _errorMinMax[0]){
                    _errorMinMax[0] = data.error;
                    $("#minIter").find("span").text(data.iterations);
                }

                if(_error.length % 5 == 0){

                    if(_error.length > 1000){

                        _error = _error.filter(function(value, index){
                            return (index % 2 == 0 || (value[1] == _errorMinMax[0] || value[1] == _errorMinMax[1]));
                        });

                        _skips++;

                    }

                    updateErrorGraph();
                }


                $("#currError").find("span").text(round(data.error, 7));
                $("#minError").find("span").text(round(_errorMinMax[0], 7));
                $("#currIter").find("span").text(data.iterations);


            }
        }
    }).then(results => console.log('done!', results));

}

function createErrorGraph(){

    $("#errorGraph").html('');

    _x = d3.scaleLinear().range([0, 500]);
    _y = d3.scaleLinear().range([250, 0]);

    _x.domain([0, _error.length]);
    _y.domain(_errorMinMax);

    var xAxis = d3.axisBottom(_x);
    var yAxis = d3.axisRight(_y);

    var line = d3.line()
        .x(function(d){
            return _x(d[0]);
        })
        .y(function(d){
            return _y(d[1]);
        });

    var svg = d3.select('#errorGraph').append('svg')
        .attr('width', 600).attr('height', 320)
        .append('g')
        .attr('transform', 'translate(20, 20)');

    svg.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', 500)
        .attr('height', 250);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, 250)')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(500, 0)')
        .call(yAxis);

    svg.append('path')
        .attr('class', 'line')
        .attr('d', line(_error));

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", 275)
        .attr("y", 280)
        .text("Iteration");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 550)
        .attr("x", -110)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Error");
}

function updateErrorGraph(){

    var line = d3.line()
        .x(function(d){

            _x.domain([0, _error[_error.length - 1][0]]);
            return _x(d[0]);
        })
        .y(function(d){

            _y.domain(_errorMinMax);

            return _y(d[1]);
        });

    var svg = d3.select('#errorGraph svg');

    svg.select('.line').attr('d', line(_error));
    svg.select('.x.axis').call(d3.axisBottom(_x));
    svg.select('.y.axis').call(d3.axisRight(_y));

}

function createImportanceGraph(){

    $("#overallImportance").html('');

    var netImportance = contribution(_network);

    var overallImportance = [];

    $.each(_isinput, function(index, value){
        if(value) {
            overallImportance.push(0);
        }

    });

    $.each(_normalize(_data), function(index, value){

        var input = [];
        $.each(value, function(innerIndex, innerValue){
            if(_isinput[innerIndex]){
                input.push(innerValue);
            }
        });

        var dataImportance = netImportance(input);

        $.each(dataImportance, function(innerIndex, innerValue){

            overallImportance[innerIndex] += innerValue;

        });


    });

    var total = 0;

    $.each(overallImportance, function(index, value){

        if(value < 0){
            value *= -1;
        }

        total += value;

    });

    var overallImportancePercent = [];

    $.each(overallImportance, function(index, value){

        overallImportancePercent.push(value / total);

    });

    overallImportance = overallImportancePercent;
    console.log(overallImportance);

    var x = d3.scaleBand().rangeRound([0, 500]).padding(0.1);
    var y = d3.scaleLinear().range([250, 0]);

    var max = d3.max(overallImportance);

    if(max < (-1 * d3.min(overallImportance))){
        max = -1 * d3.min(overallImportance);
    }

    x.domain(overallImportance.map(function(d) {return $.inArray(d, overallImportance)}));
    y.domain([-1 * max, max]);

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisRight(y);


    var svg = d3.select('#overallImportance').append('svg')
        .attr('width', 600).attr('height', 320)
        .append('g')
        .attr('transform', 'translate(20, 20)');

    svg.selectAll('.bar').data(overallImportance)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d){return x($.inArray(d, overallImportance))})
        .attr('width', x.bandwidth())
        .attr('y', function(d){return y(d)})
        .attr('height', function(d){

            var height = 125 - y(d);
            if(height < 0){
                d3.select(this).attr('transform', 'translate(0, ' + height + ')');
                height *= -1;
            }
            return height});

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, 125)')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(500, 0)')
        .call(yAxis);

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 530)
        .attr("x", -40)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Training Contribution Scores");
}

function createIndividualImportanceGraph(pointID){
    $("#overallImportance").html('');

    var netImportance = contribution(_network);

    var overallImportance = [];

    $.each(_isinput, function(index, value){
        if(value) {
            overallImportance.push(0);
        }

    });

    $.each(_normalize(_data), function(index, value){

        if(index == pointID) {

            var input = [];
            $.each(value, function (innerIndex, innerValue) {
                if (_isinput[innerIndex]) {
                    input.push(innerValue);
                }
            });

            var dataImportance = netImportance(input);

            $.each(dataImportance, function (innerIndex, innerValue) {

                overallImportance[innerIndex] += innerValue;

            });
        }
    });

    var total = 0;

    $.each(overallImportance, function(index, value){

        if(value < 0){
            value *= -1;
        }

        total += value;

    });

    var overallImportancePercent = [];

    $.each(overallImportance, function(index, value){

        overallImportancePercent.push(value / total);

    });

    overallImportance = overallImportancePercent;
    console.log(overallImportance);

    var x = d3.scaleBand().rangeRound([0, 500]).padding(0.1);
    var y = d3.scaleLinear().range([250, 0]);

    var max = d3.max(overallImportance);

    if(max < (-1 * d3.min(overallImportance))){
        max = -1 * d3.min(overallImportance);
    }

    x.domain(overallImportance.map(function(d) {return $.inArray(d, overallImportance)}));
    y.domain([-1 * max, max]);

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisRight(y);


    var svg = d3.select('#overallImportance').append('svg')
        .attr('width', 600).attr('height', 320)
        .append('g')
        .attr('transform', 'translate(20, 20)');

    svg.selectAll('.bar').data(overallImportance)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d){return x($.inArray(d, overallImportance))})
        .attr('width', x.bandwidth())
        .attr('y', function(d){return y(d)})
        .attr('height', function(d){

            var height = 125 - y(d);
            if(height < 0){
                d3.select(this).attr('transform', 'translate(0, ' + height + ')');
                height *= -1;
            }
            return height});

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, 125)')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(500, 0)')
        .call(yAxis);

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 530)
        .attr("x", -40)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Contribution Scores for point " + pointID);
}

