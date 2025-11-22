// js/core/favorites.js
const FAVORITES_KEY = "pr_map_favorites_v1";
let favoriteSet = new Set();

export function initFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) favoriteSet = new Set(arr);
    }
  } catch (e) {
    console.warn("Failed to load favorites", e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteSet]));
  } catch (e) {
    console.warn("Failed to save favorites", e);
  }
}

export function isFavorite(key) {
  return favoriteSet.has(key);
}

export function toggleFavorite(key) {
  if (favoriteSet.has(key)) favoriteSet.delete(key);
  else favoriteSet.add(key);
  saveFavorites();
}

export function getFavoriteKeys() {
  return new Set(favoriteSet);
}
