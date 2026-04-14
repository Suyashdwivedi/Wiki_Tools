# Wikipedia Citation Generator (Chrome Extension)

![Icon](icon128.png)

A lightweight Chrome Extension that allows you to instantly generate Wikipedia-style citations for any webpage with a single click.

Developed by **Suyash Dwivedi**

---

## 🚀 Features

- 📝 Floating citation button on every webpage  
- ⚡ One-click citation generation  
- 📋 Automatically copies citation to clipboard  
- 🔊 Audio feedback on success  
- 📅 Smart date formatting (YYYY-MM-DD → DD Month YYYY)  
- 🔗 Uses Citer Toolforge for reliable citation generation  
- 🎨 Clean and minimal UI  

---

## 🧩 How It Works

1. Open any webpage  
2. Click the floating **📝 button**  
3. The extension:
   - Fetches citation from Toolforge  
   - Extracts `{{cite web}}` format  
   - Formats the citation  
   - Wraps it inside `<ref>` tags  
4. Citation is automatically copied to your clipboard ✅  

---

## 📂 Project Structure

```
├── manifest.json
├── popup.html
├── content.js
├── content.css
├── icon16.png
├── icon48.png
└── icon128.png
```

---

## ⚙️ Installation (Developer Mode)

1. Download or clone this repository  
2. Open Chrome and go to:
   chrome://extensions/
3. Enable **Developer Mode** (top right)  
4. Click **Load unpacked**  
5. Select the project folder  

---

## 🔐 Permissions Used

- activeTab → Access current page URL  
- host_permissions →  
  - https://citer.toolforge.org/  
  - https://suyashdwivedi.github.io/  

---

## 🧠 Core Logic

The extension:

- Detects current page URL  
- Sends it to Toolforge Citer  
- Parses HTML response  
- Extracts `{{cite web}}`  
- Cleans and formats output  
- Copies to clipboard  
- Adds `<ref>` wrapper  

---

## 📸 Example Output

```html
<ref name="m123">{{cite web |url=... |title=... |date=12 January 2024 |access-date=14 April 2026}}</ref>
```

---

## ⚠️ Limitations

- Works best on standard article/news pages  
- Some websites may not return valid citations  
- Depends on Toolforge availability  

---

## 🛠️ Future Improvements

- Multi-citation formats (APA, MLA)  
- Custom ref naming  
- Citation preview popup  
- Wikipedia editor integration  
- Offline parsing support  

---

## 👨‍💻 Author

**Suyash Dwivedi**  
https://meta.wikimedia.org/wiki/User:Suyash.dwivedi  

---

## 📜 License

This project is licensed under the **CC BY-SA 4.0 License**.

---

## 🙌 Acknowledgements

- Wikimedia Toolforge (Citer)  
- Open web standards  
- Wikipedia community  
