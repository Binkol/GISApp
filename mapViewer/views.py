from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, aliased
from mapViewer.alch_models import Countries, County
from geoalchemy2.shape import to_shape
from geoalchemy2 import func
from geoalchemy2.types import Geography
from sqlalchemy.sql import cast

import json

engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/postgres', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

class MultipleGeomDict(dict):
    def __setitem__(self, key, value):
        try:
            self[key]
        except KeyError:
            super(MultipleGeomDict, self).__setitem__(key, {})
        calc_id = len(self[key])
        self[key][calc_id] = value


def index(request):
    return render(request, 'mapViewer/index.html', {})


def getCountryData(request):
    country_name = request.GET.get('name','')
    query = session.query(Countries).filter_by(name=country_name).first()
    shape_geom = to_shape(query.geom)

    return JsonResponse({"name": query.name, "region": query.region, "geom": shape_geom.wkt}) #"geom": query.geom


def getCounties(request):
    query = session.query(County).all()
    data = MultipleGeomDict()
    for row in query:
        data[row.name] = to_shape(row.geom).wkt
    return JsonResponse(data)


def getCountryCentre(request):
    country_name = request.GET.get('name','')
    query = session.query(Countries).filter_by(name=country_name).first()
    center_geom = session.scalar(query.geom.ST_Centroid())
    point = to_shape(center_geom)

    return JsonResponse({"center_geom": point.wkt})


def surrCountriesInRadius(request):    
    country_name = request.GET.get('name','')
    distance = request.GET.get('distance','')
    

    c1 = aliased(Countries, name='c1')
    c2 = aliased(Countries, name='c2')

    #countries within radius from certain country using casting to geography
    query = session.query(c1, c2).filter(and_(
        c1.name==country_name,
        ((func.ST_Distance(
            cast(c1.geom, Geography(srid=4326)), 
            cast(c2.geom, Geography(srid=4326))
            )/1000) < int(distance))
        )).all()

    data = {}
    for row in query:
        data[row.c2.name] = to_shape(row.c2.geom).wkt

    return JsonResponse(data)

def getNeighbours(request):    
    country_name = request.GET.get('name','')
    distance = 1
    
    c1 = aliased(Countries, name='c1')
    c2 = aliased(Countries, name='c2')

    query = session.query(c1, c2).filter(and_(
        c1.name==country_name,
        ((func.ST_Distance(
            cast(c1.geom, Geography(srid=4326)), 
            cast(c2.geom, Geography(srid=4326))
            )/1000) < int(distance))
        )).all()

    data = {}
    for row in query:
        data[row.c2.name] = to_shape(row.c2.geom).wkt

    return JsonResponse(data)
    



  