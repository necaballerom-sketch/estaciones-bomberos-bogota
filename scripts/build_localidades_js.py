# -*- coding: utf-8 -*-
import json

with open('localidades.geojson', 'r', encoding='utf-8') as f:
    gj = json.load(f)

# Name normalization map
name_clean = {
    'ANTONIO NARIO': 'ANTONIO NARIÑO',
    'TUNJUELITO': 'TUNJUELITO',
    'RAFAEL URIBE URIBE': 'RAFAEL URIBE URIBE',
    'CANDELARIA': 'LA CANDELARIA',
    'BARRIOS UNIDOS': 'BARRIOS UNIDOS',
    'TEUSAQUILLO': 'TEUSAQUILLO',
    'PUENTE ARANDA': 'PUENTE ARANDA',
    'LOS MARTIRES': 'LOS MÁRTIRES',
    'SUMAPAZ': 'SUMAPAZ',
    'USAQUEN': 'USAQUÉN',
    'CHAPINERO': 'CHAPINERO',
    'SANTA FE': 'SANTA FE',
    'SAN CRISTOBAL': 'SAN CRISTÓBAL',
    'USME': 'USME',
    'CIUDAD BOLIVAR': 'CIUDAD BOLÍVAR',
    'BOSA': 'BOSA',
    'KENNEDY': 'KENNEDY',
    'FONTIBON': 'FONTIBÓN',
    'ENGATIVA': 'ENGATIVÁ',
    'SUBA': 'SUBA'
}

# Locality metadata
loc_meta = {
    'USAQUÉN': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 1', 'color': '#0284c7', 'estaciones': 'B-13 Caobos Salazar', 'lider': 'Teniente Fabio Sastoque'},
    'CHAPINERO': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 1', 'color': '#0284c7', 'estaciones': 'B-1 Chapinero', 'lider': 'Teniente Fabio Sastoque'},
    'SUBA': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 1 y 2', 'color': '#0284c7', 'estaciones': 'B-12 Suba, B-14 Bicentenario', 'lider': 'Teniente Fabio Sastoque / Capitán Ciprián Bohórquez'},
    'BARRIOS UNIDOS': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 2', 'color': '#f97316', 'estaciones': 'Cobertura B-7 Ferias', 'lider': 'Capitán Ciprián Bohórquez'},
    'ENGATIVÁ': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 2', 'color': '#f97316', 'estaciones': 'B-7 Ferias, B-15 Garcés Navas', 'lider': 'Capitán Ciprián Bohórquez'},
    'FONTIBÓN': {'distrito': 'Distrito 1 - Norte', 'compania': 'Compañía 2', 'color': '#f97316', 'estaciones': 'B-6 Fontibón', 'lider': 'Capitán Ciprián Bohórquez'},
    'TEUSAQUILLO': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'Cobertura B-2 Central / B-4 Puente Aranda', 'lider': 'Capitán Rodolfo Barrera'},
    'LOS MÁRTIRES': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'B-2 Central', 'lider': 'Capitán Rodolfo Barrera'},
    'SANTA FE': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'Cobertura B-2 Central / B-17 Centro Histórico', 'lider': 'Capitán Rodolfo Barrera'},
    'LA CANDELARIA': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'B-17 Centro Histórico', 'lider': 'Capitán Rodolfo Barrera'},
    'PUENTE ARANDA': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'B-4 Puente Aranda, Edificio Comando Central (CO)', 'lider': 'Capitán Rodolfo Barrera'},
    'KENNEDY': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 3', 'color': '#10b981', 'estaciones': 'B-5 Kennedy', 'lider': 'Capitán Rodolfo Barrera'},
    'ANTONIO NARIÑO': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 4', 'color': '#f59e0b', 'estaciones': 'B-3 Restrepo', 'lider': 'Capitán Jairo Bolaños'},
    'RAFAEL URIBE URIBE': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 4', 'color': '#f59e0b', 'estaciones': 'Cobertura B-3 Restrepo / B-9 Bellavista', 'lider': 'Capitán Jairo Bolaños'},
    'SAN CRISTÓBAL': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 4', 'color': '#f59e0b', 'estaciones': 'B-9 Bellavista', 'lider': 'Capitán Jairo Bolaños'},
    'USME': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 4', 'color': '#f59e0b', 'estaciones': 'B-10 Marichuela', 'lider': 'Capitán Jairo Bolaños'},
    'BOSA': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 5', 'color': '#8b5cf6', 'estaciones': 'B-8 Bosa, B-19 La Cabaña', 'lider': 'Capitán Edinson Panqueva'},
    'TUNJUELITO': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 5', 'color': '#8b5cf6', 'estaciones': 'B-16 Venecia', 'lider': 'Capitán Edinson Panqueva'},
    'CIUDAD BOLÍVAR': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 5', 'color': '#8b5cf6', 'estaciones': 'B-11 Candelaria, B-18 Casa de Teja', 'lider': 'Capitán Edinson Panqueva'},
    'SUMAPAZ': {'distrito': 'Distrito 2 - Sur', 'compania': 'Compañía 5', 'color': '#8b5cf6', 'estaciones': 'Área Rural Extensa / Enlace B-10 & B-18', 'lider': 'Capitán Edinson Panqueva'}
}

# Update features in geojson
for feat in gj['features']:
    raw_name = feat['properties'].get('nombre', '').strip()
    clean_name = name_clean.get(raw_name, raw_name)
    feat['properties']['nombre'] = clean_name
    meta = loc_meta.get(clean_name, {})
    for k, v in meta.items():
        feat['properties'][k] = v

with open('data/localidades_data.js', 'w', encoding='utf-8') as f:
    f.write('// Capa GeoJSON de Localidades de Bogotá con asignación operativa por Compañía\n')
    f.write('const LOCALIDADES_GEOJSON = ' + json.dumps(gj, ensure_ascii=False) + ';\n')

print("Generated data/localidades_data.js successfully!")
