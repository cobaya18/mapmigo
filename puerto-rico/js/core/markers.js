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

export function initMarkers() {
  if (!state.map) throw new Error("Map not initialized");

  const isMobile = () => window.innerWidth <= 768;

  /* ============================================================
     GLOBAL MOBILE POPUP DISABLER (NUCLEAR FIX)
     This removes *all* Leaflet popup capability on mobile.
  ============================================================ */
  if (isMobile()) {
    L.Map.prototype.openPopup = function () { return this; };
    L.Popup.prototype.openOn = function () { return this; };
  }

  /* ============================================================
     CLUSTER GROUP
  ============================================================ */
  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: !isMobile(), // disable zoom-popup on mobile
    spiderfyOnEveryClick: true,
    disableClusteringAtZoom: 10,
    maxClusterRadius: 50,
  });

  // MOBILE: Disable cluster popups fully
  if (isMobile()) {
    clusterGroup.off("clusterclick");
    clusterGroup.on("clusterclick", (e) => {
      // Only spiderfy, NEVER open a popup
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
    const gmapUrl =
      place.google_maps_url ||
      place.map_url ||
      place.maps_url ||
      place.google_url ||
      null;

    /* ============================================================
       POPUP BUILD
    ============================================================ */
    const popupHtml = buildPopupHtml(place, key, gmapUrl);

    /* ============================================================
       DESKTOP MODE — popups work normally
    ============================================================ */
    if (!isMobile()) {
      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        highlightMarker(marker);
        marker.openPopup();
      });

      // FIXED FAVORITE BUTTON HANDLER
      marker.on("popupopen", (e) => {
        const popupNode = e.popup.getElement(); // FIXED: live DOM each open
        if (!popupNode) return;

        const favBtn = popupNode.querySelector(".fav-btn");
        if (!favBtn) return;

        favBtn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          toggleFavorite(key);
          favBtn.classList.toggle("fav-active", isFavorite(key));
        });
      });
    }

    /* ============================================================
       MOBILE MODE — NO POPUPS EVER
       Clicking marker opens bottom sheet only.
    ============================================================ */
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

    /* Marker selection highlight (both desktop + mobile) */
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
     LAST LINE OF DEFENSE:
     If ANY popup attempts to open on mobile → kill it instantly.
  ============================================================ */
  if (isMobile()) {
    state.map.on("popupopen", (e) => {
      e.popup._close();
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
   POPUP HTML (desktop only)
============================================================ */
function buildPopupHtml(place, key, url) {
  let html = `<div class="popup-card">`;

  html += `
    <div class="popup-header">
      <div class="popup-title">${place.title || ""}</div>
      <button class="fav-btn ${isFavorite(key) ? "fav-active" : ""}" data-key="${key}">
        ♡
      </button>
    </div>
  `;

  if (place.category) {
    html += `<div class="popup-category">${place.category}</div>`;
  }

  if (place.image_url) {
    html += `
      <div class="popup-image-wrapper skeleton">
        <img loading="lazy" src="${place.image_url}"
             class="skeleton"
             onload="this.classList.remove('skeleton'); this.parentElement.classList.remove('skeleton');" />
      </div>
    `;
  }

  if (place.description) {
    html += `<div class="popup-desc">${place.description}</div>`;
  }

  if (url) {
    html += `<a class="popup-button" target="_blank" href="${url}">Open in Google Maps</a>`;
  }

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
