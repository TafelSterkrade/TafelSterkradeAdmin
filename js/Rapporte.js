// rapporte.js - 12.01.2026
let aktRapport = {};
let aktRapportid = " ";
let aktRapportname = " ";

let tempEditData = null; // Variable zum Zwischenspeichern für die Edit-Conflict-Nachfrage
let lastEditedId = null; // Speichert die ID der zuletzt bearbeiteten/erstellten Datei

const fileInput = document.getElementById('tagesrapport-upload-input');

if (fileInput) {
    // 1. Konsolenausgabe zur Bestätigung der Ausführung (sollte jetzt sofort kommen)
    console.log("SUCCESS: Input-Feld gefunden. Hänge Listener sofort an.");
    
    // 2. Listener anhängen
    fileInput.addEventListener('change', handleFileUpload);
} else {
    // 3. Fehler ausgeben, falls das Element nicht gefunden wurde
    console.error("FEHLER: Input-Feld (ID 'tagesrapport-upload-input') nicht im DOM gefunden! Prüfe HTML-ID.");
}

//---------------------------------------------------------------------------------------------
function initialisiereRapportJahrDropdown() {
//---------------------------------------------------------------------------------------------
    const yearSelect = document.getElementById("rapport-year-select");
    if (!yearSelect) return;

    const startJahr = 2025; // Das Jahr, in dem du mit der Struktur begonnen hast
    const endJahr = new Date().getFullYear() + 1; // Aktuelles Jahr + 1 (Vorsorge)
    
    yearSelect.innerHTML = ""; // Leeren

    for (let j = endJahr; j >= startJahr; j--) {
        const option = document.createElement("option");
        option.value = j.toString();
        option.text = j.toString();
        if (j.toString() === aktRapportJahr) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

//---------------------------------------------------------------------------------------------
async function handleFileUpload(event) {
//---------------------------------------------------------------------------------------------
    const file = event.target.files[0];
    console.log("handleFileUpload: ", file);

    if (!file) {
        showPopup("❌ Es wurde keine Datei ausgewählt.");
        return;
    }
    
    updateExportStatus('rapportContainer', `Datei wird hochgeladen...`, true);
    
    const fileName = file.name;
    const mimeType = file.type || "application/vnd.ms-excel"; // Fallback für .xls/.xlsx

    try {
        // 1. Datei als Base64-String lesen
        const base64Data = await readFileAsBase64(file);
        
        // 2. Base64-String an das Apps Script Backend senden
        const result = await apiCall('uploadTagesrapport', {
            base64Data: base64Data.split(',')[1], // Nur der eigentliche Base64-Teil
            mimeType: mimeType,
            fileName: fileName,
            year: aktRapportJahr 
        });

        // 3. Erfolgsmeldung
        showPopup(`✅ "${result.name}" erfolgreich im Drive gespeichert!`);
        console.log("Drive-URL:", result.url);
        ladeRapporte(true);
    } catch (error) {
        console.error("Fehler beim Hochladen:", error);
        showPopup(`❌ Fehler beim Hochladen: ${error.message}`);
    } finally {
        updateExportStatus('rapportContainer', ` `, false);

        event.target.value = ''; 
    }

}

//---------------------------------------------------------------------------------------------
function readFileAsBase64(file) {
//---------------------------------------------------------------------------------------------
// === Hilfsfunktion zum Lesen der Datei als Base64 ===
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            resolve(reader.result); // Gibt Base64-String zurück (inkl. Data-URL-Präfix)
        };
        
        reader.onerror = error => {
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

//----------------------------------
function zeigeRapporteTabelle(datenZumRendern) {
//----------------------------------
    const tabellenBereich = document.getElementById("rapporte-tabelle");

    // Die Basis ist IMMER der rapporteCache
    const basisDaten = datenZumRendern || rapporteCache || []; 
    let gefilterteRapportDaten = [...basisDaten]; 
    
    // Sortierung 
    //gefilterteRapportDaten.sort((a, b) => new Date(a.Rapporte) - new Date(b.Rapporte));
    console.log(`---> zeigeRapporteTabelle: Anzahl Raporte: ${rapporteCache[aktRapportJahr].length}`);
    console.log(`---> zeigeRapporteTabelle: Angezeigte Rapporte: ${gefilterteRapportDaten.length}`);

    if (tabellenBereich) {
        const anzahlRapporte = rapporteCache[aktRapportJahr].length;
        const anzahlEintraege = gefilterteRapportDaten.length;
        
        // Header-Texte
        const ueberschriftRapporte = `Rapporte (${anzahlEintraege} / ${anzahlRapporte})`;
        const ueberschriftDatum = 'Änderungsdatum';
 
        let tabellenHtml = `
            <table id="rapporte-data-table" class="editable-table">
                <thead>
                    <tr>
                        <th>${ueberschriftRapporte}</th>
                        <th>${ueberschriftDatum}</th>
                        <th>Aktionen</th> 
                    </tr>
                </thead>
                <tbody>
        `;

        if (gefilterteRapportDaten.length > 0) {
            gefilterteRapportDaten.forEach((rapport, index) => {
                let rapportId = rapport.id; 
                let rapportName = rapport.name; 
                let rapportDate = rapport.date;
                let rapporteditUrl = rapport.previewUrl; 
                let isArchived = rapport.archiv; 

                let rowClass = 'termin-row';
                if (isArchived) rowClass += ' archived-row';
                if (rapportName.includes("-edit")) rowClass += ' edit-version-row';

                if (lastEditedId && (rapportId === lastEditedId || rapportName === lastEditedId)) {
                    rowClass += ' row-success-flash';
                    console.log("DEBUG: Flash angewendet auf: " + rapportName);
                }

                let deleteButton = `<button onclick="openOverlayDeleteRapport('${rapportId}', '${rapportName}')" class="delete-btn" title="Rapport löschen">🗑️</button>`;
                let editBtn   = `<button onclick="editRapport('${rapportId}', '${rapportName}')" class="edit-btn" title="Rapport bearbeiten">✏️</button>`;

                tabellenHtml += `
                    <tr data-id="${rapportId}" data-index="${index}" class="${rowClass}">
                        <td data-field="Rapporte">${rapportName}</td>
                        <td data-field="Datum" >${rapportDate}</td>
                        <td class="action-cell"> 
                            ${deleteButton}
                            ${editBtn}
                        </td>
                    </tr>
                `;

             });

            } else {
            tabellenHtml += '<tr><td colspan="3" class="no-data-cell">Keine Rapporte verfügbar.</td></tr>';
        }

        tabellenHtml += `
                </tbody>
            </table>
        `;
        
        tabellenBereich.innerHTML = tabellenHtml;

    } else {
        console.warn("Element mit ID 'rapporte-tabelle' nicht gefunden.");
    }

    // --- VARIABLE ERST HIER ZURÜCKSETZEN (nachdem alles gerendert wurde) ---
    if (lastEditedId) {
        setTimeout(() => { 
            lastEditedId = null; 
            // Optional: Tabelle ohne Flash-Klasse neu rendern, damit sie beim Sortieren weg ist
        }, 4000);
    }
}

//---------------------------------------------------------------------------------------------
async function openOverlayDeleteRapport(rapportId, rapportName) {
//---------------------------------------------------------------------------------------------
    const overlay = document.getElementById("overlayRapportDelete");
    overlay.style.display = "flex";
    aktRapportid = rapportId;
    aktRapportname = rapportName;

    console.log(`---> openOverlayDeleteRapport:` + aktRapportname + aktRapportid);

    const meldung = document.getElementById('overlayRapportMeldung');
    meldung.textContent = `Soll "${rapportName}" gelöscht werden?`;

}
//---------------------------------------------------------------------------------------------
async function DeleteRapport() {
//---------------------------------------------------------------------------------------------
    closeOverlay('overlayRapportDelete')
    console.log(`---> DeleteRapport:` + aktRapportid + aktRapportname);

    updateExportStatus('rapportContainer', `"${aktRapportname}" wird gelöscht...`, true);

    try {
        const result = await apiCall('deleteTagesrapport', { fileId: aktRapportid, fileName: aktRapportname });
        showPopup(`✅ ${result.message}`);
        ladeRapporte(true);
        
    } catch (error) {
        console.error("Fehler beim Löschen:", error);
        showPopup(`❌ Fehler beim Löschen: `);
    }

    updateExportStatus ('rapportContainer', " ", false); 

}

//---------------------------------------------------------------------------------------------
async function editRapport(fileId, fileName) {
//---------------------------------------------------------------------------------------------

// Wenn es selbst schon eine "-edit" Datei ist, direkt öffnen
    if (fileName.includes("-edit")) {
        // Hier könnten wir auch fragen "Möchtest du weiter editieren?", 
        // aber meistens will man das ja, wenn man draufklickt.
        const file = rapporteCache[aktRapportJahr].find(f => f.id === fileId);
        window.open(file.previewUrl, '_blank');
        return;
    }

    // Trimmen, um versteckte Leerzeichen zu entfernen
    const cleanId = fileId.trim();
    console.log("DEBUG: Sende ID an Backend:", `|${cleanId}|`); // Die Striche helfen, Leerzeichen zu sehen
    updateExportStatus('rapportContainer', `Prüfe Dateistatus...${cleanId}`, true);

    try {
        const result = await apiCall('getOrCreateEditFile', { fileId: cleanId });
        updateExportStatus('rapportContainer', " ", false);

        if (result.exists) {
            // Nachfrage-Overlay anzeigen
            tempEditData = { originalId: cleanId, editUrl: result.editUrl };
            openEditConflictOverlay(fileName);
        } else {
            // Wurde gerade erst erstellt -> direkt öffnen
            lastEditedId = result.editName;
            window.open(result.editUrl, '_blank');
            ladeRapporte(true); // Liste neu laden, damit die neue -edit Datei erscheint
        }
    } catch (e) {
        console.error(e);
        showPopup("Fehler beim Vorbereiten der Edit-Datei");
    }
}

//---------------------------------------------------------------------------------------------
function openEditConflictOverlay(name) {
//---------------------------------------------------------------------------------------------
    const overlay = document.getElementById("overlayEditConflict");
    document.getElementById("editConflictMeldung").innerText = 
        `Für "${name}" existiert bereits eine bearbeitete Version.`;
    overlay.style.display = "flex";
}


//---------------------------------------------------------------------------------------------
async function handleEditChoice(choice) {
//---------------------------------------------------------------------------------------------
    closeOverlay('overlayEditConflict');
    
    // 1. Sofort ein leeres Fenster öffnen, damit der Browser den Popup-Blocker nicht aktiviert
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
        showPopup("⚠️ Popup-Blocker aktiv? Bitte erlauben.");
        return;
    }
    newWindow.document.write('<p style="font-family:sans-serif;">Rapport wird geladen...</p>');

    if (choice === 'continue') {
        // --- NEU: Namen aus der URL oder den tempEditData extrahieren ---
        // Da wir im Overlay den Namen nicht direkt haben, nehmen wir ihn aus tempEditData
        // Falls du dort nur die URL hast, müssen wir ihn über den Cache suchen:
        const allFiles = rapporteCache[aktRapportJahr] || [];
        const editFile = allFiles.find(f => f.previewUrl === tempEditData.editUrl);
        if (editFile) lastEditedId = editFile.name;

        newWindow.location.href = tempEditData.editUrl;
        ladeRapporte(true); // Liste neu laden, um Effekt zu zeigen
    } 
    else if (choice === 'overwrite') {
        updateExportStatus('rapportContainer', "Erstelle neue Arbeitskopie...", true);
        
        try {
            const result = await apiCall('overwriteEditFile', { originalFileId: tempEditData.originalId });
            
            if (result && result.editUrl) {
                // Dem bereits offenen Fenster die neue URL zuweisen
                newWindow.location.href = result.editUrl;
                
                lastEditedId = result.editName; // Wir merken uns den Namen der Edit-Datei für den Flash-Effekt
                console.log("DEBUG: Setze lastEditedId auf:", lastEditedId);
    
                // Warte kurz mit dem Laden, bis das neue Fenster sicher offen ist
                setTimeout(() => {
                    ladeRapporte(true);
                }, 500);

                // Lösche die Markierung erst nach 10 Sekunden komplett, 
                // damit sie auch bei langsamen Netzwerk-Antworten noch da ist
                setTimeout(() => { lastEditedId = null; }, 10000);


            } else {
                newWindow.close();
                showPopup("Fehler: URL nicht erhalten.");
            }
        } catch (error) {
            newWindow.close();
            console.error("Fehler beim Überschreiben:", error);
            showPopup("Fehler: Arbeitskopie konnte nicht erstellt werden.");
        } finally {
            updateExportStatus('rapportContainer', " ", false);
        }
    }
}

//----------------------------------
function filterRapporte() {
//----------------------------------
    const showOriginal = document.getElementById("filter-original").checked;
    const showEdit = document.getElementById("filter-edit").checked;
    
    // Wir nehmen die Daten aus dem Cache des aktuell gewählten Jahres
    const basisDaten = rapporteCache[aktRapportJahr] || [];
    
    const gefilterteDaten = basisDaten.filter(rapport => {
        const istEdit = rapport.name.includes("-edit");
        
        if (istEdit && showEdit) return true;      // Zeige bearbeitete, wenn Checkbox aktiv
        if (!istEdit && showOriginal) return true; // Zeige originale, wenn Checkbox aktiv
        
        return false;
    });

    // Die Tabelle mit den gefilterten Daten neu zeichnen
    zeigeRapporteTabelle(gefilterteDaten);
}


//---------------------------------------------------------------------------------------------
function xxxdownloadRapport(url, name) {
//---------------------------------------------------------------------------------------------
    console.log(`Starte Download für: ${name} (URL: ${url})`);
    // 1. Temporäres Link-Element erstellen
    const link = document.createElement('a');
    link.href = url;
    
    // 2. Den Dateinamen für den Download festlegen (damit der Browser ihn als Standardnamen verwendet)
    link.download = name; 
    
    // 3. Link dem DOM hinzufügen, klicken und wieder entfernen
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showPopup(`✅ Download von "${name}" gestartet.`);
}
