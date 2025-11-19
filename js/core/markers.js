// js/core/markers.js
import { state } from "./state.js";
import { getCategoryColor, getCategoryEmoji, getPlaceKey } from "./util.js";
import { isFavorite, toggleFavorite } from "./favorites.js";

let highlightRing = null;

export function initMarkers() {
  if (!state.map) throw new Error("Map not initialized");

  const isMobile = () => window.innerWidth <= 768;

  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: !isMobile(),   // mobile = no zoomToBounds popup
    spiderfyOnEveryClick: true,
    animateAddingMarkers: true,
    disableClusteringAtZoom: 10,
    maxClusterRadius: 50,
    spiderfyDistanceMultiplier: 1.4,
  });

  // Mobile: Prevent ANY popup from cluster clicks
  if (isMobile()) {
    clusterGroup.on("clusterclick", function (e) {
      // Just spiderfy — do NOT open popups
      e.layer.spiderfy();
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    });
  }

  state.clusterGroup = clusterGroup;
  state.markers = [];

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

    /* =====================================================
       DESKTOP BEHAVIOR — Normal Popups
    ===================================================== */
    if (!isMobile()) {
      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        highlightMarker(marker);
        marker.openPopup();
      });

      // Add favorite button behavior inside popup
      marker.on("popupopen", (e) => {
        const popupNode = e.popup._contentNode;
        const favBtn = popupNode.querySelector(".fav-btn");
        if (favBtn) {
          favBtn.onclick = (evt) => {
            evt.stopPropagation();
            const k = favBtn.dataset.key;
            toggleFavorite(k);
            favBtn.classList.toggle("fav-active", isFavorite(k));
          };
        }
      });

    } else {

      /* =====================================================
         MOBILE BEHAVIOR — NO POPUPS AT ALL
      ===================================================== */

      marker.unbindPopup();      // remove popup binding
      marker.off("popupopen");   // remove popup-trigger event
      marker.closePopup();       // ensure popups never appear

      marker.on("click", () => {
        highlightMarker(marker);

        const evt = new CustomEvent("place:openSheet", {
          detail: { place: p, key, index },
        });
        window.dispatchEvent(evt);
      });
    }

    // Visual highlight for both desktop + mobile
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

  /* =====================================================
     Mobile — GLOBAL popup prevention
  ===================================================== */
  if (isMobile()) {
    state.map.on("popupopen", (e) => {
      e.popup._close();
    });
  }

  state.map.addLayer(clusterGroup);
}

/* =====================================================
   ICON BUILDER
===================================================== */
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

/* =====================================================
   POPUP BUILDER (Desktop ONLY)
===================================================== */
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

/* =====================================================
   MARKER HIGHLIGHT ANIMATION
===================================================== */
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
