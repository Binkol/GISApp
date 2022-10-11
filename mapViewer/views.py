from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, aliased
from mapViewer.alch_models import Countries, County, Airport
from geoalchemy2.shape import to_shape
from geoalchemy2 import func
from geoalchemy2.types import Geography
from sqlalchemy import exc
from sqlalchemy.sql import cast
from rest_framework.response import Response
from rest_framework import status

import json

engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/postgres', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

errors ={
    "countryNotFound": "Country Not Found",
    "internal": "Internal error occured"
}

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
    try:
        query = session.query(Countries).filter_by(name=country_name).one()
        shape_geom = to_shape(query.geom)
        return JsonResponse({"name": query.name, "region": query.region, "geom": shape_geom.wkt})
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def getCounties(request):
    try:
        query = session.query(County).all()
        if not query:
            raise exc.NoResultFound
        
        data = MultipleGeomDict()
        for row in query:
            data[row.name] = to_shape(row.geom).wkt
        return JsonResponse(data)
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def getCountryCentre(request):
    country_name = request.GET.get('name','')
    try:
        query = session.query(Countries).filter_by(name=country_name).one()
        center_geom = session.scalar(query.geom.ST_Centroid())
        point = to_shape(center_geom)

        return JsonResponse({"center_geom": point.wkt})
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def surrCountriesInRadius(request):    
    country_name = request.GET.get('name','')
    distance = request.GET.get('distance','')
    try:
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
        print("AAAAAAAAAAAAAA", query)
        if not query:
            raise exc.NoResultFound

        data = {}
        for row in query:
            data[row.c2.name] = to_shape(row.c2.geom).wkt

        return JsonResponse(data)
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def getNeighbours(request):    
    country_name = request.GET.get('name','')
    distance = 1
    
    try:
        c1 = aliased(Countries, name='c1')
        c2 = aliased(Countries, name='c2')

        query = session.query(c1, c2).filter(and_(
            c1.name==country_name,
            ((func.ST_Distance(
                cast(c1.geom, Geography(srid=4326)), 
                cast(c2.geom, Geography(srid=4326))
                )/1000) < int(distance))
            )).all()

        if not query:
            raise exc.NoResultFound

        data = {}
        for row in query:
            data[row.c2.name] = to_shape(row.c2.geom).wkt

        return JsonResponse(data)
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def getAirports(request):
    try:
        query = session.query(Airport).all()
        data = {}
        
        if not query:
            raise exc.NoResultFound

        for row in query:
            data[row.id] = row.as_dict()
            data[row.id]["geom"] = to_shape(row.geom).wkt
            data[row.id].pop("id")
        return JsonResponse(data)

    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def getCountryAirports(request):
    country_name = request.GET.get('name','')

    try:
        c = aliased(Countries, name='c')
        a = aliased(Airport, name='a')

        output = session.query(c, a).filter(and_(func.ST_Contains(c.geom, a.geom), c.name==country_name)).all()

        if not output:
            raise exc.NoResultFound

        data = {}
        for row in output:
            data[row.a.name] = {"geom": to_shape(row.a.geom).wkt, "wiki": row.a.wikipedia}

        return JsonResponse(data)
    except exc.NoResultFound:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    except:
        return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)