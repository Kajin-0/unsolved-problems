/* docs/main.js – lists seed problems + live GitHub issues */
const user = location.hostname.split('.')[0];      // e.g. "kajin-0"
const repo = "unsolved-problems";
const api  = `https://api.github.com/repos/${user}/${repo}/issues` +
             `?state=open&labels=unsolved&per_page=100`;

/* helper to map JSON seeds → pseudo-issue objects */
function seedToIssue(p){
  return {
    title      : p.title,
    html_url   : p.url,
    created_at : (p.posted || "2000-01-01")+"T00:00:00Z",
    body:
`Category: ${p.category}
Reward / Budget: ${p.reward}
${p.description}
Contact: ${p.contact}`
  };
}

/* fetch seeds.json + live issues -> render */
Promise.all([
  fetch("seeds.json").then(r=>r.json()).catch(()=>[]),
  fetch(api).then(r=>r.ok?r.json():[]).catch(()=>[])
]).then(([seeds,issues])=>{
  const items = seeds.map(seedToIssue).concat(issues);

  /* group by category */
  const byCat = new Map();
  items.forEach(i=>{
    const cat=(i.body.match(/Category:\s*(.*)/i)||[,"Uncategorised"])[1].trim();
    (byCat.get(cat)??byCat.set(cat,[]).get(cat)).push(i);
  });

  /* render */
  const out=document.getElementById("content");
  [...byCat.keys()].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
   .forEach(cat=>{
     const li=byCat.get(cat).map(i=>{
       const reward=(i.body.match(/Reward \/ Budget:\s*(.*)/i)||[])[1]||"-";
       const date=new Date(i.created_at).toLocaleDateString();
       return `<li><a href="${i.html_url}" target="_blank">${i.title}</a>
               — <em>${reward}</em> <small>(${date})</small></li>`;
     }).join("");
     out.insertAdjacentHTML("beforeend",`<h3>${cat}</h3><ul>${li}</ul>`);
   });
}).catch(console.error);
