// "Manage.js" ----- 10.09.2025 ----------

// ----------------------------------
function toggleWartungCheckbox(isChecked) {
// ----------------------------------
  const status = isChecked ? "eingeschaltet" : "ausgeschaltet";
  updateWartungsStatus(status);
  apiCall('toggleWartung', {})
    .then(result => {
      // Erfolgshandling ist hier optional, da die UI bereits aktualisiert wurde.
      console.log("Wartungsstatus erfolgreich umgeschaltet.");
    })
    .catch(error => {
      console.error("Fehler beim Umschalten des Wartungsstatus:", error);
      showPopup(`Fehler: ${error.message}`);
    });
}

// ----------------------------------
function aktualisiereMitarbeiter(button) {
// ----------------------------------
  const originalText = button.textContent;
  const loader = button.nextElementSibling;

  button.textContent = "Wird ausgeführt...";
  button.disabled = true;
  if (loader) {
    loader.style.display = "inline-block";
  }

  apiCall('aktualisiereMitarbeiterGS', { anmeldedaten: alleAnmeldeDaten, mitarbeiterdaten: alleMitarbeiterDaten })
    .then(result => {
      button.textContent = originalText;
      button.disabled = false;
      if (loader) {
        loader.style.display = "none";
      }
      updateMitarbeiterUndAnmeldung();
      apiCall('getAktualisierungsStatus', {})
        .then(initAktualisierungsStatus)
        .catch(error => console.error("Fehler beim Abrufen des Aktualisierungsstatus:", error));
      showPopup("Mitarbeiter in Tabelle Anmeldung aktualisiert");
    })
    .catch(error => {
      button.textContent = "Fehler!";
      button.disabled = false;
      if (loader) {
        loader.style.display = "none";
      }
      console.error("Fehler bei aktualisiereMitarbeiter:", error);
      setTimeout(() => {
        button.textContent = originalText;
      }, 3000);
    });
}

// ----------------------------------
function aktualisiereTermine(button) {
// ----------------------------------
  const originalText = button.textContent;
  const loader = button.nextElementSibling;

  button.textContent = "Wird ausgeführt...";
  button.disabled = true;
  if (loader) {
    loader.style.display = "inline-block";
  }

  apiCall('aktualisiereTermineGS', {})
    .then(result => {
      button.textContent = originalText;
      button.disabled = false;
      if (loader) {
        loader.style.display = "none";
      }
      showPopup("Termine in Tabelle Anmeldung aktualisiert");
    })
    .catch(error => {
      button.textContent = "Fehler!";
      button.disabled = false;
      if (loader) {
        loader.style.display = "none";
      }
      console.error("Fehler bei aktualisieretermine:", error);
      setTimeout(() => {
        button.textContent = originalText;
      }, 3000);
    });
}

// ----------------------------------
function checkMitarbeiter() {
// ----------------------------------
  const anmeldedaten = alleAnmeldeDaten;
  const mitarbeiterdaten = alleMitarbeiterDaten;
  console.log("--->checkMitarbeiter");
  apiCall('checkMitarbeiterInAnmeldung', { anmeldedaten: anmeldedaten, mitarbeiterdaten: mitarbeiterdaten })
    .then(result => {
      console.log("Mitarbeiter-Check erfolgreich durchgeführt:", result);
    })
    .catch(error => {
      console.error("Fehler bei checkMitarbeiterInAnmeldung:", error);
    });
}

// ----------------------------------
function speichereAlleAnmeldeDatenUndUpdAnzeige(daten) {
// ----------------------------------
  console.log("speichereAlleAnmeldeDatenUndUpdAnzeige:", daten);
  speichereAlleAnmeldeDaten(daten);
  zeigeTabelleFuerTermin(daten, verfuegbareTermine[aktuelleTerminIndex]);
  versucheInitialisiereAnzeige();
}

// ----------------------------------
function updateMitarbeiterUndAnmeldung() {
// ----------------------------------
  console.log("--->updateMitarbeiterUndAnmeldung: getAnmeldeDaten speichereAlleAnmeldeDaten");
  apiCall('getAnmeldeDaten', {})
    .then(speichereAlleAnmeldeDatenUndUpdAnzeige)
    .catch(error => {
      console.error("Fehler beim Abrufen der Anmeldedaten:", error);
    });

  console.log("--->updateMitarbeiterUndAnmeldung: getMitarbeiterDaten speichereAlleMitarbeiterDaten");
  apiCall('getMitarbeiterDaten', {})
    .then(speichereAlleMitarbeiterDaten)
    .catch(error => {
      console.error("Fehler beim Abrufen der Mitarbeiterdaten:", error);
    });
}

// ----------------------------------
function updateAktualisierungsStatus(status) {
// ----------------------------------
  const termine = status.termine;
  const mitarbeiter = status.mitarbeiter;
  const aktualisierungsStatusElement = document.getElementById('aktualisierungs-status-text');

  if (!aktualisierungsStatusElement) {
    console.error("Element mit ID 'aktualisierungs-status-text' nicht gefunden.");
    return;
  }

  const isTermineOverallOk = (termine.status === '' || termine.status === 'Status OK');
  const isMitarbeiterOverallOk = (mitarbeiter.status === '' || mitarbeiter.status === 'Status OK');
  console.log("--->updateAktualisierungsStatus termine" + termine.status + isTermineOverallOk);
  console.log("--->updateAktualisierungsStatus mitarbeiter" + mitarbeiter.status + isMitarbeiterOverallOk);

  const hatWarnung = !(isTermineOverallOk && isMitarbeiterOverallOk);

  if (hatWarnung) {
    aktualisierungsStatusElement.textContent = 'Akt. empfohlen';
    aktualisierungsStatusElement.classList.remove('status-ok');
    aktualisierungsStatusElement.classList.add('status-empfohlen');
  } else {
    aktualisierungsStatusElement.textContent = 'Status OK';
    aktualisierungsStatusElement.classList.remove('status-empfohlen');
    aktualisierungsStatusElement.classList.add('status-ok');
  }

  const statusTermineSpan = document.getElementById('termine-status-text');
  const detailTermineSpan = document.getElementById('termine-detail-text');
  const pruefdatumTermineSpan = document.getElementById('termine-pruefdatum');
  const aktualisierungsdatumTermineSpan = document.getElementById('termine-aktualisierungsdatum');

  if (statusTermineSpan) {
    statusTermineSpan.classList.remove('status-ok-text', 'status-empfohlen-text');
    if (termine.status === '' || termine.status === 'Status OK') {
      statusTermineSpan.textContent = 'Status OK';
      statusTermineSpan.classList.add('status-ok-text');
    } else {
      statusTermineSpan.textContent = 'Aktualisierung empfohlen';
      statusTermineSpan.classList.add('status-empfohlen-text');
    }
  }

  if (detailTermineSpan) detailTermineSpan.textContent = termine.Detail;
  if (pruefdatumTermineSpan) pruefdatumTermineSpan.textContent = termine.Prüfdatum;
  if (aktualisierungsdatumTermineSpan) aktualisierungsdatumTermineSpan.textContent = termine.Aktualisierungsdatum;

  const statusMitarbeiterSpan = document.getElementById('mitarbeiter-status-text');
  const detailMitarbeiterSpan = document.getElementById('mitarbeiter-detail-text');
  const pruefdatumMitarbeiterSpan = document.getElementById('mitarbeiter-pruefdatum');
  const aktualisierungsdatumMitarbeiterSpan = document.getElementById('mitarbeiter-aktualisierungsdatum');

  if (statusMitarbeiterSpan) {
    statusMitarbeiterSpan.classList.remove('status-ok-text', 'status-empfohlen-text');
    if (mitarbeiter.status === '' || mitarbeiter.status === 'Status OK') {
      statusMitarbeiterSpan.textContent = 'Status OK';
      statusMitarbeiterSpan.classList.add('status-ok-text');
    } else {
      statusMitarbeiterSpan.textContent = 'Aktualisierung empfohlen';
      statusMitarbeiterSpan.classList.add('status-empfohlen-text');
    }
  }

  if (detailMitarbeiterSpan) detailMitarbeiterSpan.textContent = mitarbeiter.Detail;
  if (pruefdatumMitarbeiterSpan) pruefdatumMitarbeiterSpan.textContent = mitarbeiter.Prüfdatum;
  if (aktualisierungsdatumMitarbeiterSpan) aktualisierungsdatumMitarbeiterSpan.textContent = mitarbeiter.Aktualisierungsdatum;

  document.querySelectorAll('.status-cell-clickable').forEach(cell => {
    if (!cell.dataset.listenerAdded) {
      cell.addEventListener('click', function() {
        toggleAktualisierungsDetails(this);
      });
      cell.dataset.listenerAdded = 'true';
    }
  });
}

// ----------------------------------
function toggleAktualisierungsDetails(clickedElement) {
// ----------------------------------
  const targetId = clickedElement.dataset.target;
  const detailsRow = document.getElementById(targetId);
  let toggleIcon = null;

  if (targetId === 'row-details-termine') {
    toggleIcon = document.getElementById('termine-toggle-icon');
  } else if (targetId === 'row-details-mitarbeiter') {
    toggleIcon = document.getElementById('mitarbeiter-toggle-icon');
  }

  if (detailsRow && toggleIcon) {
    const isExpanded = detailsRow.style.display === 'table-row';
    detailsRow.style.display = isExpanded ? 'none' : 'table-row';
    toggleIcon.textContent = isExpanded ? '▼' : '▲';
  }
}