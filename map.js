//Width and height of map
var width = 1080;
var height = 720;
var margin = 100;

// D3 Projection
var projection = d3.geo.albersUsa()
    .translate([width/2, height/2])    // translate to center of screen
    .scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
    .projection(projection);  // tell path generator to use albersUsa projection

// const range_array = [];
// var preload_data = d3.csv("income_data.csv", function (data) {
//
//     data.sort(function(x, y){  //look at entry x and entry y
//
//         //x.frequency > y.frequency? yes, x should come first
//         return d3.descending( x.Median_Income, y.Median_Income);
//     });
//
//    for (let i = 0; i < data.length; i++) {
//        range_array.push(data[i].Median_Income);
//    }
// });

var x = d3.scale.linear()
    .domain([36000, 77000])
    .rangeRound([800, 1000]);


var color = d3.scale.quantize()
    .domain(d3.range(36000, 77000, 1))
    .range(["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]);


//Create SVG element and append map to the SVG
var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Background
// svg.append("rect")
//     .attr("width", "100%")
//     .attr("height", "100%")
//     .attr("fill", "#41B3A3");

// Add Title text
svg.append("text")
    .attr("x", width/2)
    .attr("y", (margin/2))
    .attr("text-anchor", "middle")
    .attr("font-weight", 900)
    .style("font-size", "24px")
    .style("font-family", "Alegrya")
    .style("fill", "white")
    .text("Median Income Chloropleth, United States, 1984");


var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g.selectAll("rect")
    .data(color.range().map(function(d) {
        d = color.invertExtent(d);
        if (d[0] == null) {
            d[0] = x.domain()[0];
        }
        if (d[1] == null) d[1] = x.domain()[1];
        console.log(d);
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) {
        console.log("X1: " + x(1));
        return x(d[0]); })
    .attr("y", height - margin + 10)
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", height - margin)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Unemployment rate");




// Append Div for tooltip to SVG
var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load in my states data!
d3.csv("income_data.csv", function(data) {
    //color.domain([0, 1, 2, 3]); // setting the range of the input data

    d3.json("us_states.json", function(json) {
        for (var i = 0; i < data.length; i ++) {

            // Grab State Name
            var dataState = data[i].State;

            // Grab data value
            var dataValue = data[i].Median_Income;

            // Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++)  {
                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {
                    // Copy the data value into the JSON
                    json.features[j].properties.median_income = dataValue;
                    break;

                }
            }

        }

        // Bind the data to the SVG and create one path per GeoJSON feature
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", function(d) {

                // Get data value
                var value = d.properties.median_income;

                if (value) {
                    //If value exists…
                    return color(value);
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            }).on("mouseover", function(d) {
                console.log(d)
            div.transition()
                .duration(200)
                .style("opacity", .8);
            div.html("State: " + d.properties.name + "<br>" + "Median Income: $" + d.properties.median_income)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px")
                .style("background-color", "white");
            }).on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });

});