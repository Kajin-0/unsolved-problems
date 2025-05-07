/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo";
const tabName = "Form_Responses1";               // exact tab label (with underscore)
const jsonURL = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(tabName)}`;

/* Target element */
const container = document.getElementById("content");
container.textContent = "Loading problems…";

/* -------------------------------------------------------------
   Fetch  → JSON  → Render
   ------------------------------------------------------------- */
fetch(jsonURL)
  .then(r => r.json())
  .then(render)
  .catch(err => {
    console.error(err);
    container.textContent =
      "Could not load problems. Check that the sheet is published (File → Share → Publish to web) and the tab name matches exactly.";
  });

/* -------------------------------------------------------------
   Render helper
   ------------------------------------------------------------- */
function render(rows){
  if (!rows.length){
    container.textContent = "No problems yet.";
    return;
  }

  /* Group by Category column */
  const byCat = {};
  rows.forEach(r=>{
    if(!r.Description) return;                             // skip blank rows
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
  });

  container.innerHTML = "";
  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const list = byCat[cat].map(r=>{
        const reward = r["Reward Budget"] || "-";
        return `<li>${r.Description.slice(0,60)} — <em>${reward}</em></li>`;
      }).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
