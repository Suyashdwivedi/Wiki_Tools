# MediaWiki Sidebar Toggle Button

This project adds a toggle button to the **MediaWiki Vector Legacy (2010)** skin, allowing users to show or hide the sidebar. The button remembers the state (whether the sidebar is visible or hidden) even after refreshing the page, and it changes its background color to orange.

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

## Features

- **Sidebar Toggle**: Add a button to the top-left of the page to **show or hide** the sidebar.
- **State Persistence**: The sidebar state (visible or hidden) is **remembered using `localStorage`**, so it persists even after page refreshes.
- **Button Appearance**: The button has an **orange background** and changes to **dark orange** when hovered over.

## Components Needed

- **MediaWiki** running the **Vector Legacy (2010)** skin.
- **JavaScript** and **CSS** modifications to enable the toggle button functionality.
- Use:Sidebar Toggle Button.JS
- Sidebar Toggle Button.css

## Setup Instructions

1. **Add JavaScript Code** to `MediaWiki:Common.js` (for global use) or `User:YourUsername/common.js` (for personal use).
2. **Add CSS Code** to `MediaWiki:Common.css` (for global use) or `User:YourUsername/common.css` (for personal use).
3. **Save and Refresh** the page to see the changes take effect.

## Usage

- **Toggle Sidebar**: The **"Toggle Sidebar"** button will appear at the top-left of the page.
  - Clicking the button will **toggle the visibility** of the sidebar.
  - The sidebar state (visible or hidden) will be remembered across page refreshes.
  - The button will change text to **"Hide Sidebar"** or **"Show Sidebar"** based on the current state.

## License

This project is licensed under the **CC BY-SA 4.0** license.
