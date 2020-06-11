d3.timeFormatDefaultLocale({
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["€", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d.%m.%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato"],
        "shortDays": ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
        "months": ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
        "shortMonths": ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
    });

moment.locale('it');
var infograph_config = JSON.parse(document.getElementById('infograph_config').getAttribute('data'));
// console.log('infograph_config', infograph_config);
// infograph_config.graph_type = 'bar';
console.log('graph_type:',infograph_config.graph_type);
console.log('axis1:',infograph_config.axis1);
console.log('axis2:',infograph_config.axis2);

var infograph_data = JSON.parse(document.getElementById('infograph_data').getAttribute('data'));
console.log('infograph_data', infograph_data);
var sum = d3.sum(infograph_data.map(function(d) { return d.axis2; }));

var margin = {top: 20, right: 20, bottom: 30, left: 80};

var tooltip = d3.select("body").append("div").attr("class", "toolTip");
var tooltip_show = function(d){
	if(d.data)
		d = d.data;
	tooltip
		.style("left", d3.event.pageX - 50 + "px")
		.style("top", d3.event.pageY - 90 + "px")
		.style("display", "inline-block")
		.html("<strong>" + infograph_config.axis1 + ": </strong>" + d.axis1
                         + "<br><strong>" + infograph_config.axis2 + ": </strong>" + d.axis2.toLocaleString('it')
                         + (infograph_config.graph_type=='pie' ? " (" + (Math.round((d.axis2/sum*100) * 100) / 100) + "%)" : "")
                );
};
var tooltip_hide = function(d){
	tooltip
		.style("display", "none");
};

var hide_label_percentage = infograph_config.hide_label_percentage ? infograph_config.hide_label_percentage : 0.00;
var aggregation_percentage = infograph_config.aggregation_percentage ? infograph_config.aggregation_percentage : 0.00;

function aggregate(data){
	var aggregated = [];
	var other = {axis1: "Altro", axis2: 0}
	infograph_data.map(function(d) { 
		if(d.axis2/sum<aggregation_percentage){
			// aggregation
			other.axis2+=d.axis2;
		}else{
			aggregated.push(d);
		}
	});
	if(other.axis2!=0)
		aggregated.push(other);
	return aggregated;
}

if(infograph_config.graph_type=='pie'){
	/*
	 * PIE CHART
	 */
	var svg_pie = d3.select("svg.pie_chart");
	var pie_margin = 200;
	if(infograph_config.margin)
		pie_margin+=infograph_config.margin;

	var width_pie = +svg_pie.attr("width") - pie_margin;	// - margin.left - margin.right;
	var height_pie = +svg_pie.attr("height") - pie_margin;	// - margin.top - margin.bottom;
	var radius = Math.min(width_pie, height_pie) / 2;
	var r = (Math.min(width_pie, height_pie) - 50) / 2;



	var pie_data = aggregate(infograph_data);

	var g_pie = svg_pie.append("g")
		.attr("transform", "translate(" + ((width_pie/2) + (pie_margin/2)) + "," + ((height_pie/2) + (pie_margin/2)) + ")");

	var pie = d3.pie().sort(null).value(function(d) { return d.axis2; });

	var path = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	var outerArc = d3.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);

	var arc = d3.arc()
	    .outerRadius(r - 12)
	    .innerRadius(2);

	var labelArc = d3.arc()
	    .outerRadius(r + 20)
	    .innerRadius(r-5);

	var label_margin = -100;
	if(infograph_config.label_margin)
		label_margin+=infograph_config.label_margin;
	var label = d3.arc()
			.outerRadius(radius -40)//+ label_margin)
			.innerRadius(radius -40)//+ label_margin);

	var arc = g_pie.selectAll(".arc")
		.data(pie(pie_data))
		.enter().append("g")
			.attr("class", "arc")
			.on("mousemove", tooltip_show)
	  		.on("mouseout", tooltip_hide);

	var gradient = jsgradient.generateGradient(
                infograph_config.gradient_start ? infograph_config.gradient_start : '#002742',
                infograph_config.gradient_end ? infograph_config.gradient_end : '#a3a3a3',
                pie_data.length);
	var color = d3.scaleOrdinal(gradient)
		.domain(pie_data.map(function(d) { 
			return d.axis1+"_"+d.axis2; 
		}));
	arc.append("path")
		.attr("d", path)
		.attr("fill", function(d) { 
			console.log(color(d.data.axis1+"_"+d.data.axis2));
			return color(d.data.axis1+"_"+d.data.axis2); 
		});

	function midAngle(d) {
		return d.startAngle + (d.endAngle - d.startAngle) / 2;
	}

	arc.append("text")
//		.attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
//		.attr("dy", "0.35em")
		.style('fill', function(d){
			return d.data.axis2/sum<hide_label_percentage ? "none" : "black";
		})
		.text(function(d) { return d.data.axis1; })
		.attr("transform", function(d,i){
			var pos = outerArc.centroid(d);
			pos[0] = radius * 1.1 * (midAngle(d) < Math.PI ? 1 : -1);
			return "translate("+ pos +")";
		})
		.attr("text-anchor", function(d){
			return midAngle(d) < Math.PI ? 'start' : 'end';
		})
		.attr("dy", 5 );
	
	var polyline = g_pie.selectAll("polyline")
		.data(pie(pie_data), function(d) {
        		return d.data.currency;
		})
		.enter()
			.append("polyline")
			.attr("points", function(d,i) {
				var pos = outerArc.centroid(d);
				pos[0] = radius * 1.05 * (midAngle(d) < Math.PI ? 1 : -1);
				var o = outerArc.centroid(d);
				//return [label.centroid(d),[o[0],0[1]] , pos];
				return [label.centroid(d),[o[0],pos[1]] , pos];
			})
			.style("fill", "none")
			.attr('stroke', function(d){
		                return d.data.axis2/sum<hide_label_percentage ? "none" : "black";
			})
			.style("stroke-width", "2px");

} else if(infograph_config.graph_type=='line'){
	/*
	 * LINE CHART
	 */
	var svg_line = d3.select("svg.line_chart");
	var width_line = +svg_line.attr("width") - margin.left - margin.right;
	var height_line = +svg_line.attr("height") - margin.top - margin.bottom;
	var g_line = svg_line.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// var x_line = d3.scaleBand()
	// 		.rangeRound([0, width_line])
	// 		.padding(1);

	var x_line = d3.scaleTime()
    .rangeRound([0, width_line]);

	var y_line = d3.scaleLinear()
		.rangeRound([height_line, 0]);

	var line = d3.line()
		.x(function(d) { return x_line(d.axis1); })
		.y(function(d) { return y_line(d.axis2); })

	var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
//	var parseTime = d3.timeParse("%d-%m-%Y");
	var line_data = infograph_data.map(function(d) {
//console.log(d.axis1.replace(/\//g, "-"), d.axis1.replace(/\//g, "-"), d.axis1.replace(/\//g, "-"), d.axis1.replace(/\//g, "-"))
		return {
			'axis1': parseTime(moment(d.axis1).tz("Europe/Rome").format("YYYY-MM-DDTHH:mm:ss")),
//			'axis1': parseTime(moment(d.axis1.replace(/\//g, "-")).tz("Europe/Rome").format("DD-MM-YYYY")),
			'axis2': d.axis2
		};
	})

	x_line.domain(d3.extent(line_data, function(d) { return d.axis1; }));
	y_line.domain(d3.extent(line_data, function(d) { return d.axis2; }));

	g_line.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height_line + ")")
      .call(d3.axisBottom(x_line)
			// .tickFormat(d3.timeFormatLocale(locale_it).timeFormat("%Y-%m-%d"))
		)
    // .select(".domain")
    //   .remove()
			;

  g_line.append("g")
			.attr("class", "axis axis--y")
		  .call(d3.axisLeft(y_line))
    .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text(infograph_config.axis2)
			;

  g_line.append("path")
			.attr("class", "line")
			.datum(line_data)
      .attr("d", line);

	var focus = g_line.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("line")
      .attr("class", "x-hover-line hover-line")
      .attr("y1", 0)
      .attr("y2", height_line);

  focus.append("line")
      .attr("class", "y-hover-line hover-line")
      .attr("x1", width_line)
      .attr("x2", width_line);

  focus.append("circle")
      .attr("r", 3);

  // focus.append("text")
  //     .attr("x", 15)
  //   	.attr("dy", ".31em");

  svg_line.append("rect")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("class", "overlay")
      .attr("width", width_line)
      .attr("height", height_line)
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

	var bisectDate = d3.bisector(function(d) { return d.axis1; }).left;

  function mousemove() {
    var x0 = x_line.invert(d3.mouse(this)[0]),
        i = bisectDate(line_data, x0, 1),
        d0 = line_data[i - 1],
        d1 = line_data[i],
        d = x0 - d0.axis1 > d1.axis1 - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x_line(d.axis1) + "," + y_line(d.axis2) + ")");
    // focus.select("text").text(function() { return d.axis2; });
    focus.select(".x-hover-line").attr("y2", height_line - y_line(d.axis2));
    focus.select(".y-hover-line").attr("x2", width_line + width_line);
		tooltip_show({
			'axis1': moment(d.axis1).tz("Europe/Rome").format("D MMM YYYY, HH:mm:ss"),
			'axis2': d.axis2
		});
  }

}else if(infograph_config.graph_type=='bar'){
	/*
	 * BAR CHART
	 */

	if(infograph_config.axis1_margin)
		margin.bottom+=infograph_config.axis1_margin;

	var svg_bar = d3.select("svg.bar_chart");
	var width_bar = +svg_bar.attr("width") - margin.left - margin.right;
	var height_bar = +svg_bar.attr("height") - margin.top - margin.bottom;

	var x_bar = d3.scaleBand()
		.rangeRound([0, width_bar])
		.padding(0.1);

	var y_bar = d3.scaleLinear()
		.rangeRound([height_bar, 0]);

	var g_bar = svg_bar.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//	var bar_data = aggregate(infograph_data);
	var bar_data = infograph_data;

	x_bar.domain(bar_data.map(function(d) { return d.axis1; }));
	var bar_data_max = d3.max(bar_data.map(function(d) { return d.axis2; }));
	y_bar.domain([0, bar_data_max]);

	g_bar.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height_bar + ")")
		.call(d3.axisBottom(x_bar));

if(infograph_config.axis1_orientation && infograph_config.axis1_orientation=="vertical"){
  g_bar.selectAll("g text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy",  "0.35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");
}

	g_bar.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y_bar))
		.append("text")
			.attr("fill", "#000")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", "0.71em")
			.attr("text-anchor", "end")
			.text(infograph_config.axis2)
			;

	g_bar.selectAll(".bar")
		.data(bar_data)
		.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x_bar(d.axis1); })
			.attr("y", function(d) { return y_bar(d.axis2); })
			.attr("width", x_bar.bandwidth())
			.attr("height", function(d) { return height_bar - y_bar(d.axis2); })
			.on("mousemove", tooltip_show)
	  		.on("mouseout", tooltip_hide);
}

// $(document).ready(function() {});
/*
// Set-up the export button
var svg =  d3.select("svg");
console.log("svg",svg);
d3.select("#svg-download").on("click", function (){
	var svgString = getSVGString(svg.node());
console.log("svgString",svgString);
	svgString2Image( svgString, 2*svg.attr("width"), 2*svg.attr("height"), 'png', save ); // passes Blob and filesize String to the callback

	function save( dataBlob, filesize ){
		saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js function
	}
});

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;
}
*/
