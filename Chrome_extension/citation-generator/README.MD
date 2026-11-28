# 📝 Wikipedia Citation Generator

> A browser extension that generates properly formatted Wikipedia citations from any webpage — with one click.

Created by [Suyash Dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi) · Project: [Wiki's Lazy Coders](https://meta.wikimedia.org/wiki/Wikis_Lazy_Coders)[cite: 9]

---

## ✨ Features

- **Draggable floating button with persistent position** — drag the 📝 button anywhere on the screen without triggering a citation, and your chosen position is saved automatically across tabs and browser restarts
- **One-click citation generation** — generates a `{{cite web}}` formatted citation for any webpage you are visiting, plus `{{cite book}}` support for Google Books (with Open Library author fallback and URL/title rescue for scanned editions)
- **Search results page guard** — alerts you if you try to cite a search engine results page instead of a source page
- **Instant clipboard copy** — citation is copied automatically (with a fallback if clipboard access is restricted), ready to paste into Wikipedia
- **Audio confirmation** — plays a sound when the citation is generated
- **Auto edit summary** — detects your open Wikipedia edit tab(s) and fills in the edit summary field automatically
- **Multilingual edit summary** — the edit summary is written in the language of the Wikipedia you are editing (e.g. Hindi, Punjabi, Tamil, French, Arabic, Japanese, and 50+ more)
- **Multi-tab picker** — if you have multiple Wikipedia edit tabs open, a picker lets you choose which one to fill
- **`<ref>` tag wrapping** — citation is wrapped in `<ref name="mXXX">...</ref>` tags, ready to use
- **Proper date formatting** — converts `YYYY-MM-DD` dates to `D Month YYYY` Wikipedia style automatically

---

## 🌐 Browser Support

This extension is built on **Manifest V3** and the standard WebExtensions API, which is supported across all major modern browsers[cite: 4, 9].

| Browser | Support | Notes |
|---|---|---|
| **Google Chrome** | ✅ Full | Primary development target |
| **Microsoft Edge** | ✅ Full | Uses Chrome Web Store or manual install |
| **Brave** | ✅ Full | Identical to Chrome installation |
| **Opera** | ✅ Full | Supports Chrome extensions natively |
| **Vivaldi** | ✅ Full | Supports Chrome extensions natively |
| **Mozilla Firefox** | ✅ Full | Requires minor manifest adjustment (see below) |
| **Safari** | ⚠️ Partial | Requires Apple's `safari-web-extension-converter` tool |

---

## 🚀 Installation

### Google Chrome / Brave / Opera / Vivaldi

1. Download or clone this repository to your computer
2. Open your browser and go to the extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
   - Vivaldi: `vivaldi://extensions`
3. Turn on **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the folder containing the extension files
6. The 📝 button will now appear on every webpage you visit

### Microsoft Edge

1. Download or clone this repository to your computer
2. Go to `edge://extensions`
3. Turn on **Developer Mode** (toggle in the left sidebar)
4. Click **Load unpacked**
5. Select the folder containing the extension files

### Mozilla Firefox

Firefox requires one small change before loading:

1. Open `manifest.json` and add the following block inside the top-level JSON object:

   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "wiki-citation-generator@suyashdwivedi"
     }
   }
