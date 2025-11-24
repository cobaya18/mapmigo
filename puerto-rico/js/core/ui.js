// js/core/ui.js
import { state } from "./state.js";
import { getPlaceKey, getCategoryColor } from "./util.js";
import { isFavorite, toggleFavorite, getFavoriteKeys } from "./favorites.js";
import { highlightMarker } from "./markers.js";
import { initListView } from "./list-view.js";

export function initUI() {
  initViewportFix();
  initSidebarToggle();
  initListView();
  initGPSButton();
  initPlaceSheet();
  initFilterSheet();
}

/* Viewport fix for mobile 100vh */
function initViewportFix() {
  const updateVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  updateVH();
  window.addEventListener("resize", updateVH);
  window.addEventListener("orientationchange", updateVH);
}

/* Sidebar toggle (desktop collapse / mobile bottom sheet) */
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const hamburgerButton = document.getElementById("hamburgerButton");

  if (!sidebar || !hamburgerButton) return;

  const isMobile = () => window.innerWidth <= 768;

  function toggleSidebar() {
    if (isMobile()) {
      sidebar.classList.toggle("open-mobile");
    } else {
      sidebar.classList.toggle("collapsed-desktop");
    }
  }

  hamburgerButton.addEventListener("click", toggleSidebar);

  window.addEventListener("resize", () => {
    if (isMobile()) sidebar.classList.remove("collapsed-desktop");
    else sidebar.classList.remove("open-mobile");
  });
}

/* GPS Button */
function initGPSButton() {
  const gpsButton = document.getElementById("gpsButton");
  if (!gpsButton || !state.map) return;

  let userLocationMarker = null;

  gpsButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    gpsButton.classList.add("gps-active");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsButton.classList.remove("gps-active");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!userLocationMarker) {
          userLocationMarker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            color: "#93C5FD",
            weight: 3,
          }).addTo(state.map);
        } else {
          userLocationMarker.setLatLng([lat, lng]);
        }

        state.map.setView([lat, lng], 13);
      },
      (err) => {
        gpsButton.classList.remove("gps-active");
        console.warn("Geolocation error", err);
        alert("Unable to get your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

/* Mobile place sheet */
function initPlaceSheet() {
  const placeSheet = document.getElementById("placeSheet");
  if (!placeSheet) return;

  const sheetTitle = document.getElementById("sheetTitle");
  const sheetMeta = document.getElementById("sheetMeta");
  const sheetDetails = document.getElementById("sheetDetails");
  const sheetImage = document.getElementById("sheetImage");
  const sheetDesc = document.getElementById("sheetDescription");
  const sheetMapsBtn = document.getElementById("sheetMapsBtn");
  const sheetHandle = placeSheet.querySelector(".sheet-handle");
  const sheetPreview = document.getElementById("sheetPreview");
  const sheetFavBtn = document.getElementById("sheetFavBtn");

  if (sheetImage) sheetImage.loading = "lazy";

  let currentSheetKey = null;

  function showPlaceSheet(place, key, index) {
    placeSheet.classList.add("visible");
    placeSheet.classList.remove("expanded");
    placeSheet.style.transition = "transform 0.25s ease";
    placeSheet.style.transform = "";
    currentSheetKey = key;

    if (sheetTitle) sheetTitle.textContent = place.title || "";
    if (sheetMeta) {
      sheetMeta.textContent = [place.category, place.region]
        .filter(Boolean)
        .join(" • ");
    }
    if (sheetDesc) sheetDesc.textContent = place.description || "";

    /* NEW — Full-width Website Button */
    const w = document.getElementById("sheetWebsite");
    const c = document.getElementById("sheetCost");
    const p = document.getElementById("sheetParking");
    const m = document.getElementById("sheetMunicipality");

    if (w) {
      w.innerHTML = place.website_url
        ? `<button class="popup-button popup-website"
                     onclick="window.open('${place.website_url}', '_blank')">
             Visit Website
           </button>`
        : "N/A";
    }

    if (c) c.textContent = place.cost || "N/A";
    if (p) p.textContent = place.parking || "N/A";
    if (m) m.textContent = place.municipality || "N/A";

    if (sheetImage) {
      if (place.image_url) {
        sheetImage.style.display = "block";
        sheetImage.classList.add("skeleton");
        sheetImage.onload = () => sheetImage.classList.remove("skeleton");
        sheetImage.src = place.image_url;
      } else {
        sheetImage.style.display = "none";
      }
    }

    const url =
      place.google_maps_url ||
      place.map_url ||
      place.maps_url ||
      place.google_url ||
      null;

    if (sheetMapsBtn) {
      if (url) {
        sheetMapsBtn.href = url;
        sheetMapsBtn.style.display = "inline-block";
      } else {
        sheetMapsBtn.style.display = "none";
      }
    }

    if (sheetFavBtn) {
      if (isFavorite(key)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    }
  }

  if (sheetFavBtn) {
    sheetFavBtn.addEventListener("click", () => {
      if (!currentSheetKey) return;
      toggleFavorite(currentSheetKey);
      sheetFavBtn.classList.toggle("fav-active", isFavorite(currentSheetKey));
    });
  }

  /* Drag to close */
  let dragStartY = null;
  let currentY = null;
  let dragging = false;

  function sheetTouchStart(e) {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;
    dragging = true;
    dragStartY = e.touches[0].clientY;
    currentY = dragStartY;
    placeSheet.style.transition = "none";
  }

  function sheetTouchMove(e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY;
    if (delta > 0) {
      placeSheet.style.transform = `translateY(${delta}px)`;
    }
  }

  function sheetTouchEnd() {
    if (!dragging) return;
    dragging = false;
    placeSheet.style.transition = "transform 0.25s ease";
    const delta = (currentY || dragStartY) - dragStartY;

    if (delta > 80) {
      placeSheet.classList.remove("visible");
      placeSheet.classList.remove("expanded");
      placeSheet.style.transform = "";
    } else {
      placeSheet.style.transform = "";
    }

    dragStartY = null;
    currentY = null;
  }

  [sheetHandle, sheetPreview].forEach((el) => {
    if (!el) return;
    el.addEventListener("touchstart", sheetTouchStart, { passive: true });
    el.addEventListener("touchmove", sheetTouchMove, { passive: true });
    el.addEventListener("touchend", sheetTouchEnd);
    el.addEventListener("touchcancel", sheetTouchEnd);
  });

  window.addEventListener("place:openSheet", (e) => {
    const { place, key, index } = e.detail;
    showPlaceSheet(place, key, index);
  });
}

function initFilterSheet() {
  const filterSheet = document.getElementById("filterSheet");
  if (!filterSheet) return;

  const sheetHandle = filterSheet.querySelector(".peek-drag-area");
  const closeBtn = document.getElementById("filterSheetClose");
  const isMobile = () => window.innerWidth <= 768;

  function openSheet() {
    if (!isMobile()) return;
    filterSheet.classList.add("visible");
  }

  function closeSheet() {
    filterSheet.classList.remove("visible");
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSheet);
  }

  if (!sheetHandle) return;

  sheetHandle.addEventListener("click", openSheet);

  let dragStartY = null;
  let currentY = null;
  let dragging = false;

  function handleTouchStart(e) {
    if (!isMobile()) return;
    if (!e.touches || e.touches.length !== 1) return;
    dragging = true;
    dragStartY = e.touches[0].clientY;
    currentY = dragStartY;
    filterSheet.style.transition = "none";
  }

  function handleTouchMove(e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY;
    if (delta > 0) {
      filterSheet.style.transform = `translateY(${delta}px)`;
    }
  }

  function handleTouchEnd() {
    if (!dragging) return;
    dragging = false;
    filterSheet.style.transition = "transform 0.25s ease";
    const delta = (currentY || dragStartY) - dragStartY;

    if (delta > 80) {
      filterSheet.style.transform = "";
      closeSheet();
    } else {
      filterSheet.style.transform = "";
      openSheet();
    }

    dragStartY = null;
    currentY = null;
  }

  sheetHandle.addEventListener("touchstart", handleTouchStart, { passive: true });
  sheetHandle.addEventListener("touchmove", handleTouchMove, { passive: true });
  sheetHandle.addEventListener("touchend", handleTouchEnd);
  sheetHandle.addEventListener("touchcancel", handleTouchEnd);
}
