// ==UserScript==
// @name         Export MediaWiki Tables to CSV with Preview
// @description  Adds export buttons to tables on MediaWiki pages with preview and export-all option.
// @author       Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
// ==/UserScript==

(function () {
    'use strict';

    function tableToCSV(table) {
        let csv = [];
        for (let row of table.rows) {
            let cells = Array.from(row.cells).map(cell => {
                let text = cell.innerText.replace(/\n/g, ' ').trim();
                return `"${text.replace(/"/g, '""')}"`;
            });
            csv.push(cells.join(','));
        }
        return csv.join('\n');
    }

    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showPreviewAndDownload(csv, filename) {
        const preview = window.open("", "_blank", "width=800,height=600");
        preview.document.write(`
            <html>
            <head>
                <title>CSV Preview</title>
            </head>
            <body style="font-family: sans-serif; padding: 10px;">
                <button id="downloadBtn" style="
                    display: inline-block;
                    margin-bottom: 10px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: bold;
                    color: white;
                    background-color: #007bff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">⬇ Download CSV</button>
                <h2 style="color: #3366cc; font-weight: bold; margin-top: 5px;">CSV Preview</h2>
                <pre style="background: #f8f9fa; padding: 10px; border: 1px solid #ccc; white-space: pre-wrap;">${csv.replace(/</g, "&lt;")}</pre>
            </body>
            </html>
        `);
        preview.document.close(); // Ensure all content is fully written before adding events
        preview.document.getElementById("downloadBtn").addEventListener("click", () => {
            preview.close();
            downloadCSV(csv, filename);
        });
    }

    function addExportButtons() {
        const tables = document.querySelectorAll('table.wikitable, table.sortable');
        const allTables = [];

        tables.forEach((table, index) => {
            const btn = document.createElement('button');
            btn.innerText = 'Export CSV';
            btn.title = 'Download this table as CSV';
            btn.style.margin = '5px';
            btn.style.padding = '5px 10px';
            btn.style.fontSize = '13px';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '#e2f0d9';
            btn.style.border = '1px solid #8bc34a';
            btn.style.borderRadius = '4px';
            btn.style.color = '#2e7d32';

            btn.addEventListener('click', () => {
                const csv = tableToCSV(table);
                const title = document.title.split(' - ')[0].replace(/[\\/:*?"<>|]/g, '_');
                const filename = `${title}_table_${index + 1}.csv`;
                showPreviewAndDownload(csv, filename);
            });

            table.parentNode.insertBefore(btn, table);
            allTables.push({ table, index });
        });

        if (allTables.length > 0) {
            const allBtn = document.createElement('button');
            allBtn.innerText = '⬇ Export All Tables';
            allBtn.title = 'Download all tables on this page as separate CSV files';
            allBtn.style.margin = '10px 0';
            allBtn.style.padding = '8px 16px';
            allBtn.style.fontSize = '15px';
            allBtn.style.fontWeight = 'bold';
            allBtn.style.cursor = 'pointer';
            allBtn.style.backgroundColor = '#cfe2ff';
            allBtn.style.border = '1px solid #6ea8fe';
            allBtn.style.borderRadius = '6px';
            allBtn.style.color = '#084298';
            allBtn.style.display = 'inline-block';

            allBtn.addEventListener('click', () => {
                const title = document.title.split(' - ')[0].replace(/[\\/:*?"<>|]/g, '_');
                allTables.forEach(({ table, index }) => {
                    const csv = tableToCSV(table);
                    const filename = `${title}_table_${index + 1}.csv`;
                    downloadCSV(csv, filename);
                });
            });

            const content = document.querySelector('#bodyContent') || document.body;
            const heading = content.querySelector('h1, h2, h3, h4') || content.firstChild;
            content.insertBefore(allBtn, heading);
        }
    }

    if (document.readyState === 'complete') {
        addExportButtons();
    } else {
        window.addEventListener('load', addExportButtons);
    }
})();
