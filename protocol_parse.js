/**
 * Created by Kevin on 5/31/2016.
 */

//stores the current protocol - be careful where you use it because it may not be initialized
var currentProtocol;

var handleFiles = function(files){
    var selectedFile = document.getElementById("input").files[0];
    var url = window.URL.createObjectURL(selectedFile);

    $.getJSON(url, function(data){
        //data[0] is the actual protocol
        var protocol = protocolInfo(data[0]);
        currentProtocol = data[0];
        populatePulseTable(data[0], protocol);
        populateFixedTable(data[0], protocol);
    });
};

$.getJSON("photosynthesis.json", function(data){
   //data[0] is the actual protocol
    var protocol = protocolInfo(data[0]);
    currentProtocol = data[0];
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
                var id = String(pulseInfo["pulseVars"][j - 1]) + "~~#" + String(i) + "~~#" + "Array";
            } else {
                id = String(pulseInfo["pulseVars"][j - 1]) + "~~#" + String(i);
            }
            cell.innerHTML = "<input type='text' class='form-control col-lg' id='"
                + id
                + "' value='"
                + data
                + "'/>";
        }
    }

    row = pulseTable.rows[0];
    id = row.cells.length;
    cell = row.insertCell(id);
    cell.innerHTML = '<b>Add Column </b><button class="btn-default btn-xs" id="' +
        String(id) +
        '" type="button" data-toggle="modal" data-target="#columnModal" onclick="updateModalLocation(this)">'+
        '<span class="glyphicon glyphicon-plus" aria-label="add column"></span>' +
        '</button>';

    row = pulseTable.insertRow(pulseTable.rows.length);
    cell = row.insertCell(0);
    cell.innerHTML = '<b>Add Row </b><button class="btn-default btn-xs" id="' +
        String(id) +
        '" type="button" data-toggle="modal" data-target="#rowModal"' +
        'onclick="updateModalLocation(this);"><span class="glyphicon glyphicon-plus" aria-label="add row"></span>' +
        '</button>';
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
        cell.innerHTML = '<b>' + fixedInfo["fixedVars"][i] + ' </b><button class="btn-default btn-xs" id="' +
            String(i + 1) +
            '" type="button" ' +
            'onclick="deleteColumn(this)"><span class="glyphicon glyphicon-remove" aria-label="delete column"></span>' +
            '</button>';
    }

    for(i = 0; i < fixedInfo["fixedNum"]; i++){
        row = fixedTable.insertRow(i + 1);
        cell = row.insertCell(0);

        //populate inside of first cell
        cell.innerHTML = '<b>' + String(i + 1) + ' </b><button class="btn-default btn-xs" id="' +
            String(i) +
            '" type="button" ' +
            'onclick="deleteRow(this)"><span class="glyphicon glyphicon-remove" aria-label="delete row"></span>' +
            '</button>';

        //populate rest of cells in row
        for (var j = 1; j < fixedInfo["fixedVars"].length + 1; j++) {
            cell = row.insertCell(j);
            var data = null;
            var field = protocol[fixedInfo["fixedVars"][j - 1]];
            if(Array.isArray(field)){
                data = field[i];
                var id = String(fixedInfo["fixedVars"][j - 1]) + "~~#" + String(i + 1);
            } else if (i == 0){
                data = field;
                id = String(fixedInfo["fixedVars"][j - 1]) + "~~#" + String(i + 1) + "~~#" + "EMPTY";
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

    row = fixedTable.rows[0];
    id = row.cells.length;
    cell = row.insertCell(id);
    cell.innerHTML = '<b>Add Column </b><button class="btn-default btn-xs" id="' +
        String(id) +
        '" type="button" data-toggle="modal" data-target="#columnModal" onclick="updateModalLocation(this)">'+
        '<span class="glyphicon glyphicon-plus" aria-label="add column"></span>' +
        '</button>';

    row = fixedTable.insertRow(fixedTable.rows.length);
    cell = row.insertCell(0);
    cell.innerHTML = '<b>Add Row </b><button class="btn-default btn-xs" id="' +
        String(id) +
        '" type="button" data-toggle="modal" data-target="#rowModal"' +
        'onclick="updateModalLocation(this);"><span class="glyphicon glyphicon-plus" aria-label="add row"></span>' +
        '</button>';
};

var printValues = function(){
    var newJsonParts = [];
    var table = document.getElementById("pulse_table");
    for(var i = 1; i < table.rows.length; i++){
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
        locString[1]--;
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

/*var showButtons = function(elementIn){
    console.log(elementIn.id)
    while(elementIn.nodeName.localeCompare("TABLE") != 0) {
        console.log(elementIn.nodeName);
        elementIn = elementIn.parentNode;
    }
    console.log(elementIn.id);
};*/

var deleteColumn = function(element){
    var colNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    var table = document.getElementById(element.id);
    var rowCount = table.rows.length;
    for(var i = 0; i < rowCount - 1; i++){
        table.rows[i].deleteCell(colNum);
    }

    updateColumnIndices(table);
};

var deleteRow = function(element){
    var rowNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    var table = document.getElementById(element.id);
    table.deleteRow(parseInt(rowNum));

    updateRowIndices(table);
};

var updateRowIndices = function(table){
    var rows = table.rows;
    var length = rows.length;
    var cellNum = rows[1].cells.length;
    for(var i = 1; i < length - 1; i++){
        rows[i].cells[0].getElementsByTagName("B")[0].textContent = String(i);
        rows[i].cells[0].getElementsByTagName("BUTTON")[0].id = i;
        for(var j = 1; j < cellNum - 1; j++){
            var idStr = rows[i].cells[j].childNodes[0].id;
            idStr = idStr.split("~~#");
            parseInt(idStr[1]);
            idStr[1] = i;
            if(idStr.length == 2){
                var idStrNew = idStr[0] + "~~#" + idStr[1];
            } else if (idStr.length == 3){
                idStrNew = idStr[0] + "~~#" + idStr[1] + "~~#" + idStr[2];
            }

            rows[i].cells[j].childNodes[0].id = idStrNew;

        }
    }
};

var updateColumnIndices = function(table){
    var rows = table.rows;
    var length = rows[0].cells.length;
    for(var i = 1; i < length; i++){
        rows[0].cells[i].getElementsByTagName("BUTTON")[0].id = i;
    }
};

var addColumn = function(){
    var input = document.getElementById("column_name");
    var colName = input.value;
    var nested = document.getElementById("col_array").checked;
    var table = document.getElementById(input.getAttribute("data-location"));

    var rowLength = table.rows.length;
    var colLength = table.rows[1].cells.length;

    var string3;

    if(table.id.localeCompare("pulse_table") == 0){
        string3 = "Array";
    } else {
        string3 = "EMPTY";
    }

    if(colName.localeCompare("") != 0) {
        for (var i = 0; i < rowLength - 1; i++) {
            var row = table.rows[i];
            var cell = row.insertCell(colLength);
            if (i == 0) {
                cell.innerHTML = "<b>" + colName + " </b>";

                cell.innerHTML += "<button class='btn-default btn-xs' id='"
                    + String(colLength)
                    + "' type='button' onclick='deleteColumn(this)'>"
                    + "<span class='glyphicon glyphicon-remove' aria-label='delete column'></span>"
                    + "</button>"
            } else {
                if (nested) {
                    var id = colName + "~~#" + String(i) + "~~#" + string3;
                } else {
                    id = colName + "~~#" + String(i);
                }
                cell.innerHTML = "<input type='text' class='form-control col-lg' id='"
                    + id
                    + "' value=''/>";
            }
        }
    }

    updateColumnIndices(table);
};

//TODO check the input row to make sure it's a valid row
var addRow = function(){
    var input = document.getElementById("row_name");
    var rowLoc = input.value;
    var table = document.getElementById(input.getAttribute("data-location"));
    var cellNum = table.rows[1].cells.length;
    var numRows = table.rows.length;

    if(!isNaN(parseInt(rowLoc)) && (parseInt(rowLoc) > -1 && parseInt(rowLoc) < numRows)){
        var row = table.insertRow(parseInt(rowLoc));
        for(var i = 0; i < cellNum; i++){
            var cell = row.insertCell(i);
            var colType = table.rows[0].cells[i].getElementsByTagName("B")[0].textContent;
            colType = colType.split(" ")[0];
            var nested = (table.rows[1].cells[i].id.split("~~#").length == 3);
            if(i == 0){
                cell.innerHTML = "<b>" + String(rowLoc) + " </b>";
                cell.innerHTML += "<button class='btn-default btn-xs' id='"
                    +String(rowLoc)
                    +"' type='button' onclick='deleteRow(this)'>"
                    +"<span class='glyphicon glyphicon-remove' aria-label='delete row'></span>"
                    +"</button>";
            } else {
                if(nested){
                    var id = colType + "~~#" + i + "~~#" + table.rows[1].cells[i].id.split("~~#")[2];
                } else {
                    id = colType + "~~#" + i;
                }
                cell.innerHTML = "<input type='text' class='form-control col-lg' id='"
                    + id
                    + "' value=''/>";
            }
        }
    }

    updateRowIndices(table);
};

var updateModalLocation = function(element){
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }
    document.getElementById("column_name").setAttribute("data-location", element.id);
    document.getElementById("row_name").setAttribute("data-location", element.id);
};



