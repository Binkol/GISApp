window.onload = init;

function init()
{
    var hoverOn = false;

    const osm = new ol.layer.Tile({
        source: new ol.source.OSM(),
        name: "osm",
        visible: true,
    });

    const bikeLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url:
            'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
            '?apikey=06d51f0ca41e4236988bd2848bdf3128',
        }),
        name: "bikeLayer",
        visible: false,
      });

    const bingAerial = new ol.layer.Tile({
        visible: false,
        preload: Infinity,
        source: new ol.source.BingMaps({
          key: 'At8y-S6N1ZLw8iX2p3IbUMTe9WpQqA3Gd8E6EIgCzLtM4RcG9e6sR4DxiJYkZMae',
          imagerySet: 'Aerial',
        }),
        name: "bingAerial"
      });

    
    const layerGroup = new ol.layer.Group({
        layers: [
            osm,
            bikeLayer,
            bingAerial
        ]
    });

    const map = new ol.Map({
        view: new ol.View({
            center: [2116228.358766089, 6856093.900862803],
            zoom: 3,
        }),
        target: 'js-map'
    });


    var overlay = new ol.Overlay({
        element: $("#overlay")[0],
        autoPan: true,
        autoPanAnimation: {
             duration: 250
        }
    });
    
    map.addOverlay(overlay);
    map.addLayer(layerGroup);

    
    map.on('click', function(event){
        console.log(event.coordinate);
    })


    const selectStyle = new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#eeeeee',
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 0.7)',
          width: 2,
        }),
      });

    let selected = null;
    let hasFeature = false;
    map.on('pointermove', function (e) {
        if (selected !== null) {
            selected.setStyle(undefined);
            selected = null;
        }

        map.forEachFeatureAtPixel(e.pixel, function (feature) {
            if(hoverOn)
            {
                //hover style
                selected = feature;
                selectStyle.getFill().setColor(feature.get('COLOR') || '#eeeeee');
                feature.setStyle(selectStyle);
                
                //overlay
                var coordinate = e.coordinate;
                overlay.setPosition(coordinate);
                hasFeature = true;

                return true;
            }
        });
        
        //hover style
        if (selected) {
            $("#status").text(selected.get('name'));
            $("#status").show();
        } else {
            $("#status").text('');
            $("#status").hide();
        }

        //overlay
        if (!hasFeature) {
            overlay.setPosition(undefined);
        }
    });

    $("#drawSingleGeomButton").click({mapObj: map}, drawAndCenterOnCountry);
    $("#clearMapButton").click({mapObj: map}, removeLayers);
    $("#drawCountriesInDist").click({mapObj: map}, drawCountriesInDistance);
    $("#drawNeighboursButton").click({mapObj: map}, drawNeighbours);
    $('#select1').bind("change", handleOptionsSelect);

    var mapStyleRadios = document.mapStyleChoice.baseMap;
    for(var radio of mapStyleRadios)
    {
        radio.addEventListener('change', function(event){
            changeMapStyle(event, layerGroup);
        });
    }

    $("#switchToPolandView").click({mapObj: map}, switchToPolandView);
    $("#switchToWorldView").click({mapObj: map}, switchToWorldView);
    $("#drawCounties").click({mapObj: map}, drawCounties);

    $("#hoverButtonOn").click(function(){
        hoverOn = true;
        $(this).hide();
        $("#hoverButtonOff").show();
    });

    $("#hoverButtonOff").click(function(){
        hoverOn = false;
        $(this).hide();
        $("#hoverButtonOn").show();
    }); 

    $("#drawAirports").click({mapObj: map}, drawAirports);
}



function drawAirports(event)
{
    var map = event.data.mapObj;
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/airports/",
        {},
        function(response, status){
            for (const [id, data] of Object.entries(response)) {
                let format = new ol.format.WKT()
                
                const polygonFeature = format.readFeature(data.geom, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857',
                });

                polygonFeature.setProperties({'name': data.name});

                let source = new ol.source.Vector({
                    features: [polygonFeature]
                });
                
                var layer = new ol.layer.Vector({
                    source: source,
                    name: id + "Layer"
                });
                
                map.addLayer(layer);
            }
        }
    );
}


function drawCounties(event)
{
    var map = event.data.mapObj;
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/counties/",
        {},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geoms = value;
                for (const [geom_id, geom_value] of Object.entries(wkt_geoms)){
                    let format = new ol.format.WKT()
                
                    const polygonFeature = format.readFeature(geom_value, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857',
                    });

                    polygonFeature.setProperties({'name': key});

                    let source = new ol.source.Vector({
                        features: [polygonFeature]
                    });
                    
                    var layer = new ol.layer.Vector({
                        source: source,
                        name: key + "Layer"
                    });
                    
                    map.addLayer(layer);
                }
            }
        }
    );
}


function userInputLayers(layer)
{
    if(layer == "poland")
    {
        $("#switchToPolandView").hide();
        $("#switchToWorldView").show();
        $("#drawCounties").show();

        $("#select1").hide();
        $("#drawSingleGeomButton").hide();
        $("#countryInput").hide();
        $("#countryLabel").hide();

        $("#distanceLabel").hide();
        $("#distanceInput").hide();
        $("#drawCountriesInDist").hide();
        $("#drawNeighboursButton").hide();



    }
    else if(layer == "world")
    {
        $("#switchToPolandView").show();
        $("#switchToWorldView").hide();
        $("#drawCounties").hide();

        $("#select1").show();
        $("#drawSingleGeomButton").show();
        $("#countryInput").show();
        $("#countryLabel").show();
    }
}

function switchToPolandView(event)
{
    userInputLayers("poland");
    const map = event.data.mapObj
    map.setView(new ol.View({
        center: [2116228.358766089, 6856093.900862803],
        extent: [1400705, 6150028, 2951816, 7465513],
        zoom : 5
      }));
}

function switchToWorldView(event)
{
    userInputLayers("world");
    const map = event.data.mapObj
    map.setView(new ol.View({
        center: [2116228.358766089, 6856093.900862803],
        zoom: 3,
    }));
} 

function changeMapStyle(event, layerGroup)
{
    let selectedMapName = event.target.value;
    layerGroup.getLayers().forEach(function(element, index, array){
        layerName = element.get('name');
        element.setVisible(selectedMapName === layerName);
    })
}

function drawAndCenterOnCountry(event)
{
    var map = event.data.mapObj;
    var country_name = $("#countryInput").val();

    drawGeometry(map, country_name);
    centerMap(map, country_name);
    $("#countryInput").val("");
}

function drawGeometry(map, country)
{
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/countryData/",
        {name : country},
        function(response, status){
            wkt_geom = response['geom'];
            var format = new ol.format.WKT()
            
            const polygonFeature = format.readFeature(wkt_geom, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
              });

            let source = new ol.source.Vector({
                features: [polygonFeature]
              });
            
            var layer = new ol.layer.Vector({
                source: source,
                name: country+"Layer"
              });
            
            map.addLayer(layer);
        }
    );
}

function centerMap(map, country)
{
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/countryCentre/",
        {name : country},
        function(response, status){
            wkt_geom = response['center_geom'];

            var format = new ol.format.WKT()
            
            const point_feature = format.readFeature(wkt_geom, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
              });

            map.getView().setCenter(point_feature.getGeometry().getCoordinates());
        }
    );
}

function removeLayers(event)
{
    let map = event.data.mapObj;
    let layers = map.getAllLayers();
    layers.forEach(function(layer){
        if(layer.get("name") != "osm")
        {
            map.removeLayer(layer);
        }
    });
}

function handleOptionsSelect()
{
    let obj = $('#select1');
    if (obj.val() == "single")
    {
        $("#distanceInput").hide();
        $("#drawSingleGeomButton").show();
        $("#drawCountriesInDist").hide();
        $("#distanceLabel").hide();
        $("#drawNeighboursButton").hide();
    }
    else if (obj.val() == "distance")
    {
        $("#distanceInput").show();
        $("#drawSingleGeomButton").hide();
        $("#drawCountriesInDist").show();
        $("#distanceLabel").show();
        $("#drawNeighboursButton").hide();
    }
    else if (obj.val() == "neighbours")
    {
        $("#distanceInput").hide();
        $("#drawSingleGeomButton").hide();
        $("#drawCountriesInDist").hide();
        $("#distanceLabel").hide();
        $("#drawNeighboursButton").show();
    }
}

function drawCountriesInDistance(event)
{
    var map = event.data.mapObj;
    var country_name = $("#countryInput").val();
    var dist = $("#distanceInput").val();
    
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/surrCountriesInRadius/",
        {name : country_name, distance: dist},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geom = value;
                var format = new ol.format.WKT()
                
                const polygonFeature = format.readFeature(wkt_geom, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857',
                });

                let source = new ol.source.Vector({
                    features: [polygonFeature]
                });
                
                var layer = new ol.layer.Vector({
                    source: source,
                    name: key+"Layer"
                });
                
                map.addLayer(layer);
                console.log("Added: ", key);
            }
        }
    );
}

function drawNeighbours(event)
{
    var map = event.data.mapObj;
    var country_name = $("#countryInput").val();
    
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/getNeighbours/",
        {name : country_name},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geom = value;
                var format = new ol.format.WKT()
                
                const polygonFeature = format.readFeature(wkt_geom, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857',
                });

                let source = new ol.source.Vector({
                    features: [polygonFeature]
                });
                
                var layer = new ol.layer.Vector({
                    source: source,
                    name: key+"Layer"
                });
                
                map.addLayer(layer);
                console.log("Added: ", key);
            }
        }
    );
}