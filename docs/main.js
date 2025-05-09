/* -------------------------------------------------------------
   CONFIG  –  Spreadsheet ID  +  exact tab name
   ------------------------------------------------------------- */
const sheetID = "15xe_BEFNm040nLtir2xN6uOYggvZen1duCsOoviyGlE"; // Your Sheet ID
const tabName = "Form_Responses";               // Your tab name
const jsonURL = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(tabName)}`;

/* Target element */
const contentContainer = document.getElementById("content");

/* -------------------------------------------------------------
   Helper function to linkify URLs in text
   ------------------------------------------------------------- */
function linkify(inputText) {
    let replacedText;

    // URLs starting with http://, https://, or ftp://
    const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // URLs starting with "www." (without // before it, or it'd re-link the already linked)
    const wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(wwwPattern, '$1<a href="http://$2" target="_blank" rel="noopener noreferrer">$2</a>');

    return replacedText;
}


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
  .then(renderProblems)
  .catch(displayError);

function displayError(err) {
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
        <li><strong>Column Names:</strong> Your Google Sheet (the "<code>${tabName}</code>" tab) MUST have these exact column headers in the first row (order matters for CSV):
          <ul>
            <li><code>Timestamp</code></li>
            <li><code>Category</code></li>
            <li><code>Reward Budget</code></li>
            <li><code>Description</code></li>
            <li><code>Contact (email)</code></li>
            <li><code>Problem Subject</code></li>
          </ul>
        </li>
        <li><strong>Data Exists:</strong> Ensure there are some rows of data under these columns.</li>
        <li><strong>Test Direct Link:</strong> Try opening this URL directly in your browser: <a href="${jsonURL}" target="_blank" rel="noopener noreferrer">${jsonURL}</a>.
            <ul><li>If it shows data (starts with '[' or '{'), the problem is likely in the rendering logic or HTML.</li>
                <li>If it shows an error (like "Requested entity was not found"), the issue is with the sheet access/publishing or names.</li>
            </ul>
        </li>
        <li>Check the browser's console (press F12, then "Console" tab) for more technical error messages.</li>
      </ol>
    `;
    contentContainer.innerHTML = `<div class="status-message error-message"><span class="error-message-text">${mainErrorText}</span>${checkListHTML}</div>`;
}

/* -------------------------------------------------------------
   Render helper
   ------------------------------------------------------------- */
function renderProblems(rows){
  if (!Array.isArray(rows)) {
    displayError(new Error("Data received from sheet is not in the expected array format."));
    console.error("Data received is not an array:", rows);
    return;
  }

  if (!rows.length){
    contentContainer.innerHTML = '<p class="status-message">No problems found in the sheet. Either the sheet is empty after the header row, or no problems have a \'Description\'.</p>';
    return;
  }

  const byCat = {};
  let validRowsFound = 0;
  rows.forEach(r => {
    if (typeof r !== 'object' || r === null || !r.Description || String(r.Description).trim() === "") {
        // console.warn("Skipping row due to missing or empty Description, or invalid row format:", r);
        return;
    }
    const cat = (r.Category || "Uncategorised").trim();
    (byCat[cat] ??= []).push(r);
    validRowsFound++;
  });

  if (validRowsFound === 0) {
    contentContainer.innerHTML = '<p class="status-message">No valid problems with descriptions were found. Ensure your \'Description\' column is populated and correctly named.</p>';
    return;
  }

  contentContainer.innerHTML = ""; // Clear loading/status message

  Object.keys(byCat)
    .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}))
    .forEach(cat=>{
      const listItems = byCat[cat].map(r => {
        const reward = r["Reward Budget"]?.trim() || "Not specified";
        let description = r.Description?.trim() || "No description provided.";
        description = linkify(description); // Linkify URLs

        const contactEmail = r["Contact (email)"]?.trim() || "";
        const problemSubject = r["Problem Subject"]?.trim() || "Untitled Problem";
        const timestampStr = r.Timestamp?.trim();
        let formattedTimestamp = "Not specified";

        if (timestampStr) {
            try {
                const dateObj = new Date(timestampStr);
                if (!isNaN(dateObj)) {
                     formattedTimestamp = dateObj.toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                } else {
                    // console.warn(`Could not parse timestamp: ${timestampStr}`);
                    formattedTimestamp = timestampStr;
                }
            } catch (e) {
                // console.warn(`Error parsing timestamp: ${timestampStr}`, e);
                formattedTimestamp = timestampStr;
            }
        }

        let contactHTML = "";
        if (contactEmail && contactEmail !== "-") {
            contactHTML = `
                <span class="problem-contact">
                    <strong>Contact:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a>
                </span>`;
        }

        return `
            <li class="problem-item">
                <div class="problem-item-header">
                    <span class="problem-category-badge">${r.Category || "Uncategorised"}</span>
                    <h4>${problemSubject}</h4>
                </div>
                <p class="problem-description">${description}</p> 
                <div class="problem-meta">
                    <span class="problem-reward"><strong>Reward:</strong> ${reward}</span>
                    ${contactHTML}
                    <span class="problem-posted"><strong>Posted:</strong> ${formattedTimestamp}</span>
                </div>
            </li>
        `;
      }).join("");

      const sectionHTML = `
          <section class="category-section">
              <h2>${cat}</h2>
              <div class="problem-list-container">
                  <ul class="problem-list">${listItems}</ul>
              </div>
          </section>
      `;
      contentContainer.insertAdjacentHTML("beforeend", sectionHTML);
    });

  makeCategoriesCollapsible();
}

function makeCategoriesCollapsible() {
    const categoryHeadings = contentContainer.querySelectorAll('.category-section h2');
    categoryHeadings.forEach(heading => {
        const problemListContainer = heading.nextElementSibling;

        heading.addEventListener('click', () => {
            const isExpanded = problemListContainer.classList.contains('expanded');
            
            if (isExpanded) {
                problemListContainer.classList.remove('expanded');
                heading.classList.remove('expanded');
            } else {
                problemListContainer.classList.add('expanded');
                heading.classList.add('expanded');
            }
        });
    });
}
