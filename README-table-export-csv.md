# Export MediaWiki Tables to CSV with Preview

**Author:** [Suyash Dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)  
**Script Name:** `table-export-csv.js`

---

## Description

This user script adds convenient **"Export CSV"** buttons above each table on MediaWiki pages. It allows users to export individual or all tables as CSV files, with a preview window before downloading.

---

## Features

- "Export CSV" button above every `wikitable` and `sortable` table
- "Export All Tables" button at the top of the page content
- Preview CSV in a new window before download
- Bold, styled **Download CSV** button in preview popup
- Fully compatible with Wikimedia projects via `global.js`

---

## Installation

To use this script on Wikimedia projects:

1. Open your global.js page:  
   [https://meta.wikimedia.org/wiki/Special:MyPage/global.js](https://meta.wikimedia.org/wiki/Special:MyPage/global.js)

2. Add the following line:

   ```js
   mw.loader.load('//meta.wikimedia.org/user:Suyash.dwivedi/userscripts/table-export-csv.js');
