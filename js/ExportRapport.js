// ExportRapport.js - 21.11.2025
let Anmeldungen = [];
let Abmeldungen = []; 
let OhneMeldung = []; 
let abmeldungenText = " "; 
let aktTermin = " "; 

//----------------------------------
function openOverlayRapportCreate() {
//----------------------------------
    const overlay = document.getElementById("overlayRapportCreate");
    overlay.style.display = "flex";

    updateExportStatus('rapportExportContainer', "", false); 

    ladeTagesrapportTermine();
}

//----------------------------------
function ladeTagesrapportTermine() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    terminAuswahl.innerHTML = "<option value=''>-- Bitte wählen --</option>";

    if (!verfuegbareTermine || verfuegbareTermine.length === 0) {
        document.getElementById("TagesrapportInfo").textContent = "Keine Termine verfügbar.";
        return;
    }

    verfuegbareTermine.forEach((termin, index) => {
        const option = document.createElement("option");
        option.value = termin;
        option.textContent = termin;
        terminAuswahl.appendChild(option);
    });

    if (verfuegbareTermine.length > 0) {
        terminAuswahl.value = verfuegbareTermine[0];
        updateTagesrapport();
    }

    terminAuswahl.removeEventListener("change", updateTagesrapport);
    terminAuswahl.addEventListener("change", updateTagesrapport);
}

//----------------------------------
function updateTagesrapport() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    const ausgewaehlterTermin = terminAuswahl.value;
    aktTermin = terminAuswahl.value;
    console.log("-----updateTagesrapport--->  ", aktTermin);

    updateAnmeldungen();
    updateTagesrapportTabelle();
    updateTagesrapportInfo();

}

//----------------------------------
function updateAnmeldungen() {
//----------------------------------
    // Neue Arrays für die An-, Abmeldungen und Personen ohne Meldung
    Anmeldungen = [];
    Abmeldungen = []; 
    OhneMeldung = [];
    abmeldungenText = " "; 
    
    const terminIndexImArray = verfuegbareTermine.indexOf(aktTermin);
    if (terminIndexImArray === -1) {
        return;
    }

    const funktionsSchluessel = `funktion${terminIndexImArray + 1}`;
    
    const datenFuerTermin = alleAnmeldeDaten.filter(person => {
        return person.name; 
    });

    // 1. Aufteilung in Anmeldungen, Abmeldungen und OhneMeldung
    datenFuerTermin.forEach(person => {
        // Funktion abrufen und mögliche Leerzeichen entfernen. Wenn Feld fehlt/null/undefined, ist es "".
        const funktion = person[funktionsSchluessel] ? String(person[funktionsSchluessel]).trim() : "";
        
        const anmeldeObjekt = {
            name: person.name,
            funktion: funktion
        };

        if (funktion === "") {
            // Wenn die Funktion ein leerer String ist (impliziert "noch keine Meldung")
            OhneMeldung.push(anmeldeObjekt);
        } else if (funktion.toLowerCase() === "abwesend") {
            // Wenn die Funktion "abwesend" ist
            Abmeldungen.push(anmeldeObjekt);
        } else {
            // Alle anderen (gültigen) Funktionen
            Anmeldungen.push(anmeldeObjekt);
        }
    });

    // 2. Sortieren des Anmeldungen-Arrays nach Funktion
    Anmeldungen.sort((a, b) => {
        const funktionA = a.funktion.toUpperCase();
        const funktionB = b.funktion.toUpperCase();
        
        if (funktionA < funktionB) {
            return -1;
        }
        if (funktionA > funktionB) {
            return 1;
        }
        // Optional: Sekundäre Sortierung nach Name, wenn Funktionen gleich sind
        if (a.name.toUpperCase() < b.name.toUpperCase()) {
            return -1;
        }
        if (a.name.toUpperCase() > b.name.toUpperCase()) {
            return 1;
        }
        return 0;
    });

    abmeldungenText = Abmeldungen.length + " Abmeldungen, " + OhneMeldung.length + " Ohne Meldung";

    console.log("Sortierte Anmeldungen:", Anmeldungen);
    console.log("Abmeldungen (abwesend):", Abmeldungen);
    console.log("Ohne Meldung (leere Funktion):", OhneMeldung);

    return ;
}

//----------------------------------
function updateTagesrapportTabelle() {
//----------------------------------
    const anmeldungenTable = document.getElementById("scrollboxAnmeldungen-table");
    anmeldungenTable.innerHTML = "";

    if (!aktTermin || !alleAnmeldeDaten || alleAnmeldeDaten.length === 0) {
        anmeldungenTable.innerHTML = "<tr><td colspan='2'>Keine Daten verfügbar.</td></tr>";
        return; 
    }

    const terminIndexImArray = verfuegbareTermine.indexOf(aktTermin);
    if (terminIndexImArray === -1) {
        anmeldungenTable.innerHTML = "<tr><td colspan='2'>Termin nicht gefunden.</td></tr>";
        return;
    }

    const tbody = document.createElement('tbody');
    fülleRapportTabelle  (Anmeldungen, tbody, `Anmeldungen: ${alleAnmeldeInfosCache[aktTermin].helferAnzahl}`, 'rapport-anmeldungen');
    fülleRapportTabelle  (Abmeldungen, tbody, `Ameldungen: ${Abmeldungen.length}`, 'rapport-abmeldungen');
    fülleRapportTabelle  (OhneMeldung, tbody, `Ohne Meldungen: ${OhneMeldung.length}`, 'rapport-ohne-meldung');

    anmeldungenTable.appendChild(tbody);
 
    return;
}

//----------------------------------
function fülleRapportTabelle (meldungen, tbody, titel, cssClass) {
//----------------------------------
    
    // 1. Titelzeile erstellen und formatieren
    const titlerow = document.createElement("tr");
    
    // Anwenden der Kategorien-Klasse für den Hintergrund der Titelzeile
    titlerow.classList.add(cssClass);
    
    // Erstellen des Titels mit colspan=2, um die ganze Zeile einzunehmen
    // und der Klasse 'rapport-titel' für Fett/Unterstrichen.
    const titelCell = document.createElement("td");
    titelCell.setAttribute("colspan", "2");
    titelCell.classList.add('rapport-titel');
    titelCell.textContent = titel; 
    
    titlerow.appendChild(titelCell);
    tbody.appendChild(titlerow);
    
    // 2. Datenzeilen erstellen
    meldungen.forEach(item => {
        const row = document.createElement("tr");
        
        // Anwenden der Kategorien-Klasse für den Hintergrund jeder Zeile
        row.classList.add(cssClass); 
        
        row.innerHTML = `<td>${item.name}</td><td>${item.funktion}</td>`;
        tbody.appendChild(row);
    });
 
    return;
}

//----------------------------------
function updateTagesrapportInfo() {
//----------------------------------
    const tagesrapportInfo = document.getElementById("TagesrapportInfo");
    const anmeldungenInfo = document.getElementById("TagesrapportAnmeldungenInfo");
    const abmeldungenInfo = document.getElementById("TagesrapportAbmeldungenInfo");

    if (alleAnmeldeInfosCache[aktTermin] && alleAnmeldeInfosCache[aktTermin].helferAnzahl !== undefined) {
        tagesrapportInfo.textContent = `Anmeldungen am ${aktTermin}: ${alleAnmeldeInfosCache[aktTermin].helferAnzahl} Helfer`;
    } else {
        tagesrapportInfo.textContent = `Anmeldungen am ${aktTermin}: 0 Helfer`;
    }

    anmeldungenInfo.textContent = alleAnmeldeInfosCache[aktTermin].anmeldungInfo;
    abmeldungenInfo.textContent = abmeldungenText;


    updateExportStatus ('rapportExportContainer', "", false); 
  }

//----------------------------------
function zeigeVorherigenTagesrapportTermin() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    let currentIndex = verfuegbareTermine.indexOf(terminAuswahl.value);

    if (currentIndex > 0) {
        currentIndex--;
        terminAuswahl.value = verfuegbareTermine[currentIndex];
        updateTagesrapport();
    }
}

//----------------------------------
function zeigeNaechstenTagesrapportTermin() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    let currentIndex = verfuegbareTermine.indexOf(terminAuswahl.value);

    if (currentIndex < verfuegbareTermine.length - 1) {
        currentIndex++;
        terminAuswahl.value = verfuegbareTermine[currentIndex];
        updateTagesrapport();    
    }
}

//-----------------------------------------------
function updateExportStatus(containerId, message, showSpinner) {
//-----------------------------------------------
/**
 * Zeigt einen Status-Spinner und eine Meldung an.
 * @param {string} containerId - ID des Containers für die Statusmeldung.
 * @param {string} message - Die anzuzeigende Nachricht.
 * @param {boolean} showSpinner - Ob der Spinner angezeigt werden soll.
 */
    const container = document.getElementById(containerId);
    const textElement = container.querySelector('p');
    const spinnerElement = container.querySelector('.spinner');

    if (!container || !textElement || !spinnerElement) {
        console.error("Export-Status-Container-Elemente nicht gefunden:", containerId);
        return;
    }

    textElement.textContent = message;
    if (showSpinner) {
        spinnerElement.classList.remove('hidden');
    } else {
        spinnerElement.classList.add('hidden');
    }
}

// ----------------------------------
function buildAbmeldeInfo(Abmeldungen) {
// ----------------------------------
    // Sicherstellen, dass der Cache und der Index gültig sind
    if (!Abmeldungen) {
        console.error("Cache oder Terminindex für Abmeldungen ungültig.");
        return "Keine Abmeldungsdaten verfügbar";
    }

    const terminAbmeldungen = Abmeldungen;
    let countAbwesend = 0;
    let countOhneMeldung = 0;

    terminAbmeldungen.forEach(meldung => {
        // Die Funktion ist "abwesend" (explizite Abmeldung)
        if (meldung.funktion.toLowerCase() === "abwesend") {
            countAbwesend++;
        } 
        // Die Funktion ist "" (leer, implizite Abmeldung)
        else if (meldung.funktion === "") {
            countOhneMeldung++;
        }
    });

    // Erstelle die Infostücke
    const abwesendText = `${countAbwesend} Abmeldung${countAbwesend !== 1 ? 'en' : ''}`;
    const ohneMeldungText = `${countOhneMeldung} ohne Meldung`;

    return `${abwesendText}, ${ohneMeldungText}`;
}

//-----------------------------------------------
function formatName(name) {
//-----------------------------------------------
/**
 * Formatiert den Namen von "Nachname, Vorname" zu "Vorname Nachname".
 * @param {string} name - Der Name im Format "Nachname, Vorname".
 * @returns {string} Der Name im Format "Vorname Nachname".
 */

if (!name || name.indexOf(',') === -1) {
        return name; // Rückgabe wie erhalten, falls Format unbekannt
    }
    const parts = name.split(',').map(s => s.trim());
    // Das erste Element ist Nachname (parts[0]), das zweite Vorname (parts[1])
    return `${parts[1]} ${parts[0]}`;
}

//-----------------------------------------------
function buildAbmeldeListe(Abmeldungen) {
//-----------------------------------------------
    if (!Abmeldungen || Abmeldungen.length === 0) {
        return []; // Wichtig: Leeres Array zurückgeben
    }

    const abwesendeNamen = Abmeldungen
        .filter(meldung => meldung.funktion.toLowerCase() === "abwesend")
        .map(meldung => formatName(meldung.name));
    
    // Konfigurierbare Anzahl von Namen pro Zeile
    const NAMES_PER_LINE = 4; 
    const resultLists = []; // Das neue Array von Strings

    let currentList = [];
    
    // Durchlaufe alle formatierten Namen
    abwesendeNamen.forEach((name, index) => {
        currentList.push(name);
        
        // Wenn wir NAMES_PER_LINE erreicht haben ODER der letzte Name erreicht ist
        if (currentList.length === NAMES_PER_LINE || index === abwesendeNamen.length - 1) {
            // Füge die aktuelle Liste als kommaseparierten String dem Ergebnis-Array hinzu
            resultLists.push([currentList.join(', ')]); // Muss ein 2D-Array [["Liste"]] sein für setValues
            currentList = []; // Liste für die nächste Zeile zurücksetzen
        }
    });

    // Wir geben nun ein 2D-Array von Listen zurück: [["Name1, Name2, Name3, Name4"], ["Name5, Name6", ...]]
    return resultLists; 
}

//-----------------------------------------------
function createRapportAndExport(exportType) {
//-----------------------------------------------

    updateExportStatus ('rapportExportContainer', "Tagesrapport wird erstellt...", true); 

    const abmeldeListen = buildAbmeldeListe(Abmeldungen);
    const anmeldungen = Anmeldungen;

    const rapportname = createRapportName(aktTermin);
    console.log("createRapportAndExport:", aktTermin, rapportname);


    apiCall('updateSheetRapportMeldungen', {
        termin: aktTermin,
        anmeldungen: anmeldungen,
        abmeldungen: abmeldeListen
    })
    .then(response => {
//console.log("Rapport erfolgreich erstellt:", response);
        updateExportStatus ('rapportExportContainer', "Tagesrapport wurde erstellt...", false); 
//        const rapportname = "Rapport " + aktTermin;

        if (exportType === 'pdf') {
            exportRapport2PdfAndDownload(rapportname);
        } else if (exportType === 'xlsx') {
            exportRapport2XlsxAndSendMail(rapportname);
        }
    })
    .catch(error => {
        updateExportStatus ('rapportExportContainer', "Fehler beim Erstellen des Rapports:", false); 
    });

}

//-----------------------------------------------
function exportRapport2PdfAndDownload(rapportname) {
//-----------------------------------------------
    const sheetRapport = "Tagesrapport";
    const pdfname = rapportname + ".pdf";
    const rapportoptions = { hideGridlines: true };

    updateExportStatus('rapportExportContainer', `"${pdfname}" wird erstellt...`, true);

    apiCall('exportSheetToPdfAndGetLink', {
      sheetName: sheetRapport,
      options: {file: pdfname, options: rapportoptions}
    })
    .then(function(downloadUrl) {
      updateExportStatus('rapportExportContainer', "", false); // Spinner ausblenden

      if (downloadUrl.startsWith("http")) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.textContent = `Klicken zum Herunterladen: "` + pdfname + `"`;
        link.target = '_blank';
        link.download = `pdfname`;
        document.getElementById('rapportExportContainer').querySelector('p').appendChild(link);
      } else {
        document.getElementById('rapportExportContainer').querySelector('p').textContent = downloadUrl;
      }
    })
    .catch(error => {
        console.error(`Fehler beim Erstellen der PDF-Datei für ${pdfname}:`, error);
        updateExportStatus('rapportExportContainer', `Fehler beim Erstellen der PDF-Datei für ${pdfname}.`, false);
    });
}

//-----------------------------------------------
function exportRapport2XlsxAndSendMail(rapportname) {
//-----------------------------------------------
    const usermail = adminmail
    const sheetName = "Tagesrapport";
    const filename = rapportname + ".xlsx";

    updateExportStatus('rapportExportContainer', `"${filename}" wird per E-Mail versandt...`, true);
      console.log("sendmailXLSRapport:", sheetName, filename, usermail);

      apiCall('exportSheetToXlsxAndSendMail', { sheetName, filename, usermail })
    .then(function(mailsuccess) {
        updateExportStatus('rapportExportContainer', mailsuccess.message, false);
    })
    .catch(function(error) {
        updateExportStatus('rapportExportContainer', `Fehler beim E-Mail-Versand der XLSX-Datei `, false);
    });

}
//-----------------------------------------------
function createRapportName(dateStringDE) {
//-----------------------------------------------
    dateStringISO = changeDateDEtoISO(dateStringDE);
    dateStringKW = changeDateISOtoKW(dateStringISO);
    return `Rapport ${dateStringKW} (${dateStringDE})`
}


