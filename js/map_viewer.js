/**
 * ============================================================================
 * MAP VIEWER - CUERPO OFICIAL BOMBEROS DE BOGOTÁ
 * Módulo GIS Interactivo basado en Leaflet para visualización de estaciones,
 * polígonos de localidades y áreas operativas por compañía.
 * 100% Open Basemaps (Sin requerimiento de API Key).
 * ============================================================================
 */

class BomberosMapViewer {
  constructor(mapContainerId) {
    this.mapContainerId = mapContainerId;
    this.map = null;
    this.localitiesLayer = null;
    this.stationsLayerGroup = null;
    this.markersMap = new Map();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.baseLayers = {};
    this.isInitialized = false;

    // Urban Bogotá default bounds (framing B-14 in north to B-10 in south)
    this.bogotaBounds = L.latLngBounds(
      [4.4900, -74.2400], // Southwest
      [4.7700, -74.0100]  // Northeast
    );
  }

  init() {
    if (this.isInitialized) return;
    const container = document.getElementById(this.mapContainerId);
    if (!container) return;

    // Initialize Leaflet Map
    this.map = L.map(this.mapContainerId, {
      center: [4.6350, -74.1100],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false
    });

    // Add Zoom Control at bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

    // 1. Setup 100% Free Open Basemaps (NO API KEY REQUIRED)
    // Primary Default: Esri World Dark Gray Canvas
    const esriDark = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, HERE, DeLorme, MapmyIndia &copy; OpenStreetMap',
      maxZoom: 16
    });

    // Esri Dark Labels overlay for street context
    const esriDarkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      pane: 'shadowPane'
    });

    // OpenStreetMap Standard (100% open free)
    const osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    // Esri Satellite (World Imagery) + Labels
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS',
      maxZoom: 18
    });

    const esriSatelliteLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      pane: 'shadowPane'
    });

    // Esri Streets (World Street Map)
    const esriStreets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap',
      maxZoom: 18
    });

    // Add default layers: Esri World Imagery (Satellite) + Street/Place Labels
    esriSatellite.addTo(this.map);
    esriSatelliteLabels.addTo(this.map);

    this.baseLayers = {
      satellite: L.layerGroup([esriSatellite, esriSatelliteLabels]),
      dark: L.layerGroup([esriDark, esriDarkLabels]),
      streets: osmTiles,
      esri_streets: esriStreets
    };

    // 2. Setup Localities GeoJSON Layer
    this.setupLocalitiesLayer();

    // 3. Setup Stations Markers Layer
    this.setupStationsLayer();

    // 4. Initial Fit to Urban Bogotá Perimeter
    this.map.fitBounds(this.bogotaBounds, { padding: [25, 25] });

    this.isInitialized = true;

    // Invalidate map size after animation / slide load
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.fitBounds(this.bogotaBounds, { padding: [25, 25] });
    }, 350);
  }

  setupLocalitiesLayer() {
    if (typeof LOCALIDADES_GEOJSON === 'undefined') return;

    this.localitiesLayer = L.geoJSON(LOCALIDADES_GEOJSON, {
      style: (feature) => {
        const props = feature.properties || {};
        const color = props.color || '#3b82f6';
        return {
          fillColor: color,
          fillOpacity: 0.32,
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.85
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const tooltipHtml = `
          <div style="font-family: inherit; font-size: 12px; color: #fff; min-width: 170px;">
            <div style="font-size: 14px; font-weight: 800; color: #facc15; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px; margin-bottom: 4px;">
              ${p.nombre || 'Localidad'}
            </div>
            <div><b>Distrito:</b> ${p.distrito || 'N/A'}</div>
            <div><b>Compañía:</b> <span style="color:${p.color || '#fff'}; font-weight:700;">${p.compania || 'N/A'}</span></div>
            <div><b>Comandante:</b> ${p.lider || 'N/A'}</div>
            <div style="margin-top: 3px;"><b>Estaciones:</b> ${p.estaciones || 'N/A'}</div>
          </div>
        `;
        layer.bindTooltip(tooltipHtml, {
          sticky: true,
          className: 'custom-gis-tooltip',
          direction: 'auto'
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              fillOpacity: 0.55,
              weight: 3,
              color: '#ffffff'
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: (e) => {
            this.updateLayerStyles();
          }
        });
      }
    }).addTo(this.map);
  }

  setupStationsLayer() {
    if (typeof STATIONS_DATA === 'undefined') return;

    this.stationsLayerGroup = L.layerGroup().addTo(this.map);

    STATIONS_DATA.forEach((st) => {
      const isCO = st.id === 'CO';
      const markerColor = st.companyColor || '#ef4444';
      
      const customIcon = L.divIcon({
        className: 'fire-custom-marker',
        html: `
          <div class="marker-inner-shield" style="background: ${markerColor}; ${isCO ? 'box-shadow: 0 0 16px #ef4444; border-color: #fef08a;' : ''}">
            <span>${st.id}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });

      // Rich Popup
      const popupContent = `
        <div style="font-family: 'Segoe UI', sans-serif; width: 260px; color: #1e293b;">
          <div style="position: relative; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
            <img src="${encodeURI(st.photo)}" alt="${st.name}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.75); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">
              ${st.id}
            </div>
            <div style="position: absolute; bottom: 6px; right: 6px; background: ${markerColor}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">
              ${st.company}
            </div>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${st.name}</h4>
          ${st.subtitle ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${st.subtitle}</div>` : ''}
          <div style="font-size: 11.5px; line-height: 1.5; color: #334155; margin-bottom: 8px;">
            <div><b>Dirección:</b> ${st.address}</div>
            <div><b>Localidad:</b> ${st.locality}</div>
            <div><b>Jurisdicción:</b> ${st.company}</div>
            <div><b>Comandante:</b> ${st.companyLeader}</div>
          </div>
          <button onclick="window.appPresentation.goToStation('${st.id}')" style="width: 100%; background: #b91c1c; color: #fff; border: none; padding: 7px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>Ver Ficha Operativa Completa</span> &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.stationData = st;

      this.stationsLayerGroup.addLayer(marker);
      this.markersMap.set(st.id, marker);
    });
  }

  filterStations(criteria) {
    this.currentFilter = criteria;
    this.applyFilters();
  }

  search(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.applyFilters();
  }

  updateLayerStyles() {
    if (!this.localitiesLayer) return;

    this.localitiesLayer.eachLayer((layer) => {
      const p = layer.feature.properties || {};
      let isDimmed = false;

      if (this.currentFilter === 'distrito1') {
        isDimmed = p.distritoId !== 'distrito1';
      } else if (this.currentFilter === 'distrito2') {
        isDimmed = p.distritoId !== 'distrito2';
      } else if (this.currentFilter.startsWith('comp_')) {
        const compNum = parseInt(this.currentFilter.replace('comp_', ''), 10);
        isDimmed = p.companiaNum !== compNum;
      }

      layer.setStyle({
        fillColor: p.color || '#3b82f6',
        fillOpacity: isDimmed ? 0.08 : 0.35,
        color: isDimmed ? 'rgba(255,255,255,0.2)' : '#ffffff',
        weight: isDimmed ? 1 : 1.8,
        opacity: isDimmed ? 0.3 : 0.9
      });
    });
  }

  applyFilters() {
    if (!this.stationsLayerGroup) return;

    let visibleCount = 0;
    const bounds = L.latLngBounds([]);

    // 1. Filter Station Markers
    this.markersMap.forEach((marker) => {
      const st = marker.stationData;
      let matchesFilter = true;

      if (this.currentFilter === 'distrito1') {
        matchesFilter = (st.district && st.district.includes('Distrito 1')) || (st.companyNum === 1 || st.companyNum === 2);
      } else if (this.currentFilter === 'distrito2') {
        matchesFilter = (st.district && st.district.includes('Distrito 2')) || (st.companyNum >= 3);
      } else if (this.currentFilter.startsWith('comp_')) {
        const compNum = parseInt(this.currentFilter.replace('comp_', ''), 10);
        matchesFilter = st.companyNum === compNum;
      }

      let matchesSearch = true;
      if (this.searchQuery) {
        const text = `${st.id} ${st.name} ${st.subtitle || ''} ${st.address} ${st.locality} ${st.neighborhood || ''}`.toLowerCase();
        matchesSearch = text.includes(this.searchQuery);
      }

      if (matchesFilter && matchesSearch) {
        if (!this.stationsLayerGroup.hasLayer(marker)) {
          this.stationsLayerGroup.addLayer(marker);
        }
        bounds.extend(marker.getLatLng());
        visibleCount++;
      } else {
        if (this.stationsLayerGroup.hasLayer(marker)) {
          this.stationsLayerGroup.removeLayer(marker);
        }
      }
    });

    // 2. Synchronize Localities Polygons with the filter
    this.updateLayerStyles();

    // Update Counter Element
    const counterEl = document.getElementById('gis-visible-counter');
    if (counterEl) {
      if (visibleCount === 1) {
        counterEl.textContent = '1 Estación activa';
      } else if (visibleCount === 0) {
        counterEl.textContent = '0 Estaciones (sin coincidencias)';
      } else {
        counterEl.textContent = `${visibleCount} Estaciones visibles`;
      }
    }

    if ((this.currentFilter !== 'all' || this.searchQuery) && visibleCount > 0 && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    } else if (this.currentFilter === 'all' && !this.searchQuery) {
      this.resetView();
    }
  }

  switchBasemap(type) {
    Object.keys(this.baseLayers).forEach(k => {
      this.map.removeLayer(this.baseLayers[k]);
    });
    if (this.baseLayers[type]) {
      this.baseLayers[type].addTo(this.map);
    }
  }

  zoomToStation(stationId) {
    const marker = this.markersMap.get(stationId);
    if (marker) {
      this.map.invalidateSize();
      this.map.setView(marker.getLatLng(), 15, { animate: true });
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }

  resetView() {
    this.map.invalidateSize();
    this.map.fitBounds(this.bogotaBounds, { padding: [25, 25], animate: true });
  }
}

window.BomberosMapViewer = BomberosMapViewer;
