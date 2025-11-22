// js/core/search.js
import { state } from "./state.js";
import { relevanceScore, getPlaceKey } from "./util.js";
import { highlightMarker } from "./markers.js";
import { applyFilters } from "./filters.js";

let outsideCloseHandlerAttached = false;

export function initSearch() {
  const input = document.getElementById("search");
  const clearBtn = document.getElementById("searchClear");
  const searchBtn = document.getElementById("searchButton");

  if (!input) return;

  input.addEventListener("input", () => {
    const value = input.value;
    if (clearBtn) {
      clearBtn.style.display = value.trim().length > 0 ? "flex" : "none";
    }
    applyFilters(value);
    renderSearchResults(state.currentVisible, value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = input.value;
      applyFilters(value);
      renderSearchResults(state.currentVisible, value);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      applyFilters("");
      renderSearchResults([], "");
      const sr = document.getElementById("searchResults");
      if (sr) sr.style.display = "none";
      detachOutsideListener();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const value = input.value;
      applyFilters(value);
      renderSearchResults(state.currentVisible, value);
    });
  }
}

/* ------------------------------------------------------------
   CLICK OUTSIDE TO CLOSE DROPDOWN
------------------------------------------------------------ */

function attachOutsideListener() {
  if (outsideCloseHandlerAttached) return;

  outsideCloseHandlerAttached = true;

  setTimeout(() => {
    document.addEventListener("pointerdown", handleClickOutside, true);
  }, 0);
}

function detachOutsideListener() {
  if (!outsideCloseHandlerAttached) return;

  outsideCloseHandlerAttached = false;
  document.removeEventListener("pointerdown", handleClickOutside, true);
}

function handleClickOutside(e) {
  const overlay = document.getElementById("searchResults");
  const wrapper = document.getElementById("searchBarWrapper");

  if (!overlay || !wrapper) return;

  // If click is OUTSIDE the search bar AND results dropdown → close it
  if (!wrapper.contains(e.target) && !overlay.contains(e.target)) {
    overlay.style.display = "none";
    detachOutsideListener();
  }
}

/* ------------------------------------------------------------
   SEARCH RESULTS RENDERING
------------------------------------------------------------ */

function renderSearchResults(items, q) {
  const overlay = document.getElementById("searchResults");
  const list = document.getElementById("searchResultsList");

  if (!overlay || !list) return;

  if (!q.trim() || items.length === 0) {
    overlay.style.display = "none";
    list.innerHTML = "";
    detachOutsideListener();
    return;
  }

  const scored = items
    .map(({ place, index }) => ({
      place,
      index,
      score: relevanceScore(place, q),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    overlay.style.display = "none";
    list.innerHTML = "";
    detachOutsideListener();
    return;
  }

  list.innerHTML = "";
  scored.forEach(({ place, index }) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `
      <div class="result-title">${place.title}</div>
      <div class="result-meta">${place.category || ""} • ${
      place.region || ""
    }</div>
    `;
    div.onclick = () => {
      const m = state.markers[index];
      if (!m || !state.map) return;
      state.map.setView(m.getLatLng(), 14);
      highlightMarker(m);

      if (window.innerWidth <= 768) {
        const key = getPlaceKey(place, index);
        const evt = new CustomEvent("place:openSheet", {
          detail: { place, key, index },
        });
        window.dispatchEvent(evt);
      } else {
        m.fire("click");
      }

      // Select → close dropdown
      overlay.style.display = "none";
      detachOutsideListener();
    };
    list.appendChild(div);
  });

  overlay.style.display = "block";

  // Dropdown opened → enable outside close
  attachOutsideListener();
}
