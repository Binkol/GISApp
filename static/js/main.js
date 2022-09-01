window.onload = init;

function init()
{
    const map = new ol.Map({
        view: new ol.View({
            center: [1887156.7982506095, 6870894.219859836],
            zoom: 10,
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

    $("#button1").click({mapObj: map}, getGeometry);
}

function getGeometry(event)
{
    map = event.data.mapObj
    var country_name = $("#countryInput").val();

    $.getJSON(
        "http://127.0.0.1:8000/mapViewer/countryData/",
        {name : country_name},
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

    
    $("#countryInput").val("");
}