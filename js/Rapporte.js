// rapporte.js - 23.11.2025
let aktRapport = {};
let aktRapportid = " ";
let aktRapportname = " ";


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
            fileName: fileName
        });

        // 3. Erfolgsmeldung
        showPopup(`✅ "${result.name}" erfolgreich im Drive gespeichert!`);
        console.log("Drive-URL:", result.url);
        ladeRapporte();
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

    console.log(`---> zeigeRapporteTabelle: Angezeigte Rapporte: ${gefilterteRapportDaten.length}`);

    if (tabellenBereich) {
        const anzahlEintraege = gefilterteRapportDaten.length;
        
        // Header-Texte
        const ueberschriftRapporte = `Rapporte (${anzahlEintraege})`;
        const ueberschriftDatum = 'Änderungsdatum';
 
               
        // --- 2. Tabellenzeilen rendern ---
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
                let rapporthref = rapport.url;
                let rapportPreviewUrl = rapport.previewUrl; 
                let isArchived = rapport.archiv; 

                let rowClass = 'termin-row';
                if (isArchived) {
                    rowClass += ' archived-row'; // Grau
                } 
//                let deleteButton = `<button onclick="openOverlayDeleteRapport('${rapport}')" class="delete-btn" title="Rapport löschen">🗑️</button>`;
                let deleteButton = `<button onclick="openOverlayDeleteRapport('${rapportId}', '${rapportName}')" class="delete-btn" title="Rapport löschen">🗑️</button>`;
                let downloadBtn  = `<button onclick="downloadRapport('${rapporthref}', '${rapportName}')" class="download-btn" title="Rapport runterladen">⬇️</button>`;
                let previewBtn   = `<button onclick="openRapportPreview('${rapportPreviewUrl}')" class="preview-btn" title="Rapport Vorschau öffnen">👁️</button>`;
                tabellenHtml += `
                    <tr data-id="${rapportId}" data-index="${index}" class="${rowClass}">
                        <td data-field="Rapporte">${rapportName}</td>
                        <td data-field="Datum" >${rapportDate}</td>
                        <td class="action-cell"> 
                            ${deleteButton}
                            ${downloadBtn}
                            ${previewBtn}
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
        ladeRapporte();
        
    } catch (error) {
        console.error("Fehler beim Löschen:", error);
        showPopup(`❌ Fehler beim Löschen: `);
    }

    updateExportStatus ('rapportContainer', " ", false); 

}

//---------------------------------------------------------------------------------------------
function downloadRapport(url, name) {
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

// rapporte.js

//---------------------------------------------------------------------------------------------
function openRapportPreview(url) {
//---------------------------------------------------------------------------------------------
    console.log(`Öffne Vorschau für URL: ${url}`);
    
    // Die Drive-Vorschau-URL in einem neuen Tab öffnen
    // Die URL wird im Drive-Viewer geöffnet, der alle gängigen Dateiformate anzeigen kann.
    window.open(url, '_blank'); 
}

