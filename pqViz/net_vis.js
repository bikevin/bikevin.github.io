/**
 * Created by Kevin on 5/17/2016.
 */
function reqListener () {
    console.log(this.responseText);
}

var oReq =  new XMLHttpRequest();

function Project(id, lead_id, name, collaborators){
    this.id = id;
    this.lead_id = lead_id;
    this.name = name;
    this.collaborators = collaborators;
}

function Protocol(id, creator_id, projects, name){
    this.id = id;
    this.creator_id = creator_id;
    this.projects = projects;
    this.name = name;
}

function User(id, name){
    this.id = id;
    this.name = name;
}

oReq.onload = function(){

    //gather stuff
    var split = this.response.split("~~#");
    var users = [];
    var projects = [];
    var protocols = [];
    var usersIn = split[0].split("\n");
    var projectsIn = split[1].split("\n");
    var protocolsIn = split[3].split("\n");
    var collabIn = split[2].split("\n");
    var projProtIn = split[4].split("\n");

    //populate the users array
    for(var i = 0; i < usersIn.length; i++){
        usersIn[i] = usersIn[i].split("\t");
        var tempUser = new User(usersIn[i][0], usersIn[i][1]);
        users.push(tempUser);
    }

    var collabs = [];

    //populate the projects array, leaving the collaborators field as null
    for(i = 0; i < projectsIn.length; i++){
        projectsIn[i] = projectsIn[i].split("\t");
        var tempProject = new Project(projectsIn[i][1], projectsIn[i][2], projectsIn[i][0], null);
        collabs.push(projectsIn[i][2]);
        projects.push(tempProject);
    }

    //populate the protocols array, leaving the projects field as null
    for(i = 0; i < protocolsIn.length; i++){
        protocolsIn[i] = protocolsIn[i].split("\t");
        var tempProtocol = new Protocol(protocolsIn[i][0], protocolsIn[i][2], null, protocolsIn[i][1]);
        protocols.push(tempProtocol);
    }

    //populate the collaborators field in the project objects
    for(i = 0; i < collabIn.length; i++){
        collabIn[i] = collabIn[i].split("\t");
    }

    for(i = 0; i < projects.length; i++){
        var temp = [];
        for(var j = 0; j < collabIn.length; j++){
            if(collabIn[j][0] == projects[i].id){
                temp.push(collabIn[j][1]);
                collabs.push(collabIn[j][1]);
            }
        }
        projects[i].collaborators = temp;
    }

    for(i = users.length - 1; i > -1; i--){
        if(collabs.indexOf(users[i].id) == -1){
            users.splice(i, 1);
        }
    }

    //populate the projects field in the protocol objects
    for(i = 0; i < projProtIn.length; i++){
        projProtIn[i] = projProtIn[i].split("\t");
    }
    for(i = protocols.length - 1; i != -1; i--){
        temp = [];
        for(j = 0; j < projProtIn.length; j++){
            if(projProtIn[j][1] == protocols[i].id){
                temp.push(projProtIn[j][0]);
            }
        }
        if(temp.length != 0) {
            protocols[i].projects = temp;
        } else {
            protocols.splice(i, 1);
        }
    }

    var nodes = new vis.DataSet();

    var edges = new vis.DataSet();
    for(i = 0; i < users.length; i++){
        nodes.add({id: i, user_id: users[i].id, name: users[i].name, label: users[i].name,
            size: 40, color: "rgb(255,168, 7)", type: "user", shape: "dot"});
    }
    for(i = 0; i < projects.length; i++){
        nodes.add({id: i + users.length,
            project_id: projects[i].id, lead_id: projects[i].lead_id, name: projects[i].name, label: projects[i].name, collaborators: projects[i].collaborators,
            type: "project", shape: "diamond"});
    }
   /* for(i = 0; i < protocols.length; i++){
        nodes.add({id: i + users.length + projects.length,
            protocol_id: protocols[i].id, creator_id: protocols[i].creator_id, name: protocols[i].name , type: "protocol", shape: "triangle"});
    }*/

    var userSet = nodes.get({
        fields: ["user_id", "id"],
        filter: function(item){
            return(!(item.type.localeCompare("user")));
        }
    });

    var userSetIds = [];
    userSet.forEach(function(currentValue, index, array){
        userSetIds.push(currentValue.user_id);
    });

    var projSet = nodes.get({
        fields: ["lead_id", "id", "collaborators"],
        filter: function(item){
            return(!(item.type.localeCompare("project")));
        }
    });

    edges = new vis.DataSet();

    var projDegree = {};
    var userDegree = {};

    projSet.forEach(function(currentValue, index, array){
        if(userSetIds.indexOf(currentValue.lead_id) != -1){
            edges.add({from: currentValue.id, to: userSet[userSetIds.indexOf(currentValue.lead_id)].id});
            if(projDegree.hasOwnProperty(String(currentValue.id))){
                projDegree[String(currentValue.id)] += 1;
            } else {
                projDegree[String(currentValue.id)] = 1;
            }
            if(userDegree.hasOwnProperty(String(userSet[userSetIds.indexOf(currentValue.lead_id)].id))){
                userDegree[userSet[userSetIds.indexOf(currentValue.lead_id)].id] += 1;
            } else {
                userDegree[userSet[userSetIds.indexOf(currentValue.lead_id)].id] = 1;
            }
            var collabs = currentValue.collaborators;
            collabs.forEach(function(currentValue2, index2, array2){
                if(userSetIds.indexOf(currentValue2) != -1){
                    edges.add({from:currentValue.id, to: userSet[userSetIds.indexOf(currentValue2)].id});
                    if(projDegree.hasOwnProperty(String(currentValue.id))){
                        projDegree[String(currentValue.id)] += 1;
                    } else {
                        projDegree[String(currentValue.id)] = 1;
                    }
                    if(userDegree.hasOwnProperty(String(userSet[userSetIds.indexOf(currentValue.lead_id)].id))){
                        userDegree[userSet[userSetIds.indexOf(currentValue.lead_id)].id] += 1;
                    } else {
                        userDegree[userSet[userSetIds.indexOf(currentValue.lead_id)].id] = 1;
                    }
                }
            })
        }
    });

    nodes.forEach(function(currentValue, index, array){
       /* if(!currentValue.type.localeCompare("user")){

            if(userDegree.hasOwnProperty(currentValue.id)) {
                temp = userDegree[currentValue.id] * 10;
                nodes.update({id: currentValue.id, size: temp});
            }

        }*/
        if(!currentValue.type.localeCompare("project")){

            if(projDegree.hasOwnProperty(currentValue.id)) {
                temp = projDegree[currentValue.id] * 10;
                nodes.update({id: currentValue.id, size: temp});
            }
        }
    });
/*

    for(i = 0; i < users.length; i++){
        nodes.add({id: i, user_id: users[i].id, name: users[i].name, label: users[i].name,
            size: 40, color: "rgb(255,168, 7)", type: "user", shape: "dot"});
    }

    var usersObject = {};

    users.forEach(function(user){
        usersObject[user.id] = {};
        projects.forEach(function(project){
            project.collaborators.push(project.lead_id);
            if((project.collaborators.length != 0) && (project.collaborators.indexOf(user.id) != -1)){
                project.collaborators.forEach(function(collaborator){
                    if(collaborator != user.id){
                        var userThing = usersObject[user.id];
                        if(userThing.hasOwnProperty(collaborator)){
                            userThing[collaborator] += 1;
                        } else {
                            userThing[collaborator] = 1;
                        }
                    }
                })
            }
        });
        if(Object.keys(usersObject[user.id]).length == 0){
            delete usersObject[user.id];
        }
    });

    var newNodes = new vis.DataSet;

    Object.keys(usersObject).forEach(function(user){
        Object.keys(usersObject[user]).forEach(function(collab){
            var internalUser = nodes.get({
                filter: function(item){
                    return item.user_id == user;
                }
            });
            var internalCollab = nodes.get({
                filter: function(item){
                    return item.user_id == collab;
                }
            });
            edges.add({from: internalUser[0].id, to: internalCollab[0].id, value: usersObject[user][collab] * 2});
            delete usersObject[collab][user];
        })
    });
*/

    var container = document.getElementById("mynetwork");
    var data = {nodes: nodes, edges: edges};
    var options = {layout: {improvedLayout: false},
                   physics: {
                       enabled: true,
                       barnesHut:{
                            centralGravity: 0.01
                           },
                       forceAtlas2Based: {
                         gravitationalConstant: -50,
                           //avoidOverlap: 1,
                           springConstant: 0.2
                       },
                       stabilization:{
                         iterations: 250
                       },
                       solver: "forceAtlas2Based"
                   }
    };
    var network = new vis.Network(container, data, options);

    console.log(network);

};

oReq.open("get", "sql_vis.php", true);
oReq.send();