/* docs/main.js  ───────────────────────────────────────────────
 * Replace <user> with your GitHub username once.
 * Edit or delete items in `seedProblems` to taste.
 */

const owner  = "<user>";
const repo   = "unsolved-problems";
const apiURL = `https://api.github.com/repos/${owner}/${repo}/issues` +
               `?state=open&labels=unsolved&per_page=100`;

/* ---------- 1. SEED PROBLEMS (edit freely) ------------------ */
const seedProblems = [
  {
    title: "Riemann Hypothesis",
    category: "Academia",
    reward: "$1 000 000 (Clay Institute)",
    description:
      "Prove that every non-trivial zero of the Riemann zeta-function ζ(s) has real part 1/2.",
    url: "https://www.claymath.org/millennium-problems/riemann-hypothesis",
    posted: "2000-05-24",
    contact: "prize@claymath.org"
  },
  {
    title: "NASA CubeSat Thermal-Control Challenge",
    category: "Government",
    reward: "$50 000",
    description:
      "Design a passive thermal solution that keeps a CubeSat payload below −20 °C in LEO.",
    url: "https://nasa.gov/directorates/stmd/centennial_challenges/",
    posted: "2024-11-15",
    contact: "cubesat-challenge@nasa.gov"
  },
  {
    title: "Ultra-low-latency Global Equities Feed",
    category: "Private Company",
    reward: "$10 000 – $20 000",
    description:
      "Build an open-source gateway that streams consolidated tick data end-to-end < 5 ms.",
    url: "mailto:ops@opentrading.co",
    posted: "2025-05-07",
    contact: "ops@opentrading.co"
  }
];

/* ---------- 2. Helper to convert seeds → pseudo-issue -------- */
function seedToPseudoIssue(p) {
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

/* ---------- 3. Fetch live GitHub Issues --------------------- */
Promise.all([
  fetch(apiURL)
    .then(r => r.ok ? r.json() : [])
    .catch(() => [])
]).then(([issues]) => {
  const items = seedProblems.map(seedToPseudoIssue).concat(issues);

  /* ---------- 4. Group by category & render ---------------- */
  const byCat = new Map();
  items.forEach(i => {
    const cat = (i.body.match(/Category:\\s*(.*)/i) || [,"Uncategorised"])[1].trim();
    (byCat.get(cat) ?? byCat.set(cat, []).get(cat)).push(i);
  });

  const content = document.getElementById("content");
  [...byCat.keys()].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat => {
      const list = byCat.get(cat)
        .map(i => {
          const reward = (i.body.match(/Reward \\/ Budget:\\s*(.*)/i)||[])[1] || "-";
          const date   = new Date(i.created_at).toLocaleDateString();
          return `<li><a href="${i.html_url}" target="_blank">${i.title}</a>
                  — <em>${reward}</em> <small>(${date})</small></li>`;
        }).join("");
      content.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}).catch(console.error);
