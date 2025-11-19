// js/core/markers.js
import { state } from "./state.js";
import { getCategoryColor, getCategoryEmoji, getPlaceKey } from "./util.js";
import { isFavorite, toggleFavorite } from "./favorites.js";

let highlightRing = null;

export function initMarkers() {
  if (!state.map) throw new Error("Map not initialized");
  if (!Array.isArray(state.places)) state.places = [];

  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnEveryClick: true,
    animateAddingMarkers: true,
    disableClusteringAtZoom: 10,
    maxClusterRadius: 50,
    spiderfyDistanceMultiplier: 1.4,
  });

  state.markers = [];
  state.clusterGroup = clusterGroup;

  const isMobile = () => window.innerWidth <= 768;

  state.places.forEach((p, index) => {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (!lat || !lng) {
      state.markers.push(null);
      return;
    }

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(p.category),
    });

    const key = getPlaceKey(p, index);
    const url =
      p.google_maps_url || p.map_url || p.maps_url || p.google_url || null;

    const popupHtml = buildPopupHtml(p, key, url);

    // DESKTOP ONLY: bind popup
    if (!isMobile()) {
      marker.bindPopup(popupHtml);

      // Desktop click → open popup
      marker.on("click", () => {
        highlightMarker(marker);
        marker.openPopup();
      });

      // Attach favorite button in popup
      marker.on("popupopen", (e) => {
        const popupNode = e.popup._contentNode;
        const favBtn = popupNode.querySelector(".fav-btn");
        if (favBtn) {
          favBtn.onclick = (evt) => {
            evt.stopPropagation();
            const k = favBtn.dataset.key;
            toggleFavorite(k);
            if (isFavorite(k)) favBtn.classList.add("fav-active");
            else favBtn.classList.remove("fav-active");
          };
        }
      });

    } else {
      // MOBILE ONLY: disable popups completely
      marker.unbindPopup();

      // Mobile click → open bottom-sheet
      marker.on("click", () => {
        highlightMarker(marker);

        const evt = new CustomEvent("place:openSheet", {
          detail: { place: p, key, index },
        });
        window.dispatchEvent(evt);
      });

      // Prevent long press or weird popup events
      marker.on("popupopen", () => marker.closePopup());
    }

    // Marker selection effect (desktop + mobile)
    marker.on("click", () => {
      document
        .querySelectorAll(".marker-pin")
        .forEach((pEl) => pEl.classList.remove("marker-pin-selected"));

      const el = marker._icon;
      if (el) {
        const pin = el.querySelector(".marker-pin");
        if (pin) pin.classList.add("marker-pin-selected");
      }
    });

    clusterGroup.addLayer(marker);
    state.markers.push(marker);
  });

  state.map.addLayer(clusterGroup);
}

/* =====================================================================
   MARKER ICON
===================================================================== */
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

/* =====================================================================
   POPUP HTML (Desktop Only)
===================================================================== */
function buildPopupHtml(place, key, url) {
  let html = "<div class='popup-card'>";

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
        <img loading="lazy" src="${place.image_url}" class="skeleton"
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

  html += "</div>";
  return html;
}

/* =====================================================================
   HIGHLIGHT EFFECT (Desktop + Mobile)
===================================================================== */
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
    if (highlightRing && state.map) {
      state.map.removeLayer(highlightRing);
      highlightRing = null;
    }
  }, 800);
}
