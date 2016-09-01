/**
 * Created by kevin on 8/16/16.
 */

function bindToTable(element, data){
    
    var options = {
        rowHeaders: true,
        colHeaders: true
    };
    
    options['data'] = data;

    var table = new Handsontable(element, options);

    table.updateSettings({
        readOnly: true
    });

    return table;
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

function toFinalData(preData, categorical, inputs, outputs){

    var isInput = JSON.parse(JSON.stringify(categorical));

    //preData and categorical should have the same amount of elements
    if(preData[0].length != categorical.length){
        return -1;
    }

    preData = transpose(preData);

    //get rid of unused columns
    for(var i = preData.length - 1; i >= 0; i--){
        if(inputs.indexOf(i) == -1 && outputs.indexOf(i) == -1){
            preData.splice(i, 1);
            categorical.splice(i, 1);
            isInput.splice(i, 1);
        } else isInput[i] = inputs.indexOf(i) != -1;
    }
    
    var classesOut = [];

    $.each(categorical, function(index, value){

        if(!value){
            classesOut.push(index);
        }

        if(value){

            //make a list of classes
            var classes = [];
            $.each(preData[index], function(innerIndex, innerValue){
                if($.inArray(innerValue, classes) == -1){
                    classes.push(innerValue);
                    classesOut.push(index);
                }
            });

            var replaceWith = [];
            $.each(classes, function(innerIndex, innerValue){
                var temp = [];

                $.each(preData[index], function(innerInnerIndex, innerInnerValue){
                    if(innerInnerValue == innerValue){
                        temp.push(1);
                    } else {
                        temp.push(0);
                    }
                });

                replaceWith.push(temp);
            });

            var toRepeat = isInput[index];

            preData.splice(index, 1);
            isInput.splice(index, 1);


            $.each(replaceWith, function(innerIndex, innerValue){
                preData.splice(index, 0, innerValue);
                isInput.splice(index, 0, toRepeat)
            });
        }

    });
    
    return {classes: classesOut, data:transpose(preData), isInput:isInput};

}

function createNetwork(layerArray){

    var hiddenLayers = [];

    $.each(layerArray, function(index, value){

        if(index != layerArray.length - 1){
            layerArray[index].project(layerArray[index + 1]);

            if(index != 0){
                hiddenLayers.push(value);
            }
        }
    });

    return new synaptic.Network({
        input: layerArray[0],
        hidden: hiddenLayers,
        output: layerArray[layerArray.length - 1]
    });
}

function createTrainingData(data, isInput, normalizer){

    if(data[0].length != isInput.length){
        console.error('createTrainingData length mismatch');
        return 'ERROR: length mismatch'
    }

    data = normalizer(data);

    var trainingData = [];

    $.each(data, function(index, value){

        var tempInput = [];
        var tempOutput = [];

        $.each(value, function(innerIndex, innerValue){

            if(isInput[innerIndex]){
                tempInput.push(innerValue);
            } else {
                tempOutput.push(innerValue);
            }

        });

        trainingData.push({
            input: tempInput,
            output: tempOutput
        });
    });

    return trainingData;
}

function normalize(data){

    var normalizeParams = [];

    $.each(transpose(data), function(index, value){

        var mean = 0;
        var max = Number.MIN_VALUE;
        var min = Number.MAX_VALUE;
        $.each(value, function(innerIndex, innerValue){
            mean += innerValue;
            if(innerValue > max){
                max = innerValue;
            }
            if(innerValue < min){
                min = innerValue;
            }

        });
        mean /= value.length;

        var range = max - min;

        var temp = {mean: mean, range: range};

        normalizeParams.push(temp);
    });

    return function(dataToNormalize){

        var transposed = transpose(dataToNormalize);

        $.each(transposed, function(index, value){

            $.each(value, function(innerIndex, innerValue){

                transposed[innerIndex] -= normalizeParams[index].mean;
                transposed[innerIndex] /= normalizeParams[index].range;

            })

        });

        return transpose(transposed);

    }
}

function round(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
}

function contribution(network){

    var weights = {};

    var layerWeights = {};

    $.each(network.layers.input.list, function(index, value){

        var temp = {};

        $.each(Object.keys(value.connections.projected), function(innerIndex, innerValue){

            temp[innerValue] = value.connections.projected[innerValue].weight;

        });

        layerWeights[value.ID] = temp;

    });

    weights['input'] = layerWeights;

    $.each(network.layers.hidden, function(index, value){

        layerWeights = {};

        $.each(value.list, function(innerIndex, innerValue){

            var temp = {};

            $.each(Object.keys(innerValue.connections.projected), function(innerInnerIndex, innerInnerValue){

                temp[innerInnerValue] = innerValue.connections.projected[innerInnerValue].weight;

            });

            layerWeights[innerValue.ID] = temp;

        });

        weights[index] = layerWeights;

    });

    var refPoint = [];

    for(var i = 0; i < network.layers.input.size; i++){
        refPoint.push(0);
    }

    network.layers.input.activate(refPoint);

    var refActivations = {};

    $.each(network.layers.hidden, function(index, value){

        refActivations[index] = value.activate();

    });

    refActivations['output'] = network.layers.output.activate();

    return function(singlePoint){

        network.layers.input.activate(singlePoint);

        var deltaActivations = {};

        $.each(network.layers.hidden, function(index, value){
            deltaActivations[index] = value.activate();

            $.each(deltaActivations[index], function(innerIndex, innerValue){
                deltaActivations[index][innerIndex] -= refActivations[index][innerIndex];
            });

        });

        deltaActivations['output'] = network.layers.output.activate();

        $.each(deltaActivations['output'], function(innerIndex, innerValue){
            deltaActivations['output'][innerIndex] -= refActivations['output'];
        });
        var numHidden = network.layers.hidden.length;

        var currentValues = deltaActivations.output;

        for(var i = numHidden - 1; i > -1; i--){

            var newValues = [];

            $.each(weights[i], function(index, value){

                var temp = 0;

                $.each(currentValues, function(innerIndex, innerValue){

                    temp += value[Object.keys(value)[innerIndex]] * innerValue;

                });

                newValues.push(temp);


            });

            currentValues = newValues;

            for(var j = 0; j < currentValues.length; j++){

                currentValues[j] *= deltaActivations[i][j];

            }

        }

        newValues = [];

        $.each(weights['input'], function(index, value){

            var temp = 0;

            $.each(currentValues, function(innerIndex, innerValue){

                temp += value[Object.keys(value)[innerIndex]] * innerValue;

            });

            newValues.push(temp);

        });

        currentValues = newValues;

        for(j = 0; j < currentValues.length; j++){

            currentValues[j] *= singlePoint[j];

        }

        return currentValues;

    }


}