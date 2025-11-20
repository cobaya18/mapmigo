// js/core/favorites.js
const FAVORITES_KEY = "pr_map_favorites_v1";
let favoriteSet = new Set();

/**
 * Load favorites from localStorage into memory.
 */
export function initFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        favoriteSet = new Set(arr);
      }
    }
  } catch (e) {
    console.warn("Failed to load favorites", e);
  }
}

/**
 * Persist favorites to localStorage.
 */
function saveFavorites() {
  try {
    const arr = Array.from(favoriteSet);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to save favorites", e);
  }
}

/**
 * Check if a given key is currently marked as favorite.
 */
export function isFavorite(key) {
  return favoriteSet.has(key);
}

/**
 * Toggle a favorite on/off and persist the change.
 */
export function toggleFavorite(key) {
  if (favoriteSet.has(key)) {
    favoriteSet.delete(key);
  } else {
    favoriteSet.add(key);
  }
  saveFavorites();
}

/**
 * Get a copy of the current favorite keys as a Set.
 */
export function getFavoriteKeys() {
  return new Set(favoriteSet);
}
