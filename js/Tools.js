// "Tools.js" ----- 18.11.2025 ----------

let isPdfExporting = false;
const WOCHENTAGE_KUERZEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

//---------------------------------------------------------------------------------------------
function setSpinnerState(id, loading) {
//---------------------------------------------------------------------------------------------
  const el = document.getElementById(id);
  if (!el) return;
  if (loading) {
    el.classList.remove("checkmark");
    el.classList.add("spinner", "small");
    el.innerText = "";
  } else {
    el.classList.remove("spinner", "small");
    el.classList.add("checkmark");
    el.innerText = "✓";
  }
}

// ----------------------------------
function showPopup(text) {
// ----------------------------------
  const popupText = document.querySelector("#popup-content p");
  popupText.innerHTML = text;
  document.getElementById("popup").style.display = "flex";
}

// ----------------------------------
function closePopup() {
// ----------------------------------
  document.getElementById("popup").style.display = "none";
}



//----------------------------------
function closeOverlay(IdOverlay) {
//----------------------------------
    const overlay = document.getElementById(IdOverlay);
    overlay.style.display = 'none';
}

//-------------------------------------------------------------
function createRadiobuttonTable(containerID, namenListe, checkedSelection) {
//-------------------------------------------------------------
    const container = document.getElementById(containerID);
    container.innerHTML = ''; // Container leeren
    
    if (!Array.isArray(namenListe) || namenListe.length === 0) {
        container.innerHTML = `<p>Keine Wochentage gefunden.</p>`;
        return;
    }

    // checkedSelection sollte hier ein Array mit maximal einem Element sein
    const checkedSet = checkedSelection; 

    namenListe.forEach(name => {
        // Prüfen, ob der aktuelle Name im Array der Vorauswahl ist
        const isChecked = checkedSet == name;

        const label = document.createElement('label');
        // Das Label muss die Klasse für das korrekte CSS-Layout haben
        label.className = 'wochentag-label'; 
        
        const radio = document.createElement('input');
        radio.type = 'radio'; // *** WICHTIGE ÄNDERUNG: radio ***
        radio.name = 'Tafel-Wochentag'; // Alle Radiobuttons müssen denselben Namen haben!
        radio.value = name;
        
        if (isChecked) {
            radio.checked = true;
        }

        const textNode = document.createTextNode(` ${name}`);
        
        // Füge Radiobutton und Text zum Label hinzu
        label.appendChild(radio);
        label.appendChild(textNode);
        
        // Füge das Label dem Container hinzu
        container.appendChild(label);
    });
}


//-------------------------------------------------------------
function createCheckboxTable(containerID, checknamen, defaultSelections) {
//-------------------------------------------------------------
    const container = document.getElementById(containerID);
    container.innerHTML = ''; // Container leeren
    console.log("createCheckboxTable, spalten: ", checknamen);
    if (!checknamen || checknamen.length === 0) {
        container.innerHTML = `<p>Keine checknamen gefunden.</p>`;
        return;
    }

    // Verwenden Sie ein Set für die voreingestellten checknamen, um die Überprüfung zu optimieren
    const defaultSet = new Set(defaultSelections);
      console.log("createCheckboxTable, default: ", defaultSelections);

    checknamen.forEach(chckname => {
        // Prüfen, ob die aktuelle chckname in der voreingestellten Liste ist
        const isChecked = defaultSet.has(chckname);
        const checkedAttribute = isChecked ? 'checked' : '';

        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="checknamen" value="${chckname}" ${checkedAttribute}> ${chckname}`;
      console.log("createCheckboxTable, label.innerHTML: ", label.innerHTML);
        container.appendChild(label);
    });
}


// ----------------------------------
function togglePdfExport(sheetName, button) {
// ----------------------------------
  const infoContainerId = `pdfExportInfo_${sheetName}`;
  const infoContainer = document.getElementById(infoContainerId);
  const emailStatusElement = document.getElementById(`emailStatus_${sheetName}`);
  const downloadLinkElement = document.getElementById(`downloadLink_${sheetName}`);
  const loader = button.nextElementSibling;

  console.log("PDF-Export export gestartet für ", sheetName);

  let originalText = button.textContent;
  if (originalText.endsWith(hideText)) {
    originalText = originalText.slice(0, -hideText.length);
  }
  if (isPdfExporting) {
    console.log("PDF-Export wird bereits ausgeführt. Bitte warten (globale Variable).");
    return;
  }

  if (infoContainer.style.display === 'none') {
    isPdfExporting = true;
    button.textContent = "PDF wird erstellt...";
    button.disabled = true;
    if (loader) {
      loader.style.display = "inline-block";
    }
    infoContainer.style.display = 'block';
    emailStatusElement.textContent = "E-Mail wird gesendet...";
    downloadLinkElement.textContent = "Download-Link wird erstellt...";

    const onSuccess = function() {
      isPdfExporting = false;
      button.textContent = originalText + hideText;
      button.disabled = false;
      if (loader) {
        loader.style.display = "none";
      }
    };

    // Erster API-Aufruf: Senden der E-Mail
    apiCall('sendPdfByEmail', { sheetName: sheetName })
      .then(emailResult => {
        emailStatusElement.textContent = emailResult;
        // Zweiter API-Aufruf (nach erfolgreicher E-Mail): Abrufen des Download-Links
        return apiCall('exportSheetToPdfAndGetLink', { sheetName: sheetName });
      })
      .then(downloadUrl => {
        if (downloadUrl && downloadUrl.startsWith("http")) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.textContent = `Hier klicken zum Herunterladen (${sheetName})`;
          link.target = '_blank';
          downloadLinkElement.innerHTML = '';
          downloadLinkElement.appendChild(link);
        } else {
          downloadLinkElement.textContent = downloadUrl || "Kein Download-Link verfügbar.";
        }
        onSuccess();
      })
      .catch(error => {
        // Allgemeine Fehlerbehandlung für beide Aufrufe
        console.error(`Fehler bei PDF-Export für ${sheetName}:`, error);
        emailStatusElement.textContent = "Fehler beim Export-Prozess.";
        downloadLinkElement.textContent = "Prozess abgebrochen.";
        onSuccess();
      });

  } else {
    infoContainer.style.display = 'none';
    button.textContent = originalText;
    button.disabled = false;
    isPdfExporting = false;
    if (loader) {
      loader.style.display = 'none';
    }
  }
}

//----------------------------------
function formatiereDatum(dateValue) {
//----------------------------------  
/**
 * Formatiert einen ISO 8601 Zeitstempel (z.B. "2025-08-13T22:00:00.000Z")
 * in das deutsche Format "Wochentag, TT.MM.JJJJ" (z.B. "Di, 13.08.2025").
 * * @param {string | Date} dateValue Der Datumswert.
 * @returns {string} Das formatierte Datum (z.B. "Di, 13.08.2025").
 */

// Versucht, ein Date-Objekt zu erstellen.
  const date = new Date(dateValue);

  // Prüft auf ungültiges Datum
  if (isNaN(date.getTime())) {
    return dateValue; // Gibt den Originalwert zurück, wenn er ungültig ist
  }

  // Wichtig: Beim Erstellen eines Date-Objekts aus einem ISO-String ohne Zeit
  // (`YYYY-MM-DD` oder wenn es ein UTC-String ist wie "2025-08-13T00:00:00.000Z"),
  // kann es aufgrund von Zeitzonenverschiebungen zum Vortag springen.
  // Wir nutzen `toLocaleDateString` mit der deutschen Locale (`de-DE`).

  const options = { 
    weekday: 'short', // Kurzer Wochentag (z.B. "Di")
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  
  // Nutzung der Intl API für das korrekte deutsche Format
  // Das Ergebnis ist z.B. "Di., 11.11.2025"
  let formattedDate = date.toLocaleDateString('de-DE', options);

  // Entferne den Punkt nach dem Wochentag, falls vorhanden (z.B. "Di." -> "Di")
  formattedDate = formattedDate.replace(/([A-z]{2})\.,/, '$1,'); 

  // Optionale Formatierung (falls der Wochentag hinten steht, was bei de-DE selten ist)
  // Beispiel, um nur das Format "Di, 11.11.2025" zu erzwingen, ohne weitere Punkte:
  
  const tag = String(date.getDate()).padStart(2, '0');
  const monat = String(date.getMonth() + 1).padStart(2, '0'); 
  const jahr = date.getFullYear();
//  const wochentage = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const wochentag = WOCHENTAGE_KUERZEL[date.getDay()];

  return `${wochentag}, ${tag}.${monat}.${jahr}`;
}

//----------------------------------
function getWeekAndDay(dateString) {
//----------------------------------
/**
 * Berechnet die ISO-Kalenderwoche (KW) und den Wochentag (als Kürzel)
 * für ein gegebenes Datum.
 * @param {string} dateString Datum im Format JJJJ-MM-TT.
 * @returns {{year: number, weekNo: string, dayKuerzel: string} | null}
 */
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;

    // --- Wochentag (Kürzel) ---
    const dayIndex = d.getDay(); // JS standard: 0=So, 1=Mo, 2=Di, ...
    const dayKuerzel = WOCHENTAGE_KUERZEL[dayIndex];

    // --- KW Calculation (ISO 8601 standard: Woche beginnt Mo) ---
    const date = new Date(d.valueOf());
    // Anchor auf den nächsten Donnerstag setzen (ISO Standard)
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));

    // Ersten Tag des Jahres holen
    const yearStart = new Date(date.getFullYear(), 0, 1);
    
    // KW berechnen (Millisekunden in Tage umrechnen)
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    
    // Das Jahr (kann sich durch KW-Berechnung ändern)
    const year = date.getFullYear();

    return { 
        year, 
        weekNo: String(weekNo).padStart(2, '0'), // Zweistellig formatieren
        dayIndex, // 0 bis 6
        dayKuerzel // NEU: Kürzel (So, Mo, Di, ...)
    };
}

//----------------------------------
function changeDateISOtoKW(dateStringISO) {
//----------------------------------
/**
 * Generiert die das Datum im KW-Format JJJJ-KW-Wochentag (z.B. 2025-47.4).
 * @param {string} dateStringISO Datum im ISO Format JJJJ-MM-TT.
 * @returns {string} Datum im KW-Format JJJJ-KW-Wochentag (z.B. 2025-47.4).
 */
    const result = getWeekAndDay(dateStringISO);
    if (!result) return 'INVALID_ID';
    
    return `${result.year}-${result.weekNo}.${result.dayIndex}`;
}


//----------------------------------
function changeDateDEtoISO(dateStringDE) {
//----------------------------------
/**
 * Konvertiert einen Datum-String vom deutschen Format (TT.MM.JJJJ) 
 * in das ISO-Format (JJJJ-MM-TT).
 * * @param {string} dateStringDE Datum im Format TT.MM.JJJJ (z.B. "25.12.2025").
 * @returns {string | null} Das Datum im Format JJJJ-MM-TT (z.B. "2025-12-25") 
 * oder null, falls das Format ungültig ist.
 */

    if (!dateStringDE || typeof dateStringDE !== 'string') {
        return null;
    }
    
    // Regulärer Ausdruck, um TT, MM und JJJJ zu extrahieren
    // Erwartet: Ziffern.Ziffern.Ziffern (mind. 1, 1, 4)
    const parts = dateStringDE.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

    if (!parts) {
        // Ungültiges Format (z.B. fehlende Punkte, falsche Reihenfolge)
        console.error("Ungültiges deutsches Datumsformat. Erwartet: TT.MM.JJJJ");
        return null;
    }

    // parts[1] = Tag (TT)
    // parts[2] = Monat (MM)
    // parts[3] = Jahr (JJJJ)
    
    const day = parts[1].padStart(2, '0');    // Sicherstellen, dass der Tag zweistellig ist (z.B. "1" -> "01")
    const month = parts[2].padStart(2, '0');  // Sicherstellen, dass der Monat zweistellig ist
    const year = parts[3];

    // Neu zusammensetzen im Format JJJJ-MM-TT
    return `${year}-${month}-${day}`;
}