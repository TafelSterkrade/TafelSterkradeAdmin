// News.js 30.01.2026

let GLOBAL_NEWS_SCHALTER_VALUE = "";
let GLOBAL_NEWS_SCHALTER_AKTIV = false; 
let GLOBAL_NEWS_ABFRAGE_VALUE = ""; 
let GLOBAL_NEWS_ABFRAGE_AKTIV = false; 
let GLOBAL_NEWS_TEXT = "";

let newsAbfrageDaten = []; 

const DEFINIERTE_ANTWORTEN = ["ja", "nein", "weiß_nicht"];
let NewsAntwort_ja = 0;
let NewsAntwort_nein = 0;
let NewsAntwort_weiß_nicht = 0;


//---------------------------------------------------------------------------------------------
async function checkNews() { 
//---------------------------------------------------------------------------------------------
    console.log("++++checkNews ");

    try {
        const adminData = await apiCall('getNews', {});

        updateNewsSchalter(adminData.schalterValue, adminData.newsText, adminData.abfrageValue);
        if (GLOBAL_NEWS_ABFRAGE_AKTIV) {
            getNewsAbfrageDaten ();
            apiCall('updateNachrichtRapport', {});
        }

    } catch (error) {
        console.error("Fehler beim Laden der News:", error);
    }

    updateNewsButtons();
    updateNewsBox();

}

//---------------------------------------------------------------------------------------------
async function getNewsAbfrageDaten() { 
//---------------------------------------------------------------------------------------------
    const adminData = await apiCall('getNewsAbfrage');
    newsAbfrageDaten = adminData;
    console.log("++++checkNews, newsAbfrageDaten (roh): ", newsAbfrageDaten);

    // 1. Zähler zurücksetzen
    NewsAntwort_ja = 0;
    NewsAntwort_nein = 0;
    NewsAntwort_weiß_nicht = 0;

    // 2. Antworten zählen
    newsAbfrageDaten.forEach(item => {
        const antwort = item.antwort.toLowerCase().trim(); // Antwort normalisieren (klein, ohne Leerzeichen)
        
        // Prüfen, ob die Antwort in den DEFINIERTE_ANTWORTEN enthalten ist
        if (DEFINIERTE_ANTWORTEN.includes(antwort)) {
            // Zuweisung zu den globalen Zählern (überprüfen Sie die genaue Schreibweise)
            switch (antwort) {
                case "ja":
                    NewsAntwort_ja++;
                    break;
                case "nein":
                    NewsAntwort_nein++;
                    break;
                case "weiß_nicht":
                    NewsAntwort_weiß_nicht++;
                    break;
                default:
                    // Sollte hier nicht eintreten, da es oben geprüft wird
                    break;
            }
        }
    });

    // 3. newsAbfrageDaten nach 'antwort' sortieren
    newsAbfrageDaten.sort((a, b) => {
        const antwortA = a.antwort.toLowerCase().trim();
        const antwortB = b.antwort.toLowerCase().trim();

        if (antwortA < antwortB) {
            return -1;
        }
        if (antwortA > antwortB) {
            return 1;
        }
        return 0; // Namen sind gleich, keine Änderung in der Reihenfolge
    });

    console.log("++++checkNews, newsAbfrageDaten (sortiert): ", newsAbfrageDaten);
    console.log(`CLIENT: Zählerstände - Ja: ${NewsAntwort_ja}, Nein: ${NewsAntwort_nein}, Weiß nicht: ${NewsAntwort_weiß_nicht}`);

}
//---------------------------------------------------------------------------------------------
function updateNewsSchalter(NewsEditTitel, NewsEditText, NewsEditAbfrage) { 
//---------------------------------------------------------------------------------------------
    console.log("++++updateNewsSchalter : ", NewsEditTitel, NewsEditText, NewsEditAbfrage);

        GLOBAL_NEWS_SCHALTER_VALUE  = NewsEditTitel;
        GLOBAL_NEWS_SCHALTER_AKTIV  = !!GLOBAL_NEWS_SCHALTER_VALUE && GLOBAL_NEWS_SCHALTER_VALUE.toString().trim() !== '';

        GLOBAL_NEWS_ABFRAGE_VALUE   = NewsEditAbfrage;
        GLOBAL_NEWS_ABFRAGE_AKTIV   = GLOBAL_NEWS_ABFRAGE_VALUE.toString().trim() == 'Abfrage';

        GLOBAL_NEWS_TEXT = NewsEditText;
        console.log("CLIENT: News geladen. Schalter:", GLOBAL_NEWS_SCHALTER_VALUE, GLOBAL_NEWS_SCHALTER_AKTIV);
        console.log("CLIENT: News geladen. ABFRAGE:", GLOBAL_NEWS_ABFRAGE_VALUE, GLOBAL_NEWS_ABFRAGE_AKTIV);

        let activateNews = GLOBAL_NEWS_SCHALTER_AKTIV && !!GLOBAL_NEWS_TEXT;

        if (!activateNews) {
            GLOBAL_NEWS_SCHALTER_AKTIV = false;
            GLOBAL_NEWS_ABFRAGE_AKTIV = false;
            console.log("CLIENT: News inaktiv oder Text leer.");
        }
}


//---------------------------------------------------------------------------------------------
function updateNewsButtons() { 
//---------------------------------------------------------------------------------------------
    const NewsButton = document.getElementById("newsRapportButton");
    console.log("updateNewsButton:", GLOBAL_NEWS_ABFRAGE_AKTIV);

    if (GLOBAL_NEWS_ABFRAGE_AKTIV) {
        NewsButton.classList.remove("hidden"); // Entfernt die Klasse, macht den Button sichtbar
    } else {
        NewsButton.classList.add("hidden");    // Fügt die Klasse hinzu, macht den Button unsichtbar
    }

    const newsInfo = document.getElementById('NewsInfo');
    //newsInfoBereich.textContent = "Nachricht wird nur angezeigt, wenn Titel und Text nicht leer sind!";
    
    if (!GLOBAL_NEWS_SCHALTER_AKTIV) {
        newsInfo.classList.remove("hidden"); // Entfernt die Klasse, macht den Button sichtbar
    } else {
        newsInfo.classList.add("hidden");    // Fügt die Klasse hinzu, macht den Button unsichtbar
    }

}

//----------------------------------
function updateNewsBox() {
//----------------------------------
    const NewsTable = document.getElementById("news-table");
    NewsTable.innerHTML = "";

    const tbody = document.createElement('tbody');

    let row = document.createElement("tr");
    row.innerHTML = `<td>Titel: </td><td>${GLOBAL_NEWS_SCHALTER_VALUE}</td>`;
    tbody.appendChild(row);

    row = document.createElement("tr");
    row.innerHTML = `<td> Text: </td><td>${GLOBAL_NEWS_TEXT}</td>`;
    tbody.appendChild(row);

    row = document.createElement("tr");
    row.innerHTML = `<td> Abfrage: </td><td>${GLOBAL_NEWS_ABFRAGE_VALUE}</td>`;
    tbody.appendChild(row);
    
    NewsTable.appendChild(tbody);
    
    return;
}

//----------------------------------
function openOverlayNewsBearbeiten() {
//----------------------------------
    const overlay = document.getElementById("overlayNewsEdit");
    overlay.style.display = "flex";

    document.getElementById("newsTitel").value = GLOBAL_NEWS_SCHALTER_VALUE;

    const [line1, line2, line3] = zerlegeNewsTextClient(GLOBAL_NEWS_TEXT);
    document.getElementById("newsText1").value = line1;
    document.getElementById("newsText2").value = line2;
    document.getElementById("newsText3").value = line3;

    document.getElementById("newsAbfrage").checked = GLOBAL_NEWS_ABFRAGE_AKTIV;
}

//----------------------------------
function openOverlayNewsRapport() {
//----------------------------------
    const overlay = document.getElementById("overlayNewsRapport");
    overlay.style.display = "flex";

    updateExportStatus('NewsRapportExportContainer', "", false); 

    updateNewsRapport();
}

//----------------------------------
function updateNewsRapport() {
//----------------------------------
    console.log("-----updateNewsRapport  ");

    const NewsRapportTitle = document.getElementById("NewsRapport-Title");
    NewsRapportTitle.textContent = `Abfrage zu  ${GLOBAL_NEWS_SCHALTER_VALUE}`;

    const NewsRapportInfo = document.getElementById("NewsRapport-Info");
    NewsRapportInfo.textContent = `${NewsAntwort_ja} ja, ${NewsAntwort_nein} nein, ${NewsAntwort_weiß_nicht} weiß_nicht`;

    updateNewsRapportTabelle();
}

//----------------------------------
function updateNewsRapportTabelle() {
//----------------------------------
    const NewsRapportTable = document.getElementById("scrollboxNewsRapport-table");
    NewsRapportTable.innerHTML = "";

    const tbody = document.createElement('tbody');
    newsAbfrageDaten.forEach(item => {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${item.name}</td><td>${item.antwort}</td>`;
        tbody.appendChild(row);
    });
 
    NewsRapportTable.appendChild(tbody);
 
    return;
}

//----------------------------------
function openOverlayAbfrageRestart() {
//----------------------------------
    const overlay = document.getElementById("overlayRestartAbfrage");
    overlay.style.display = "flex";

}

//----------------------------------
function restartNewsAbfrage() {
//----------------------------------
    closeOverlay('overlayRestartAbfrage');

    apiCall('resetNewsQuery', {});

}

//----------------------------------
function previewOverlayNewsEdit() {
//----------------------------------
    const newsData =  documentGetElementNewsEdit(); 
//console.log("-----previewOverlayNewsEdit 1:", newsData.NewsEditTitel, newsData.NewsEditText, newsData.NewsEditAbfrage);
    let NewsEditTitel = newsData.NewsEditTitel;
    let NewsEditAbfrage = newsData.NewsEditAbfrage;
    let NewsEditText = newsData.NewsEditText;

    let Titelcheck  = !!NewsEditTitel && NewsEditTitel.toString().trim() !== '';
    let Textcheck   = !!NewsEditText && NewsEditText.toString().trim() !== '';
    let activateNews = Titelcheck && Textcheck; 
    if (!activateNews) {
        NewsEditTitel = "KEINE Nachricht";
        NewsEditText = "Nachricht wird nur angezeigt, wenn Titel und Text nicht leer sind!";
        NewsEditAbfrage = ' ';
    }

    showOverlayNews(NewsEditTitel, NewsEditText, NewsEditAbfrage);
}

//---------------------------------------------------------------------------------------------
function showOverlayNews(NewsEditTitel, NewsEditText, NewsEditAbfrage) { 
//---------------------------------------------------------------------------------------------
    const overlay = document.getElementById("overlayNews");
    const OverlayText = document.getElementById("overlayNews-text");
    const OverlayTitel = document.getElementById("overlayNews-title");
    const decisionoptions = document.getElementById("decision-options");

    OverlayText.innerHTML = NewsEditText; 
    OverlayTitel.innerHTML = NewsEditTitel; 

    if (NewsEditAbfrage.toString().trim() !== 'Abfrage') {
        decisionoptions.classList.add("hidden"); // Entfernt die Radiobutton
    } else { 
        decisionoptions.classList.remove("hidden"); // Radiobutton sichtbar  
    }

    overlay.style.display = "flex";
}

//----------------------------------
function saveOverlayNewsEdit() {
//----------------------------------
    const newsData =  documentGetElementNewsEdit(); 
//console.log("-----saveOverlayNewsEdit 1:", newsData.NewsEditTitel, newsData.NewsEditText, newsData.NewsEditAbfrage);
    let NewsEditTitel = newsData.NewsEditTitel;
    let NewsEditAbfrage = newsData.NewsEditAbfrage;
    let NewsEditText = newsData.NewsEditText;

    updateNewsSchalter (NewsEditTitel, NewsEditText, NewsEditAbfrage) 
    updateNewsButtons();
    updateNewsBox();

    apiCall('saveNews', {
                newsSaveTitel: NewsEditTitel, 
                newsSaveText: NewsEditText, 
                newsSaveAbfrage: NewsEditAbfrage
                });

    closeOverlay('overlayNewsEdit');

    showPopup ("Nachricht gespeichert!");
}

//----------------------------------
function documentGetElementNewsEdit() {
//----------------------------------
    let NewsEditTitel = document.getElementById("newsTitel").value.trim();

    let NewsEditAbfrageCheck = document.getElementById("newsAbfrage").checked;
    let NewsEditAbfrage = '';
    if (NewsEditAbfrageCheck ) {
        NewsEditAbfrage = 'Abfrage';
    }

    let line1 = document.getElementById("newsText1").value.trim();
    let line2 = document.getElementById("newsText2").value.trim();
    let line3 = document.getElementById("newsText3").value.trim();
    let NewsEditText = [line1, line2, line3]
        .filter(line => line !== '') 
        .join('<br>'); 

    return {NewsEditTitel, NewsEditText, NewsEditAbfrage};
    }

//---------------------------------------------------------------------------------------------
function zerlegeNewsTextClient(newsText) {
//---------------------------------------------------------------------------------------------
/**
 * Zerlegt den NewsText vom Server (getrennt durch '<br>') in einzelne Zeilen.
 * @param {string} newsText - Der News-Text vom Server.
 * @returns {Array<string>} Ein Array mit den 3 Textzeilen (falls Zeilen fehlen, ist der Eintrag leer).
 */
if (!newsText) {
        return ['', '', ''];
    }
    
    let lines = newsText.split('<br>');
    
    // Sicherstellen, dass wir genau 3 Zeilen zurückgeben, falls weniger vorhanden sind.
    while (lines.length < 3) {
        lines.push(''); 
    }
    
    return lines.slice(0, 3); // Auf maximal 3 Zeilen begrenzen
}

//-----------------------------------------------
function exportNewsRapport2PdfAndDownload() {
//-----------------------------------------------
    const sheetRapport = "NachrichtRapport";
    const pdfname = GLOBAL_NEWS_SCHALTER_VALUE + ".pdf";
    const rapportoptions = { hideGridlines: true };

    updateExportStatus('NewsRapportExportContainer', `"${pdfname}" wird erstellt...`, true);

    apiCall('exportSheetToPdfAndGetLink', {
      sheetName: sheetRapport,
      options: {file: pdfname, options: rapportoptions}
    })
    .then(function(downloadUrl) {
      updateExportStatus('NewsRapportExportContainer', "", false); // Spinner ausblenden

      if (downloadUrl.startsWith("http")) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.textContent = `Klicken zum Herunterladen: "` + pdfname + `"`;
        link.target = '_blank';
        link.download = `pdfname`;
        document.getElementById('NewsRapportExportContainer').querySelector('p').appendChild(link);
      } else {
        document.getElementById('NewsRapportExportContainer').querySelector('p').textContent = downloadUrl;
      }
    })
    .catch(error => {
        console.error(`Fehler beim Erstellen der PDF-Datei für ${pdfname}:`, error);
        updateExportStatus('NewsRapportExportContainer', `Fehler beim Erstellen der PDF-Datei für ${pdfname}.`, false);
    });
}

//-----------------------------------------------
function exportNewsRapport2XlsxAndSendMail() {
//-----------------------------------------------
    const usermail = adminmail
    const sheetName = "NachrichtRapport";
    const filename = GLOBAL_NEWS_SCHALTER_VALUE + ".xlsx";

    updateExportStatus('NewsRapportExportContainer', `"${filename}" wird per E-Mail versandt...`, true);
      console.log("sendmailXLSRapport:", sheetName, filename, usermail);

      apiCall('exportSheetToXlsxAndSendMail', { sheetName, filename, usermail })
    .then(function(mailsuccess) {
        updateExportStatus('NewsRapportExportContainer', mailsuccess.message, false);
    })
    .catch(function(error) {
        updateExportStatus('NewsRapportExportContainer', `Fehler beim E-Mail-Versand der XLSX-Datei `, false);
    });

}
