function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pick(obj, path, fallback = "") {
  try {
    return path
      .split(".")
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function shorten(value, max = 140) {
  const text = String(value ?? "");
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

module.exports = {
  esc,
  pick,
  shorten,
};
