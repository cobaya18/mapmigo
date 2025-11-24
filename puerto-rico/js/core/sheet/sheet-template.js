// js/core/sheet/sheet-template.js
import { isFavorite } from "../favorites.js";

export function updatePlaceSheet(place, key) {
  const sheetTitle = document.getElementById("sheetTitle");
  const sheetMeta = document.getElementById("sheetMeta");
  const sheetImage = document.getElementById("sheetImage");
  const sheetDesc = document.getElementById("sheetDescription");
  const sheetMapsBtn = document.getElementById("sheetMapsBtn");
  const sheetFavBtn = document.getElementById("sheetFavBtn");

  const w = document.getElementById("sheetWebsite");
  const c = document.getElementById("sheetCost");
  const p = document.getElementById("sheetParking");
  const m = document.getElementById("sheetMunicipality");

  if (sheetTitle) sheetTitle.textContent = place.title || "";
  if (sheetMeta) {
    sheetMeta.textContent = [place.category, place.region]
      .filter(Boolean)
      .join(" • ");
  }
  if (sheetDesc) sheetDesc.textContent = place.description || "";

  if (w) {
    w.innerHTML = place.website_url
      ? `<button class="popup-button popup-website"
                   onclick="window.open('${place.website_url}', '_blank')">
           Visit Website
         </button>`
      : "N/A";
  }

  if (c) c.textContent = place.cost || "N/A";
  if (p) p.textContent = place.parking || "N/A";
  if (m) m.textContent = place.municipality || "N/A";

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
    sheetFavBtn.classList.toggle("fav-active", isFavorite(key));
  }
}
