# MediaWiki Image Zoom CSS Script

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

This script adds a hover-based zoom effect to images in a MediaWiki instance using CSS. When users hover over an image, it enlarges smoothly while maintaining its aspect ratio. This effect enhances visual interaction for viewers without altering the original page layout.

**Author:** Suyash Dwivedi ([User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi))

## Features

- **Smooth transition**: Zooms images in and out with an easing effect for a natural user experience.
- **Responsive design**: Maintains the aspect ratio of images during zoom.
- **Z-index control**: Ensures zoomed images appear above other content without disrupting page flow.
- **Customizable scaling**: Easily adjust the zoom scale to your preference.

## How it Works

The script applies CSS styles that:
1. Set up a smooth transition for the `transform` and `z-index` properties of images.
2. Scale images to twice their size (`scale(2)`) when hovered.
3. Change the `z-index` of hovered images to ensure they appear on top of surrounding elements.

## Installation

### Step 1: Locate the MediaWiki CSS Page

1. Go to your MediaWiki instance.
2. Navigate to **MediaWiki:Common.css**.
   - This file applies CSS styles globally to all pages in your MediaWiki instance.

### Step 2: Add the CSS Code

Copy the following CSS code and paste it into your `Common.css` page:

```css
img {
    transition: transform 0.25s ease, z-index 0s ease; /* Smooth zoom transition and instant z-index change */
    z-index: 1; /* Default z-index for images */
    position: relative; /* Ensure z-index works */
}

img:hover {
    transform: scale(2); /* Scale up the image to 2x its size */
    z-index: 1000; /* Bring the zoomed image to the front */
}
```

## License

This project is licensed under the CC BY-SA 4.0 license.

## Attribution

Image by [Manavpreet Kaur, CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons.
