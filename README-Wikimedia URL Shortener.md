# Wikimedia URL Shortener

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

This project provides a simple web interface to shorten URLs that link to Wikimedia projects (like Wikipedia, Wiktionary, Wikimedia Commons, etc.) using the Wikimedia URL Shortener API. 

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

## Features

- **Input Validation**: Ensures the URL input is not empty before sending a request.
- **Wikimedia URL Shortening**: Shortens URLs to Wikimedia project pages.
- **User-Friendly UI**: Simple, clean interface for entering long URLs and getting shortened ones.
- **Copy to Clipboard**: Allows the user to easily copy the shortened URL with a button click.
- **Error Handling**: Displays appropriate error messages in case of failure.

## Supported Domains

This tool supports URL shortening for the following Wikimedia projects:

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

No installation is required. Simply clone the repository and open the `index.html` file in any modern browser to use the URL Shortener.

```bash
git clone https://github.com/Suyashdwivedi/wikimedia-url-shortener.git
cd wikimedia-url-shortener
open index.html

## Usage

1. Open the webpage.
2. Enter a Wikimedia project URL in the input box.
3. Click the "Shorten URL" button.
4. The shortened URL will be displayed. You can click the "Copy Shortened URL" button to copy it to your clipboard.

## Example

Here's a sample screenshot of the tool in action:

![Wikimedia URL Shortener Screenshot](screenshot.png)

## Components Used

- **HTML**: For the structure of the page.
- **CSS**: For styling the elements, providing a clean, responsive design.
- **JavaScript**: To handle user interaction, API requests, and copy functionality.
- **Wikimedia API**: The backend service used to generate shortened URLs.

## License

This project is licensed under the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) license.

## Attribution

Image by [Manavpreet Kaur, CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons.
