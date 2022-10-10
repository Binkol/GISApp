from django.test import TestCase
from mapViewer.alch_models import Base, Countries
from django.contrib.gis.geos import MultiPolygon, Polygon
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from django.http import JsonResponse
from geoalchemy2.shape import to_shape, from_shape
from geoalchemy2 import func
from geoalchemy2.types import Geography
from geoalchemy2.elements import WKTElement
from sqlalchemy.sql import cast

engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/testdb', echo=True)
Session = sessionmaker(bind=engine)
session = Session()


class GetCountryTestCase(TestCase):
    def setUp(self):
        poly = 'POLYGON((0 0,1 0,1 1,0 1,0 0))'
        Base.metadata.create_all(engine)
        self.country = Countries(name="test", region="test", geom=poly)
        session.add(self.country)
        session.commit()

    def test_country_data_retrieve(self):
        """Test if data coutry geom is retreived correctly"""
        country_name = "test"
        expected_response = {"name": "test", "region": "test", "geom": 'POLYGON((0 0,1 0,1 1,0 1,0 0))'}

        query = session.query(Countries).filter_by(name=country_name).first()
        shape_geom = to_shape(query.geom)
                
        expected_wkt = WKTElement(expected_response["geom"])
        recived_wkt = WKTElement(shape_geom.wkt)

        result = session.scalar(func.ST_Equals(expected_wkt, recived_wkt))
        self.assertTrue(result)