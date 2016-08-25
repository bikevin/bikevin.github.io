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
    
    var classObject = {};

    $.each(categorical, function(index, value){

        if(value){

            //make a list of classes
            var classes = [];
            $.each(preData[index], function(innerIndex, innerValue){
                if($.inArray(innerValue, classes) == -1){
                    classes.push(innerValue);
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
            
            classObject[index] = classes;
        }

    });
    
    return {classes: classObject, data:transpose(preData), isInput:isInput};

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

function createTrainingData(data, isInput){

    if(data[0].length != isInput.length){
        console.error('createTrainingData length mismatch');
        return 'ERROR: length mismatch'
    }

    data = normalizeData(data);

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

function normalizeData(data){

    var normalized = transpose(data);

    $.each(normalized, function(index, value){

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

        $.each(value, function(innerIndex, innerValue){
            value[innerIndex] -= mean;
            value[innerIndex] /= range;
        });

    });

    return transpose(normalized);
}

function round(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
}