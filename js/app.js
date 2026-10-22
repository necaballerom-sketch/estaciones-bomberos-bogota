/**
 * ============================================================================
 * CUERPO OFICIAL BOMBEROS DE BOGOTÁ - APLICATIVO INTERACTIVO
 * Controlador Principal de Presentación, Vistas de Estaciones B-1 a B-19,
 * Comando Central, Transiciones, Audio FX y Navegación.
 * ============================================================================
 */

class BomberosApp {
  constructor() {
    this.currentSlideIndex = 0;
    this.totalSlides = 0;
    this.slides = [];
    this.gisViewer = null;
    
    // Autoplay state
    this.isAutoplay = false;
    this.autoplayInterval = null;
    this.autoplayDuration = 7000; // 7 seconds per slide
    this.autoplayProgress = 0;
    this.autoplayProgressTimer = null;

    // Sound FX state (persisted in localStorage)
    let savedSound = null;
    try {
      savedSound = localStorage.getItem('bomberos_sound_enabled');
    } catch (e) {}
    this.soundEnabled = savedSound !== null ? savedSound === 'true' : true;
    this.audioCtx = null;

    // Lightbox gallery state
    this.lightboxGallery = [];
    this.currentLightboxIndex = 0;
    this.isLightboxOpen = false;

    this.init();
  }

  init() {
    this.setupAudio();
    this.setupLightboxGallery();
    this.renderSlides();
    this.renderScrubber();
    this.renderGridModal();
    this.bindEvents();
    this.syncSoundBtn();
    
    // Show initial slide (Cover)
    this.goToSlide(0, false);
  }

  setupLightboxGallery() {
    if (typeof STATIONS_DATA === 'undefined') return;
    this.lightboxGallery = STATIONS_DATA.map(st => ({
      src: st.photo,
      title: `${st.id}: ${st.name}`,
      subtitle: `${st.address} • ${st.localityName} (${st.company})`,
      stationId: st.id
    }));
  }

  syncSoundBtn() {
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
      btn.classList.toggle('muted', !this.soundEnabled);
      btn.title = this.soundEnabled ? 'Silenciar Efectos de Audio (S)' : 'Activar Efectos de Audio (S)';
    }
  }

  /* --------------------------------------------------------------------------
     AUDIO EFFECTS (Web Audio API Synthesizer - 100% Offline)
     -------------------------------------------------------------------------- */
  setupAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio not supported");
    }
  }

  playSound(type = 'click') {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'slide') {
      // Sleek tech swoosh
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'click') {
      // Subtle tactile click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'alert') {
      // Warning / highlight chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem('bomberos_sound_enabled', this.soundEnabled ? 'true' : 'false');
    } catch (e) {}
    this.syncSoundBtn();
    if (this.soundEnabled) this.playSound('click');
  }

  /* --------------------------------------------------------------------------
     SLIDES BUILDER
     -------------------------------------------------------------------------- */
  renderSlides() {
    const viewport = document.getElementById('presentation-viewport');
    if (!viewport) return;
    viewport.innerHTML = '';

    // Slide 0: Cover / Portada
    const coverSlide = this.createCoverSlide();
    viewport.appendChild(coverSlide);

    // Station Slides: B-1 to B-19 (with CO right after B-4)
    STATIONS_DATA.forEach((station, idx) => {
      const stationSlide = this.createStationSlide(station, idx + 1);
      viewport.appendChild(stationSlide);
    });

    // Slide: Operational Distribution View
    const distSlide = this.createDistributionSlide(STATIONS_DATA.length + 1);
    viewport.appendChild(distSlide);

    // Slide: GIS Interactive Viewer
    const gisSlide = this.createGisSlide(STATIONS_DATA.length + 2);
    viewport.appendChild(gisSlide);

    this.slides = Array.from(viewport.querySelectorAll('.slide-view'));
    this.totalSlides = this.slides.length;
  }

  createCoverSlide() {
    const div = document.createElement('div');
    div.className = 'slide-view';
    div.id = 'slide-0';
    div.dataset.index = 0;
    div.dataset.title = 'Inicio / Portada';

    div.innerHTML = `
      <div class="cover-hero-container">
        <div class="cover-logo-large">
          <img src="FOTOS/logo_bogota.png" alt="Alcaldía Mayor de Bogotá" class="cover-logo-img">
        </div>
        
        <div class="cover-eyebrow">Alcaldía Mayor de Bogotá &bull; Secretaría Distrital de Seguridad</div>
        <h1 class="cover-title">Cuerpo Oficial de <span>Bomberos Bogotá</span></h1>
        <p class="cover-subtitle">
          Sistema Integrado de Estaciones, Despliegue Operativo y Caracterización Predial.
          Vistas técnicas y operativas de las Estaciones <b>B-1 a B-19</b>, <b>Edificio de Comando Central</b> y <b>Visor Geográfico Distrital</b>.
        </p>

        <div class="cover-stats-row">
          <div class="cover-stat-card">
            <div class="cover-stat-number" style="color: #ef4444;">19</div>
            <div class="cover-stat-label">Estaciones Activas</div>
          </div>
          <div class="cover-stat-card">
            <div class="cover-stat-number" style="color: #f59e0b;">5</div>
            <div class="cover-stat-label">Compañías Operativas</div>
          </div>
          <div class="cover-stat-card">
            <div class="cover-stat-number" style="color: #0284c7;">2</div>
            <div class="cover-stat-label">Distritos (Norte / Sur)</div>
          </div>
          <div class="cover-stat-card">
            <div class="cover-stat-number" style="color: #10b981;">100%</div>
            <div class="cover-stat-label">Cobertura Distrital</div>
          </div>
        </div>

        <div class="cover-cta-row">
          <button class="btn-primary-hero" onclick="window.appPresentation.nextSlide()">
            <span>Iniciar Recorrido Operativo</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/>
            </svg>
          </button>
          <button class="btn-secondary-hero" onclick="window.appPresentation.goToSlide(window.appPresentation.totalSlides - 1)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
            </svg>
            <span>Ver Visor GIS Interactivo</span>
          </button>
        </div>
      </div>
    `;

    return div;
  }

  createStationSlide(st, slideIdx) {
    const div = document.createElement('div');
    div.className = 'slide-view';
    div.id = `slide-${slideIdx}`;
    div.dataset.index = slideIdx;
    div.dataset.stationId = st.id;
    div.dataset.title = `${st.id} ${st.name}`;
    div.style.setProperty('--comp-color', st.companyColor || '#ef4444');

    const isB7 = st.id === 'B-7';
    const isB13 = st.id === 'B-13';
    const isCO = st.id === 'CO';

    div.innerHTML = `
      <div class="station-slide-container">
        <!-- Top Banner -->
        <div class="station-header-bar">
          <div class="station-title-block">
            <div class="station-code-badge ${isCO ? 'special-co' : ''}">
              ${isCO ? 'CO' : st.id}
            </div>
            <div class="station-name-text">
              <div class="station-main-name">
                ${st.name}
                ${isCO ? '<span style="font-size: 11px; background: #e11d48; color: #fff; padding: 2px 8px; border-radius: 4px;">SEDE CENTRAL</span>' : ''}
              </div>
              <div class="station-subtitle-honor">${st.subtitle || ''}</div>
            </div>
          </div>

          <div class="station-header-pills">
            <div class="pill-company" style="--comp-color: ${st.companyColor};">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#fff;"></span>
              ${st.company} &bull; ${st.companyLeader}
            </div>
            <div class="pill-district">${st.district}</div>
          </div>
        </div>

        <!-- Body Grid -->
        <div class="station-body-grid">
          <!-- Left: Photo Column -->
          <div class="station-photo-card">
            <!-- Top Controls Bar -->
            <div class="photo-card-top-bar">
              <div class="photo-mode-switcher">
                <button id="btn-mode-photo-${st.id}" class="photo-mode-btn active" onclick="window.appPresentation.setPhotoViewMode('${st.id}', 'photo')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <span>Fotografía HD</span>
                </button>
                <button id="btn-mode-street-${st.id}" class="photo-mode-btn" onclick="window.appPresentation.setPhotoViewMode('${st.id}', 'street')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  <span>Google Street View 360°</span>
                </button>
              </div>

              <div class="photo-top-actions">
                <span class="photo-locality-tag">${st.locality}</span>
                <button id="btn-photo-zoom-${st.id}" class="btn-zoom-photo" title="Ampliar Fotografía HD" onclick="window.appPresentation.openLightbox(document.getElementById('photo-img-${st.id}').src, '${st.id}: ${st.name}', '${st.address} &bull; ${st.localityName} (${st.company})')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 7H9v2H7v1h2v2h1v-2h2V9h-2z"/>
                  </svg>
                </button>
                <a id="btn-street-external-${st.id}" class="btn-street-ext" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${st.lat},${st.lon}" target="_blank" rel="noopener noreferrer" title="Abrir 360° en Google Maps (Nueva Ventana)" style="display: none;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div class="photo-media-container">
              <!-- Ambient Frosted Blurred Layer -->
              <img 
                id="photo-bg-${st.id}" 
                class="photo-ambient-backdrop" 
                src="${encodeURI(st.photo)}" 
                alt="" 
                aria-hidden="true" 
              >

              <!-- Foreground Sharp Photo -->
              <img 
                id="photo-img-${st.id}" 
                class="station-img-element photo-fg-image" 
                src="${encodeURI(st.photo)}" 
                alt="${st.name}" 
                onclick="window.appPresentation.openLightbox(this.src, '${st.id}: ${st.name}', '${st.address} &bull; ${st.localityName} (${st.company})')" 
                title="Haga clic para ampliar fotografía"
              >

              <!-- Google Street View 360° Interactive Container -->
              <div id="street-container-${st.id}" class="photo-streetview-wrap" style="display: none;">
                <iframe 
                  id="street-iframe-${st.id}" 
                  class="photo-streetview-iframe" 
                  data-lat="${st.lat}" 
                  data-lon="${st.lon}" 
                  data-src="https://maps.google.com/maps?q=&layer=c&cbll=${st.lat},${st.lon}&cbp=11,0,0,0,0&output=svembed" 
                  allowfullscreen
                ></iframe>
                <div class="streetview-live-pill">
                  <span class="live-dot"></span>
                  <span>Google Street View 360° &bull; Arrastre para girar</span>
                </div>
              </div>

              ${isB7 ? `
                <!-- Dual Switcher for B-7 Ferias -->
                <div class="dual-photo-selector">
                  <button id="b7-btn-antigua" class="dual-tab-btn active" onclick="window.appPresentation.switchB7Photo('antigua')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                    <span>Predio Antiguo / Proyecto</span>
                  </button>
                  <button id="b7-btn-actual" class="dual-tab-btn" onclick="window.appPresentation.switchB7Photo('actual')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    <span>Sede Actual Arrendada</span>
                  </button>
                </div>
              ` : ''}
            </div>

            <div class="photo-caption-bar">
              <span id="photo-caption-${st.id}" class="photo-caption-text">
                ${isB7 ? 'Predio Propio Histórico (KR 69J # 72-61) destinado a demolición y nueva construcción.' : (st.description || st.name)}
              </span>
            </div>

            ${st.specialNotice ? `
              <div class="special-alert-banner ${st.specialNotice.type === 'dual_predio' ? 'alert-dual' : st.specialNotice.type === 'reconstruction' ? 'alert-reconstruction' : st.specialNotice.type === 'hq' ? 'alert-hq' : st.specialNotice.type === 'comando_link' ? 'alert-hq' : 'alert-new'}">
                <div class="alert-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
                <div class="alert-content-wrap" style="flex:1;">
                  <strong>${st.specialNotice.title}</strong>
                  <div>${st.specialNotice.text.replace(/\n/g, '<br/>')}</div>
                  ${isCO ? `
                    <div style="margin-top: 8px; display: flex; gap: 8px;">
                      <button class="badge-station-tag" onclick="window.appPresentation.goToStation('B-4')" style="background: rgba(255,255,255,0.15); color: #fff;">
                        &larr; Volver a B-4 Puente Aranda
                      </button>
                      <button class="badge-station-tag" onclick="window.appPresentation.goToStation('B-5')" style="background: #ef4444; color: #fff;">
                        Continuar a B-5 Kennedy &rarr;
                      </button>
                    </div>
                  ` : ''}
                  ${st.id === 'B-4' ? `
                    <div style="margin-top: 8px;">
                      <button class="badge-station-tag" onclick="window.appPresentation.goToStation('CO')" style="background: #e11d48; color: #fff; font-weight: 700; padding: 5px 12px;">
                        Ver Ficha del Edificio de Comando Central (CO) &rarr;
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right: Detailed Information Column -->
          <div class="station-data-column">
            <!-- Ficha Operativa -->
            <div class="data-section-card">
              <div class="data-section-title">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <span>Ficha Operativa y Jurisdicción</span>
              </div>
              <div class="attr-grid">
                <div class="attr-item full-width">
                  <span class="attr-label">Dirección Operativa</span>
                  <span id="data-address-${st.id}" class="attr-value highlight-address">${st.address}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Localidad</span>
                  <span class="attr-value">${st.locality}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Barrio</span>
                  <span class="attr-value">${st.neighborhood || 'Sector de Cobertura'}</span>
                </div>
                <div class="attr-item full-width">
                  <span class="attr-label">UPZ / UPL</span>
                  <span class="attr-value">${st.upz || 'N/A'} &bull; ${st.upl || 'N/A'}</span>
                </div>
              </div>
            </div>

            <!-- Ficha Catastral y Predial (del Excel) -->
            <div class="data-section-card">
              <div class="data-section-title" style="color: #38bdf8;">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                <span>Información Catastral y Predial (Base Oficial)</span>
              </div>
              <div class="attr-grid">
                <div class="attr-item">
                  <span class="attr-label">Código CHIP</span>
                  <span class="attr-value" style="font-family: monospace;">${st.chip || 'N/A'}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Código RUPI</span>
                  <span class="attr-value" style="font-family: monospace;">${st.rupi || 'N/A'}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Folio Matrícula Inmobiliaria (FMI)</span>
                  <span class="attr-value" style="font-family: monospace;">${st.fmi || 'N/A'}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Titular / Propietario</span>
                  <span class="attr-value">${st.owner || 'Distrito Capital'}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Área del Terreno (Predio)</span>
                  <span class="attr-value highlight-area">${st.areaLot || 'N/A'}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">Área Construida</span>
                  <span class="attr-value highlight-area">${st.areaBuilt || 'N/A'}</span>
                </div>
                <div class="attr-item full-width">
                  <span class="attr-label">Acto Administrativo / Entrega</span>
                  <span class="attr-value">${st.docType || 'Acta'}: ${st.docNumber || 'S/N'} (${st.docDate || 'Registrado'})</span>
                </div>
              </div>
            </div>

            <!-- Barra de Localización Geográfica y Enlace Directo al Mapa GIS -->
            <div class="station-location-bar">
              <div class="station-coords-pill">
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <span>GPS (WGS84): <b>${st.lat.toFixed(5)}, ${st.lon.toFixed(5)}</b></span>
              </div>
              <button class="btn-goto-gis" onclick="window.appPresentation.viewStationOnMap('${st.id}')" title="Localizar esta estación en el Visor Geográfico Distrital">
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                <span>Ver en Visor Geográfico &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    return div;
  }

  createDistributionSlide(slideIdx) {
    const div = document.createElement('div');
    div.className = 'slide-view';
    div.id = `slide-${slideIdx}`;
    div.dataset.index = slideIdx;
    div.dataset.title = 'Distribución Operativa de Estaciones';

    div.innerHTML = `
      <div class="station-header-bar" style="margin-bottom: 14px;">
        <div class="station-title-block">
          <div class="station-code-badge" style="background: linear-gradient(135deg, #0284c7, #8b5cf6);">
            DIST
          </div>
          <div class="station-name-text">
            <div class="station-main-name">DISTRIBUCIÓN OPERATIVA DE ESTACIONES DE BOMBEROS</div>
            <div class="station-subtitle-honor">Organización Operacional por Localidades, Compañías y Distritos</div>
          </div>
        </div>
        <div class="station-header-pills">
          <button class="btn-header" onclick="window.appPresentation.openLightbox('FOTOS/DISTRIBUCION OPERATIVA DE ESTACIONES DE BOMBEROS.jpeg', 'Mapa Oficial de Distribución Operativa')">
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/></svg>
            <span>Ver Imagen en Pantalla Completa</span>
          </button>
        </div>
      </div>

      <div class="distribution-slide-container">
        <!-- Official Distribution Image -->
        <div class="distribution-image-card">
          <div class="distribution-img-wrap" onclick="window.appPresentation.openLightbox('FOTOS/DISTRIBUCION OPERATIVA DE ESTACIONES DE BOMBEROS.jpeg', 'Distribución Operativa de Estaciones por Localidad')">
            <img src="FOTOS/DISTRIBUCION%20OPERATIVA%20DE%20ESTACIONES%20DE%20BOMBEROS.jpeg" alt="Distribución Operativa Bomberos Bogotá">
          </div>
          <div class="photo-caption-bar">
            <span class="photo-caption-text">
              Haga clic sobre el mapa esquemático para ampliar y explorar en alta definición la distribución territorial oficial.
            </span>
          </div>
        </div>

        <!-- Companies & Leaders Breakdown -->
        <div class="distribution-info-column">
          <!-- Distrito 1 -->
          <div style="font-size: 13px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px;">
            DISTRITO 1 - NORTE
          </div>

          <div class="company-card" style="--comp-border: var(--comp-1);">
            <div class="company-header-row">
              <div class="company-title">Compañía 1</div>
              <div class="company-leader-name">Teniente Fabio Sastoque</div>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              <b>Jurisdicción:</b> Usaquén, Chapinero, Suba (Oriental).
            </div>
            <div class="company-stations-pills">
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-1')">B-1 Chapinero</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-13')">B-13 Caobos Salazar</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-14')">B-14 Bicentenario</span>
            </div>
          </div>

          <div class="company-card" style="--comp-border: var(--comp-2);">
            <div class="company-header-row">
              <div class="company-title">Compañía 2</div>
              <div class="company-leader-name">Capitán Ciprián Bohórquez</div>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              <b>Jurisdicción:</b> Suba, Engativá, Fontibón, Barrios Unidos.
            </div>
            <div class="company-stations-pills">
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-6')">B-6 Fontibón</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-7')">B-7 Ferias</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-12')">B-12 Suba</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-15')">B-15 Garcés Navas</span>
            </div>
          </div>

          <!-- Distrito 2 -->
          <div style="font-size: 13px; font-weight: 800; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 8px;">
            DISTRITO 2 - SUR
          </div>

          <div class="company-card" style="--comp-border: var(--comp-3);">
            <div class="company-header-row">
              <div class="company-title">Compañía 3</div>
              <div class="company-leader-name">Capitán Rodolfo Barrera</div>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              <b>Jurisdicción:</b> Santa Fe, Candelaria, Los Mártires, Puente Aranda, Teusaquillo, Kennedy.
            </div>
            <div class="company-stations-pills">
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-2')">B-2 Central</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-4')">B-4 Puente Aranda</span>
              <span class="badge-station-tag" style="background: rgba(225,29,72,0.25); border-color:#e11d48;" onclick="window.appPresentation.goToStation('CO')">CO Comando Central</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-5')">B-5 Kennedy</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-17')">B-17 Centro Histórico</span>
            </div>
          </div>

          <div class="company-card" style="--comp-border: var(--comp-4);">
            <div class="company-header-row">
              <div class="company-title">Compañía 4</div>
              <div class="company-leader-name">Capitán Jairo Bolaños</div>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              <b>Jurisdicción:</b> Antonio Nariño, Rafael Uribe Uribe, San Cristóbal, Usme.
            </div>
            <div class="company-stations-pills">
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-3')">B-3 Restrepo</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-9')">B-9 Bellavista</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-10')">B-10 Marichuela</span>
            </div>
          </div>

          <div class="company-card" style="--comp-border: var(--comp-5);">
            <div class="company-header-row">
              <div class="company-title">Compañía 5</div>
              <div class="company-leader-name">Capitán Edinson Panqueva</div>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              <b>Jurisdicción:</b> Bosa, Tunjuelito, Ciudad Bolívar, Sumapaz.
            </div>
            <div class="company-stations-pills">
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-8')">B-8 Bosa</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-11')">B-11 Candelaria</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-16')">B-16 Venecia</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-18')">B-18 Casa de Teja</span>
              <span class="badge-station-tag" onclick="window.appPresentation.goToStation('B-19')">B-19 La Cabaña</span>
            </div>
          </div>
        </div>
      </div>
    `;

    return div;
  }

  createGisSlide(slideIdx) {
    const div = document.createElement('div');
    div.className = 'slide-view';
    div.id = `slide-${slideIdx}`;
    div.dataset.index = slideIdx;
    div.dataset.title = 'Visor Geográfico Interactivo (GIS)';

    div.innerHTML = `
      <div class="gis-viewer-container">
        <!-- Floating Toolbar -->
        <div class="gis-floating-toolbar">
          <div class="gis-filters-group">
            <span style="font-size: 11px; font-weight: 800; color: var(--emergency-gold); text-transform: uppercase; margin-right: 6px;">Filtros:</span>
            <button class="filter-btn active" data-filter="all" onclick="window.appPresentation.filterMap('all', this)">
              Todas (19 + CO)
            </button>
            <button class="filter-btn" data-filter="distrito1" style="--filter-color: #0284c7;" onclick="window.appPresentation.filterMap('distrito1', this)">
              Distrito 1 - Norte
            </button>
            <button class="filter-btn" data-filter="distrito2" style="--filter-color: #8b5cf6;" onclick="window.appPresentation.filterMap('distrito2', this)">
              Distrito 2 - Sur
            </button>
            <button class="filter-btn" data-filter="comp_1" style="--filter-color: #0284c7;" onclick="window.appPresentation.filterMap('comp_1', this)">
              Comp. 1
            </button>
            <button class="filter-btn" data-filter="comp_2" style="--filter-color: #ea580c;" onclick="window.appPresentation.filterMap('comp_2', this)">
              Comp. 2
            </button>
            <button class="filter-btn" data-filter="comp_3" style="--filter-color: #10b981;" onclick="window.appPresentation.filterMap('comp_3', this)">
              Comp. 3
            </button>
            <button class="filter-btn" data-filter="comp_4" style="--filter-color: #eab308;" onclick="window.appPresentation.filterMap('comp_4', this)">
              Comp. 4
            </button>
            <button class="filter-btn" data-filter="comp_5" style="--filter-color: #8b5cf6;" onclick="window.appPresentation.filterMap('comp_5', this)">
              Comp. 5
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="gis-search-box">
              <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input type="text" id="gis-search-input" placeholder="Buscar estación..." oninput="window.appPresentation.searchMap(this.value)">
              <button id="gis-search-clear" class="btn-clear-search" onclick="window.appPresentation.clearGisSearch()" title="Limpiar búsqueda">&times;</button>
            </div>

            <!-- Basemap selector (100% Free Open Basemaps - Zero API Key) -->
            <select id="gis-basemap-select" onchange="window.appPresentation.switchBasemap(this.value)" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-subtle); color: #fff; padding: 5px 8px; border-radius: 8px; font-size: 11px; outline: none; cursor: pointer;">
              <option value="dark">Mapa Oscuro (Esri Dark Canvas)</option>
              <option value="streets">Calles (OpenStreetMap)</option>
              <option value="satellite">Satélite (Esri World Imagery)</option>
            </select>

            <button class="btn-header" onclick="window.appPresentation.resetMapView()" title="Centrar Bogotá">
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
            </button>
          </div>
        </div>

        <!-- Canvas -->
        <div id="gis-map-canvas" class="gis-map-canvas"></div>

        <!-- Legend Dock -->
        <div class="gis-legend-dock">
          <div class="gis-legend-title">Áreas por Compañía</div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #0284c7;"></span><span>Compañía 1 (Tte. Sastoque)</span></div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #ea580c;"></span><span>Compañía 2 (Cap. Bohórquez)</span></div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #10b981;"></span><span>Compañía 3 (Cap. Barrera)</span></div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #eab308;"></span><span>Compañía 4 (Cap. Bolaños)</span></div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #8b5cf6;"></span><span>Compañía 5 (Cap. Panqueva)</span></div>
          <div class="legend-item-row"><span class="legend-color-box" style="background: #e11d48;"></span><span>Edificio Comando Central (CO)</span></div>
          <div id="gis-visible-counter" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); color: var(--emergency-gold); font-weight: 700;">
            19 Estaciones + CO
          </div>
        </div>
      </div>
    `;

    return div;
  }

  /* --------------------------------------------------------------------------
     SCRUBBER / THUMBNAILS BAR & HOVER TOOLTIP
     -------------------------------------------------------------------------- */
  renderScrubber() {
    const wrapper = document.getElementById('stations-scrubber');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    // Portada Button
    const homeBtn = document.createElement('button');
    homeBtn.className = 'scrubber-item';
    homeBtn.dataset.index = 0;
    homeBtn.innerHTML = `<span>Inicio</span>`;
    homeBtn.onclick = () => this.goToSlide(0);
    this.setupScrubberTooltip(homeBtn, 0);
    wrapper.appendChild(homeBtn);

    // Stations buttons B-1 to B-19 & CO
    STATIONS_DATA.forEach((st, idx) => {
      const btn = document.createElement('button');
      btn.className = 'scrubber-item';
      btn.dataset.index = idx + 1;
      btn.dataset.stationId = st.id;
      btn.innerHTML = `
        <span class="scrubber-dot" style="background-color: ${st.companyColor || '#ef4444'};"></span>
        <span>${st.id}</span>
      `;
      btn.onclick = () => this.goToSlide(idx + 1);
      this.setupScrubberTooltip(btn, idx + 1);
      wrapper.appendChild(btn);
    });

    // Distribution Slide Button
    const distBtn = document.createElement('button');
    distBtn.className = 'scrubber-item';
    distBtn.dataset.index = STATIONS_DATA.length + 1;
    distBtn.innerHTML = `<span>Distribución</span>`;
    distBtn.onclick = () => this.goToSlide(STATIONS_DATA.length + 1);
    this.setupScrubberTooltip(distBtn, STATIONS_DATA.length + 1);
    wrapper.appendChild(distBtn);

    // GIS Viewer Button
    const gisBtn = document.createElement('button');
    gisBtn.className = 'scrubber-item';
    gisBtn.dataset.index = STATIONS_DATA.length + 2;
    gisBtn.innerHTML = `<span>Visor GIS</span>`;
    gisBtn.onclick = () => this.goToSlide(STATIONS_DATA.length + 2);
    this.setupScrubberTooltip(gisBtn, STATIONS_DATA.length + 2);
    wrapper.appendChild(gisBtn);
  }

  setupScrubberTooltip(btn, idx) {
    const tooltip = document.getElementById('scrubber-floating-tooltip');
    if (!tooltip) return;

    btn.addEventListener('mouseenter', () => {
      let thumb = '', title = '', comp = '';
      if (idx === 0) {
        thumb = 'FOTOS/logo_bogota.png';
        title = 'Inicio / Portada';
        comp = 'Bomberos Bogotá &bull; Sede Distrital';
      } else if (idx <= STATIONS_DATA.length) {
        const st = STATIONS_DATA[idx - 1];
        thumb = encodeURI(st.photo);
        title = `${st.id} - ${st.name}`;
        comp = `<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${st.companyColor || '#ef4444'};"></span> ${st.company} &bull; ${st.localityName}`;
      } else if (idx === STATIONS_DATA.length + 1) {
        thumb = 'FOTOS/DISTRIBUCION OPERATIVA DE ESTACIONES DE BOMBEROS.jpeg';
        title = 'Distribución Operativa';
        comp = 'Mapa Oficial por Compañías';
      } else {
        title = 'Visor Geográfico GIS';
        comp = '19 Estaciones + CO en vivo';
      }

      tooltip.innerHTML = `
        ${thumb ? `<img class="scrubber-preview-thumb" src="${thumb}" alt="${title}" style="${idx === 0 ? 'object-fit:contain; padding:6px; background:rgba(255,255,255,0.06);' : ''}">` : '<div style="height:70px; background:#0f172a; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:26px;">🗺️</div>'}
        <div class="scrubber-preview-title">${title}</div>
        <div class="scrubber-preview-comp">${comp}</div>
      `;

      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      tooltip.style.left = `${centerX}px`;
      tooltip.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      tooltip.classList.add('visible');
    });

    btn.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  }

  /* --------------------------------------------------------------------------
     MODALS: GRID VIEW & LIGHTBOX
     -------------------------------------------------------------------------- */
  renderGridModal() {
    const gridContainer = document.getElementById('grid-modal-stations');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    STATIONS_DATA.forEach((st, idx) => {
      const card = document.createElement('div');
      card.className = 'grid-station-card';
      card.style.setProperty('--card-color', st.companyColor || '#ef4444');
      card.innerHTML = `
        <img class="grid-station-thumb" src="${encodeURI(st.photo)}" alt="${st.name}">
        <div class="grid-station-info">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800; color: ${st.companyColor || '#ef4444'};">${st.id}</span>
            <span style="font-size: 10px; color: var(--text-muted);">${st.localityName}</span>
          </div>
          <div class="grid-station-title">${st.name}</div>
          <div class="grid-station-comp">${st.company} &bull; ${st.companyLeader}</div>
        </div>
      `;
      card.onclick = () => {
        this.closeModals();
        this.goToSlide(idx + 1);
      };
      gridContainer.appendChild(card);
    });
  }

  openLightbox(imgSrc, title, subtitle) {
    this.playSound('click');
    const overlay = document.getElementById('lightbox-modal');
    if (!overlay) return;

    this.isLightboxOpen = true;

    // Check if imgSrc belongs to a station in our gallery
    let foundIndex = this.lightboxGallery.findIndex(item => {
      if (!item.src || !imgSrc) return false;
      const norm = s => decodeURI(s).replace(/^.*[\\\/]/, '').toLowerCase();
      return norm(item.src) === norm(imgSrc);
    });

    if (foundIndex === -1 && title) {
      foundIndex = this.lightboxGallery.findIndex(item => item.title.includes(title) || title.includes(item.title));
    }

    if (foundIndex !== -1) {
      this.currentLightboxIndex = foundIndex;
    } else {
      this.currentLightboxIndex = -1; // Standalone image (e.g. distribution map)
    }

    this.updateLightboxView(imgSrc, title, subtitle);
    overlay.classList.add('active');
  }

  nextLightbox() {
    if (this.lightboxGallery.length === 0) return;
    this.playSound('click');
    if (this.currentLightboxIndex >= 0) {
      this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.lightboxGallery.length;
    } else {
      this.currentLightboxIndex = 0;
    }
    const item = this.lightboxGallery[this.currentLightboxIndex];
    this.updateLightboxView(item.src, item.title, item.subtitle);
  }

  prevLightbox() {
    if (this.lightboxGallery.length === 0) return;
    this.playSound('click');
    if (this.currentLightboxIndex >= 0) {
      this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.lightboxGallery.length) % this.lightboxGallery.length;
    } else {
      this.currentLightboxIndex = this.lightboxGallery.length - 1;
    }
    const item = this.lightboxGallery[this.currentLightboxIndex];
    this.updateLightboxView(item.src, item.title, item.subtitle);
  }

  updateLightboxView(imgSrc, title, subtitle) {
    const img = document.getElementById('lightbox-image');
    const caption = document.getElementById('lightbox-caption');
    const subcaption = document.getElementById('lightbox-subcaption');
    const counterBadge = document.getElementById('lightbox-counter-badge');

    let currentSrc = imgSrc;
    let currentTitle = title;
    let currentSubtitle = subtitle;

    if (this.currentLightboxIndex >= 0 && this.lightboxGallery[this.currentLightboxIndex]) {
      const item = this.lightboxGallery[this.currentLightboxIndex];
      currentSrc = item.src;
      currentTitle = item.title;
      currentSubtitle = item.subtitle;
      if (counterBadge) {
        const pad = n => n.toString().padStart(2, '0');
        counterBadge.textContent = `Foto ${pad(this.currentLightboxIndex + 1)} / ${pad(this.lightboxGallery.length)}`;
      }
    } else {
      if (counterBadge) {
        counterBadge.textContent = 'Mapa Oficial';
      }
    }

    if (img) {
      img.style.opacity = '0.3';
      img.style.transform = 'scale(0.97)';
      img.src = encodeURI(currentSrc);
      setTimeout(() => {
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      }, 100);
    }
    if (caption) caption.textContent = currentTitle || '';
    if (subcaption) subcaption.textContent = currentSubtitle || '';
  }

  openGridModal() {
    this.playSound('click');
    const overlay = document.getElementById('grid-overview-modal');
    if (overlay) overlay.classList.add('active');
  }

  openInfraModal() {
    this.playSound('click');
    const overlay = document.getElementById('infra-modal');
    if (overlay) overlay.classList.add('active');
  }

  closeModals() {
    this.isLightboxOpen = false;
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  /* --------------------------------------------------------------------------
     PHOTO & GOOGLE STREET VIEW 360° MODE CONTROLLER
     -------------------------------------------------------------------------- */
  setPhotoViewMode(stationId, mode) {
    this.playSound('click');
    const photoBg = document.getElementById(`photo-bg-${stationId}`);
    const photoImg = document.getElementById(`photo-img-${stationId}`);
    const streetWrap = document.getElementById(`street-container-${stationId}`);
    const streetIframe = document.getElementById(`street-iframe-${stationId}`);
    const btnPhoto = document.getElementById(`btn-mode-photo-${stationId}`);
    const btnStreet = document.getElementById(`btn-mode-street-${stationId}`);
    const btnZoom = document.getElementById(`btn-photo-zoom-${stationId}`);
    const btnExt = document.getElementById(`btn-street-external-${stationId}`);

    if (mode === 'street') {
      if (photoBg) photoBg.style.display = 'none';
      if (photoImg) photoImg.style.display = 'none';
      if (streetWrap) streetWrap.style.display = 'flex';
      
      // Lazy load the Street View iframe src if not yet set
      if (streetIframe && (!streetIframe.src || streetIframe.src === '' || streetIframe.src === window.location.href)) {
        streetIframe.src = streetIframe.dataset.src;
      }

      if (btnPhoto) btnPhoto.classList.remove('active');
      if (btnStreet) btnStreet.classList.add('active');
      if (btnZoom) btnZoom.style.display = 'none';
      if (btnExt) btnExt.style.display = 'inline-flex';
    } else {
      if (photoBg) photoBg.style.display = 'block';
      if (photoImg) photoImg.style.display = 'block';
      if (streetWrap) streetWrap.style.display = 'none';

      if (btnPhoto) btnPhoto.classList.add('active');
      if (btnStreet) btnStreet.classList.remove('active');
      if (btnZoom) btnZoom.style.display = 'inline-flex';
      if (btnExt) btnExt.style.display = 'none';
    }
  }

  /* --------------------------------------------------------------------------
     SPECIAL INTERACTIONS (B-7 FERIAS DUAL SWITCHER)
     -------------------------------------------------------------------------- */
  switchB7Photo(type) {
    this.playSound('click');
    const img = document.getElementById('photo-img-B-7');
    const bg = document.getElementById('photo-bg-B-7');
    const caption = document.getElementById('photo-caption-B-7');
    const address = document.getElementById('data-address-B-7');
    const btnAntigua = document.getElementById('b7-btn-antigua');
    const btnActual = document.getElementById('b7-btn-actual');
    const streetIframe = document.getElementById('street-iframe-B-7');
    const btnExt = document.getElementById('btn-street-external-B-7');

    const st = STATIONS_DATA.find(s => s.id === 'B-7');
    const latAntigua = (st && st.latAntigua) || 4.67389;
    const lonAntigua = (st && st.lonAntigua) || -74.08861;
    const latActual = (st && st.latActual) || 4.696661;
    const lonActual = (st && st.lonActual) || -74.095638;

    if (type === 'antigua') {
      const src = encodeURI('FOTOS/B7 ANTIGUA FERIAS.jpg');
      if (img) img.src = src;
      if (bg) bg.src = src;
      if (caption) caption.textContent = 'Predio Histórico Propio (Carrera 69J # 72-61) destinado a demolición total para la construcción de la nueva Estación Ferias.';
      if (address) address.textContent = 'Carrera 69J No. 72 - 61 (Predio Histórico / Futura Nueva Sede)';
      if (btnAntigua) btnAntigua.classList.add('active');
      if (btnActual) btnActual.classList.remove('active');

      const streetSrc = `https://maps.google.com/maps?q=&layer=c&cbll=${latAntigua},${lonAntigua}&cbp=11,0,0,0,0&output=svembed`;
      if (streetIframe) {
        streetIframe.dataset.src = streetSrc;
        if (streetIframe.src && streetIframe.src !== '' && streetIframe.src !== window.location.href) {
          streetIframe.src = streetSrc;
        }
      }
      if (btnExt) {
        btnExt.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latAntigua},${lonAntigua}`;
      }
    } else {
      const src = encodeURI('FOTOS/B7 FERIAS ACTUAL.jpeg');
      if (img) img.src = src;
      if (bg) bg.src = src;
      if (caption) caption.textContent = 'Sede Operativa Actual en Arrendamiento (Calle 77A # 77-36), donde opera el personal activo y las máquinas de Bomberos.';
      if (address) address.textContent = 'Calle 77A No. 77 - 36 (Sede Operativa en Arrendamiento)';
      if (btnAntigua) btnAntigua.classList.remove('active');
      if (btnActual) btnActual.classList.add('active');

      const streetSrc = `https://maps.google.com/maps?q=&layer=c&cbll=${latActual},${lonActual}&cbp=11,0,0,0,0&output=svembed`;
      if (streetIframe) {
        streetIframe.dataset.src = streetSrc;
        if (streetIframe.src && streetIframe.src !== '' && streetIframe.src !== window.location.href) {
          streetIframe.src = streetSrc;
        }
      }
      if (btnExt) {
        btnExt.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latActual},${lonActual}`;
      }
    }
  }

  /* --------------------------------------------------------------------------
     NAVIGATION & TRANSITIONS
     -------------------------------------------------------------------------- */
  goToSlide(index, animate = true) {
    if (index < 0) index = 0;
    if (index >= this.totalSlides) index = this.totalSlides - 1;
    if (index === this.currentSlideIndex && animate) return;

    const previousIndex = this.currentSlideIndex;
    const direction = index > previousIndex ? 'right' : 'left';
    this.currentSlideIndex = index;

    this.playSound('slide');

    // Slide visibility and animations
    this.slides.forEach((slide, idx) => {
      slide.classList.remove('active', 'slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
      if (idx === index) {
        slide.classList.add('active');
        if (animate && idx !== this.totalSlides - 1) {
          slide.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        }
      }
    });

    // Update Header Indicator
    const currentSlide = this.slides[index];
    const headerTitle = document.getElementById('header-slide-title');
    const headerCounter = document.getElementById('header-slide-counter');
    if (headerTitle) {
      headerTitle.textContent = currentSlide.dataset.title || 'Bomberos Bogotá';
    }
    if (headerCounter) {
      const pad = (n) => n.toString().padStart(2, '0');
      headerCounter.textContent = `${pad(index + 1)} / ${pad(this.totalSlides)}`;
    }

    // Update Scrubber
    document.querySelectorAll('.scrubber-item').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.index, 10) === index);
      if (parseInt(btn.dataset.index, 10) === index) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    // Check if current slide is GIS viewer
    if (index === this.totalSlides - 1) {
      this.initGisViewer();
    }

    // Reset Autoplay timer if active
    if (this.isAutoplay) {
      this.resetAutoplayProgress();
    }
  }

  nextSlide() {
    if (this.currentSlideIndex < this.totalSlides - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    } else {
      this.goToSlide(0); // Loop back
    }
  }

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    }
  }

  goToStation(stationId) {
    const targetIdx = STATIONS_DATA.findIndex(s => s.id === stationId);
    if (targetIdx !== -1) {
      this.goToSlide(targetIdx + 1);
    }
  }

  /* --------------------------------------------------------------------------
     NAVEGACIÓN DIRECTA A LA ESTACIÓN EN EL VISOR GEOGRÁFICO DISTRITAL (GIS)
     -------------------------------------------------------------------------- */
  viewStationOnMap(stationId) {
    this.goToSlide(this.totalSlides - 1);
    setTimeout(() => {
      if (this.gisViewer) {
        this.gisViewer.zoomToStation(stationId);
      }
    }, 400);
  }

  /* --------------------------------------------------------------------------
     GIS VIEWER
     -------------------------------------------------------------------------- */
  initGisViewer() {
    if (!this.gisViewer) {
      this.gisViewer = new BomberosMapViewer('gis-map-canvas');
      this.gisViewer.init();
    } else {
      setTimeout(() => {
        this.gisViewer.map.invalidateSize();
      }, 300);
    }
  }

  filterMap(criteria, buttonEl) {
    this.playSound('click');
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
    if (this.gisViewer) {
      this.gisViewer.filterStations(criteria);
    }
  }

  searchMap(query) {
    const clearBtn = document.getElementById('gis-search-clear');
    if (clearBtn) {
      clearBtn.style.display = (query && query.trim().length > 0) ? 'inline-flex' : 'none';
    }
    if (this.gisViewer) {
      this.gisViewer.search(query);
    }
  }

  clearGisSearch() {
    this.playSound('click');
    const input = document.getElementById('gis-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.searchMap('');
  }

  switchBasemap(type) {
    this.playSound('click');
    if (this.gisViewer) {
      this.gisViewer.switchBasemap(type);
    }
  }

  resetMapView() {
    this.playSound('click');
    if (this.gisViewer) {
      this.gisViewer.resetView();
    }
  }

  /* --------------------------------------------------------------------------
     AUTOPLAY PRESENTATION MODE
     -------------------------------------------------------------------------- */
  toggleAutoplay() {
    this.isAutoplay = !this.isAutoplay;
    this.playSound('click');
    const btn = document.getElementById('btn-autoplay-toggle');
    const bar = document.getElementById('autoplay-progress-bar');

    if (this.isAutoplay) {
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        `;
        btn.title = "Pausar Presentación Automática";
      }
      this.startAutoplayTimer();
    } else {
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
        btn.title = "Iniciar Presentación Automática";
      }
      this.stopAutoplayTimer();
      if (bar) bar.style.width = '0%';
    }
  }

  startAutoplayTimer() {
    this.stopAutoplayTimer();
    this.autoplayProgress = 0;
    const intervalStep = 100;
    const increment = (intervalStep / this.autoplayDuration) * 100;
    const bar = document.getElementById('autoplay-progress-bar');

    this.autoplayProgressTimer = setInterval(() => {
      this.autoplayProgress += increment;
      if (bar) bar.style.width = `${Math.min(this.autoplayProgress, 100)}%`;

      if (this.autoplayProgress >= 100) {
        this.nextSlide();
        this.autoplayProgress = 0;
      }
    }, intervalStep);
  }

  resetAutoplayProgress() {
    this.autoplayProgress = 0;
    const bar = document.getElementById('autoplay-progress-bar');
    if (bar) bar.style.width = '0%';
  }

  stopAutoplayTimer() {
    if (this.autoplayProgressTimer) {
      clearInterval(this.autoplayProgressTimer);
      this.autoplayProgressTimer = null;
    }
  }

  /* --------------------------------------------------------------------------
     FULLSCREEN API
     -------------------------------------------------------------------------- */
  toggleFullscreen() {
    this.playSound('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /* --------------------------------------------------------------------------
     EVENT BINDINGS & KEYBOARD SHORTCUTS
     -------------------------------------------------------------------------- */
  bindEvents() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in search input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      // Handle keyboard navigation when Lightbox gallery is active
      if (this.isLightboxOpen) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nextLightbox();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prevLightbox();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeModals();
          return;
        }
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this.nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prevSlide();
          break;
        case 'Home':
        case 'h':
        case 'H':
          this.goToSlide(0);
          break;
        case 'End':
          this.goToSlide(this.totalSlides - 1);
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          break;
        case 'g':
        case 'G':
          this.openGridModal();
          break;
        case 'm':
        case 'M':
          this.goToSlide(this.totalSlides - 1); // GIS Viewer
          break;
        case 'd':
        case 'D':
          this.goToSlide(this.totalSlides - 2); // Distribution Slide
          break;
        case 'p':
        case 'P':
          this.toggleAutoplay();
          break;
        case 's':
        case 'S':
          this.toggleSound();
          break;
        case 'Escape':
          this.closeModals();
          break;
      }
    });

    // Touch swipe navigation for mobile & tablet
    let touchStartX = 0;
    let touchStartY = 0;
    const viewport = document.getElementById('presentation-viewport');
    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        if (e.target.closest('#gis-map-canvas') || e.target.closest('input') || e.target.closest('select')) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        if (e.target.closest('#gis-map-canvas') || e.target.closest('input') || e.target.closest('select')) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
          if (diffX < 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
      }, { passive: true });
    }

    // Touch swipe navigation for Lightbox
    const lightboxModal = document.getElementById('lightbox-modal');
    if (lightboxModal) {
      lightboxModal.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      lightboxModal.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
          if (diffX < 0) {
            this.nextLightbox();
          } else {
            this.prevLightbox();
          }
        }
      }, { passive: true });
    }

    // Close modals on clicking overlay background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModals();
        }
      });
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.appPresentation = new BomberosApp();
});
