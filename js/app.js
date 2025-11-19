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
  } catch {
    console.warn("Could not load favorites from localStorage");
  }
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

  const lc = c.toLowerCase();
  if (lc.includes("beach")) return "🏖️";
  if (lc.includes("night")) return "🎵";
  if (lc.includes("food")) return "🍽️";
  if (lc.includes("park") || lc.includes("nature")) return "🌳";
  if (lc.includes("hike")) return "🥾";
  if (lc.includes("view")) return "📸";
  if (lc.includes("museum")) return "🏛️";
  if (lc.includes("historic")) return "🏰";
  if (lc.includes("water") || lc.includes("river") || lc.includes("falls"))
    return "🏞️";
  if (lc.includes("shop")) return "🛍️";
  if (lc.includes("tour")) return "🧭";
  return "📍";
}

function getCategoryColor(c = "") {
  const byExact = {
    Beach: "#00C8FF",
    Entertainment: "#FF0080",
    Food: "#FF6B00",
    Hiking: "#2DD4BF",
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

  const lc = c.toLowerCase();
  if (lc.includes("beach")) return "#00C8FF";
  if (lc.includes("night")) return "#FF1493";
  if (lc.includes("food")) return "#FF6B00";
  if (lc.includes("park")) return "#4CAF50";
  if (lc.includes("hike")) return "#2DD4BF";
  if (lc.includes("view")) return "#E11D48";
  if (lc.includes("museum")) return "#3F51B5";
  if (lc.includes("historic")) return "#8B5CF6";
  if (lc.includes("water")) return "#0096C7";
  if (lc.includes("shop")) return "#FFB703";
  if (lc.includes("tour")) return "#3B82F6";

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

  let added = 0;
  let skipped = 0;

  places.forEach((place) => {
    if (
      typeof place.lat !== "number" ||
      Number.isNaN(place.lat) ||
      typeof place.lng !== "number" ||
      Number.isNaN(place.lng)
    ) {
      skipped++;
      return;
    }

    const marker = L.marker([place.lat, place.lng], {
      icon: createMarkerIcon(place.category),
    });

    marker.placeId = place.id;
    markers.push(marker);
    clusterGroup.addLayer(marker);
    added++;
  });

  console.log(`Markers created → added: ${added}, skipped: ${skipped}`);

  if (infoBar) {
    infoBar.textContent = `Loaded ${places.length} places • Showing ${added} markers`;
  }
}

/* ============================================================
   FILTERS
============================================================ */
function applyFilters() {
  clusterGroup.clearLayers();

  markers.forEach((m) => {
    const place = globalPlaces.find((p) => p.id === m.placeId);
    if (!place) return;

    // No filters yet — keep everything visible
    clusterGroup.addLayer(m);
  });
}

/* ============================================================
   LIST VIEW
============================================================ */
function updateListView(places) {
  const list = document.getElementById("listViewList");
  if (!list) return;

  list.innerHTML = "";

  places.forEach((p) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-thumb"><img src="${p.image_url || ""}" alt="" /></div>
      <div class="list-details">
        <div class="list-title-row">
          <div class="list-title">${p.title}</div>
        </div>
        <div class="list-meta">${p.category || ""} • ${p.region || ""}</div>
      </div>
    `;

    item.addEventListener("click", () => {
      if (typeof p.lat === "number" && typeof p.lng === "number") {
        map.flyTo([p.lat, p.lng], 14, { duration: 0.6 });
      }
    });

    list.appendChild(item);
  });
}

/* ============================================================
   DATA LOADING
============================================================ */
async function loadPlaces() {
  try {
    if (infoBar) infoBar.textContent = "Loading places…";

    const res = await fetch(
      "https://puerto-rico-map.cobaya18.workers.dev/places"
    );
    const data = await res.json();

    console.log("Raw places from API:", data);

    // Normalize + coerce types
    globalPlaces = (Array.isArray(data) ? data : []).map((p) => {
      const rawLat =
        p.lat ?? p.latitude ?? p.Latitude ?? p.LAT ?? p.geo_lat ?? null;
      const rawLng =
        p.lng ?? p.longitude ?? p.Longitude ?? p.LNG ?? p.geo_lng ?? null;

      const latNum =
        typeof rawLat === "number" ? rawLat : parseFloat(String(rawLat));
      const lngNum =
        typeof rawLng === "number" ? rawLng : parseFloat(String(rawLng));

      return {
        id: p.id || p.ID || p._id,
        title: p.title || p.Title || "",
        description: p.description || p.Description || "",
        category: p.category || p.Category || "",
        region: p.region || p.Region || "",
        image_url: p.image_url || p.Image || p.ImageURL || "",
        maps_url:
          p.maps_url ||
          p.MapsURL ||
          p.GoogleMaps ||
          p.google_maps_url ||
          "",

        lat: latNum,
        lng: lngNum,
      };
    });

    console.log("Normalized places:", globalPlaces);

    loadFavorites();
    updateListView(globalPlaces);
    createMarkers(globalPlaces);
    applyFilters();

    if (infoBar && globalPlaces.length === 0) {
      infoBar.textContent = "No places found.";
    }
  } catch (err) {
    console.error("Error loading places:", err);
    if (infoBar) infoBar.textContent = "Error loading places.";
  }
}

/* ============================================================
   SEARCH
============================================================ */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchResults.classList.remove("open");
      return;
    }

    const results = globalPlaces.filter((p) =>
      (p.title || "").toLowerCase().includes(q)
    );

    searchResultsList.innerHTML = "";
    results.forEach((r) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
        <div class="search-result-title">${r.title}</div>
        <div class="search-result-meta">${r.category || ""}</div>
      `;

      item.addEventListener("click", () => {
        if (typeof r.lat === "number" && typeof r.lng === "number") {
          map.flyTo([r.lat, r.lng], 15);
        }
        searchResults.classList.remove("open");
      });

      searchResultsList.appendChild(item);
    });

    searchResults.classList.add("open");
  });
}

/* ============================================================
   SERVICE WORKER
   (Comment this out while debugging if caching is fighting you)
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
