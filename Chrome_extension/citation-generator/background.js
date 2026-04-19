// Background service worker - Wikipedia Citation Generator
// Detects Wikipedia language from tab URL, fills edit summary in correct language

const SUMMARY_BY_LANG = {
  // Indo-Aryan
  en: 'Citation added',     
  simple: 'Citation added',
  hi: 'सन्दर्भ जोड़े',
  awa: 'सन्दर्भ जोड़ा गा',
  sa:'सन्दर्भः योजितः', 
  pa: 'ਹਵਾਲਾ ਜੋੜਿਆ ਗਿਆ',
  bn: 'তথ্যসূত্র যোগ করা হয়েছে', ur: 'حوالہ شامل کیا گیا',
  mr: 'संदर्भ जोडला',        gu: 'સંદર્ભ ઉમેર્યો',
  or: 'ଉଦ୍ଧୃତି ଯୋଡ଼ାଗଲା',    ne: 'उद्धरण थपियो',
  si: 'උපුටා දැක්වීම එකතු කරන ලදී',
  // Dravidian
  ta: 'மேற்கோள் சேர்க்கப்பட்டது', te: 'సూచన జోడించబడింది',
  ml: 'അവലംബം ചേർത്തു',          kn: 'ಉಲ್ಲೇಖ ಸೇರಿಸಲಾಗಿದೆ',
  // Romance
  fr: 'Référence ajoutée',  es: 'Referencia añadida',
  pt: 'Referência adicionada', it: 'Citazione aggiunta',
  ro: 'Referință adăugată', ca: 'Cita afegida',
  gl: 'Referencia engadida',
  // Germanic
  de: 'Beleg hinzugefügt',  nl: 'Citaat toegevoegd',
  sv: 'Källa tillagd',      da: 'Kilde tilføjet',
  no: 'Kilde lagt til',     nb: 'Kilde lagt til',
  nn: 'Kjelde lagt til',    fi: 'Lähde lisätty',
  af: 'Aanhaling bygevoeg',
  // Slavic
  ru: 'Ссылка добавлена',   uk: 'Джерело додано',
  pl: 'Dodano cytowanie',   cs: 'Citace přidána',
  sk: 'Citácia pridaná',    bg: 'Добавен е цитат',
  hr: 'Navod dodan',        sr: 'Цитат додат',
  bs: 'Citat dodan',        sl: 'Navedba dodana',
  mk: 'Наводот е додаден',  be: 'Крыніца дададзена',
  // Semitic
  ar: 'تمت إضافة مرجع',    he: 'ציטוט נוסף',
  fa: 'منبع افزوده شد',
  // Turkic
  tr: 'Kaynak eklendi',     az: 'İstinad əlavə edildi',
  uz: 'Manba qoʻshildi',    kk: 'Дереккөз қосылды',
  // East / Southeast Asian
  zh: '已添加引用',           ja: '出典を追加',
  ko: '인용 추가됨',          vi: 'Đã thêm trích dẫn',
  id: 'Referensi ditambahkan', ms: 'Rujukan ditambah',
  th: 'เพิ่มการอ้างอิง',
  // Other
  el: 'Προστέθηκε παραπομπή', hu: 'Hivatkozás hozzáadva',
  lt: 'Šaltinis pridėtas',  lv: 'Avots pievienots',
  et: 'Allikas lisatud',    eu: 'Erreferentzia gehitu da',
  cy: 'Cyfeiriad ychwanegwyd', hy: 'Աղբյուրն ավելացված է',
  ka: 'წყარო დამატებულია',  sw: 'Rejeleo limeongezwa',
};

function getSummaryForUrl(url) {
  try {
    const lang = new URL(url).hostname.split('.')[0];
    return SUMMARY_BY_LANG[lang] || SUMMARY_BY_LANG['en'];
  } catch {
    return SUMMARY_BY_LANG['en'];
  }
}

// Inject the summary text into a tab's #wpSummary field
function injectSummary(tabId, summaryText) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (text) => {
      const field =
        document.getElementById('wpSummary') ||
        document.querySelector('input[name="wpSummary"]') ||
        document.querySelector('textarea[name="wpSummary"]');
      if (!field) return;
      if (!field.value.includes(text)) {
        field.value = field.value ? field.value + '; ' + text : text;
      }
      field.dispatchEvent(new Event('input',  { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
    args: [summaryText]
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // 1. Get all open Wikipedia edit tabs (with pre-resolved summary per language)
  if (message.action === 'getEditTabs') {
    chrome.tabs.query({ url: '*://*.wikipedia.org/*' }, (tabs) => {
      const editTabs = tabs
        .filter(t => t.url && t.url.includes('action=edit'))
        .map(t => ({
          id:      t.id,
          title:   t.title,
          url:     t.url,
          lang:    new URL(t.url).hostname.split('.')[0].toUpperCase(),
          summary: getSummaryForUrl(t.url),
        }));
      sendResponse({ editTabs });
    });
    return true; // async
  }

  // 2. Fill summary in a specific tab (chosen by user or auto-selected)
  if (message.action === 'fillSummaryInTab') {
    chrome.tabs.get(message.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      injectSummary(tab.id, getSummaryForUrl(tab.url));
    });
    sendResponse({ status: 'done' });
  }

  // 3. Fill summary in the SENDER's own tab (user is already on Wikipedia edit page)
  if (message.action === 'fillSenderTab') {
    const tab = sender.tab;
    if (!tab) return;
    injectSummary(tab.id, getSummaryForUrl(tab.url));
    sendResponse({ status: 'done' });
  }

});
