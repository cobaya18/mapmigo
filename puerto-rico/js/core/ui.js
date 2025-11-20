// js/core/ui.js
import { state } from "./state.js";
import { getPlaceKey } from "./util.js";
import { isFavorite, toggleFavorite, getFavoriteKeys } from "./favorites.js";
import { highlightMarker } from "./markers.js";

const SHEET_STATES = {
  HIDDEN: "hidden",
  PEEK: "peek",
  HALF: "half",
  FULL: "full",
};

export function initUI() {
  initViewportFix();
  initSidebarToggle();
  initListView();
  initGPSButton();
  initPlaceSheet();
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
  const closeSidebarMobile = document.getElementById("closeSidebarMobile");

  if (!sidebar || !hamburgerButton) return;

  const isMobile = () => window.innerWidth <= 768;

  function toggleSidebar() {
    if (isMobile()) {
      sidebar.classList.toggle("open-mobile");
      sidebar.classList.remove("collapsed-desktop");
    } else {
      sidebar.classList.toggle("collapsed-desktop");
      sidebar.classList.remove("open-mobile");
    }
  }

  if (closeSidebarMobile) {
    closeSidebarMobile.addEventListener("click", () => {
      sidebar.classList.remove("open-mobile");
    });
  }

  hamburgerButton.addEventListener("click", toggleSidebar);

  window.addEventListener("resize", () => {
    if (isMobile()) sidebar.classList.remove("collapsed-desktop");
    else sidebar.classList.remove("open-mobile");
  });
}

/* List view + Saved view */
function initListView() {
  const overlay = document.getElementById("listViewOverlay");
  const listViewList = document.getElementById("listViewList");
  const openListViewBtn = document.getElementById("openListView");
  const closeListViewBtn = document.getElementById("closeListView");
  const openSavedViewBtn = document.getElementById("openSavedView");
  const listHeaderTitleEl = document.getElementById("listHeaderTitle");

  if (!overlay || !listViewList) return;

  function renderListView(items, mode = "all") {
    if (!Array.isArray(items)) {
      listViewList.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "list-empty-state";
      empty.textContent = "No places loaded yet.";
      empty.style.padding = "0.75rem";
      listViewList.appendChild(empty);
      return;
    }

    const sorted = [...items].sort((a, b) =>
      (a.place.title || "").localeCompare(b.place.title || "", "en", {
        sensitivity: "base",
      })
    );

    listViewList.innerHTML = "";

    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "list-empty-state";
      empty.textContent =
        mode === "favorites"
          ? "No saved places yet. Tap the heart on a place to save it."
          : "No places match your filters or search. Try adjusting them.";
      empty.style.padding = "0.75rem";
      listViewList.appendChild(empty);
      return;
    }

    sorted.forEach(({ place, index }) => {
      const key = getPlaceKey(place, index);
      const item = document.createElement("button");
      item.className = "list-item";

      // MAIN CONTAINER
      const content = document.createElement("div");
      content.className = "list-item-content";

      const details = document.createElement("div");
      details.className = "list-item-details";

      // TITLE ROW + HEART
      const titleRow = document.createElement("div");
      titleRow.className = "list-title-row";

      const titleEl = document.createElement("div");
      titleEl.className = "list-title";
      titleEl.textContent = place.title || "";

      const favBtn = document.createElement("button");
      favBtn.className = "list-fav-btn";
      if (isFavorite(key)) favBtn.classList.add("fav-active");
      favBtn.textContent = "♡";
      favBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(key);
        favBtn.classList.toggle("fav-active", isFavorite(key));
      };

      titleRow.appendChild(titleEl);
      titleRow.appendChild(favBtn);

      // META
      const metaEl = document.createElement("div");
      metaEl.className = "list-meta";
      metaEl.textContent = [place.category, place.region]
        .filter(Boolean)
        .join(" • ");

      // DESCRIPTION
      const descEl = document.createElement("div");
      descEl.className = "list-desc";
      descEl.textContent = place.description || "";

      // CONTENT STACK
      details.appendChild(titleRow);
      details.appendChild(metaEl);
      details.appendChild(descEl);

      content.appendChild(details);
      item.appendChild(content);

      item.addEventListener("click", () => {
        const marker = state.markers[index];
        if (marker) {
          state.map.setView(marker.getLatLng(), 14);
          highlightMarker(marker);

          if (window.innerWidth <= 768) {
            const evt = new CustomEvent("place:openSheet", {
              detail: { place, key, index },
            });
            window.dispatchEvent(evt);
          } else {
            marker.fire("click");
          }
        }
      });

      listViewList.appendChild(item);
    });
  }

  function openListViewAll() {
    if (!overlay) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    listHeaderTitleEl.textContent = "All places";

    const items =
      state.filteredPlaces && state.filteredPlaces.length
        ? state.filteredPlaces
        : state.currentVisible || [];

    renderListView(items, "all");
  }

  function openListViewSaved() {
    if (!overlay) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    listHeaderTitleEl.textContent = "Saved places";

    const favorites = getFavoriteKeys();
    const source =
      state.filteredPlaces && state.filteredPlaces.length
        ? state.filteredPlaces
        : state.currentVisible || [];

    const items = source.filter(({ place, index }) => {
      const key = getPlaceKey(place, index);
      return favorites.includes(key);
    });

    renderListView(items, "favorites");
  }

  function closeListView() {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  if (openListViewBtn) {
    openListViewBtn.addEventListener("click", openListViewAll);
  }

  if (openSavedViewBtn) {
    openSavedViewBtn.addEventListener("click", openListViewSaved);
  }

  if (closeListViewBtn) {
    closeListViewBtn.addEventListener("click", closeListView);
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeListView();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeListView();
    }
  });
}

/* GPS button */
function initGPSButton() {
  const gpsButton = document.getElementById("gpsButton");
  if (!gpsButton) return;

  gpsButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    gpsButton.classList.add("gps-active");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (state.map) {
          const lat = latitude;
          const lng = longitude;
          state.map.setView([lat, lng], 13);
        }
        gpsButton.classList.remove("gps-active");
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
  const sheetExpand = document.getElementById("sheetExpand");
  const sheetDetails = document.getElementById("sheetDetails");
  const sheetImage = document.getElementById("sheetImage");
  const sheetDesc = document.getElementById("sheetDescription");
  const sheetMapsBtn = document.getElementById("sheetMapsBtn");
  const sheetHandle = placeSheet.querySelector(".sheet-handle");
  const sheetPreview = document.getElementById("sheetPreview");
  const sheetFavBtn = document.getElementById("sheetFavBtn");

  if (sheetImage) sheetImage.loading = "lazy";

  let currentSheetState = SHEET_STATES.HIDDEN;
  let currentSheetKey = null;

  const STATE_CLASSES = [
    "sheet-hidden",
    "sheet-peek",
    "sheet-half",
    "sheet-full",
  ];

  function applySheetState(nextState) {
    if (!placeSheet) return;

    STATE_CLASSES.forEach((cls) => placeSheet.classList.remove(cls));

    switch (nextState) {
      case SHEET_STATES.PEEK:
        placeSheet.classList.add("sheet-peek");
        placeSheet.setAttribute("aria-hidden", "false");
        document.body.classList.remove("sheet-open-full");
        break;
      case SHEET_STATES.HALF:
        placeSheet.classList.add("sheet-half");
        placeSheet.setAttribute("aria-hidden", "false");
        document.body.classList.remove("sheet-open-full");
        break;
      case SHEET_STATES.FULL:
        placeSheet.classList.add("sheet-full");
        placeSheet.setAttribute("aria-hidden", "false");
        document.body.classList.add("sheet-open-full");
        break;
      case SHEET_STATES.HIDDEN:
      default:
        placeSheet.classList.add("sheet-hidden");
        placeSheet.setAttribute("aria-hidden", "true");
        document.body.classList.remove("sheet-open-full");
        break;
    }

    currentSheetState = nextState;
  }

  function closeSheet() {
    currentSheetKey = null;
    applySheetState(SHEET_STATES.HIDDEN);
    placeSheet.style.transform = "";
  }

  function showPlaceSheet(place, key, index, opts = {}) {
    const initialState = opts.state || SHEET_STATES.PEEK;
    currentSheetKey = key;

    if (sheetTitle) sheetTitle.textContent = place.title || "";
    if (sheetMeta) {
      sheetMeta.textContent = [place.category, place.region]
        .filter(Boolean)
        .join(" • ");
    }
    if (sheetDesc) sheetDesc.textContent = place.description || "";

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
        sheetMapsBtn.style.display = "inline-flex";
      } else {
        sheetMapsBtn.removeAttribute("href");
        sheetMapsBtn.style.display = "none";
      }
    }

    if (sheetFavBtn) {
      if (isFavorite(key)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    }

    applySheetState(initialState);
  }

  if (sheetExpand) {
    sheetExpand.addEventListener("click", () => {
      if (
        currentSheetState === SHEET_STATES.PEEK ||
        currentSheetState === SHEET_STATES.HALF
      ) {
        applySheetState(SHEET_STATES.FULL);
      } else {
        applySheetState(SHEET_STATES.PEEK);
      }
    });
  }

  if (sheetFavBtn) {
    sheetFavBtn.addEventListener("click", () => {
      if (!currentSheetKey) return;
      toggleFavorite(currentSheetKey);
      if (isFavorite(currentSheetKey)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    });
  }

  // Drag-to-close on mobile
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
      closeSheet();
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

  // Listen for openSheet events from markers/search/list
  window.addEventListener("place:openSheet", (e) => {
    const { place, key, index } = e.detail;
    showPlaceSheet(place, key, index);
  });

  // Optional global close event
  window.addEventListener("place:closeSheet", () => {
    closeSheet();
  });
}
