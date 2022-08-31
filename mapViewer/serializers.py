from geojson_serializer.serializers import geojson_serializer
from mapViewer.alch_models import Countries
from rest_framework import serializers

@geojson_serializer('location')
class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Countries
        fields = ['name', 'region', 'geom']