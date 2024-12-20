# Wikimedia URL Shortener

This project provides a simple web interface to shorten URLs that link to Wikimedia projects (such as Wikipedia, Wikimedia Commons, etc.) using the Wikimedia URL Shortener API. (It needs to be updated as its not functioning properly)

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

## Features

- **Input Validation**: Ensures the URL is a valid Wikimedia project link before shortening.
- **URL Shortening**: Generates short URLs for Wikimedia pages using the Wikimedia URL Shortener API.
- **Copy to Clipboard**: Users can copy the shortened URL directly with a button click.
- **Error Handling**: Displays user-friendly error messages in case of invalid input or API failure.
- **Simple Interface**: Clean and easy-to-use interface for quickly shortening URLs.

## Supported Wikimedia Domains

This tool supports shortening URLs from the following Wikimedia projects:

- `*.wikipedia.org`
- `*.wiktionary.org`
- `*.wikibooks.org`
- `*.wikinews.org`
- `*.wikiquote.org`
- `*.wikisource.org`
- `*.wikiversity.org`
- `*.wikivoyage.org`
- `*.wikimedia.org`
- `*.wikidata.org`
- `*.wikifunctions.org`
- `*.mediawiki.org`

## Installation

No installation is necessary. To use the tool, simply clone the repository and open the `index.html` file in a modern browser.

```bash
git clone https://github.com/Suyashdwivedi/wikimedia-url-shortener.git
cd wikimedia-url-shortener
open index.html
```

## Usage Instructions

### 1. Shortening Wikimedia URLs

1. Open the webpage in your browser.
2. Enter a valid Wikimedia project URL (such as a Wikipedia article URL) in the input box.
3. Click the "Shorten URL" button.
4. The shortened URL will appear below the input box.
5. You can click the "Copy Shortened URL" button to easily copy it to your clipboard for sharing.

### 2. MediaWiki User Script

To use this tool as a MediaWiki User Script, follow these steps:

1. Go to your MediaWiki user JavaScript page, for example:  
   `https://your-wiki-instance.org/wiki/User:YourUsername/common.js`
   
2. Add the code for URL shortening functionality by integrating the script with your MediaWiki instance.

3. After adding the script, you can use the URL shortener directly in your MediaWiki interface for quick shortening of Wikimedia project URLs.

## License

This project is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0).
