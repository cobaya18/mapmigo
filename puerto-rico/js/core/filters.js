// js/core/filters.js
import { state } from "./state.js";
import { softMatch, getCategoryColor } from "./util.js";

export function initFilters() {
  populateFilters();
  setupResetButton();
}

function populateFilters() {
  const cats = [...new Set(state.places.map((p) => p.category))]
    .filter(Boolean)
    .sort();
  const regs = [...new Set(state.places.map((p) => p.region))]
    .filter(Boolean)
    .sort();

  const catDiv = document.getElementById("categoryButtons");
  const regDiv = document.getElementById("regionButtons");

  if (!catDiv || !regDiv) return;

  catDiv.innerHTML = '<button data-value="all" class="active">All</button>';
  cats.forEach((c) => {
    const col = getCategoryColor(c);
    catDiv.innerHTML += `<button data-value="${c}">
      <span class="cat-dot-large" style="background:${col};"></span>${c}
    </button>`;
  });

  regDiv.innerHTML = '<button data-value="all" class="active">All</button>';
  regs.forEach((r) => {
    regDiv.innerHTML += `<button data-value="${r}">${r}</button>`;
  });

  setupMultiSelect(catDiv);
  setupMultiSelect(regDiv);
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
          (b) => b.dataset.value !== "all" && b.classList.contains("active")
        );
        if (!anySelected) {
          container.querySelector('[data-value="all"]').classList.add("active");
        }
      }
      const q = (document.getElementById("search")?.value ?? "").trim();
      applyFilters(q);
    };
  });
}

function setupResetButton() {
  const btn = document.getElementById("resetFiltersSidebar");
  if (!btn) return;
  btn.onclick = resetFilters;
}

export function resetFilters() {
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";

  ["categoryButtons", "regionButtons"].forEach((id) => {
    const div = document.getElementById(id);
    if (!div) return;
    div
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    const allBtn = div.querySelector('[data-value="all"]');
    if (allBtn) allBtn.classList.add("active");
  });

  applyFilters("");
}

export function applyFilters(queryText = "") {
  if (!state.map || !state.clusterGroup) return;

  const q = queryText || "";

  const activeCats = [
    ...document.querySelectorAll("#categoryButtons button.active"),
  ]
    .map((b) => b.dataset.value)
    .filter((v) => v !== "all");

  const activeRegs = [
    ...document.querySelectorAll("#regionButtons button.active"),
  ]
    .map((b) => b.dataset.value)
    .filter((v) => v !== "all");

  let bounds = null;
  const visible = [];

  state.places.forEach((p, i) => {
    const m = state.markers[i];
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
      if (state.clusterGroup.hasLayer(m)) state.clusterGroup.removeLayer(m);
    } else {
      if (!state.clusterGroup.hasLayer(m)) state.clusterGroup.addLayer(m);
      const ll = m.getLatLng();
      if (!bounds) bounds = L.latLngBounds(ll, ll);
      else bounds.extend(ll);
      visible.push({ place: p, index: i });
    }
  });

  visible.sort((a, b) =>
    (a.place.title || "").localeCompare(b.place.title || "", "en", {
      sensitivity: "base",
    })
  );

  // NEW: expose filtered places for UI (list view, saved, mobile sheet)
  state.filteredPlaces = visible;

  // Existing consumer (if any)
  state.currentVisible = visible;

  if (visible.length > 0 && bounds && !q.trim()) {
    state.map.fitBounds(bounds.pad(0.2));
  } else if (visible.length === 0) {
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
