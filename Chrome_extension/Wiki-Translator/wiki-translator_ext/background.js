// ── Import language data (inlined for MV3 service worker compatibility) ────────
importScripts("languages.js");

const DEFAULT = LANG_BY_CODE["hi"] || { code:"hi", name:"Hindi", flag:"🇮🇳" };

// Wikipedia subdomains that are English (or redirect to English) — don't use as target
const ENGLISH_WIKI_CODES = new Set(["en", "simple", "test", "test2"]);

function detectLangFromUrl(url) {
  try {
    const parts = new URL(url).hostname.split(".");
    if (parts.length >= 3 && parts[1] === "wikipedia") {
      const sub = parts[0];
      if (ENGLISH_WIKI_CODES.has(sub)) return null; // fall back to stored preference
      return LANG_BY_WIKI[sub] || null;
    }
  } catch(_) {}
  return null;
}

async function getEffectiveLang(tabId, url) {
  const fromUrl = detectLangFromUrl(url);
  if (fromUrl) return fromUrl;
  return new Promise(r => {
    chrome.storage.local.get("targetLang", ({ targetLang }) => {
      r(LANG_BY_CODE[targetLang] || DEFAULT);
    });
  });
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "Translate to " + DEFAULT.flag + " " + DEFAULT.name,
    contexts: ["selection"]
  });
});

async function refreshContextMenu(tabId, url) {
  if (!url || url.startsWith("chrome://")) return;
  try {
    const lang = await getEffectiveLang(tabId, url);
    chrome.contextMenus.update("translateSelection", {
      title: "Translate to " + lang.flag + " " + lang.name
    });
  } catch(_) {}
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, tab => { if (tab?.url) refreshContextMenu(tabId, tab.url); });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) refreshContextMenu(tabId, changeInfo.url);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translateSelection" && info.selectionText) {
    const lang = await getEffectiveLang(tab.id, tab.url);
    // Try message first; fall back to scripting inject if page blocks messages
    chrome.tabs.sendMessage(tab.id, { action:"translateText", text:info.selectionText, lang }, () => {
      if (chrome.runtime.lastError) {
        // Fallback: inject the translation directly via scripting
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text, lang) => {
            window.__wtPendingTranslation = { text, lang };
          },
          args: [info.selectionText, lang]
        }).then(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "getPageLang") {
    chrome.tabs.query({ active:true, currentWindow:true }, async tabs => {
      if (!tabs[0]?.url) { sendResponse(DEFAULT); return; }
      try {
        const lang = await getEffectiveLang(tabs[0].id, tabs[0].url);
        sendResponse(lang || DEFAULT);
      } catch(_) {
        sendResponse(DEFAULT);
      }
    });
    return true;
  }
  if (req.action === "updateLang") {
    chrome.storage.local.set({ targetLang: req.lang });
    chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
      if (tabs[0]) refreshContextMenu(tabs[0].id, tabs[0].url);
    });
  }
});
