export const htmlToText = (html = "") => {
  if (!html || typeof html !== "string") return "";
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>/g, ""); // Fallback for Node SSR

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || doc.body.innerText || "";
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const options = { month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

export const errorFilter = (err) => {
  let error = {};

  if (err && typeof err === "object" && !Array.isArray(err)) {
    Object.keys(err)?.forEach((field) => {
      if (typeof err[field] === "string" && !err[field].trim()) {
        error[field] = field;
      }
    });
  }

  return error;
};
