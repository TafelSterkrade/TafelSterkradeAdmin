// Rapport.js - 16.09.2025 (Überarbeitet)

//----------------------------------
function openExportTagesrapportOverlay() {
//----------------------------------
    const overlay = document.getElementById("overlayRapport");
    overlay.style.display = "flex";

    updateExportStatus('rapportStatusContainer', "", false); 

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
        const ausgewaehlterTermin = verfuegbareTermine[0];
        updateTagesrapportInfo();
        fuelleAnmeldungsTabelleImOverlay(ausgewaehlterTermin);
    }

    terminAuswahl.removeEventListener("change", handleTerminAuswahlChange);
    terminAuswahl.addEventListener("change", handleTerminAuswahlChange);
}

//----------------------------------
function handleTerminAuswahlChange() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    const ausgewaehlterTermin = terminAuswahl.value;

    updateTagesrapportInfo();
    fuelleAnmeldungsTabelleImOverlay(ausgewaehlterTermin);
}

//----------------------------------
function updateTagesrapportInfo() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    const tagesrapportInfo = document.getElementById("TagesrapportInfo");
    const ausgewaehlterTermin = terminAuswahl.value;

    if (alleAnmeldeInfosCache[ausgewaehlterTermin] && alleAnmeldeInfosCache[ausgewaehlterTermin].helferAnzahl !== undefined) {
        tagesrapportInfo.textContent = `Anmeldungen am ${ausgewaehlterTermin}: ${alleAnmeldeInfosCache[ausgewaehlterTermin].helferAnzahl} Helfer`;
    } else {
        tagesrapportInfo.textContent = `Anmeldungen am ${ausgewaehlterTermin}: 0 Helfer`;
    }

    updateExportStatus ('rapportStatusContainer', "", false); 

  }

//----------------------------------
function zeigeVorherigenTagesrapportTermin() {
//----------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    let currentIndex = verfuegbareTermine.indexOf(terminAuswahl.value);

    if (currentIndex > 0) {
        currentIndex--;
        terminAuswahl.value = verfuegbareTermine[currentIndex];
        updateTagesrapportInfo();
        fuelleAnmeldungsTabelleImOverlay(verfuegbareTermine[currentIndex]);
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
        updateTagesrapportInfo();
        fuelleAnmeldungsTabelleImOverlay(verfuegbareTermine[currentIndex]);
    }
}

//----------------------------------
function fuelleAnmeldungsTabelleImOverlay(termin) {
//----------------------------------
    const anmeldungenTable = document.getElementById("scrollboxAnmeldungen-table");
    anmeldungenTable.innerHTML = "";

    if (!termin || !alleAnmeldeDaten || alleAnmeldeDaten.length === 0) {
        anmeldungenTable.innerHTML = "<tr><td colspan='2'>Keine Daten verfügbar.</td></tr>";
        return;
    }

    const terminIndexImArray = verfuegbareTermine.indexOf(termin);
    if (terminIndexImArray === -1) {
        anmeldungenTable.innerHTML = "<tr><td colspan='2'>Termin nicht gefunden.</td></tr>";
        return;
    }
    const funktionsSchluessel = `funktion${terminIndexImArray + 1}`;
    
    const gefilterteDaten = alleAnmeldeDaten.filter(person => {
        const funktion = person[funktionsSchluessel] ? person[funktionsSchluessel].trim() : '';
        return funktion !== '';
    });

    const tbody = document.createElement('tbody');

    gefilterteDaten.forEach(person => {
        const funktion = person[funktionsSchluessel] || "";
        const row = document.createElement("tr");
        row.innerHTML = `<td>${person.name}</td><td>${funktion}</td>`;
        tbody.appendChild(row);
    });

    anmeldungenTable.appendChild(tbody);
}

//----------------------------------
function closeOverlayRapport() {
//----------------------------------
    document.getElementById("overlayRapport").style.display = "none";
}



//-----------------------------------------------
function createRapportAndExport(exportType) {
//-----------------------------------------------
    const terminAuswahl = document.getElementById("tagesrapportTerminAuswahl");
    const ausgewaehlterTermin = terminAuswahl.value;

    if (!ausgewaehlterTermin) {
        showPopup("Bitte wählen Sie einen Termin für den Tagesrapport aus.");
        return;
    }

    updateExportStatus ('rapportStatusContainer', "Tagesrapport wird erstellt...", true); 

    apiCall('createTagesrapport', { termin: ausgewaehlterTermin })
        .then(result => {
            updateExportStatus ('rapportStatusContainer', "Tagesrapport erstellt...", false); 

            const rapportname = "Rapport " + ausgewaehlterTermin;

            // Je nach exportType die entsprechende Funktion aufrufen
            if (exportType === 'pdf') {
                exportRapport2PdfAndDownload(rapportname);
            } else if (exportType === 'xlsx') {
                exportRapport2XlsxAndSendMail(rapportname);
            }
        })
        .catch(error => {
            updateExportStatus ('rapportStatusContainer', "Fehler beim Erstellen des Tagesrapports.", false); 
        });
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

//-----------------------------------------------
function exportRapport2PdfAndDownload(rapportname) {
//-----------------------------------------------
    const sheetRapport = "Tagesrapport";
    const pdfname = rapportname + ".pdf";
    const rapportoptions = { hideGridlines: true };

    updateExportStatus('rapportStatusContainer', `"${pdfname}" wird erstellt...`, true);

    apiCall('exportSheetToPdfAndGetLink', {
      sheetName: sheetRapport,
      file: pdfname,
      options: rapportoptions
    })
    .then(function(downloadUrl) {
      updateExportStatus('rapportStatusContainer', "", false); // Spinner ausblenden

      if (downloadUrl.startsWith("http")) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.textContent = `Klicken zum Herunterladen: "` + pdfname + `"`;
        link.target = '_blank';
        link.download = `pdfname`;
        document.getElementById('rapportStatusContainer').querySelector('p').appendChild(link);
      } else {
        document.getElementById('rapportStatusContainer').querySelector('p').textContent = downloadUrl;
      }
    })
    .catch(error => {
        console.error(`Fehler beim Erstellen der PDF-Datei für ${pdfname}:`, error);
        updateExportStatus('rapportStatusContainer', `Fehler beim Erstellen der PDF-Datei für ${pdfname}.`, false);
    });
}

//-----------------------------------------------
function exportRapport2XlsxAndSendMail(rapportname) {
//-----------------------------------------------
    const usermail = adminmail
    const sheetName = "Tagesrapport";
    const filename = rapportname + ".xlsx";

    updateExportStatus('rapportStatusContainer', `"${filename}" wird per E-Mail versandt...`, true);
      console.log("sendmailXLSRapport:", sheetName, filename, usermail);

      apiCall('exportSheetToXlsxAndSendMail', { sheetName, filename, usermail })
    .then(function(mailsuccess) {
        updateExportStatus('rapportStatusContainer', mailsuccess.message, false);
    })
    .catch(function(error) {
        updateExportStatus('rapportStatusContainer', `Fehler beim E-Mail-Versand der XLSX-Datei `, false);
    });

}

