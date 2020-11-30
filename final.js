//Width and height of map
var width = 1080;
var height = 720;
var margin = 100;

var times = d3.utcYears(Date.UTC(1984, 0, 1), Date.UTC(1989, 0, 1))

// D3 Projection
var projection = d3.geoAlbersUsa()
    .translate([width/2, height/2])    // translate to center of screen
    .scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
    .projection(projection);  // tell path generator to use albersUsa projection

var x = d3.scaleLinear()
    .domain([35000, 90000])
    .rangeRound([800, 1000]);


var color = d3.scaleQuantize()
    .domain([35000, 90000])
    .range(["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]);



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
    .text("Median Income Choropleth, United States, 1984-2017");


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
        //console.log("X1: " + x(1))
        return x(d[0]) + 40; })
    .attr("y", height - margin-90)
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0] + 40)
    .attr("y", height - margin-95)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("Median Income");

g.append("g").attr("class", "axisBar").attr("transform", "translate(40, 540)")
    .call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(function(x, i) { return i ? x : x; })
        .tickValues(color.domain()))
    .select(".domain")
    .remove();


// Append Div for tooltip to SVG
var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var income = [];
var incomeJson = {};
var incomeRanges = {};

// Load in my states data!
d3.csv("test.csv", function(data) {

    var year = data.Year
    // Grab State Name
    var dataState = data.State;
    //console.log(dataState);
    // Grab Median Income
    var dataValue = data.Median_Income;

    var minWage = data.HMW;

    income.push({
        id: year+"-"+dataState,
        year: year,
        state: dataState,
        m_income: dataValue,
        min_wage: minWage
    });

});


d3.csv("test.csv", function(data) {

    var year = data.Year
    // Grab State Name
    var dataState = data.State;
    //console.log(dataState);
    // Grab Median Income
    var dataValue = data.Median_Income;

    var minWage = data.HMW;

    var id = year+"-"+dataState;
    incomeJson[id] = {
        year: year,
        state: dataState,
        m_income: dataValue,
        min_wage: minWage
    };

});

d3.csv("income-ranges.csv", function(data) {

    var year = data.Year
    // Grab State Name
    var ma = data.Max;
    //console.log(dataState);
    // Grab Median Income
    var mi = data.Min;

    incomeRanges[year] = {
        year: year,
        max: ma,
        min: mi
    };

});




d3.json("us_states.json").then( function(json) {

    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr('class', 'statePath')
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", function(d) {
            var value;
            for (var i = 0; i < income.length; i++) {

                    if (income[i].year == 1984) {

                        if (income[i].state == d.properties.name) {
                            value = income[i].m_income;
                            d.properties.median_income = value;
                            break;
                        }
                    }
            }

            // check value and map it to the correct colour based on the colour scale
            if (value) {
                return color(value);
            } else {
                //If value is undefined…
                return "rgb(213,222,217)";
            }
        }).on("mouseover", function(d, i) {

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


// Time Slider Minimum Wage
var dataTime = d3.range(0, 34).map(function(d) {
    return new Date(1984 + d, 1, 31);
});

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(900)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .on('onchange', val => {

                var y = d3.timeFormat('%Y')(val);
                svg.selectAll('.statePath')
                    .style("fill", function(d) {
                        var value;
                        var id = y + "-" + d.properties.name;
                        value = incomeJson[id].m_income;
                        d.properties.median_income = value;

                        // check value and map it to the correct colour based on the colour scale
                        if (value) {
                            return color(value);
                        } else {
                            //If value is undefined…
                            return "rgb(213,222,217)";
                        }
                });
    });

var gTime = d3
    .select('div')
    .append('svg')
    .attr('class', 'SLIDER')
    .attr('width', 1080)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime.call(sliderTime);


//-------------------------------------------------------------------------------------------------


var path2 = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
    .projection(projection);  // tell path generator to use albersUsa projection


//second axis locator
var x2 = d3.scaleLinear()
    .domain([1.0, 12.0])
    .rangeRound([800, 1000]);

//second coloour scale
var color2 = d3.scaleQuantize()
    .domain([1.0, 12.0])
    .range(["#f6eff7", "#d0d1e6", "#a6bddb", "#67a9cf", "#1c9099", "#016c59"]);


//Create SVG element and append map to the SVG
var svg2 = d3.select(".MapTwo")
    .attr("width", width)
    .attr("height", height);


// Add Title text
svg2.append("text")
    .attr("x", width/2)
    .attr("y", (margin/2))
    .attr("text-anchor", "middle")
    .attr("font-weight", 900)
    .style("font-size", "24px")
    .style("font-family", "Courier")
    .style("fill", "white")
    .text("Minimum Wage Choropleth, United States, 1984-2017");


//
var g2 = svg2.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g2.selectAll("rect")
    .data(color2.range().map(function(d) {
        d = color2.invertExtent(d);
        if (d[0] == null) {
            d[0] = x2.domain()[0];
        }
        if (d[1] == null) d[1] = x2.domain()[1];
        //console.log(d);
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) {
        //console.log("X1: " + x(1))
        return x2(d[0]) + 40; })
    .attr("y", height - margin-90)
    .attr("width", function(d) { return x2(d[1]) - x2(d[0]); })
    .attr("fill", function(d) { return color2(d[0]); });

g2.append("text")
    .attr("class", "caption")
    .attr("x", x2.range()[0] + 40)
    .attr("y", height - margin-95)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("Minimum Wage");

g2.append("g").attr("class", "axisBar").attr("transform", "translate(40, 540)")
    .call(d3.axisBottom(x2)
        .tickSize(13)
        .tickFormat(function(x, i) { return i ? x : x; })
        .tickValues(color2.domain()))
    .select(".domain")
    .remove();

d3.json("us_states.json").then( function(json) {

    // Bind the data to the SVG and create one path per GeoJSON feature
    svg2.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path2)
        .attr('class', 'statePath2')
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", function(d) {
            var value;
            for (var i = 0; i < income.length; i++) {

                if (income[i].year == 1984) {

                    if (income[i].state == d.properties.name) {
                        value = income[i].min_wage;
                        d.properties.min_wage = value;
                        break;
                    }
                }
            }

            // check value and map it to the correct colour based on the colour scale
            if (value) {
                return color2(value);
            } else {
                //If value is undefined…
                return "rgb(213,222,217)";
            }
        }).on("mouseover", function(d, i) {
        div.transition()
            .duration(200)
            .style("opacity", .8);
        div.html("State: " + i.properties.name + "<br>" + "Minimum Wage: $" + i.properties.min_wage)
            .style("left", (d.pageX + 10) + "px")
            .style("top", (d.pageY - 20) + "px")
            .style("background-color", "white");
    }).on("mouseout", function(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0);
    });
});



var sliderTime2 = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(900)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .on('onchange', val => {

        var y = d3.timeFormat('%Y')(val);

        console.log(y);
        svg2.selectAll('.statePath2')
            .style("fill", function(d) {

                //console.log(d);
                var value;
                var id = y + "-" + d.properties.name;
                value = incomeJson[id].min_wage;

                d.properties.min_wage = value;
                console.log(value);

                // check value and map it to the correct colour based on the colour scale
                if (value) {
                    return color2(value);
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });
    });

var gTime2 = d3
    .select('.MinimumWage')
    .append('svg')
    .attr('class', 'SLIDER2')
    .attr('width', 1080)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime2.call(sliderTime2);


