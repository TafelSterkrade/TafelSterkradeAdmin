// "Tools.js" ----- 14.09.2025 ----------

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






let isPdfExporting = false;
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