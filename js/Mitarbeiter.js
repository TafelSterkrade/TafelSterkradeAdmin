// "Mitarbeiter.js" 10.09.2025 -----

const formular = document.getElementById("mitarbeiter-formular");
const toggleButton = document.getElementById("toggle-formular");
const formularEingaben = document.getElementById("formular-eingaben");
const saveButton = document.getElementById("btn-speichern");
const newEmployeeButton = document.getElementById("btn-neuer-mitarbeiter");

let activeID = 0;
const mitarbeiterFilterBereich = document.getElementById("mitarbeiter-filter-bereich");
const mitarbeiterFilterCheckbox = document.getElementById("mitarbeiterFilterAktiv");

formularEingaben.style.display = "none";
formular.style.display = "block";
saveButton.style.display = "none";

//----------------------------------
function zeigeMitarbeiterTabelle(daten) {
//----------------------------------
  const currentActiveID = activeID;
  console.log("zeigeMitarbeiterTabelle, activeID:", activeID);
  const gefilterteDaten = filterMitarbeiterDaten(daten);

  const tbody = document.querySelector("#mitarbeiter-tabelle tbody");
  tbody.innerHTML = "";

  gefilterteDaten.forEach((person) => {
    const tr = document.createElement("tr");
    const nachname = person.nachname || "";
    const vorname = person.vorname || "";

    tr.innerHTML = `
      <td>${person.id}</td>
      <td>${nachname}</td>
      <td>${vorname}</td>
      <td>${person.status}</td>
    `;
    tr.addEventListener("click", () => {
      markiereZeile(tr);
      fuelleFormular(tr);
      if (formularEingaben.style.display === "none") {
        toggleFormularSichtbarkeit();
      }
    });

    tbody.appendChild(tr);
  });

  let zeileZumMarkieren = null;
  if (currentActiveID) {
    const reihen = tbody.querySelectorAll('tr');
    for (let i = 0; i < reihen.length; i++) {
      const zelleID = reihen[i].cells[0];
      if (zelleID && zelleID.textContent.trim() === currentActiveID) {
        zeileZumMarkieren = reihen[i];
        break;
      }
    }
  }

  updateMitarbeiterAnzahlHeader(daten);

  if (zeileZumMarkieren) {
    markiereZeile(zeileZumMarkieren);
    fuelleFormular(zeileZumMarkieren);
  } else {
    const ersteZeile = tbody.querySelector("tr");
    if (ersteZeile) {
      markiereZeile(ersteZeile);
      fuelleFormular(ersteZeile);
    } else {
      document.getElementById("anzeige-id").textContent = "";
      document.getElementById("anzeige-name").textContent = "Keine Auswahl";
      leereFormularfelder();
    }
  }
}

// ----------------------------------
function updateMitarbeiterAnzahlHeader(mitarbeiterArray) {
// ----------------------------------
  const mitarbeiterAnzahlSpan = document.getElementById('mitarbeiter-anzahl');

  if (!mitarbeiterAnzahlSpan || !mitarbeiterArray) {
    console.warn('Platzhalter für Mitarbeiteranzahl oder Mitarbeiterdaten nicht gefunden.');
    return;
  }
  const nuraktive = mitarbeiterArray.filter(person => person.status && person.status.toLowerCase().includes("aktiv"));

  const gesamtAnzahl = mitarbeiterArray.length;
  const aktiveAnzahl = nuraktive.length;

  mitarbeiterAnzahlSpan.textContent = `(${gesamtAnzahl} / ${aktiveAnzahl} aktive)`;
}

// ----------------------------------
toggleButton.addEventListener("click", toggleFormularSichtbarkeit);
// ----------------------------------

// ----------------------------------
document.addEventListener('click', function(event) {
// ----------------------------------
  if (event.target && event.target.id === 'mitarbeiterFilterAktiv') {
    event.stopPropagation();
    console.log("Mitarbeiter Filter Checkbox wurde geklickt (durch Event Delegation).");

    if (typeof alleMitarbeiterDaten !== 'undefined') {
      zeigeMitarbeiterTabelle(alleMitarbeiterDaten);
    } else {
      console.warn("alleMitarbeiterDaten ist im Event-Delegations-Scope nicht verfügbar.");
    }
  }
}, true);

// ----------------------------------
newEmployeeButton.addEventListener("click", starteNeuenMitarbeiterProzess);
// ----------------------------------

//----------------------------------
function toggleFormularSichtbarkeit() {
//----------------------------------
  const tabelle = document.getElementById("table-area");

  if (formularEingaben.style.display === "none") {
    formularEingaben.style.display = "grid";
    toggleButton.textContent = "▲";
    saveButton.style.display = "inline-block";
    newEmployeeButton.style.display = "none";

    if (tabelle) {
      tabelle.style.maxHeight = "145px";
    }
  } else {
    formularEingaben.style.display = "none";
    toggleButton.textContent = "▼";
    saveButton.style.display = "none";
    newEmployeeButton.style.display = "inline-block";

    if (tabelle) {
      tabelle.style.maxHeight = "260px";
    }
    entferneMarkierung();
  }
}

// ----------------------------------
function filterMitarbeiterDaten(daten) {
// ----------------------------------
  if (mitarbeiterFilterCheckbox.checked) {
    return daten.filter(person => person.status && person.status.toLowerCase().includes("aktiv"));
  }
  return daten;
}

// ----------------------------------
function markiereZeile(zeile) {
// ----------------------------------
  entferneMarkierung();
  zeile.classList.add("active-row");

  const zellen = zeile.cells;
  activeID = zellen[0].textContent;
  console.log("markiereZeile, activeID:", activeID);
}

// ----------------------------------
function entferneMarkierung() {
// ----------------------------------
  document.querySelectorAll("#mitarbeiter-tabelle tbody tr").forEach((tr) => {
    tr.classList.remove("active-row");
  });
}

//----------------------------------
function fuelleFormular(zeile) {
//----------------------------------
  const id = zeile.cells[0].textContent.trim();
  activeID = id;

  const mitarbeiter = alleMitarbeiterDaten.find(p => p.id === id);

  if (!mitarbeiter) {
    console.error(`Mitarbeiter mit ID ${id} nicht in alleMitarbeiterDaten gefunden.`);
    leereFormularfelder();
    document.getElementById("anzeige-id").textContent = id;
    document.getElementById("anzeige-name").textContent = "Daten nicht gefunden";
    return;
  }

  document.getElementById("anzeige-id").textContent = mitarbeiter.id;
  document.getElementById("anzeige-name").textContent = mitarbeiter.name;

  document.getElementById("feld-name").value = mitarbeiter.nachname;
  document.getElementById("feld-vorname").value = mitarbeiter.vorname;

  document.getElementById("feld-aktiv").checked = mitarbeiter.status.includes("aktiv");
  document.getElementById("feld-admin").checked = mitarbeiter.status.includes("admin");

  document.getElementById("feld-anmeldename").value = mitarbeiter.anmeldename || "";
  document.getElementById("feld-email").value = mitarbeiter.email || "";
  document.getElementById("feld-geburtstag").value = mitarbeiter.geburtstag || "";
  document.getElementById("feld-mobil").value = mitarbeiter.mobil || "";
  document.getElementById("feld-telefon").value = mitarbeiter.telefon || "";
  document.getElementById("feld-adresse").value = mitarbeiter.adresse || "";
}

// ----------------------------------
function leereFormularfelder() {
// ----------------------------------
  document.getElementById("feld-name").value = "";
  document.getElementById("feld-vorname").value = "";
  document.getElementById("feld-aktiv").checked = false;
  document.getElementById("feld-admin").checked = false;
  document.getElementById("feld-anmeldename").value = "";
  document.getElementById("feld-email").value = "";
  document.getElementById("feld-geburtstag").value = "";
  document.getElementById("feld-mobil").value = "";
  document.getElementById("feld-telefon").value = "";
  document.getElementById("feld-adresse").value = "";
}

// ----------------------------------
function findeMitarbeiterÄnderungen() {
// ----------------------------------
  const id = activeID;

  const nachnameNeu = document.getElementById("feld-name").value.trim();
  const vornameNeu = document.getElementById("feld-vorname").value.trim();
  const aktivNeu = document.getElementById("feld-aktiv").checked;
  const adminNeu = document.getElementById("feld-admin").checked;
  const anmeldenameNeu = document.getElementById("feld-anmeldename").value.trim();
  const emailNeu = document.getElementById("feld-email").value.trim();
  const geburtstagNeu = document.getElementById("feld-geburtstag").value.trim();
  const mobilNeu = document.getElementById("feld-mobil").value.trim();
  const telefonNeu = document.getElementById("feld-telefon").value.trim();
  const adresseNeu = document.getElementById("feld-adresse").value.trim();

  const statusNeu = [aktivNeu ? "aktiv" : "", adminNeu ? "admin" : ""]
    .filter(Boolean)
    .join(", ");

  const änderungen = { id };

  if (id === "NEU") {
    if (nachnameNeu) änderungen.nachname = nachnameNeu;
    if (vornameNeu) änderungen.vorname = vornameNeu;
    if (statusNeu) änderungen.status = statusNeu;
    if (anmeldenameNeu) änderungen.anmeldename = anmeldenameNeu;
    if (emailNeu) änderungen.email = emailNeu;
    if (geburtstagNeu) änderungen.geburtstag = geburtstagNeu;
    if (mobilNeu) änderungen.mobil = mobilNeu;
    if (telefonNeu) änderungen.telefon = telefonNeu;
    if (adresseNeu) änderungen.adresse = adresseNeu;

    console.log("findeMitarbeiterÄnderungen (NEU): ", änderungen);

    if (Object.keys(änderungen).length === 1 && änderungen.id === "NEU") {
      console.log("Neuer Mitarbeiter: Keine sinnvollen Eingaben gefunden.");
      return null;
    }

    return änderungen;

  } else {
    const zeileElement = document.querySelector("#mitarbeiter-tabelle .active-row");
    if (!zeileElement) {
      console.warn("Keine aktive Zeile gefunden für bestehenden Mitarbeiter (findeMitarbeiterÄnderungen).");
      return null;
    }

    const mitarbeiterAlt = alleMitarbeiterDaten.find(p => p.id === id);

    if (!mitarbeiterAlt) {
      console.error(`Originaldaten für Mitarbeiter mit ID ${id} nicht in alleMitarbeiterDaten gefunden.`);
      return null;
    }

    if (nachnameNeu !== (mitarbeiterAlt.nachname || "")) {
      änderungen.nachname = nachnameNeu;
    }
    if (vornameNeu !== (mitarbeiterAlt.vorname || "")) {
      änderungen.vorname = vornameNeu;
    }
    if (statusNeu !== (mitarbeiterAlt.status || "")) {
      änderungen.status = statusNeu;
    }
    if (anmeldenameNeu !== (mitarbeiterAlt.anmeldename || "")) {
      änderungen.anmeldename = anmeldenameNeu;
    }
    if (emailNeu !== (mitarbeiterAlt.email || "")) {
      änderungen.email = emailNeu;
    }
    if (geburtstagNeu !== (mitarbeiterAlt.geburtstag || "")) {
      änderungen.geburtstag = geburtstagNeu;
    }
    if (mobilNeu !== (mitarbeiterAlt.mobil || "")) {
      änderungen.mobil = mobilNeu;
    }
    if (telefonNeu !== (mitarbeiterAlt.telefon || "")) {
      änderungen.telefon = telefonNeu;
    }
    if (adresseNeu !== (mitarbeiterAlt.adresse || "")) {
      änderungen.adresse = adresseNeu;
    }

    console.log("findeMitarbeiterÄnderungen (UPDATE): ", änderungen);

    if (Object.keys(änderungen).length === 1 && änderungen.id) {
      console.log("Bestehender Mitarbeiter: Keine Änderungen außer der ID gefunden.");
      return null;
    }

    return änderungen;
  }
}

// ----------------------------------
document.getElementById("btn-speichern").addEventListener("click", () => {
// ----------------------------------
  const aenderungen = findeMitarbeiterÄnderungen();
  console.log("addEventListener, Gefundene Änderungen:", aenderungen);

  if (aenderungen && Object.keys(aenderungen).length > 1) {
    const aktiveZeile = document.querySelector("#mitarbeiter-tabelle .active-row");
    zeigeMitarbeiterÄnderungen(aenderungen, aktiveZeile);
    console.log("Gefundene Änderungen:", aenderungen);
  } else {
    showPopup("Keine Änderungen erkannt.");
  }
});

//----------------------------------
function zeigeMitarbeiterÄnderungen(aenderungen, zeile) {
//----------------------------------
  const overlay = document.getElementById("mitarbeiter-overlay");
  const overlayTitel = document.getElementById("overlay-titel");
  const tabelleBody = document.querySelector("#mitarbeiter-aenderungen-tabelle tbody");
  tabelleBody.innerHTML = "";

  const id = aenderungen.id;
  let nameAnzeige = "(unbekannt)";
  let mitarbeiterAlt = null;

  const istNeuerMitarbeiter = (id === "NEU");

  if (istNeuerMitarbeiter) {
    const nachnameNeu = aenderungen.nachname || "";
    const vornameNeu = aenderungen.vorname || "";
    if (nachnameNeu || vornameNeu) {
      nameAnzeige = `${nachnameNeu}${vornameNeu ? ', ' + vornameNeu : ''}`;
    } else {
      nameAnzeige = "(Neuer Eintrag)";
    }
  } else {
    mitarbeiterAlt = alleMitarbeiterDaten.find((p) => p.id === id);
    if (mitarbeiterAlt) {
      nameAnzeige = `${mitarbeiterAlt.nachname}, ${mitarbeiterAlt.vorname}`;
    } else {
      nameAnzeige = "(unbekannt) - Daten nicht gefunden";
    }
  }

  overlayTitel.textContent = `Änderungen für ID: ${id} - ${nameAnzeige}`;

  const eigenschaftNamen = {
    nachname: 'Nachname',
    vorname: 'Vorname',
    status: 'Status',
    anmeldename: 'Anmeldename',
    email: 'E-Mail',
    geburtstag: 'Geburtstag',
    mobil: 'Mobil',
    telefon: 'Telefon',
    adresse: 'Adresse'
  };

  for (const key in aenderungen) {
    if (key !== "id") {
      const tr = document.createElement("tr");
      const eigenschaftName = eigenschaftNamen[key] || key;

      let alterWert = '';
      if (!istNeuerMitarbeiter && mitarbeiterAlt && mitarbeiterAlt.hasOwnProperty(key)) {
        alterWert = mitarbeiterAlt[key] || '';
      }

      const neuerWert = aenderungen[key] || '';

      tr.innerHTML = `
        <td>${eigenschaftName}:</td>
        <td>${neuerWert}</td>
        <td>${alterWert}</td>
      `;
      tabelleBody.appendChild(tr);
    }
  }

  overlay.style.display = "flex";

  document.getElementById("mitarbeiter-overlay-abbrechen").onclick = () => {
    schliesseMitarbeiterOverlay();
  };

  document.getElementById("mitarbeiter-overlay-bestaetigen").onclick = () => {
    console.log("zeigeMitarbeiterÄnderungen: ok");
    schliesseMitarbeiterOverlay();
    speichereMitarbeiter(aenderungen, zeile);
  };
}

// ----------------------------------
function schliesseMitarbeiterOverlay() {
// ----------------------------------
  const overlay = document.getElementById("mitarbeiter-overlay");
  overlay.style.display = "none";
}

//----------------------------------
function speichereMitarbeiter(aenderungen, zeile) {
//----------------------------------
  const istNeuerMitarbeiter = (activeID === "NEU");

  if (!aenderungen || Object.keys(aenderungen).length <= 1) {
    if (istNeuerMitarbeiter) {
      if (!aenderungen.nachname && !aenderungen.vorname && !aenderungen.status) {
        showPopup("Bitte füllen Sie mindestens Nachname oder Vorname für den neuen Mitarbeiter aus.");
        return;
      }
    } else {
      showPopup("Keine Änderungen gefunden zum Speichern.");
      return;
    }
  }

  if (istNeuerMitarbeiter) {
    _handleSpeichernNeuerMitarbeiter(aenderungen);
  } else {
    _handleSpeichernBestehenderMitarbeiter(aenderungen, zeile);
  }
}

//----------------------------------
function _handleSpeichernNeuerMitarbeiter(aenderungen) {
//----------------------------------
  console.log("Starte Prozess: Speichere neuen Mitarbeiter.");

  const datenFuerNeuenMitarbeiter = { ...aenderungen };
  delete datenFuerNeuenMitarbeiter.id;

  zeigeMitarbeiterSpinner(true);

  apiCall('legeNeuenMitarbeiterAn', { mitarbeiterDaten: datenFuerNeuenMitarbeiter })
    .then(res => {
      if (res.erfolg && res.neueId && res.mitarbeiterDaten) {
        showPopup("Neuer Mitarbeiter erfolgreich angelegt!");
        alleMitarbeiterDaten.push(res.mitarbeiterDaten);
        zeigeMitarbeiterTabelle(alleMitarbeiterDaten);

        const tbody = document.querySelector("#mitarbeiter-tabelle tbody");
        let neueZeileElement = null;
        const reihen = tbody.querySelectorAll('tr');
        for (let i = 0; i < reihen.length; i++) {
          const zelleID = reihen[i].cells[0];
          if (zelleID && zelleID.textContent.trim() === res.mitarbeiterDaten.id) {
            neueZeileElement = reihen[i];
            break;
          }
        }

        if (neueZeileElement) {
          markiereZeile(neueZeileElement);
          fuelleFormular(neueZeileElement);
        } else {
          activeID = res.mitarbeiterDaten.id;
          fuelleFormular(null);
        }
      } else {
        showPopup("Fehler beim Anlegen des neuen Mitarbeiters: " + (res.message || "Unbekannter Fehler."));
      }
      zeigeMitarbeiterSpinner(false);
    })
    .catch(err => {
      console.error("Fehler beim Anlegen eines neuen Mitarbeiters:", err);
      zeigeMitarbeiterSpinner(false);
      showPopup("Fehler beim Anlegen des neuen Mitarbeiters: " + err.message);
    });
}

//----------------------------------
function _handleSpeichernBestehenderMitarbeiter(aenderungen, zeile) {
//----------------------------------
  console.log("Starte Prozess: Speichere bestehenden Mitarbeiter.");
  zeigeMitarbeiterSpinner(true);

  apiCall('speichereMitarbeiterDaten', { aenderungen: [aenderungen] })
    .then((res) => {
      if (res.erfolg) {
        aktualisiereAlleMitarbeiterDaten(aenderungen);
        aktualisiereMitarbeiterzeile(zeile, aenderungen);
        checkMitarbeiterUndUpdateAktualisierung();
        zeigeMitarbeiterTabelle(alleMitarbeiterDaten);

        showPopup("Änderungen gespeichert");
      } else {
        showPopup("Fehler beim Speichern: " + res.message);
      }
      zeigeMitarbeiterSpinner(false);
    })
    .catch((err) => {
      console.error("Fehler beim Speichern:", err);
      zeigeMitarbeiterSpinner(false);
      showPopup("Fehler beim Speichern: " + err.message);
    });
}

// ----------------------------------
function checkMitarbeiterUndUpdateAktualisierung() {
// ----------------------------------
  const anmeldedaten = alleAnmeldeDaten;
  const mitarbeiterdaten = alleMitarbeiterDaten;
  console.log("--->checkMitarbeiter");

  apiCall('checkMitarbeiterInAnmeldung', { anmeldedaten: anmeldedaten, mitarbeiterdaten: mitarbeiterdaten })
    .then(() => {
      apiCall('getAktualisierungsStatus', {})
        .then(initAktualisierungsStatus)
        .catch(err => console.error("Fehler beim Abrufen des Aktualisierungsstatus:", err));
    })
    .catch(err => {
      console.error("Fehler bei checkMitarbeiterInAnmeldung:", err);
    });
}

//----------------------------------
function aktualisiereMitarbeiterzeile(zeile, aenderungen) {
//----------------------------------
  const id = aenderungen.id;

  const mitarbeiter = alleMitarbeiterDaten.find((p) => p.id === id);
  if (!mitarbeiter) return;

  for (const key in aenderungen) {
    if (key !== "id") {
      mitarbeiter[key] = aenderungen[key];
      console.log("aktualisiereMitarbeiterzeile: ", aenderungen.id, key, mitarbeiter[key]);
    }
  }
  mitarbeiter.name = `${mitarbeiter.nachname}, ${mitarbeiter.vorname}`;

  if (activeID === id) {
    document.getElementById("anzeige-name").textContent = mitarbeiter.name;
  }
}

// ----------------------------------
function aktualisiereAlleMitarbeiterDaten(aenderungen) {
// ----------------------------------
  const eintrag = alleMitarbeiterDaten.find((p) => p.id === aenderungen.id);
  if (!eintrag) return;

  for (const key in aenderungen) {
    if (key !== "id") {
      eintrag[key] = aenderungen[key];
      console.log("aktualisiereAlleMitarbeiterDaten: ", aenderungen.id, key, eintrag[key]);
    }
  }
}

// ----------------------------------
function zeigeMitarbeiterSpinner(anzeigen) {
// ----------------------------------
  const spinner = document.getElementById("mitarbeiter-spinner");
  spinner.style.display = anzeigen ? "inline-block" : "none";
}

// ----------------------------------
function handleMitarbeiterAccordionOpen() {
// ----------------------------------
  mitarbeiterFilterBereich.style.display = "flex";
  zeigeMitarbeiterTabelle(alleMitarbeiterDaten);
}

// ----------------------------------
function handleMitarbeiterAccordionClose() {
// ----------------------------------
  mitarbeiterFilterBereich.style.display = "none";
}

//----------------------------------
function starteNeuenMitarbeiterProzess() {
//----------------------------------
  console.log("Starte Prozess: Neuen Mitarbeiter anlegen.");

  if (formularEingaben.style.display === "none") {
    toggleFormularSichtbarkeit();
  }

  entferneMarkierung();
  leereFormularfelder();

  activeID = "NEU";
  document.getElementById("anzeige-id").textContent = "Auto-ID";
  document.getElementById("anzeige-name").textContent = "(Neuer Eintrag)";

  saveButton.style.display = "inline-block";
  newEmployeeButton.style.display = "none";

  document.getElementById("feld-name").focus();
}