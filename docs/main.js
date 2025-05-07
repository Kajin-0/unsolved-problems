// docs/main.js
// Replace <user> with your GitHub username
const owner  = "<user>";
const repo   = "unsolved-problems";
const apiURL = `https://api.github.com/repos/${owner}/${repo}/issues` +
               `?state=open&labels=unsolved&per_page=100`;

fetch(apiURL)
  .then(r => r.json())
  .then(issues => {
    const byCat = new Map();
    issues.forEach(i => {
      const match = i.body.match(/Category:\s*(.*)/i);
      const cat   = (match && match[1].trim()) || "Uncategorised";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(i);
    });

    const sortedCats = [...byCat.keys()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    const container = document.getElementById("content");
    sortedCats.forEach(cat => {
      const issuesHTML = byCat.get(cat)
        .map(issue => {
          const reward = (issue.body.match(/Reward \/ Budget:\s*(.*)/i)||[])[1]||"-";
          const date   = new Date(issue.created_at).toLocaleDateString();
          return `
            <li>
              <a href="${issue.html_url}" target="_blank">${issue.title}</a>
              — <em>${reward}</em> <small>(${date})</small>
            </li>`;
        })
        .join("");

      container.insertAdjacentHTML(
        "beforeend",
        `<h3>${cat}</h3><ul>${issuesHTML}</ul>`
      );
    });
  })
  .catch(console.error);
