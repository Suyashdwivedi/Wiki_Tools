# Scroll to Top and Bottom Buttons with Image Carousel - ScrollAndView

This project implements 'Scroll to Top' and 'Scroll to Bottom' buttons on a webpage, with a fade effect after 2 seconds of inactivity. It also includes an image carousel with 'Next' and 'Previous' buttons to cycle through images.

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

## Features

- **Scroll to Top/Bottom**: 
  - Buttons for smooth scrolling to the top or bottom of a page.
  - Fade to 25% opacity after 2 seconds of inactivity.
  - Restores full visibility when hovered.

- **Image Carousel**: 
  - Allows navigation through images with 'Next' and 'Previous' buttons.
  - Images are smoothly faded in and out during navigation.

## Implementation Overview

### 1. Scroll to Top/Bottom Buttons

- The buttons are dynamically created and positioned using JavaScript.
- After 2 seconds of inactivity, the buttons fade to 25% opacity but return to full opacity when hovered.
- Clicking on the buttons scrolls the page smoothly to the top or bottom.

### 2. Image Carousel

- The carousel hides all images except for the current one.
- Users can navigate between images using 'Next' and 'Previous' buttons, with a smooth fade effect between images.

## Installation as a MediaWiki User Script

### Step 1: Create Your User Script Page

1. Go to your MediaWiki instance.
2. Navigate to your user-specific JavaScript page:  
   `https://www.your_wiki_instance.org/wiki/User:YourUsername/common.js`
   - This page allows you to add custom JavaScript that will run for your user across the wiki.

### Step 2: Add the Functionality

- **Scroll Buttons**: Implement dynamic buttons that appear for scrolling to the top or bottom of the page. Set them to fade after inactivity and return to full opacity on hover.
  
- **Image Carousel**: Include functionality for an image carousel, where users can navigate through images with 'Next' and 'Previous' buttons.

### Step 3: Save the Changes

Once you add the script to your `common.js` page and save, both the scroll buttons and image carousel will be active on your MediaWiki instance.
