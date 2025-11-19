
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
      )
    };

    let currentBase = null;

    function setBaseMap(theme) {
      const layer = baseLayers[theme] || baseLayers.Satellite;
      if (currentBase && map.hasLayer(currentBase)) {
        map.removeLayer(currentBase);
      }
      currentBase = layer;
      currentBase.addTo(map);
    }
    setBaseMap("Satellite");

    const mapStyleToggle = document.getElementById("mapStyleToggle");
    const mapStyleMenu = document.getElementById("mapStyleMenu");

    mapStyleToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mapStyleMenu.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      mapStyleMenu.classList.remove("open");
    });

    document.querySelectorAll(".style-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const theme = btn.dataset.theme;
        setBaseMap(theme);

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
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) favoriteSet = new Set(arr);
        }
      } catch (e) { console.warn("Failed to load favorites", e); }
    }

    function saveFavorites() {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteSet]));
      } catch (e) { console.warn("Failed to save favorites", e); }
    }

    function getPlaceKey(place, index) {
      if (place.id) return "id:" + place.id;
      if (place.slug) return "slug:" + place.slug;
      return "idx:" + index + ":" + (place.title || "");
    }

    function isFavorite(key) { return favoriteSet.has(key); }
    function toggleFavorite(key) {
      if (favoriteSet.has(key)) favoriteSet.delete(key);
      else favoriteSet.add(key);
      saveFavorites();
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
      if (n.includes("guided") || n.includes("tour") || n.includes("activity")) return "#3B82F6";
      if (n.includes("water") || n.includes("river") || n.includes("falls")) return "#0096C7";
      if (n.includes("point")) return "#FFD400";
      return "#3B82F6";
    }

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
      if (categoryEmojiMap[c]) return categoryEmojiMap[c];
      const n = c.toLowerCase();
      if (n.includes("beach")) return "🏖️";
      if (n.includes("night")) return "🎵";
      if (n.includes("food") || n.includes("restaurant")) return "🍽️";
      if (n.includes("park") || n.includes("nature")) return "🌳";
      if (n.includes("hike")) return "🥾";
      if (n.includes("view")) return "📸";
      if (n.includes("museum")) return "🏛️";
      if (n.includes("historic") || n.includes("landmark")) return "🏰";
      if (n.includes("shop")) return "🛍️";
      if (n.includes("entertainment")) return "🎟️";
      if (n.includes("tour") || n.includes("activity")) return "🧭";
      if (n.includes("water") || n.includes("river") || n.includes("falls")) return "🏞️";
      if (n.includes("point")) return "📍";
      return "📍";
    }

    function normalize(str = "") {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]/g, "");
    }

    function softMatch(text, q) {
      if (!q.trim()) return true;
      return normalize(text || "").includes(normalize(q));
    }

    function relevanceScore(place, q) {
      if (!q.trim()) return 0;
      const nq = normalize(q);
      const nt = normalize(place.title || "");
      let s = 0;
      if (softMatch(place.title, q)) s += 10;
      if (softMatch(place.category, q)) s += 3;
      if (softMatch(place.region, q)) s += 2;
      if (softMatch(place.description, q)) s += 1;
      if (nt.startsWith(nq)) s += 6;
      if (nt === nq) s += 4;
      return s;
    }

    function populateFilters(places) {
      const cats = [...new Set(places.map(p => p.category))].filter(Boolean).sort();
      const regs = [...new Set(places.map(p => p.region))].filter(Boolean).sort();

      const catDiv = document.getElementById("categoryButtons");
      const regDiv = document.getElementById("regionButtons");

      catDiv.innerHTML = '<button data-value="all" class="active">All</button>';
      cats.forEach(c => {
        const col = getCategoryColor(c);
        catDiv.innerHTML += `<button data-value="${c}"><span class="cat-dot-large" style="background:${col};"></span>${c}</button>`;
      });

      regDiv.innerHTML = '<button data-value="all" class="active">All</button>';
      regs.forEach(r => {
        regDiv.innerHTML += `<button data-value="${r}">${r}</button>`;
      });

      setupMultiSelect(catDiv);
      setupMultiSelect(regDiv);
    }

    function setupMultiSelect(container) {
      container.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.value === "all") {
            container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
          } else {
            btn.classList.toggle("active");
            container.querySelector('[data-value="all"]').classList.remove("active");
            const anySelected = [...container.querySelectorAll("button")].some(
              b => b.dataset.value !== "all" && b.classList.contains("active")
            );
            if (!anySelected) {
              container.querySelector('[data-value="all"]').classList.add("active");
            }
          }
          applyFilters();
        };
      });
    }

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

    let globalPlaces = [];
    let markers = [];
    let currentVisible = [];
    let highlightRing = null;

    function highlightMarker(marker) {
      if (!marker) return;
      if (highlightRing) {
        map.removeLayer(highlightRing);
        highlightRing = null;
      }
      highlightRing = L.circleMarker(marker.getLatLng(), {
        radius: 18,
        color: "#38BDF8",
        weight: 2,
        fillOpacity: 0,
        className: "marker-highlight-ring",
      }).addTo(map);

      setTimeout(() => {
        if (highlightRing) {
          map.removeLayer(highlightRing);
          highlightRing = null;
        }
      }, 800);
    }

    function createMarkers(places) {
      markers = [];
      clusterGroup.clearLayers();

      places.forEach((p, index) => {
        const lat = Number(p.latitude);
        const lng = Number(p.longitude);
        if (!lat || !lng) {
          markers.push(null);
          return;
        }

        const marker = L.marker([lat, lng], {
          icon: createMarkerIcon(p.category),
        });

        const key = getPlaceKey(p, index);
        const url =
          p.google_maps_url || p.map_url || p.maps_url || p.google_url || null;

        let html = "<div class='popup-card'>";
        html += `<div class="popup-header">
          <div class="popup-title">${p.title || ""}</div>
          <button class="fav-btn ${isFavorite(key) ? "fav-active" : ""}" data-key="${key}">♡</button>
        </div>`;
        if (p.category) {
          html += `<div class="popup-category">${p.category}</div>`;
        }
        if (p.image_url) {
          html += `<div class="popup-image-wrapper skeleton">
            <img loading="lazy" src="${p.image_url}" class="skeleton" onload="this.classList.remove('skeleton'); this.parentElement.classList.remove('skeleton');" />
          </div>`;
        }
        if (p.description) {
          html += `<div class="popup-desc">${p.description}</div>`;
        }
        if (url) {
          html += `<a class="popup-button" target="_blank" href="${url}">Open in Google Maps</a>`;
        }
        html += "</div>";

        marker.bindPopup(html);

        marker.on("click", () => {
          highlightMarker(marker);
          if (window.innerWidth <= 768) {
            showPlaceSheet(p, key, index);
          } else {
            marker.openPopup();
          }
        });

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

        
marker.on('click', () => {
          document.querySelectorAll('.marker-pin').forEach(p => p.classList.remove('marker-pin-selected'));
          const el = marker._icon;
          if (el) {
            const pin = el.querySelector('.marker-pin');
            if (pin) pin.classList.add('marker-pin-selected');
          }
        });

        clusterGroup.addLayer(marker);
        markers.push(marker);
      });
    }

    function updateInfoBar(visibleCount, activeCats, activeRegs) {
      const infoBar = document.getElementById("infoBar");
      const parts = [];
      parts.push(visibleCount === 1 ? "1 result" : `${visibleCount} results`);

      const filterBits = [];
      if (activeCats.length > 0) filterBits.push("Categories: " + activeCats.join(", "));
      if (activeRegs.length > 0) filterBits.push("Regions: " + activeRegs.join(", "));
      if (filterBits.length > 0) parts.push("Filters: " + filterBits.join(" • "));
      else parts.push("No filters active");

      infoBar.textContent = parts.join(" • ");
    }

    const placeSheet = document.getElementById("placeSheet");
    const sheetTitle = document.getElementById("sheetTitle");
    const sheetMeta = document.getElementById("sheetMeta");
    const sheetExpand = document.getElementById("sheetExpand");
    const sheetDetails = document.getElementById("sheetDetails");
    const sheetImage = document.getElementById("sheetImage");
    const sheetDesc = document.getElementById("sheetDescription");
    const sheetMapsBtn = document.getElementById("sheetMapsBtn");
    const sheetHandle = document.querySelector(".sheet-handle");
    const sheetPreview = document.getElementById("sheetPreview");
    const sheetFavBtn = document.getElementById("sheetFavBtn");
    sheetImage.loading = "lazy";

    let currentSheetKey = null;

    function showPlaceSheet(place, key, index) {
      placeSheet.classList.add("visible");
      placeSheet.classList.remove("expanded");
      placeSheet.style.transition = "transform 0.25s ease";
      placeSheet.style.transform = "";
      currentSheetKey = key;

      sheetTitle.textContent = place.title || "";
      sheetMeta.textContent = [place.category, place.region].filter(Boolean).join(" • ");
      sheetDesc.textContent = place.description || "";

      if (place.image_url) {
        sheetImage.style.display = "block";
        sheetImage.classList.add("skeleton");
        sheetImage.onload = () => sheetImage.classList.remove("skeleton");
        sheetImage.src = place.image_url;
      } else {
        sheetImage.style.display = "none";
      }

      const url =
        place.google_maps_url || place.map_url || place.maps_url || place.google_url || null;
      if (url) {
        sheetMapsBtn.href = url;
        sheetMapsBtn.style.display = "inline-block";
      } else {
        sheetMapsBtn.style.display = "none";
      }

      if (isFavorite(key)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    }

    sheetExpand.addEventListener("click", () => {
      placeSheet.classList.add("expanded");
    });

    sheetFavBtn.addEventListener("click", () => {
      if (!currentSheetKey) return;
      toggleFavorite(currentSheetKey);
      if (isFavorite(currentSheetKey)) sheetFavBtn.classList.add("fav-active");
      else sheetFavBtn.classList.remove("fav-active");
    });

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

    [sheetHandle, sheetPreview].forEach(el => {
      el.addEventListener("touchstart", sheetTouchStart, { passive: true });
      el.addEventListener("touchmove", sheetTouchMove, { passive: true });
      el.addEventListener("touchend", sheetTouchEnd);
      el.addEventListener("touchcancel", sheetTouchEnd);
    });

    function renderSearchResults(items, q) {
      const overlay = document.getElementById("searchResults");
      const list = document.getElementById("searchResultsList");

      if (!q.trim() || items.length === 0) {
        overlay.style.display = "none";
        list.innerHTML = "";
        return;
      }

      const scored = items
        .map(({ place, index }) => ({
          place,
          index,
          score: relevanceScore(place, q),
        }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (scored.length === 0) {
        overlay.style.display = "none";
        list.innerHTML = "";
        return;
      }

      list.innerHTML = "";
      scored.forEach(({ place, index }) => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
          <div class="result-title">${place.title}</div>
          <div class="result-meta">${(place.category || "")} • ${(place.region || "")}</div>
        `;
        div.onclick = () => {
          const m = markers[index];
          if (!m) return;
          map.setView(m.getLatLng(), 14);
          highlightMarker(m);
          if (window.innerWidth <= 768) {
            const key = getPlaceKey(place, index);
            showPlaceSheet(place, key, index);
          } else {
            m.fire("click");
          }
        };
        list.appendChild(div);
      });

      overlay.style.display = "block";
    }

    const listViewOverlay = document.getElementById("listViewOverlay");
    const listViewList = document.getElementById("listViewList");
    const openListViewBtn = document.getElementById("openListView");
    const closeListViewBtn = document.getElementById("closeListView");
    const openSavedViewBtn = document.getElementById("openSavedView");
    const listHeaderTitleEl = document.getElementById("listHeaderTitle");

    function renderListView(items, mode = "all") {
      const sorted = [...items].sort((a, b) =>
        (a.place.title || "").localeCompare(b.place.title || "", "en", { sensitivity: "base" })
      );

      listViewList.innerHTML = "";

      if (mode === "saved" && sorted.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "0.75rem";
        empty.style.fontSize = "0.85rem";
        empty.style.color = "#9ca3af";
        empty.textContent = "You haven’t saved any places yet. Tap the ♡ icon on a place to save it.";
        listViewList.appendChild(empty);
      }

      sorted.forEach(({ place, index }) => {
        const key = getPlaceKey(place, index);
        const div = document.createElement("div");
        div.className = "list-item";

        const thumb = document.createElement("div");
        thumb.className = "list-thumb skeleton";

        const img = document.createElement("img");
        if (place.image_url) {
          img.loading = "lazy";
          img.classList.add("skeleton");
          img.onload = () => {
            img.classList.remove("skeleton");
            thumb.classList.remove("skeleton");
          };
          img.src = place.image_url;
        } else {
          thumb.classList.remove("skeleton");
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

        titleRow.appendChild(titleEl);
        titleRow.appendChild(favBtn);

        const metaEl = document.createElement("div");
        metaEl.className = "list-meta";
        metaEl.textContent = [place.category, place.region].filter(Boolean).join(" • ");

        const descEl = document.createElement("div");
        descEl.className = "list-desc";
        descEl.textContent = place.description || "";

        details.appendChild(titleRow);
        details.appendChild(metaEl);
        details.appendChild(descEl);

        div.appendChild(thumb);
        div.appendChild(details);

        div.onclick = () => {
          const m = markers[index];
          if (!m) return;
          map.setView(m.getLatLng(), 14);
          highlightMarker(m);
          if (window.innerWidth <= 768) {
            showPlaceSheet(place, key, index);
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
      renderListView(currentVisible, "all");
      listViewOverlay.style.display = "block";
    }

    function openSavedView() {
      const saved = [];
      globalPlaces.forEach((place, index) => {
        const key = getPlaceKey(place, index);
        if (favoriteSet.has(key)) {
          saved.push({ place, index });
        }
      });
      renderListView(saved, "saved");
      listViewOverlay.style.display = "block";
    }

    function closeListView() {
      listViewOverlay.style.display = "none";
    }

    if (openListViewBtn) openListViewBtn.onclick = openListView;
    if (closeListViewBtn) closeListViewBtn.onclick = closeListView;
    if (openSavedViewBtn) openSavedViewBtn.onclick = openSavedView;

    function applyFilters() {
      const q = document.getElementById("search").value || "";

      const activeCats = [...document.querySelectorAll("#categoryButtons button.active")]
        .map(b => b.dataset.value)
        .filter(v => v !== "all");

      const activeRegs = [...document.querySelectorAll("#regionButtons button.active")]
        .map(b => b.dataset.value)
        .filter(v => v !== "all");

      let bounds = null;
      const visible = [];

      globalPlaces.forEach((p, i) => {
        const m = markers[i];
        if (!m) return;

        const inCat = activeCats.length === 0 || activeCats.includes(p.category);
        const inReg = activeRegs.length === 0 || activeRegs.includes(p.region);
        const inSearch =
          !q.trim() ||
          softMatch(p.title, q) ||
          softMatch(p.description, q) ||
          softMatch(p.category, q) ||
          softMatch(p.region, q);

        const show = inCat && inReg && inSearch;

        if (!show) {
          if (clusterGroup.hasLayer(m)) clusterGroup.removeLayer(m);
        } else {
          if (!clusterGroup.hasLayer(m)) clusterGroup.addLayer(m);
          const ll = m.getLatLng();
          if (!bounds) bounds = L.latLngBounds(ll, ll);
          else bounds.extend(ll);
          visible.push({ place: p, index: i });
        }
      });

      visible.sort((a, b) =>
        (a.place.title || "").localeCompare(b.place.title || "", "en", { sensitivity: "base" })
      );
      currentVisible = visible;

      if (visible.length > 0 && bounds && !q.trim()) {
        map.fitBounds(bounds.pad(0.2));
      } else if (visible.length === 0) {
        map.setView([18.2208, -66.5901], 9);
      }

      renderSearchResults(visible, q);
      updateInfoBar(visible.length, activeCats, activeRegs);
    }

    const searchInput = document.getElementById("search");
const searchClearBtn = document.getElementById("searchClear");
const searchButton = document.getElementById("searchButton");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const hasText = searchInput.value.trim().length > 0;
    if (searchClearBtn) {
      searchClearBtn.style.display = hasText ? "flex" : "none";
    }
    applyFilters();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchClearBtn.style.display = "none";
    applyFilters();
    const sr = document.getElementById("searchResults");
    if (sr) sr.style.display = "none";
  });
}

if (searchButton) {
  searchButton.addEventListener("click", () => {
    applyFilters();
  });
}

    function resetFilters() {
      document.getElementById("search").value = "";
      ["categoryButtons", "regionButtons"].forEach(id => {
        const div = document.getElementById(id);
        div.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        const allBtn = div.querySelector('[data-value="all"]');
        if (allBtn) allBtn.classList.add("active");
      });
      applyFilters();
    }

    const resetSidebarBtn = document.getElementById("resetFiltersSidebar");
    if (resetSidebarBtn) resetSidebarBtn.onclick = resetFilters;

    document.getElementById("hamburgerButton").onclick = () => {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open-mobile");
  } else {
    sidebar.classList.toggle("collapsed-desktop");
  }
};

    const gpsButton = document.getElementById("gpsButton");
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
              weight: 3
            }).addTo(map);
          } else {
            userLocationMarker.setLatLng([lat, lng]);
          }

          map.setView([lat, lng], 13);
        },
        (err) => {
          gpsButton.classList.remove("gps-active");
          console.warn("Geolocation error", err);
          alert("Unable to get your location.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

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
        document.getElementById("infoBar").textContent =
          "Error loading places.";
      }
    }

    loadPlaces();
  



/* ==== MOBILE REBUILD SECTION ==== */

function updateVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
updateVH();
window.addEventListener("resize", updateVH);
window.addEventListener("orientationchange", updateVH);

const sidebar = document.getElementById("sidebar");
const hamburgerButton = document.getElementById("hamburgerButton");
function isMobile(){ return window.innerWidth <= 768; }
function toggleSidebar(){
  if(isMobile()){ sidebar.classList.toggle("open-mobile"); }
  else{ sidebar.classList.toggle("collapsed-desktop"); }
}
if(hamburgerButton){ hamburgerButton.addEventListener("click", toggleSidebar); }
window.addEventListener("resize", ()=> {
  if(isMobile()) sidebar.classList.remove("collapsed-desktop");
  else sidebar.classList.remove("open-mobile");
});

// Place sheet new logic would go here (shortened for download)
