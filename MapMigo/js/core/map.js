// js/core/map.js
import { state } from "./state.js";

export function initMap() {
  const map = L.map("map").setView([18.2208, -66.5901], 9);

  const baseLayers = {
    Satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri" }
    ),
    Dark: L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OpenStreetMap, &copy; CartoDB" }
    ),
    Light: L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap contributors" }
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

  setBaseMap("Satellite");

  // Map style toggle UI
  const mapStyleToggle = document.getElementById("mapStyleToggle");
  const mapStyleMenu = document.getElementById("mapStyleMenu");

  if (mapStyleToggle && mapStyleMenu) {
    mapStyleToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mapStyleMenu.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      mapStyleMenu.classList.remove("open");
    });

    document.querySelectorAll(".style-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const theme = btn.dataset.theme;
        setBaseMap(theme);

        document
          .querySelectorAll(".style-option")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const iconSpan = mapStyleToggle.querySelector(".icon");
        if (theme === "Satellite") iconSpan.textContent = "🛰️";
        else if (theme === "Dark") iconSpan.textContent = "⬛";
        else iconSpan.textContent = "◻️";

        mapStyleMenu.classList.remove("open");
      });
    });
  }

  state.map = map;
  return map;
}
