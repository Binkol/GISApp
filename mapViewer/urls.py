from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('countryData/', views.getCountryData, name='getCountryData'),
    path('countryCentre/', views.getCountryCentre, name='getCountryCentre'),
    path('surrCountriesInRadius/', views.surrCountriesInRadius, name='surrCountriesInRadius'),
]