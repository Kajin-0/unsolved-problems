/* ---------- CONFIG -------------------------------------------- */
const sheetID  = "1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo";
const sheetTab = "Form Responses 1";                // exact tab name
const jsonURL  = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(sheetTab)}`;

/* ---------- TARGET ELEMENT ------------------------------------ */
const container = document.getElementById("content");
container.textContent = "Loading problems…";

/* ---------- FETCH  + RENDER ----------------------------------- */
fetch(jsonURL)
  .then(r => r.json())
  .then(rows => {
    if (!rows.length) { container.textContent = "No problems yet."; return; }

    /* group by Category column */
    const byCat = {};
    rows.forEach(r => {
      if (!r.Description) return;                    // skip empty
      const cat = (r.Category || "Uncategorised").trim();
      (byCat[cat] ??= []).push(r);
    });

    /* build HTML */
    container.innerHTML = "";
    Object.keys(byCat)
      .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
      .forEach(cat => {
        const list = byCat[cat].map(r =>
          `<li>${r.Description.slice(0,60)} — <em>${r["Reward Budget"]}</em></li>`
        ).join("");
        container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
      });
  })
  .catch(err => {
    console.error(err);
    container.textContent = "Could not load problems. Check sheet publish settings.";
  });
