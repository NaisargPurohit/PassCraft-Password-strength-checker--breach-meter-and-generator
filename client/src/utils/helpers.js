// misc helper functions dumping ground

export function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export function truncate(str, len = 20) {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
}

// const oldSlugify = (text) => text.toLowerCase().replace(/ /g, '-');

export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "unknown";
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
}
