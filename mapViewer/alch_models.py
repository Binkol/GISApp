from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, create_engine, BigInteger
from geoalchemy2 import Geometry


Base = declarative_base()

class Countries(Base):
    __tablename__ = 'countries'
    
    id = Column(Integer, primary_key=True)
    geom = Column(Geometry('POLYGON'))
    status = Column(String)
    color_code = Column(String)
    region = Column(String)
    iso3 = Column(String)
    continent = Column(String)
    name = Column(String)
    iso_3166_1_field =  Column("iso_3166_1_", String)
    french_shor = Column(String)

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class County(Base):
    __tablename__ = 'counties'

    id = Column(Integer, primary_key=True)
    geom = Column(Geometry('POLYGON'))
    name = Column(String)

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Airport(Base):
    __tablename__ = 'airports'

    id = Column(Integer, primary_key=True)
    geom = Column(Geometry('POLYGON'))
    scalerank = Column(BigInteger)
    featurecla = Column(String)
    type = Column(String)
    name = Column(String)
    abbrev = Column(String)
    location = Column(String)
    gps_code = Column(String)
    iata_code = Column(String)
    wikipedia = Column(String)
    natlscale = Column(BigInteger)
    cartodb_id = Column(BigInteger)
    created_at = Column(String)
    updated_at = Column(String)

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}


if __name__ == "__main__":
    engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/postgres', echo=True)
    #Countries.__table__.create(engine)
    County.__table__.create(engine)