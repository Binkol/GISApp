from django.db import models


class Poland(models.Model):
    geom = models.TextField(blank=True, null=True)  # This field type is a guess.
    status = models.CharField(max_length=255, blank=True, null=True)
    color_code = models.CharField(max_length=255, blank=True, null=True)
    region = models.CharField(max_length=255, blank=True, null=True)
    iso3 = models.CharField(max_length=255, blank=True, null=True)
    continent = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    iso_3166_1_field = models.CharField(db_column='iso_3166_1_', max_length=255, blank=True, null=True)  # Field renamed because it ended with '_'.
    french_shor = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'poland'


class SpatialRefSys(models.Model):
    srid = models.IntegerField(primary_key=True)
    auth_name = models.CharField(max_length=256, blank=True, null=True)
    auth_srid = models.IntegerField(blank=True, null=True)
    srtext = models.CharField(max_length=2048, blank=True, null=True)
    proj4text = models.CharField(max_length=2048, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'spatial_ref_sys'