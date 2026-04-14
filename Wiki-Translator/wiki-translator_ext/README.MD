# 🌐 Wiki Translator — Chrome Extension

> **Instantly translate selected text on any Wikipedia page** — with auto-detection of the page language, a Chrome-style popup, and support for 230+ languages.

[![Version](https://img.shields.io/badge/version-4.0-blue?style=flat-square)](https://github.com)
[![Languages](https://img.shields.io/badge/languages-230%2B-green?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](LICENSE)
[![Manifest](https://img.shields.io/badge/Manifest-v3-purple?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![Wikipedia](https://img.shields.io/badge/works%20on-Wikipedia-gray?style=flat-square&logo=wikipedia)](https://www.wikipedia.org)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Auto language detection** | Reads the Wikipedia subdomain (`ne.wikipedia.org` → नेपाली, `sa.wikipedia.org` → संस्कृतम्) |
| **T button** | A small gradient button appears to the **left** of any selection — no text obstruction |
| 🖱️ **Right-click menu** | Context menu entry dynamically updates to show the detected language |
| 💬 **Chrome-style popup** | English ↔ Target language tabs, just like Google's native translate UI |
| 📋 **Copy & close** | Copy translated text with one click — popup auto-closes after 0.8 s |
| 🔊 **Full page translate** | Opens the full page in Google Translate |
| 🌍 **230+ languages** | All Google Translate languages + Wikipedia-exclusive languages with smart fallback |

---

## 📸 Screenshots

### Floating T Button (on text selection)
```
┌──────────────────────────────────────────────┐
│  [T🇳🇵]  Traditional silver waist belt worn  │
│           by a Bhil community woman…         │
└──────────────────────────────────────────────┘
       ↑ Small gradient button appears
         to the LEFT of the selection
```

### Translation Popup
```
┌─────────────────────────────────────────────────┐
│  [ English ]  [ 🇳🇵 Nepali ✓ ]          [✕]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  पारंपरिक चांदी की कमरबंद, मध्य प्रदेश के      │
│  झाबुआ में एक भील समुदाय की महिला द्वारा…      │
│                                                 │
├─────────────────────────────────────────────────┤
│  [📋 Copy]  [Translate full page]  G Translate  │
└─────────────────────────────────────────────────┘
```

### Context Menu
```
Right-click → "Translate to 🇳🇵 Nepali"
              "Translate to 🇮🇳 Hindi"
              "Translate to 🇧🇩 Bengali"
              (auto-updates per Wikipedia page)
```

---

## 🚀 Installation

### Method 1 — Load Unpacked (Developer Mode)

1. **Download** this repository as a ZIP and extract it, **or** clone it:
   ```bash
   git clone https://github.com/your-username/wiki-translator.git
   ```

2. Open Chrome and go to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **"Load unpacked"** and select the `wiki-translator-v2` folder.

5. The 🌐 icon will appear in your Chrome toolbar. Done!

### Method 2 — Chrome Web Store
> *(Coming soon)*

---

## 📖 How to Use

### 1. Select text → Click the T button
Select any text on a Wikipedia page. A small **T** button with the target language's flag appears to the **left** of your selection. Click it to open the translation popup.

```
Before:   [T🇳🇵]  "Traditional silver waist belt…"
After:    Translation popup opens instantly
```

### 2. Right-click → Translate
Right-click on selected text. The context menu will show:
```
Translate to 🇳🇵 Nepali        ← on ne.wikipedia.org
Translate to 🇮🇳 Hindi         ← on hi.wikipedia.org
Translate to 🇧🇩 Bengali       ← on bn.wikipedia.org
```
The language **automatically matches the Wikipedia subdomain** you're on.

### 3. Inside the popup
| Action | Result |
|---|---|
| Click **English** tab | See original selected text |
| Click **[Language]** tab | See the translation |
| Click **📋 Copy** | Copies translation → auto-closes popup after 0.8 s |
| Click **Translate full page** | Opens the whole page in Google Translate |
| Click **✕** | Closes the popup |

---

## 🗺️ Language Auto-Detection

The extension reads the **Wikipedia subdomain** and sets the translation target accordingly:

| Wikipedia URL | Detected Language |
|---|---|
| `ne.wikipedia.org` | 🇳🇵 नेपाली (Nepali) |
| `hi.wikipedia.org` | 🇮🇳 हिन्दी (Hindi) |
| `bn.wikipedia.org` | 🇧🇩 বাংলা (Bengali) |
| `sa.wikipedia.org` | 🇮🇳 संस्कृतम् (Sanskrit) |
| `mr.wikipedia.org` | 🇮🇳 मराठी (Marathi) |
| `te.wikipedia.org` | 🇮🇳 తెలుగు (Telugu) |
| `kk.wikipedia.org` | 🇰🇿 Қазақша (Kazakh) |
| `sw.wikipedia.org` | 🇰🇪 Kiswahili (Swahili) |
| `ar.wikipedia.org` | 🇸🇦 العربية (Arabic) |
| `awa.wikipedia.org` | 🇮🇳 अवधी → Hindi (fallback) |
| *(any other site)* | Falls back to your saved preference |

---

## 🌍 Supported Languages

230+ languages organised by region. All languages supported by Google Translate are included, plus Wikipedia-exclusive languages that fall back gracefully to the nearest supported language.

<details>
<summary><b>🇮🇳 Indic & South Asian (31 languages)</b></summary>

Hindi · Nepali · Marathi · Bengali · Punjabi · Gujarati · Odia · Assamese · Sanskrit · Maithili · Bhojpuri · Dogri · Konkani · Sindhi · Urdu · Kashmiri · Meitei · Bodo · Santali · Mizo · Rajasthani · Awadhi · Chhattisgarhi · Magahi · Doteli · Newar · Bishnupriya · Dzongkha · Tibetan · Sinhala · Tulu

</details>

<details>
<summary><b>🌏 Central Asian & Turkic (23 languages)</b></summary>

Kazakh · Kyrgyz · Uzbek · Turkmen · Tajik · Azerbaijani · Tatar · Bashkir · Chuvash · Uyghur · Pashto · Kurdish (Kurmanji) · Kurdish (Sorani) · Sakha · Ossetian · Tuvan · Altai · Eastern Mari · Western Mari · Udmurt · Komi · Erzya · Moksha

</details>

<details>
<summary><b>🌍 African (38 languages)</b></summary>

Swahili · Amharic · Hausa · Yoruba · Igbo · Zulu · Xhosa · Afrikaans · Somali · Sesotho · Shona · Kinyarwanda · Nyanja · Malagasy · Tigrinya · Luganda · Lingala · Tsonga · Sepedi · Twi · Ewe · Bambara · Oromo · Krio · Wolof · Fula · Sango · Kongo · Akan · Tswana · Swati · Venda · S. Ndebele · N. Ndebele · Kikuyu · Kirundi

</details>

<details>
<summary><b>🌍 European (89 languages)</b></summary>

English · French · German · Spanish · Italian · Portuguese · Russian · Dutch · Polish · Ukrainian · Swedish · Norwegian · Danish · Finnish · Greek · Czech · Slovak · Hungarian · Romanian · Bulgarian · Serbian · Croatian · Bosnian · Slovenian · Macedonian · Belarusian · Lithuanian · Latvian · Estonian · Icelandic · Irish · Welsh · Basque · Catalan · Galician · Albanian · Armenian · Georgian · Turkish · Latin · Esperanto · Yiddish · Maltese · Luxembourgish · Scots Gaelic · Occitan · Corsican · Breton · and many regional dialects…

</details>

<details>
<summary><b>🌏 East & Southeast Asian (21 languages)</b></summary>

Japanese · Korean · Chinese (Simplified) · Chinese (Traditional) · Mongolian · Burmese · Thai · Lao · Khmer · Vietnamese · Indonesian · Malay · Javanese · Sundanese · Cebuano · Filipino · Ilokano · Kapampangan · Maori · Hawaiian · Tagalog

</details>

<details>
<summary><b>🌎 Middle East & Americas (17 languages)</b></summary>

Arabic · Persian · Hebrew · Quechua · Guarani · Aymara · Haitian Creole · Nahuatl · Mayan · Samoan · Tongan · Fijian · Pashto · Dhivehi · Aramaic · South Azerbaijani · Mazanderani

</details>

---

## 📁 Project Structure

```
wiki-translator-v2/
├── manifest.json        # Chrome Extension Manifest v3
├── background.js        # Service worker: context menu, language detection, message routing
├── content.js           # Injected into pages: T button, popup UI, direct translation fetch
├── content.css          # Styles for the T button and popup
├── languages.js         # Master list of 230+ languages with codes, names, flags, regions
├── popup.html           # Extension toolbar popup (instructions + credit)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Technical Details

### Architecture

```
User selects text
       │
       ▼
content.js detects selection
       │
       ├─── Shows "T" float button (left of selection)
       │           │
       │           └── User clicks T → buildPopup()
       │
       └─── User right-clicks → background.js context menu
                   │
                   └── background sends message → content.js → buildPopup()

buildPopup()
       │
       ├── Renders Chrome-style dark popup
       └── fetchTranslation() ──► translate.googleapis.com
                                        │
                                        └── Renders translated text
```

### Why direct fetch instead of background message passing?
Wikipedia's editor pages (`?action=edit`) use a sandboxed environment that can block Chrome extension message passing. The content script fetches translations **directly** from `translate.googleapis.com`, bypassing this issue entirely.

### Language fallback for Wikipedia-exclusive languages
Some Wikipedia languages (e.g., Awadhi `awa`, Doteli `dty`, Bashkir `ba`) are not supported by Google Translate. The extension maps these to the closest supported language:

```javascript
awa → hi  (Awadhi → Hindi)
dty → ne  (Doteli → Nepali)
ba  → ru  (Bashkir → Russian)
tcy → kn  (Tulu → Kannada)
```

---

## 🤝 Credits & Acknowledgements

| Contributor | Contribution |
|---|---|
| [**Suyash Dwivedi**](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi) | TTS userscript, Wikipedia tools & inspiration for this extension |
| [Google Translate](https://translate.google.com) | Translation API (`translate.googleapis.com`) |
| [Wikipedia](https://www.wikipedia.org) | The world's free encyclopedia |

> This extension was inspired by and built to complement the **MediaWiki Text-to-Speech** userscript by [Suyash Dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi). Consider installing that userscript alongside this extension for a complete multilingual Wikipedia reading experience.

---

## 🔮 Roadmap / Planned Features

- [ ] 🔊 **Read aloud** translated text (integrate with TTS userscript)
- [ ] 🔍 **Search on Wikipedia** — one-click link to the translated term's Wikipedia article in the target language
- [ ] 📖 **Wikidata info** — show a short definition/description from Wikidata for named entities
- [ ] 🗂️ **Translation history** — save the last 20 translations locally
- [ ] ✏️ **Insert translation** — paste translated text directly into the Wikipedia editor cursor
- [ ] 🎨 **Theme toggle** — light / dark popup

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🐛 Issues & Contributing

Found a bug or want to suggest a feature? Open an issue or pull request.

```bash
# Clone the repo
git clone https://github.com/your-username/wiki-translator.git

# Make your changes to the source files
# Then reload the extension in chrome://extensions
```

---

<div align="center">

Made with ❤️ for the Wikipedia community

[Suyash Dwivedi on Wikimedia Meta](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

</div>
