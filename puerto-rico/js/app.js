// js/app.js
import { state } from "./core/state.js";
import { initMap } from "./core/map.js";
import { initFavorites } from "./core/favorites.js";
import { loadPlacesFromAPI } from "./core/fetch.js";
import { initMarkers } from "./core/markers.js";
import { initFilters, applyFilters } from "./core/filters.js";
import { initSearch } from "./core/search.js";
import { initUI } from "./core/ui.js";
import { normalize } from "./core/util.js";

async function bootstrap() {
  try {
    initMap();
    initFavorites();

    state.places = await loadPlacesFromAPI();
    // Precompute normalized fields for faster search
    state.places.forEach((p) => {
      p._normTitle = normalize(p.title || "");
      p._normDesc = normalize(p.description || "");
      p._normCategory = normalize(p.category || "");
      p._normRegion = normalize(p.region || "");
    });
    initMarkers();
    initFilters();
    initSearch();
    initUI();

    // initial filter pass with empty query
    applyFilters("");
  } catch (err) {
    console.error("Error bootstrapping app", err);
    const infoBar = document.getElementById("infoBar");
    if (infoBar) {
      infoBar.textContent = "Error loading places.";
    }
  }
}

bootstrap();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}
