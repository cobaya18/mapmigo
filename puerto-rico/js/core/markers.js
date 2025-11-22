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
     GLOBAL MOBILE POPUP DISABLER (NUCLEAR FIX)
     This removes *all* Leaflet popup capability on mobile.
  ============================================================ */
  if (isMobile()) {
    L.Map.prototype.openPopup = function () { return this; };
    L.Popup.prototype.openOn = function () { return this; };
  } else {
    // Desktop only: set up global handler for popup favorite buttons
    initPopupFavoriteHandler();
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
      // Disable sanitization so Leaflet does not strip heart / data attributes
      marker.bindPopup(popupHtml, { sanitize: false });

      marker.on("click", () => {
        highlightMarker(marker);
        marker.openPopup();
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
     LAST LINE OF DEFENSE + DESKTOP POPUP ENHANCEMENTS:
     Mobile: kill all popups. Desktop: wire popup UI controls.
  ============================================================ */
  if (isMobile()) {
    state.map.on("popupopen", (e) => {
      setTimeout(() => {
        const popupEl = e.popup.getElement();
        if (!popupEl) return;

        if (popupEl.dataset && popupEl.dataset.enhanced === "1") return;
        if (popupEl.dataset) popupEl.dataset.enhanced = "1";

        const seeMoreBtn = popupEl.querySelector(".popup-see-more");
        const moreSection = popupEl.querySelector(".popup-more-section");
        if (seeMoreBtn && moreSection) {
          seeMoreBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            moreSection.classList.toggle("expanded");
            seeMoreBtn.textContent = moreSection.classList.contains("expanded")
              ? "See less"
              : "See more";
          });
        }

        const shareBtn = popupEl.querySelector(".popup-share-button");
        const shareMenu = popupEl.querySelector(".popup-share-menu");
        if (shareBtn && shareMenu) {
          shareBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            shareMenu.classList.toggle("hidden");
          });
        }

        const gmapsLink = popupEl.querySelector(".popup-share-gmaps");
        const copyBtn = popupEl.querySelector(".popup-share-copy");
        if (copyBtn && gmapsLink && navigator.clipboard) {
          copyBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            try { await navigator.clipboard.writeText(gmapsLink.href); } catch(e){}
          });
        }

        const nativeBtn = popupEl.querySelector(".popup-share-native");
        if (nativeBtn && gmapsLink && navigator.share) {
          nativeBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            navigator.share({
              title: popupEl.querySelector(".popup-title")?.textContent || "MapMigo",
              url: gmapsLink.href
            }).catch(()=>{});
          });
        }
      });
    })
  } else {
    state.map.on("popupopen", (e) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      // Avoid double-binding listeners
      if (popupEl.dataset && popupEl.dataset.enhanced === "1") return;
      if (popupEl.dataset) popupEl.dataset.enhanced = "1";

      const seeMoreBtn = popupEl.querySelector(".popup-see-more");
      const moreSection = popupEl.querySelector(".popup-more-section");
      if (seeMoreBtn && moreSection) {
        seeMoreBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          moreSection.classList.toggle("expanded");
          seeMoreBtn.textContent = moreSection.classList.contains("expanded")
            ? "See less"
            : "See more";
        });
      }

      const shareBtn = popupEl.querySelector(".popup-share-button");
      const shareMenu = popupEl.querySelector(".popup-share-menu");
      if (shareBtn && shareMenu) {
        shareBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          shareMenu.classList.toggle("hidden");
        });
      }

      const gmapsLink = popupEl.querySelector(".popup-share-gmaps");
      const copyBtn = popupEl.querySelector(".popup-share-copy");
      if (copyBtn && gmapsLink && navigator.clipboard) {
        copyBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await navigator.clipboard.writeText(gmapsLink.href);
          } catch (err) {
            console.warn("Clipboard copy failed", err);
          }
        });
      }

      const nativeBtn = popupEl.querySelector(".popup-share-native");
      if (nativeBtn && gmapsLink && navigator.share) {
        nativeBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await navigator.share({
              title: popupEl.querySelector(".popup-title")?.textContent || "MapMigo",
              url: gmapsLink.href,
            });
          } catch (err) {
            console.warn("Native share failed", err);
          }
        });
      }
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
      <button class="fav-btn ${isFavorite(key) ? "fav-active" : ""}" data-key="${key}">♡</button>
      <button class="popup-share-button">⋮</button>
    </div>
  `;

  const hasCategory = !!place.category;
  const hasRegion = !!place.region;
  if (hasCategory || hasRegion) {
    const emoji = hasCategory ? getCategoryEmoji(place.category) : "";
    const categoryText = hasCategory ? place.category : "";
    const regionPart = hasRegion ? ` • ${place.region}` : "";
    html += `<div class="popup-category">${emoji ? emoji + " " : ""}${categoryText}${regionPart}</div>`;
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

  html += `
    <button class="popup-see-more popup-button">See more</button>
    <div class="popup-more-section collapsed">
      <div class="popup-row"><strong>Website:</strong> ${place.website_url ? `<a href="${place.website_url}" target="_blank">${place.website_url}</a>` : "N/A"}</div>
      <div class="popup-row"><strong>Cost:</strong> ${place.cost || "N/A"}</div>
      <div class="popup-row"><strong>Parking:</strong> ${place.parking || "N/A"}</div>
      <div class="popup-row"><strong>Municipality:</strong> ${place.municipality || "N/A"}</div>
    </div>
  `;

  html += `
    <div class="popup-share-menu hidden">
      <a class="popup-share-gmaps" target="_blank" href="${url}">Open in Google Maps</a>
      <button class="popup-share-copy">Copy link</button>
      <button class="popup-share-native">Share…</button>
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
