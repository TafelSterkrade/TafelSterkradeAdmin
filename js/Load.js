// "load.js" --- 18.11.2025 ---

// Hilfsfunktion: Section laden
async function loadSection(id, file) {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Fehler beim Laden von ${file}`);
    document.getElementById(id).innerHTML = await res.text();
  } catch (err) {
    console.error(err);
    document.getElementById(id).innerHTML =
      `<p style="color:red">Fehler: ${file} nicht geladen</p>`;
  }
}

// Lädt alle Sections (parallel)
async function loadAllSections() {
  await Promise.all([
    loadSection("section-aktualisierung", "sections/section-aktualisierung.html"),
    loadSection("section-mitarbeiter",    "sections/section-mitarbeiter.html"),
    loadSection("section-anmeldung",      "sections/section-anmeldung.html"),
    loadSection("section-termine",        "sections/section-termine.html"),
    loadSection("section-rapporte",         "sections/section-rapporte.html")
  ]);
}

// Lädt zusätzliche Skripte nach, sobald DOM und Sections stehen
function loadExtraScripts() {
  const scripts = [
    "js/Manage.js",
    "js/Anmeldung.js",
    "js/Mitarbeiter.js",
    "js/Termine.js",
    "js/ExportRapport.js",
    "js/ExportMitarbeiter.js",
    "js/EventListener.js",
    "js/Tools.js",
    "js/Rapporte.js"
  ];

  return Promise.all(
    scripts.map(src => new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        console.log(`📥 ${src} geladen`);
        resolve();
      };
      s.onerror = () => reject(new Error(`Fehler beim Laden von ${src}`));
      document.body.appendChild(s);
    }))
  );
}

// Startpunkt: wenn DOM bereit
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🌍 DOMContentLoaded");

  // 1. Sections laden
  await loadAllSections();
  console.log("✅ Alle Sections geladen");

  // 2. Zusatz-Skripte laden
  await loadExtraScripts();
  console.log("✅ Alle Zusatz-Skripte geladen");

  // 3. EventListener initialisieren
  if (typeof initEventListeners === "function") {
    initEventListeners();
    console.log("🎛 EventListener initialisiert");
  }

  // 4. App starten
  if (typeof initApp === "function") {
    initApp(); // kommt aus Start.js
  } else {
    console.error("❌ initApp() nicht gefunden. Ist Start.js geladen?");
  }
});
