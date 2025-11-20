// js/core/filters.js
import { state } from "./state.js";
import { softMatch, getCategoryColor, getCategoryEmoji } from "./util.js";

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
  const catDivMobile = document.getElementById("categoryButtonsMobile");
  const regDivMobile = document.getElementById("regionButtonsMobile");

  // Desktop sidebar filters
  if (catDiv) {
    catDiv.innerHTML = '<button data-value="all" class="active">All</button>';
    cats.forEach((c) => {
      const col = getCategoryColor(c);
      catDiv.innerHTML += `<button data-value="${c}">
      <span class="cat-dot-large" style="background:${col};"></span>${c}
    </button>`;
    });
    setupMultiSelect(catDiv);
  }

  if (regDiv) {
    regDiv.innerHTML = '<button data-value="all" class="active">All</button>';
    regs.forEach((r) => {
      regDiv.innerHTML += `<button data-value="${r}">${r}</button>`;
    });
    setupMultiSelect(regDiv);
  }

  // Mobile filter sheet: emoji grid + category colors
  if (catDivMobile) {
    catDivMobile.innerHTML =
      '<button data-value="all" class="active" style="--cat-color:#e5e7eb;">All</button>';
    cats.forEach((c) => {
      const col = getCategoryColor(c);
      const emoji = getCategoryEmoji(c);
      catDivMobile.innerHTML += `<button class="mobile-cat-btn" data-value="${c}" style="--cat-color:${col};">
        <span class="mobile-cat-emoji">${emoji}</span>
        <span class="mobile-cat-label">${c}</span>
      </button>`;
    });
    setupMultiSelect(catDivMobile);
  }

  if (regDivMobile) {
    regDivMobile.innerHTML =
      '<button data-value="all" class="active">All</button>';
    regs.forEach((r) => {
      regDivMobile.innerHTML += `<button data-value="${r}">${r}</button>`;
    });
    setupMultiSelect(regDivMobile);
  }
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
  ["resetFiltersSidebar", "resetFiltersMobile"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.onclick = resetFilters;
  });
}

export function resetFilters() {
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";

  ["categoryButtons", "regionButtons", "categoryButtonsMobile", "regionButtonsMobile"].forEach(
    (id) => {
      const div = document.getElementById(id);
      if (!div) return;
      div
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      const allBtn = div.querySelector('[data-value="all"]');
      if (allBtn) allBtn.classList.add("active");
    }
  );

  applyFilters("");
}

export function applyFilters(queryText = "") {
  if (!state.map || !state.clusterGroup) return;

  const q = queryText || "";

  // Gather active filters from both desktop sidebar + mobile sheet
  const catSelectors = [
    "#categoryButtons button.active",
    "#categoryButtonsMobile button.active",
  ];
  const regSelectors = [
    "#regionButtons button.active",
    "#regionButtonsMobile button.active",
  ];

  const activeCatsSet = new Set();
  catSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((b) => {
      const val = b.dataset.value;
      if (val && val !== "all") activeCatsSet.add(val);
    });
  });

  const activeRegsSet = new Set();
  regSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((b) => {
      const val = b.dataset.value;
      if (val && val !== "all") activeRegsSet.add(val);
    });
  });

  const activeCats = Array.from(activeCatsSet);
  const activeRegs = Array.from(activeRegsSet);

  let bounds = null;
  const visible = [];

  state.places.forEach((p, i) => {
    const m = state.markers[i];
    if (!m) return;

    const inCat =
      activeCats.length === 0 || activeCats.includes(p.category);
    const inReg =
      activeRegs.length === 0 || activeRegs.includes(p.region);
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
  const summaryEl = document.getElementById("filterSheetSummaryActive");

  if (infoBar) {
    const parts = [];
    parts.push(visibleCount === 1 ? "1 result" : `${visibleCount} results`);

    const filterBits = [];
    if (activeCats.length > 0)
      filterBits.push("Categories: " + activeCats.join(", "));
    if (activeRegs.length > 0)
      filterBits.push("Regions: " + activeRegs.join(", "));
    if (filterBits.length > 0)
      parts.push("Filters: " + filterBits.join(" • "));
    else parts.push("No filters active");

    infoBar.textContent = parts.join(" • ");
  }

  if (summaryEl) {
    const labelParts = [];
    labelParts.push(
      visibleCount === 1 ? "1 place" : `${visibleCount} places`
    );

    if (activeCats.length || activeRegs.length) {
      const bits = [];
      if (activeCats.length) bits.push(`${activeCats.length} categories`);
      if (activeRegs.length) bits.push(`${activeRegs.length} regions`);
      labelParts.push(bits.join(" • "));
    } else {
      labelParts.push("No filters");
    }

    summaryEl.textContent = labelParts.join(" • ");
  }
}

