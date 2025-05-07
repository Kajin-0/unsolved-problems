/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "1vRgI5m7L1L0mj8qV8ZczeM107XlGN2gojbQx17dQGB1dS5dJFIf13Xr1cuIw0xY9O30C9WmXBsBsESo";
const tabName = "Form_Responses1";               // exact tab label (with underscore)
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
          // opensheet.elk.sh might return JSON error messages
          try {
            const jsonError = JSON.parse(text);
            if (jsonError && jsonError.error) {
              errorDetail += ` Message: ${jsonError.error}`;
            } else {
              errorDetail += ` Response: ${text.substring(0, 200)}`; // Show part of non-JSON response
            }
          } catch (e) {
            errorDetail += ` Response: ${text.substring(0, 200)}`;
          }
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
            <li>In the dialog, under "Link", ensure your sheet (e.g., "Form_Responses1") or "Entire Document" is selected.</li>
            <li>Under "Embed", ensure "Web page" is selected.</li>
            <li><strong>Crucially, ensure "Automatically republish when changes are made" is CHECKED.</strong></li>
            <li>Click "Publish" and confirm.</li>
          </ul>
        </li>
        <li>The tab name "<code>${tabName}</code>" in <code>main.js</code> is an <strong>exact match</strong> (case-sensitive, including any spaces or underscores) for the tab name in your Google Sheet.</li>
        <li>Your Google Sheet (the "<code>${tabName}</code>" tab) has columns named <em>exactly</em>:
          <ul>
            <li><code>Description</code></li>
            <li><code>Category</code></li>
            <li><code>Reward Budget</code></li>
          </ul>
          (Case and spacing matter!)
        </li>
        <li>The Google Sheet is not empty and has some data in these columns.</li>
        <li>Check the browser's console (press F12, then go to the "Console" tab) for more technical error messages.</li>
      </ol>
    `;
    container.innerHTML = userMessage; // Use innerHTML to render the list
  });

/* -------------------------------------------------------------
   Render helper
   ------------------------------------------------------------- */
function render(rows){
  // Check if opensheet.elk.sh returned an error object instead of an array
  if (!Array.isArray(rows)) {
    console.error("Data received is not an array:", rows);
    let errorMessage = "Received invalid data format from the sheet.";
    if (typeof rows === 'object' && rows !== null && rows.error) {
        errorMessage += ` Server message: ${rows.error}. This often means the sheet ID or tab name is wrong, or the sheet is not published.`;
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
    // Ensure r is an object and has a Description property
    if (typeof r !== 'object' || r === null || !r.Description || String(r.Description).trim() === "") {
        console.warn("Skipping row due to missing or empty Description, or invalid row format:", r);
        return; // skip blank rows or malformed rows
    }
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
    validRowsFound++;
  });

  if (validRowsFound === 0) {
    container.textContent = "No problems with descriptions were found in the sheet. Make sure your 'Description' column is populated and correctly named.";
    return;
  }

  container.innerHTML = ""; // Clear loading message
  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const list = byCat[cat].map(r=>{
        const reward = r["Reward Budget"] || "-";
        // Ensure description is a string before slicing
        const descriptionText = String(r.Description);
        return `<li>${descriptionText.slice(0,60)} ${descriptionText.length > 60 ? '...' : ''} — <em>${reward}</em></li>`;
      }).join("");
      container.insertAdjacentHTML("beforeend", `<h3>${cat}</h3><ul>${list}</ul>`);
    });
}
