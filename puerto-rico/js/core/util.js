// js/core/util.js
export function normalize(str) {
  if (str == null) return ""; // handles null AND undefined
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function softMatch(text = "", q = "") {
  if (!q.trim()) return true;
  return normalize(text).includes(normalize(q));
}

export function relevanceScore(place, q) {
  if (!q.trim()) return 0;
  const nq = normalize(q);
  const nt = normalize(place.title || "");
  let s = 0;

  if (softMatch(place.title, q)) s += 10;
  if (softMatch(place.category, q)) s += 3;
  if (softMatch(place.region, q)) s += 2;
  if (softMatch(place.description, q)) s += 1;
  if (nt.startsWith(nq)) s += 6;
  if (nt === nq) s += 4;

  return s;
}

const categoryColorMap = {
  Beach: "#00C8FF",
  Entertainment: "#FF0080",
  Food: "#FF6B00",
  Hiking: "#2DD4BF",
  "Historical Landmark": "#8B5CF6",
  Museum: "#3F51B5",
  Nightlife: "#FF1493",
  "Park/Nature": "#4CAF50",
  "Point of Interest": "#FFD400",
  "River/Waterfall": "#0096C7",
  Shopping: "#FFB703",
  "Tour/Activity": "#3B82F6",
  Viewpoint: "#E11D48",
};

export function getCategoryColor(c = "") {
  if (!c) return "#3B82F6"; // fallback
  if (categoryColorMap[c]) return categoryColorMap[c];

  const n = c.toLowerCase();
  if (n.includes("beach")) return "#00C8FF";
  if (n.includes("night")) return "#FF1493";
  if (n.includes("food") || n.includes("restaurant")) return "#FF6B00";
  if (n.includes("park") || n.includes("nature")) return "#4CAF50";
  if (n.includes("hike")) return "#2DD4BF";
  if (n.includes("view")) return "#E11D48";
  if (n.includes("museum")) return "#3F51B5";
  if (n.includes("historic") || n.includes("landmark")) return "#8B5CF6";
  if (n.includes("shop")) return "#FFB703";
  if (n.includes("entertainment")) return "#FF0080";
  if (n.includes("tour") || n.includes("activity")) return "#3B82F6";
  if (n.includes("water") || n.includes("river") || n.includes("falls"))
    return "#0096C7";
  if (n.includes("point")) return "#FFD400";
  return "#3B82F6";
}

const categoryEmojiMap = {
  Beach: "🏖️",
  Entertainment: "🎟️",
  Food: "🍽️",
  Hiking: "🥾",
  "Historical Landmark": "🏰",
  Museum: "🏛️",
  Nightlife: "🎵",
  "Park/Nature": "🌳",
  "Point of Interest": "📍",
  "River/Waterfall": "🏞️",
  Shopping: "🛍️",
  "Tour/Activity": "🧭",
  Viewpoint: "📸",
};

export function getCategoryEmoji(c = "") {
  if (!c) return "📍"; // fallback
  if (categoryEmojiMap[c]) return categoryEmojiMap[c];

  const n = c.toLowerCase();
  if (n.includes("beach")) return "🏖️";
  if (n.includes("night")) return "🎵";
  if (n.includes("food") || n.includes("restaurant")) return "🍽️";
  if (n.includes("park") || n.includes("nature")) return "🌳";
  if (n.includes("hike")) return "🥾";
  if (n.includes("view")) return "📸";
  if (n.includes("museum")) return "🏛️";
  if (n.includes("historic") || n.includes("landmark")) return "🏰";
  if (n.includes("shop")) return "🛍️";
  if (n.includes("entertainment")) return "🎟️";
  if (n.includes("tour") || n.includes("activity")) return "🧭";
  if (n.includes("water") || n.includes("river") || n.includes("falls"))
    return "🏞️";
  if (n.includes("point")) return "📍";
  return "📍";
}

export function getPlaceKey(place, index) {
  if (place.id) return "id:" + place.id;
  if (place.slug) return "slug:" + place.slug;
  return "idx:" + index + ":" + (place.title || "");
}

