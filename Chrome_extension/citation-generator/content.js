// Wikipedia Citation Generator - by Suyash Dwivedi
// v2.5: Two new features:
//   (1) Search-engine results page guard: blocks Google/Bing/DDG/Yahoo/Brave/
//       Ecosia/Yandex results pages with a clear alert (Google Books excluded).
//   (2) Google Books citer-fallback rescue: when the Books API returns nothing
//       (common for old scans) and citer gives back "title=Google Books |
//       website=Google", we decode the real title from the /edition/ URL path
//       and rebuild a proper {{cite book}} — no extra API calls needed.

let button = null;
let isGenerating = false;

// ── Audio: created lazily on first click (avoids Chrome autoplay block) ────────
let audio = null;
function getAudio() {
  if (!audio) {
    audio = new Audio('https://suyashdwivedi.github.io/alert.mp3');
    audio.volume = 0.5;
  }
  return audio;
}

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

// ── Button & persistent position ──────────────────────────────────────────────
const POS_STORAGE_KEY = 'wikiCiteBtnPos';
const DRAG_THRESHOLD_PX = 5;
let suppressNextClick = false;

function clampPosition(left, top, el) {
  const rect = el.getBoundingClientRect();
  const width = rect.width || 40;
  const height = rect.height || 40;
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - height);

  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
}

function applyPosition(el, pos) {
  const clamped = clampPosition(pos.left, pos.top, el);
  el.style.left = `${clamped.left}px`;
  el.style.top = `${clamped.top}px`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
}

function loadSavedPosition(el) {
  if (!chrome?.storage?.local) return;
  chrome.storage.local.get([POS_STORAGE_KEY], (result) => {
    if (chrome.runtime?.lastError) return;
    const saved = result[POS_STORAGE_KEY];
    if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
      applyPosition(el, saved);
    }
  });
}

function savePosition(el) {
  if (!chrome?.storage?.local) return;
  const rect = el.getBoundingClientRect();
  const clamped = clampPosition(rect.left, rect.top, el);
  chrome.storage.local.set({ [POS_STORAGE_KEY]: clamped });
}

function attachDragBehavior(el) {
  let isPointerDown = false;
  let hasDragged = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || el.disabled) return;
    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    startY = e.clientY;

    const rect = el.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;

    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasDragged && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      hasDragged = true;
      el.classList.add('is-dragging');
    }

    if (hasDragged) {
      applyPosition(el, { left: originLeft + dx, top: originTop + dy });
    }
  });

  const finishDrag = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;

    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }

    if (hasDragged) {
      el.classList.remove('is-dragging');
      savePosition(el);
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
  };

  el.addEventListener('pointerup', finishDrag);
  el.addEventListener('pointercancel', finishDrag);

  window.addEventListener('resize', () => {
    if (!el.style.left || !el.style.top) return;
    applyPosition(el, {
      left: parseFloat(el.style.left),
      top: parseFloat(el.style.top),
    });
  });
}

function createButton() {
  if (button) return;
  button = document.createElement('button');
  button.id = 'wiki-cite-btn';
  button.innerHTML = '📝';
  button.title = 'Generate Wikipedia Citation (drag to move) - by Suyash Dwivedi';
  document.body.appendChild(button);

  loadSavedPosition(button);
  attachDragBehavior(button);

  button.addEventListener('click', (e) => {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    generateCitation();
  });
}

// ── Fetch via background service worker ───────────────────────────────────────
// IMPORTANT: we do NOT fetch() directly from this content script. Content-script
// fetches run in the host page's execution context and are therefore subject to
// that page's Content-Security-Policy (connect-src). Many news sites (e.g.
// bhaskar.com) set a strict CSP that silently blocks requests to
// citer.toolforge.org / googleapis.com / openlibrary.org even though our
// extension's own host_permissions allow it. The background service worker has
// no such restriction, so every external fetch is proxied through it instead.
async function fetchWithTimeout(url, ms = 8000, opts = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Request timed out'));
    }, ms);

    chrome.runtime.sendMessage(
      { action: 'fetchUrl', url, method: opts.method, headers: opts.headers, body: opts.body },
      (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res) {
          reject(new Error('No response from background script'));
          return;
        }
        if (res.error) {
          reject(new Error(res.error));
          return;
        }
        resolve({
          ok: res.ok,
          status: res.status,
          text: async () => res.text,
          json: async () => JSON.parse(res.text),
        });
      }
    );
  });
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

// ── [NEW] Search-engine results-page detection ────────────────────────────────
// Returns true only when the user is on a search RESULTS page.
// google.*/books is intentionally excluded — it is a real, citable source.
function isSearchResultsPage(url) {
  try {
    const u    = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // Google: has ?q= param but is NOT on the /books path
    if (/^google\.[a-z.]+$/.test(host))
      return u.searchParams.has('q') && !u.pathname.startsWith('/books');

    if (host === 'bing.com')
      return u.pathname.startsWith('/search');

    if (host === 'duckduckgo.com')
      return u.searchParams.has('q');

    if (host === 'search.yahoo.com')
      return true;

    if (host === 'search.brave.com')
      return u.pathname.startsWith('/search');

    if (host === 'ecosia.org')
      return u.pathname.startsWith('/search');

    if (host === 'yandex.com' || host === 'yandex.ru')
      return u.pathname.startsWith('/search');

    return false;
  } catch { return false; }
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

// ── [NEW] Decode real book title from Google Books /edition/ URL ──────────────
// Example: /books/edition/Sa%E1%B9%83skr%CC%A5ti_sandh%C4%81na/_3ZQAQAAMAAJ
//       => "Saṃskṛti Sandhāna"
// This works even for pre-1923 scans that the Books API returns no metadata for.
function titleFromGoogleBooksPath(url) {
  try {
    const m = new URL(url).pathname.match(/\/books\/edition\/([^/]+)\//);
    if (!m) return null;
    return decodeURIComponent(m[1]).replace(/_/g, ' ').trim();
  } catch { return null; }
}

// ── [NEW] Rescue a useless citer stub into a proper {{cite book}} ─────────────
// Called only when citer returned title=Google Books / website=Google.
function patchGoogleBooksCiteWeb(citation, pageUrl) {
  if (!citation.includes('{{cite web')) return citation;

  // Priority: title from URL path > title from document.title
  const urlTitle = titleFromGoogleBooksPath(pageUrl);
  const docTitle = document.title
    .replace(/\s*[-–—|]\s*Google Books\s*$/i, '').trim();
  const bestTitle = (urlTitle && urlTitle.length > 3) ? urlTitle
                  : (docTitle && docTitle.length > 3) ? docTitle
                  : null;

  if (!bestTitle) return citation;   // nothing we can improve

  let cite = citation
    .replace('{{cite web', '{{cite book')
    // Replace the wrong title
    .replace(/\|\s*title\s*=\s*Google Books\s*/gi, ` | title=${bestTitle} `)
    // Remove "website=Google" — invalid in {{cite book}}
    .replace(/\|\s*website\s*=\s*Google\s*/gi, ' ')
    // Remove the crawl/index date — it is NOT the publication date
    .replace(/\|\s*date\s*=[^|}\n]*/g, '')
    // Tidy up artifacts
    .replace(/\|\s*\|/g, '|')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Record where the book was accessed
  if (!cite.includes('via='))
    cite = cite.replace('}}', ' | via=Google Books}}');

  return cite;
}

// ── Open Library author fallback ──────────────────────────────────────────────
async function fetchOpenLibraryAuthors(title, isbn) {
  try {
    const query = isbn
      ? `isbn=${encodeURIComponent(isbn)}`
      : `title=${encodeURIComponent(title.slice(0, 60))}&limit=1`;
    const res = await fetchWithTimeout(
      `https://openlibrary.org/search.json?${query}&fields=author_name`, 6000
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs?.[0]?.author_name || [];
  } catch { return []; }
}

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

// ── Build {{cite book}} via Google Books API ──────────────────────────────────
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
  } catch { return null; }

  const info = data.volumeInfo || {};
  if (!info.title) return null;

  const today      = new Date();
  const accessDate = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const title      = info.title;
  const subtitle   = info.subtitle ? ': ' + info.subtitle : '';
  const publisher  = info.publisher || '';
  const year       = info.publishedDate ? info.publishedDate.slice(0, 4) : '';
  const isbn       = (info.industryIdentifiers || [])
                       .find(x => x.type === 'ISBN_13' || x.type === 'ISBN_10');
  const isbnStr    = isbn ? ` | isbn=${isbn.identifier}` : '';
  const page       = getPageFromUrl(pageUrl);
  const pageStr    = page ? ` | page=${page}` : '';

  let authors = info.authors || [];
  if (authors.length === 0)
    authors = await fetchOpenLibraryAuthors(title, isbn?.identifier || '');
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
// IMPORTANT: citer's server deliberately ignores GET query params as an
// anti-bot measure (see its app.py: "Deflect GET queries. Force user_input to
// empty string so the server only delivers the shell page, leaving query
// processing to client-side JS."). A GET to /?user_input=... always returns
// the bare empty form, never a citation. citer's own front-end JS instead
// issues a POST with a JSON body and an X-Gateway-Validation header once the
// shell page loads. We replicate exactly that request here.
async function fetchFromCiter(pageUrl) {
  const requestUrl = 'https://citer.toolforge.org/';
  const response = await fetchWithTimeout(requestUrl, 8000, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Validation': 'CITER_IS_NOT_INTENDED_FOR_BOTS',
    },
    body: JSON.stringify({
      dateformat: '%Y-%m-%d',
      pipeformat: ' | ',
      input_type: '',
      user_input: pageUrl,
    }),
  });
  const bodyText = await response.text();

  if (!response.ok) {
    console.error('[WikiCite] citer returned non-OK status', response.status, 'for', pageUrl);
    console.error('[WikiCite] citer response snippet:', bodyText.slice(0, 500));
    throw new Error(`citer returned HTTP ${response.status}`);
  }

  // Successful POST responses are JSON: [sfn, cit, ref]
  let raw = null;
  try {
    const parsed = JSON.parse(bodyText);
    if (Array.isArray(parsed) && typeof parsed[1] === 'string' && parsed[1].includes('{{cite')) {
      raw = parsed[1].trim();
    }
  } catch {
    // Not JSON (unexpected format) — fall back to the old HTML-scrape method
    raw = extractCitation(bodyText);
  }

  if (!raw) {
    console.error('[WikiCite] Could not find a citation in citer response for', pageUrl);
    console.error('[WikiCite] citer response snippet:', bodyText.slice(0, 500));
    throw new Error('Could not extract citation from citer.');
  }
  let citation = cleanCiterCitation(raw);
  citation = formatDates(citation);

  // [NEW] If citer gave back a useless Google Books stub, rescue it
  if (isGoogleBooksUrl(pageUrl) &&
      (citation.includes('title=Google Books') || citation.includes('website=Google'))) {
    citation = patchGoogleBooksCiteWeb(citation, pageUrl);
  }

  return citation;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function generateCitation() {
  if (isGenerating) return;
  isGenerating = true;

  const originalText = button.innerHTML;
  button.innerHTML   = '⏳';
  button.disabled    = true;

  try {
    const pageUrl = window.location.href;

    // [NEW] Step 0 — block search-engine results pages
    if (isSearchResultsPage(pageUrl)) {
      button.innerHTML = '✗';
      isGenerating     = false;
      button.disabled  = false;
      setTimeout(() => {
        alert(
          '⚠️ You are on a search results page.\n\n' +
          'Search results cannot be cited — please open the actual book, ' +
          'article, or website you want to cite, then click the button again.'
        );
        button.innerHTML = originalText;
      }, 150);
      return;
    }

    // Step 1 — cache check (bypass stale cite web entries for Google Books)
    let citation = await getCached(pageUrl);
    if (citation && isGoogleBooksUrl(pageUrl) && citation.includes('{{cite web'))
      citation = null;

    if (!citation) {
      if (isGoogleBooksUrl(pageUrl)) {
        // Step 2a — Google Books: API first, patched citer as fallback
        const [citebook] = await Promise.all([
          buildCiteBook(pageUrl),
          new Promise(resolve => chrome.runtime.sendMessage({ action: 'getEditTabs' }, resolve))
        ]);
        citation = citebook || await fetchFromCiter(pageUrl);
      } else {
        // Step 2b — regular page
        const [citerResult] = await Promise.all([
          fetchFromCiter(pageUrl),
          new Promise(resolve => chrome.runtime.sendMessage({ action: 'getEditTabs' }, resolve))
        ]);
        citation = citerResult;
      }
      await setCache(pageUrl, citation);
    }

    const refName      = 'm' + Math.floor(Math.random() * 1000);
    const fullCitation = `<ref name="${refName}">${citation}</ref>`;

    // Step 3 — clipboard (with execCommand fallback) then audio
    let copied = false;

    // Primary: modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(fullCitation);
        copied = true;
      } catch (e) {
        console.warn('Clipboard API failed, trying execCommand fallback:', e);
      }
    }

    // Fallback: old execCommand (works even without clipboard permission)
    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = fullCitation;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) {
        console.warn('execCommand fallback also failed:', e2);
      }
    }

    if (!copied) {
      // Last resort: show the citation in a prompt so user can copy manually
      prompt('Could not copy automatically — please copy manually (Ctrl+A, Ctrl+C):', fullCitation);
    }

    // Play audio after copy — never let it block or hide copy failure
    getAudio().play().catch(() => {});

    handleEditSummary();
    button.innerHTML = copied ? '✓' : '⚠';

  } catch (err) {
    console.error('[WikiCite] Citation error for', window.location.href, ':', err);
    button.innerHTML = '✗';
  } finally {
    setTimeout(() => {
      button.innerHTML = originalText;
      isGenerating     = false;
      button.disabled  = false;
    }, 2000);
  }
}

createButton();