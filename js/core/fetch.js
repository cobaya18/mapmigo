// js/core/fetch.js
export async function loadPlacesFromAPI() {
  const url = "https://puerto-rico-map.cobaya18.workers.dev/places";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch places: " + res.status);
  }
  return res.json();
}
