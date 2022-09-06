window.onload = init;

function init()
{
    
    const map = new ol.Map({
        view: new ol.View({
            center: [1887156.7982506095, 6870894.219859836],
            zoom: 4,
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                name: "osm",
            })
        ],
        target: 'js-map'
    })

    map.on('click', function(e){
        console.log(e.coordinate);
    })

    $("#drawSingleGeomButton").click({mapObj: map}, drawAndCenterOnCountry);
    $("#clearMapButton").click({mapObj: map}, removeLayers);
    $("#drawCountriesInDist").click({mapObj: map}, drawCountriesInDistance);
    $('#select1').bind("change", handleOptionsSelect);
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
            console.log("done");
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
            console.log("centered");

            console.log(map.getLayers());
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
        $("#radiusLabel").hide();

    }
    else if (obj.val() == "distance")
    {
        $("#distanceInput").show();
        $("#drawSingleGeomButton").hide();
        $("#drawCountriesInDist").show();
        $("#radiusLabel").show();
    }
    else if (obj.val() == "neighbours")
    {
        console.log("not implemented")
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