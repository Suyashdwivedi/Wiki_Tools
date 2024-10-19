# Scroll to Top and Bottom Buttons with Image Carousel

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)

This project implements 'Scroll to Top' and 'Scroll to Bottom' buttons on a webpage. The buttons will fade to 25% opacity after 2 seconds of inactivity and will fully reappear when hovered over. Additionally, it includes an image carousel with 'Next' and 'Previous' buttons to cycle through images.

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

## Features

- **Scroll to Top/Bottom**: 
  - Scroll to the top or bottom of the page using respective buttons.
  - The buttons fade to 25% opacity after 2 seconds of inactivity.
  - Hovering over the buttons restores full visibility.
  
- **Image Carousel**:
  - Navigate through images using 'Next' and 'Previous' buttons.
  - Images are faded in and out as you navigate between them.

## Implementation Details

- **Opacity Control**: The scroll buttons are fully visible when hovered over and fade to 25% opacity after 2 seconds of inactivity using a `setTimeout` function.
  
- **Image Carousel**: The image carousel hides all images except the current one. Clicking 'Next' or 'Previous' buttons cycles through the images.

### 1. Scroll to Top/Bottom Buttons

The buttons are created dynamically and positioned on the page using `jQuery`. They are set to fade to 25% opacity after 2 seconds and restore to full opacity when hovered over.

```javascript
var scrollButtonTop = $('<button id="scrollToTop" style="position:fixed; bottom:20px; left:20px; z-index:1000; background-color:#007BFF; color:white; border:none; border-radius:5px; padding:10px; font-size:16px; cursor:pointer; opacity: 1;">▲</button>');
var scrollButtonBottom = $('<button id="scrollToBottom" style="position:fixed; top:20px; left:20px; z-index:1000; background-color:#007BFF; color:white; border:none; border-radius:5px; padding:10px; font-size:16px; cursor:pointer; opacity: 1;">▼</button>');
```

- The buttons use `.animate()` to scroll the page smoothly to the top or bottom:
  
```javascript
$('html, body').animate({ scrollTop: 0 }, 'slow');  // Scroll to top
$('html, body').animate({ scrollTop: $(document).height() }, 'slow');  // Scroll to bottom
```

- The opacity of the buttons fades to 25% after 2 seconds of inactivity:
  
```javascript
setTimeout(function() {
    scrollButtonTop.css('opacity', 0.25);
    scrollButtonBottom.css('opacity', 0.25);
}, 2000);
```

### 2. Image Carousel

The carousel functionality allows users to navigate through images by clicking 'Next' or 'Previous' buttons. It uses the `fadeIn` and `hide` methods to display images smoothly.

```javascript
var currentIndex = 0;
var images = $('.carousel-image');

images.hide().eq(currentIndex).show();

$('#next').click(function() {
    images.eq(currentIndex).hide();
    currentIndex = (currentIndex + 1) % images.length;
    images.eq(currentIndex).fadeIn('slow');
});
```

## License

This project is licensed under the CC BY-SA 4.0 license.

## Attribution

Image by [Manavpreet Kaur, CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons.
