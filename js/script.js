var go = function(){
	//SET BASE AND OVERLAY VARS
	var map;
	var baseMaps = {
	    "Topographic": esritopo,
	    "Aerial": mqopenaerial
	};
	var overlayMaps = {
	};
	// 'layers' var to be used to pass layer order to map to maintain drawing order
	var layers = [esritopo];
	//GET URI VARS, lyrArr, lat,lng, zoom
	//lyrArr is array of visible layers
	var lyrArr = decodeURIComponent(getUrlVars()["lyrArr"]);
	lyrArr = lyrArr.split(",");
	//center is the default map center, to be overriden by uri lat,lng
	var center = new L.LatLng(44.50, -123.41);
	if(getUrlVars()["lat"]){
		center = new L.LatLng(getUrlVars()["lat"],getUrlVars()["lng"] );
	}
	//zoom is the default zoom to be overriden by uri zoom
	var zoom = 10;
	if(getUrlVars()["zoom"]){
		zoom = getUrlVars()["zoom"];
	}
	//loads config json with layer path, style, etc.
	loadJSON('resources/config.json',
         function(data) { 
         	var lyrs = data.layers;
         	makeNewLayer(lyrs,0,lyrs.length);	
         },
         function(xhr) { console.error(xhr); }
	);

	map = new L.Map('map', {
		center: center,
		zoom: zoom,
		layers: layers,
		attributionControl: true
	});
	
	function addThemes(){
		L.control.layers(baseMaps,overlayMaps,{position:"bottomleft",autoZIndex:true}).addTo(map);
		if(getUrlVars()["lyrArr"]){
			$.each(overlayMaps, function(index, value) {
			    var idx = lyrArr.indexOf(index);
				if(idx<0){
					map.removeLayer(value);
				}
			}); 
		}
	}
	function makeNewLayer(alldata,i,l)
	{
		 if(i==l){
		 	addThemes();
		 	return;
		 }
		 else{
		 	var d = alldata[i];
			var pathtofile = d.pathtofile;
			var fillcolor = d.fillColor;
			var color = d.color;
			var weight = d.weight;
			var fill = d.fill;
			var geometry = d.geometry;
			var dashArray = d.dashArray;
			var hover = d.hover;
			var hoverArray = d.hoverArray;
			var click = d.click;
			var clickArray = d.clickArray;
			var staticLabel = d.staticLabel;
			var staticLabelField = d.staticLabelField;

			loadJSON(pathtofile,
		         function(data) { 
		         	var myLayer;
		         	var style = {"color": color,"fillColor":fillcolor,"weight":weight,"fill":fill,"dashArray":dashArray};
		         	
					if(geometry=="polygon" || geometry=="line" ){
						myLayer = L.geoJson(data,{
							onEachFeature:function (feature, layer) {
						        if(hover){
						         	onEachFeature(feature,layer,style,hoverArray)
					        	}
					        	if(click){
					        		itemClick(feature,layer,clickArray);
						        }
						        if(staticLabel){
						        	onEachFeatureToLabel(feature,layer,staticLabelField);
						        }
					     	}
					    });
						myLayer.setStyle(style);
					}
					if(geometry=="point"){
						var geojsonMarkerOptions = {
						    radius: 3,
						    fillColor: fillcolor,
						    color: color,
						    weight: weight,
						    opacity: 0.8,
						    fillOpacity: 0.2
						};
						myLayer = L.geoJson(data,{
							pointToLayer: function (feature, latlng) {
						        return L.circleMarker(latlng, geojsonMarkerOptions);
						    },
						    onEachFeature:function (feature, layer) {
						        if(hover){
						        	onEachFeature(feature,layer,geojsonMarkerOptions,hoverArray)
						        }
						        if(click){
					        		itemClick(feature,layer,clickArray);
						        }
						    }
						});
					}
					myLayer.data = style;
					var displayname = d.displayname;
					overlayMaps[displayname] = myLayer;
					layers.push(myLayer);
					var idx = lyrArr.indexOf(displayname);
					if(idx>-1 || !getUrlVars()["lyrArr"]){
						myLayer.addTo(map);
					}
					i = i+1;
					makeNewLayer(alldata,i,alldata.length);
		         },
		         function(xhr) { console.error(xhr); }
			);
		}
	}
	function loadJSON(path, success, error)
	{
	    var xhr = new XMLHttpRequest();
	    xhr.onreadystatechange = function()
	    {
	        if (xhr.readyState === 4) {
	            if (xhr.status === 200) {
	                if (success)
	                    success(JSON.parse(xhr.responseText));
	            } else {
	                if (error)
	                    error(xhr);
	            }
	        }
	    };
	    xhr.open("GET", path, true);
	    xhr.send();
	}
	function getUrlVars() {
	    var vars = {};
	    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	        vars[key] = value;
	    });
	    return vars;
	}
	var onEachFeatureToLabel = function (feature,layer,staticLabelField){
		//make new point layer from centroids;
		label = new L.Label()
		label.setContent(feature.properties[staticLabelField]);
		//label.setLatLng(layer.getBounds().getCenter());
		var centroid = getCentroid(feature.geometry.coordinates[0]);
		var latlng = L.latLng(centroid[1],centroid[0]);
		label.setLatLng(latlng);
		
		map.showLabel(label);
		
	}
	
	var getCentroid = function (arr) { 
	    return arr.reduce(function (x,y) {
	        return [x[0] + y[0]/arr.length, x[1] + y[1]/arr.length] 
	    }, [0,0]) 
	}

	var onEachFeature = function(feature, layer, style, hoverArray) {	
	    (function(layer, properties) {
	      	// Create a mouseover event
	      	var defaultStyle = style;
		    layer.on("mouseover", function (e) {
		        // Change the style to the highlighted version
		        layer.setStyle(highlightStyle);
		        // Create a popup with a unique ID linked to this record
		        var popup = $("<div></div>", {
		            id: "popup-",
		            'class': 'custom-popup'
		        });
		        //make text
		        var txt = "";
		        for(var t = 0;t<hoverArray.length;t++){
		        	txt += /*hoverArray[t].displayname + ": " + */properties[hoverArray[t].field];
		        }
		        // Insert a headline into that popup
		        var hed = $("<div></div>", {
		            text: txt,
		            css: {fontSize: "16px", marginBottom: "3px"}
		        }).appendTo(popup);
		        // Add the popup to the map
		        popup.appendTo("#map");
		    });
		    // Create a mouseout event that undoes the mouseover changes
		    layer.on("mouseout", function (e) {
		        // Start by reverting the style back
		        layer.setStyle(defaultStyle); 
		        // And then destroying the popup
		        $("#popup-").remove();
		    });
		      // Close the "anonymous" wrapper function, and call it while passing
		      // in the variables necessary to make the events work the way we want.
		})(layer, feature.properties);
	};
	function itemClick(feature,layer,clickArray){
		var txt = "";
		for(var t = 0;t<clickArray.length;t++){
			if(clickArray[t].field==="WebSlug"){
				txt += urlify(feature.properties[clickArray[t].field])
			}else{
				var label = clickArray[t].displayname;
				var value = feature.properties[clickArray[t].field]
				txt += "<span class='click-display'>"+ label + ": </span><span class='click-detail'>"+ value + "</span></br>";
			}
		}
		layer.bindPopup(txt);
	}
	var highlightStyle = {
	    color: '#000', 
	    weight: 5,
	    opacity: 0.6
	};
	
	function urlify(txt){
		/*
		//THIS SECTION AUTO DETECTS URLs, replaced with hard code for MRWC project.
		if(!isNaN(txt)|| txt===undefined){return txt;}
		var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return txt.replace(urlRegex, function(url) {
	        return '<a href="' + url + '">' + url + '</a>';
	    });
		*/
		return '<a class="click-detail" href="https://www.mrwc.org/projects/' + txt + '"  target="_blank">Project Details</a>';
	}
}
//set vars
var esritopo = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: '<a href="http://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f&_ga=1.209702866.1928673696.1406678366">ESRI</a>',
	opacity: 0.5
});
var mqopenaerial = L.tileLayer('http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
	attribution: '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ',
	subdomains: '1234',
	opacity: 0.3
});
//ready...set...
go();

//var settings for JSON
/*
available styles:
NAME  			TYPE	DEFAULT		NOTES
stroke			Boolean	true			Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles.
color			String	'#03f'			Stroke color.
weight			Number	5	 			Stroke width in pixels.
opacity			Number	0.5				Stroke opacity.
fill			Boolean	depends			Whether to fill the path with color. Set it to false to disable filling on polygons or circles.
fillColor		String	same as color	Fill color.
fillOpacity		Number	0.2				Fill opacity.
dashArray		String	null			A string that defines the stroke dash pattern. Doesn't work on canvas-powered layers (e.g. Android 2).
lineCap			String	null			A string that defines shape to be used at the end of the stroke.
lineJoin		String	null			A string that defines shape to be used at the corners of the stroke.
clickable		Boolean	true			If false, the vector will not emit mouse events and will act as a part of the underlying map.
pointerEvents	String	null			Sets the pointer-events attribute on the path if SVG backend is used.
*/

/*--------------------------
EXAMPLE CONFIG from config.json

"displayname":"Wetlands",
"pathtofile":"resources/geojson/Wetlands071814.json",
"stroke":true,
"color":"#33a02c",
"weight":4,
"opacity":0.9,
"fill":true,
"fillColor":"#33a02c",
"fillOpacity":0.2,
"geometry":"polygon",
"hover":true,
"hoverArray":[{"displayname":"Project","field":"ProjectNam"}],
"click":true,
"clickArray":[{"displayname":"Project Name","field":"ProjectNam"},{"displayname":"Subbasin","field":"Subbasin"},{"displayname":"Square Feet","field":"sq_ft"},{"displayname":"Status","field":"Status"}]
"urllink":true,
"urllinkArray":[{"display":"Project Page","field":"linkfield"}]
-------------------------------*/




//"stroke":true,"color":"#000","weight":5,"opacity":0.5,"fill":true,"fillColor":"#000","fillOpacity":0.2