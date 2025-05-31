# ImageZoomify

## Overview
ImageZoomify is a user script that applies a zoom effect to images on Wikipedia. When you hover over an image, it will smoothly zoom in, enhancing the viewing experience.

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)  

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)  

## Installation

### Using the Script as a User Script
To use this script on Wikipedia, you need to add it to your `common.js` file on your Wikipedia user page. Follow the steps below:

1. **Navigate to Your `common.js` Page**:
   - Go to your Wikipedia user page. For example, `https://en.wikipedia.org/wiki/User:YourUsername/common.js`.

2. **Edit Your `common.js` Page**:
   - Add the following line to your `common.js` file to load the script:
     ```javascript
    mw.loader.load('//meta.wikimedia.org/w/index.php?title=User:Suyash.dwivedi/userscripts/ImageZoomify.css&action=raw&ctype=text/css', 'text/css');
     ```

3. **Save Your `common.js` Page**:
   - Save the changes to your `common.js` page.

4. **Clear Browser Cache**:
   - Clear your browser cache or do a hard refresh (press `Ctrl + F5`) to ensure the latest version of the script is loaded.

## How It Works
The script works by adding a CSS zoom effect to images on Wikipedia pages. When you hover over an image, it smoothly zooms in.

## Features
- **Smooth Zoom Effect on Hover**: The script provides a seamless zoom-in effect when you hover over images, enhancing the viewing experience.
- **Clean Look**: There is no overlay effect, maintaining a clean and unobtrusive appearance.
- **Easy Integration**: The script is easy to integrate into your Wikipedia user scripts by simply adding a line to your `common.js` file.

## License

This project is licensed under the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) license.

Feel free to open issues or contribute to the project on GitHub!

