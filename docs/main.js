/* Google-Sheet CSV (Publish-to-web → CSV link) */
const csvURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo/pub?output=csv";

/* DOM target */
const container = document.getElementById("content");

/* fetch + parse + render */
fetch(csvURL)
  .then(r => r.text())
  .then(text => Papa.parse(text, {header:true}).data)
  .then(rows  => render(rows))
  .catch(err  => {container.textContent="No problems found.";console.error(err);});

/* simple renderer --------------------------------------------------*/
function render(rows){
  if(!rows.length){ container.textContent="No problems yet."; return; }

  /* group by Category field */
  const byCat = {};
  rows.forEach(r=>{
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
  });

  container.innerHTML = "";
  Object.keys(byCat).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const list = byCat[cat]
        .map(r=>`<li>${r.Description.slice(0,60)} — <em>${r.Reward}</em></li>`)
        .join("");
      container.insertAdjacentHTML("beforeend",`<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
