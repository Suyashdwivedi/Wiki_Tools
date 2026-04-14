// Wiki Translator v4 – content script
// Floating "T" button (left of selection) → Chrome-style sticky popup

let popup = null;
let floatBtn = null;
let currentLang = null;

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
  "zh-CN":{code:"zh-CN",name:"Chinese",native:"中文",flag:"🇨🇳"},
  zh:{code:"zh-CN",name:"Chinese",native:"中文",flag:"🇨🇳"},
  vi:{code:"vi",name:"Vietnamese",native:"Tiếng Việt",flag:"🇻🇳"},
  th:{code:"th",name:"Thai",native:"ภาษาไทย",flag:"🇹🇭"},
  id:{code:"id",name:"Indonesian",native:"Bahasa Indonesia",flag:"🇮🇩"},
  ms:{code:"ms",name:"Malay",native:"Bahasa Melayu",flag:"🇲🇾"},
  sw:{code:"sw",name:"Swahili",native:"Kiswahili",flag:"🇰🇪"},
  am:{code:"am",name:"Amharic",native:"አማርኛ",flag:"🇪🇹"},
  yo:{code:"yo",name:"Yoruba",native:"Yorùbá",flag:"🇳🇬"},
  ha:{code:"ha",name:"Hausa",native:"Hausa",flag:"🇳🇬"},
  zu:{code:"zu",name:"Zulu",native:"isiZulu",flag:"🇿🇦"},
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

function detectPageLang() {
  const parts = location.hostname.split(".");
  if (parts.length >= 3 && parts[1] === "wikipedia") return WIKI_LANGS[parts[0]] || null;
  return null;
}

(function initLang() {
  const p = detectPageLang();
  if (p) { currentLang = p; return; }
  chrome.storage.local.get("targetLang", ({ targetLang }) => {
    currentLang = WIKI_LANGS[targetLang] || {code:"hi",name:"Hindi",native:"हिन्दी",flag:"🇮🇳"};
  });
})();

// ── Translation fetch ──────────────────────────────────────────────────────────
function fetchTranslation(text, cb) {
  const lang = currentLang || {code:"hi"};
  const code = lang.gtFallback || lang.code;
  fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl="
    + encodeURIComponent(code) + "&dt=t&q=" + encodeURIComponent(text))
    .then(r => r.json())
    .then(data => {
      let out = "";
      if (data && data[0]) out = data[0].map(i => i[0]).filter(Boolean).join("");
      cb(null, out || "");
    })
    .catch(e => cb(e.message, null));
}

// ── Build sticky Chrome-style popup ───────────────────────────────────────────
function buildPopup(anchorX, anchorY, text) {
  if (popup) { popup.remove(); popup = null; }
  const lang = currentLang || {name:"Hindi",native:"हिन्दी",flag:"🇮🇳"};

  popup = document.createElement("div");
  popup.id = "wt-popup";
  popup.innerHTML = `
    <div class="wt-header">
      <button class="wt-tab" id="wt-tab-en">English</button>
      <button class="wt-tab wt-tab-active" id="wt-tab-tgt">
        <span>${lang.flag}</span> ${lang.name}
      </button>
      <div style="flex:1"></div>
      <button class="wt-close-btn" id="wt-close">✕</button>
    </div>
    <div class="wt-body">
      <div id="wt-src-panel" style="display:none">
        <p class="wt-src-text">${escapeHtml(truncate(text,400))}</p>
      </div>
      <div id="wt-tgt-panel">
        <div class="wt-loading" id="wt-loading">
          <div class="wt-spinner"></div><span>Translating…</span>
        </div>
        <p class="wt-tgt-text" id="wt-tgt-text"></p>
      </div>
    </div>
    <div class="wt-footer">
      <button class="wt-copy-btn" id="wt-copy">📋 Copy</button>
      <button class="wt-fullpage-btn" id="wt-fullpage">Translate full page</button>
      <span class="wt-brand">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google Translate
      </span>
    </div>`;

  // Set a rough initial position immediately (prevents flash at 0,0)
  const vw = document.documentElement.clientWidth + window.scrollX;
  popup.style.left = Math.max(8, Math.min(anchorX - 20, vw - 470)) + "px";
  popup.style.top  = (anchorY + 14) + "px";
  document.body.appendChild(popup);
  positionPopup(anchorX, anchorY);

  // Close only on ✕
  popup.querySelector("#wt-close").addEventListener("click", closePopup);

  // Tab switching
  popup.querySelector("#wt-tab-en").addEventListener("click", () => {
    setTab("en");
  });
  popup.querySelector("#wt-tab-tgt").addEventListener("click", () => {
    setTab("tgt");
  });

  // Copy → auto-close
  popup.querySelector("#wt-copy").addEventListener("click", () => {
    const tgt = popup.querySelector("#wt-tgt-text");
    const val = tgt ? tgt.textContent : "";
    if (val) {
      navigator.clipboard.writeText(val).then(() => {
        const btn = popup.querySelector("#wt-copy");
        if (btn) btn.textContent = "✅ Copied!";
        setTimeout(closePopup, 800); // close 0.8s after copy
      }).catch(() => closePopup());
    }
  });

  // Full page
  popup.querySelector("#wt-fullpage").addEventListener("click", () => {
    const c = (currentLang?.gtFallback || currentLang?.code || "hi");
    window.open("https://translate.google.com/translate?sl=auto&tl=" + c + "&u=" + encodeURIComponent(location.href), "_blank");
  });

  // Fetch translation
  fetchTranslation(text, (err, result) => {
    if (!popup) return;
    const loading = popup.querySelector("#wt-loading");
    const tgtText = popup.querySelector("#wt-tgt-text");
    if (loading) loading.style.display = "none";
    if (tgtText) {
      tgtText.textContent = (err || !result)
        ? "⚠️ Translation failed. Please try again."
        : result;
    }
  });
}

function setTab(which) {
  if (!popup) return;
  const tabEn  = popup.querySelector("#wt-tab-en");
  const tabTgt = popup.querySelector("#wt-tab-tgt");
  const srcPanel = popup.querySelector("#wt-src-panel");
  const tgtPanel = popup.querySelector("#wt-tgt-panel");
  if (which === "en") {
    tabEn.classList.add("wt-tab-active");
    tabTgt.classList.remove("wt-tab-active");
    srcPanel.style.display = "block";
    tgtPanel.style.display = "none";
  } else {
    tabTgt.classList.add("wt-tab-active");
    tabEn.classList.remove("wt-tab-active");
    srcPanel.style.display = "none";
    tgtPanel.style.display = "block";
  }
}

function closePopup() {
  if (popup) { popup.remove(); popup = null; }
}

// ── Tiny "T" float button – LEFT side of selection ────────────────────────────
function showFloatBtn(x, y, text) {
  removeFloatBtn();
  const lang = currentLang || {flag:"🌐",name:"Translate"};
  floatBtn = document.createElement("button");
  floatBtn.id = "wt-floatbtn";
  floatBtn.title = "Translate to " + lang.name + " (" + lang.native + ")";
  floatBtn.innerHTML = `<span style="font-size:13px;font-weight:700;color:#fff;line-height:1">T</span>
    <span style="font-size:10px;position:absolute;bottom:-1px;right:-1px">${lang.flag}</span>`;
  floatBtn.style.cssText = `
    position:absolute; z-index:2147483646;
    left:${x}px; top:${y}px;
    width:28px; height:28px;
    border:none; border-radius:6px;
    background:linear-gradient(135deg,#1a73e8,#12b5cb);
    cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.35);
    display:flex; align-items:center; justify-content:center;
    position:absolute; padding:0;
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

// ── Track mouse position for textarea fallback ────────────────────────────────
let lastMouseX = 0, lastMouseY = 0;
document.addEventListener("mousemove", e => {
  lastMouseX = e.pageX;
  lastMouseY = e.pageY;
}, { passive: true });

// ── Get selected text from EITHER normal DOM or a textarea/input ──────────────
function getSelectionInfo() {
  // 1. Check active element — textarea or input
  const el = document.activeElement;
  if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
    const text = el.value.substring(el.selectionStart, el.selectionEnd).trim();
    if (text.length >= 2) {
      // Position near the mouse cursor (best we can do inside a textarea)
      return {
        text,
        x: lastMouseX + window.scrollX,
        y: lastMouseY + window.scrollY,
        fromTextarea: true
      };
    }
  }
  // 2. Normal DOM selection
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : "";
  if (text.length < 2 || !sel.rangeCount) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (!rect.width && !rect.height) {
    // Zero-size rect fallback — use mouse position
    return {
      text,
      x: lastMouseX + window.scrollX,
      y: lastMouseY + window.scrollY,
      fromTextarea: false
    };
  }
  return {
    text,
    x: rect.left + window.scrollX,
    y: rect.top  + window.scrollY + rect.height / 2,
    fromTextarea: false
  };
}

// ── Selection listener ────────────────────────────────────────────────────────
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    const p = detectPageLang(); if (p) currentLang = p;
    const info = getSelectionInfo();
    if (!info) { removeFloatBtn(); return; }
    // Place T button to the LEFT of selection, vertically centred on it
    const btnX = Math.max(2, info.x - 38);
    const btnY = info.y - 14;
    showFloatBtn(btnX, btnY, info.text);
  }, 30);
});

// Clicking elsewhere only removes the float button, NOT the popup
document.addEventListener("mousedown", e => {
  if (floatBtn && !floatBtn.contains(e.target)) removeFloatBtn();
});

// ── Context menu message from background ─────────────────────────────────────
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "translateText" && req.text) {
    if (req.lang) currentLang = req.lang;
    else { const p = detectPageLang(); if (p) currentLang = p; }
    // Use mouse position — reliable for both textarea and normal DOM
    const x = lastMouseX + window.scrollX;
    const y = lastMouseY + window.scrollY + 20;
    removeFloatBtn();
    buildPopup(x, y, req.text);
    sendResponse({ ok: true });
  }
});

// Handle pending injection from background scripting fallback
if (window.__wtPendingTranslation) {
  const {text, lang} = window.__wtPendingTranslation;
  currentLang = lang;
  delete window.__wtPendingTranslation;
  buildPopup(window.scrollX + 80, window.scrollY + 160, text);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function positionPopup(x, y) {
  if (!popup) return;
  // Measure popup height after brief paint
  requestAnimationFrame(() => {
    if (!popup) return;
    const vw  = document.documentElement.clientWidth  + window.scrollX;
    const vh  = document.documentElement.clientHeight + window.scrollY;
    const pw  = popup.offsetWidth  || 460;
    const ph  = popup.offsetHeight || 180;
    const left = Math.max(8, Math.min(x - 20, vw - pw - 12));
    // If popup would go below viewport, show it above the cursor instead
    const top  = (y + ph + 12 > vh) ? Math.max(8, y - ph - 40) : y + 14;
    popup.style.left = left + "px";
    popup.style.top  = top  + "px";
  });
}
function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function truncate(s, n) { return s.length > n ? s.slice(0,n) + "…" : s; }
