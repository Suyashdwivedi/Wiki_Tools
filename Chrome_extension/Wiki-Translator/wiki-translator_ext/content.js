// Wiki Translator v5 – content script

let popup = null;
let floatBtn = null;
let currentLang = null;      // wiki page language (auto-detected)
let extraLang = null;        // third tab: user-chosen extra language
let currentTab = "wiki";     // "en" | "wiki" | "extra"

// ── Language map (wiki subdomain → translate code) ────────────────────────────
const WIKI_LANGS = {
  ne:{code:"ne",name:"Nepali",native:"नेपाली",flag:"🇳🇵"},
  hi:{code:"hi",name:"Hindi",native:"हिन्दी",flag:"🇮🇳"},
  mr:{code:"mr",name:"Marathi",native:"मराठी",flag:"🇮🇳"},
  bn:{code:"bn",name:"Bengali",native:"বাংলা",flag:"🇧🇩"},
  gu:{code:"gu",name:"Gujarati",native:"ગુજરાતી",flag:"🇮🇳"},
  ta:{code:"ta",name:"Tamil",native:"தமிழ்",flag:"🇮🇳"},
  te:{code:"te",name:"Telugu",native:"తెలుగు",flag:"🇮🇳"},
  kn:{code:"kn",name:"Kannada",native:"ಕನ್ನಡ",flag:"🇮🇳"},
  ml:{code:"ml",name:"Malayalam",native:"മലയാളം",flag:"🇮🇳"},
  pa:{code:"pa",name:"Punjabi",native:"ਪੰਜਾਬੀ",flag:"🇮🇳"},
  ur:{code:"ur",name:"Urdu",native:"اردو",flag:"🇵🇰"},
  sa:{code:"sa",name:"Sanskrit",native:"संस्कृतम्",flag:"🇮🇳"},
  or:{code:"or",name:"Odia",native:"ଓଡ଼ିଆ",flag:"🇮🇳"},
  as:{code:"as",name:"Assamese",native:"অসমীয়া",flag:"🇮🇳"},
  mai:{code:"mai",name:"Maithili",native:"मैथिली",flag:"🇮🇳"},
  bho:{code:"bho",name:"Bhojpuri",native:"भोजपुरी",flag:"🇮🇳"},
  doi:{code:"doi",name:"Dogri",native:"डोगरी",flag:"🇮🇳"},
  sd:{code:"sd",name:"Sindhi",native:"سنڌي",flag:"🇵🇰"},
  si:{code:"si",name:"Sinhala",native:"සිංහල",flag:"🇱🇰"},
  bo:{code:"bo",name:"Tibetan",native:"བོད་ཡིག",flag:"🇨🇳"},
  ar:{code:"ar",name:"Arabic",native:"العربية",flag:"🇸🇦"},
  fa:{code:"fa",name:"Persian",native:"فارسی",flag:"🇮🇷"},
  iw:{code:"iw",name:"Hebrew",native:"עברית",flag:"🇮🇱"},
  hy:{code:"hy",name:"Armenian",native:"Հայերեն",flag:"🇦🇲"},
  ka:{code:"ka",name:"Georgian",native:"ქართული",flag:"🇬🇪"},
  az:{code:"az",name:"Azerbaijani",native:"Azərbaycan",flag:"🇦🇿"},
  kk:{code:"kk",name:"Kazakh",native:"Қазақша",flag:"🇰🇿"},
  ky:{code:"ky",name:"Kyrgyz",native:"Кыргызча",flag:"🇰🇬"},
  uz:{code:"uz",name:"Uzbek",native:"Oʻzbek",flag:"🇺🇿"},
  tk:{code:"tk",name:"Turkmen",native:"Türkmen",flag:"🇹🇲"},
  tg:{code:"tg",name:"Tajik",native:"Тоҷикӣ",flag:"🇹🇯"},
  mn:{code:"mn",name:"Mongolian",native:"Монгол",flag:"🇲🇳"},
  ru:{code:"ru",name:"Russian",native:"Русский",flag:"🇷🇺"},
  uk:{code:"uk",name:"Ukrainian",native:"Українська",flag:"🇺🇦"},
  fr:{code:"fr",name:"French",native:"Français",flag:"🇫🇷"},
  de:{code:"de",name:"German",native:"Deutsch",flag:"🇩🇪"},
  es:{code:"es",name:"Spanish",native:"Español",flag:"🇪🇸"},
  it:{code:"it",name:"Italian",native:"Italiano",flag:"🇮🇹"},
  pt:{code:"pt",name:"Portuguese",native:"Português",flag:"🇧🇷"},
  ja:{code:"ja",name:"Japanese",native:"日本語",flag:"🇯🇵"},
  ko:{code:"ko",name:"Korean",native:"한국어",flag:"🇰🇷"},
  "zh-CN":{code:"zh-CN",name:"Chinese (S)",native:"中文(简)",flag:"🇨🇳"},
  zh:{code:"zh-CN",name:"Chinese (S)",native:"中文(简)",flag:"🇨🇳"},
  "zh-TW":{code:"zh-TW",name:"Chinese (T)",native:"中文(繁)",flag:"🇹🇼"},
  vi:{code:"vi",name:"Vietnamese",native:"Tiếng Việt",flag:"🇻🇳"},
  th:{code:"th",name:"Thai",native:"ภาษาไทย",flag:"🇹🇭"},
  id:{code:"id",name:"Indonesian",native:"Bahasa Indonesia",flag:"🇮🇩"},
  ms:{code:"ms",name:"Malay",native:"Bahasa Melayu",flag:"🇲🇾"},
  sw:{code:"sw",name:"Swahili",native:"Kiswahili",flag:"🇰🇪"},
  am:{code:"am",name:"Amharic",native:"አማርኛ",flag:"🇪🇹"},
  yo:{code:"yo",name:"Yoruba",native:"Yorùbá",flag:"🇳🇬"},
  ha:{code:"ha",name:"Hausa",native:"Hausa",flag:"🇳🇬"},
  zu:{code:"zu",name:"Zulu",native:"isiZulu",flag:"🇿🇦"},
  tr:{code:"tr",name:"Turkish",native:"Türkçe",flag:"🇹🇷"},
  pl:{code:"pl",name:"Polish",native:"Polski",flag:"🇵🇱"},
  nl:{code:"nl",name:"Dutch",native:"Nederlands",flag:"🇳🇱"},
  sv:{code:"sv",name:"Swedish",native:"Svenska",flag:"🇸🇪"},
  no:{code:"no",name:"Norwegian",native:"Norsk",flag:"🇳🇴"},
  da:{code:"da",name:"Danish",native:"Dansk",flag:"🇩🇰"},
  fi:{code:"fi",name:"Finnish",native:"Suomi",flag:"🇫🇮"},
  el:{code:"el",name:"Greek",native:"Ελληνικά",flag:"🇬🇷"},
  cs:{code:"cs",name:"Czech",native:"Čeština",flag:"🇨🇿"},
  sk:{code:"sk",name:"Slovak",native:"Slovenčina",flag:"🇸🇰"},
  hu:{code:"hu",name:"Hungarian",native:"Magyar",flag:"🇭🇺"},
  ro:{code:"ro",name:"Romanian",native:"Română",flag:"🇷🇴"},
  bg:{code:"bg",name:"Bulgarian",native:"Български",flag:"🇧🇬"},
  sr:{code:"sr",name:"Serbian",native:"Српски",flag:"🇷🇸"},
  hr:{code:"hr",name:"Croatian",native:"Hrvatski",flag:"🇭🇷"},
  // Wikipedia-only → Google fallback
  new:{code:"ne",name:"Newar",native:"नेपाल भाषा",flag:"🇳🇵"},
  awa:{code:"hi",name:"Awadhi",native:"अवधी",flag:"🇮🇳"},
  hne:{code:"hi",name:"Chhattisgarhi",native:"छत्तीसगढ़ी",flag:"🇮🇳"},
  raj:{code:"hi",name:"Rajasthani",native:"राजस्थानी",flag:"🇮🇳"},
  dty:{code:"ne",name:"Doteli",native:"डोटेली",flag:"🇳🇵"},
  sah:{code:"ru",name:"Sakha",native:"Саха тыла",flag:"🇷🇺"},
  ba:{code:"ru",name:"Bashkir",native:"Башҡортса",flag:"🇷🇺"},
  cv:{code:"ru",name:"Chuvash",native:"Чӑвашла",flag:"🇷🇺"},
  ce:{code:"ru",name:"Chechen",native:"Нохчийн",flag:"🇷🇺"},
  azb:{code:"az",name:"S. Azerbaijani",native:"تۆرکجه",flag:"🇮🇷"},
  mzn:{code:"fa",name:"Mazanderani",native:"مازِرونی",flag:"🇮🇷"},
  glk:{code:"fa",name:"Gilaki",native:"گیلکی",flag:"🇮🇷"},
  tcy:{code:"kn",name:"Tulu",native:"ತುಳು",flag:"🇮🇳"},
  nn:{code:"no",name:"Norwegian Nynorsk",native:"Nynorsk",flag:"🇳🇴"},
  nb:{code:"no",name:"Norwegian Bokmål",native:"Bokmål",flag:"🇳🇴"},
};

// Flat list for the extra-lang dropdown, grouped by region
const EXTRA_LANG_OPTIONS = [
  {group:"🇮🇳 Indic", langs:[
    {code:"hi",name:"Hindi",native:"हिन्दी",flag:"🇮🇳"},
    {code:"bn",name:"Bengali",native:"বাংলা",flag:"🇧🇩"},
    {code:"ta",name:"Tamil",native:"தமிழ்",flag:"🇮🇳"},
    {code:"te",name:"Telugu",native:"తెలుగు",flag:"🇮🇳"},
    {code:"mr",name:"Marathi",native:"मराठी",flag:"🇮🇳"},
    {code:"gu",name:"Gujarati",native:"ગુજરાતી",flag:"🇮🇳"},
    {code:"kn",name:"Kannada",native:"ಕನ್ನಡ",flag:"🇮🇳"},
    {code:"ml",name:"Malayalam",native:"മലയാളം",flag:"🇮🇳"},
    {code:"pa",name:"Punjabi",native:"ਪੰਜਾਬੀ",flag:"🇮🇳"},
    {code:"ur",name:"Urdu",native:"اردو",flag:"🇵🇰"},
    {code:"ne",name:"Nepali",native:"नेपाली",flag:"🇳🇵"},
    {code:"si",name:"Sinhala",native:"සිංහල",flag:"🇱🇰"},
    {code:"or",name:"Odia",native:"ଓଡ଼ିଆ",flag:"🇮🇳"},
    {code:"sa",name:"Sanskrit",native:"संस्कृतम्",flag:"🇮🇳"},
  ]},
  {group:"🌍 European", langs:[
    {code:"fr",name:"French",native:"Français",flag:"🇫🇷"},
    {code:"de",name:"German",native:"Deutsch",flag:"🇩🇪"},
    {code:"es",name:"Spanish",native:"Español",flag:"🇪🇸"},
    {code:"it",name:"Italian",native:"Italiano",flag:"🇮🇹"},
    {code:"pt",name:"Portuguese",native:"Português",flag:"🇧🇷"},
    {code:"ru",name:"Russian",native:"Русский",flag:"🇷🇺"},
    {code:"pl",name:"Polish",native:"Polski",flag:"🇵🇱"},
    {code:"nl",name:"Dutch",native:"Nederlands",flag:"🇳🇱"},
    {code:"tr",name:"Turkish",native:"Türkçe",flag:"🇹🇷"},
    {code:"uk",name:"Ukrainian",native:"Українська",flag:"🇺🇦"},
    {code:"el",name:"Greek",native:"Ελληνικά",flag:"🇬🇷"},
    {code:"sv",name:"Swedish",native:"Svenska",flag:"🇸🇪"},
    {code:"cs",name:"Czech",native:"Čeština",flag:"🇨🇿"},
  ]},
  {group:"🌏 East Asian", langs:[
    {code:"zh-CN",name:"Chinese (Simplified)",native:"中文(简)",flag:"🇨🇳"},
    {code:"zh-TW",name:"Chinese (Traditional)",native:"中文(繁)",flag:"🇹🇼"},
    {code:"ja",name:"Japanese",native:"日本語",flag:"🇯🇵"},
    {code:"ko",name:"Korean",native:"한국어",flag:"🇰🇷"},
    {code:"vi",name:"Vietnamese",native:"Tiếng Việt",flag:"🇻🇳"},
    {code:"th",name:"Thai",native:"ภาษาไทย",flag:"🇹🇭"},
    {code:"id",name:"Indonesian",native:"Bahasa Indonesia",flag:"🇮🇩"},
    {code:"ms",name:"Malay",native:"Bahasa Melayu",flag:"🇲🇾"},
  ]},
  {group:"🌍 Middle East & Central Asia", langs:[
    {code:"ar",name:"Arabic",native:"العربية",flag:"🇸🇦"},
    {code:"fa",name:"Persian",native:"فارسی",flag:"🇮🇷"},
    {code:"iw",name:"Hebrew",native:"עברית",flag:"🇮🇱"},
    {code:"kk",name:"Kazakh",native:"Қазақша",flag:"🇰🇿"},
    {code:"uz",name:"Uzbek",native:"Oʻzbek",flag:"🇺🇿"},
    {code:"az",name:"Azerbaijani",native:"Azərbaycan",flag:"🇦🇿"},
  ]},
  {group:"🌍 African", langs:[
    {code:"sw",name:"Swahili",native:"Kiswahili",flag:"🇰🇪"},
    {code:"am",name:"Amharic",native:"አማርኛ",flag:"🇪🇹"},
    {code:"yo",name:"Yoruba",native:"Yorùbá",flag:"🇳🇬"},
    {code:"ha",name:"Hausa",native:"Hausa",flag:"🇳🇬"},
    {code:"zu",name:"Zulu",native:"isiZulu",flag:"🇿🇦"},
  ]},
];

// English wiki subdomains — don't use as translation target
const ENGLISH_WIKI_CODES = new Set(["en","simple","test","test2"]);

function detectPageLang() {
  const parts = location.hostname.split(".");
  if (parts.length >= 3 && parts[1] === "wikipedia") {
    const sub = parts[0];
    if (ENGLISH_WIKI_CODES.has(sub)) return null;
    return WIKI_LANGS[sub] || null;
  }
  return null;
}

// Load both currentLang and extraLang from storage on init
const DEFAULT_EXTRA = {code:"hi",name:"Hindi",native:"हिन्दी",flag:"🇮🇳"};
(function initLang() {
  const p = detectPageLang();
  if (p) currentLang = p;
  chrome.storage.local.get(["targetLang","extraLang"], ({ targetLang, extraLang: saved }) => {
    if (!currentLang) {
      currentLang = WIKI_LANGS[targetLang] || DEFAULT_EXTRA;
    }
    // Extra lang: find in flat list
    extraLang = findLangByCode(saved) || DEFAULT_EXTRA;
  });
})();

function findLangByCode(code) {
  if (!code) return null;
  for (const group of EXTRA_LANG_OPTIONS) {
    const found = group.langs.find(l => l.code === code);
    if (found) return found;
  }
  return null;
}

// ── Translation fetch ──────────────────────────────────────────────────────────
function fetchTranslation(text, targetCode, cb) {
  fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl="
    + encodeURIComponent(targetCode) + "&dt=t&q=" + encodeURIComponent(text))
    .then(r => r.json())
    .then(data => {
      let out = "";
      if (data && data[0]) out = data[0].map(i => i[0]).filter(Boolean).join("");
      cb(null, out || "");
    })
    .catch(e => cb(e.message, null));
}

// ── Build popup ────────────────────────────────────────────────────────────────
function buildPopup(anchorX, anchorY, text) {
  if (popup) { popup.remove(); popup = null; }

  const wikLang = currentLang || DEFAULT_EXTRA;
  const extLang = extraLang   || DEFAULT_EXTRA;

  // On English Wikipedia, wiki tab = same as English → skip wiki tab, show extra only
  const isEngWiki = ENGLISH_WIKI_CODES.has(location.hostname.split(".")[0]);
  // Wiki tab label: use native name if short enough, else just name
  const wikiTabLabel = wikLang.native || wikLang.name;

  // Build dropdown HTML
  let dropdownHtml = '<select id="wt-extra-select" style="'
    + 'background:#2a2b2f;color:#e8eaed;border:1px solid #5f6368;border-radius:6px;'
    + 'font-size:11px;padding:3px 6px;cursor:pointer;max-width:160px;font-family:inherit">';
  for (const grp of EXTRA_LANG_OPTIONS) {
    dropdownHtml += `<optgroup label="${grp.group}">`;
    for (const l of grp.langs) {
      const sel = l.code === extLang.code ? " selected" : "";
      dropdownHtml += `<option value="${l.code}"${sel}>${l.flag} ${l.name} · ${l.native}</option>`;
    }
    dropdownHtml += "</optgroup>";
  }
  dropdownHtml += "</select>";

  popup = document.createElement("div");
  popup.id = "wt-popup";
  popup.innerHTML = `
    <div class="wt-header">
      <button class="wt-tab" id="wt-tab-en">🇬🇧 English</button>
      ${!isEngWiki ? `<button class="wt-tab wt-tab-active" id="wt-tab-wiki">${wikLang.flag} ${wikiTabLabel}</button>` : ""}
      <button class="wt-tab${isEngWiki ? " wt-tab-active":""}" id="wt-tab-extra">${extLang.flag} ${extLang.name}</button>
      <div style="flex:1"></div>
      <button class="wt-close-btn" id="wt-close">✕</button>
    </div>
    <div class="wt-body">
      <div id="wt-en-panel" style="display:none">
        <div class="wt-loading" id="wt-en-loading"><div class="wt-spinner"></div><span>Translating…</span></div>
        <p class="wt-tgt-text" id="wt-en-text"></p>
      </div>
      ${!isEngWiki ? `
      <div id="wt-wiki-panel">
        <div class="wt-loading" id="wt-wiki-loading"><div class="wt-spinner"></div><span>Translating…</span></div>
        <p class="wt-tgt-text" id="wt-wiki-text"></p>
      </div>` : ""}
      <div id="wt-extra-panel" style="display:${isEngWiki?"block":"none"}">
        <div class="wt-loading" id="wt-extra-loading"><div class="wt-spinner"></div><span>Translating…</span></div>
        <p class="wt-tgt-text" id="wt-extra-text"></p>
      </div>
    </div>
    <div class="wt-footer">
      <button class="wt-copy-btn" id="wt-copy">📋 Copy</button>
      <div style="display:flex;align-items:center;gap:5px;flex:1;min-width:0">
        ${dropdownHtml}
      </div>
      <button class="wt-fullpage-btn" id="wt-fullpage">Full page</button>
      <span class="wt-brand">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        G Translate
      </span>
    </div>`;

  // Initial position
  const vw = document.documentElement.clientWidth + window.scrollX;
  popup.style.left = Math.max(8, Math.min(anchorX - 20, vw - 470)) + "px";
  popup.style.top  = (anchorY + 14) + "px";
  document.body.appendChild(popup);
  positionPopup(anchorX, anchorY);

  // Set initial tab state
  currentTab = isEngWiki ? "extra" : "wiki";

  // Tab events
  popup.querySelector("#wt-tab-en").addEventListener("click", () => setTab("en"));
  if (!isEngWiki) popup.querySelector("#wt-tab-wiki").addEventListener("click", () => setTab("wiki"));
  popup.querySelector("#wt-tab-extra").addEventListener("click", () => setTab("extra"));

  // Close
  popup.querySelector("#wt-close").addEventListener("click", closePopup);

  // Copy active tab
  popup.querySelector("#wt-copy").addEventListener("click", () => {
    const idMap = {en:"#wt-en-text", wiki:"#wt-wiki-text", extra:"#wt-extra-text"};
    const el = popup.querySelector(idMap[currentTab]);
    const val = (el?.textContent || "").trim();
    if (val) {
      navigator.clipboard.writeText(val).then(() => {
        const btn = popup.querySelector("#wt-copy");
        if (btn) btn.textContent = "✅ Copied!";
        setTimeout(closePopup, 800);
      }).catch(() => closePopup());
    }
  });

  // Full page
  popup.querySelector("#wt-fullpage").addEventListener("click", () => {
    const c = (currentLang?.code || "hi");
    window.open("https://translate.google.com/translate?sl=auto&tl=" + c + "&u=" + encodeURIComponent(location.href), "_blank");
  });

  // Dropdown: change extra language, save, re-fetch
  popup.querySelector("#wt-extra-select").addEventListener("change", e => {
    const newLang = findLangByCode(e.target.value);
    if (!newLang) return;
    extraLang = newLang;
    chrome.storage.local.set({ extraLang: newLang.code });
    // Update tab label
    const tabBtn = popup.querySelector("#wt-tab-extra");
    if (tabBtn) tabBtn.textContent = newLang.flag + " " + newLang.name;
    // Clear and re-fetch extra panel
    const loading = popup.querySelector("#wt-extra-loading");
    const textEl  = popup.querySelector("#wt-extra-text");
    if (loading) loading.style.display = "flex";
    if (textEl)  textEl.textContent = "";
    setTab("extra");
    fetchTranslation(text, newLang.code, (err, result) => {
      if (!popup) return;
      popup.querySelector("#wt-extra-loading").style.display = "none";
      popup.querySelector("#wt-extra-text").textContent = (err || !result)
        ? "⚠️ Translation failed." : result;
    });
  });

  // ── Fire all three fetches in parallel ──
  // 1. English
  fetchTranslation(text, "en", (err, result) => {
    if (!popup) return;
    popup.querySelector("#wt-en-loading").style.display = "none";
    popup.querySelector("#wt-en-text").textContent = (err || !result) ? "⚠️ Translation failed." : result;
  });

  // 2. Wiki language (skip if English Wikipedia)
  if (!isEngWiki) {
    const wikiCode = wikLang.code;
    fetchTranslation(text, wikiCode, (err, result) => {
      if (!popup) return;
      popup.querySelector("#wt-wiki-loading").style.display = "none";
      popup.querySelector("#wt-wiki-text").textContent = (err || !result) ? "⚠️ Translation failed." : result;
    });
  }

  // 3. Extra language
  fetchTranslation(text, extLang.code, (err, result) => {
    if (!popup) return;
    popup.querySelector("#wt-extra-loading").style.display = "none";
    popup.querySelector("#wt-extra-text").textContent = (err || !result) ? "⚠️ Translation failed." : result;
  });
}

function setTab(which) {
  if (!popup) return;
  currentTab = which;
  const panels = {en:"wt-en-panel", wiki:"wt-wiki-panel", extra:"wt-extra-panel"};
  const tabs   = {en:"wt-tab-en",   wiki:"wt-tab-wiki",   extra:"wt-tab-extra"};
  for (const [key, panelId] of Object.entries(panels)) {
    const panel = popup.querySelector("#" + panelId);
    const tab   = popup.querySelector("#" + tabs[key]);
    if (panel) panel.style.display = key === which ? "block" : "none";
    if (tab)   tab.classList.toggle("wt-tab-active", key === which);
  }
}

function closePopup() {
  if (popup) { popup.remove(); popup = null; }
}

// ── T float button – anchored to selection rect, not mouse ───────────────────
function showFloatBtn(rect, text) {
  removeFloatBtn();
  const lang = currentLang || {flag:"🌐", name:"Translate"};
  floatBtn = document.createElement("button");
  floatBtn.id = "wt-floatbtn";
  floatBtn.title = "Translate to " + lang.name;
  floatBtn.innerHTML = `
    <span style="font-size:13px;font-weight:700;color:#fff;line-height:1">T</span>
    <span style="font-size:10px;position:absolute;bottom:-1px;right:-1px">${lang.flag}</span>`;

  // Position: left edge of selection rect, vertically centred
  const x = Math.max(4, rect.left + window.scrollX - 36);
  const y = rect.top  + window.scrollY + (rect.height / 2) - 14;

  floatBtn.style.cssText = `
    position: absolute;
    z-index: 2147483646;
    left: ${x}px;
    top: ${y}px;
    width: 28px; height: 28px;
    border: none; border-radius: 6px;
    background: linear-gradient(135deg, #1a73e8, #12b5cb);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    padding: 0;
  `;
  document.body.appendChild(floatBtn);

  floatBtn.addEventListener("mousedown", e => { e.preventDefault(); e.stopPropagation(); });
  floatBtn.addEventListener("click", e => {
    e.stopPropagation();
    const sel = window.getSelection();
    const selText = sel ? sel.toString().trim() : "";
    removeFloatBtn();
    if (selText) buildPopup(x, y, selText);
  });
}

function removeFloatBtn() {
  if (floatBtn) { floatBtn.remove(); floatBtn = null; }
}

// ── Track mouse for textarea fallback ────────────────────────────────────────
let lastMouseX = 0, lastMouseY = 0;
document.addEventListener("mousemove", e => { lastMouseX = e.pageX; lastMouseY = e.pageY; }, { passive: true });

// ── Get selection info ────────────────────────────────────────────────────────
function getSelectionInfo() {
  // Textarea / input
  const el = document.activeElement;
  if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
    const text = el.value.substring(el.selectionStart, el.selectionEnd).trim();
    if (text.length >= 2) {
      return {
        text,
        rect: { left: lastMouseX, top: lastMouseY, height: 0, right: lastMouseX }
      };
    }
  }
  // Normal DOM
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : "";
  if (text.length < 2 || !sel.rangeCount) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  // Fallback to mouse if rect is degenerate
  if (!rect.width && !rect.height) {
    return { text, rect: { left: lastMouseX, top: lastMouseY, height: 0, right: lastMouseX } };
  }
  return { text, rect };
}

// ── mouseup → show T button ───────────────────────────────────────────────────
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    const p = detectPageLang(); if (p) currentLang = p;
    const info = getSelectionInfo();
    if (!info) { removeFloatBtn(); return; }
    showFloatBtn(info.rect, info.text);
  }, 30);
});

document.addEventListener("mousedown", e => {
  if (floatBtn && !floatBtn.contains(e.target)) removeFloatBtn();
});

// ── Context menu message ──────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "translateText" && req.text) {
    if (req.lang) currentLang = req.lang;
    else { const p = detectPageLang(); if (p) currentLang = p; }
    const x = lastMouseX + window.scrollX;
    const y = lastMouseY + window.scrollY + 20;
    removeFloatBtn();
    buildPopup(x, y, req.text);
    sendResponse({ ok: true });
  }
});

// Pending injection fallback
if (window.__wtPendingTranslation) {
  const {text, lang} = window.__wtPendingTranslation;
  currentLang = lang;
  delete window.__wtPendingTranslation;
  buildPopup(window.scrollX + 80, window.scrollY + 160, text);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function positionPopup(x, y) {
  if (!popup) return;
  requestAnimationFrame(() => {
    if (!popup) return;
    const vw = document.documentElement.clientWidth  + window.scrollX;
    const vh = document.documentElement.clientHeight + window.scrollY;
    const pw = popup.offsetWidth  || 460;
    const ph = popup.offsetHeight || 200;
    const left = Math.max(8, Math.min(x - 20, vw - pw - 12));
    const top  = (y + ph + 12 > vh) ? Math.max(8, y - ph - 40) : y + 14;
    popup.style.left = left + "px";
    popup.style.top  = top  + "px";
  });
}
function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
