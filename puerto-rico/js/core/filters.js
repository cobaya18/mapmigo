// js/core/filters.js
import { state } from "./state.js";
import { softMatch, getCategoryColor, normalize } from "./util.js";

export function initFilters() {
  populateFilters();
  setupResetButtons();
}

/**
 * Build filter button groups for both desktop sidebar and mobile filter sheet.
 */
function populateFilters() {
  const cats = [...new Set(state.places.map((p) => p.category))]
    .filter(Boolean)
    .sort();
  const regs = [...new Set(state.places.map((p) => p.region))]
    .filter(Boolean)
    .sort();

  const targets = [
    { catId: "categoryButtons", regId: "regionButtons" },
    { catId: "sheetCategoryButtons", regId: "sheetRegionButtons" },
  ];

  targets.forEach(({ catId, regId }) => {
    const catDiv = document.getElementById(catId);
    const regDiv = document.getElementById(regId);
    if (!catDiv || !regDiv) return;

    // Categories
    catDiv.innerHTML = '<button data-value="all" class="active">All</button>';
    cats.forEach((c) => {
      const col = getCategoryColor(c);
      catDiv.innerHTML += `
        <button data-value="${c}">
          <span class="cat-dot-large" style="background:${col};"></span>${c}
        </button>
      `;
    });

    // Regions
    regDiv.innerHTML = '<button data-value="all" class="active">All</button>';
    regs.forEach((r) => {
      regDiv.innerHTML += `<button data-value="${r}">${r}</button>`;
    });

    setupMultiSelect(catDiv);
    setupMultiSelect(regDiv);
  });
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
        const allBtn = container.querySelector('[data-value="all"]');
        if (allBtn) allBtn.classList.remove("active");

        const anySelected = [...container.querySelectorAll("button")].some(
          (b) => b.dataset.value !== "all" && b.classList.contains("active")
        );
        if (!anySelected && allBtn) {
          allBtn.classList.add("active");
        }
      }

      const q = (document.getElementById("search")?.value ?? "").trim();
      applyFilters(q);
    };
  });
}

function setupResetButtons() {
  const ids = ["resetFiltersSidebar", "resetFiltersSheet"];
  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = resetFilters;
    }
  });
}

export function resetFilters() {
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";

  const containerIds = [
    "categoryButtons",
    "regionButtons",
    "sheetCategoryButtons",
    "sheetRegionButtons",
  ];

  containerIds.forEach((id) => {
    const container = document.getElementById(id);
    if (!container) return;
    const allBtn = container.querySelector('[data-value="all"]');
    const buttons = container.querySelectorAll("button");
    buttons.forEach((b) => b.classList.remove("active"));
    if (allBtn) allBtn.classList.add("active");
  });

  applyFilters("");
}

/**
 * Collect active filter values from one or more button containers.
 */
function collectActiveValues(ids) {
  const out = [];
  ids.forEach((id) => {
    const container = document.getElementById(id);
    if (!container) return;
    const values = [...container.querySelectorAll("button.active")]
      .map((b) => b.dataset.value)
      .filter((v) => v && v !== "all");
    out.push(...values);
  });
  return [...new Set(out)];
}

/**
 * Core filter application: combines category filters, region filters,
 * and optional search text to determine which places are visible.
 */
export function applyFilters(queryText = "") {
  if (!state.map || !state.clusterGroup) return;

  const q = queryText || "";
  const normalizedQuery = normalize(q);
  const hasQuery = normalizedQuery.length > 0;

  const activeCats = collectActiveValues([
    "categoryButtons",
    "sheetCategoryButtons",
  ]);

  const activeRegs = collectActiveValues([
    "regionButtons",
    "sheetRegionButtons",
  ]);

  let bounds = null;
  const visible = [];
  const toAdd = [];
  const toRemove = [];
  const cluster = state.clusterGroup;

  state.places.forEach((p, i) => {
    const m = state.markers[i];
    if (!m) return;

    const inCat =
      activeCats.length === 0 || activeCats.includes(p.category);
    const inReg =
      activeRegs.length === 0 || activeRegs.includes(p.region);

    let inSearch = true;
    if (hasQuery) {
      const nt = p._normTitle || "";
      const nd = p._normDesc || "";
      const nc = p._normCategory || "";
      const nr = p._normRegion || "";
      inSearch =
        nt.includes(normalizedQuery) ||
        nd.includes(normalizedQuery) ||
        nc.includes(normalizedQuery) ||
        nr.includes(normalizedQuery);

      // Fallback to softMatch if normalized fields are missing
      if (!inSearch && (!nt && !nd && !nc && !nr)) {
        inSearch =
          softMatch(p.title, q) ||
          softMatch(p.description, q) ||
          softMatch(p.category, q) ||
          softMatch(p.region, q);
      }
    }

    const show = inCat && inReg && inSearch;

    if (!show) {
      if (cluster.hasLayer(m)) {
        toRemove.push(m);
      }
    } else {
      if (!cluster.hasLayer(m)) {
        toAdd.push(m);
      }
      const ll = m.getLatLng();
      if (!bounds) bounds = L.latLngBounds(ll, ll);
      else bounds.extend(ll);
      visible.push({ place: p, index: i });
    }
  });

  if (toRemove.length) {
    cluster.removeLayers(toRemove);
  }
  if (toAdd.length) {
    cluster.addLayers(toAdd);
  }

  visible.sort((a, b) =>
    (a.place.title || "").localeCompare(b.place.title || "", "en", {
      sensitivity: "base",
    })
  );

  state.currentVisible = visible;

  if (visible.length > 0 && bounds && !q.trim()) {
    state.map.fitBounds(bounds.pad(0.2));
  } else if (visible.length === 0) {
    // Default view over Puerto Rico
    state.map.setView([18.2208, -66.5901], 9);
  }

  updateInfoBar(visible.length, activeCats, activeRegs);
  window.dispatchEvent(new CustomEvent("filters:updated"));
}

function updateInfoBar(visibleCount, activeCats, activeRegs) {
  const infoBar = document.getElementById("infoBar");
  if (!infoBar) return;

  const parts = [];
  parts.push(visibleCount === 1 ? "1 result" : `${visibleCount} results`);

  const filterBits = [];
  if (activeCats.length > 0)
    filterBits.push("Categories: " + activeCats.join(", "));
  if (activeRegs.length > 0)
    filterBits.push("Regions: " + activeRegs.join(", "));
  if (filterBits.length > 0) parts.push("Filters: " + filterBits.join(" • "));
  else parts.push("No filters active");

  infoBar.textContent = parts.join(" • ");
}
