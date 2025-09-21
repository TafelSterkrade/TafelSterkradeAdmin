// ExportMitarbeiter.js - 17.09.2025 (Überarbeitet)

//----------------------------------
function openExportMitarbeiterOverlay() {
//----------------------------------
// Öffnet das Overlay für den Mitarbeiter-Export und lädt die Spaltennamen.

    const overlay = document.getElementById('overlayMitarbeiter');
    overlay.style.display = 'flex';
    
    updateExportStatus('mitarbeiterStatusContainer', '', false);

    // Prüfe, ob die Spaltennamen bereits im Cache sind
    if (mitarbeiterSpaltennamenCache) {
        console.log("Lade Spaltennamen aus Cache.");
        erstelleSpaltenCheckboxes(mitarbeiterSpaltennamenCache);
    } else {
        console.log("Lade Spaltennamen vom Server.");
        ladeMitarbeiterSpaltennamen();
        erstelleSpaltenCheckboxes(mitarbeiterSpaltennamenCache);
    }
}

//----------------------------------
function closeOverlayMitarbeiter() {
//----------------------------------
    document.getElementById('overlayMitarbeiter').style.display = 'none';
}

//-------------------------------------------------------------
function erstelleSpaltenCheckboxes(spaltennamen) {
//-------------------------------------------------------------
    const container = document.getElementById('column-selection-container');
    container.innerHTML = ''; // Container leeren

      console.log("erstelleSpaltenCheckboxes: ", spaltennamen);
    if (!spaltennamen || spaltennamen.length === 0) {
        container.innerHTML = `<p>Keine Spaltennamen gefunden.</p>`;
        return;
    }

    spaltennamen.forEach(spalte => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="mitarbeiter-spalte" value="${spalte}" checked> ${spalte}`;
        container.appendChild(label);
    });
}

//----------------------------------
function exportMitarbeiter(exportType) {
//----------------------------------
    const selectedCheckboxes = document.querySelectorAll('#column-selection-container input[type="checkbox"]:checked');
    const selectedColumns = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedColumns.length === 0) {
        showPopup("Bitte wählen Sie mindestens eine Spalte aus.");
        return;
    }
            console.log("exportMitarbeiter, selectedSpalten:", selectedColumns);

 // Erstelle den Range-String
    const exportRanges = buildRange(selectedColumns);            
            console.log("exportMitarbeiter, exportRanges:", exportRanges);

    if (exportType === 'pdf') {
        exportMitarbeiter2PdfAndDownload(exportRanges);
    } else if (exportType === 'xlsx') {
        exportMitarbeiter2XlsxAndSendMail(exportRanges);
    }
    
}

//----------------------------------
function exportMitarbeiter2PdfAndDownload(exportRanges) {
//----------------------------------
    updateExportStatus('mitarbeiterStatusContainer', `"Mitarbeiter.pdf" wird erstellt...`, true);

    console.log("exportMitarbeiter2PdfAndDownload, exportRanges:", exportRanges);

    apiCall('exportMitarbeiterRangesToPdfAndDownload', {ranges: exportRanges})
    .then(downloadUrl => {
        console.log("exportMitarbeiter2PdfAndDownload, downloadUrl:", downloadUrl);
        updateExportStatus('mitarbeiterStatusContainer', "", false); // Spinner ausblenden
        if (downloadUrl.startsWith("http")) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.textContent = `"Mitarbeiter.pdf" herunterladen`;
          link.target = '_blank';
          link.download = `Mitarbeiter.pdf`;
          document.getElementById('mitarbeiterStatusContainer').querySelector('p').appendChild(link);
        } else {
          document.getElementById('mitarbeiterStatusContainer').querySelector('p').textContent = downloadUrl;
        }
    })
    .catch(error => {
        console.error(`Fehler beim Erstellen der PDF-Datei `, error);
        updateExportStatus('mitarbeiterStatusContainer', `Fehler beim Erstellen der PDF-Datei.`, false);
    });

}

//----------------------------------
function exportMitarbeiter2XlsxAndSendMail(exportRanges) {
//----------------------------------
    const usermail = adminmail

    updateExportStatus('mitarbeiterStatusContainer', `"Mitarbeiter.xlsx" wird erstellt...`, true);

    console.log("exportMitarbeiter2XlsxAndSendMail, exportRanges:", exportRanges);

    apiCall('exportMitarbeiterRangesToXlsxAndSendMail', {ranges: exportRanges, usermail: usermail})
    .then(function(mailsuccess) {
        updateExportStatus('mitarbeiterStatusContainer', mailsuccess.message, false);
    })
    .catch(function(error) {
        console.error(`Fehler beim E-Mail-Versand der XLSX-Datei `, error);
        updateExportStatus('mitarbeiterStatusContainer', `Fehler beim E-Mail-Versand der XLSX-Datei `, false);
    });
}

//----------------------------------
function convertIndexToColumnLetter(colIndex) {
//----------------------------------
/**
 * Konvertiert eine Spaltennummer (1-basiert) in den entsprechenden Buchstaben-String (A, B, C, ...).
 * @param {number} colIndex Die Spaltennummer (z.B. 1 für 'A').
 * @returns {string} Der Spaltenbuchstabe.
 */

    let temp, letter = '';
    while (colIndex > 0) {
        temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = Math.floor((colIndex - 1) / 26);
    }
    return letter;
}


//----------------------------------
function buildRange(selectedColumns) {
//----------------------------------
/**
 * Erstellt einen optimierten Range-String aus einem Array ausgewählter Spaltennamen.
 * @param {Array<string>} selectedColumns Ein Array der ausgewählten Spaltennamen.
 * @returns {Array<string>} Ein Array von Range-Strings, z.B. ["C:D", "F", "H"].
 */
    if (!selectedColumns || selectedColumns.length === 0) {
        return [];
    }

    // Holen des gecachten Arrays mit Spaltennamen
    const allColumns = mitarbeiterSpaltennamenCache;
    if (!allColumns) {
        console.error("Spaltennamen-Cache nicht geladen.");
        return [];
    }

    // Erstellt ein Mapping von Spaltennamen zu ihren 1-basierten Indizes
    const columnIndexMap = new Map();
    allColumns.forEach((name, index) => {
        columnIndexMap.set(name, index + 1);
    });

    // Wandelt die ausgewählten Spaltennamen in ihre Indizes um und sortiert sie
    const selectedIndices = selectedColumns.map(name => columnIndexMap.get(name)).sort((a, b) => a - b);

    const ranges = [];
    let start = selectedIndices[0];
    let end = selectedIndices[0];

    for (let i = 1; i < selectedIndices.length; i++) {
        if (selectedIndices[i] === end + 1) {
            end = selectedIndices[i]; // Teil eines zusammenhängenden Bereichs
        } else {
            // Bereich abschließen und neuen starten
            if (start === end) {
                ranges.push(convertIndexToColumnLetter(start));
            } else {
                ranges.push(`${convertIndexToColumnLetter(start)}:${convertIndexToColumnLetter(end)}`);
            }
            start = selectedIndices[i];
            end = selectedIndices[i];
        }
    }

    // Letzten Bereich hinzufügen
    if (start === end) {
        ranges.push(convertIndexToColumnLetter(start));
    } else {
        ranges.push(`${convertIndexToColumnLetter(start)}:${convertIndexToColumnLetter(end)}`);
    }

    return ranges;
}