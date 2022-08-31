from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from mapViewer.alch_models import Countries
from django.core.serializers import serialize
from mapViewer.serializers import CountrySerializer
from geoalchemy2.shape import to_shape 

import json

engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/postgres', echo=True)
Session = sessionmaker(bind=engine)
session = Session()


def index(request):
    return render(request, 'mapViewer/index.html', {})


def getCountryData(request):
    country_name = request.GET.get('name','')
    query = session.query(Countries).filter_by(name=country_name).first()
    shape_geom = to_shape(query.geom)

    return JsonResponse({"name": query.name, "region": query.region, "geom": shape_geom.wkt}) #"geom": query.geom



  