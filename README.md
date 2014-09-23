json-config with leaflet
=========
For making multiple unique iframe maps available from one source.

Task
  - Make a base map with several layers.
  - Enable map to be shown via iFrame on several pages, should display different extent and layer subset on each page.
  - Should be easily updateable by non-developer GIS staff.

The result is this leaflet implimentation. The one important file is 'resource/config.json'. 
config.json:
----
 - All overlay geojson layers.
 - Display name for each layer.
 - Paths to the geojson for each layer.
 - Style settings for each layer.
 - Geometry type for each layer. (limits the type of geojson you can use, but increases simplicity for non-technical staff use)
 - Hover and Click interactivity fields if any for each layer.

**example config.json section for 'Wetlands' layer:**
 ```sh
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
"clickArray":[{"displayname":"Project Name","field":"ProjectNam"},{"displayname":"Subbasin","field":"Subbasin"},{"displayname":"Square Feet","field":"sq_ft"},{"displayname":"Status","field":"Status"}].
```

url variable
----
URL variables are used to specify:
- **lyrArr**: A list of layers from configjson to display. Defaults to all layers visible if not specified.
- **lat** and **lng**: Used to set map center. Defaults to center specified in script.js if not set.
- **zoom**: The map zoom level. Defaults to zoom specified in script.js if not set.

Demo
---
This URL goes to the map with no URL variables, shows all layers in config

http://nickmartinelli.com/mrwc/

This URL specifies the watershed layer and zooms to a specific project ares using just URL variables

http://nickmartinelli.com/mrwc/?lyrArr=MRWC%20Boundary,SubBasins,Wetlands&zoom=14&lat=44.593&lng=-123.415

