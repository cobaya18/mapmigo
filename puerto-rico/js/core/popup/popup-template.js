// js/core/popup/popup-template.js
import { getCategoryEmoji } from "../util.js";
import { isFavorite } from "../favorites.js";

export function buildPopupHtml(place, key, url) {
  let html = `<div class="popup-card">`;

  html += `
    <div class="popup-header">
      <div class="popup-title">${place.title || ""}</div>
      <button class="fav-btn ${isFavorite(key) ? "fav-active" : ""}" data-key="${key}">♡</button>
    </div>
  `;

  if (place.category || place.region) {
    const emoji = place.category ? getCategoryEmoji(place.category) : "";
    html += `<div class="popup-category">
      ${emoji ? emoji + " " : ""}${place.category || ""}${place.region ? " • " + place.region : ""}
    </div>`;
  }

  const img = place.image_url || place.image;
  if (img) {
    html += `
      <div class="popup-image-wrapper skeleton">
        <img src="${img}" class="popup-image"
             onload="this.classList.remove('skeleton'); this.parentElement.classList.remove('skeleton');" />
      </div>
    `;
  }

  if (place.description) {
    html += `<div class="popup-desc">${place.description}</div>`;
  }

  if (url) {
    html += `
      <a href="${url}" target="_blank" rel="noopener" class="popup-button popup-gmaps">
        Open in Google Maps
      </a>
    `;
  }

  html += `
    <button class="popup-see-more popup-button">See more</button>
    <div class="popup-more-section collapsed">
  `;

  if (place.website_url) {
    html += `
      <button class="popup-button popup-website"
              onclick="window.open('${place.website_url}', '_blank')">
        Visit Website
      </button>
    `;
  } else {
    html += `<div class="popup-row">Website: N/A</div>`;
  }

  html += `
      <div class="popup-row"><strong>Cost:</strong> ${place.cost || "N/A"}</div>
      <div class="popup-row"><strong>Parking:</strong> ${place.parking || "N/A"}</div>
      <div class="popup-row"><strong>Municipality:</strong> ${place.municipality || "N/A"}</div>
    </div>
  `;

  html += `</div>`;
  return html;
}
