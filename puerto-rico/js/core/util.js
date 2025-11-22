// js/core/util.js

export function normalize(str) {
  if (str == null) return "";
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
  Beach: "#3CB9FF",
  Entertainment: "#D946EF",
  Food: "#F97316",
  Hiking: "#34D399",
  "Historical Landmark": "#8B5CF6",
  Museum: "#6366F1",
  Nightlife: "#EC4899",
  "Park/Nature": "#22C55E",
  "Point of Interest": "#FBBF24",
  "River/Waterfall": "#0EA5E9",
  Shopping: "#F59E0B",
  "Tour/Activity": "#2563EB",
  Viewpoint: "#EF4444",
};

export function getCategoryColor(c = "") {
  if (!c) return "#2563EB"; // default (Tour Blue)

  if (categoryColorMap[c]) return categoryColorMap[c];

  const n = c.toLowerCase();
  if (n.includes("beach")) return "#3CB9FF";
  if (n.includes("night")) return "#EC4899";
  if (n.includes("food") || n.includes("restaurant")) return "#F97316";
  if (n.includes("park") || n.includes("nature")) return "#22C55E";
  if (n.includes("hike")) return "#34D399";
  if (n.includes("view")) return "#EF4444";
  if (n.includes("museum")) return "#6366F1";
  if (n.includes("historic") || n.includes("landmark")) return "#8B5CF6";
  if (n.includes("shop")) return "#F59E0B";
  if (n.includes("entertainment")) return "#D946EF";
  if (n.includes("tour") || n.includes("activity")) return "#2563EB";
  if (n.includes("water") || n.includes("river") || n.includes("falls"))
    return "#0EA5E9";
  if (n.includes("point")) return "#FBBF24";

  return "#2563EB";
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
  if (!c) return "📍";
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
