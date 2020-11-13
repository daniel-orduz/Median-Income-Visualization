//Width and height of map
var width = 1080;
var height = 720;
var margin = 100;

// D3 Projection
var projection = d3.geoAlbersUsa()
    .translate([width/2, height/2])    // translate to center of screen
    .scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
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

var x = d3.scaleLinear()
    .domain([36000, 77000])
    .rangeRound([800, 1000]);


var color = d3.scaleQuantize()
    .domain([36000, 77000])
    .range(["#f0f9e8", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#08589e"]);


//Create SVG element and append map to the SVG
var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);


// Add Title text
svg.append("text")
    .attr("x", width/2)
    .attr("y", (margin/2))
    .attr("text-anchor", "middle")
    .attr("font-weight", 900)
    .style("font-size", "24px")
    .style("font-family", "Courier")
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
        //console.log(d);
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) {
        return x(d[0]); })
    .attr("y", height - margin + 10)
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", height - margin)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("Median Income (Inflation Adjusted)");


// Append Div for tooltip to SVG
var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var income = [];

// Load in my states data!
d3.csv("income_data.csv", function(data) {

    // Grab State Name
    var dataState = data.State;
    //console.log(dataState);

    // Grab Median Income
    var dataValue = data.Median_Income;

    income.push({
        state: dataState,
        m_income: dataValue
    });

});


d3.json("us_states.json").then( function(json) {
    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", "darkgrey")
        .on("mouseover", function(d, i) {
        div.transition()
            .duration(200)
            .style("opacity", .8);
        div.html("State: " + i.properties.name + "<br>" + "Median Income: $" + i.properties.median_income)
            .style("left", (d.pageX + 10) + "px")
            .style("top", (d.pageY - 20) + "px")
            .style("background-color", "white");
    }).on("mouseout", function(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0);
    });
});



// svg.append("circle")
//     .attr("cx", 500)
//     .attr("cy",500)
//     .attr("r", 50)
//     .style("fill", "red");

d3.csv("states_position.csv").then( function(data) {


    // svg.append("circle")
    // .attr("cx", 500)
    // .attr("cy",500)
    // .attr("r", 50)
    // .style("fill", "red");

    //console.log(data);

    svg.selectAll("circle").data(data).enter().append("circle")
        .attr("cx", function(d) {

            temp = projection([d.lon, d.lat]);
            if (temp != null)
                return projection([d.lon, d.lat])[0];
        })
        .attr("cy", function(d) {
            temp = projection([d.lon, d.lat]);
            if (temp != null)
                return projection([d.lon, d.lat])[1];
        })
        .attr("r",  function(d) {

            if (d != NaN) {
                var temp = 0;
                for (var i = 0; i < income.length; i++) {
                    if (income[i].state == d.name) {
                        //console.log("match");
                        temp = income[i].m_income;
                        //console.log(temp);
                    }
                }
                // console.log("--------------")
                // console.log(temp);
                // console.log(Math.sqrt(temp));
                return Math.sqrt(temp - 33000) / 9;        // SIZE OF THE CIRCLE
            }
            else {
                return  0;
            }
        })
        .style("fill", function (d) {
            for (var i = 0; i < income.length; i++) {
                if (income[i].state == d.name) {
                    //console.log("match");
                   return color(income[i].m_income)
                }
            }
        })
        .style("opacity", 0.85)
        .on("mouseover", function(d, i) {
            div.style("opacity", .9);
            div.text(i.state)
                .style("left", (d.pageX) + "px")
                .style("top", (d.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.style("opacity", 0);
        });
});


