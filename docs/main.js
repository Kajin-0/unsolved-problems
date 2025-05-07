/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo";
const tabName = "Form_Responses";               // <<< UPDATED to match your new tab name
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
      // Attempt to get more specific error text from the response
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
        // Add a specific check for 400 error from opensheet.elk.sh
        if (response.status === 400) {
            errorDetail += ` A 400 error from opensheet.elk.sh often means the Sheet ID or Tab Name is incorrect, or the sheet is not correctly "Published to web" (as a 'Web page', not CSV, with 'Automatically republish' checked).`;
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
      <br><br>Please check the following:
      <ol>
        <li>The Google Sheet (ID: <code>${sheetID}</code>) is correctly published to the web:
          <ul>
            <li>Go to your Google Sheet.</li>
            <li>Click <strong>File → Share → Publish to web</strong>.</li>
            <li>In the dialog, under "Link", ensure your sheet tab named "<strong>${tabName}</strong>" is selected.</li>
            <li>Under "Embed", ensure "<strong>Web page</strong>" is selected (NOT CSV or any other format).</li>
            <li><strong>Crucially, ensure "Automatically republish when changes are made" is CHECKED.</strong></li>
            <li>Click "Publish" (or "Republish") and confirm. Wait a minute for changes to propagate.</li>
          </ul>
        </li>
        <li>The tab name "<code>${tabName}</code>" in <code>main.js</code> is an <strong>exact match</strong> (case-sensitive) for the tab name in your Google Sheet.</li>
        <li>Your Google Sheet (the "<code>${tabName}</code>" tab) has columns named <em>exactly</em>:
          <ul>
            <li><code>Description</code></li>
            <li><code>Category</code></li>
            <li><code>Reward Budget</code></li>
          </ul>
          (Case and spacing matter! These are what the script expects.)
        </li>
        <li>The Google Sheet is not empty and has some data in these columns.</li>
        <li>Check the browser's console (press F12, then go to the "Console" tab) for more technical error messages.</li>
        <li>Try opening this URL directly in your browser: <a href="${jsonURL}" target="_blank">${jsonURL}</a>. If it shows an error, the issue is with the sheet access/publishing. If it shows data, the problem might be in the rendering code.</li>
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
        errorMessage += ` Server message: ${rows.error}. This often means the sheet ID or tab name is wrong, or the sheet is not published correctly.`;
    }
    container.textContent = errorMessage;
    return;
  }

  if (!rows.length){
    container.textContent = "No problems found in the sheet. Either the sheet is empty after the header row, or no rows have a 'Description'.";
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
    container.textContent = "No problems with descriptions were found in the sheet. Make sure your 'Description' column is populated and correctly named in the sheet (e.g., 'Description', not 'Problem description').";
    return;
  }

  container.innerHTML = "";
  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const list = byCat[cat].map(r=>{
        const reward = r["Reward Budget"] || "-"; // Ensure this column name matches your sheet
        const descriptionText = String(r.Description);
        return `<li>${descriptionText.slice(0,60)}${descriptionText.length > 60 ? '...' : ''} — <em>${reward}</em></li>`;
      }).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
