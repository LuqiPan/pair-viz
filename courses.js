var width = 1280;
var height = 1000;

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);

var force = d3.layout.force()
    .gravity(.05)
    .distance(300)
    .charge(-100)
    .size([width, height]);

// highlight related node
function highlight(related) {
}

function get_related_courses(n, dependencies) {
    return dependencies[n.index];
}

// map from course name to dependency name list
function build_dependency(nodes, links) {
    var map = {};
    links.forEach(function(link) {
        var index = link.source.index;
        if (map[index] == null)
            map[index] = [link.target];
        else
            map[index].push(link.target);
    });
    return map;
}

function run(error, json) {
    var linkedByIndex = {};
    json.links.forEach(function(d) {
        linkedByIndex[d.source + "," + d.target] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    };

    /* force will build the index internally */
    force
        .nodes(json.nodes)
        .links(json.links)
        .start();

    // build dependency mapping
    var dependencies = build_dependency(json.nodes, json.links);

    var link = svg.selectAll(".link")
        .data(json.links)
        .enter().append("line")
        .attr("class", "link");

    var node = svg.selectAll(".node")
        .data(json.nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(force.drag)
        .on("mouseover", fade(.1))
        .on("mouseout", fade(1));

    function getIndex(o) {
        json.nodes.forEach(function(d, i) {
            if (d.name == o.name) return i;
        });
    }

    function fade(opacity) {
        return function(d) {
            node.style("stroke-opacity", function(o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            link.style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
        };
    }

    node.append("circle")
        .attr("r", 6);
    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) { return d.name });

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
    });

}

d3.json("pairs.json", run);