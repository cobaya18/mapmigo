// js/core/ui.js
import { state } from "./state.js";
import { getPlaceKey, getCategoryColor } from "./util.js";
import { isFavorite, toggleFavorite, getFavoriteKeys } from "./favorites.js";
import { highlightMarker } from "./markers.js";

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
    const sorted = [...items].sort((a, b) =>
      (a.place.title || "").localeCompare(b.place.title || "", "en", {
        sensitivity: "base",
      })
    );

    listViewList.innerHTML = "";

    if (mode === "saved" && sorted.length === 0) {
      const empty = document.createElement("div");
      empty.style.padding = "0.75rem";
      empty.style.fontSize = "0.85rem";
      empty.style.color = "#9ca3af";
      empty.textContent =
        "You haven’t saved any places yet. Tap the ♡ icon on a place to save it.";
      listViewList.appendChild(empty);
    }
    
sorted.forEach(({ place, index }) => {
  const key = getPlaceKey(place, index);

  const div = document.createElement("div");
  div.className = "list-item";

  /* -----------------------------
     THUMBNAIL
  ----------------------------- */
  const thumb = document.createElement("div");
  thumb.className = "list-thumb skeleton";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.classList.add("skeleton");

  if (place.image_url) {
    img.onload = () => {
      img.classList.remove("skeleton");
      thumb.classList.remove("skeleton");
    };
    img.src = place.image_url;
  } else {
    thumb.classList.remove("skeleton");
  }

  thumb.appendChild(img);
  div.appendChild(thumb);

  /* -----------------------------
     RIGHT SIDE CONTENT
  ----------------------------- */
  const details = document.createElement("div");
  details.className = "list-content";

  /* TITLE ROW (title + heart) */
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

  /* META */
  const metaEl = document.createElement("div");
  metaEl.className = "list-meta";

  const category = place.category || "";
  const region = place.region || "";

  if (category) {
    const colorChip = document.createElement("span");
    colorChip.className = "list-meta-color";
    try {
      colorChip.style.backgroundColor = getCategoryColor(category);
    } catch (e) {
      // fallback – leave default
    }
    metaEl.appendChild(colorChip);

    const catSpan = document.createElement("span");
    catSpan.className = "list-meta-category";
    catSpan.textContent = category;
    metaEl.appendChild(catSpan);
  }

  if (category && region) {
    const sep = document.createElement("span");
    sep.textContent = " • ";
    metaEl.appendChild(sep);
  }

  if (region) {
    const regSpan = document.createElement("span");
    regSpan.className = "list-meta-region";
    regSpan.textContent = region;
    metaEl.appendChild(regSpan);
  }

  /* DESCRIPTION (ellipsis automatic) */
  const descEl = document.createElement("div");
  descEl.className = "list-desc";
  descEl.textContent = place.description || "";

  /* CONTENT STACK */
  details.appendChild(titleRow);
  details.appendChild(metaEl);
  details.appendChild(descEl);

  div.appendChild(details);

  /* -----------------------------
     CHEVRON
  ----------------------------- */
  const chevron = document.createElement("div");
  chevron.className = "list-chevron";
  chevron.textContent = "›";
  div.appendChild(chevron);

  /* -----------------------------
     CLICK HANDLER (unchanged)
  ----------------------------- */
  div.onclick = () => {
    const m = state.markers[index];
    if (!m || !state.map) return;

    state.map.setView(m.getLatLng(), 14);
    highlightMarker(m);

    if (window.innerWidth <= 768) {
      const openEvt = new CustomEvent("place:openSheet", {
        detail: { place, key, index },
      });
      window.dispatchEvent(openEvt);
    } else {
      m.fire("click");
    }
  };

  listViewList.appendChild(div);
});

    if (listHeaderTitleEl) {
      listHeaderTitleEl.textContent =
        mode === "saved" ? "Saved places" : "Places list";
    }
  }

  function openListView() {
    renderListView(state.currentVisible, "all");
    overlay.classList.add("open");
  }

  function openSavedView() {
    const favs = getFavoriteKeys();
    const saved = [];
    state.places.forEach((place, index) => {
      const key = getPlaceKey(place, index);
      if (favs.has(key)) saved.push({ place, index });
    });
    renderListView(saved, "saved");
    overlay.classList.add("open");
  }

  function closeListView() {
    overlay.classList.remove("open");
  }

  /* <<< INSERT NEW CODE RIGHT HERE >>> */
  window.addEventListener("filters:updated", () => {
    if (!overlay.classList.contains("open")) return;

    const isSavedMode = listHeaderTitleEl?.textContent === "Saved places";

    if (isSavedMode) {
      const favs = getFavoriteKeys();
      const saved = [];
      state.places.forEach((place, index) => {
        const key = getPlaceKey(place, index);
        if (favs.has(key)) saved.push({ place, index });
      });
      renderListView(saved, "saved");
    } else {
      renderListView(state.currentVisible, "all");
    }
  });
  
  if (openListViewBtn) openListViewBtn.onclick = openListView;
  if (closeListViewBtn) closeListViewBtn.onclick = closeListView;
  if (openSavedViewBtn) openSavedViewBtn.onclick = openSavedView;
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
  const sheetExpand = document.getElementById("sheetExpand");
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

  if (sheetExpand) {
    sheetExpand.addEventListener("click", () => {
      placeSheet.classList.add("expanded");
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

  // Listen for openSheet events from markers/search/list
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

  // Tap the peek area to open
  sheetHandle.addEventListener("click", openSheet);

  // Drag-to-open / drag-to-close on mobile
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
