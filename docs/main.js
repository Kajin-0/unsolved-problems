const user = window.location.hostname.split('.')[0];
const repo = "unsolved-problems";
const apiURL = `https://api.github.com/repos/${user}/${repo}/issues?state=open&labels=unsolved&per_page=100`;

function seedToIssue(p) {
  return {
    title     : p.title,
    html_url  : p.url,
    created_at: p.posted + "T00:00:00Z",
    body:
`Category: ${p.category}
Reward / Budget: ${p.reward}
${p.description}
Contact: ${p.contact}`
  };
}

Promise.all([
  fetch("seeds.json").then(r => r.json()).catch(() => []),
  fetch(apiURL).then(r => r.ok ? r.json() : []).catch(() => [])
]).then(([seeds, issues]) => {
  const items = seeds.map(seedToIssue).concat(issues);

  const byCat = new Map();
  items.forEach(i => {
    const cat = (i.body.match(/Category:\\s*(.*)/i) || [,"Uncategorised"])[1].trim();
    (byCat.get(cat) ?? byCat.set(cat, []).get(cat)).push(i);
  });

  const container = document.getElementById("content");
  [...byCat.keys()].sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:"base"}))
    .forEach(cat => {
      const list = byCat.get(cat).map(i => {
        const reward = (i.body.match(/Reward \\/ Budget:\\s*(.*)/i)||[])[1] || "-";
        const date   = new Date(i.created_at).toLocaleDateString();
        return `<li><a href="${i.html_url}" target="_blank">${i.title}</a>
                 — <em>${reward}</em> <small>(${date})</small></li>`;
      }).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}).catch(console.error);
