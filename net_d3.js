/**
 * Created by Kevin on 5/20/2016.
 */

var oReq = new XMLHttpRequest();

function Project(id, lead_id, name, collaborators){
    this.id = id;
    this.lead_id = lead_id;
    this.name = name;
    this.collaborators = collaborators;
}

function User(id, name){
    this.id = id;
    this.name = name;
}

oReq.onload = function(){

    //fill arrays of unprocessed data
    var split = this.response.split("~~#");
    var users = [];
    var userIDs = [];
    var projects = [];
    var usersIn = split[0].split("\n");
    var projectsIn = split[1].split("\n");
    var collabIn = split[2].split("\n");

    //process the array of users into user objects
    for(var i = 0; i < usersIn.length; i++){
        usersIn[i] = usersIn[i].split("\t");
        var tempUser = new User(usersIn[i][0], usersIn[i][1]);
        users.push(tempUser);
        userIDs.push(usersIn[i][0]);
    }

    //process the array of users, null for collaborators
    for(i = 0; i < projectsIn.length; i++){
        projectsIn[i] = projectsIn[i].split("\t");
        var tempProject = new Project(projectsIn[i][1], projectsIn[i][2], projectsIn[i][0], null);
        projects.push(tempProject);
    }

    //associate collaborators with their projects
    for(i = 0; i < collabIn.length; i++){
        collabIn[i] = collabIn[i].split("\t");
    }

    for(i = 0; i < projects.length; i++){
        var temp = [];
        for(var j = 0; j < collabIn.length; j++){
            if(collabIn[j][0] == projects[i].id){
                temp.push(collabIn[j][1]);
            }
        }
        projects[i].collaborators = temp;
    }

    //postprocessing: convert the projects into links - that is, whenever two people work on a project they get a link
    var userInteractions = {};
    var userJSON = [];

    //create object of users where each user has fields indicating how many times they have worked with others
    users.forEach(function(user){
        userInteractions[user.id] = {};
        userJSON.push({name: user.name});

        projects.forEach(function(project){

            //if this person has worked on this project
            if(user.id == project.lead_id){
                project.collaborators.forEach(function(collaborator){
                    if(userInteractions[user.id].hasOwnProperty(collaborator)){
                        userInteractions[user.id][collaborator] += 1;
                    } else {
                        userInteractions[user.id][collaborator] = 1;
                    }
                })
            } else if(project.collaborators.indexOf(user.id) != -1){
                if(userInteractions[user.id].hasOwnProperty(project.lead_id)){
                    userInteractions[user.id][project.lead_id] += 1;
                } else {
                    userInteractions[user.id][project.lead_id] = 1;
                }

               project.collaborators.forEach(function(collaborator){
                   if(collaborator != user.id){
                       if(userInteractions[user.id].hasOwnProperty(collaborator)){
                           userInteractions[user.id][collaborator] += 1;
                       } else {
                           userInteractions[user.id][collaborator] = 1;
                       }
                   }
               })
            }

        });

        //delete people who didn't work with anyone
        if(Object.keys(userInteractions[user.id]).length == 0){
            delete userInteractions[user.id];
        }
    });

    var links = [];

    //convert to actual JSON-style object of links only
    Object.keys(userInteractions).forEach(function(user){
        Object.keys(userInteractions[user]).forEach(function(coWorker){
            links.push({source: userIDs.indexOf(user), target: userIDs.indexOf(coWorker), value: userInteractions[user][coWorker]});
            delete userInteractions[coWorker][user];
        })
    });

    //final data object
    var data = {nodes: userJSON, links: links};

    //settings for the actual network graph
    var width = 1200;
    var height = 900;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-500)
        .linkDistance(120)
        .gravity(0.4)
        .size([width, height]);

    //initialize zoom and drag functions
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) {return d;})
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);


    function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        console.log("called");
        d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
        d3.select(this).classed("dragging", false);
    }

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .call(zoom);

    var container = svg.append("g");

    container.append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');

    function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    setTimeout(function() {
        //draw the network graph
        force
            .nodes(data.nodes)
            .links(data.links)
            .start();

        force.tick();

        //find the nodes with no connections
        var emptyNodes = force.nodes().filter(function (d) {
            return d.weight == 0
        });

        //remove them
        for (i = emptyNodes.length - 1; i > -1; i--) {
            data.nodes.splice(emptyNodes[i].index, 1);
        }

        force.start();
        force.tick();
        var n = userJSON.length;
        console.log(n);
        for(var i = 0; i < 295; i++) force.tick();

        var link = container.selectAll(".link")
            .data(data.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function (d) {
                return Math.sqrt(d.value);
            });

        var node = container.selectAll(".node")
            .data(data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 15)
            .style("fill", function (d) {
                return color(5);
            });
        //.call(force.drag);

        node.append("title")
            .text(function(d) {return d.name});
/*

        var text = container.append("text")
            .attr("class", "labels")
            .selectAll("text")
            .data(data.nodes)
            .enter().append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name
            });
*/

        force.on("tick", function () {
            link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                    return d.y;
                });
        });
    }, 10);
};

oReq.open("get", "sql_d3.php");
oReq.send();