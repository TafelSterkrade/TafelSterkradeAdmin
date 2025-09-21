// ===========================
// EventListener.js (fix 2025-09-11)
// ===========================

// Globale Variablen
let initialAccordionModules = [];
let aktiveFunktionsZelle = null;
let aktiverFMCButton = null;

// ----------------------------------
// toggleAccordionModule
// (öffnet/schließt ein Modul und verschiebt es nach oben)
// ----------------------------------
function toggleAccordionModule(clickedModule) {
  if (!clickedModule) return;
  const mainAccordionContainer = document.getElementById("main-accordion");
  if (!mainAccordionContainer) {
    console.error("main-accordion nicht gefunden");
    return;
  }

  const content = clickedModule.querySelector('.module-content');
  const header = clickedModule.querySelector('.module-header');
  if (!content || !header) {
    console.error("module-content oder module-header fehlt für Modul:", clickedModule);
    return;
  }

  const wasOpen = clickedModule.classList.contains('open');

  // Alle anderen offenen Module schließen
  mainAccordionContainer.querySelectorAll('.module.open').forEach(moduleItem => {
    if (moduleItem !== clickedModule) {
      moduleItem.classList.remove('open');
      const itemContent = moduleItem.querySelector('.module-content');
      if (itemContent) itemContent.style.display = 'none';

      // Optional: handle close for mitarbeiter modul (falls Funktion existiert)
      if (moduleItem.id === 'mitarbeiter-anzeige-bereich' && typeof handleMitarbeiterAccordionClose === 'function') {
        try { handleMitarbeiterAccordionClose(); } catch (e) { console.warn(e); }
      }

      resetAccordionModulePosition(moduleItem);
    }
  });

  // Toggle für das geklickte Modul
  if (wasOpen) {
    clickedModule.classList.remove('open');
    content.style.display = 'none';
    if (clickedModule.id === 'mitarbeiter-anzeige-bereich' && typeof handleMitarbeiterAccordionClose === 'function') {
      try { handleMitarbeiterAccordionClose(); } catch (e) { console.warn(e); }
    }
    resetAccordionModulePosition(clickedModule);
  } else {
    clickedModule.classList.add('open');
    content.style.display = 'block';
    if (clickedModule.id === 'mitarbeiter-anzeige-bereich' && typeof handleMitarbeiterAccordionOpen === 'function') {
      try { handleMitarbeiterAccordionOpen(); } catch (e) { console.warn(e); }
    }
    // nach oben verschieben
    try { mainAccordionContainer.prepend(clickedModule); } catch (e) { console.warn(e); }
  }
}

// ----------------------------------
// resetAccordionModulePosition
// versucht ein Modul an seine ursprüngliche Position zurückzusetzen
// ----------------------------------
function resetAccordionModulePosition(moduleToReset) {
  if (!moduleToReset) return;
  const mainAccordionContainer = document.getElementById("main-accordion");
  if (!mainAccordionContainer) return;

  // Versuche originalIndex zu lesen (falls vorhanden)
  let originalIndex = NaN;
  if (moduleToReset.dataset && moduleToReset.dataset.originalIndex !== undefined) {
    originalIndex = parseInt(moduleToReset.dataset.originalIndex);
  }

  // Wenn kein valid originalIndex, versuche anhand initialAccordionModules den Index zu finden
  if (isNaN(originalIndex)) {
    for (let i = 0; i < initialAccordionModules.length; i++) {
      if (initialAccordionModules[i] === moduleToReset || (initialAccordionModules[i] && initialAccordionModules[i].id === moduleToReset.id)) {
        originalIndex = i;
        break;
      }
    }
  }

  // Wenn wir immer noch keinen Index haben -> ans Ende anhängen
  if (isNaN(originalIndex)) {
    if (moduleToReset.parentNode !== mainAccordionContainer) mainAccordionContainer.appendChild(moduleToReset);
    return;
  }

  // Finde Referenzknoten: das Element, das NACH unserem Modul in der originalen Reihenfolge kommt
  let referenceNode = null;
  for (let i = originalIndex + 1; i < initialAccordionModules.length; i++) {
    const cand = initialAccordionModules[i];
    if (cand && mainAccordionContainer.contains(cand)) {
      referenceNode = cand;
      break;
    }
  }

  // Wenn referenceNode null -> hänge ans Ende, sonst insertBefore
  try {
    mainAccordionContainer.insertBefore(moduleToReset, referenceNode);
  } catch (e) {
    console.warn("insertBefore fehlgeschlagen, hänge ans Ende:", e);
    if (moduleToReset.parentNode !== mainAccordionContainer) {
      mainAccordionContainer.appendChild(moduleToReset);
    }
  }
}

// ----------------------------------
// initEventListeners (wird explizit von Script.js aufgerufen)
// ----------------------------------
function initEventListeners() {
  console.log("🎛 initEventListeners()");

  // --- Accordion: Header-Klicks binden ---
  const mainAccordionContainer = document.getElementById("main-accordion");
  if (mainAccordionContainer) {
    // speichere initiale Reihenfolge
    initialAccordionModules = Array.from(mainAccordionContainer.querySelectorAll('.module'));

    // binde Click-Handler an die .module-header innerhalb jedes Moduls
    mainAccordionContainer.querySelectorAll('.module > .module-header').forEach(header => {
      header.addEventListener('click', function () {
        const moduleSection = this.closest('.module');
        toggleAccordionModule(moduleSection);
      });
    });
  } else {
    console.warn("main-accordion nicht vorhanden beim Init der EventListener");
  }

  // --- Formular-Kopf (Mitarbeiter) Sichtbarkeit initial setzen ---
  const formularEingabenEl = document.getElementById("formular-eingaben");
  const saveButton = document.getElementById("btn-speichern");
  const newEmployeeButton = document.getElementById("btn-neuer-mitarbeiter");
  if (formularEingabenEl) {
    if (formularEingabenEl.style.display === "none") {
      if (saveButton) saveButton.style.display = "none";
      if (newEmployeeButton) newEmployeeButton.style.display = "inline-block";
      const anzeigeId = document.getElementById("anzeige-id");
      const anzeigeName = document.getElementById("anzeige-name");
      if (anzeigeId) anzeigeId.textContent = "";
      if (anzeigeName) anzeigeName.textContent = "Keine Auswahl";
      if (typeof leereFormularfelder === 'function') {
        try { leereFormularfelder(); } catch (e) { console.warn(e); }
      }
    } else {
      if (saveButton) saveButton.style.display = "inline-block";
      if (newEmployeeButton) newEmployeeButton.style.display = "none";
    }
  }

  // --- Tagesrapport Auswahl ---
  const tagesrapportTerminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
  const tagesrapportInfo = document.getElementById("TagesrapportInfo");
  if (tagesrapportTerminAuswahl && tagesrapportInfo) {
    tagesrapportTerminAuswahl.addEventListener('change', function () {
      const ausgewaehlterTermin = this.value;
      if (ausgewaehlterTermin && typeof alleAnmeldeInfosCache !== 'undefined' &&
          alleAnmeldeInfosCache[ausgewaehlterTermin] &&
          alleAnmeldeInfosCache[ausgewaehlterTermin].helferAnzahl !== undefined) {
        tagesrapportInfo.textContent = `anwesend: ${alleAnmeldeInfosCache[ausgewaehlterTermin].helferAnzahl} Helfer`;
      } else if (ausgewaehlterTermin) {
        tagesrapportInfo.textContent = `anwesend: - Helfer`;
      } else {
        tagesrapportInfo.textContent = "";
      }
    });
  }

  // --- Filter Checkbox ---
  const filterCheckbox = document.getElementById("filterOhneFunktion");
  if (filterCheckbox && typeof filtereTabelle === 'function') {
    filterCheckbox.addEventListener('change', filtereTabelle);
  }

  // --- EditMode Checkbox (Anmeldung) ---
  const editModeCheckbox = document.getElementById('editModeCheckbox');
  const fmcBereich = document.getElementById('fmcBereich');
  const speichernButton = document.getElementById('speichernButton');
  const zuruecksetzenButton = document.getElementById('zuruecksetzenButton');
  const anmeldeInfoBereich = document.getElementById('anmeldeinfo-bereich');
  const terminAuswahl = document.getElementById('terminAuswahl');
  const terminNavigation = document.getElementById('termin-navigation');
  const filterLabel = document.querySelector('#filter-und-navigation label[for="filterOhneFunktion"]');
  const tabellenBereich = document.getElementById('tabellen-bereich');

  if (editModeCheckbox && fmcBereich && speichernButton && zuruecksetzenButton &&
      anmeldeInfoBereich && terminAuswahl && terminNavigation && filterLabel && tabellenBereich) {

    editModeCheckbox.addEventListener('change', function () {
      const isEditMode = this.checked;
      fmcBereich.style.display = isEditMode ? 'flex' : 'none';
      speichernButton.style.display = isEditMode ? 'inline-block' : 'none';
      zuruecksetzenButton.style.display = isEditMode ? 'inline-block' : 'none';
      anmeldeInfoBereich.style.display = isEditMode ? 'none' : 'block';
      terminAuswahl.style.display = isEditMode ? 'none' : 'block';
      terminNavigation.style.display = isEditMode ? 'none' : 'flex';
      filterLabel.style.display = isEditMode ? 'none' : 'block';

      aktiveFunktionsZelle = null;
      if (aktiverFMCButton) {
        aktiverFMCButton.classList.remove('aktiv');
        aktiverFMCButton = null;
      }

      const funktionsZellen = tabellenBereich.querySelectorAll('td:nth-child(2)');
      funktionsZellen.forEach(zelle => {
        if (isEditMode) {
          zelle.classList.add('bearbeitbar', 'focusierbar');
          zelle.setAttribute('tabindex', '0');
          zelle.addEventListener('click', function () {
            if (aktiveFunktionsZelle) aktiveFunktionsZelle.classList.remove('aktiv');
            aktiveFunktionsZelle = this;
            this.classList.add('aktiv');
            if (typeof markiereAktivenFMCButton === 'function') {
              try { markiereAktivenFMCButton(this.textContent.trim()); } catch (e) { console.warn(e); }
            }
          });
          zelle.addEventListener('blur', function () {
            this.classList.remove('aktiv');
            if (aktiverFMCButton) {
              aktiverFMCButton.classList.remove('aktiv');
              aktiverFMCButton = null;
            }
          });
        } else {
          zelle.classList.remove('bearbeitbar', 'aktiv', 'focusierbar');
          zelle.removeAttribute('tabindex');
        }
      });

      if (isEditMode) {
        if (typeof generiereFMC === 'function') {
          try { generiereFMC(); } catch (e) { console.warn(e); }
        }
      } else {
        if (fmcBereich) fmcBereich.innerHTML = '';
        const termin = (typeof verfuegbareTermine !== 'undefined' && verfuegbareTermine.length) ? verfuegbareTermine[aktuelleTerminIndex] : null;
        if (termin && typeof alleAnmeldeInfosCache !== 'undefined' && alleAnmeldeInfosCache[termin]) {
          anmeldeInfoBereich.textContent = alleAnmeldeInfosCache[termin].anmeldungInfo || '';
        }
      }
    });
  }

  // --- Speichern / Änderungsprotokoll ---
  if (speichernButton && typeof zeigeAenderungsProtokoll === 'function') {
    speichernButton.addEventListener('click', zeigeAenderungsProtokoll);
  }
  if (typeof initAenderungsProtokollSteuerung === 'function') {
    try { initAenderungsProtokollSteuerung(); } catch (e) { console.warn(e); }
  }

  // --- Zurücksetzen ---
  if (zuruecksetzenButton && typeof zuruecksetzenAenderungen === 'function') {
    zuruecksetzenButton.addEventListener('click', zuruecksetzenAenderungen);
  }

  console.log("✅ initEventListeners fertig");
}
