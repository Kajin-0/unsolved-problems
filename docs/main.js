/* 1️⃣  YOUR Google-Sheet CSV (Responses → Publish to web → CSV URL) */
const csvURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo/pub?output=csv";

/* ---------- helpers ------------------------------------------ */
function csvToObjects(text) {
  try {
    const lines   = text.trim().split(/\r?\n/);
    const headers = lines.shift().split(',').map(h => h.replace(/^"|"$/g, ''));
    return lines.map(row => {
      const cells = row.split(',').map(c => c.replace(/^"|"$/g, ''));
      return Object.fromEntries(cells.map((c, i) => [headers[i], c]));
    });
  } catch (err) {
    console.error("CSV parse error:", err);
    return [];
  }
}

function toIssue(obj) {
  /* maps either a seed or a CSV row into a display-friendly shape */
  return {
    category : obj.category   || obj.Category   || "Uncategorised",
    reward   : obj.reward     || obj.Reward     || "-",
    title    : obj.title      || (obj.Description || "Untitled").slice(0, 60),
    description: obj.description || obj.Description || "",
    contact  : obj.contact    || obj.Contact    || "",
  };
}

/* ---------- 1. load seeds ------------------------------------ */
fetch("seeds.json")
  .then(r => r.json())
  .then(seeds => seeds.map(toIssue))
  .then(render)               // render seeds immediately
  .catch(err => console.error("Could not load seeds.json", err));

/* ---------- 2. load Google-Form responses -------------------- */
fetch(csvURL)
  .then(r => r.text())
  .then(csvToObjects)
  .then(rows => rows.map(toIssue))
  .then(render)               // append new rows
  .catch(err => console.warn("No sheet rows yet or fetch failed:", err));

/* ---------- render (idempotent) ------------------------------ */
function render(items) {
  const container = document.getElementById("content");

  /* merge into global list stored on #content */
  container.allItems = (container.allItems || []).concat(items);

  /* clear and rebuild grouped view */
  container.innerHTML = "";
  const byCat = {};
  container.allItems.forEach(it => {
    const c = it.category.trim() || "Uncategorised";
    (byCat[c] ??= []).push(it);
  });

  Object.keys(byCat).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .forEach(cat => {
      const list = byCat[cat].map(it =>
        `<li>${it.title} — <em>${it.reward}</em></li>`).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
