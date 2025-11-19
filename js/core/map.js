// js/core/map.js
import { state } from "./state.js";

export function initMap() {
  const map = L.map("map", {
    zoomControl: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  }).setView([18.2208, -66.5901], 9);

  state.map = map;

  /* =====================================================
     BASE LAYERS
  ===================================================== */
  const baseLayers = {
    Satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri" }
    ),
    Dark: L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "© OpenStreetMap, © CartoDB" }
    ),
    Light: L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap contributors" }
    ),
  };

  let currentBase = null;

  function setBaseMap(theme) {
    const layer = baseLayers[theme] || baseLayers.Satellite;

    if (currentBase && map.hasLayer(currentBase)) {
      map.removeLayer(currentBase);
    }

    currentBase = layer;
    currentBase.addTo(map);
  }

  // Default
  setBaseMap("Satellite");

  /* =====================================================
     MAP STYLE TOGGLE UI (Desktop + Mobile)
  ===================================================== */
  const mapStyleToggle = document.getElementById("mapStyleToggle");
  const mapStyleMenu  = document.getElementById("mapStyleMenu");

  if (mapStyleToggle && mapStyleMenu) {
    // Toggle menu visibility
    mapStyleToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mapStyleMenu.classList.toggle("open");
    });

    // Close when clicking outside
    document.addEventListener("click", () => {
      mapStyleMenu.classList.remove("open");
    });

    // Handle style choices
    document.querySelectorAll(".style-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const theme = btn.dataset.theme;
        setBaseMap(theme);

        // Update active button
        document
          .querySelectorAll(".style-option")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        // Update icon on the floating button
        const iconSpan = mapStyleToggle.querySelector(".icon");
        if (theme === "Satellite") iconSpan.textContent = "🛰️";
        else if (theme === "Dark") iconSpan.textContent = "⬛";
        else iconSpan.textContent = "◻️";

        mapStyleMenu.classList.remove("open");
      });
    });
  }

  /* =====================================================
     MOVE ZOOM CONTROL (to avoid conflict with UI)
  ===================================================== */
  const zoomControl = map.zoomControl;
  if (zoomControl) {
    zoomControl.setPosition("topright");
  }

  return map;
}
