// js/core/markers.js
import { state } from "./state.js";
import {
  getCategoryColor,
  getCategoryEmoji,
  getPlaceKey,
} from "./util.js";
import {
  isFavorite,
  toggleFavorite,
} from "./favorites.js";

let highlightRing = null;
let popupFavHandlerInitialized = false;

/* ============================================================
   GLOBAL DELEGATED HANDLER FOR POPUP FAVORITE BUTTONS
============================================================ */
function initPopupFavoriteHandler() {
  if (popupFavHandlerInitialized) return;
  popupFavHandlerInitialized = true;

  document.addEventListener("click", (evt) => {
    const btn = evt.target.closest(".leaflet-popup .fav-btn");
    if (!btn) return;

    evt.stopPropagation();

    const key = btn.dataset.key;
    if (!key) return;

    toggleFavorite(key);
    btn.classList.toggle("fav-active", isFavorite(key));
  });
}

export function initMarkers() {
  if (!state.map) throw new Error("Map not initialized");

  const isMobile = () => window.innerWidth <= 768;

  /* ============================================================
     GLOBAL MOBILE POPUP DISABLER
  ============================================================ */
  if (isMobile()) {
    L.Map.prototype.openPopup = function () { return this; };
    L.Popup.prototype.openOn = function () { return this; };
  } else {
    initPopupFavoriteHandler();
  }

  /* ============================================================
     CLUSTER GROUP
  ============================================================ */
  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: !isMobile(),
    spiderfyOnEveryClick: !isMobile(),
    disableClusteringAtZoom: 10,
    maxClusterRadius: 50,
    chunkedLoading: true,
    chunkDelay: 16,
    chunkInterval: 200,
    animateAddingMarkers: false,
  });

  if (isMobile()) {
    clusterGroup.off("clusterclick");
    clusterGroup.on("clusterclick", (e) => {
      e.layer.spiderfy();
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
  }

  state.clusterGroup = clusterGroup;
  state.markers = [];

  /* ============================================================
     CREATE MARKERS
  ============================================================ */
  state.places.forEach((place, index) => {
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!lat || !lng) {
      state.markers.push(null);
      return;
    }

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(place.category),
    });

    const key = getPlaceKey(place, index);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const gmapUrl =
      place.google_maps_url ||
      place.map_url ||
      place.maps_url ||
      place.google_url ||
      (hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null);

    const popupHtml = buildPopupHtml(place, key, gmapUrl);

    if (!isMobile()) {
      marker.bindPopup(popupHtml, { sanitize: false });
      marker.on("click", () => {
        highlightMarker(marker);
        marker.openPopup();
      });
    }

    if (isMobile()) {
      marker.unbindPopup();
      marker.off("popupopen");
      marker.closePopup();

      marker.on("click", () => {
        highlightMarker(marker);

        const evt = new CustomEvent("place:openSheet", {
          detail: { place, key, index },
        });

        window.dispatchEvent(evt);
      });
    }

    marker.on("click", () => {
      document
        .querySelectorAll(".marker-pin")
        .forEach((el) => el.classList.remove("marker-pin-selected"));

      const pin = marker._icon?.querySelector(".marker-pin");
      if (pin) pin.classList.add("marker-pin-selected");
    });

    clusterGroup.addLayer(marker);
    state.markers.push(marker);
  });

  /* ============================================================
     POPUP ENHANCEMENTS (DESKTOP ONLY)
  ============================================================ */
  if (!isMobile()) {
    state.map.on("popupopen", (e) => {
      setTimeout(() => {
        const popupEl = e.popup.getElement();
        if (!popupEl) return;

        const seeMoreBtn = popupEl.querySelector(".popup-see-more");
        const moreSection = popupEl.querySelector(".popup-more-section");

        if (seeMoreBtn && moreSection) {
          seeMoreBtn.onclick = (ev) => {
            ev.stopPropagation();
            moreSection.classList.toggle("expanded");
            seeMoreBtn.textContent = moreSection.classList.contains("expanded")
              ? "See less"
              : "See more";
          };
        }
      });
    });
  }

  state.map.addLayer(clusterGroup);
}

/* ============================================================
   MARKER ICON
============================================================ */
function createMarkerIcon(category) {
  const color = getCategoryColor(category);
  const emoji = getCategoryEmoji(category);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-pin" style="background:${color}">
        <span class="marker-emoji">${emoji}</span>
      </div>
    `,
    iconSize: [26, 36],
    iconAnchor: [13, 34],
    popupAnchor: [0, -32],
  });
}

/* ============================================================
   POPUP HTML
============================================================ */
function buildPopupHtml(place, key, url) {
  let html = `<div class="popup-card">`;

  html += `
    <div class="popup-header">
      <div class="popup-title">${place.title || ""}</div>
      <button class="fav-btn ${isFavorite(key) ? "fav-active" : ""}" data-key="${key}">♡</button>
    </div>
  `;

  if (place.category || place.region) {
    const emoji = place.category ? getCategoryEmoji(place.category) : "";
    html += `<div class="popup-category">
      ${emoji ? emoji + " " : ""}${place.category || ""}${
      place.region ? " • " + place.region : ""
    }
    </div>`;
  }

  const img = place.image_url || place.image;
  if (img) {
    html += `
      <div class="popup-image-wrapper skeleton">
        <img src="${img}" class="popup-image"
             onload="this.classList.remove('skeleton'); this.parentElement.classList.remove('skeleton');" />
      </div>
    `;
  }

  if (place.description) {
    html += `<div class="popup-desc">${place.description}</div>`;
  }

  /* Google Maps button */
  if (url) {
    html += `
      <a href="${url}" target="_blank" rel="noopener" class="popup-button popup-gmaps">
        Open in Google Maps
      </a>
    `;
  }

  html += `
    <button class="popup-see-more popup-button">See more</button>
    <div class="popup-more-section collapsed">
  `;

  /* NEW — full-width Website button */
  if (place.website_url) {
    html += `
      <button class="popup-button popup-website"
              onclick="window.open('${place.website_url}', '_blank')">
        Visit Website
      </button>
    `;
  } else {
    html += `<div class="popup-row">Website: N/A</div>`;
  }

  html += `
      <div class="popup-row"><strong>Cost:</strong> ${place.cost || "N/A"}</div>
      <div class="popup-row"><strong>Parking:</strong> ${
        place.parking || "N/A"
      }</div>
      <div class="popup-row"><strong>Municipality:</strong> ${
        place.municipality || "N/A"
      }</div>
    </div>
  `;

  html += `</div>`;
  return html;
}

/* ============================================================
   HIGHLIGHT ANIMATION
============================================================ */
export function highlightMarker(marker) {
  if (!marker || !state.map) return;

  if (highlightRing) {
    state.map.removeLayer(highlightRing);
    highlightRing = null;
  }

  highlightRing = L.circleMarker(marker.getLatLng(), {
    radius: 18,
    color: "#38BDF8",
    weight: 2,
    fillOpacity: 0,
    className: "marker-highlight-ring",
  }).addTo(state.map);

  setTimeout(() => {
    if (highlightRing) {
      state.map.removeLayer(highlightRing);
      highlightRing = null;
    }
  }, 800);
}
