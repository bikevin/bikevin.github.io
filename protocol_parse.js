/**
 * Created by Kevin on 5/31/2016.
 */

//stores the current protocol - be careful where you use it because it may not be initialized
var currentProtocol;

var handleFiles = function(element){
    $("#welcomeModal").modal("hide");
    var selectedFile = element.files[0];
    var url = window.URL.createObjectURL(selectedFile);

    $.getJSON(url, function(data){
        //data[0] is the actual protocol
        var protocol = protocolInfo(data[0]);
        currentProtocol = data[0];
        populatePulseTable(data[0], protocol);
        populateFixedTable(data[0], protocol);
    });
};

$.getJSON("blank.json", function(data){
   //data[0] is the actual protocol
    var protocol = protocolInfo(data[0]);
    currentProtocol = data[0];
    populatePulseTable(data[0], protocol);
    populateFixedTable(data[0], protocol);
});

$(document).ready(function(){
    $("#welcomeModal").modal("show");
});

var protocolInfo = function(protocol){
    var maxFixedNum = 0;

    var pulseVars = [];
    var fixedVars = [];

    if(!protocol.hasOwnProperty("pulses")){
        var pulseNum = 0;
    } else {
        pulseNum = protocol["pulses"].length;
    }

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

    if(pulseInfo["pulseVars"] == null){
        return;
    }

    var headerTable = document.getElementById("overlay_table");
    headerTable.innerHTML = "";
    var header = headerTable.createTHead();
    var cell = header.insertRow(0).insertCell(0);
    cell.innerHTML = "<b>#</b>";

    header = pulseTable.createTHead();

    var row = header.insertRow(0);

    //populate headers
    cell = row.insertCell(0);
    cell.innerHTML = "<b>#</b>";
    cell.style.minWidth = "50px";
    for(var i = 1; i < pulseInfo["pulseVars"].length + 1; i++){
        cell = row.insertCell(i);
        id = pulseInfo["pulseVars"][i - 1] + "~~#" + 0;

        if(Array.isArray(protocol[pulseInfo["pulseVars"][i - 1]][i])){
            id += "~~#Array";

            cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
                + id
                +"' value='"
                + pulseInfo["pulseVars"][i - 1]
                +"' onkeyup='updateRowIndices();emptyError(this);' style='float: left;'></b>"
                +"<span class='glyphicon glyphicon-unchecked'></span>"
                +"<a id='"
                +String(i)
                +"' class='close' onclick='deleteColumn(this)' style='float:right; margin-top: 7px;;'>&times;</a></div>";

        } else {
            cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
                + id
                +"' value='"
                + pulseInfo["pulseVars"][i - 1]
                +"' onkeyup='updateRowIndices();emptyError(this);' style='float: left;'></b><a id='"
                +String(i)
                +"' class='close' onclick='deleteColumn(this)' style='float:right; margin-top: 7px;;'>&times;</a></div>";

        }


        cell.getElementsByTagName("INPUT")[0].style.width="150px";

    }

    pulseTable.appendChild(document.createElement("tbody"));
    var body = pulseTable.getElementsByTagName("TBODY")[0];
    headerTable.appendChild(document.createElement("tbody"));
    var overlayBody = headerTable.getElementsByTagName("TBODY")[0];

    for(i = 0; i < pulseInfo["pulses"]; i++){
        row = body.insertRow(i);
        cell = row.insertCell(0);
        cell.innerHTML = "<b>" + String(i + 1) + " </b>"
            + "<a id='"
            +String(i + 1)
            +"' class='close' onclick='deleteRow(this, true)'>"
            +"&times;"
            +"</a>";
        cell.style.minWidth = "50px";

        for (var j = 1; j < pulseInfo["pulseVars"].length + 1; j++) {
            cell = row.insertCell(j);
            var data = protocol[pulseInfo["pulseVars"][j - 1]][i];
            var id = String(pulseInfo["pulseVars"][j - 1]) + "~~#" + String(i + 1);
            if(Array.isArray(data)) {
                id += "~~#Array";
            }
            cell.innerHTML = "<input type='text' onkeyup='widthAdjust(this);emptyError(this);' class='form-control form-control-borderless col-lg' id='"
                + id
                + "' value='"
                + data
                + "'/>";

            widthAdjust(cell.getElementsByTagName("INPUT")[0]);
        }

        row = overlayBody.insertRow(i);
        cell = row.insertCell(0);
        cell.innerHTML = "<b>" + String(i + 1) + " </b>"
            +"<a id='"
            +String(i + 1)
            +"' class='close' onclick='deleteRow(this, false)'>"
            +"&times;"
            +"</a>";
    }


    var pulse_table = $("#pulse_table");
    pulse_table.find("tbody").scroll(function() {
        pulse_table.find("thead")
            .scrollLeft(pulse_table.find("tbody").scrollLeft());

        if(pulse_table.find("thead").scrollLeft() < pulse_table.find("tbody").scrollLeft()){
            pulse_table.find("tbody").scrollLeft(pulse_table.find("thead")
                .scrollLeft());
        }

        $("#overlay_table_div").scrollTop(pulse_table.find("tbody").scrollTop())
    });


};

var populateFixedTable = function(protocol, fixedInfo){
    var fixedTable = document.getElementById("fixed_table");

    //clear table
    fixedTable.innerHTML = "";

    for(var i = 0; i < fixedInfo["fixedVars"].length; i++){
        var row = fixedTable.insertRow(i);
        var cell = row.insertCell(0);

        cell.innerHTML ="<b><input type='text' class='form-control form-control-borderless col-lg' "
        + "style='display: inline-block; float:left;' onkeyup='widthAdjust(this);emptyError(this);' value='"
        + fixedInfo["fixedVars"][i]
        + "' id='"
        + fixedInfo["fixedVars"][i] + String(i)
        +"'></b><a id='" +
        + String(i)
        + "' class='close' onclick='deleteRow(this, true)' style='float:left; margin-left:10px; margin-top: 5px;'>&times;</a> ";

        var field = protocol[fixedInfo["fixedVars"][i]];
        var id = String(fixedInfo["fixedVars"][i]);

        cell.innerHTML += "<textarea class='form-control form-control-borderless col-lg-1' id='"
            + id
            + "' onkeyup='heightAdjust(this);emptyError(this);' style='height: auto; min-width: 90vw;' >"
            + JSON.stringify(field)
            +"</textarea>";

        heightAdjust(document.getElementById(id));
        widthAdjust(document.getElementById(fixedInfo["fixedVars"][i] + String(i)));
    }

    //legacy code
   /* var row = fixedTable.insertRow(0);
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
        '</button>';*/
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
                if(temp[1].split("~~#")[0].localeCompare("") == 0){
                    alert("Empty column name in column " + j);
                    return;
                }
                if(temp[0].localeCompare("") == 0){
                    alert("Empty input in column " + temp[1].split("~~#")[0] + " at row " + i);
                    return;
                }
                newJsonParts.push(temp);
            }
        }
    }

    table = document.getElementById("fixed_table");
    for(i = 0; i < table.rows.length - 1; i++) {
        temp = {};
        var data = table.rows[i].cells[0].getElementsByTagName("TEXTAREA")[0];
        try {
            temp[table.rows[i].cells[0].getElementsByTagName("INPUT")[0].value] = JSON.parse(data.value);
        } catch(e){
            var error = "Error in " + table.rows[i].cells[0].getElementsByTagName("INPUT")[0].value + " input";
            alert(error);
        }
        newJsonParts.push(temp);
    }

    buildJson(newJsonParts);
};

var buildJson = function(jsonParts){
    var finalJson = {};
    jsonParts.forEach(function(d){
        if(Array.isArray(d)) {
            var locString = d[1].split("~~#");
            locString[1]--;
            if (locString.length == 3) {
                if (!finalJson.hasOwnProperty(locString[0])) {
                    finalJson[locString[0]] = [];
                }
                if (d[0].localeCompare("") != 0) {
                    d[0] = "[" + processToStrings(d[0]) + "]";
                    finalJson[locString[0]][parseInt(locString[1])] = JSON.parse(d[0]);
                }
            } else {
                if (!finalJson.hasOwnProperty(locString[0])) {
                    finalJson[locString[0]] = [];
                }
                if (d[0].localeCompare("") != 0) {
                    if (!isNaN(parseInt(d[0]))) {
                        finalJson[locString[0]][parseInt(locString[1])] = parseInt(d[0]);
                    } else {
                        finalJson[locString[0]][parseInt(locString[1])] = d[0];
                    }
                }
            }
        } else {
            var key = Object.keys(d)[0];
            if(!isNaN(parseInt(d[key]))){
                finalJson[key] = parseInt(d[key]);
            } else {
                finalJson[key] = d[key];
            }
        }

    });

    var div = document.getElementById("outputModalBody");
    if(div.innerHTML != null){
        div.innerHTML = "";
    }
    
    var para = document.createElement("textarea");
    div.appendChild(para);
    para.style.width = "100%";
    para.style.height = "500px";
    para.value = JSON.stringify([finalJson]);

};

var deleteColumn = function(element){
    var colNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    var table = document.getElementById(element.id);
    var rowCount = table.rows.length;
    for(var i = 0; i < rowCount; i++){
        table.rows[i].deleteCell(colNum);
    }

    updateColumnIndices(table);
};

var deleteRow = function(element, fixed){
    var rowNum = element.id;
    while(element.nodeName.localeCompare("TABLE") != 0) {
        element = element.parentNode;
    }

    if(element.id.localeCompare("overlay_table") == 0){
        var table = document.getElementById("pulse_table");
    } else {
        table = document.getElementById(element.id);
    }

    table.deleteRow(parseInt(rowNum));
    document.getElementById("overlay_table").deleteRow(parseInt(rowNum));

    if(!fixed) {
        updateRowIndices(table);
    } else {
        var length = table.rows.length;
        for(var i = 0; i < length; i++){
            table.rows[i].cells[0].getElementsByTagName("A")[0].id = i;
        }
    }
};

var updateRowIndices = function(){
    var table = document.getElementById("pulse_table");
    var rows = table.rows;
    var length = rows.length;
    if(rows[1] == null){
        var cellNum = 0;
    } else {
        cellNum = rows[1].cells.length;
    }
    var headerRows = document.getElementById("overlay_table").rows;
    for(var i = 1; i < length; i++){
        headerRows[i].cells[0].getElementsByTagName("B")[0].textContent = String(i);
        headerRows[i].cells[0].getElementsByTagName("A")[0].id = i;
        for(var j = 1; j < cellNum - 1; j++){
            var idStr = rows[i].cells[j].childNodes[0].id;
            idStr = idStr.split("~~#");
            idStr[0] = rows[0].cells[j].getElementsByTagName("INPUT")[0].value;
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
        rows[0].cells[i].getElementsByTagName("A")[0].id = i;
    }
};

var addColumn = function(){
    var input = document.getElementById("column_name");
    var colName = input.value;
    var nested = document.getElementById("col_array").checked;
    var table = $("#pulse_table")[0];
    var rowLength = table.rows.length;

    var colLength = table.rows[0].cells.length;
    if(colLength == 0){
        colLength = 1;
    }

    var string3 = "Array";

    if(colName.localeCompare("") != 0) {
        for (var i = 0; i < rowLength ; i++) {
            var row = table.rows[i];
            var cell = row.insertCell(colLength);
            if (i == 0) {

                if(nested) {
                    cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
                        + colName + "~~#" + 0 + "~~#Array"
                        + "' value='"
                        + colName
                        + "' onkeyup='updateRowIndices();emptyError(this);' style='float: left;'></b>"
                        +"<span class='glyphicon glyphicon-unchecked'></span><a id='"
                        + String(i)
                        + "' class='close' onclick='deleteColumn(this)' style='float:right; margin-top: 7px;'>&times;</a></div>"
                } else {
                    cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
                        + colName + "~~#" + 0
                        + "' value='"
                        + colName
                        + "' onkeyup='updateRowIndices();emptyError(this);' style='float: left;'></b><a id='"
                        + String(i)
                        + "' class='close' onclick='deleteColumn(this)' style='float:right;'>&times;</a></div>"
                }


                cell.getElementsByTagName("INPUT")[0].style.width = "150px";
                emptyError(cell.getElementsByTagName("INPUT")[0]);
                cell.style.backgroundColor = "#cccccc";
            } else {
                if (nested) {
                    var id = colName + "~~#" + String(i) + "~~#" + string3;
                } else {
                    id = colName + "~~#" + String(i);
                }
                cell.innerHTML = "<input type='text' onkeyup='widthAdjust(this);emptyError(this);' class='form-control form-control-borderless col-lg' id='"
                    + id
                    + "' value=''/>";
                widthAdjust(cell.getElementsByTagName("INPUT")[0]);
                emptyError(cell.getElementsByTagName("INPUT")[0]);
            }
        }
    }

    updateColumnIndices(table);
};

var addRow = function(end, position){
    //var input = document.getElementById("row_name");
    var input = document.getElementById("row_select");
    var table = $("#pulse_table")[0];
    var cellNum = table.rows[0].cells.length;
    var numRows = table.rows.length;
    var body = table.getElementsByTagName("TBODY")[0];
    
    if(!end){
        var rowLoc = position;
    } else {
        rowLoc = numRows;
    }

    if(table.id.localeCompare("pulse_table") == 0) {
        if (!isNaN(parseInt(rowLoc)) && (parseInt(rowLoc) > -1 && parseInt(rowLoc) < numRows + 1)) {
            var row = body.insertRow(parseInt(rowLoc) - 1);
            for (var i = 0; i < cellNum; i++) {
                var cell = row.insertCell(i);
                if (i == 0) {
                    cell = document.getElementById("overlay_table").insertRow(parseInt(rowLoc)).insertCell(i);
                    cell.innerHTML = "<b>" + String(rowLoc) + " </b>";
                    cell.innerHTML += "<a id='"
                        +String(rowLoc)
                        +"' class='close' onclick='deleteRow(this, false)'>"
                        +"&times;"
                        +"</a>";
                    cell.style.backgroundColor = "#cccccc";
                    var temp = cell.innerHTML;
                    cell = row.cells[0];
                    cell.innerHTML = temp;
                    cell.style.minWidth = "50px";
                } else {
                    var colType = table.rows[0].cells[i].getElementsByTagName("INPUT")[0].value;
                    var nested = (table.rows[0].cells[i].getElementsByTagName("INPUT")[0].id.split("~~#").length == 3);

                    if (nested) {
                        var id = colType + "~~#" + rowLoc + "~~#" + table.rows[0].cells[i].getElementsByTagName("INPUT")[0].id.split("~~#")[2];
                    } else {
                        id = colType + "~~#" + rowLoc;
                    }
                    cell.innerHTML = "<input type='text' onkeyup='widthAdjust(this);emptyError(this);' class='form-control form-control-borderless col-lg' id='"
                        + id
                        + "' value=''/>";
                    widthAdjust(cell.getElementsByTagName("INPUT")[0]);
                    emptyError(cell.getElementsByTagName("INPUT")[0]);
                }

            }
        }

        updateRowIndices(table);
    } else {
        row = table.insertRow(table.rows.length + 1);
        cell = row.insertCell(0);
        cell.innerHTML = '<b>' + rowLoc + ' </b>';
        cell.innerHTML += "<a id='"
            +String(table.rows.length)
            +"' class='close' onclick='deleteRow(this, true)'>"
            +"&times;"
            +"</a>";
        cell.innerHTML += "<input type='text' class='form-control form-control-borderless col-lg-1' id='"
            + rowLoc
            + "' value=''/>";
    }
};

var addFixedRow = function(){
    var table = document.getElementById("fixed_table");
    var rowNum = table.rows.length;
    var input = document.getElementById("row_select");
    var name = input.value;
    var row = table.insertRow(rowNum);
    var cell = row.insertCell(0);
    cell.innerHTML = "<b><input type='text' class='form-control form-control-borderless col-lg' "
        + "style='display:inline-block;float:left;' onkeyup='widthAdjust(this);emptyError(this);' value='"
        + name
        + "' id='"
        + name + String(rowNum)
        +"'></b><a id='" +
        + String(rowNum)
        + "' class='close' onclick='deleteRow(this, true)' style='float:left; margin-left:10px; margin-top: 5px;'>&times;</a> ";

    cell.innerHTML += "<textarea class='form-control form-control-borderless col-lg-1' id='"
        + name
        + "' onkeyup='heightAdjust(this);emptyError(this);' style='height: auto; min-width: 90vw' ></textarea>";

    var element = document.getElementById(name);
    heightAdjust(element);
    widthAdjust(document.getElementById(name + String(rowNum)));
    emptyError(element);
};

var heightAdjust =  function(element) {
    element.style.height = "1px";
    element.style.height = (element.scrollHeight)+"px";
};

var widthAdjust = function(element){

    //fancy dynamic shit
    /*element.style.width = "1px";
    element.style.width = (element.scrollWidth + 13)+"px";
    var table = element;
    while(table.tagName.localeCompare("TABLE") != 0){
        table = table.parentNode;
    }

    if(element.parentNode.tagName.localeCompare("TD") == 0){
        element.style.minWidth = table.rows[0].cells[element.parentNode.cellIndex].getElementsByTagName("INPUT")[0].style.width;
    }*/
    element.style.width = "200px";
};

var updateSelectionNumbers = function(){
    var table = document.getElementById("overlay_table");
    var list = document.getElementById("row_dropdown");


    if(list.hasChildNodes()){
        var children = list.childNodes;
        for(var i = children.length - 1; i >-1; i--){
            list.removeChild(children[i]);
        }
    }


    for(i = 1; i < table.rows.length + 1; i++){
        var option = document.createElement("li");
        option.setAttribute("id", String(i));
        option.innerHTML = "<button class='btn btn-default form-control-borderless' onclick='addRow(false,"
            + String(i)
            +")' style='width: 100%; text-align: left;'>" + i + "</button>";
        list.appendChild(option);
    }
};

var processToStrings = function(d){
   var arr = d.split(",");
   for(var i = 0; i < arr.length; i++){
       if(isNaN(parseInt(arr[i]))){
          arr[i] = "\"" + arr[i] + "\"";
       }
   }

    return arr;
};

var emptyError = function(inputElement){
    var cell = inputElement;
    while(cell.nodeName.localeCompare("TD") != 0){
        cell = cell.parentNode;
    }
    cell.className =
        cell.className.replace
        ( /(?:^|\s)danger(?!\S)/g , '' );

    if(inputElement.value.localeCompare("") == 0){
        cell.className += "danger";
    }
};

var transitionPane = function(next, element){
    element = $("#protocol_container").children("div").filter(function(){return $(this).css("display") != "none"})[0];
    var panes = ["pulses", "fixed_vars"];
    var current = 0;
    for(var i = 0; i < 2; i++){
        if(element.id.localeCompare(panes[i]) == 0){
            current = i;
            break;
        }
    }

    var transitionTo;

    if(next) {
        transitionTo = (current + 1) % 2;
    } else {
        transitionTo = current - 1;
        if(transitionTo == -1){
            transitionTo = 1;
        }
    }

    if(transitionTo == 0){
        $("#previous").fadeOut("slow", function(){
            $(this).css("visibility", "hidden").css("display", "");
            $("#next").css("visibility", "visible").hide().fadeIn("slow");
        });
        $("#get_data").fadeOut("slow", function(){
            $(this).css("visibility", "hidden").css("display", "");
        });
    }

    if(transitionTo == 1){
        $("#next").fadeOut("slow", function(){
            $(this).css("visibility", "hidden").css("display", "");
            $("#previous, #get_data").css("visibility", "visible").hide().fadeIn();
        });
    }

    animate(current, transitionTo, panes);
};

var animate = function(current, next, panes){
    $("#" + panes[current]).fadeOut("slow", function () {
        $("#" + panes[next]).fadeIn("slow", function(){
            if(next == 1){
                var fixed = $("#" + panes[1]).find("textarea");
                for(var i = 0; i < fixed.length; i++){
                    heightAdjust(fixed[i]);
                }
            }
        });
    });
};

var createBlankProtocol = function(rows, columns, nested, fixed){
    var pulseTableJQ = $("#pulse_table");
    var head = pulseTableJQ.find("thead")[0];
    for(var i = 1; i < parseInt(columns) + 1; i++){
        var cell = head.rows[0].insertCell(i);
        cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
            + "~~#" + 0
            + "' value='' onkeyup='updateRowIndices();emptyError(this);' style='float: left; width: 150px;'></b><a id='"
            + String(i)
            + "' class='close' onclick='deleteColumn(this)' style='float:right;'>&times;</a></div>";
    }

    for(i = parseInt(columns) + 1; i < parseInt(columns) + parseInt(nested) + 1; i++){
        cell = head.rows[0].insertCell(i);
        cell.innerHTML = "<div style='width:200px'><b><input type='text' class='form-control form-control-borderless col-lg' id='"
            +"~~#" + 0 + "~~#Array"
            + "' value='' onkeyup='updateRowIndices();emptyError(this);' style='float: left; width: 150px;'></b>"
            +"<span class='glyphicon glyphicon-unchecked'></span><a id='"
            + String(i)
            + "' class='close' onclick='deleteColumn(this)' style='float:right; margin-top: 7px;'>&times;</a></div>"
    }

    for(i = 0; i < rows; i++){
        addRow(true, 0);
    }


    var table = $("#fixed_table")[0];
    var rowNum = table.rows.length;
    var name = "";
    for(i = 0; i < parseInt(fixed); i++) {
        var row = table.insertRow(rowNum);
        cell = row.insertCell(0);
        cell.innerHTML = "<b><input type='text' class='form-control form-control-borderless col-lg' "
            + "style='display:inline-block;float:left;' onkeyup='widthAdjust(this);emptyError(this);' value='"
            + name
            + "' id='"
            + name + String(rowNum)
            + "'></b><a id='" + +String(rowNum)
            + "' class='close' onclick='deleteRow(this, true)' style='float:left; margin-left:10px; margin-top: 5px;'>&times;</a> ";

        cell.innerHTML += "<textarea class='form-control form-control-borderless col-lg-1' id='"
            + name
            + "' onkeyup='heightAdjust(this);emptyError(this);' style='height: auto; min-width: 90vw' ></textarea>";

        widthAdjust(document.getElementById(name + String(rowNum)));
    }
};

var getFromNewProtocolModal = function(){
    createBlankProtocol($("#pulse_sets")[0].value, $("#pulse_vars")[0].value, $("#nested_pulse_vars")[0].value, $("#fixed_vars_input")[0].value);
};





