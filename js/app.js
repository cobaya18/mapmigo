/* ============================================================
   GLOBAL STATE
============================================================ */
let map;
let clusterGroup;
let markers = [];
let globalPlaces = [];

let favorites = new Set();

/* DOM ELEMENTS */
const sidebar = document.getElementById("sidebar");
const listViewOverlay = document.getElementById("listViewOverlay");
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("searchResults");
const searchResultsList = document.getElementById("searchResultsList");
const infoBar = document.getElementById("infoBar");

/* ============================================================
   INITIALIZE MAP
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
    maxClusterRadius: 48,
  });

  map.addLayer(clusterGroup);
}

/* ============================================================
   FAVORITES
============================================================ */
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites = new Set(saved);
  } catch {}
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);

  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

/* ============================================================
   CATEGORY EMOJIS + COLORS
============================================================ */
const categoryEmojiMap = {
  "Beach": "🏖️",
  "Entertainment": "🎟️",
  "Food": "🍽️",
  "Hiking": "🥾",
  "Historical Landmark": "🏰",
  "Museum": "🏛️",
  "Nightlife": "🎵",
  "Park/Nature": "🌳",
  "Point of Interest": "📍",
  "River/Waterfall": "🏞️",
  "Shopping": "🛍️",
  "Tour/Activity": "🧭",
  "Viewpoint": "📸"
};

function getCategoryEmoji(c = "") {
  if (!c) return "📍";
  if (categoryEmojiMap[c]) return categoryEmojiMap[c];

  c = c.toLowerCase();
  if (c.includes("beach")) return "🏖️";
  if (c.includes("night")) return "🎵";
  if (c.includes("food")) return "🍽️";
  if (c.includes("park") || c.includes("nature")) return "🌳";
  if (c.includes("hike")) return "🥾";
  if (c.includes("view")) return "📸";
  if (c.includes("museum")) return "🏛️";
  if (c.includes("historic")) return "🏰";
  if (c.includes("water") || c.includes("river") || c.includes("falls")) return "🏞️";
  if (c.includes("shop")) return "🛍️";
  if (c.includes("tour")) return "🧭";
  return "📍";
}

function getCategoryColor(c = "") {
  const byExact = {
    "Beach": "#00C8FF",
    "Entertainment": "#FF0080",
    "Food": "#FF6B00",
    "Hiking": "#2DD4BF",
    "Historical Landmark": "#8B5CF6",
    "Museum": "#3F51B5",
    "Nightlife": "#FF1493",
    "Park/Nature": "#4CAF50",
    "Point of Interest": "#FFD400",
    "River/Waterfall": "#0096C7",
    "Shopping": "#FFB703",
    "Tour/Activity": "#3B82F6",
    "Viewpoint": "#E11D48"
  };

  if (byExact[c]) return byExact[c];

  c = c.toLowerCase();
  if (c.includes("beach")) return "#00C8FF";
  if (c.includes("night")) return "#FF1493";
  if (c.includes("food")) return "#FF6B00";
  if (c.includes("park")) return "#4CAF50";
  if (c.includes("hike")) return "#2DD4BF";
  if (c.includes("view")) return "#E11D48";
  if (c.includes("museum")) return "#3F51B5";
  if (c.includes("historic")) return "#8B5CF6";
  if (c.includes("water")) return "#0096C7";
  if (c.includes("shop")) return "#FFB703";
  if (c.includes("tour")) return "#3B82F6";

  return "#3B82F6";
}

/* ============================================================
   MARKER ICON
============================================================ */
function createMarkerIcon(category) {
  const emoji = getCategoryEmoji(category);
  const color = getCategoryColor(category);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-pin" style="background:${color}">
        <span class="marker-emoji" style="font-size:14px;">${emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
}

/* ============================================================
   CREATE MARKERS
============================================================ */
function createMarkers(places) {
  clusterGroup.clearLayers();
  markers = [];

  places.forEach(place => {
    if (!place.lat || !place.lng) return;

    const marker = L.marker([place.lat, place.lng], {
      icon: createMarkerIcon(place.category),
    });

    marker.placeId = place.id;
    markers.push(marker);
    clusterGroup.addLayer(marker);
  });
}

/* ============================================================
   FILTERS
============================================================ */
function applyFilters() {
  clusterGroup.clearLayers();

  markers.forEach(m => {
    const place = globalPlaces.find(p => p.id === m.placeId);
    if (!place) return;

    // No filters implemented here — everything shows
    clusterGroup.addLayer(m);
  });
}

/* ============================================================
   LIST VIEW
============================================================ */
function updateListView(places) {
  const list = document.getElementById("listViewList");
  list.innerHTML = "";

  places.forEach(p => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-thumb"><img src="${p.image_url || ""}"></div>
      <div class="list-details">
        <div class="list-title-row">
          <div class="list-title">${p.title}</div>
        </div>
        <div class="list-meta">${p.category} • ${p.region}</div>
      </div>
    `;

    item.addEventListener("click", () => {
      map.flyTo([p.lat, p.lng], 14, { duration: 0.6 });
    });

    list.appendChild(item);
  });
}

/* ============================================================
   DATA LOADING (FIXED!!)
============================================================ */
async function loadPlaces() {
  try {
    const res = await fetch("https://puerto-rico-map.cobaya18.workers.dev/places");
    let data = await res.json();

    // 🔥 Normalize field names
    globalPlaces = data.map(p => ({
      id: p.id || p.ID || p._id,
      title: p.title || p.Title || "",
      description: p.description || p.Description || "",
      category: p.category || p.Category || "",
      region: p.region || p.Region || "",
      image_url: p.image_url || p.Image || p.ImageURL || "",
      maps_url: p.maps_url || p.MapsURL || p.GoogleMaps || "",

      // Fix coordinates
      lat: p.lat || p.latitude || p.Latitude || p.LAT || 0,
      lng: p.lng || p.longitude || p.Longitude || p.LNG || 0,
    }));

    loadFavorites();
    updateListView(globalPlaces);
    createMarkers(globalPlaces);
    applyFilters();

    if (infoBar) infoBar.textContent = "";

  } catch (err) {
    console.error("Error loading places:", err);
    if (infoBar) infoBar.textContent = "Error loading places.";
  }
}

/* ============================================================
   SEARCH
============================================================ */
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
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

/* ============================================================
   SERVICE WORKER (PATCHED)
============================================================ */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .catch(() => console.warn("SW failed — continuing anyway."));
}

/* ============================================================
   START
============================================================ */
initMap();
loadPlaces();
