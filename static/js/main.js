window.onload = init;

function init()
{
    initialControlsHide();
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
        ],
        name: "baseLayer"
    });

    const map = new ol.Map({
        view: new ol.View({
            center: [2116228.358766089, 6856093.900862803],
            zoom: 3,
        }),
        target: 'js-map',
        controls: []
    });

    var controlsDiv = $("#controls")[0];
    var control = new ol.control.Control({
        element: controlsDiv
    })

    map.addControl(control);

    var overlay = new ol.Overlay({
        element: $("#popup")[0],
        autoPan: true,
        autoPanAnimation: {
             duration: 250
        }
    });

    map.addOverlay(overlay);
    map.addLayer(layerGroup);
    
    map.on('click', function(event){
        console.log(event.coordinate);
        let layers = map.getLayers();

        map.forEachFeatureAtPixel(event.pixel, function (feature) {
            selected = feature;
            wiki = selected.get("wiki")
            if(wiki)
            {
                window.open(wiki)
            }
            else
            {
                console.log("No wiki for this feature")
            }
            return true;
        });
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
    map.on('pointermove', function (e) {
        if (selected !== null) 
        {
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
                let type = selected.get("type");
                if(type == "country")
                {
                    $("#popup-content").html('Country name: ' + selected.get("name"));
                }
                else if(type == "airport")
                {
                    $("#popup-content").html('Airport name: ' + selected.get("name") + "<br>Click to open Wiki");
                }
                else if(type == "county")
                {
                    $("#popup-content").html('County name: ' + selected.get("name"));
                }
                overlay.setPosition(e.coordinate);
                return true;
            }
        });
        
        if (selected) 
        {
            $("#status").text(selected.get('name'));
            $("#status").show();
        } 
        else 
        {
            $("#status").text('');
            $("#status").hide();
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
    $("#drawCountryAirports").click({mapObj: map}, drawCountryAirports);
}

function initialControlsHide()
{
    $("#distanceLabel").hide();
    $("#distanceInput").hide();
    $("#drawCountriesInDist").hide();
    $("#drawNeighboursButton").hide();
    $("#drawCounties").hide();
    $("#switchToWorldView").hide();
    $("#hoverButtonOff").hide();

}

function drawCountryAirports(event)
{
    var country_name = $("#countryInput").val();
    var map = event.data.mapObj;

    const groupName = "airportsGroup"+country_name
    const countryAirportsLayerGroup = new ol.layer.Group({
        layers: [],
        name: groupName,
    });

    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/countryAirports/",
        {name : country_name},
        function(response, status){
            for (const [name, data] of Object.entries(response)) 
            {
                let properties = {'name': name, 
                                  'wiki': data.wiki,
                                  'type': 'airport'  
                                };
                let layer = layerFromWKTgeom(data.geom, properties);

                countryAirportsLayerGroup.getLayers().push(layer);
            }
            map.addLayer(countryAirportsLayerGroup);
        }
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            alert("404 - Inserted country not found");
        } else {
            alert("Other non-handled error type");
        }
    });
}

function drawAirports(event)
{
    const groupName = "airportsGroup"
    const airportsLayerGroup = new ol.layer.Group({
        layers: [],
        name: groupName,
    });

    var map = event.data.mapObj;
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/airports/",
        {},
        function(response, status){
            for (const [id, data] of Object.entries(response)) {
                let properties = {'name': data.name, 
                                  'wiki': data.wikipedia,
                                  'type': 'airport'};
                let layer = layerFromWKTgeom(data.geom, properties);

                airportsLayerGroup.getLayers().push(layer);
            }
            map.addLayer(airportsLayerGroup);
        }
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            alert("404 - not found");
        } else {
            alert("Other non-handled error type");
        }
    });
}

function drawCounties(event)
{
    const groupName = "countyGroup"
    const countyLayerGroup = new ol.layer.Group({
        layers: [],
        name: groupName,
    });

    var map = event.data.mapObj;
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/counties/",
        {},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geoms = value;
                for (const [geom_id, geom_value] of Object.entries(wkt_geoms)){
                    
                    let properties = {'name': key, 'type': 'county'};
                    let layer = layerFromWKTgeom(geom_value, properties);
                    
                    countyLayerGroup.getLayers().push(layer);
                }
            }
            map.addLayer(countyLayerGroup);
        }
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            alert("404 - not found");
        } else {
            alert("Other non-handled error type");
        }
    });
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
        
        $("#drawCountryAirports").hide();
        $("#drawAirports").hide();
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

        $("#drawCountryAirports").show();
        $("#drawAirports").show();
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
    const groupName = "countires"
    var countriesLayerGroup = getLayerByName(map, groupName);
    if(countriesLayerGroup == null)
    {
        countriesLayerGroup = new ol.layer.Group({
            layers: [],
            name: groupName,
        });
    }
    
    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/countryData/",
        {name : country},
        function(response){
            wkt_geom = response['geom'];
            let name = response['name'];
            
            let properties = {'name': name, 'type': 'country'};
            let layer = layerFromWKTgeom(wkt_geom, properties);
              
            countriesLayerGroup.getLayers().push(layer);
        }
    ).fail(function(jqXHR, textStatus, errorThrown){
        console.log(jqXHR.status, errorThrown)
        if (jqXHR.status == 404) {
            alert("404 - Inserted country not found " + jqXHR.responseText);
        } else {
            alert("Other non-handled error type");
        }
    });
    map.addLayer(countriesLayerGroup);
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
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            //alert("404 - not found - (while centering)");
        } else {
            //alert("Other non-handled error type");
        }
    });
}

function removeLayers(event)
{
    let map = event.data.mapObj;
    let layers = map.getLayers().getArray();
    
    for (let i=layers.length-1; i>=0; i--)
    {
        if(layers[i].get("name") != "baseLayer")
        {
            map.removeLayer(layers[i]);
        } 
    }
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
        $("#drawCountryAirports").show();

    }
    else if (obj.val() == "distance")
    {
        $("#distanceInput").show();
        $("#drawSingleGeomButton").hide();
        $("#drawCountriesInDist").show();
        $("#distanceLabel").show();
        $("#drawNeighboursButton").hide();
        $("#drawCountryAirports").hide();
    }
    else if (obj.val() == "neighbours")
    {
        $("#distanceInput").hide();
        $("#drawSingleGeomButton").hide();
        $("#drawCountriesInDist").hide();
        $("#distanceLabel").hide();
        $("#drawNeighboursButton").show();
        $("#drawCountryAirports").hide();

    }
}

function drawCountriesInDistance(event)
{
    var map = event.data.mapObj;
    var country_name = $("#countryInput").val();
    var dist = $("#distanceInput").val();
    
    const groupName = "countires"
    var countriesLayerGroup = getLayerByName(map, groupName);
    if(countriesLayerGroup == null)
    {
        countriesLayerGroup = new ol.layer.Group({
            layers: [],
            name: groupName,
        });
    }

    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/surrCountriesInRadius/",
        {name : country_name, distance: dist},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geom = value;
                let name = key;

                let properties = {'name': name, 'type': 'country'};
                let layer = layerFromWKTgeom(wkt_geom, properties);
                
                countriesLayerGroup.getLayers().push(layer);
                console.log("Added: ", key);
            }
            map.addLayer(countriesLayerGroup)
        }
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            alert("404 - Inserted country not found");
        } else {
            alert("Other non-handled error type");
        }
    });
}

function drawNeighbours(event)
{
    var map = event.data.mapObj;
    var country_name = $("#countryInput").val();
    
    const groupName = "countires"
    var countriesLayerGroup = getLayerByName(map, groupName);
    if(countriesLayerGroup == null)
    {
        countriesLayerGroup = new ol.layer.Group({
            layers: [],
            name: groupName,
        });
    }

    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/getNeighbours/",
        {name : country_name},
        function(response, status){
            for (const [key, value] of Object.entries(response)) {
                wkt_geom = value;
                let name = key;
                
                let properties = {'name': name, 'type': 'country'};
                let layer = layerFromWKTgeom(wkt_geom, properties);

                countriesLayerGroup.getLayers().push(layer);
                console.log("Added: ", key);
            }
            map.addLayer(countriesLayerGroup)
        }
    ).fail(function(jqXHR){
        if (jqXHR.status == 404) {
            alert("404 - Inserted country not found");
        } else {
            alert("Other non-handled error type");
        }
    });
}

function getLayerByName(map, name)
{
    let output = null;

    map.getLayers().forEach(function (layer) {
        if (layer.get('name') != undefined && layer.get('name') === name) 
        {
            output = layer;
        }
    });
    return output;
}

function layerFromWKTgeom(wkt, properties) //requires 'name' in properties
{
    var format = new ol.format.WKT();
    
    const polygonFeature = format.readFeature(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });

    polygonFeature.setProperties(properties);

    let source = new ol.source.Vector({
        features: [polygonFeature]
    });
    
    var layer = new ol.layer.Vector({
        source: source,
        name: properties["name"]+"Layer"
    });

    return layer;
}