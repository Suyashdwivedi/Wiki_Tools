# Megapixel Hover Userscript for MediaWiki

![Wiki's Lazy Coders](https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Wiki%27s_Lazy_Coders.png/180px-Wiki%27s_Lazy_Coders.png)

This userscript adds a visual overlay when hovering over any image on MediaWiki pages (including Wikimedia Commons, Wikipedia, etc.). The overlay displays the image's resolution in **megapixels (MP)**, which is especially useful when evaluating images for contests like **Wiki Loves Monuments (WLM)**, **Wiki Loves Earth (WLE)**, or **Quality Image nominations**.

---

## 📖 Read the Full Story

Curious about how image megapixels are calculated and why they really matter for creators, editors, and everyday users?

👉 <a href="https://medium.com/@SuyashWiki/how-to-easily-calculate-image-megapixels-and-why-it-matters-b53777e44594" target="_blank"><strong>Read the full article on Medium</strong></a>

This post breaks it down with examples, visuals, and a simple formula you can use in seconds.

---

## 🌐 Web Tool Also Available

Don't want to install a userscript? You can also check image megapixels directly from your browser using the web tool:

🔍 <strong>Upload an image</strong> or  
🌐 <strong>Paste an image URL</strong> at:  
👉 <a href="https://suyashdwivedi.github.io/megapixel-checker.html" target="_blank">https://suyashdwivedi.github.io/megapixel-checker.html</a>
---

## ✨ Features

- 🖱️ **Hover-based MP Tooltip**  
  Instantly shows megapixel value when you hover over any image.

- ⏳ **Emoji Loading Animation**  
  Displays a pulsing ⏳ emoji while calculating image dimensions.

- 🧠 **Smart Caching**  
  Each image is fetched and calculated **only once**, even on repeated hover.

- ⚡ **Metadata Optimization**  
  Uses `data-file-width` and `data-file-height` (when available) to avoid full image loading.

- 📄 **Static Badge on File Pages**  
  Displays permanent MP info below full-resolution images on file description pages.

- 📍 **Follows Mouse Pointer**  
  Tooltip follows your cursor for intuitive viewing.

- 🧩 **Supports All Pages**  
  Works in:
  - File pages
  - Categories
  - Popups (MediaViewer, PagePreviews)
  - Special:ListFiles
  - Galleries & dynamic content

- 🌓 **Dark Tooltip Design**  
  Dark translucent background ensures visibility on all page types.

---

## 🔧 Installation Instructions

1. Visit your global JavaScript page:  
   [`meta:Special:MyPage/global.js`](https://meta.wikimedia.org/wiki/Special:MyPage/global.js)

2. Add this line:

   ```js
   mw.loader.load('//meta.wikimedia.org/w/index.php?title=User:Suyash.dwivedi/userscripts/mp-hover.js&action=raw&ctype=text/javascript');
Save the page, then refresh any Commons or Wikipedia page.

🔍 Example
Hovering this image:
<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/A_basket_of_fruits.jpg/500px-A_basket_of_fruits.jpg" target="_blank alt="A basket of fruits" />
  <br>
  <em>A basket of fruits</em><br>
  <small>
    Image by <a href="https://meta.wikimedia.org/wiki/User:Suyash.dwivedi">Suyash Dwivedi</a>,
    <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, via 
    <a href="https://commons.wikimedia.org/wiki/File:A_basket_of_fruits.jpg">Wikimedia Commons</a>
  </small>
</p>

💡 Will first show:

⏳ (emoji pulse)

Then switch to:

**This is 8.76 MP Image**

---

👨‍💻 Author
Suyash Dwivedi
<a href="https://meta.wikimedia.org/wiki/User:Suyash.dwivedi">User:Suyash.dwivedi</a>


🪪 License
This script is licensed under Creative Commons Attribution-ShareAlike 4.0
