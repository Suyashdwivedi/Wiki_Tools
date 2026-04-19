// Wikipedia Citation Generator - by Suyash Dwivedi
// v2.1: multilingual edit summary, auto-detected from Wikipedia language

let button = null;
let isGenerating = false;

function createButton() {
  if (button) return;
  button = document.createElement('button');
  button.id = 'wiki-cite-btn';
  button.innerHTML = '📝';
  button.title = 'Generate Wikipedia Citation - by Suyash Dwivedi';
  document.body.appendChild(button);
  button.addEventListener('click', generateCitation);
}

// ── Fetch with timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Extract citation via DOMParser ────────────────────────────────────────────
function extractCitation(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const ta of doc.querySelectorAll('textarea')) {
    const c = ta.value || ta.textContent;
    if (c.includes('{{cite web')) return c;
  }
  for (const el of doc.querySelectorAll('pre, code, div')) {
    const c = el.value || el.textContent;
    if (c.includes('{{cite web')) return c;
  }
  for (const line of doc.body.textContent.split('\n')) {
    if (line.includes('{{cite web')) return line.trim();
  }
  return null;
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDates(citation) {
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return citation.replace(
    /(date|access-date)=(\d{4})-(\d{2})-(\d{2})/g,
    (_, key, y, mo, d) => `${key}=${parseInt(d)} ${months[parseInt(mo) - 1]} ${y}`
  );
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Tab picker UI ─────────────────────────────────────────────────────────────
function showTabPicker(editTabs) {
  document.getElementById('wiki-cite-picker')?.remove();

  const picker = document.createElement('div');
  picker.id = 'wiki-cite-picker';
  picker.innerHTML = `
    <div class="wcp-header">
      <span>📋 Which Wikipedia tab?</span>
      <button class="wcp-close">✕</button>
    </div>
    <div class="wcp-hint">Summary will be filled in that tab's language:</div>
    <ul class="wcp-list">
      ${editTabs.map((tab, i) => `
        <li>
          <button class="wcp-tab-btn" data-index="${i}">
            <span class="wcp-lang">${escapeHtml(tab.lang)}</span>
            <span class="wcp-info">
              <span class="wcp-title">${escapeHtml(tab.title.replace(/ - Edit source.*| - Wikipedia.*/i,'').trim())}</span>
              <span class="wcp-summary">"${escapeHtml(tab.summary)}"</span>
            </span>
            <span class="wcp-arrow">→</span>
          </button>
        </li>`).join('')}
    </ul>`;

  document.body.appendChild(picker);
  picker.querySelector('.wcp-close').addEventListener('click', () => picker.remove());

  picker.querySelectorAll('.wcp-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = editTabs[+btn.dataset.index];
      chrome.runtime.sendMessage({ action: 'fillSummaryInTab', tabId: tab.id });
      btn.querySelector('.wcp-arrow').textContent = '✓';
      btn.disabled = true;
      setTimeout(() => picker.remove(), 1000);
    });
  });

  setTimeout(() => picker.remove(), 30000);
}

// ── Edit summary — 3 cases ────────────────────────────────────────────────────
function handleEditSummary() {
  // Case 1: already on a Wikipedia edit page → background fills this tab directly
  // (background detects language from sender tab's URL via fillSenderTab)
  if (window.location.hostname.includes('wikipedia.org') &&
      window.location.search.includes('action=edit')) {
    chrome.runtime.sendMessage({ action: 'fillSenderTab' });
    return;
  }

  // Cases 2 & 3: on an external site, ask background for open edit tabs
  chrome.runtime.sendMessage({ action: 'getEditTabs' }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const { editTabs } = res;

    if (editTabs.length === 0) return;           // Case 2: none open → skip

    if (editTabs.length === 1) {                 // Case 3a: one tab → auto-fill
      chrome.runtime.sendMessage({ action: 'fillSummaryInTab', tabId: editTabs[0].id });
      return;
    }

    showTabPicker(editTabs);                     // Case 3b: many tabs → picker
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function generateCitation() {
  if (isGenerating) return;
  isGenerating = true;

  const originalText = button.innerHTML;
  button.innerHTML = '⏳';
  button.disabled = true;

  try {
    const encodedUrl = encodeURIComponent(window.location.href);
    const response = await fetchWithTimeout(
      `https://citer.toolforge.org/?user_input=${encodedUrl}`
    );
    const html = await response.text();

    let citation = extractCitation(html);
    if (!citation) throw new Error('Could not extract citation.');

    citation = citation.trim();
    for (const line of citation.split('\n')) {
      if (line.includes('{{cite web')) { citation = line.trim(); break; }
    }
    citation = citation.replace(/^\*\s*/, '').trim();
    citation = formatDates(citation);

    const refName = 'm' + Math.floor(Math.random() * 1000);
    citation = `<ref name="${refName}">${citation}</ref>`;

    await navigator.clipboard.writeText(citation);

    // Sound
    try {
      const audio = new Audio('https://suyashdwivedi.github.io/alert.mp3');
      audio.volume = 0.5;
      await audio.play();
      console.log('Sound played successfully!');
    } catch (e) {
      console.log('Could not play sound:', e);
    }

    handleEditSummary();

    button.innerHTML = '✓';

  } catch (err) {
    console.error('Citation error:', err);
    button.innerHTML = '✗';
  } finally {
    setTimeout(() => {
      button.innerHTML = originalText;
      isGenerating = false;
      button.disabled = false;
    }, 2000);
  }
}

createButton();
