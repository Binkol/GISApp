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
                source: new ol.source.OSM()
            })
        ],
        target: 'js-map'
    })

    map.on('click', function(e){
        console.log(e.coordinate);
    })

    $("#button1").click({mapObj: map}, drawAndCenterOnCountry);
}

function drawAndCenterOnCountry(event)
{
    map = event.data.mapObj
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
                source: source
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
        }
    );
}