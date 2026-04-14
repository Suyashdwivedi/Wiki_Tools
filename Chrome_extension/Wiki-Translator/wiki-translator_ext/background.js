// ── Import language data (inlined for MV3 service worker compatibility) ────────
importScripts("languages.js");

const DEFAULT = LANG_BY_CODE["hi"] || { code:"hi", name:"Hindi", flag:"🇮🇳" };

function detectLangFromUrl(url) {
  try {
    const parts = new URL(url).hostname.split(".");
    if (parts.length >= 3 && parts[1] === "wikipedia") {
      return LANG_BY_WIKI[parts[0]] || null;
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
      if (!tabs[0]) { sendResponse(DEFAULT); return; }
      const lang = await getEffectiveLang(tabs[0].id, tabs[0].url);
      sendResponse(lang);
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
