/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "15xe_BEFNm040nLtir2xN6uOYggvZen1duCsOoviyGlE"; // <<< YOUR NEW SHEET ID
const tabName = "Form_Responses";               // Make sure your tab is named this!
const jsonURL = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(tabName)}`;

/* Target element */
const container = document.getElementById("content");
container.textContent = "Loading problems…";

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
              errorDetail += ` Response: ${text.substring(0, 200)}`;
            }
          } catch (e) {
            errorDetail += ` Response: ${text.substring(0, 200)}`;
          }
        }
        if (response.status === 400 || (response.status === 200 && text.includes("Requested entity was not found"))) {
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
    let userMessage = `Could not load problems. Error: ${err.message}`;
    userMessage += `
      <br><br>Please check the following for <strong>Sheet ID: ${sheetID}</strong>:
      <ol>
        <li><strong>Publish to Web Settings:</strong>
          <ul>
            <li>Open your Google Sheet: <a href="https://docs.google.com/spreadsheets/d/${sheetID}/edit" target="_blank">Click here to open sheet</a></li>
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
            <li><code>Description</code></li>
            <li><code>Category</code></li>
            <li><code>Reward Budget</code></li>
          </ul>
          (Case and spacing matter!)
        </li>
        <li><strong>Data Exists:</strong> Ensure there are some rows of data under these columns.</li>
        <li><strong>Test Direct Link:</strong> Try opening this URL directly in your browser: <a href="${jsonURL}" target="_blank">${jsonURL}</a>.
            <ul><li>If it shows data (starts with '[' or '{'), the problem is likely in the rendering or HTML.</li>
                <li>If it shows an error (like "Requested entity was not found"), the issue is with the sheet access/publishing or names.</li>
            </ul>
        </li>
        <li>Check the browser's console (press F12, then "Console" tab) for more technical error messages.</li>
      </ol>
    `;
    container.innerHTML = userMessage;
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
    container.textContent = errorMessage;
    return;
  }

  if (!rows.length){
    container.textContent = "No problems found in the sheet. Either the sheet is empty after the header row, or no rows have a 'Description' value.";
    return;
  }

  /* Group by Category column */
  const byCat = {};
  let validRowsFound = 0;
  rows.forEach(r => {
    if (typeof r !== 'object' || r === null || !r.Description || String(r.Description).trim() === "") {
        console.warn("Skipping row due to missing or empty Description, or invalid row format:", r);
        return;
    }
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
    validRowsFound++;
  });

  if (validRowsFound === 0) {
    container.textContent = "No problems with descriptions were found. Make sure your 'Description' column is populated and correctly named in the sheet.";
    return;
  }

  container.innerHTML = "";
  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const list = byCat[cat].map(r=>{
        const reward = r["Reward Budget"] || "-";
        const descriptionText = String(r.Description);
        return `<li>${descriptionText.slice(0,60)}${descriptionText.length > 60 ? '...' : ''} — <em>${reward}</em></li>`;
      }).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
