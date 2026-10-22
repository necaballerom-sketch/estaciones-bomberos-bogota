import os
import openpyxl
import json
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    """Establece el color de fondo de una celda en Word."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Establece el padding interior de una celda (en dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC", left="CCCCCC", right="CCCCCC", sz="4"):
    """Establece bordes sutiles a la celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{top}"/>'
                          f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{left}"/>'
                          f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{bottom}"/>'
                          f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{right}"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)

def add_callout_box(doc, title, text, color_hex="B91C1C", bg_hex="FEF2F2"):
    """Crea una caja destacada institucional con borde grueso a la izquierda."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    # Borde grueso izquierdo
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="none"/>'
                          f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{color_hex}"/>'
                          f'<w:bottom w:val="none"/>'
                          f'<w:right w:val="none"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor.from_string(color_hex)
    
    run_b = p.add_run(text)
    run_b.font.name = "Calibri"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(30, 41, 59)
    
    # Espacio después de la tabla
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(6)

def load_data():
    """Carga los datos del Excel y del archivo stations_data.js."""
    # 1. Cargar Excel
    wb = openpyxl.load_workbook('2.1 BASE PREDIAL ESTACIONES - ACTUALIZADA SEPTIEMBRE DIRECCIONES CONFIRMADAS.xlsx', data_only=True)
    ws = wb['BASE']
    
    excel_stations = {}
    for r in range(2, ws.max_row + 1):
        id_val = ws.cell(row=r, column=1).value
        if id_val:
            id_clean = str(id_val).strip()
            excel_stations[id_clean] = {
                'id': id_clean,
                'nombre': str(ws.cell(row=r, column=2).value or '').strip(),
                'chip': str(ws.cell(row=r, column=3).value or '').strip(),
                'rupi': str(ws.cell(row=r, column=4).value or '').strip(),
                'uso_n1': str(ws.cell(row=r, column=5).value or '').strip(),
                'uso_n2': str(ws.cell(row=r, column=6).value or '').strip(),
                'fmi': str(ws.cell(row=r, column=7).value or '').strip(),
                'direccion': str(ws.cell(row=r, column=8).value or '').strip(),
                'dir_sigdep': str(ws.cell(row=r, column=9).value or '').strip(),
                'dir_catastral': str(ws.cell(row=r, column=10).value or '').strip(),
                'dir_acta': str(ws.cell(row=r, column=11).value or '').strip(),
                'barrio': str(ws.cell(row=r, column=12).value or '').strip(),
                'upz': str(ws.cell(row=r, column=13).value or '').strip(),
                'upl': str(ws.cell(row=r, column=14).value or '').strip(),
                'localidad': str(ws.cell(row=r, column=15).value or '').strip(),
                'area_predio': str(ws.cell(row=r, column=16).value or '').strip(),
                'area_construccion': str(ws.cell(row=r, column=17).value or '').strip(),
                'tipo_doc_prop': str(ws.cell(row=r, column=18).value or '').strip(),
                'doc_propietario': str(ws.cell(row=r, column=19).value or '').strip(),
                'propietario': str(ws.cell(row=r, column=20).value or '').strip(),
                'acto_tipo': str(ws.cell(row=r, column=21).value or '').strip(),
                'acto_numero': str(ws.cell(row=r, column=22).value or '').strip(),
                'acto_fecha': str(ws.cell(row=r, column=23).value or '').strip(),
            }
            
    # 2. Cargar stations_data.js
    with open('data/stations_data.js', 'r', encoding='utf-8') as f:
        js_content = f.read()
    m = re.search(r'const STATIONS_DATA = (\[.*?\]);', js_content, re.DOTALL)
    js_stations = json.loads(m.group(1)) if m else []
    
    js_map = {s['id']: s for s in js_stations}
    
    return excel_stations, js_map

def build_word_document():
    excel_data, js_data = load_data()
    
    doc = docx.Document()
    
    # Márgenes de página (2.5 cm = ~0.984 pulgadas)
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.95)
        section.right_margin = Inches(0.95)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Encabezado de página
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_hdr.paragraph_format.space_after = Pt(0)
        run_hdr = p_hdr.add_run("UAECOB • Informe Técnico Predial y Geográfico de Estaciones | Secretaría Distrital de Seguridad")
        run_hdr.font.name = "Calibri"
        run_hdr.font.size = Pt(8)
        run_hdr.font.color.rgb = RGBColor(148, 163, 184)
        
        # Pie de página
        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_ftr = p_ftr.add_run("Cuerpo Oficial de Bomberos de Bogotá - Alcaldía Mayor de Bogotá D.C. | Página Informativa Oficial")
        run_ftr.font.name = "Calibri"
        run_ftr.font.size = Pt(8)
        run_ftr.font.color.rgb = RGBColor(148, 163, 184)

    # -------------------------------------------------------------------------
    # TABLA DE ENCABEZADO INSTITUCIONAL
    # -------------------------------------------------------------------------
    hdr_table = doc.add_table(rows=1, cols=2)
    hdr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_table.autofit = False
    
    # Celda izquierda: Logo Bogotá
    c_logo = hdr_table.cell(0, 0)
    c_logo.width = Inches(1.8)
    set_cell_margins(c_logo, top=60, bottom=60, left=60, right=60)
    p_logo = c_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists('FOTOS/logo_bogota.png'):
        p_logo.add_run().add_picture('FOTOS/logo_bogota.png', width=Inches(1.5))
        
    # Celda derecha: Textos de encabezado institucional
    c_text = hdr_table.cell(0, 1)
    c_text.width = Inches(4.8)
    set_cell_margins(c_text, top=60, bottom=60, left=60, right=60)
    p_inst = c_text.paragraphs[0]
    p_inst.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_inst.paragraph_format.line_spacing = 1.15
    
    r1 = p_inst.add_run("ALCALDÍA MAYOR DE BOGOTÁ D.C.\n")
    r1.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = RGBColor(15, 23, 42)
    
    r2 = p_inst.add_run("SECRETARÍA DISTRITAL DE SEGURIDAD, CONVIVENCIA Y JUSTICIA\n")
    r2.bold = True
    r2.font.size = Pt(9)
    r2.font.color.rgb = RGBColor(185, 28, 28)
    
    r3 = p_inst.add_run("UNIDAD ADMINISTRATIVA ESPECIAL CUERPO OFICIAL DE BOMBEROS (UAECOB)\n")
    r3.bold = True
    r3.font.size = Pt(8.5)
    r3.font.color.rgb = RGBColor(30, 41, 59)
    
    r4 = p_inst.add_run("Subdirección Operativa • Subdirección de Gestión Corporativa\nÁrea de Infraestructura y Bienes Inmuebles")
    r4.font.size = Pt(8)
    r4.font.color.rgb = RGBColor(100, 116, 139)
    
    # Línea divisoria decorativa
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(6)
    p_div.paragraph_format.space_after = Pt(14)
    run_div = p_div.add_run("―" * 58)
    run_div.font.color.rgb = RGBColor(226, 232, 240)
    
    # -------------------------------------------------------------------------
    # TÍTULO DEL DOCUMENTO
    # -------------------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    run_t1 = p_title.add_run("INFORME TÉCNICO OFICIAL N° UAECOB-INF-2026-042\n")
    run_t1.bold = True
    run_t1.font.name = "Calibri"
    run_t1.font.size = Pt(13)
    run_t1.font.color.rgb = RGBColor(185, 28, 28)
    
    run_t2 = p_title.add_run("CARACTERIZACIÓN PREDIAL, CATASTRAL, JURÍDICA, OPERATIVA Y GEORREFERENCIACIÓN DE LAS ESTACIONES DE BOMBEROS DEL DISTRITO CAPITAL")
    run_t2.bold = True
    run_t2.font.name = "Calibri"
    run_t2.font.size = Pt(14)
    run_t2.font.color.rgb = RGBColor(15, 30, 60)
    
    # -------------------------------------------------------------------------
    # TABLA DE METADATOS / DESTINATARIOS
    # -------------------------------------------------------------------------
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    meta_rows = [
        ("PARA:", "SECRETARÍA DISTRITAL DE SEGURIDAD, CONVIVENCIA Y JUSTICIA DE BOGOTÁ D.C.\nDespacho del Secretario Distrital de Seguridad / Dirección de Seguridad y Convivencia"),
        ("DE:", "UNIDAD ADMINISTRATIVA ESPECIAL CUERPO OFICIAL DE BOMBEROS DE BOGOTÁ (UAECOB)\nSubdirección Operativa y Subdirección de Gestión Corporativa"),
        ("FECHA:", "Octubre de 2026 (Actualización de Base Predial Septiembre - Octubre 2026)"),
        ("CIUDAD:", "Bogotá D.C., Colombia"),
        ("ASUNTO:", "Relación técnica integral, caracterización predial catastral y georreferenciación de las Estaciones de Bomberos B-1 a B-19, Edificio de Comando Central y Sedes Estratégicas Complementarias."),
        ("ACCESO EN LÍNEA:", "Plataforma Digital Institucional y Visor Geográfico Distrital (GIS 360°):\nhttps://necaballerom-sketch.github.io/estaciones-bomberos-bogota/")
    ]
    
    col_widths = [Inches(1.5), Inches(5.1)]
    for r_idx, (label, val) in enumerate(meta_rows):
        c_lbl = meta_table.cell(r_idx, 0)
        c_val = meta_table.cell(r_idx, 1)
        
        c_lbl.width = col_widths[0]
        c_val.width = col_widths[1]
        
        set_cell_background(c_lbl, "F1F5F9" if r_idx % 2 == 0 else "F8FAFC")
        set_cell_background(c_val, "FFFFFF" if r_idx % 2 == 0 else "F8FAFC")
        
        set_cell_margins(c_lbl, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c_val, top=80, bottom=80, left=100, right=100)
        
        set_cell_borders(c_lbl, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
        set_cell_borders(c_val, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
        
        p_l = c_lbl.paragraphs[0]
        p_l.paragraph_format.space_after = Pt(0)
        run_l = p_l.add_run(label)
        run_l.bold = True
        run_l.font.size = Pt(9)
        run_l.font.color.rgb = RGBColor(15, 30, 60)
        
        p_v = c_val.paragraphs[0]
        p_v.paragraph_format.space_after = Pt(0)
        p_v.paragraph_format.line_spacing = 1.15
        run_v = p_v.add_run(val)
        run_v.font.size = Pt(9)
        if label == "ACCESO EN LÍNEA:":
            run_v.font.color.rgb = RGBColor(2, 132, 199)
            run_v.bold = True
        else:
            run_v.font.color.rgb = RGBColor(30, 41, 59)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------------------
    # SECCIÓN 1: INTRODUCCIÓN Y OBJETO
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("1. OBJETO Y ALCANCE DEL INFORME", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    
    p_obj = doc.add_paragraph()
    p_obj.paragraph_format.line_spacing = 1.15
    p_obj.paragraph_format.space_after = Pt(6)
    p_obj.add_run(
        "El presente informe técnico tiene por objeto remitir a la Secretaría Distrital de Seguridad, Convivencia y Justicia "
        "el balance formal, consolidado y detallado del estado de la infraestructura inmobiliaria del Cuerpo Oficial de Bomberos "
        "de Bogotá (UAECOB). El documento relaciona la totalidad de las estaciones operativas existentes desde la Estación B-1 "
        "hasta la B-19, el Edificio de Comando Central (CO), la sede proyectada B-20 El Otoño y los complejos logísticos y de entrenamiento "
        "adscritos a la entidad.\n\n"
        "La información contenida proviene del cruce técnico y validación en terreno de la Base Predial Oficial del Departamento "
        "Administrativo de la Defensoría del Espacio Público (DADEP), la Unidad Administrativa Especial de Catastro Distrital (UAECD), "
        "las Actas de Entrega y Contratos de Comodato vigentes, vinculando para cada predio su caracterización catastral (CHIP), "
        "registral (FMI, RUPI), métrica de áreas (terreno y construcción) y sus coordenadas geográficas exactas bajo el sistema WGS84."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 2: MARCO NORMATIVO E INSTITUCIONAL
    # -------------------------------------------------------------------------
    h2 = doc.add_heading("2. MARCO NORMATIVO E INSTITUCIONAL", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    
    p_norm = doc.add_paragraph()
    p_norm.paragraph_format.line_spacing = 1.15
    p_norm.paragraph_format.space_after = Pt(6)
    p_norm.add_run(
        "La administración y destinación de la infraestructura física del Cuerpo Oficial de Bomberos de Bogotá se fundamenta en las siguientes directrices:\n"
        "• Ley 1575 de 2012 (Ley General de Bomberos de Colombia): Establece la gestión integral del riesgo contra incendio, los preparativos y atención de rescates y la atención de incidentes con materiales peligrosos como un servicio público esencial a cargo del Estado.\n"
        "• Acuerdo Distrital 257 de 2006: Organiza la estructura del Distrito Capital y define la naturaleza de la UAECOB como entidad adscrita a la Secretaría Distrital de Seguridad, Convivencia y Justicia.\n"
        "• Decreto Distrital 555 de 2021 (Plan de Ordenamiento Territorial - POT Bogotá Reverdece): Clasifica las estaciones de bomberos como equipamientos distritales de seguridad, defensa y justicia del Sistema del Cuidado y Servicios Sociales, asignándoles tratamiento prioritario de permanencia y modernización en las Unidades de Planeamiento Local (UPL).\n"
        "• Políticas de Inventario y Administración Inmobiliaria Distrital (DADEP - RUPI): Regulan la tenencia de predios fiscales, zonas comunales y de cesión entregadas a la UAECOB para el cumplimiento de su misión constitucional."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 3: ESTRUCTURA Y DESPLIEGUE OPERATIVO
    # -------------------------------------------------------------------------
    h3 = doc.add_heading("3. ESQUEMA DE DESPLIEGUE OPERATIVO DISTRITAL", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    
    p_comp = doc.add_paragraph()
    p_comp.paragraph_format.line_spacing = 1.15
    p_comp.paragraph_format.space_after = Pt(8)
    p_comp.add_run(
        "Para garantizar tiempos óptimos de respuesta y cobertura en las 20 localidades de Bogotá, el Distrito Capital "
        "se encuentra zonificado en dos (2) Distritos Operativos y cinco (5) Compañías Especializadas de Bomberos:\n\n"
        "1. DISTRITO 1 - NORTE:\n"
        "   • Compañía 1 (Comandante: Teniente Fabio Sastoque): Cobertura sobre Chapinero, Usaquén, Suba y el corredor de la Carrera Séptima. Integra las estaciones B-1 Chapinero, B-12 Suba, B-13 Caobos Salazar y B-14 Bicentenario.\n"
        "   • Compañía 2 (Comandante: Capitán Ciprián Bohórquez): Cobertura sobre Engativá, Fontibón y Barrios Unidos, incluyendo el corredor del Aeropuerto El Dorado. Integra las estaciones B-6 Fontibón, B-7 Ferias y B-15 Garcés Navas.\n\n"
        "2. DISTRITO 2 - SUR:\n"
        "   • Compañía 3 (Comandante: Capitán Rodolfo Barrera): Cobertura sobre el Centro Histórico, Puente Aranda, Los Mártires, Santa Fe y Teusaquillo. Integra las estaciones B-2 Central, B-4 Puente Aranda, B-17 Centro Histórico y el Edificio de Comando Central (CO).\n"
        "   • Compañía 4 (Comandante: Capitán Jairo Bolaños): Cobertura sobre Antonio Nariño, San Cristóbal, Rafael Uribe Uribe, Usme y cerros surorientales. Integra las estaciones B-3 Restrepo, B-9 Bellavista y B-10 Marichuela.\n"
        "   • Compañía 5 (Comandante: Capitán Edinson Panqueva): Cobertura sobre Bosa, Kennedy, Tunjuelito, Ciudad Bolívar y Sumapaz. Integra las estaciones B-5 Kennedy, B-8 Bosa, B-11 Candelaria, B-16 Venecia, B-18 Casa de Teja y B-19 La Cabaña."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 4: CONDICIONES ESPECIALES DE INFRAESTRUCTURA (PUNTOS CRÍTICOS)
    # -------------------------------------------------------------------------
    h4 = doc.add_heading("4. SITUACIONES PREDIALES ESPECIALES Y PUNTOS DE ATENCIÓN PRIORITARIA", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    
    p_warn_intro = doc.add_paragraph()
    p_warn_intro.paragraph_format.line_spacing = 1.15
    p_warn_intro.paragraph_format.space_after = Pt(8)
    p_warn_intro.add_run(
        "Se solicita a la Secretaría Distrital de Seguridad prestar especial atención a las siguientes tres (3) "
        "condiciones particulares de infraestructura que inciden directamente en la planeación presupuestal, "
        "contractual y operativa de la entidad:"
    )

    # Callout 1: B-7 Ferias
    add_callout_box(
        doc,
        title="CONSIDERACIÓN CRÍTICA: ESTACIÓN B-7 FERIAS (DOBLE CONDICIÓN PREDIAL)",
        text="La Estación B-7 Ferias presenta una condición dual de tenencia y operación que requiere diferenciación técnica:\n"
             "1. Predio Propio Histórico (Carrera 69J No. 72 - 61 | CHIP: AAA0059HZMS | RUPI: 1816-112-2 | Área: 2.036,27 m²): "
             "Inmueble titularidad del Distrito Capital con declaratoria de demolición total programada para dar paso al proyecto de "
             "construcción de la nueva y moderna Estación Ferias.\n"
             "2. Sede Operativa Actual en Arrendamiento (Calle 77A No. 77 - 36 | Engativá): Inmueble arrendado a particulares donde "
             "opera actualmente el personal activo, máquinas de extinción y equipos de emergencia, garantizando la continuidad ininterrumpida "
             "del servicio en la Compañía 2 mientras se adelantan las obras de la nueva sede propia.",
        color_hex="D97706",
        bg_hex="FFFBEB"
    )

    # Callout 2: B-13 Caobos Salazar
    add_callout_box(
        doc,
        title="CONSIDERACIÓN CRÍTICA: ESTACIÓN B-13 CAOBOS SALAZAR (DEMOLICIÓN Y NUEVA EDIFICACIÓN)",
        text="La edificación tradicional de la Estación B-13 Caobos Salazar (Av. Carrera 15 No. 145 - 50 | CHIP: AAA0110SJWW | "
             "RUPI: 323-38 | Área Terreno: 2.922,77 m²) fue completamente demolida debido a obsolescencia estructural y necesidad de "
             "ampliación. Actualmente el predio se encuentra en fase activa de desarrollo y construcción para una nueva edificación "
             "moderna y sismorresistente. La cobertura del cuadrante nororiental se mantiene reforzada desde las estaciones B-1 Chapinero "
             "y B-14 Bicentenario.",
        color_hex="DC2626",
        bg_hex="FEF2F2"
    )

    # Callout 3: Edificio Comando Central
    add_callout_box(
        doc,
        title="SEDE INSTITUCIONAL: EDIFICIO DE COMANDO CENTRAL DE BOMBEROS (CO)",
        text="Ubicado en la Calle 20 No. 68A - 06 (Localidad Puente Aranda / Barrio Montevideo, contiguo a la estación B-4 | Lat: 4.645967, "
             "Lon: -74.113331). Alberga la Dirección General de Bomberos Bogotá, la Central de Coordinación y Despacho de Emergencias (123), "
             "las salas de crisis y las dependencias estratégicas corporativas de la UAECOB.",
        color_hex="E11D48",
        bg_hex="FFF1F2"
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 5: TABLA MATRIZ CONSOLIDADA GENERAL
    # -------------------------------------------------------------------------
    h5 = doc.add_heading("5. MATRIZ GENERAL CONSOLIDADA DE ESTACIONES DE BOMBEROS", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    
    p_mat_desc = doc.add_paragraph()
    p_mat_desc.paragraph_format.line_spacing = 1.15
    p_mat_desc.paragraph_format.space_after = Pt(8)
    p_mat_desc.add_run(
        "A continuación se presenta la matriz maestra con la relación predial, catastral, dimensional y de localización geográfica "
        "de las estaciones de bomberos B-1 a B-19 y el Edificio de Comando Central:"
    )

    # Tabla Maestra
    cols_def = [
        ("CÓD.", Inches(0.48)),
        ("NOMBRE", Inches(1.15)),
        ("DIRECCIÓN CONFIRMADA", Inches(1.35)),
        ("LOCALIDAD", Inches(0.85)),
        ("COORDENADAS (WGS84)", Inches(1.05)),
        ("CHIP", Inches(0.85)),
        ("ÁREA LOTE (m²)", Inches(0.68)),
        ("COMPAÑÍA", Inches(0.68))
    ]
    
    table_main = doc.add_table(rows=1, cols=len(cols_def))
    table_main.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_main.autofit = False
    
    # Encabezado
    hdr_cells = table_main.rows[0].cells
    for i, (name, width) in enumerate(cols_def):
        cell = hdr_cells[i]
        cell.width = width
        set_cell_background(cell, "0F1E3C")
        set_cell_margins(cell, top=100, bottom=100, left=60, right=60)
        set_cell_borders(cell, top="0F1E3C", bottom="0F1E3C", left="0F1E3C", right="0F1E3C")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(name)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(7.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    # Orden de estaciones B-1 a B-19 con CO después de B-4
    order_ids = [
        "B-1", "B-2", "B-3", "B-4", "CO", "B-5", "B-6", "B-7", "B-8", "B-9",
        "B-10", "B-11", "B-12", "B-13", "B-14", "B-15", "B-16", "B-17", "B-18", "B-19"
    ]
    
    for r_idx, st_id in enumerate(order_ids):
        row = table_main.add_row()
        cells = row.cells
        bg_row = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        if st_id == "CO":
            bg_row = "FFF1F2"
        elif st_id in ("B-7", "B-13"):
            bg_row = "FEF3C7" if st_id == "B-7" else "FEE2E2"
            
        js_st = js_data.get(st_id, {})
        ex_st = excel_data.get(st_id, {})
        
        # Datos a mostrar
        name_val = js_st.get('name', ex_st.get('nombre', ''))
        dir_val = ex_st.get('direccion') or js_st.get('address', '')
        loc_val = js_st.get('localityName', ex_st.get('localidad', ''))
        coords_val = f"{js_st.get('lat', 0):.5f}, {js_st.get('lon', 0):.5f}" if js_st else "N/A"
        chip_val = ex_st.get('chip') or js_st.get('chip', 'N/A')
        area_val = ex_st.get('area_predio') or js_st.get('areaLot', 'N/A')
        comp_val = js_st.get('company', 'N/A').replace('Compañía', 'Comp.')
        
        row_vals = [st_id, name_val, dir_val, loc_val, coords_val, chip_val, str(area_val), comp_val]
        
        for i, val in enumerate(row_vals):
            cell = cells[i]
            cell.width = cols_def[i][1]
            set_cell_background(cell, bg_row)
            set_cell_margins(cell, top=70, bottom=70, left=50, right=50)
            set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in (0, 3, 4, 6, 7) else WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(val)
            run.font.name = "Calibri"
            run.font.size = Pt(7.5)
            if i == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(185, 28, 28)
            else:
                run.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------------------
    # SECCIÓN 6: FICHAS TÉCNICAS Y PREDIALES DETALLADAS (INDIVIDUALES)
    # -------------------------------------------------------------------------
    h6 = doc.add_heading("6. FICHAS TÉCNICAS DETALLADAS POR ESTACIÓN", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(8)
    
    p_fichas_intro = doc.add_paragraph()
    p_fichas_intro.paragraph_format.line_spacing = 1.15
    p_fichas_intro.paragraph_format.space_after = Pt(10)
    p_fichas_intro.add_run(
        "A continuación se presenta el desglose individualizado de cada una de las veinte (20) instalaciones "
        "principales de bomberos en Bogotá, relacionando sus variables catastrales, jurídicas, dimensionales y operativas:"
    )

    for st_id in order_ids:
        js_st = js_data.get(st_id, {})
        ex_st = excel_data.get(st_id, {})
        
        st_name = js_st.get('name', ex_st.get('nombre', ''))
        st_sub = js_st.get('subtitle', '')
        
        # Encabezado de ficha de estación
        h_st = doc.add_heading(f"{st_id} - {st_name.upper()}", level=2)
        h_st.paragraph_format.space_before = Pt(12)
        h_st.paragraph_format.space_after = Pt(3)
        
        if st_sub:
            p_sub = doc.add_paragraph()
            p_sub.paragraph_format.space_before = Pt(0)
            p_sub.paragraph_format.space_after = Pt(4)
            r_sub = p_sub.add_run(f"Honor institucional: {st_sub}")
            r_sub.italic = True
            r_sub.font.size = Pt(9)
            r_sub.font.color.rgb = RGBColor(100, 116, 139)
            
        # Tabla Ficha de Datos
        t_card = doc.add_table(rows=7, cols=4)
        t_card.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_card.autofit = False
        
        cw = [Inches(1.5), Inches(2.0), Inches(1.4), Inches(1.7)]
        
        card_items = [
            ("Dirección Oficial:", ex_st.get('direccion') or js_st.get('address', 'N/A'),
             "Localidad:", f"{ex_st.get('localidad') or js_st.get('locality', 'N/A')}"),
            
            ("Barrio Catastral:", ex_st.get('barrio') or js_st.get('neighborhood', 'N/A'),
             "UPZ / UPL:", f"{ex_st.get('upz', 'N/A')} • {ex_st.get('upl', 'N/A')}"),
            
            ("Coordenadas WGS84:", f"{js_st.get('lat', 0):.6f}, {js_st.get('lon', 0):.6f}",
             "Compañía Operativa:", f"{js_st.get('company', 'N/A')} ({js_st.get('companyLeader', 'N/A')})"),
            
            ("Código CHIP:", ex_st.get('chip') or js_st.get('chip', 'N/A'),
             "Código RUPI (DADEP):", ex_st.get('rupi') or js_st.get('rupi', 'N/A')),
            
            ("Matrícula Inmob. (FMI):", ex_st.get('fmi') or js_st.get('fmi', 'N/A'),
             "Titular / Propietario:", ex_st.get('propietario') or js_st.get('owner', 'Distrito Capital')),
            
            ("Área del Terreno:", f"{ex_st.get('area_predio') or js_st.get('areaLot', 'N/A')} m²",
             "Área Construida:", f"{ex_st.get('area_construccion') or js_st.get('areaBuilt', 'N/A')} m²"),
            
            ("Acto de Entrega / Título:", f"{ex_st.get('acto_tipo', 'Acta')} {ex_st.get('acto_numero', 'S/N')}",
             "Fecha Suscripción:", f"{ex_st.get('acto_fecha', 'Registrado')}")
        ]
        
        for r_i, (lbl1, val1, lbl2, val2) in enumerate(card_items):
            pairs = [(lbl1, val1, 0, 1), (lbl2, val2, 2, 3)]
            bg_c = "F8FAFC" if r_i % 2 == 0 else "FFFFFF"
            for label, value, idx_l, idx_v in pairs:
                c_l = t_card.cell(r_i, idx_l)
                c_v = t_card.cell(r_i, idx_v)
                
                c_l.width = cw[idx_l]
                c_v.width = cw[idx_v]
                
                set_cell_background(c_l, "F1F5F9")
                set_cell_background(c_v, bg_c)
                
                set_cell_margins(c_l, top=60, bottom=60, left=80, right=80)
                set_cell_margins(c_v, top=60, bottom=60, left=80, right=80)
                
                set_cell_borders(c_l, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
                set_cell_borders(c_v, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
                
                p_l = c_l.paragraphs[0]
                p_l.paragraph_format.space_after = Pt(0)
                r_l = p_l.add_run(label)
                r_l.bold = True
                r_l.font.size = Pt(8)
                r_l.font.color.rgb = RGBColor(15, 30, 60)
                
                p_v = c_v.paragraphs[0]
                p_v.paragraph_format.space_after = Pt(0)
                p_v.paragraph_format.line_spacing = 1.05
                r_v = p_v.add_run(str(value))
                r_v.font.size = Pt(8)
                r_v.font.color.rgb = RGBColor(30, 41, 59)
                
        # Observación operativa específica
        desc = js_st.get('description', '')
        if desc:
            p_desc = doc.add_paragraph()
            p_desc.paragraph_format.space_before = Pt(4)
            p_desc.paragraph_format.space_after = Pt(8)
            p_desc.paragraph_format.line_spacing = 1.15
            r_d_lbl = p_desc.add_run("Alcance Operativo: ")
            r_d_lbl.bold = True
            r_d_lbl.font.size = Pt(8.5)
            r_d_lbl.font.color.rgb = RGBColor(185, 28, 28)
            r_d_txt = p_desc.add_run(desc)
            r_d_txt.font.size = Pt(8.5)
            r_d_txt.font.color.rgb = RGBColor(71, 85, 105)

    # -------------------------------------------------------------------------
    # SECCIÓN 7: INFRAESTRUCTURA COMPLEMENTARIA Y PROYECCIONES
    # -------------------------------------------------------------------------
    h7 = doc.add_heading("7. INFRAESTRUCTURA ESTRATÉGICA COMPLEMENTARIA Y PROYECCIONES", level=1)
    h7.paragraph_format.space_before = Pt(14)
    h7.paragraph_format.space_after = Pt(6)
    
    p_extra_intro = doc.add_paragraph()
    p_extra_intro.paragraph_format.line_spacing = 1.15
    p_extra_intro.paragraph_format.space_after = Pt(6)
    p_extra_intro.add_run(
        "Adicional a las 19 estaciones de despacho operativo y el Edificio de Comando Central, la base predial "
        "institucional registra cinco (5) inmuebles estratégicos fundamentales para la reserva logística, el entrenamiento "
        "táctico y la futura expansión de la cobertura:"
    )

    extra_items = [
        ("B-20: El Otoño (Proyección de Expansión Extremo Norte)",
         "Calle 201 No. 54D - 45 (Localidad Suba - Barrio Casa Blanca Suba)\n"
         "• CHIP: AAA0290PWFT | RUPI: 3718-22 | FMI: 050N20916889\n"
         "• Área Terreno: 3.048,53 m² | Área Construida: En etapa de diseño (0 m²)\n"
         "• Soporte Legal: Acta de Entrega 009-2025 suscrita el 30 de julio de 2025.\n"
         "• Destinación: Terreno reservado por el Distrito Capital para la futura Estación de Bomberos El Otoño, "
         "garantizando la respuesta en el extremo norte de la Autopista Norte y la reserva forestal Thomas van der Hammen."),
        
        ("Centro de Entrenamiento Bomberil - La Alemana",
         "Las Violetas Rural 35 (Área Rural Distrital)\n"
         "• CHIP: AAA0262PZKL | FMI: 50S-40331205\n"
         "• Área Predio: 2.852,96 m² | Propietario: Empresa de Acueducto y Alcantarillado de Bogotá (EAAB)\n"
         "• Soporte Legal: Contrato de Comodato EAAB suscrito el 5 de agosto de 2022.\n"
         "• Destinación: Complejo táctico especializado para simuladores de fuego real, rescate en espacios confinados, "
         "estructuras colapsadas e instrucción continua del personal operativo."),
        
        ("Bodega Logística - Arborizadora Alta",
         "Carrera 37 No. 75 - 99 Sur (Localidad Ciudad Bolívar)\n"
         "• CHIP: AAA0165UOWF | FMI: 50S-40748876\n"
         "• Área Lote: 3.387,60 m² | Área Construida: 1.661,60 m²\n"
         "• Soporte Legal: Permiso de ocupación temporal otorgado por la Caja de Vivienda Popular (vigente hasta agosto 2026), "
         "con trámite de comodato definitivo pendiente de suscripción.\n"
         "• Destinación: Reserva de equipos pesados, almacenamiento de suministros de intendencia y contingencias del sur distrital."),
        
        ("Bodega de Inventarios - Bellavista",
         "Calle 36L Sur No. 8C - 51 Este (Localidad San Cristóbal - Barrio Bellavista Sur)\n"
         "• CHIP: AAA0003WZTO | RUPI: 569 | FMI: 50S-833473\n"
         "• Área Lote: 784,39 m² | Área Construida: 432,03 m²\n"
         "• Destinación: Custodia, clasificación y despacho de dotaciones, uniformes normados y repuestos automotores de máquinas bomberiles."),
        
        ("Inmueble Parque Pensilvania (En Devolución)",
         "Carrera 33 No. 6A - 74 (Localidad Puente Aranda - Barrio Pensilvania)\n"
         "• CHIP: AAA0035SDNX | RUPI: 2484-19 | FMI: 050C0000000 | Área: 2.340,00 m²\n"
         "• Soporte Legal: Acta 52-14 del 29 de julio de 2014.\n"
         "• Estado Administrativo: Inmueble que cumplió su ciclo de uso institucional y se encuentra formalmente en proceso "
         "administrativo de devolución al DADEP y a la administración central distrital.")
    ]
    
    for title, detail in extra_items:
        p_ex = doc.add_paragraph()
        p_ex.paragraph_format.line_spacing = 1.15
        p_ex.paragraph_format.space_before = Pt(4)
        p_ex.paragraph_format.space_after = Pt(4)
        r_t = p_ex.add_run(f"• {title}:\n")
        r_t.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(15, 30, 60)
        r_d = p_ex.add_run(detail)
        r_d.font.size = Pt(9)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    # -------------------------------------------------------------------------
    # SECCIÓN 8: PLATAFORMA DIGITAL Y VISOR GEOGRÁFICO DISTRITAL
    # -------------------------------------------------------------------------
    h8 = doc.add_heading("8. PLATAFORMA DIGITAL Y VISOR GEOGRÁFICO INTERACTIVO (GIS 360°)", level=1)
    h8.paragraph_format.space_before = Pt(14)
    h8.paragraph_format.space_after = Pt(6)
    
    p_gis = doc.add_paragraph()
    p_gis.paragraph_format.line_spacing = 1.15
    p_gis.paragraph_format.space_after = Pt(6)
    p_gis.add_run(
        "Como complemento visual, técnico y analítico al presente informe impreso, la UAECOB desarrolló y puso en línea "
        "un aplicativo web interactivo institucional que permite a la Secretaría Distrital de Seguridad inspeccionar la totalidad "
        "de las estaciones de manera dinámica desde cualquier computador o dispositivo móvil:\n\n"
        "🔗 ENLACE DE ACCESO PÚBLICO EN VIVO:\n"
        "https://necaballerom-sketch.github.io/estaciones-bomberos-bogota/\n\n"
        "Funcionalidades disponibles en el aplicativo digital:\n"
        "1. Catálogo Fotográfico HD y Fondo Ambiental Esmerilado: Visualización nítida y fidedigna de las fachadas institucionales sin cortes arquitectónicos.\n"
        "2. Google Street View 360° Inmersivo por Estación: Integración directa que permite a los funcionarios de la Secretaría rotar 360 grados de manera virtual sobre la vía y el predio de cada estación, inspeccionando accesos vehiculares, topografía y entorno barrial.\n"
        "3. Selector Dual de la Estación B-7 Ferias: Capacidad de alternar en un clic entre la visualización del predio propio a demoler (Carrera 69J # 72-61) y la sede arrendada activa (Calle 77A # 77-36), actualizando instantáneamente la fotografía, datos y Street View.\n"
        "4. Visor Geográfico Distrital (GIS): Despliegue cartográfico en tiempo real de los puntos de las 19 estaciones + CO georreferenciados sobre los polígonos oficiales de las localidades de Bogotá, con filtros por compañía y distrito operativo."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 9: CONCLUSIONES Y RECOMENDACIONES TÉCNICAS
    # -------------------------------------------------------------------------
    h9 = doc.add_heading("9. CONCLUSIONES Y RECOMENDACIONES", level=1)
    h9.paragraph_format.space_before = Pt(14)
    h9.paragraph_format.space_after = Pt(6)
    
    p_concl = doc.add_paragraph()
    p_concl.paragraph_format.line_spacing = 1.15
    p_concl.paragraph_format.space_after = Pt(8)
    p_concl.add_run(
        "1. Consolidación de Información: La UAECOB cuenta hoy con una base predial 100% georreferenciada y confirmada en terreno, permitiendo un seguimiento riguroso a la tenencia física y legal de sus 19 estaciones principales.\n"
        "2. Prioridad en Ejecución de Obras: Es perentorio articular los esfuerzos entre la Secretaría de Seguridad, el DADEP y la UAECOB para acelerar los cronogramas constructivos de la nueva Estación Ferias (B-7) y la culminación de la Estación Caobos Salazar (B-13).\n"
        "3. Gestión del Suelo en B-20 El Otoño: El predio recibido mediante el Acta 009-2025 en Suba constituye el activo estratégico de mayor valor para la futura expansión institucional, por lo cual se recomienda priorizar los estudios de prefactibilidad y licenciamiento.\n"
        "4. Disponibilidad Tecnológica Permanente: La plataforma web desarrollada queda a disposición de la Secretaría Distrital de Seguridad como insumo de consulta gerencial para comités de orden público y toma de decisiones operativas."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 10: FIRMAS INSTITUCIONALES
    # -------------------------------------------------------------------------
    h10 = doc.add_heading("10. CONTROL DE EMISIÓN Y FIRMAS", level=1)
    h10.paragraph_format.space_before = Pt(14)
    h10.paragraph_format.space_after = Pt(8)
    
    sig_table = doc.add_table(rows=1, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False
    
    sig_col_w = Inches(2.2)
    sig_data = [
        ("ELABORÓ:", "Área de Infraestructura y Bienes Inmuebles\nProfesional Especializado GIS / Predial\nUAECOB"),
        ("REVISÓ:", "Subdirección Operativa\nCuerpo Oficial de Bomberos de Bogotá\nUAECOB"),
        ("APROBÓ:", "Subdirección de Gestión Corporativa / Despacho Dirección General\nUAECOB")
    ]
    
    for i, (role, detail) in enumerate(sig_data):
        c = sig_table.cell(0, i)
        c.width = sig_col_w
        set_cell_background(c, "F8FAFC")
        set_cell_margins(c, top=100, bottom=100, left=80, right=80)
        set_cell_borders(c, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        
        r_role = p.add_run(f"{role}\n\n\n___________________________________\n")
        r_role.bold = True
        r_role.font.size = Pt(8.5)
        r_role.font.color.rgb = RGBColor(15, 30, 60)
        
        r_det = p.add_run(detail)
        r_det.font.size = Pt(8)
        r_det.font.color.rgb = RGBColor(71, 85, 105)

    # Guardar documento
    output_filename = "INFORME_TECNICO_PREDIAL_ESTACIONES_BOMBEROS_BOGOTA_SECRETARIA_SEGURIDAD.docx"
    doc.save(output_filename)
    print(f"Documento generado exitosamente: {output_filename}")

if __name__ == '__main__':
    build_word_document()
