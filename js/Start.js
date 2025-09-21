// "Start.js"  10.09.2025 ----------

  let alleAnmeldeDaten = []; // Variable, um alle abgerufenen AnmeldeDaten zu speichern
  let alleFunktionenCache = []; // Neue Variable für die Funktionen
  let aktuelleTerminIndex = 0;
  let verfuegbareTermine = []; // Wird beim Laden der Termine gefüllt
  let alleMitarbeiterDaten = [];
  let AktualisierungsStatus = [];
  let alleAnmeldeInfosCache = {}; // Objekt zum Speichern der Anmeldeinformationen
  let AktualisierungsStatusGeladen = false;
  let alleAnmeldeDatenGeladen = false;
  let alleAnmeldeInfosGeladen = false;
  let verfuegbareTermineGeladen = false;
  let alleFunktionenGeladen = false;
  let alleMitarbeiterDatenGeladen = false;

  let mitarbeiterSpaltennamenCache = null; 

  let currentAdmin = null;
  let isLoggedIn = false; // Neue Statusvariable
  let adminmail = " ";

  const hideText = " (Klicken zum Ausblenden)";
  const keineAngabeText = "(keine Angabe)";

  let TESTVERSION = false; // Standardwert

// -------------------------------------------------------------
// Init-Einstiegspunkt: wird nach loadAllSections() aufgerufen
// -------------------------------------------------------------
function initApp() {
  console.log("🚀 initApp gestartet");
  loadInitialData();
}

//---------------------------------------------------------------------------------------------
function apiCall(action, payload) {
//---------------------------------------------------------------------------------------------
  return new Promise((resolve, reject) => {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP-Fehler! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.error) {
        reject(new Error(data.error));
      } else {
        // Debug-Infos vorhanden?
        if (data && typeof data === "object" && "data" in data && "debug" in data) {
          if (Array.isArray(data.debug) && data.debug.length > 0) {
            console.groupCollapsed(`🔍 Debug: ${action}`);
            data.debug.forEach(msg => console.log(msg));
            console.groupEnd();
          }
          resolve(data.data); // nur den eigentlichen Wert zurückgeben
        } else {
          resolve(data); // normales Ergebnis (kein Debug-Modus)
        }
      }
    })
    .catch(error => {
      console.error("API-Anfrage fehlgeschlagen:", error);
      reject(error);
    });
  });
}


// ----------------------------------
apiCall('getTestversion', {})
  .then(versionFlag => {
    TESTVERSION = versionFlag;
    if (TESTVERSION) {
      const versionDivs = document.querySelectorAll('.version');
      versionDivs.forEach(div => {
        div.innerHTML += ' <span style="color:red;">(Testversion)</span>';
      });
    }
  })
  .catch(error => {
    console.error("Fehler beim Abrufen der Testversion:", error);
    // Hier kannst du eine Fehlermeldung auf der UI anzeigen
  });
// ----------------------------------


// ----------------------------------
function loadInitialData() {
// ----------------------------------
  document.getElementById("loading-overlay").classList.remove("hidden");

  setSpinnerState("spinner-wartung", true);
  apiCall('getWartungsStatus', {})
    .then(updateWartungsStatus)
    .catch(error => {
      console.error("Fehler beim Abrufen des Wartungsstatus:", error);
      setSpinnerState("spinner-wartung", false);
    });

  setSpinnerState("spinner-aktualisierung", true);
  apiCall('getAktualisierungsStatus', {})
    .then(initAktualisierungsStatus)
    .catch(error => {
      console.error("Fehler beim Abrufen des Aktualisierungsstatus:", error);
      setSpinnerState("spinner-aktualisierung", false);
    });

  setSpinnerState("spinner-termine", true);
  apiCall('getVerfuegbareTermine', {})
    .then(zeigeTermineImDropdownUndSetzeFlag)
    .catch(error => {
      console.error("Fehler beim Abrufen der Termine:", error);
      setSpinnerState("spinner-termine", false);
    });
    
  setSpinnerState("spinner-anmeldung", true);
  apiCall('getAnmeldeDaten', {})
    .then(speichereAlleAnmeldeDatenUndSetzeFlag)
    .catch(error => {
      console.error("Fehler beim Abrufen der Anmeldedaten:", error);
      setSpinnerState("spinner-anmeldung", false);
    });

  setSpinnerState("spinner-mitarbeiter", true);
  apiCall('getMitarbeiterDaten', {})
    .then(speichereAlleMitarbeiterDatenUndSetzeFlag)
    .catch(error => {
      console.error("Fehler beim Abrufen der Mitarbeiterdaten:", error);
      setSpinnerState("spinner-mitarbeiter", false);
    });
    
  setSpinnerState("spinner-funktionen", true);
  apiCall('getFunktionen', {})
    .then(speichereAlleFunktionenUndSetzeFlag)
    .catch(error => {
      console.error("Fehler beim Abrufen der Funktionen:", error);
      setSpinnerState("spinner-funktionen", false);
    });
    
  setSpinnerState("spinner-anmeldeInfos", true);
  apiCall('getAlleAnmeldeInfos', {})
    .then(speichereAlleAnmeldeInfosUndInitialisiere)
    .catch(error => {
      console.error("Fehler beim Abrufen der Anmeldeinfos:", error);
      setSpinnerState("spinner-anmeldeInfos", false);
    });
  
  ladeMitarbeiterSpaltennamen()
  
  }

// ----------------------------------
function zeigeTermineImDropdownUndSetzeFlag(termine) {
// ----------------------------------
  zeigeTermineImDropdown(termine);
  verfuegbareTermineGeladen = true;
  versucheInitialisiereAnzeige();
  setSpinnerState("spinner-termine", false);

}

// ----------------------------------
function speichereAlleAnmeldeDatenUndSetzeFlag(daten) {
// ----------------------------------
  console.log("speichereAlleAnmeldeDatenUndSetzeFlag:", daten);
  speichereAlleAnmeldeDaten(daten);
  alleAnmeldeDatenGeladen = true;
  versucheInitialisiereAnzeige();
  setSpinnerState("spinner-anmeldung", false);

}

// ----------------------------------
function speichereAlleMitarbeiterDatenUndSetzeFlag(daten) {
// ----------------------------------
  console.log("speichereAlleMitarbeiterDatenUndSetzeFlag:" + daten.length);
  console.log("speichereAlleMitarbeiterDatenUndSetzeFlag:", daten);

  speichereAlleMitarbeiterDaten(daten);
  alleMitarbeiterDatenGeladen = true;
  versucheInitialisiereAnzeige();
  setSpinnerState("spinner-mitarbeiter", false);

}

// ----------------------------------
function speichereAlleFunktionenUndSetzeFlag(funktionen) {
// ----------------------------------
  speichereAlleFunktionen(funktionen);
  alleFunktionenGeladen = true;
  versucheInitialisiereAnzeige();
  setSpinnerState("spinner-funktionen", false);

}


// ----------------------------------
function speichereAlleAnmeldeInfosUndInitialisiere(anmeldeInfos) {
// ----------------------------------
  speichereAlleAnmeldeInfos(anmeldeInfos);
  alleAnmeldeInfosGeladen = true;
  versucheInitialisiereAnzeige();
  setSpinnerState("spinner-anmeldeInfos", false);

}

// ----------------------------------
function versucheInitialisiereAnzeige() {
// ----------------------------------
  if (alleAnmeldeDatenGeladen && alleMitarbeiterDatenGeladen && alleAnmeldeInfosGeladen && verfuegbareTermineGeladen && alleFunktionenGeladen && AktualisierungsStatusGeladen) {

    initialisiereAnzeige(alleAnmeldeInfosCache);
    zeigeMitarbeiterTabelle(alleMitarbeiterDaten); 

    document.getElementById("loading-overlay").classList.add("hidden");
  }

  // 👇 Login-Overlay nach Laden sichtbar lassen
    if (isLoggedIn) {
      document.getElementById("adminLoginOverlay").style.display = "none";
    } else {
      document.getElementById("adminLoginOverlay").style.display = "flex";
    }

}

// ----------------------------------
function initialisiereAnzeige(anmeldeInfos) {
// ----------------------------------
  const terminAuswahl = document.getElementById("terminAuswahl");
  if (terminAuswahl && verfuegbareTermine.length > 0) {
    zeigeTabelleFuerTermin(alleAnmeldeDaten, verfuegbareTermine[0]); 
    updateTerminDropdown();
  }
}

// ----------------------------------
function speichereAlleAnmeldeDaten(daten) {
// ----------------------------------
  alleAnmeldeDaten = daten;
  console.log("Gespeicherte AnmeldeDaten:", alleAnmeldeDaten);
}

// ----------------------------------
function speichereAlleMitarbeiterDaten(daten) {
// ----------------------------------
  alleMitarbeiterDaten = daten;
  console.log("Gespeicherte MitarbeiterDaten:", alleMitarbeiterDaten);
}

// ----------------------------------
function speichereAlleAnmeldeInfos(anmeldeInfos) {
// ----------------------------------
  alleAnmeldeInfosCache = anmeldeInfos;
  console.log("speichereAlleAnmeldeInfos: Gespeicherte AnmeldeInfos:", alleAnmeldeInfosCache);
}

// ----------------------------------
function speichereAlleFunktionen(funktionen) {
// ----------------------------------
  alleFunktionenCache = funktionen;
  console.log("Gespeicherte Funktionen:", alleFunktionenCache);
}

// ----------------------------------
function initAktualisierungsStatus(status) {
// ----------------------------------
  AktualisierungsStatus = status;
  AktualisierungsStatusGeladen = true;
  console.log("--->initAktualisierungsStatus:", status);
  updateAktualisierungsStatus(status)
  setSpinnerState("spinner-aktualisierung", false);

}


// ----------------------------------
function updateWartungsStatus(status) {
// ----------------------------------
  const statusAnzeige = document.getElementById("wartungs-status-anzeige");
  const wartungsModusCheckbox = document.getElementById("wartungsModusCheckbox");

    if (status === "eingeschaltet") {
      statusAnzeige.textContent = "an  - Tabelle gesperrt";
      statusAnzeige.className = "eingeschaltet";
      wartungsModusCheckbox.checked = true; // Checkbox aktivieren
    } else {
      statusAnzeige.textContent = "aus - Tabelle offen";
      statusAnzeige.className = "ausgeschaltet";
      wartungsModusCheckbox.checked = false; // Checkbox deaktivieren
    }
  console.log("updateWartungsStatus:", status);
  setSpinnerState("spinner-wartung", false);

}

//-------------------------------------------------------------
function ladeMitarbeiterSpaltennamen() {
//-------------------------------------------------------------

    apiCall('getMitarbeiterSpaltennamen', {})
        .then(spaltennamen => {
      console.log("spaltennamen: ", spaltennamen.length, spaltennamen);
            mitarbeiterSpaltennamenCache = spaltennamen; // Speichere im Cache
      console.log("mitarbeiterSpaltennamenCache: ", mitarbeiterSpaltennamenCache.length, mitarbeiterSpaltennamenCache);

        })
        .catch(error => {
            console.error("Fehler beim Laden der Spaltennamen:", error);
        });
}


//-------------------------------------------------------------
function checkAdminLogin() {
//-------------------------------------------------------------
    const name = document.getElementById("adminNameInput").value.trim();
    const msgEl = document.getElementById("loginMessage");
    const btnEl = document.getElementById("adminLoginButton");

    // 1. Eingabe prüfen
    if (!name) {
        msgEl.textContent = "Bitte Anmeldename eingeben.";
        return;
    }

    // 2. Button und Spinner verwalten, bevor der Check beginnt
    msgEl.innerHTML = `Bitte warten, Anmeldung wird geprüft...`;
    btnEl.disabled = true;

    // 3. Prüfe, ob die Mitarbeiterdaten bereits geladen sind
    if (!alleMitarbeiterDatenGeladen) {
        // Wenn nicht, lade sie und rufe dann die eigentliche Prüf-Logik auf
        const interval = setInterval(() => {
            if (alleMitarbeiterDatenGeladen) {
                clearInterval(interval);
                performAdminLoginCheck(name, msgEl, btnEl);
            }
        }, 500);
    } else {
        // Daten sind schon geladen, führe den Check sofort aus
        performAdminLoginCheck(name, msgEl, btnEl);
    }
}

//-------------------------------------------------------------
function performAdminLoginCheck(name, msgEl, btnEl) {
//-------------------------------------------------------------
    // Button wieder aktivieren und Spinner entfernen
    btnEl.disabled = false;
    msgEl.innerHTML = ''; // Leere die Nachricht, um den Spinner zu entfernen

    // Suche nach Admin anhand von Anmeldename + Status enthält "admin"
    const admin = alleMitarbeiterDaten.find(m =>
        m.anmeldename &&
        m.anmeldename.toLowerCase() === name.toLowerCase() &&
        typeof m.status === "string" &&
        m.status.toLowerCase().includes("admin")
    );

    if (admin) {
        isLoggedIn = true; // Status auf "eingeloggt" setzen
        currentAdmin = admin;
        adminmail = admin.email || "";
        document.getElementById("adminLoginOverlay").style.display = "none";
        console.log("✅ Admin-Login erfolgreich:", admin);

        const adminIdentDiv = document.getElementById("adminIdent");
        if (adminIdentDiv) {
            adminIdentDiv.textContent = "angemeldet als: " + admin.vorname + " " + admin.nachname + ", " + admin.email;
        }

      } else {
        msgEl.textContent = "❌ Kein Admin-Zugang.";
        console.log("❌ Kein Admin-Zugang.", admin);
    }
}

