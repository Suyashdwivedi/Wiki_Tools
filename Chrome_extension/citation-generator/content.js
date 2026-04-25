// Wikipedia Citation Generator - by Suyash Dwivedi
// v2.3: Google Books → {{cite book}} via API, with citer fallback + perf optimisations

let button = null;
let isGenerating = false;

// ── Pre-load audio ONCE at startup ────────────────────────────────────────────
const audio = new Audio('https://suyashdwivedi.github.io/alert.mp3');
audio.volume = 0.5;
audio.preload = 'auto';

// ── Citation cache ────────────────────────────────────────────────────────────
const memCache = new Map();

async function getCached(url) {
  if (memCache.has(url)) return memCache.get(url);
  return new Promise(resolve => {
    chrome.storage.local.get(url, result => resolve(result[url] || null));
  });
}

async function setCache(url, citation) {
  memCache.set(url, citation);
  chrome.storage.local.get(null, items => {
    const keys = Object.keys(items);
    if (keys.length >= 200) chrome.storage.local.remove(keys[0]);
    chrome.storage.local.set({ [url]: citation });
  });
}

// ── Button ────────────────────────────────────────────────────────────────────
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
async function fetchWithTimeout(url, ms = 8000) {
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

// ── Extract {{cite web}} from citer HTML ──────────────────────────────────────
function extractCitation(html) {
  for (const line of html.split('\n')) {
    if (line.includes('{{cite web')) return line.trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const el of doc.querySelectorAll('textarea, pre, code, div')) {
    const c = el.value || el.textContent;
    if (c && c.includes('{{cite web')) return c.trim();
  }
  return null;
}

// ── Clean up raw citer output ─────────────────────────────────────────────────
function cleanCiterCitation(raw) {
  let citation = raw;
  for (const line of raw.split('\n')) {
    if (line.includes('{{cite')) { citation = line.trim(); break; }
  }
  return citation.replace(/^\*\s*/, '').trim();
}

// ── Date formatter ────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDates(citation) {
  return citation.replace(
    /(date|access-date)=(\d{4})-(\d{2})-(\d{2})/g,
    (_, key, y, mo, d) => `${key}=${parseInt(d)} ${MONTHS[parseInt(mo) - 1]} ${y}`
  );
}

// ── Google Books helpers ──────────────────────────────────────────────────────
function isGoogleBooksUrl(url) {
  return /\bgoogle\.[a-z.]+\/books\b/.test(url) || url.includes('books.google.');
}

function getGoogleBooksVolumeId(url) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('id');
    if (id) return id;
    const m = u.pathname.match(/\/books\/edition\/[^/]+\/([A-Za-z0-9_-]+)/);
    if (m) return m[1];
  } catch { /* fall through */ }
  return null;
}

function getPageFromUrl(url) {
  try {
    const pg = new URL(url).searchParams.get('pg');
    if (!pg) return null;
    const m = pg.match(/[A-Z]+(\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

// Try Open Library search for authors when Google Books has none
async function fetchOpenLibraryAuthors(title, isbn) {
  try {
    // Prefer ISBN lookup (precise); fall back to title search
    const query = isbn
      ? `isbn=${encodeURIComponent(isbn)}`
      : `title=${encodeURIComponent(title.slice(0, 60))}&limit=1`;
    const res = await fetchWithTimeout(
      `https://openlibrary.org/search.json?${query}&fields=author_name`, 6000
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs?.[0]?.author_name || [];
  } catch {
    return [];
  }
}

// Format an author list into cite book author params
function formatAuthors(authors) {
  if (!authors || authors.length === 0) return '';
  const list = authors.length > 4 ? [...authors.slice(0, 4), 'et al.'] : [...authors];
  const [first, ...rest] = list;
  const parts = first.trim().split(/\s+/);
  const lastName = parts.pop();
  const firstName = parts.join(' ');
  let part = firstName
    ? ` | last=${lastName} | first=${firstName}`
    : ` | author=${lastName}`;
  rest.forEach((a, i) => { part += ` | author${i + 2}=${a}`; });
  return part;
}

// Returns {{cite book}} string, or null if API blocked/incomplete (caller falls back)
async function buildCiteBook(pageUrl) {
  const volumeId = getGoogleBooksVolumeId(pageUrl);
  if (!volumeId) return null;

  let data;
  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/books/v1/volumes/${volumeId}`, 8000
    );
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  const info = data.volumeInfo || {};
  if (!info.title) return null;

  const today = new Date();
  const accessDate = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  const title     = info.title;
  const subtitle  = info.subtitle  ? ': ' + info.subtitle  : '';
  const publisher = info.publisher || '';
  const year      = info.publishedDate ? info.publishedDate.slice(0, 4) : '';
  const isbn      = (info.industryIdentifiers || [])
                      .find(x => x.type === 'ISBN_13' || x.type === 'ISBN_10');
  const isbnStr   = isbn ? ` | isbn=${isbn.identifier}` : '';
  const page      = getPageFromUrl(pageUrl);
  const pageStr   = page ? ` | page=${page}` : '';

  // Authors: use Google Books data if present; otherwise ask Open Library
  let authors = info.authors || [];
  if (authors.length === 0) {
    authors = await fetchOpenLibraryAuthors(title, isbn?.identifier || '');
  }
  const authorPart = formatAuthors(authors);

  return `{{cite book${authorPart} | title=${title}${subtitle}` +
         ` | publisher=${publisher} | year=${year}${isbnStr}${pageStr}` +
         ` | url=${pageUrl} | access-date=${accessDate}}}`;
}

// ── Tab picker ────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

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

// ── Edit summary ──────────────────────────────────────────────────────────────
function handleEditSummary() {
  if (window.location.hostname.includes('wikipedia.org') &&
      window.location.search.includes('action=edit')) {
    chrome.runtime.sendMessage({ action: 'fillSenderTab' });
    return;
  }
  chrome.runtime.sendMessage({ action: 'getEditTabs' }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const { editTabs } = res;
    if (editTabs.length === 0) return;
    if (editTabs.length === 1) {
      chrome.runtime.sendMessage({ action: 'fillSummaryInTab', tabId: editTabs[0].id });
      return;
    }
    showTabPicker(editTabs);
  });
}

// ── Fetch from citer.toolforge.org ────────────────────────────────────────────
async function fetchFromCiter(pageUrl) {
  const response = await fetchWithTimeout(
    `https://citer.toolforge.org/?user_input=${encodeURIComponent(pageUrl)}`
  );
  const html = await response.text();
  const raw = extractCitation(html);
  if (!raw) throw new Error('Could not extract citation from citer.');
  const citation = cleanCiterCitation(raw);
  return formatDates(citation);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function generateCitation() {
  if (isGenerating) return;
  isGenerating = true;

  const originalText = button.innerHTML;
  button.innerHTML = '⏳';
  button.disabled = true;

  try {
    const pageUrl = window.location.href;

    // 1. Cache check (bypass stale cite web entries for Google Books)
    let citation = await getCached(pageUrl);
    if (citation && isGoogleBooksUrl(pageUrl) && citation.includes('{{cite web')) {
      citation = null;
    }

    if (!citation) {
      if (isGoogleBooksUrl(pageUrl)) {
        // 2a. Try Google Books API + pre-warm tab list in parallel
        const [citebook] = await Promise.all([
          buildCiteBook(pageUrl),
          new Promise(resolve => chrome.runtime.sendMessage({ action: 'getEditTabs' }, resolve))
        ]);
        citation = citebook || await fetchFromCiter(pageUrl);
      } else {
        // 2b. Regular page: citer + tab pre-warm in parallel
        const [citerResult] = await Promise.all([
          fetchFromCiter(pageUrl),
          new Promise(resolve => chrome.runtime.sendMessage({ action: 'getEditTabs' }, resolve))
        ]);
        citation = citerResult;
      }

      await setCache(pageUrl, citation);
    }

    const refName = 'm' + Math.floor(Math.random() * 1000);
    const fullCitation = `<ref name="${refName}">${citation}</ref>`;

    // 3. Clipboard + audio together
    await Promise.allSettled([
      navigator.clipboard.writeText(fullCitation),
      audio.play().catch(e => console.log('Sound skipped:', e)),
    ]);

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