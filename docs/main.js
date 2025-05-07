/* === CONFIG: Google Sheet responses CSV ====================== */
const csvURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo/pub?output=csv";
/* ============================================================== */

const user = location.hostname.split('.')[0];
const repo = "unsolved-problems";
const api  = `https://api.github.com/repos/${user}/${repo}/issues?state=open&per_page=100`;

/* --- CSV text → array of objects ----------------------------- */
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h=>h.replace(/(^"|"$)/g,''));
  return lines.map(row=>{
    const cells=row.split(',').map(c=>c.replace(/(^"|"$)/g,''));
    return Object.fromEntries(cells.map((c,i)=>[headers[i],c]));
  });
}

/* --- Seeds → pseudo-issues ----------------------------------- */
function seedToIssue(p){
  return {
    title     : p.title,
    html_url  : p.url,
    created_at: (p.posted||"2000-01-01")+"T00:00:00Z",
    body:
`Category: ${p.category}
Reward / Budget: ${p.reward}
${p.description}
Contact: ${p.contact}`
  };
}

/* --- Fetch seeds, sheet rows, and (optional) GitHub issues ---- */
Promise.all([
  fetch("seeds.json").then(r=>r.json()).catch(()=>[]),
  fetch(csvURL).then(r=>r.text()).then(parseCSV).catch(()=>[]),
  fetch(api).then(r=>r.ok?r.json():[]).catch(()=>[])
]).then(([seeds,sheet,issues])=>{

  /* Map Google-sheet rows to pseudo-issues */
  const sheetIssues = sheet.map(r=>({
    title     : (r.Description||"Untitled").slice(0,60),
    html_url  : "#",
    created_at: new Date().toISOString(),
    body:
`Category: ${r.Category}
Reward / Budget: ${r.Reward}

${r.Description}

Contact: ${r.Contact}`
  }));

  const items = [
    ...seeds.map(seedToIssue),
    ...sheetIssues,
    ...issues
  ];

  /* Group by Category and render */
  const byCat=new Map();
  items.forEach(i=>{
    const cat=(i.body.match(/Category:\\s*(.*)/i)||[,"Uncategorised"])[1].trim();
    (byCat.get(cat)??byCat.set(cat,[]).get(cat)).push(i);
  });

  const out=document.getElementById("content");
  [...byCat.keys()].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const li=byCat.get(cat).map(i=>{
        const reward=(i.body.match(/Reward \\/ Budget:\\s*(.*)/i)||[])[1]||"-";
        return `<li>${i.title} — <em>${reward}</em></li>`;
      }).join("");
      out.insertAdjacentHTML("beforeend",`<h3>${cat}</h3><ul>${li}</ul>`);
    });
}).catch(console.error);
