// js/core/state.js
export const state = {
  map: null,
  places: [],
  markers: [],
  clusterGroup: null,

  // [{ place, index }]
  currentVisible: [],

  // [{ place, index }] – kept in sync by filters.js for UI modules
  filteredPlaces: [],
};
