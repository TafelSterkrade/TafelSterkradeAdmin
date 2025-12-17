// "Anmeldung.js"----- 11.11.2025 ----------


// ----------------------------------
function zeigeTermineImDropdown(termine) {
// ----------------------------------
  const terminAuswahl = document.getElementById("terminAuswahl");
  if (terminAuswahl) {
    terminAuswahl.innerHTML = "<option value=''>-- Bitte wählen --</option>";
    verfuegbareTermine = termine; // Speichere die Termine global
    termine.forEach((termin, index) => {
      const option = document.createElement("option");
      option.value = termin;
      option.textContent = termin;
      if (index === 0 && termin !== '') {
        option.selected = true;
        aktuelleTerminIndex = 0; // Initialen Index setzen
        zeigeTabelleFuerTermin(alleAnmeldeDaten, verfuegbareTermine[aktuelleTerminIndex]);
        updateTerminNavigationAnzeige();
      }
      terminAuswahl.appendChild(option);
    });
  }
}

// ----------------------------------
function zeigeDatenFuerTermin(ausgewaehlterTermin) {
// ----------------------------------
  aktuelleTerminIndex = verfuegbareTermine.indexOf(ausgewaehlterTermin);
  zeigeTabelleFuerTermin(alleAnmeldeDaten, ausgewaehlterTermin);
  updateTerminNavigationAnzeige();
}

//----------------------------------
function zeigeTabelleFuerTermin(daten, termin) {
//----------------------------------
  const tabellenBereich = document.getElementById("anmeldung-tabelle");
  const anmeldeInfoBereich = document.getElementById("anmeldeinfo-bereich");
  const filterCheckbox = document.getElementById("filterOhneFunktion");
  let gefilterteDaten = daten;
  const tafelfunktionenClient = alleAnmeldeInfosCache['tafelfunktionen'] || []; // Hole die Tafelfunktionen aus dem Cache

  console.log("zeigeTabelleFuerTermin aufgerufen mit Termin:", termin);

  if (filterCheckbox && filterCheckbox.checked) {
    const terminIndexImArray = verfuegbareTermine.indexOf(termin);
    const funktionsSchluessel = `funktion${terminIndexImArray + 1}`;
    gefilterteDaten = daten.filter(mitarbeiter => {
      const funktion = mitarbeiter[funktionsSchluessel] ? mitarbeiter[funktionsSchluessel].trim() : '';
      return funktion !== '' && tafelfunktionenClient.includes(funktion); // Filtere nur Einträge mit Funktion UND die in den Tafelfunktionen enthalten sind
    });
  }

  if (tabellenBereich && gefilterteDaten) {
    const anzahlEintraege = gefilterteDaten.length;
    const ueberschriftName = `Helfer (${anzahlEintraege})`;
    let tabellenHtml = `<table><thead><tr><th>${ueberschriftName}</th><th>${termin || 'Funktion'}</th></tr></thead><tbody>`;

    if (gefilterteDaten.length > 0 && verfuegbareTermine.length > 0) {
      const terminIndexImArray = verfuegbareTermine.indexOf(termin);
      const funktionsSchluessel = `funktion${terminIndexImArray + 1}`;

      gefilterteDaten.forEach(mitarbeiter => {
        tabellenHtml += `<tr><td>${mitarbeiter.name}</td><td>${mitarbeiter[funktionsSchluessel] || ''}</td></tr>`;
      });
    } else {
      tabellenHtml += "<tr><td colspan='2'>Keine Daten verfügbar.</td></tr>";
    }

    tabellenHtml += "</tbody></table>";
    tabellenBereich.innerHTML = tabellenHtml;

    if (anmeldeInfoBereich && termin && alleAnmeldeInfosCache[termin] && alleAnmeldeInfosCache[termin].anmeldungInfo) {
      anmeldeInfoBereich.textContent = alleAnmeldeInfosCache[termin].anmeldungInfo;
    } else if (anmeldeInfoBereich && termin) {
      console.log("Keine Anmeldeinfo im Cache für:", termin);
      anmeldeInfoBereich.textContent = "";
    } else if (anmeldeInfoBereich) {
      anmeldeInfoBereich.textContent = "";
    }
  }
}

// ----------------------------------
function zeigeVorherigenTermin() {
// ----------------------------------
  if (verfuegbareTermine.length > 0 && aktuelleTerminIndex > 0) {
    aktuelleTerminIndex--;
    zeigeTabelleFuerTermin(alleAnmeldeDaten, verfuegbareTermine[aktuelleTerminIndex]);
    updateTerminNavigationAnzeige();
    updateTerminDropdown();
  }
}

// ----------------------------------
function zeigeNaechstenTermin() {
// ----------------------------------
  if (verfuegbareTermine.length > 0 && aktuelleTerminIndex < verfuegbareTermine.length - 1) {
    aktuelleTerminIndex++;
    zeigeTabelleFuerTermin(alleAnmeldeDaten, verfuegbareTermine[aktuelleTerminIndex]);
    updateTerminNavigationAnzeige();
    updateTerminDropdown();
  }
}

// ----------------------------------
function updateTerminNavigationAnzeige() {
// ----------------------------------
  const terminAuswahl = document.getElementById("terminAuswahl");
  if (terminAuswahl && verfuegbareTermine.length > 0) {
    const aktuellerTerminText = verfuegbareTermine[aktuelleTerminIndex];
    const terminSpaltenUeberschrift = document.querySelector('#anmeldung-tabelle th:nth-child(2)');
    if (terminSpaltenUeberschrift) {
      terminSpaltenUeberschrift.textContent = aktuellerTerminText || 'Funktion';
    }
  }
}

// ----------------------------------
function updateTerminDropdown() {
// ----------------------------------
  const terminAuswahl = document.getElementById("terminAuswahl");
  if (terminAuswahl && verfuegbareTermine.length > 0) {
    terminAuswahl.value = verfuegbareTermine[aktuelleTerminIndex];
  }
}

// ----------------------------------
function filtereTabelle() {
// ----------------------------------
  zeigeTabelleFuerTermin(alleAnmeldeDaten, verfuegbareTermine[aktuelleTerminIndex]);
}

// ----------------------------------
function generiereFMC() {
// ----------------------------------
console.log("CLIENT: generiereFMC:", alleFunktionenCache.length);

  const fmcBereich = document.getElementById('fmcBereich');
  if (fmcBereich && alleFunktionenCache.length > 0) {
    fmcBereich.innerHTML = '';

    alleFunktionenCache.forEach(funktion => {
      const fmcButton = document.createElement('button');
      fmcButton.textContent = funktion;
      fmcButton.classList.add('fmc-button');
      fmcButton.addEventListener('click', function() {
        if (aktiveFunktionsZelle) {
          const zellenInhalt = aktiveFunktionsZelle.textContent.trim();
          const gewaehlteFunktion = funktion.trim();

          if (gewaehlteFunktion === keineAngabeText && zellenInhalt === "") {
            aktiveFunktionsZelle.classList.remove('geaendert'); // Entferne rot, falls vorher gesetzt
            aktiveFunktionsZelle.textContent = ""; // Stelle sicher, dass die Zelle leer ist
          } else if (zellenInhalt !== gewaehlteFunktion) {
            aktiveFunktionsZelle.textContent = funktion;
            aktiveFunktionsZelle.classList.add('geaendert');
          } else {
            aktiveFunktionsZelle.classList.remove('geaendert'); // Entferne rot, falls keine Änderung
          }
          aktiveFunktionsZelle.focus();
        }
        // Aktiviere den geklickten Button visuell
        if (aktiverFMCButton && aktiverFMCButton !== this) {
          aktiverFMCButton.classList.remove('aktiv');
        }
        this.classList.add('aktiv');
        aktiverFMCButton = this;
      });
      fmcBereich.appendChild(fmcButton);
    });
  } else if (fmcBereich) {
    fmcBereich.textContent = 'Keine Funktionen verfügbar.';
  }
}

// ----------------------------------
function markiereAktivenFMCButton(funktion) {
// ----------------------------------
  const fmcButtons = document.querySelectorAll('.fmc-button');
  fmcButtons.forEach(button => {
    if (button.textContent.trim() === funktion) {
      if (aktiverFMCButton && aktiverFMCButton !== button) {
        aktiverFMCButton.classList.remove('aktiv');
      }
      button.classList.add('aktiv');
      aktiverFMCButton = button;
    } else if (funktion === "" && button.textContent.trim() === keineAngabeText) {
      if (aktiverFMCButton && aktiverFMCButton !== button) {
        aktiverFMCButton.classList.remove('aktiv');
      }
      button.classList.add('aktiv');
      aktiverFMCButton = button;
    } else {
      button.classList.remove('aktiv');
    }
  });
}

// ----------------------------------
function speichereAenderungen() {
// ----------------------------------
  const tabellenBereich = document.getElementById('anmeldung-tabelle');
  const speichernButton = document.getElementById('speichernButton');

  if (!tabellenBereich) {
    console.error("Tabellenbereich nicht gefunden.");
    return;
  }
  const originalText = speichernButton.textContent;

  const geaenderteZellen = tabellenBereich.querySelectorAll('td.bearbeitbar.geaendert');
  const aenderungen = [];

  geaenderteZellen.forEach(zelle => {
    const row = zelle.parentNode;
    const helferNameZelle = row.querySelector('td:first-child');
    let neueFunktion = zelle.textContent.trim();
    const helferName = helferNameZelle ? helferNameZelle.textContent.trim() : "Unbekannter Helfer";
    const zeile = row.rowIndex;

    if (neueFunktion === keineAngabeText) {
      neueFunktion = "";
    }
    aenderungen.push({
      zeile: zeile,
      Name: helferName,
      neueFunktion: neueFunktion
    });
  });

  const termin = verfuegbareTermine[aktuelleTerminIndex];

  if (aenderungen.length > 0) {
    console.log("termin: ", termin);
    console.log("Folgende Änderungen werden gespeichert:", aenderungen);
    speichernButton.textContent = "wird gespeichert...";

    apiCall('speichereFunktionsAenderungen', { aenderungen: aenderungen, termin: termin })
      .then(erfolgsmeldung => {
        speichernButton.textContent = originalText;
        aenderungenGespeichert(erfolgsmeldung);
      })
      .catch(error => {
        console.error("Fehler beim Senden der Daten:", error);
        showPopup(`Fehler beim Speichern der Änderungen: ${error.message}`);
        speichernButton.textContent = originalText;
      });

  } else {
    showPopup("Keine Änderungen zum Speichern");
  }
}

// ----------------------------------
function initAenderungsProtokollSteuerung() {
// ----------------------------------
  const abbrechenSpeichernButton = document.getElementById('abbrechenAnmeldungenSpeichern');
  const bestaetigenSpeichernButton = document.getElementById('bestaetigenAnmeldungenSpeichern');
  const aenderungsProtokollOverlay = document.getElementById('OverlayAnmeldungAenderungenProtokoll');

  if (abbrechenSpeichernButton && bestaetigenSpeichernButton && aenderungsProtokollOverlay) {
    abbrechenSpeichernButton.addEventListener('click', function() {
      aenderungsProtokollOverlay.style.display = "none";
    });

    bestaetigenSpeichernButton.addEventListener('click', function() {
      aenderungsProtokollOverlay.style.display = "none";
      speichereAenderungen();
    });
  } else {
    console.error("Steuerungselemente für das Änderungsprotokoll nicht gefunden.");
  }
}

// ----------------------------------
function zeigeAenderungsProtokoll() {
// ----------------------------------
  const tabellenBereich = document.getElementById('anmeldung-tabelle');
  const aenderungsListe = document.getElementById('aenderungsListe');
  const aenderungsProtokollOverlay = document.getElementById('OverlayAnmeldungAenderungenProtokoll');

  if (!tabellenBereich || !aenderungsListe || !aenderungsProtokollOverlay) {
    console.error("Erforderliche Elemente für das Änderungsprotokoll nicht gefunden.");
    return;
  }

  const geaenderteZellen = tabellenBereich.querySelectorAll('td.bearbeitbar.geaendert');
  aenderungsListe.innerHTML = ''; // Liste leeren
  aenderungsListe.style.listStyleType = 'none'; // Entferne die Standard-Listenpunkte
  aenderungsListe.style.padding = '0'; // Entferne Standard-Padding

  if (geaenderteZellen.length === 0) {
    showPopup("Keine Änderungen zum Speichern");
    return;
  }
// Füge den aktuellen Termin zur Anzeige hinzu
  const termin = verfuegbareTermine[aktuelleTerminIndex];
  aktuellerTerminProtokoll.textContent = `Termin: ${termin}`;
  
  geaenderteZellen.forEach(zelle => {
    const row = zelle.parentNode; // Die gesamte Tabellenzeile (TR-Element)
    const helferNameZelle = row.querySelector('td:first-child'); // Die erste Zelle (Helfername)
    const neueFunktion = zelle.textContent.trim();
    let helferName = "Unbekannter Helfer";
    if (helferNameZelle) {
      helferName = helferNameZelle.textContent.trim();
    }

    const listItem = document.createElement('li');
    listItem.style.display = 'grid';
    listItem.style.gridTemplateColumns = 'auto 1fr'; // Erste Spalte für Name, zweite für Funktion
    listItem.style.alignItems = 'baseline'; // Richtet Text am Anfang aus
    listItem.style.padding = '5px 0';
    listItem.style.borderBottom = '1px solid #eee'; // Optionale Trennlinie

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${helferName}:`;
    nameSpan.style.fontWeight = 'bold';
    nameSpan.style.paddingRight = '10px';

    const funktionSpan = document.createElement('span');
    funktionSpan.textContent = neueFunktion;

    listItem.appendChild(nameSpan);
    listItem.appendChild(funktionSpan);
    aenderungsListe.appendChild(listItem);
  });

  aenderungsProtokollOverlay.style.display = "block";
}

// ----------------------------------
function aenderungenGespeichert(erfolgsmeldung) {
// ----------------------------------
  apiCall('getAnmeldeDaten', {})
    .then(speichereAlleAnmeldeDaten)
    .catch(error => {
      console.error("Fehler beim Neuladen der Anmeldedaten:", error);
      showPopup(`Fehler beim Neuladen der Anmeldedaten: ${error.message}`);
    });
  
  apiCall('getAlleAnmeldeInfos', {})
    .then(speichereAlleAnmeldeInfos)
    .catch(error => {
      console.error("Fehler beim Neuladen der Anmeldeinfos:", error);
      showPopup(`Fehler beim Neuladen der Anmeldeinfos: ${error.message}`);
    });

  showPopup(erfolgsmeldung); 

  // Visuelle Hinweise entfernen
  const tabellenBereich = document.getElementById('anmeldung-tabelle');
  if (tabellenBereich) {
    const geaenderteZellen = tabellenBereich.querySelectorAll('td.geaendert');
    geaenderteZellen.forEach(zelle => {
      zelle.classList.remove('geaendert');
    });
  }

  // Internen Zustand zurücksetzen
  aktiveFunktionsZelle = null;
  if (aktiverFMCButton) {
    aktiverFMCButton.classList.remove('aktiv');
    aktiverFMCButton = null;
  }

  // Optional: Protokollfenster schließen
  const aenderungsProtokollOverlay = document.getElementById('OverlayAnmeldungAenderungenProtokoll');
  if (aenderungsProtokollOverlay) {
    aenderungsProtokollOverlay.style.display = "none";
  }
}

// ----------------------------------
function zuruecksetzenAenderungen() {
// ----------------------------------
  const tabellenBereich = document.getElementById('anmeldung-tabelle');

  const geaenderteZellen = tabellenBereich.querySelectorAll('td.bearbeitbar.geaendert');
  if (geaenderteZellen.length === 0) {
    showPopup("Keine Änderungen ");
    return;
  }
  
  const termin = verfuegbareTermine[aktuelleTerminIndex];
  zeigeTabelleFuerTermin(alleAnmeldeDaten, termin);
  setCellEditMode();

  geaenderteZellen.forEach(zelle => {
      zelle.classList.remove('geaendert');
  });
}

// ----------------------------------
function setCellEditMode() {
// ----------------------------------
const tabellenBereich = document.getElementById('anmeldung-tabelle');
const funktionsZellen = tabellenBereich.querySelectorAll('td:nth-child(2)');
  funktionsZellen.forEach(zelle => {
    zelle.classList.add('bearbeitbar', 'focusierbar');
    zelle.setAttribute('tabindex', '0');
    zelle.addEventListener('click', function() {
      if (aktiveFunktionsZelle) {
        aktiveFunktionsZelle.classList.remove('aktiv');
      }
      aktiveFunktionsZelle = this;
      this.classList.add('aktiv');
      markiereAktivenFMCButton(this.textContent.trim());
    });
    zelle.addEventListener('blur', function() {
      this.classList.remove('aktiv');
      if (aktiverFMCButton) {
        aktiverFMCButton.classList.remove('aktiv');
        aktiverFMCButton = null;
      }
    });
  });
}