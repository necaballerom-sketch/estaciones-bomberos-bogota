# -*- coding: utf-8 -*-
import json
import arcpy

arcpy.env.overwriteOutput = True
arcpy.FeaturesToJSON_conversion('SHP/localidades.shp', 'localidades_clean.geojson', format_json=True, geoJSON='GEOJSON')

with open('localidades_clean.geojson', 'r', encoding='utf-8', errors='ignore') as f:
    gj = json.load(f)

# Operational metadata keyed strictly by standard LocCodigo ('01' to '20')
LOCALIDAD_BY_CODIGO = {
    '01': {
        'numero': '01',
        'nombre': 'USAQUÉN',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 1',
        'companiaNum': 1,
        'color': '#0284c7',
        'estaciones': 'B-13 Caobos Salazar',
        'lider': 'Teniente Fabio Sastoque',
        'center': [4.745, -74.028]
    },
    '02': {
        'numero': '02',
        'nombre': 'CHAPINERO',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 1',
        'companiaNum': 1,
        'color': '#0284c7',
        'estaciones': 'B-1 Chapinero',
        'lider': 'Teniente Fabio Sastoque',
        'center': [4.650, -74.045]
    },
    '03': {
        'numero': '03',
        'nombre': 'SANTA FE',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'Cobertura B-2 Central / B-17 Centro Histórico',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.595, -74.045]
    },
    '04': {
        'numero': '04',
        'nombre': 'SAN CRISTÓBAL',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 4',
        'companiaNum': 4,
        'color': '#eab308',
        'estaciones': 'B-9 Bellavista',
        'lider': 'Capitán Jairo Bolaños',
        'center': [4.550, -74.065]
    },
    '05': {
        'numero': '05',
        'nombre': 'USME',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 4',
        'companiaNum': 4,
        'color': '#eab308',
        'estaciones': 'B-10 Marichuela',
        'lider': 'Capitán Jairo Bolaños',
        'center': [4.450, -74.120]
    },
    '06': {
        'numero': '06',
        'nombre': 'TUNJUELITO',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 5',
        'companiaNum': 5,
        'color': '#8b5cf6',
        'estaciones': 'B-16 Venecia',
        'lider': 'Capitán Edinson Panqueva',
        'center': [4.575, -74.135]
    },
    '07': {
        'numero': '07',
        'nombre': 'BOSA',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 5',
        'companiaNum': 5,
        'color': '#8b5cf6',
        'estaciones': 'B-8 Bosa, B-19 La Cabaña',
        'lider': 'Capitán Edinson Panqueva',
        'center': [4.620, -74.185]
    },
    '08': {
        'numero': '08',
        'nombre': 'KENNEDY',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'B-5 Kennedy',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.630, -74.150]
    },
    '09': {
        'numero': '09',
        'nombre': 'FONTIBÓN',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 2',
        'companiaNum': 2,
        'color': '#ea580c',
        'estaciones': 'B-6 Fontibón',
        'lider': 'Capitán Ciprián Bohórquez',
        'center': [4.675, -74.140]
    },
    '10': {
        'numero': '10',
        'nombre': 'ENGATIVÁ',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 2',
        'companiaNum': 2,
        'color': '#ea580c',
        'estaciones': 'B-7 Ferias, B-15 Garcés Navas',
        'lider': 'Capitán Ciprián Bohórquez',
        'center': [4.700, -74.115]
    },
    '11': {
        'numero': '11',
        'nombre': 'SUBA',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 2',
        'companiaNum': 2,
        'color': '#ea580c',
        'estaciones': 'B-12 Suba, B-14 Bicentenario',
        'lider': 'Capitán Ciprián Bohórquez',
        'center': [4.748, -74.088]
    },
    '12': {
        'numero': '12',
        'nombre': 'BARRIOS UNIDOS',
        'distrito': 'Distrito 1 - Norte',
        'distritoId': 'distrito1',
        'compania': 'Compañía 2',
        'companiaNum': 2,
        'color': '#ea580c',
        'estaciones': 'Cobertura B-7 Ferias',
        'lider': 'Capitán Ciprián Bohórquez',
        'center': [4.670, -74.075]
    },
    '13': {
        'numero': '13',
        'nombre': 'TEUSAQUILLO',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'Cobertura B-2 Central / B-4 Puente Aranda',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.640, -74.088]
    },
    '14': {
        'numero': '14',
        'nombre': 'LOS MÁRTIRES',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'B-2 Central',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.608, -74.090]
    },
    '15': {
        'numero': '15',
        'nombre': 'ANTONIO NARIÑO',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 4',
        'companiaNum': 4,
        'color': '#eab308',
        'estaciones': 'B-3 Restrepo',
        'lider': 'Capitán Jairo Bolaños',
        'center': [4.588, -74.102]
    },
    '16': {
        'numero': '16',
        'nombre': 'PUENTE ARANDA',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'B-4 Puente Aranda, Edificio Comando Central (CO)',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.625, -74.110]
    },
    '17': {
        'numero': '17',
        'nombre': 'LA CANDELARIA',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 3',
        'companiaNum': 3,
        'color': '#10b981',
        'estaciones': 'B-17 Centro Histórico',
        'lider': 'Capitán Rodolfo Barrera',
        'center': [4.596, -74.070]
    },
    '18': {
        'numero': '18',
        'nombre': 'RAFAEL URIBE URIBE',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 4',
        'companiaNum': 4,
        'color': '#eab308',
        'estaciones': 'Cobertura B-3 Restrepo / B-9 Bellavista',
        'lider': 'Capitán Jairo Bolaños',
        'center': [4.565, -74.112]
    },
    '19': {
        'numero': '19',
        'nombre': 'CIUDAD BOLÍVAR',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 5',
        'companiaNum': 5,
        'color': '#8b5cf6',
        'estaciones': 'B-11 Candelaria, B-18 Casa de Teja',
        'lider': 'Capitán Edinson Panqueva',
        'center': [4.520, -74.160]
    },
    '20': {
        'numero': '20',
        'nombre': 'SUMAPAZ',
        'distrito': 'Distrito 2 - Sur',
        'distritoId': 'distrito2',
        'compania': 'Compañía 5',
        'companiaNum': 5,
        'color': '#8b5cf6',
        'estaciones': 'Cobertura Rural Extensa',
        'lider': 'Capitán Edinson Panqueva',
        'center': [4.050, -74.280]
    }
}

for feat in gj['features']:
    props = feat['properties']
    raw_code = str(props.get('LocCodigo', '')).strip().zfill(2)
    meta = LOCALIDAD_BY_CODIGO.get(raw_code, {})
    for k, v in meta.items():
        props[k] = v

with open('data/localidades_data.js', 'w', encoding='utf-8') as f:
    f.write('// Capa GeoJSON Oficial de Localidades de Bogotá con asignación operativa por Compañía\n')
    f.write('const LOCALIDADES_GEOJSON = ' + json.dumps(gj, ensure_ascii=False) + ';\n')

print("Successfully rebuilt data/localidades_data.js with complete LocCodigo metadata for all 20 localities!")
