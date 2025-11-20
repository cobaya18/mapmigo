// js/app.js
import { state } from "./core/state.js";
import { initMap } from "./core/map.js";
import { initFavorites } from "./core/favorites.js";
import { loadPlacesFromAPI } from "./core/fetch.js";
import { initMarkers } from "./core/markers.js";
import { initFilters, applyFilters } from "./core/filters.js";
import { initSearch } from "./core/search.js";
import { initUI } from "./core/ui.js";

/**
 * Main bootstrap for MapMigo – Puerto Rico
 * Initializes map, loads places, wires up markers, filters, search and UI.
 */
async function bootstrap() {
  try {
    // 1) Map + favorites first (they do not depend on data)
    initMap();
    initFavorites();

    // 2) Load places from API into shared state
    state.places = await loadPlacesFromAPI();

    if (!Array.isArray(state.places)) {
      throw new Error("Places response is not an array");
    }

    // 3) Build markers & clusters
    initMarkers();

    // 4) Initialize filters & search
    initFilters();
    initSearch();

    // 5) Initialize all UI glue (sidebar, list, GPS, sheets, etc.)
    initUI();

    // 6) Initial filter pass with empty search query
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
