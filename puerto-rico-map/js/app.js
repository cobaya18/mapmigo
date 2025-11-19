const map = L.map("map").setView([18.2208, -66.5901], 9);

const baseLayers = {
  Satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles &copy; Esri" }
  ),
  Dark: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "&copy; OpenStreetMap, &copy; CartoDB" }
  ),
  Light: L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" }
  ),
};

baseLayers.Satellite.addTo(map);

const mapStyleButton = document.getElementById("mapStyleButton");
const mapStyleToggle = document.getElementById("mapStyleToggle");
const mapStyleMenu = document.getElementById("mapStyleMenu");

if (mapStyleButton && mapStyleMenu && mapStyleToggle) {
  mapStyleButton.addEventListener("click", () => {
    mapStyleMenu.classList.toggle("open");
  });

  mapStyleToggle.addEventListener("click", () => {
    mapStyleMenu.classList.toggle("open");
  });

  mapStyleMenu.querySelectorAll(".style-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      Object.values(baseLayers).forEach((l) => map.removeLayer(l));

      if (theme === "Satellite") baseLayers.Satellite.addTo(map);
      else if (theme === "Dark") baseLayers.Dark.addTo(map);
      else baseLayers.Light.addTo(map);

      document
        .querySelectorAll(".style-option")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const iconSpan = mapStyleToggle.querySelector(".icon");
      if (theme === "Satellite") iconSpan.textContent = "🛰️";
      else if (theme === "Dark") iconSpan.textContent = "⬛";
      else iconSpan.textContent = "◻️";

      mapStyleMenu.classList.remove("open");
    });
  });
}

let clusterGroup = L.markerClusterGroup({
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  spiderfyOnEveryClick: true,
  animateAddingMarkers: true,
  disableClusteringAtZoom: 10,
  maxClusterRadius: 50,
  spiderfyDistanceMultiplier: 1.4,
});
map.addLayer(clusterGroup);

const FAVORITES_KEY = "pr_map_favorites_v1";
let favoriteSet = new Set();

function loadFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return;
    const arr = JSON.parse(stored);
    favoriteSet = new Set(arr);
  } catch (e) {
    console.warn("Failed to load favorites", e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteSet]));
  } catch (e) {
    console.warn("Failed to save favorites", e);
  }
}

function isFavorite(key) {
  return favoriteSet.has(key);
}

function toggleFavorite(key) {
  if (favoriteSet.has(key)) {
    favoriteSet.delete(key);
  } else {
    favoriteSet.add(key);
  }
  saveFavorites();
}

function getCategoryColor(c) {
  if (!c) return "#3B82F6";
  const byExact = {
    Beach: "#00C8FF",
    "Beach Bar": "#00C8FF",
    "Bar": "#FF0080",
    "Bar / Lounge": "#FF0080",
    "Café": "#FF6B00",
    "Coffee": "#FF6B00",
    "Food & Drink": "#FF6B00",
    "Restaurant": "#FF6B00",
    "Historical Landmark": "#8B5CF6",
    Museum: "#3F51B5",
    Nightlife: "#FF1493",
    "Park/Nature": "#4CAF50",
    "Point of Interest": "#FFD400",
    "River/Waterfall": "#0096C7",
    Shopping: "#FFB703",
    "Tour/Activity": "#3B82F6",
    Viewpoint: "#E11D48",
  };
  if (byExact[c]) return byExact[c];
  const n = c.toLowerCase();
  if (n.includes("beach")) return "#00C8FF";
  if (n.includes("night")) return "#FF1493";
  if (n.includes("food") || n.includes("restaurant")) return "#FF6B00";
  if (n.includes("park") || n.includes("nature")) return "#4CAF50";
  if (n.includes("hike")) return "#2DD4BF";
  if (n.includes("view")) return "#E11D48";
  if (n.includes("museum")) return "#3F51B5";
  if (n.includes("historic") || n.includes("landmark")) return "#8B5CF6";
  if (n.includes("shop")) return "#FFB703";
  if (n.includes("entertainment")) return "#FF0080";
  if (n.includes("guided") || n.includes("tour") || n.includes("activity"))
    return "#3B82F6";
  if (n.includes("water") || n.includes("river") || n.includes("falls"))
    return "#0096C7";
  if (n.includes("point")) return "#FFD400";
  return "#3B82F6";
}

const categoryEmojiMap = {
  Beach: "🏖️",
  "Beach Bar": "🍹",
  Bar: "🍸",
  "Bar / Lounge": "🍸",
  "Café": "☕",
  "Coffee": "☕",
  "Food & Drink": "🍽️",
  Restaurant: "🍽️",
  "Historical Landmark": "🏛️",
  Museum: "🏛️",
  Nightlife: "🌃",
  "Park/Nature": "🌳",
  "Point of Interest": "📍",
  "River/Waterfall": "💧",
  Shopping: "🛍️",
  "Tour/Activity": "🎒",
  Viewpoint: "🌄",
};

function getCategoryEmoji(c) {
  if (!c) return "📍";
  if (categoryEmojiMap[c]) return categoryEmojiMap[c];
  const n = c.toLowerCase();
  if (n.includes("beach")) return "🏖️";
  if (n.includes("night")) return "🌃";
  if (n.includes("food") || n.includes("restaurant")) return "🍽️";
  if (n.includes("park") || n.includes("nature")) return "🌳";
  if (n.includes("hike")) return "🥾";
  if (n.includes("view")) return "🌄";
  if (n.includes("museum")) return "🏛️";
  if (n.includes("historic") || n.includes("landmark")) return "🏛️";
  if (n.includes("shop")) return "🛍️";
  if (n.includes("guided") || n.includes("tour") || n.includes("activity"))
    return "🎒";
  if (n.includes("water") || n.includes("river") || n.includes("falls"))
    return "💧";
  if (n.includes("point")) return "📍";
  return "📍";
}

function createMarkerIcon(category) {
  const color = getCategoryColor(category);
  const emoji = getCategoryEmoji(category);

  const div = document.createElement("div");
  div.className = "marker-pin";

  const inner = document.createElement("div");
  inner.className = "marker-pin-inner";
  inner.style.backgroundColor = color;
  inner.textContent = emoji;

  div.appendChild(inner);

  return L.divIcon({
    html: div,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

let globalPlaces = [];
let markers = [];
let currentVisible = [];
let activeCategoryValues = new Set();
let activeRegionValues = new Set();

const categoryFiltersEl = document.getElementById("categoryFilters");
const regionFiltersEl = document.getElementById("regionFilters");
const infoBar = document.getElementById("infoBar");

function populateFilters(places) {
  if (!categoryFiltersEl || !regionFiltersEl) return;

  const categories = new Set();
  const regions = new Set();

  places.forEach((p) => {
    if (p.category) categories.add(p.category);
    if (p.region) regions.add(p.region);
  });

  const catFragment = document.createDocumentFragment();
  const allCat = document.createElement("button");
  allCat.className = "pill-button active";
  allCat.dataset.value = "all";
  allCat.textContent = "All categories";
  catFragment.appendChild(allCat);

  [...categories]
    .sort((a, b) => a.localeCompare(b))
    .forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "pill-button";
      btn.dataset.value = cat;
      btn.textContent = `${getCategoryEmoji(cat)} ${cat}`;
      catFragment.appendChild(btn);
    });

  categoryFiltersEl.innerHTML = "";
  categoryFiltersEl.appendChild(catFragment);

  const regFragment = document.createDocumentFragment();
  const allReg = document.createElement("button");
  allReg.className = "pill-button active";
  allReg.dataset.value = "all";
  allReg.textContent = "All regions";
  regFragment.appendChild(allReg);

  [...regions]
    .sort((a, b) => a.localeCompare(b))
    .forEach((reg) => {
      const btn = document.createElement("button");
      btn.className = "pill-button";
      btn.dataset.value = reg;
      btn.textContent = reg;
      regFragment.appendChild(btn);
    });

  regionFiltersEl.innerHTML = "";
  regionFiltersEl.appendChild(regFragment);

  setupMultiSelect(categoryFiltersEl);
  setupMultiSelect(regionFiltersEl);
}

function setupMultiSelect(container) {
  container.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      if (btn.dataset.value === "all") {
        container
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      } else {
        btn.classList.toggle("active");
        container
          .querySelector('[data-value="all"]')
          .classList.remove("active");
        const anySelected = [...container.querySelectorAll("button")].some(
          (b) =>
            b.dataset.value !== "all" && b.classList.contains("active")
        );
        if (!anySelected) {
          container
            .querySelector('[data-value="all"]')
            .classList.add("active");
        }
      }
      applyFilters();
    };
  });
}

function updateActiveFilters() {
  activeCategoryValues.clear();
  activeRegionValues.clear();

  const catButtons = categoryFiltersEl
    ? categoryFiltersEl.querySelectorAll("button")
    : [];
  const regButtons = regionFiltersEl
    ? regionFiltersEl.querySelectorAll("button")
    : [];

  const catAll = [...catButtons].find((b) => b.dataset.value === "all");
  const regAll = [...regButtons].find((b) => b.dataset.value === "all");

  const catActive = [...catButtons].filter(
    (b) => b.dataset.value !== "all" && b.classList.contains("active")
  );
  const regActive = [...regButtons].filter(
    (b) => b.dataset.value !== "all" && b.classList.contains("active")
  );

  if (!catActive.length && catAll) activeCategoryValues.add("all");
  else catActive.forEach((b) => activeCategoryValues.add(b.dataset.value));

  if (!regActive.length && regAll) activeRegionValues.add("all");
  else regActive.forEach((b) => activeRegionValues.add(b.dataset.value));
}

function createMarkers(places) {
  clusterGroup.clearLayers();
  markers = [];

  places.forEach((place, index) => {
    if (!place.lat || !place.lng) return;
    const key = place.id || `${place.title || ""}-${index}`;

    const marker = L.marker([place.lat, place.lng], {
      icon: createMarkerIcon(place.category),
    });

    marker.placeData = { ...place, key, index };

    marker.on("click", () => {
      document
        .querySelectorAll(".marker-pin")
        .forEach((p) => p.classList.remove("marker-pin-selected"));
      const el = marker._icon;
      if (el) {
        const pin = el.querySelector(".marker-pin");
        if (pin) pin.classList.add("marker-pin-selected");
      }
      openPlaceSheet(place, key);
    });

    clusterGroup.addLayer(marker);
    markers.push(marker);
  });
}

function updateInfoBar(visibleCount, activeCats, activeRegs) {
  if (!infoBar) return;

  const parts = [];
  parts.push(visibleCount === 1 ? "1 result" : `${visibleCount} results`);

  const filterBits = [];

  if (!activeCats.has("all")) {
    filterBits.push(
      `Categories: ${[...activeCats].join(", ")}`
    );
  }
  if (!activeRegs.has("all")) {
    filterBits.push(`Regions: ${[...activeRegs].join(", ")}`);
  }

  if (filterBits.length) {
    parts.push(filterBits.join(" • "));
  }

  infoBar.textContent = parts.join(" • ");
}

function applyFilters() {
  if (!markers.length) return;
  updateActiveFilters();

  const q = (searchInput?.value || "").toLowerCase();
  let bounds = null;
  const visible = [];

  markers.forEach((m, index) => {
    const p = m.placeData;
    if (!p) return;

    const cat = p.category || "";
    const reg = p.region || "";

    const catMatch =
      activeCategoryValues.has("all") ||
      activeCategoryValues.has(cat);
    const regMatch =
      activeRegionValues.has("all") ||
      activeRegionValues.has(reg);

    const qMatch =
      !q ||
      (p.title || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.region || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q);

    const isVisible = catMatch && regMatch && qMatch;

    if (!isVisible) {
      if (clusterGroup.hasLayer(m)) clusterGroup.removeLayer(m);
    } else {
      if (!clusterGroup.hasLayer(m)) clusterGroup.addLayer(m);
      const ll = m.getLatLng();
      if (!bounds) bounds = L.latLngBounds(ll, ll);
      else bounds.extend(ll);
      visible.push({ place: p, index });
    }
  });

  visible.sort((a, b) =>
    (a.place.title || "").localeCompare(b.place.title || "", "en", {
      sensitivity: "base",
    })
  );
  currentVisible = visible;

  if (visible.length > 0 && bounds && !q.trim()) {
    map.fitBounds(bounds.pad(0.2));
  } else if (visible.length === 0) {
    map.setView([18.2208, -66.5901], 9);
  }

  renderSearchResults(visible, q);
  updateInfoBar(visible.length, activeCategoryValues, activeRegionValues);
}

/* SEARCH HANDLERS */
const searchInput = document.getElementById("search");
const searchClearBtn = document.getElementById("searchClear");
const searchButton = document.getElementById("searchButton");
const searchResultsEl = document.getElementById("searchResults");
const searchResultsList = document.getElementById("searchResultsList");

function renderSearchResults(items, query) {
  if (!searchResultsEl || !searchResultsList) return;

  if (!query.trim()) {
    searchResultsEl.classList.remove("open");
    searchResultsList.innerHTML = "";
    return;
  }

  searchResultsList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "search-result-item";
    empty.textContent = "No matches found.";
    searchResultsList.appendChild(empty);
    searchResultsEl.classList.add("open");
    positionSearchResults();
    return;
  }

  items.forEach(({ place, index }) => {
    const row = document.createElement("div");
    row.className = "search-result-item";
    row.onclick = () => {
      const marker = markers[index];
      if (marker) {
        const ll = marker.getLatLng();
        map.setView(ll, 15);
        openPlaceSheet(place, place.id || `${place.title || ""}-${index}`);
      }
      searchResultsEl.classList.remove("open");
    };

    const title = document.createElement("div");
    title.className = "search-result-title";
    title.textContent = place.title || "";

    const meta = document.createElement("div");
    meta.className = "search-result-meta";
    const bits = [];
    if (place.category) bits.push(place.category);
    if (place.region) bits.push(place.region);
    meta.textContent = bits.join(" • ");

    row.appendChild(title);
    row.appendChild(meta);
    searchResultsList.appendChild(row);
  });

  searchResultsEl.classList.add("open");
  positionSearchResults();
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyFilters();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
    if (searchResultsEl) {
      searchResultsEl.classList.remove("open");
    }
  });
}

if (searchButton) {
  searchButton.addEventListener("click", () => {
    applyFilters();
  });
}

/* LIST VIEW TOGGLE */
const listViewOverlay = document.getElementById("listViewOverlay");
const openListViewBtn = document.getElementById("openListView");
const closeListViewBtn = document.getElementById("closeListView");
const listViewList = document.getElementById("listViewList");
const mapViewToggle = document.getElementById("mapViewToggle");
const listViewToggle = document.getElementById("listViewToggle");

function renderListView() {
  if (!listViewList) return;
  listViewList.innerHTML = "";

  currentVisible.forEach(({ place, index }) => {
    const key = place.id || `${place.title || ""}-${index}`;

    const row = document.createElement("div");
    row.className = "list-item";
    row.onclick = () => {
      const marker = markers[index];
      if (marker) {
        const ll = marker.getLatLng();
        map.setView(ll, 15);
        openPlaceSheet(place, key);
      }
    };

    const thumb = document.createElement("div");
    thumb.className = "list-thumb";

    const img = document.createElement("img");
    img.loading = "lazy";

    if (place.image_url) {
      img.src = place.image_url;
    }
    thumb.appendChild(img);

    const details = document.createElement("div");
    details.className = "list-details";

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
      if (isFavorite(key)) favBtn.classList.add("fav-active");
      else favBtn.classList.remove("fav-active");
    };

    const meta = document.createElement("div");
    meta.className = "list-meta";
    const bits = [];
    if (place.category) bits.push(place.category);
    if (place.region) bits.push(place.region);
    meta.textContent = bits.join(" • ");

    titleRow.appendChild(titleEl);
    titleRow.appendChild(favBtn);
    details.appendChild(titleRow);
    details.appendChild(meta);

    row.appendChild(thumb);
    row.appendChild(details);

    listViewList.appendChild(row);
  });
}

function openListView() {
  if (!listViewOverlay) return;
  renderListView();
  listViewOverlay.classList.add("open");
}

function closeListView() {
  if (!listViewOverlay) return;
  listViewOverlay.classList.remove("open");
}

if (openListViewBtn) openListViewBtn.addEventListener("click", openListView);
if (closeListViewBtn) closeListViewBtn.addEventListener("click", closeListView);

if (mapViewToggle && listViewToggle) {
  mapViewToggle.addEventListener("click", () => {
    mapViewToggle.classList.add("active");
    listViewToggle.classList.remove("active");
    closeListView();
  });

  listViewToggle.addEventListener("click", () => {
    listViewToggle.classList.add("active");
    mapViewToggle.classList.remove("active");
    openListView();
  });
}

/* PLACE SHEET */
const placeSheet = document.getElementById("placeSheet");
const sheetTitle = document.getElementById("sheetTitle");
const sheetMeta = document.getElementById("sheetMeta");
const sheetFavBtn = document.getElementById("sheetFavBtn");
const sheetExpandBtn = document.getElementById("sheetExpand");
const sheetImage = document.getElementById("sheetImage");
const sheetDescription = document.getElementById("sheetDescription");
const sheetMapsBtn = document.getElementById("sheetMapsBtn");

let currentPlaceKey = null;

function openPlaceSheet(place, key) {
  if (!placeSheet) return;
  currentPlaceKey = key;

  if (sheetTitle) sheetTitle.textContent = place.title || "";
  if (sheetMeta) {
    const bits = [];
    if (place.category) bits.push(place.category);
    if (place.region) bits.push(place.region);
    sheetMeta.textContent = bits.join(" • ");
  }

  if (sheetFavBtn) {
    sheetFavBtn.onclick = () => {
      toggleFavorite(key);
      if (isFavorite(key)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    };
    if (isFavorite(key)) sheetFavBtn.classList.add("fav-active");
    else sheetFavBtn.classList.remove("fav-active");
  }

  if (sheetImage) {
    if (place.image_url) {
      sheetImage.src = place.image_url;
      sheetImage.style.display = "block";
    } else {
      sheetImage.style.display = "none";
    }
  }

  if (sheetDescription) {
    sheetDescription.textContent = place.description || "";
  }

  if (sheetMapsBtn) {
    if (place.maps_url) {
      sheetMapsBtn.href = place.maps_url;
      sheetMapsBtn.style.display = "inline-flex";
    } else {
      sheetMapsBtn.style.display = "none";
    }
  }

  placeSheet.classList.add("visible");
  placeSheet.classList.remove("expanded");
}

/* DRAG TO CLOSE / EXPAND PLACE SHEET (TOUCH) */
let dragStartY = null;
let currentY = null;
let dragging = false;

const sheetHandle = placeSheet?.querySelector(".sheet-handle");
const sheetPreview = document.getElementById("sheetPreview");

function sheetTouchStart(e) {
  dragging = true;
  dragStartY = e.touches[0].clientY;
  placeSheet.style.transition = "none";
}

function sheetTouchMove(e) {
  if (!dragging || dragStartY == null) return;
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

if (sheetExpandBtn) {
  sheetExpandBtn.addEventListener("click", () => {
    placeSheet.classList.toggle("expanded");
  });
}

/* GPS BUTTON */
const gpsButton = document.getElementById("gpsButton");
if (gpsButton && navigator.geolocation) {
  gpsButton.addEventListener("click", () => {
    gpsButton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 14);
        gpsButton.disabled = false;
      },
      () => {
        gpsButton.disabled = false;
      }
    );
  });
}

/* SIDEBAR OPEN/CLOSE */
const sidebar = document.getElementById("sidebar");
const hamburgerButton = document.getElementById("hamburgerButton");
const resetFiltersBtn = document.getElementById("resetFilters");

if (hamburgerButton && sidebar) {
  hamburgerButton.addEventListener("click", () => {
    sidebar.classList.toggle("closed");
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    if (categoryFiltersEl) {
      categoryFiltersEl
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      const all = categoryFiltersEl.querySelector('[data-value="all"]');
      if (all) all.classList.add("active");
    }
    if (regionFiltersEl) {
      regionFiltersEl
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      const all = regionFiltersEl.querySelector('[data-value="all"]');
      if (all) all.classList.add("active");
    }
    applyFilters();
  });
}

/* SEARCH POSITIONING */
function positionSearchResults() {
  const bar = document.getElementById("searchBarWrapper");
  const results = document.getElementById("searchResults");
  if (!bar || !results) return;
  const rect = bar.getBoundingClientRect();
  results.style.left = rect.left + "px";
  results.style.width = rect.width + "px";
  results.style.top = rect.bottom + 8 + "px";
}
window.addEventListener("resize", positionSearchResults);
window.addEventListener("DOMContentLoaded", positionSearchResults);

/* DATA LOADING */
async function loadPlaces() {
  try {
    const res = await fetch(
      "https://puerto-rico-map.cobaya18.workers.dev/places"
    );
    globalPlaces = await res.json();
    loadFavorites();
    populateFilters(globalPlaces);
    createMarkers(globalPlaces);
    applyFilters();
  } catch (e) {
    console.error("Failed to load places", e);
    if (infoBar) infoBar.textContent = "Error loading places.";
  }
}

loadPlaces();

/* SERVICE WORKER REGISTRATION */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(function () {
        console.log(
          "Service Worker registered for Puerto Rico Map Guide"
        );
      })
      .catch(function (err) {
        console.warn("Service Worker registration failed:", err);
      });
  });
}
