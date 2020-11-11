//Width and height of map
var width = 960;
var height = 500;

// D3 Projection
var projection = d3.geo.albersUsa()
    .translate([width/2, height/2])    // translate to center of screen
    .scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
    .projection(projection);  // tell path generator to use albersUsa projection


// Define linear scale for output
var color = d3.scale.linear()
    .range(["rgb(213,222,217)","rgb(69,173,168)","rgb(84,36,55)","rgb(217,91,67)"]);

var legendText = ["Option1", "Option2", "Option3", "Option4"];

//Create SVG element and append map to the SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Append Div for tooltip to SVG
var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load in my states data!
d3.csv("income_data.csv", function(data) {
    color.domain([0, 1, 2, 3]); // setting the range of the input data

    d3.json("us_states.json", function(json) {
        for (var i = 0; i < data.length; i ++) {
            //console.log(data[i].State);

            // Grab State Name
            var dataState = data[i].State;

            // Grab data value
            var dataValue = data[i].testField;

            // Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++)  {
                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {
                    // Copy the data value into the JSON
                    json.features[j].properties.test_value = dataValue;
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
                var value = d.properties.test_value;

                if (value) {
                    //If value exists…
                    return color(value);
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });
    });

});