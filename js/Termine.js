// "Termine.js" 11.05.2026

let IstAnmeldungTermine = [];
let SollAnmeldungTermine = [];
let AnmeldungSynchron = true;

let aenderungenTermine = {}; // Speichert ALLE vorgemerkten Änderungen: {ID: {Termine: 'wert', Status: 'wert', deleted: true, isNew: true}, ...}
let anzahlaenderungenTermine = 0;
let tempNewIdCounter = -1; // Zähler für temporäre IDs (negativ, damit sie nicht mit echten IDs kollidieren)

//let isEditing = false;
let originalRowState = {}; // Speichert den Zustand der Zeile vor dem Bearbeiten


//----------------------------------
function updateGlobalControlButtons() {
//----------------------------------
// Aktiviert/Deaktiviert die globalen Kontroll-Buttons

// Prüfen, ob der Cache mit Änderungen nicht leer ist
    //const hasChanges = Object.keys(aenderungenTermine).length > 0;
    const hasChanges = anzahlaenderungenTermine > 0;
    
    // Buttons über der Tabelle
    const termineSpeichernBtn = document.getElementById('termineSpeichernButton');
    const termineZuruecksetzenBtn = document.getElementById('termineZuruecksetzenButton');

    if (termineSpeichernBtn && termineZuruecksetzenBtn) {
        // Speichern und Zurücksetzen aktivieren/deaktivieren
        termineSpeichernBtn.disabled = !hasChanges;
        termineZuruecksetzenBtn.disabled = !hasChanges;
        
        // Die Buttons nur anzeigen, wenn Änderungen vorliegen
        termineSpeichernBtn.classList.toggle('hidden', !hasChanges);
        termineZuruecksetzenBtn.classList.toggle('hidden', !hasChanges);
        
        // Sichern, dass die Buttons sichtbar sind, wenn sie nicht disabled sind (für den Fall, dass die CSS-Klasse 'hidden' fehlt)
        termineSpeichernBtn.style.display = hasChanges ? 'inline-block' : 'none';
        termineZuruecksetzenBtn.style.display = hasChanges ? 'inline-block' : 'none';
    }

    const termineInfoBereich = document.getElementById('termineinfo-bereich');
    if (anzahlaenderungenTermine > 0) {
        termineInfoBereich.textContent = anzahlaenderungenTermine + " Änderungen vorgemerkt";
    } else {
        termineInfoBereich.textContent = "keine Änderungen vorgemerkt";
    }
}

//----------------------------------
function zeigeTermineTabelle(datenZumRendern) {
//----------------------------------
    const tabellenBereich = document.getElementById("termine-tabelle");

    // Die Basis ist IMMER der termineCache
    const basisDaten = datenZumRendern || termineCache || []; 
    
    // 1. Array für die angezeigten Daten erstellen (Basis + neue Termine)
    let gefilterteTerminDaten = [...basisDaten]; 
    
    // 2. Neue Termine aus aenderungenTermine hinzufügen
    for (const id in aenderungenTermine) {
        const aenderung = aenderungenTermine[id];
        
        // Prüfe, ob es ein NEUER Termin ist (ID startet mit "NEW_")
        if (id.startsWith('NEW_')) {
            // Füge das komplette Objekt für die Anzeige hinzu
            gefilterteTerminDaten.push({
                ID: id,
                Termine: aenderung.Termine,
                Status: aenderung.Status, 
            });
        } 
    }
    
    // Sortierung (optional, aber empfohlen)
    gefilterteTerminDaten.sort((a, b) => new Date(a.Termine) - new Date(b.Termine));

    // Debugging-Logs
    console.log(`---> zeigeTermineTabelle: Angezeigte Termine: ${gefilterteTerminDaten.length}`);

    if (tabellenBereich) {
        const anzahlEintraege = gefilterteTerminDaten.length;
        
        // Header-Texte
        const ueberschriftTermine = `Termine (${anzahlEintraege})`;
        const ueberschriftStatus = 'Status';

        // --- 2. Tabellenzeilen rendern ---
        let tabellenHtml = `
            <table id="termine-data-table" class="editable-table">
                <thead>
                    <tr>
                        <th>${ueberschriftTermine}</th>
                        <th>${ueberschriftStatus}</th>
                        <th>Aktionen</th> 
                    </tr>
                </thead>
                <tbody>
        `;

        if (gefilterteTerminDaten.length > 0) {
            gefilterteTerminDaten.forEach((termin, index) => {
                const terminId = termin.ID; 
                const datumFormatiert = formatiereDatum(termin.Termine); 
                
                // === LOGIK FÜR ANGEZEIGTEN STATUS/DATUM (aus Cache oder Original) ===
                let angezeigterStatus = termin.Status; 
                let angezeigtesDatum = termin.Termine;

                // Prüfe, ob es eine Vormerkung im Änderungs-Cache gibt
                const aenderung = aenderungenTermine[terminId];
                if (aenderung) {
                    // Status-Änderung überschreiben (Status kann leer sein)
                    if (aenderung.Status !== undefined) {
                        angezeigterStatus = aenderung.Status;
                    }
                    // Datum-Änderung überschreiben (falls Datum doch bearbeitet wird - optional)
                    if (aenderung.Termine !== undefined) {
                        angezeigtesDatum = aenderung.Termine;
                    }
                }
                
                // Datum erneut formatieren, falls es aus dem Cache kam
                const angezeigtesDatumFormatiert = formatiereDatum(angezeigtesDatum);
                
                const isArchived = termin.Status === 'Archiv'; // Archivierung basiert auf Originalstatus
                const isEditable = !isArchived; 
                
                // Prüfen, ob eine Änderung vorgemerkt ist
                const hasChange = !!aenderung; 
                const isDeleted = aenderung && aenderung.deleted;
                
                // -------------------------------------------------------------------
                // === B) STATUSKLASSE (Vordergrund: Textfarbe) ===
                // -------------------------------------------------------------------
                let statusKlasse = 'status-open'; // Standard: Schwarz (für leeren Status/Offen)

                if (isArchived) {
                    statusKlasse = 'status-archived'; // Archiv: Textfarbe Schwarz (siehe CSS)
                } else if (angezeigterStatus && angezeigterStatus.length > 0) {
                    // Status gefüllt
                    if (angezeigterStatus.toLowerCase() === 'anmeldung') {
                        statusKlasse = 'status-anmeldung'; // Blau
                    } else {
                        statusKlasse = 'status-closed'; // Rot
                    }
                } 

                // -------------------------------------------------------------------
                // === A) ZEILENKLASSE (Hintergrund: Weiß, Grau, Hellgrün) ===
                // -------------------------------------------------------------------
                let rowClass = 'termin-row';

                if (isArchived) {
                    rowClass += ' archived-row'; // Grau
                } else if (hasChange) {
                    rowClass += ' highlight-change'; // Hellgrün
                    // Wenn gelöscht, wird die 'deleted' Klasse zusätzlich hinzugefügt (Durchstreichung)
                    if (isDeleted) {
                        rowClass += ' deleted';
                    }
                }
                // Ansonsten bleibt die rowClass 'termin-row', was dank der CSS-Änderung weiß ist.
                
                // Buttons: Nur einer der beiden Buttons (Löschen/Wiederherstellen) ist sichtbar
                const deleteButton = `<button onclick="toggleTerminLoeschen('${terminId}', this)" class="delete-btn ${isDeleted ? 'hidden' : ''}" title="Zum Löschen vormerken">🗑️</button>`;
                const restoreButton = `<button onclick="toggleTerminLoeschen('${terminId}', this)" class="restore-btn ${isDeleted ? '' : 'hidden'}" title="Löschung rückgängig machen">↩️</button>`;

                tabellenHtml += `
                    <tr data-id="${terminId}" data-index="${index}" class="${rowClass}">
                        <td data-field="Termine">${angezeigtesDatumFormatiert}</td>
                        <td data-field="Status" class="status-cell ${statusKlasse}">${angezeigterStatus}</td>
                        <td class="action-cell">
                            ${isEditable ? `
                                <button onclick="bearbeiteTerminZeile(this)" class="edit-btn" title="Bearbeiten" ${isDeleted ? 'disabled' : ''}>✏️</button>
                                ${deleteButton}
                                ${restoreButton}
                                ` : `<span class="archived-text">Archiviert</span>`}
                        </td>
                    </tr>
                `;
                
             });
        } else {
            tabellenHtml += '<tr><td colspan="3" class="no-data-cell">Keine Termine verfügbar.</td></tr>';
        }

        tabellenHtml += `
                </tbody>
            </table>
        `;
        
        tabellenBereich.innerHTML = tabellenHtml;

        // Abschließende Prüfung des globalen Status
        updateGlobalControlButtons();

    } else {
        console.warn("Element mit ID 'termine-tabelle' nicht gefunden.");
    }
}


//-------------------------------------------------------------
function zuruecksetzenTermineTabelle() {
//-------------------------------------------------------------
    aenderungenTermine = {};
    anzahlaenderungenTermine = 0;

    console.log(`---> zuruecksetzenTermineTabelle 1:` + termineCache.length);

    zeigeTermineTabelle(); 

    console.log(`---> zuruecksetzenTermineTabelle 2:` + termineCache.length);
  }
  
//----------------------------------
function toggleTerminLoeschen(terminId, buttonElement) {
//----------------------------------
    // Stelle sicher, dass keine andere Zeile bearbeitet wird
//    if (isEditing) {
//        alert("Bitte schließen Sie die aktuelle Bearbeitung ab, bevor Sie Termine löschen/wiederherstellen.");
//        return;
//    }
    
    const row = buttonElement.closest('tr');
    const isNew = terminId.startsWith('NEW_'); // Neu: Prüfen auf NEW_ ID

    // Prüfen, ob bereits im Cache als gelöscht vorgemerkt
    const isCurrentlyDeleted = aenderungenTermine[terminId] && aenderungenTermine[terminId].deleted;
    
    if (!isCurrentlyDeleted) {
        // --- VORMERKEN ZUM LÖSCHEN ODER SOFORT LÖSCHEN (bei NEW_ IDs) ---
        
        if (isNew) {
            // NEU: Bei neuen Terminen (NEW_) den Eintrag sofort entfernen
            delete aenderungenTermine[terminId];
            console.log(`Neuer Termin ${terminId} vollständig verworfen (gelöscht).`);

            // Wir müssen die Tabelle neu rendern, damit die Zeile verschwindet
            anzahlaenderungenTermine = Object.keys(aenderungenTermine).length;
            updateGlobalControlButtons();
            zeigeTermineTabelle(); 
            return; // Funktion hier beenden
        }
        
        // --- Vormerken für BESTEHENDE Termine ---
        if (!aenderungenTermine[terminId]) {
            aenderungenTermine[terminId] = {};
        }
        aenderungenTermine[terminId].deleted = true;
        
        // Frontend-Anpassungen (diese werden später von zeigeTermineTabelle überschrieben)
        row.classList.add('deleted');
        row.querySelector('.delete-btn').classList.add('hidden');
        row.querySelector('.restore-btn').classList.remove('hidden');
        row.querySelector('.edit-btn').disabled = true; 
        
        console.log(`Termin ${terminId} zum Löschen vorgemerkt.`);
        
    } else {
        // --- WIEDERHERSTELLEN ---
        delete aenderungenTermine[terminId].deleted; // Flag entfernen
        
        // Wenn keine anderen Änderungen für diese ID mehr im Cache sind, den Eintrag komplett entfernen
        if (Object.keys(aenderungenTermine[terminId]).length === 0) {
            delete aenderungenTermine[terminId];
        }
        
        // Frontend-Anpassungen (diese werden später von zeigeTermineTabelle überschrieben)
        row.classList.remove('deleted');
        row.querySelector('.delete-btn').classList.remove('hidden');
        row.querySelector('.restore-btn').classList.add('hidden');
        row.querySelector('.edit-btn').disabled = false;
        
        console.log(`Löschung von Termin ${terminId} rückgängig gemacht.`);
    }

    // Für bestehende Termine: Aktualisiere Zähler und UI
    anzahlaenderungenTermine = Object.keys(aenderungenTermine).length;
    
    // Anstatt die DOM-Klassen manuell zu setzen (was fehleranfällig ist),
    // lassen wir die Funktion, die weiß, wie der Cache aussieht, die Tabelle neu zeichnen.
    zeigeTermineTabelle(); 

    console.log("toggleTerminLoeschen, aenderungenTermine:" + anzahlaenderungenTermine);
}

//----------------------------------
function openOverlayNeueTerminZeileHinzufuegen() {
//----------------------------------
    const overlay = document.getElementById('overlayTermineNeu');
    const meldungFeld = document.getElementById('neuer-termin-meldung');
    meldungFeld.textContent = " ";
    meldungFeld.classList.add('hidden');
    overlay.style.display = 'flex';

    // Setze das Mindestdatum auf morgen
    const heute = new Date();
    heute.setDate(heute.getDate() + 1); // Morgen
    const minDate = heute.toISOString().split('T')[0]; // Format JJJJ-MM-TT
    document.getElementById('neuer-termin-datum').min = minDate;
}

//----------------------------------
function verarbeiteNeuenTermin() {
//----------------------------------
    const inputFeld = document.getElementById('neuer-termin-datum');
    const meldungFeld = document.getElementById('neuer-termin-meldung');
    const neuesDatumStr = inputFeld.value; // JJJJ-MM-TT
    
    // Meldungsfeld zurücksetzen
    meldungFeld.textContent = "";
    meldungFeld.classList.add('hidden');

    // --- 1. VALIDIERUNG START ---
    
    // a) Pflichtfeld prüfen
    if (!neuesDatumStr) {
        meldungFeld.textContent = "Bitte ein Datum auswählen.";
        meldungFeld.classList.remove('hidden');
        return;
    }
    
    // b) Zukunfts-Prüfung (KORREKTUR: String-Vergleich)
    
    // Aktuelles Datum im JJJJ-MM-TT Format (lokal)
    const heuteObj = new Date();
    // Nutze toISOString() und kürze auf JJJJ-MM-TT, um Zeitzonenfehler zu vermeiden
    const heuteStr = heuteObj.toISOString().split('T')[0];
    
    // Lexikographischer String-Vergleich (JJJJ-MM-TT ist chronologisch sortiert)
    if (neuesDatumStr < heuteStr) {
        meldungFeld.textContent = "Das Datum muss mindestens heute oder später sein.";
        meldungFeld.classList.remove('hidden');
        return;
    }

    // c) Existenz-Prüfung: Bereits im Cache?
    
    // 1. Alle gespeicherten Termine (aus dem termincache)
    let alleTermine = [...(termineCache || [])]; 
    
    // 2. Alle NEUEN, VORGESPEICHERTEN Termine (aus aenderungenTermine) hinzufügen
    for (const id in aenderungenTermine) {
        const aenderung = aenderungenTermine[id];
        
        // Füge nur die NEUEN Termine hinzu, die nicht im termineCache sind
        if (id.startsWith('NEW_')) {
            // Wir erstellen ein temporäres Objekt, um das Format konsistent zu halten
            alleTermine.push({ 
                ID: id, 
                Termine: aenderung.Termine 
            }); 
        } 
    }
    
    // 3. Nun die Prüfung durchführen: Gibt es einen Termin mit dem neuen Datum?
    const istBereitsVorhanden = alleTermine.some(termin => {
        
        // Zusätzliche Prüfung: Ist der Termin zum Löschen vorgemerkt? 
        const istGelöschtVorgemerkt = aenderungenTermine[termin.ID] && aenderungenTermine[termin.ID].deleted;
        
        if (istGelöschtVorgemerkt) {
            return false; // Ignoriere Termine, die gelöscht werden sollen
        }
        
        let terminDatumStr;
   
        if (termin.ID.startsWith('NEW_')) {
        // NEUE Termine sind bereits im korrekten JJJJ-MM-TT Format gespeichert
          terminDatumStr = termin.Termine;
        } else {

          // 1. Erstellen Sie das Datumsobjekt
          const datumObj = new Date(termin.Termine); // Z.B. ergibt Thu Nov 20 2025 00:00:00 GMT+0100

          // 2. KORREKTUR: Erzwingen Sie die Anzeige des Lokalen Datums.
          // Fügen Sie die Zeitzone hinzu, um sicherzustellen, dass das Datum nicht zurückspringt.
          // Am einfachsten: Nutzen Sie die lokale Zeit-Umwandlung, die von T-Offset unbeeinflusst ist.
        
          // Wir holen die lokalen Komponenten, die den gewünschten Tag darstellen
          const year = datumObj.getFullYear();
          // Monate sind 0-basiert, daher +1
          const month = String(datumObj.getMonth() + 1).padStart(2, '0');
          // Datum ist 1-basiert
          const day = String(datumObj.getDate()).padStart(2, '0');
        
          // Der korrekte Datums-String im lokalen Format
          terminDatumStr = `${year}-${month}-${day}`;
        
          // Debugging (optional, aber nützlich zur Bestätigung)
          console.log(`Debug: Aus Cache-Wert ${termin.Termine} wird lokaler String: ${terminDatumStr}`);

        }
            console.log(`Neuer Termin ${neuesDatumStr}, vorhanden Termin ${terminDatumStr}`);
        
        // String-Vergleich mit dem Input-Datum
        return terminDatumStr === neuesDatumStr; 
    });

    if (istBereitsVorhanden) {
        meldungFeld.textContent = `Für den ${neuesDatumStr} ist bereits ein Termin vorgemerkt oder gespeichert.`;
        meldungFeld.classList.remove('hidden');
        return;
    }

    // --- VALIDIERUNG ERFOLGREICH ---
    
    // 1. Zuerst die temporäre ID für den Cache generieren
    const tempNewId = `NEW_${tempNewIdCounter--}`; 
    
    // 2. Die PERMANENTE ID generieren
    const permanentId = changeDateISOtoKW(neuesDatumStr); 

    // 3. Zum lokalen Cache aenderungenTermine hinzufügen
    aenderungenTermine[tempNewId] = {
        isNew: true,
        permanentId: permanentId, 
        Termine: neuesDatumStr, 
        Status: '' // Status ist leer ("Offen")
    };
    
    // 4. Globale Zähler aktualisieren
    anzahlaenderungenTermine = Object.keys(aenderungenTermine).length;

    // 5. Zurücksetzen des UI: Modal schließen und Tabelle neu rendern
    //closeOverlayNeueTerminZeileHinzufuegen();
    closeOverlay('overlayTermineNeu')
    zeigeTermineTabelle(); 
    
    console.log(`Neuer Termin ${neuesDatumStr} als mit terminID ${permanentId} und temporärer ID ${tempNewId} vorgemerkt.`);
    console.log("verarbeiteNeuenTermin, aenderungenTermine:" + anzahlaenderungenTermine);
}

//----------------------------------
function openOverlayTermineAenderungenProtokoll () {
//----------------------------------
    const overlay = document.getElementById("OverlayTermineAenderungenProtokoll");
    const tabelleBody = document.querySelector("#termine-aenderungen-tabelle tbody");
    tabelleBody.innerHTML = ""; // Alten Inhalt leeren

    // *** Füllen der Tabelle mit dem Inhalt von aenderungenTermine ***
    for (const id in aenderungenTermine) {
        if (aenderungenTermine.hasOwnProperty(id)) {
            const aenderung = aenderungenTermine[id];
            
            const tr = document.createElement("tr");
            
            let aenderungsTermin = "";
            let aenderungsStatus = "";
            let aenderungsAktion = "";
            let rowClass = ""; // Für farbliche Kennzeichnung

            // --- 1. Aktion bestimmen (Reihenfolge wichtig) ---
            if (aenderung.deleted) {
                aenderungsAktion = "Löschen";
                rowClass = "protokoll-deleted";
            } else if (aenderung.isNew) {
                aenderungsAktion = "Neu einfügen";
                rowClass = "protokoll-new";
            } else {
                aenderungsAktion = "Bearbeitet";
                rowClass = "protokoll-edited";
            }
            
            // --- 2. Werte für Termin und Status bestimmen ---
            
            if (aenderung.isNew) {
                // Bei neuen Terminen: Datum und Status kommen direkt aus dem Cache
                aenderungsTermin = formatiereDatum(aenderung.Termine); 
                aenderungsStatus = aenderung.Status;
            } else {
                // Bei bestehenden Terminen (gelöscht/bearbeitet) müssen wir den Originalwert finden
                const originalTermin = (termineCache || gefilterteTerminDaten).find(t => t.ID === id);
                
                // Für Anzeige: Originalstatus/Termin und geänderter Status/Termin vergleichen
                
                // Termin: Zeige den neuen Wert (wenn bearbeitet), sonst den Originalwert
                const neuerTerminWert = aenderung.Termine ? formatiereDatum(aenderung.Termine) : formatiereDatum(originalTermin.Termine);
                
                // Status: Zeige den neuen Wert (wenn bearbeitet), sonst den Originalwert
                const neuerStatusWert = aenderung.Status || originalTermin.Status; 
                
                
                // Anzeige im Protokoll: Zeige (Original -> Neu) oder nur den neuen Wert
                aenderungsTermin = (aenderung.Termine && originalTermin.Termine !== aenderung.Termine) 
                                ? `${formatiereDatum(originalTermin.Termine)} → ${neuerTerminWert}` 
                                : neuerTerminWert;

                aenderungsStatus = (aenderung.Status && originalTermin.Status !== aenderung.Status)
                                ? `${originalTermin.Status} → ${neuerStatusWert}`
                                : neuerStatusWert;
                
                // Wenn gelöscht, zeigen wir den Original-Termin/Status
                if (aenderung.deleted) {
                    aenderungsTermin = formatiereDatum(originalTermin.Termine);
                    aenderungsStatus = originalTermin.Status;
                }
            }


            tr.classList.add(rowClass);
            tr.innerHTML = `
                <td>${aenderungsTermin}</td>
                <td>${aenderungsStatus}</td>
                <td>${aenderungsAktion}</td>
            `;
            tabelleBody.appendChild(tr);
        }
    }

    checkAnmeldungSynchron();
    
    // Protokoll-Overlay anzeigen
    overlay.style.display = "flex";

}

// ----------------------------------
async function speichereOverlayTermineAenderungen() { 
// ----------------------------------
    // 1. Zuerst die Termine selbst speichern
    await speichereAlleTermineAenderungen(); 
    
    // 2. Wenn die Anmeldung nicht mehr synchron ist, Trigger an den Server
    if (!AnmeldungSynchron) {
        console.log("Starte Server-Synchronisation der Anmeldetabelle...");
        try {
            const result = await apiCall('syncAnmeldeTabelle', {});
            console.log("Server-Sync Ergebnis:", result);
        } catch (error) {
            console.error("Fehler beim Sync:", error);
        }
    }
}

//----------------------------------
function bearbeiteTerminZeile(buttonElement) {
//----------------------------------
    const row = buttonElement.closest('tr');
    const terminId = row.getAttribute('data-id');
    editrow = row;


    // 1. Originalzustand speichern (für den Abbrechen-Fall)
    const statusCell = row.querySelector('td[data-field="Status"]');
    const statusText = statusCell.textContent.trim();

    // --- Datumzelle zur Sicherheit sperren ---
    const datumCell = row.querySelector('td[data-field="Termine"]');
    const datumText = datumCell.textContent.trim();
    datumCell.classList.add('read-only-editing'); 

    originalRowState = {
        id: terminId,
        Datum: datumText,
        Status: statusText, 
        statusClass: statusCell.className 
    };

    console.log(`bearbeiteTerminZeile, originalrow: `, originalRowState);

    
    openOverlayTerminStatus ();
    
    // 4. Globalen Zustand anpassen
    toggleGlobalControls(false); 
}


//----------------------------------
function toggleGlobalControls(enable) {
//----------------------------------
// toggleGlobalControls bleibt unverändert
    const speicherBtn = document.getElementById('termineSpeichernButton');
    const resetBtn = document.getElementById('termineZuruecksetzenButton');
    
    const disabledValue = enable ? false : true;

    if (speicherBtn) speicherBtn.disabled = disabledValue;
    if (resetBtn) resetBtn.disabled = disabledValue;
    
}

//---------------------------------------------------------------------------------------------
async function speichereAlleTermineAenderungen() {
//---------------------------------------------------------------------------------------------
    if (anzahlaenderungenTermine === 0) {
        console.log("Keine Änderungen zum Speichern vorhanden.");
        return;
    }
    
    console.log("--- START: Speichervorgang Termine (Server-Call) ---");

    // Payload für den Server vorbereiten (wie zuvor definiert)
    const serverPayload = {
        creates: [],
        updates: [],
        deletes: []
    };

    for (const terminId in aenderungenTermine) {
        const aenderung = aenderungenTermine[terminId];

        if (aenderung.isNew) {
            serverPayload.creates.push({
                Id: aenderung.permanentId, 
                Termine: aenderung.Termine,
                Status: aenderung.Status, 
                tempId: terminId 
            });

        } else if (aenderung.deleted) {
            serverPayload.deletes.push(terminId);

        } else if ('Status' in aenderung || 'Termine' in aenderung) {
            serverPayload.updates.push({
                ID: terminId,
                Status: aenderung.Status 
            });

        }
    } 
//    console.log("--- serverPayload ---", serverPayload);

    // speichern 
    zeigeTermineSpinner(true);
    const result = await apiCall('speichereTafelTermine', serverPayload);
    console.log("Antwort vom Server nach Speichern:", result);
        
    await ladeTermine(); 
    console.log("termine geladen");
        
    // Cache leeren und UI-Zustand zurücksetzen
    aenderungenTermine = {}; 
    anzahlaenderungenTermine = 0;
    updateGlobalControlButtons(); 
        
    zeigeTermineSpinner(false);
    closeOverlay('OverlayTermineAenderungenProtokoll')

    console.log(result);
    showPopup(`✅ Änderungen gespeichert: Neu: ${result.created.length}, Aktualisiert: ${result.updatesCount}, Gelöscht: ${result.deletesCount}`);

}

// ----------------------------------
function zeigeTermineSpinner(anzeigen) {
// ----------------------------------
  const spinner = document.getElementById("termine-spinner");
  spinner.style.display = anzeigen ? "inline-block" : "none";
}

//----------------------------------
function openOverlayTafelWochentage() {
//----------------------------------
    const overlay = document.getElementById('overlayTafelWochentage');

    overlay.style.display = 'flex';

    const TafelWochentage = [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag"
    ];
    
    let aktTafelTag = TafelTag;

    const containerID = 'TafelWochentage-selection-container';

    createRadiobuttonTable (containerID, TafelWochentage, aktTafelTag);

}

//----------------------------------
function verarbeiteTafelWochentage() {
//----------------------------------
    // *** KORREKTUR: Selektiert den ausgewählten Radiobutton ***
    const selectedRadio = document.querySelector('#TafelWochentage-selection-container input[type="radio"]:checked');

    if (!selectedRadio) {
        // Wenn kein Radiobutton ausgewählt ist, brechen wir ab
        showPopup("Bitte wählen Sie genau einen Tafel Wochentag aus.");
        closeOverlay('overlayTafelWochentage');
        return;
    }
    
    const selectedWochentag = selectedRadio.value;
    console.log("verarbeiteTafelWochentage, ausgewählter Tag:", selectedWochentag);
    
    closeOverlay('overlayTafelWochentage');

    showPopup("Die Änderung kann z.Zt noch nicht verarbeitet werden.");

/**
    apiCall('saveTafelWochentagValue', { wochentagName: selectedWochentag })
        .then(() => {
            TafelTag = selectedWochentag;
            showPopup(`✅ Neuer Tafel Wochentag erfolgreich auf "${TafelTag}" gesetzt.`);
        })
        .catch(error => {
            console.error("Fehler beim Speichern des Tafel Wochentags:", error);
            showPopup("❌ Fehler beim Speichern des Tafel Wochentags: " + error.message);
        });
 */
    return;
 
}


//----------------------------------
function openOverlayTafelWochentage_Multiselection() {
//----------------------------------
/**
 * für den Fall, dass mehrere Tafel Wochentage möglich sind:
 * -> ein checkbox-container
 */

    const overlay = document.getElementById('overlayTafelWochentage');

    overlay.style.display = 'flex';

    const TafelWochentage = [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag"
    ];

    const defaultSelections = [
        TafelTag
    ];

    const containerID = 'TafelWochentage-selection-container';

    createCheckboxTable(containerID, TafelWochentage, defaultSelections);

}

//----------------------------------
function openOverlayTerminStatus() {
//----------------------------------
    const overlay = document.getElementById('overlayTerminStatus');
    overlay.style.display = 'flex';

    const TerminStatusDatum = document.getElementById('TerminStatus-Datum');
    TerminStatusDatum.textContent = "Termin: " + originalRowState.Datum;

    const TerminStatusStatus = document.getElementById('TerminStatus-Status');
    TerminStatusStatus.value = originalRowState.Status;

    console.log(`openOverlayTerminStatus, statusText: `, originalRowState.Status);
}

//----------------------------------
function verarbeiteTerminStatus() {
//----------------------------------
    const TerminStatusStatus = document.getElementById('TerminStatus-Status');
    const neuerStatus = TerminStatusStatus.value;

    if (neuerStatus === originalRowState.Status) {
        // Wenn der Wert unverändert ist, behandeln wir es wie "Abbrechen"
        console.log(`Termin ${terminId}: Status unverändert, bricht Bearbeitung ab.`);
        closeOverlay('overlayTerminStatus') 
        return;
    }
    
    const terminId = originalRowState.id
    const existingChange = aenderungenTermine[terminId] || {};
    
    const changeObject = {
        ...existingChange,
        Status: neuerStatus,
        isModified: true
    };
    
    aenderungenTermine[terminId] = changeObject;
    anzahlaenderungenTermine = Object.keys(aenderungenTermine).length;
    
    console.log(`Termin ${terminId}: Status von "${originalRowState.Status}" auf "${neuerStatus}" geändert und in aenderungenTermine vorgemerkt.`);
    console.log("speichereTerminZeile, aenderungenTermine:" + anzahlaenderungenTermine);

    closeOverlay('overlayTerminStatus') 
    
    zeigeTermineTabelle(); 
    
    toggleGlobalControls(true); 

}

//----------------------------------
function erstelleTerminIstListe() {
//----------------------------------
/**
 * Erstellt eine Liste aller Termine, die aktuell den Status "Anmeldung" haben.
 * Grundlage ist der termineCache (der Stand vor den aktuellen Änderungen).
 */

    // Liste leeren
    IstAnmeldungTermine = [];

    if (!termineCache) {
        console.warn("erstelleTerminIstListe: termineCache ist noch leer.");
        return;
    }

    // Wir gehen durch den Cache
    termineCache.forEach(termin => {
        // WICHTIG: Prüfung auf "Status" (großgeschrieben!)
        console.log("erstelleTerminIstListe termin.Termine, termin.Status:", termin.Termine, termin.Status);

        if (termin.Status === "Anmeldung") {
            IstAnmeldungTermine.push({
                permanentId: termin.ID,    // Nutze ID aus deinem Cache
                datum: termin.Termine,      // Nutze Termine aus deinem Cache
                status: termin.Status       // Nutze Status aus deinem Cache
            });
        }
    });

    console.log("Ist-Stand Anmeldung:", IstAnmeldungTermine);
}

//----------------------------------
function erstelleTerminSollListe() {
//----------------------------------
    SollAnmeldungTermine = [];
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    // 1. "Vorschau" aller Termine berechnen
    let vorschau = termineCache.map(t => {
        const id = t.ID;
        const aenderung = aenderungenTermine[id];

        return {
            permanentId: id,
            // Wenn geändert, nimm Änderung, sonst Original
            datum: new Date(aenderung && aenderung.Termine ? aenderung.Termine : t.Termine),
            // Wenn gelöscht, Status auf "gelöscht" setzen, sonst neuen oder alten Status
            status: (aenderung && aenderung.deleted) ? "GELÖSCHT" : (aenderung && aenderung.Status !== undefined ? aenderung.Status : t.Status)
        };
    });

    // 2. Neue Termine (NEW_...) hinzufügen
    for (const id in aenderungenTermine) {
        if (id.startsWith('NEW_')) {
            const neu = aenderungenTermine[id];
            vorschau.push({
                permanentId: neu.permanentId,
                datum: new Date(neu.Termine),
                status: neu.Status
            });
        }
    }

    // 3. Filtern für die Anmeldung (Zukunft & Status erlaubt)
    SollAnmeldungTermine = vorschau
        .filter(t => t.datum >= heute && t.status !== "GELÖSCHT" && (t.status === "" || t.status === "Anmeldung"))
        .sort((a, b) => a.datum - b.datum)
        .slice(0, 6);

    console.log("Soll-Stand Anmeldung:", SollAnmeldungTermine);
}

//----------------------------------
function checkListenIdentisch() {
//----------------------------------
/**
 * Vergleicht die Ist-Liste mit der Soll-Liste.
 * Gibt true zurück, wenn alles identisch ist.
 * Gibt false zurück, wenn sich Termine verschieben, entfallen oder neu hinzukommen.
 */

    // 1. Grundprüfung: Haben wir überhaupt die gleiche Anzahl an Terminen?
    if (IstAnmeldungTermine.length !== SollAnmeldungTermine.length) {
        console.log("Listen-Vergleich: Unterschiedliche Anzahl an Terminen.");
        return false;
    }

    // 2. Positionsgenauer Vergleich der IDs
    // Da beide Listen chronologisch sortiert sind, muss die ID an Stelle 0, 1, 2... gleich sein.
    for (let i = 0; i < IstAnmeldungTermine.length; i++) {
        if (IstAnmeldungTermine[i].permanentId !== SollAnmeldungTermine[i].permanentId) {
            console.log(`Listen-Vergleich: Abweichung an Position ${i+1}`);
            return false;
        }
    }

    // Wenn die Schleife ohne 'false' durchläuft, sind die Listen identisch
    console.log("Listen-Vergleich: Listen sind identisch.");
    return true;
}

//----------------------------------
function checkAnmeldungSynchron() {
//----------------------------------
    const vorschauSektion = document.getElementById("anmeldung-vorschau-sektion");

    erstelleTerminIstListe();
    erstelleTerminSollListe();

    AnmeldungSynchron  = checkListenIdentisch();
    
    if (AnmeldungSynchron ) {
        console.log("✅ Keine Auswirkungen auf die Anmelde-Tabelle.");
        vorschauSektion.classList.add("hidden");
    } else {
        console.warn("⚠️ Achtung: Die Anmeldung wird sich verändern!");
        vorschauSektion.classList.remove("hidden");
        rendereAnmeldungVergleich();
    }
}

//----------------------------------
function rendereAnmeldungVergleich() {
//----------------------------------
    const tabelleBody = document.querySelector("#anmeldung-vergleich-tabelle tbody");
    tabelleBody.innerHTML = "";

    // Wir gehen bis 6 (oder die maximale Länge beider Listen)
    const maxZeilen = Math.max(IstAnmeldungTermine.length, SollAnmeldungTermine.length, 6);

    for (let i = 0; i < maxZeilen; i++) {
        const ist = IstAnmeldungTermine[i];
        const soll = SollAnmeldungTermine[i];

        const tr = document.createElement("tr");
        
        // Vergleiche IDs für die farbliche Markierung
        const istId = ist ? ist.permanentId : null;
        const sollId = soll ? soll.permanentId : null;
        const hatAenderung = istId !== sollId;

        // Spalte 1: Position
        const tdPos = `<td>${i + 1}. Termin</td>`;

        // Spalte 2: Ist-Zustand
        const tdIst = ist 
            ? `<td>${formatiereDatum(ist.datum)}</td>` 
            : `<td class="text-muted">- leer -</td>`;

        // Spalte 3: Soll-Zustand (Markierung wenn anders)
        let sollKlasse = hatAenderung ? "protokoll-edited" : "";
        const tdSoll = soll 
            ? `<td class="${sollKlasse}">${formatiereDatum(soll.datum)} ${hatAenderung ? '➡️' : ''}</td>` 
            : `<td class="protokoll-deleted">- entfällt -</td>`;

        tr.innerHTML = tdPos + tdIst + tdSoll;
        tabelleBody.appendChild(tr);
    }
}
