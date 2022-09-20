from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, create_engine
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

if __name__ == "__main__":
    engine = create_engine('postgresql://postgres:postgres@172.23.0.2:5432/postgres', echo=True)
    #Countries.__table__.create(engine)
    County.__table__.create(engine)