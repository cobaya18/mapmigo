/* ============================================================
   GLOBAL STATE
============================================================ */
let map;
let clusterGroup;
let markers = [];
let globalPlaces = [];

// MULTI-SELECT FILTERS
let activeCategories = [];
let activeRegions = [];

let favorites = new Set();

/* DOM */
const sidebar = document.getElementById("sidebar");
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("searchResults");
const searchResultsList = document.getElementById("searchResultsList");
const infoBar = document.getElementById("infoBar");

/* ============================================================
   MAP INIT
============================================================ */
function initMap() {
  map = L.map("map", {
    zoomControl: false,
    maxZoom: 18,
    minZoom: 5,
  }).setView([18.22, -66.59], 9);

  const baseLayers = {
    Satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri" }
    ),
    Dark: L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OpenStreetMap & CartoDB" }
    ),
    Light: L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap contributors" }
    ),
  };

  baseLayers.Satellite.addTo(map);

  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 45,
  });

  map.addLayer(clusterGroup);
}

/* ============================================================
   FAVORITES
============================================================ */
function loadFavorites() {
  try {
    favorites = new Set(
      JSON.parse(localStorage.getItem("favorites") || "[]")
    );
  } catch {}
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

/* ============================================================
   CATEGORY COLORS / EMOJIS
============================================================ */
const categoryEmojiMap = {
  Beach: "🏖️",
  Entertainment: "🎟️",
  Food: "🍽️",
  Hiking: "🥾",
  "Historical Landmark": "🏰",
  Museum: "🏛️",
  Nightlife: "🎵",
  "Park/Nature": "🌳",
  "Point of Interest": "📍",
  "River/Waterfall": "🏞️",
  Shopping: "🛍️",
  "Tour/Activity": "🧭",
  Viewpoint: "📸",
};

function getCategoryEmoji(c = "") {
  if (!c) return "📍";
  if (categoryEmojiMap[c]) return categoryEmojiMap[c];
  return "📍";
}

function getCategoryColor(c = "") {
  return "#3B82F6"; // default
}

/* ============================================================
   MARKER ICON
============================================================ */
function createMarkerIcon(category) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-pin" style="background:${getCategoryColor(category)}">
        <span class="marker-emoji">${getCategoryEmoji(category)}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

/* ============================================================
   POPUP BUILDER
============================================================ */
function buildPopup(place) {
  const isFav = favorites.has(place.id);

  return `
    <div class="popup-content">

      ${place.image_url ? `
        <div class="popup-image">
          <img src="${place.image_url}" alt="">
        </div>` : ""}

      <div class="popup-title">${place.title}</div>

      <div class="popup-meta">
        ${getCategoryEmoji(place.category)} ${place.category}
        ${place.region ? " • " + place.region : ""}
      </div>

      <div class="popup-buttons">
        <button class="popup-pill popup-fav-btn" data-id="${place.id}">
          ${isFav ? "♥ Saved" : "♡ Save"}
        </button>

        ${
          place.maps_url
            ? `<a class="popup-pill popup-map-btn" target="_blank" href="${place.maps_url}">
                Open in Maps
              </a>`
            : ""
        }
      </div>
    </div>
  `;
}

/* ============================================================
   CREATE MARKERS
============================================================ */
function createMarkers(places) {
  clusterGroup.clearLayers();
  markers = [];

  let count = 0;

  places.forEach(place => {
    if (isNaN(place.lat) || isNaN(place.lng)) return;

    const marker = L.marker([place.lat, place.lng], {
      icon: createMarkerIcon(place.category),
    });

    marker.placeId = place.id;
    marker.bindPopup(buildPopup(place));

    marker.on("popupopen", () => {
      const btn = document.querySelector(
        `.popup-fav-btn[data-id='${place.id}']`
      );
      if (btn) {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          toggleFavorite(place.id);
          btn.textContent = favorites.has(place.id)
            ? "♥ Saved"
            : "♡ Save";
        });
      }
    });

    clusterGroup.addLayer(marker);
    markers.push(marker);
    count++;
  });

  infoBar.textContent = `Loaded ${places.length} places • Showing ${count}`;
}

/* ============================================================
   FILTER BUTTON RENDERING (MULTI-SELECT)
============================================================ */
function renderCategoryFilters(places) {
  const container = document.getElementById("categoryFilters");
  container.innerHTML = "";

  const categories = [...new Set(places.map(p => p.category).filter(Boolean))];

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "pill-button";
    btn.textContent = `${getCategoryEmoji(cat)} ${cat}`;

    btn.addEventListener("click", () => {
      if (activeCategories.includes(cat)) {
        activeCategories = activeCategories.filter(c => c !== cat);
        btn.classList.remove("active");
      } else {
        activeCategories.push(cat);
        btn.classList.add("active");
      }
      applyFilters();
    });

    container.appendChild(btn);
  });
}

function renderRegionFilters(places) {
  const container = document.getElementById("regionFilters");
  container.innerHTML = "";

  const regions = [...new Set(places.map(p => p.region).filter(Boolean))];

  regions.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "pill-button pill-ghost";
    btn.textContent = r;

    btn.addEventListener("click", () => {
      if (activeRegions.includes(r)) {
        activeRegions = activeRegions.filter(x => x !== r);
        btn.classList.remove("active");
      } else {
        activeRegions.push(r);
        btn.classList.add("active");
      }
      applyFilters();
    });

    container.appendChild(btn);
  });
}

/* ============================================================
   APPLY FILTERS (MULTI-SELECT)
============================================================ */
function applyFilters() {
  clusterGroup.clearLayers();

  const visible = globalPlaces.filter(p => {
    if (activeCategories.length > 0 &&
        !activeCategories.includes(p.category)) return false;

    if (activeRegions.length > 0 &&
        !activeRegions.includes(p.region)) return false;

    return true;
  });

  createMarkers(visible);
}

/* ============================================================
   LIST VIEW UPDATE
============================================================ */
function updateListView(places) {
  const list = document.getElementById("listViewList");
  list.innerHTML = "";

  places.forEach(p => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-thumb">
        <img src="${p.image_url || ""}">
      </div>
      <div class="list-details">
        <div class="list-title">${p.title}</div>
        <div class="list-meta">${p.category} • ${p.region}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      if (!isNaN(p.lat)) map.flyTo([p.lat, p.lng], 15);
    });
    list.appendChild(item);
  });
}

/* ============================================================
   LOAD PLACES
============================================================ */
async function loadPlaces() {
  const res = await fetch(
    "https://puerto-rico-map.cobaya18.workers.dev/places"
  );
  const data = await res.json();

  globalPlaces = data.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    region: p.region,
    image_url: p.image_url,
    maps_url: p.maps_url || p.google_maps_url || "",
    lat: parseFloat(p.latitude),
    lng: parseFloat(p.longitude),
    description: p.description || "",
  }));

  loadFavorites();
  renderCategoryFilters(globalPlaces);
  renderRegionFilters(globalPlaces);
  updateListView(globalPlaces);
  createMarkers(globalPlaces);
}

/* ============================================================
   SEARCH
============================================================ */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    if (!q) {
      searchResults.classList.remove("open");
      return;
    }

    const results = globalPlaces.filter(p =>
      p.title.toLowerCase().includes(q)
    );

    searchResultsList.innerHTML = "";
    results.forEach(r => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
        <div class="search-result-title">${r.title}</div>
        <div class="search-result-meta">${r.category}</div>
      `;
      item.addEventListener("click", () => {
        map.flyTo([r.lat, r.lng], 15);
        searchResults.classList.remove("open");
      });
      searchResultsList.appendChild(item);
    });

    searchResults.classList.add("open");
  });
}

/* ============================================================
   RESET FILTERS
============================================================ */
document.getElementById("resetFilters").addEventListener("click", () => {
  activeCategories = [];
  activeRegions = [];

  document
    .querySelectorAll("#categoryFilters .pill-button, #regionFilters .pill-button")
    .forEach(btn => btn.classList.remove("active"));

  applyFilters();
});

/* ============================================================
   INIT
============================================================ */
initMap();
loadPlaces();
