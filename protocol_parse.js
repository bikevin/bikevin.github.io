/**
 * Created by Kevin on 5/31/2016.
 */

//stores the current protocol - be careful where you use it because it may not be initialized
var currentProtocol;

var handleFiles = function(files){
    var selectedFile = document.getElementById("input").files[0];
    console.log(selectedFile);
    var url = window.URL.createObjectURL(selectedFile);
    console.log(url);

    $.getJSON(url, function(data){
        //data[0] is the actual protocol
        var protocol = protocolInfo(data[0]);
        currentProtocol = data[0];
        console.log(data[0]);
        populatePulseTable(data[0], protocol);
        populateFixedTable(data[0], protocol);
    });
};

$.getJSON("photosynthesis.json", function(data){
   //data[0] is the actual protocol
    var protocol = protocolInfo(data[0]);
    currentProtocol = data[0];
    console.log(data[0]);
    populatePulseTable(data[0], protocol);
    populateFixedTable(data[0], protocol);
});

var protocolInfo = function(protocol){
    if(!protocol.hasOwnProperty("pulses")){
        return -1;
    }

    var pulseNum = protocol["pulses"].length;
    var maxFixedNum = 0;

    var pulseVars = [];
    var fixedVars = [];

    Object.keys(protocol).forEach(function(d){
        if(protocol[d].length == pulseNum && d.localeCompare("environmental") != 0){
            pulseVars.push(d);
        } else {
            fixedVars.push(d);
            if(protocol[d].length > maxFixedNum){
                maxFixedNum = protocol[d].length;
            }
        }
    });

    return {"pulses": pulseNum, "pulseVars": pulseVars, "fixedVars": fixedVars, "fixedNum": maxFixedNum}
};

var populatePulseTable = function(protocol, pulseInfo){
    var pulseTable = document.getElementById("pulse_table");

    //clear the table first
    pulseTable.innerHTML ="";


    var row = pulseTable.insertRow(0);
    var cell;
    //populate headers
    cell = row.insertCell(0);
    cell.innerHTML = "<b>#</b>";
    for(var i = 1; i < pulseInfo["pulseVars"].length + 1; i++){
        cell = row.insertCell(i);
        cell.innerHTML = "<b>" + pulseInfo["pulseVars"][i - 1] + " </b>";
        /*cell.innerHTML = "<button class='btn-default btn-sm' type='button' onclick='showButtons(this)'>"
            +pulseInfo["pulseVars"][i - 1]
            +"</button>";*/

        cell.innerHTML += "<button class='btn-default btn-xs' id='"
            +String(i)
            +"' type='button' onclick='deleteColumn(this)'>"
            +"<span class='glyphicon glyphicon-remove' aria-label='delete column'></span>"
            +"</button>"
    }

    for(i = 1; i < pulseInfo["pulses"] + 1; i++){
        row = pulseTable.insertRow(i);
        cell = row.insertCell(0);
        cell.innerHTML = "<b>" + String(i) + " </b>";
        cell.innerHTML += "<button class='btn-default btn-xs' id='"
            +String(i)
            +"' type='button' onclick='deleteRow(this)'>"
            +"<span class='glyphicon glyphicon-remove' aria-label='delete row'></span>"
            +"</button>";
        for (var j = 1; j < pulseInfo["pulseVars"].length + 1; j++) {
            cell = row.insertCell(j);
            var data = protocol[pulseInfo["pulseVars"][j - 1]][i - 1];
            if(Array.isArray(data)){
                var id = String(pulseInfo["pulseVars"][j - 1]) + "~~#" + String(i - 1) + "~~#" + "Array";
            } else {
                id = String(pulseInfo["pulseVars"][j - 1]) + "~~#" + String(i - 1);
            }
            cell.innerHTML = "<input type='text' class='form-control col-lg' id='"
                + id
                + "' value='"
                + data
                + "'/>";
        }
    }
};

var populateFixedTable = function(protocol, fixedInfo){
    var fixedTable = document.getElementById("fixed_table");

    //clear table
    fixedTable.innerHTML = "";

    var row = fixedTable.insertRow(0);
    var cell;
    cell = row.insertCell(0);
    cell.innerHTML = "<b>#</b>";
    for(var i = 0; i < fixedInfo["fixedVars"].length; i++){
        cell = row.insertCell(i + 1);
        cell.innerHTML = "<b>" + fixedInfo["fixedVars"][i] + "</b>";
    }

    for(i = 0; i < fixedInfo["fixedNum"]; i++){
        row = fixedTable.insertRow(i + 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<b>" + String(i + 1) + "</b>";
        for (var j = 1; j < fixedInfo["fixedVars"].length + 1; j++) {
            cell = row.insertCell(j);
            var data = null;
            var field = protocol[fixedInfo["fixedVars"][j - 1]];
            if(Array.isArray(field)){
                data = field[i];
                var id = String(fixedInfo["fixedVars"][j - 1]) + "~~#" + String(i);
            } else if (i == 0){
                data = field;
                id = String(fixedInfo["fixedVars"][j - 1]) + "~~#" + String(i) + "~~#" + "EMPTY";
            }


            if(data != null){
                cell.innerHTML = "<input type='text' class='form-control col-lg-1' id='"
                    + id
                    + "' value='"
                    + String(data)
                    + "'/>";
            } else {
                cell.innerHTML = "<input type='text' class='form-control col-lg-1' id='"
                + id
                +"' value=''/>";
            }
        }
    }
};

var printValues = function(){
    var newJsonParts = [];
    var table = document.getElementById("pulse_table");
    for(var i = 0; i < table.rows.length; i++){
        for(var j = 0; j < table.rows[i]["cells"].length; j++){
            var element = table.rows[i]["cells"][j].getElementsByClassName("form-control");
            var temp = [];
            if(element.length != 0){
                temp.push(element[0].value);
                temp.push(element[0].getAttribute("id"));
                newJsonParts.push(temp);
            }
        }
    }

    table = document.getElementById("fixed_table");
    for(i = 0; i < table.rows.length; i++){
        for( j = 0; j < table.rows[i]["cells"].length; j++){
            element = table.rows[i]["cells"][j].getElementsByClassName("form-control");
            temp = [];
            if(element.length != 0){
                temp.push(element[0].value);
                temp.push(element[0].getAttribute("id"));
                newJsonParts.push(temp);
            }
        }
    }

    buildJson(newJsonParts);
};

var buildJson = function(jsonParts){
    var finalJson = {};
    jsonParts.forEach(function(d){
        var locString = d[1].split("~~#");
        if(locString.length == 3){
            if(finalJson.hasOwnProperty(locString[0])){
                if(d[0].localeCompare("") != 0) {
                    if(!isNaN(parseInt(d[0]))) {
                        finalJson[locString[0]][parseInt(locString[1])] = [parseInt(d[0])];
                    } else {
                        finalJson[locString[0]][parseInt(locString[1])] = [d[0]];
                    }
                }
            } else {
                finalJson[locString[0]] = [];
                if(d[0].localeCompare("") != 0) {
                    if(!isNaN(parseInt(d[0]))) {
                        if(locString[2].localeCompare("EMPTY") == 0){
                            finalJson[locString[0]] = parseInt(d[0]);
                        } else {
                            finalJson[locString[0]][parseInt(locString[1])] = [parseInt(d[0])];
                        }
                    } else {
                        if(locString[2].localeCompare("EMPTY") == 0){
                            finalJson[locString[0]] = d[0];
                        } else {
                            finalJson[locString[0]][parseInt(locString[1])] = [d[0]];
                        }
                    }
                }
            }
        } else {
            if(finalJson.hasOwnProperty(locString[0])){
                if(d[0].localeCompare("") != 0) {
                    if(!isNaN(parseInt(d[0]))) {
                        finalJson[locString[0]][parseInt(locString[1])] = parseInt(d[0]);
                    } else {
                        if(d[0].indexOf(",") != -1){
                            var environmental = d[0].split(",");
                            environmental.forEach(function(d, index) {
                                if(!isNaN(parseInt(d))){
                                    environmental[index] = parseInt(d);
                                }
                            });
                            finalJson[locString[0]][parseInt(locString[1])] = environmental;
                        }else {
                            finalJson[locString[0]][parseInt(locString[1])] = d[0];
                        }
                    }
                }
            } else {
                finalJson[locString[0]] = [];
                if(d[0].localeCompare("") != 0) {
                    if(!isNaN(parseInt(d[0]))) {
                        finalJson[locString[0]][parseInt(locString[1])] = parseInt(d[0]);
                    } else {
                        if(d[0].indexOf(",") != -1){
                            environmental = d[0].split(",");
                            environmental.forEach(function(d, index) {
                               if(!isNaN(parseInt(d))){
                                   environmental[index] = parseInt(d);
                               }
                            });
                            finalJson[locString[0]][parseInt(locString[1])] = environmental;
                        }else {
                            finalJson[locString[0]][parseInt(locString[1])] = d[0];
                        }
                    }
                }
            }
        }
    });

    console.log(finalJson);
    var div = document.getElementById("json_display");
    if(div.hasChildNodes()){
        var children = div.childNodes;
        for(var i = 0; i < children.length; i++){
            div.removeChild(children[i]);
        }
    }
    var para = document.createElement("p");
    div.appendChild(para);
    var node = document.createTextNode(JSON.stringify([finalJson]));
    para.appendChild(node);
};

var showButtons = function(elementIn){
    console.log(elementIn.id)
    while(elementIn.nodeName.localeCompare("TABLE") != 0) {
        console.log(elementIn.nodeName);
        elementIn = elementIn.parentNode;
    }
    console.log(elementIn.id);
};

var deleteColumn = function(element){
    var colNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    var table = document.getElementById(element.id);
    var rowCount = table.rows.length;
    for(var i = 0; i < rowCount; i++){
        table.rows[i].deleteCell(colNum)
    }
};

var deleteRow = function(element){
    var rowNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    var table = document.getElementById(element.id);
    table.deleteRow(parseInt(rowNum));
};



