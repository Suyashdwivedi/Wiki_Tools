# 📝 Wikipedia Citation Generator

> A browser extension that generates properly formatted Wikipedia citations from any webpage — with one click.

Created by [Suyash Dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi) · Project: [Wiki's Lazy Coders](https://meta.wikimedia.org/wiki/Wikis_Lazy_Coders)

---

## ✨ Features

- **One-click citation generation** — generates a `{{cite web}}` formatted citation for any webpage you are visiting
- **Instant clipboard copy** — citation is copied automatically, ready to paste into Wikipedia
- **Audio confirmation** — plays a sound when the citation is successfully copied
- **Auto edit summary** — detects your open Wikipedia edit tab(s) and fills in the edit summary field automatically
- **Multilingual edit summary** — the edit summary is written in the language of the Wikipedia you are editing (e.g. Hindi, Punjabi, Tamil, French, Arabic, Japanese, and 50+ more)
- **Multi-tab picker** — if you have multiple Wikipedia edit tabs open, a picker lets you choose which one to fill
- **`<ref>` tag wrapping** — citation is wrapped in `<ref name="mXXX">...</ref>` tags, ready to use
- **Proper date formatting** — converts `YYYY-MM-DD` dates to `D Month YYYY` Wikipedia style automatically

---

## 🌐 Browser Support

This extension is built on **Manifest V3** and the standard WebExtensions API, which is supported across all major modern browsers.

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
   ```

2. Go to `about:debugging` in Firefox
3. Click **This Firefox** in the left sidebar
4. Click **Load Temporary Add-on**
5. Select any file inside the extension folder (e.g. `manifest.json`)

> **Note:** Temporary add-ons in Firefox are removed when the browser is closed. To install permanently, the extension needs to be signed by Mozilla or installed via Firefox's Developer Edition / Nightly with signature checks disabled at `about:config` → `xpinstall.signatures.required` → `false`.

### Safari

Safari requires conversion using Apple's official tool:

1. Install Xcode from the Mac App Store
2. Run the following command in Terminal, pointing to your extension folder:
   ```
   xcrun safari-web-extension-converter /path/to/extension-folder
   ```
3. This creates an Xcode project — build and run it to install the extension
4. Enable the extension in Safari → Settings → Extensions

---

## 📖 How to Use

### Basic workflow (the most common case)

You are reading a news article or any webpage that you want to cite in Wikipedia.

1. Open your Wikipedia article in another tab and go to **Edit** mode (`?action=edit`)
2. Go back to the news article tab
3. Click the floating **📝 button** (visible on the right side of every page)
4. The extension fetches citation data from [Citer](https://citer.toolforge.org/), formats it, and copies it to your clipboard
5. A sound plays to confirm success ✓
6. The edit summary field in your Wikipedia edit tab is filled automatically with **"Citation added"** (or the equivalent in your Wikipedia's language)
7. Switch to your Wikipedia tab, click where you want the citation, and press **Ctrl+V** (or **Cmd+V** on Mac) to paste

### If you have multiple Wikipedia edit tabs open

If you are editing more than one Wikipedia article at the same time, after clicking the button a **tab picker panel** will slide in near the button. It lists all your open Wikipedia edit tabs, showing:

- The language code of each Wikipedia (EN, HI, PA, FR…)
- The article title
- The exact edit summary text that will be filled (in that Wikipedia's language)

Click the tab you want — the summary is filled there and the picker closes.

### If you click the button while already on a Wikipedia edit page

This works too. If the page you are currently visiting is itself a Wikipedia edit page (for example you want to cite that Wikipedia page), clicking the button will generate the citation, copy it, and fill the edit summary on that same page.

### If no Wikipedia edit tab is open

The extension simply generates the citation and copies it to your clipboard. No edit summary action is taken. You can paste the citation manually wherever you need it.

---

## 🌍 Supported Edit Summary Languages

The edit summary is automatically written in the language of the Wikipedia you are editing, detected from the URL (e.g. `hi.wikipedia.org` → Hindi).

| Language | Edit Summary |
|---|---|
| English | Citation added |
| Hindi | उद्धरण जोड़े |
| Punjabi | ਹਵਾਲਾ ਜੋੜਿਆ ਗਿਆ |
| Bengali | তথ্যসূত্র যোগ করা হয়েছে |
| Urdu | حوالہ شامل کیا گیا |
| Marathi | संदर्भ जोडला |
| Gujarati | સંદર્ભ ઉમેર્યો |
| Tamil | மேற்கோள் சேர்க்கப்பட்டது |
| Telugu | సూచన జోడించబడింది |
| Malayalam | അവലംബം ചേർത്തു |
| Kannada | ಉಲ್ಲೇಖ ಸೇರಿಸಲಾಗಿದೆ |
| Arabic | تمت إضافة مرجع |
| French | Référence ajoutée |
| German | Beleg hinzugefügt |
| Spanish | Referencia añadida |
| Russian | Ссылка добавлена |
| Chinese | 已添加引用 |
| Japanese | 出典を追加 |
| Korean | 인용 추가됨 |

...and 35+ more languages. See `background.js` for the full list.

---

## 📁 File Structure

```
📦 wikipedia-citation-generator/
├── manifest.json      — Extension configuration and permissions
├── background.js      — Service worker: tab detection, language mapping, summary injection
├── content.js         — Floating button, citation fetching, clipboard, tab picker UI
├── content.css        — Styles for the floating button and tab picker panel
├── popup.html         — Small popup shown when clicking the extension icon
├── icon16.png         — Extension icon (16×16)
├── icon48.png         — Extension icon (48×48)
└── icon128.png        — Extension icon (128×128)
```

---

## ⚙️ Permissions Used

| Permission | Why it is needed |
|---|---|
| `activeTab` | To read the URL of the current page for citation generation |
| `tabs` | To find open Wikipedia edit tabs across your browser |
| `scripting` | To inject the edit summary text into the Wikipedia edit tab |

---

## 🔧 Powered By

- [Citer (Wikimedia Toolforge)](https://citer.toolforge.org/) — citation data source

---

## 🤝 Contributing

Contributions are welcome! If your language's edit summary is missing or incorrect, please open an issue or pull request with the correction.

---

## 👤 Author

**Suyash Dwivedi**
- Wikimedia: [User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
- Project: [Wiki's Lazy Coders](https://meta.wikimedia.org/wiki/Wikis_Lazy_Coders)

---

## 📄 License

This project is open source. See the repository for license details.
