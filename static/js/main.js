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
}

