// js/core/fetch.js
export async function loadPlacesFromAPI() {
  const API_URL = "https://mapmigo.mapmigo.workers.dev/places";

  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch places: " + res.status);
  }

  return res.json();
}

