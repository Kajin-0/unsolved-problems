/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "15xe_BEFNm040nLtir2xN6uOYggvZen1duCsOoviyGlE"; // Your Sheet ID
const tabName = "Form_Responses";               // Your tab name
const jsonURL = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(tabName)}`;

/* Target element */
const container = document.getElementById("content");
// Initial loading message - will be styled by #content CSS
// container.textContent = "Loading problems…"; // Already set in HTML

/* -------------------------------------------------------------
   Fetch  → JSON  → Render
   ------------------------------------------------------------- */
fetch(jsonURL)
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        let errorDetail = `Status: ${response.status} ${response.statusText}.`;
        if (text) {
          try {
            const jsonError = JSON.parse(text);
            if (jsonError && jsonError.error) {
              errorDetail += ` Message: ${jsonError.error}`;
            } else {
              errorDetail += ` Raw Response: ${text.substring(0, 200)}`;
            }
          } catch (e) {
            errorDetail += ` Raw Response: ${text.substring(0, 200)}`;
          }
        }
        if (response.status === 400 || (response.status === 200 && text && text.includes("Requested entity was not found"))) {
             errorDetail += ` This error often means the Sheet ID ("${sheetID}") or Tab Name ("${tabName}") is incorrect, OR the sheet is not correctly "Published to web".`;
        }
        throw new Error(`Network response was not ok. ${errorDetail}`);
      });
    }
    return response.json();
  })
  .then(render)
  .catch(err => {
    console.error("Detailed error fetching or parsing data:", err);
    const mainErrorText = `Could not load problems. Error: ${err.message}`;
    let checkListHTML = `
      <br><br>Please check the following for <strong>Sheet ID: ${sheetID}</strong>:
      <ol class="detailed-error-list">
        <li><strong>Publish to Web Settings:</strong>
          <ul>
            <li>Open your Google Sheet: <a href="https://docs.google.com/spreadsheets/d/${sheetID}/edit" target="_blank" rel="noopener noreferrer">Click here to open sheet</a></li>
            <li>Go to <strong>File → Share → Publish to web</strong>.</li>
            <li>In the dialog, under "Link", ensure the tab named "<strong>${tabName}</strong>" is selected.</li>
            <li>Under "Embed", ensure "<strong>Web page</strong>" is selected (NOT CSV).</li>
            <li><strong>CRITICALLY: Ensure "Automatically republish when changes are made" is CHECKED.</strong></li>
            <li>Click "Publish" (or "Republish") and confirm. Wait 1-2 minutes for changes to propagate.</li>
          </ul>
        </li>
        <li><strong>Tab Name:</strong> Ensure the tab name in your Google Sheet is <em>exactly</em> "<code>${tabName}</code>" (case-sensitive, no extra spaces).</li>
        <li><strong>Column Names:</strong> Your Google Sheet (the "<code>${tabName}</code>" tab) MUST have these exact column headers in the first row:
          <ul>
            <li><code>Timestamp</code></li>
            <li><code>Category</code></li>
            <li><code>Reward Budget</code></li>
            <li><code>Description</code></li>
            <li><code>Contact (email)</code></li>
          </ul>
          (Case and spacing matter!)
        </li>
        <li><strong>Data Exists:</strong> Ensure there are some rows of data under these columns.</li>
        <li><strong>Test Direct Link:</strong> Try opening this URL directly in your browser: <a href="${jsonURL}" target="_blank" rel="noopener noreferrer">${jsonURL}</a>.
            <ul><li>If it shows data (starts with '[' or '{'), the problem is likely in the rendering or HTML.</li>
                <li>If it shows an error (like "Requested entity was not found"), the issue is with the sheet access/publishing or names.</li>
            </ul>
        </li>
        <li>Check the browser's console (press F12, then "Console" tab) for more technical error messages.</li>
      </ol>
    `;
    container.innerHTML = `<div class="status-message error-message"><span class="error-message-text">${mainErrorText}</span>${checkListHTML}</div>`;
  });

/* -------------------------------------------------------------
   Render helper
   ------------------------------------------------------------- */
function render(rows){
  if (!Array.isArray(rows)) {
    console.error("Data received is not an array:", rows);
    let errorMessage = "Received invalid data format from the sheet.";
    if (typeof rows === 'object' && rows !== null && rows.error) {
        errorMessage += ` Server message: ${rows.error}. This often means the sheet ID or tab name is wrong, or the sheet is not published correctly for 'opensheet.elk.sh'.`;
    }
    container.innerHTML = `<p class="status-message error-message">${errorMessage}</p>`;
    return;
  }

  if (!rows.length){
    container.innerHTML = '<p class="status-message">No problems found in the sheet. Either the sheet is empty after the header row, or no rows have a \'Description\' value.</p>';
    return;
  }

  /* Group by Category column */
  const byCat = {};
  let validRowsFound = 0;
  rows.forEach(r => {
    // CSV headers are: Timestamp,Category,Reward Budget,Description,Contact (email)
    if (typeof r !== 'object' || r === null || !r.Description || String(r.Description).trim() === "") {
        console.warn("Skipping row due to missing or empty Description, or invalid row format:", r);
        return;
    }
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
    validRowsFound++;
  });

  if (validRowsFound === 0) {
    container.innerHTML = '<p class="status-message">No problems with descriptions were found. Make sure your \'Description\' column is populated and correctly named in the sheet.</p>';
    return;
  }

  container.innerHTML = ""; // Clear loading/status message
  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const listItems = byCat[cat].map(r => {
        const reward = r["Reward Budget"] || "Not specified";
        const description = r.Description || "No description provided.";
        const contactEmail = r["Contact (email)"] || "";
        const timestamp = r.Timestamp ?
            new Date(r.Timestamp).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
                //, hour: '2-digit', minute: '2-digit' // Uncomment if you want time too
            }) : "Not specified";

        // Pseudo-title from the first part of the description
        const title = description.length > 70 ? description.substring(0, 70).trim() + "..." : description;

        let contactHTML = "";
        if (contactEmail && contactEmail.trim() !== "" && contactEmail.trim() !== "-") {
            contactHTML = `
                <span class="problem-contact">
                    <strong>Contact:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a>
                </span>`;
        }

        return `
            <li class="problem-item">
                <h4>${title}</h4>
                <p class="problem-description">${description}</p>
                <div class="problem-meta">
                    <span class="problem-reward"><strong>Reward:</strong> ${reward}</span>
                    ${contactHTML}
                    <span class="problem-posted"><strong>Posted:</strong> ${timestamp}</span>
                </div>
            </li>
        `;
      }).join("");

      container.insertAdjacentHTML("beforeend", `
          <section class="category-section">
              <h2>${cat}</h2>
              <ul class="problem-list">${listItems}</ul>
          </section>
      `);
    });
}
