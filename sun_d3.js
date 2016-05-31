/**
 * Created by Kevin on 5/23/2016.
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

    //generate json with one level of children
    var getJsonUser = function(user){
        var ret = {};
        ret["name"] = user.name;
        ret["type"] = "user";
        ret["id"] = user.id;
        ret["children"] = [];
        var index = 0;
        projects.forEach(function(project){
           if(project.lead_id == user.id){
               ret["children"].push({name: project.name, id: project.id, size: 1, type: "project", color: 0, index: index});
               index++;
           } else if(project.collaborators.indexOf(String(user.id)) != -1){
               ret["children"].push({name: project.name, id: project.id, size: 1, type: "project", color: 1, index: index});
               index++;
           }

        });

        ret["size"] = ret["children"].length;

        return ret;
    };
/*
    var getJsonProject = function(project){
        var ret = {};
        ret["name"] = project.name;
        ret["children"] = [];
        project.collaborators.forEach(function(collaborator){
            var collabUser;
            users.forEach(function(user){
               if(collaborator == user.id) {
                   collabUser = user;
               }
            });
            if(typeof collabUser != "undefined") {
                ret["children"].push({name: collabUser.name, id: collabUser.id, size: 1, type: "user", color: 2})
            }
        });

        return ret;
    };*/

    var getUpdatedJsonProject = function( d){
        var projectOuter;
        projects.forEach(function(project){
            if(project.id == d.id){
                projectOuter = project;
            }
        });
        if(typeof projectOuter != "undefined") {
            d["children"] = [];
            projectOuter.collaborators.forEach(function (collaborator) {
                var collabUser;
                users.forEach(function (user) {
                    if (collaborator == user.id) {
                        collabUser = user;
                    }
                });
                if (typeof collabUser != "undefined") {
                    d["children"].push({
                        name: collabUser.name,
                        id: collabUser.id,
                        size: 1,
                        type: "user",
                        color: 2
                    })
                }
            });

            d["size"] = d["children"].length;
        }


    };

    var getParents = function(d){
        var ret = [];
        while(d.hasOwnProperty("parent")){
            ret.push(d.parent);
            d = d.parent;
        }

        return ret;
    };

    var getUpdatedJsonUser = function( d){
        var userObject;
        users.forEach(function(internalUser){
            if(d.id == internalUser.id){
                userObject = internalUser;
            }
        });

        if(typeof userObject != "undefined") {
            d["children"] = [];
            projects.forEach(function (project) {
                if (project.lead_id == d.id) {
                    d["children"].push({name: project.name, id: project.id, size: 1, type: "project", color: 0});
                } else if (project.collaborators.indexOf(String(d.id)) != -1) {
                    d["children"].push({name: project.name, id: project.id, size: 1, type: "project", color: 1});
                }

            });

            d["size"] = d["children"].length;
        }

    };

    var getCondensedJson = function(d){
        console.log(d);
        if(d.hasOwnProperty("children")) {
            for (i = 0; i < d["children"].length; i++) {
                if(d["children"][i].hasOwnProperty("children")) {
                    for (j = 0; j < d["children"][i]["children"].length; j++) {
                        if (d["children"][i]["children"][j].hasOwnProperty("children")) {
                            delete d["children"][i]["children"][j]["children"];
                        }
                    }
                }
            }
        }
    }


    var width = 960;
    var height = 700;
    var radius = Math.min(width, height) / 2;

    var x = d3.scale.linear().range([0, 2 * Math.PI]);
    var y = d3.scale.linear().range([0, radius]);

    var color = d3.scale.category20c();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    var partition = d3.layout.partition()
        .sort(null)
        .value(function(d) {
           /* if(typeof d.value != "undefined")
            console.log(d.value);*/
            return 1;
        });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    var node;

    var prevNode;

    var firstUser = new User(438, "Kevin Bi");
    
    node = getJsonUser(firstUser);

    function arcTweenZoom(d) {

        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);

        return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) {x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
    }

    function arcTweenData(a, i) {
        var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
        function tween(t) {
            var b = oi(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        }
        if (i == 0) {
            // If we are on the first arc, adjust the x domain to match the root node
            // at the current zoom level. (We only need to do this once.)
            var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
            return function(t) {
                x.domain(xd(t));
                return tween(t);
            };
        } else {
            return tween;
        }
    }


    function arcTweenUpdate(d, i, a) {

        if(d.x0 == null){
            d.x0 = d.parent.x0;
            d.dx0 = d.parent.dx0;
        }

        var oi = d3.interpolate({x: d.x0, dx: d.dx0}, d);
        var xd = d3.interpolate(x.domain(), [d.x0, d.x0 + d.dx0]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);


        return function (t) {
            var b = oi(t);
            this.x0 = b.x;
            this.dx0 = b.dx;
            //return arc(b);
            if(i){
                return arc(b);
            } else {
                x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(b);
            }
        };
    }

    function arcTweenUpdateBack(d, i, a) {
        if(d.x0 == null){
            d.x0 = d.parent.x0;
            d.dx0 = d.parent.dx0;
        }

        console.log(d.opacity);

        var oi = d3.interpolate(d, {y: 1, dy: d.dy});
        var xd = d3.interpolate([d.x0, d.x0 + d.dx0], x.domain()),
            yd = d3.interpolate([d.y, 1], y.domain()),
            yr = d3.interpolate([d.y ? 20 : 0, radius], y.range());

        //var oi = d3.interpolate({x: d.x0, dx: d.dx0}, d);
        //var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx])
            //yd = d3.interpolate(y.domain(), [d.y, 1]),
            //yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);



        return function (t) {
            var b = oi(t);
            this.x0 = b.x;
            this.dx0 = b.dx;
            //return arc(b);
            if(i){
                return arc(b);
            } else {
                x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(b);
            }
        };
    }

    function opacityTween(d){
        console.log(d);
            return d3.interpolate("fill_opacity", 0);
    }

    function click(d){

        //console.log(d);

        if(d.depth > prevNode.depth) {
            if (d.type.localeCompare("project") == 0) {
                getUpdatedJsonProject(d);
            }

            if (d.type.localeCompare("user") == 0) {
 //               console.log("user");
                getUpdatedJsonUser(d);
            }

            //console.log(node);

            var value = function(d) {
                return d.size;
            };

            /*svg.selectAll("path").data(partition.nodes(node))
                .transition()
                .duration(1000)
                .attrTween("d", arcTweenUpdate);*/

           svg.selectAll("path").remove();

            var newData = svg/*.datum(node)*/.selectAll("g")
                .data(partition.nodes(node));

            newData.enter().append("path")
                .attr("d", arc)
                .style({"fill": function(d) { return color(d.color); }, "opacity": 1.0})
                .on("click", click);

            newData.append("title")
                .text(function(d) {return d.name});

            console.log("here");

            newData.transition()
                .duration(function(d) {return 1000/d.value;})
                .ease("cubic-in")
                .attrTween("d", arcTweenUpdate)
                .transition()
                .ease("cubic-out")
                .duration(1000)
                .attrTween("d", arcTweenZoom(d));

        } else if(d.depth < prevNode.depth){

            getCondensedJson(d);

            /*svg.selectAll("g")
                .data(partition.nodes(node)).enter()
                .append("path")
                .attr("d", arc)
                .style({"fill": function(d) {return color(d.color)}})
                .on("click", click)
                .each(function (d) {
                    d.x0 = d.x;
                    d.dx0 = d.dx;
                });


            svg.selectAll("path").transition()
                .duration(function(d) {return 1000/d.value;})
                .ease("cubic-out")
                .duration(1000)
                .attrTween("d", arcTweenZoom(d));*/

           // console.log(d3.select("body").selectAll("g"));

            newData = d3/*.datum(node)*/.selectAll("path")
                .data(partition.nodes(node));

            /*newData.enter().append("path")
                .attr("d", arc)
                .style("fill", function(d) { return color(d.color); })
                .on("click", click)
                .each(function(d){
                    this.x0 = d.x;
                    this.dx0 = d.dx;
                });
*/

            newData.exit().transition()
                .duration(function(d) {return 4000;})
                .ease("linear-out")
                .attrTween("d", arcTweenUpdateBack)
                .style("fill-opacity", 0)
                .remove();

            newData
                .transition()
                .ease("cubic-in")
                .duration(1000)
                .attrTween("d", arcTweenZoom(d));
        }

        prevNode = d;

    }

    var path = svg
        //.data([node])
        .selectAll("g")
        .data(partition.nodes(node))
        .enter().append("path")
        .attr("d", arc)
        .style({"fill": function(d) { return color(d.color); }, "fill-opacity": 0.5})
        .on("click", click)
        .each(function (d) {
            d.x0 = d.x;
            d.dx0 = d.dx;
        });

    path.append("title")
        .text(function(d) {return d.name;});

    prevNode = node;




};


oReq.open("get", "sql_d3.php");
oReq.send();