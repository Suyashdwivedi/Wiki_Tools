// ==UserScript==
/* 
  Zoom effect for images
  Author: Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
*/
// ==/UserScript==

(function() {
    'use strict';

    // CSS for zoom effect
    const css = `
    /* Zoom container - ensures that the image container is positioned relative to its normal position */
    .img-zoom-container {
      position: relative;
    }

    /* Remove overlay effect - makes the overlay transparent */
    .img-zoom-overlay {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background-color: rgba(0, 0, 0, 0); /* Transparent background */
      opacity: 0;
      transition: opacity 0.25s;
    }

    /* Zoom image - adds a smooth transition effect to the image */
    .img-zoom-container img {
      width: 100%;
      transition: transform 0.25s;
    }

    /* Zoom effect - scales the image when hovered over */
    .img-zoom-container:hover img {
      transform: scale(2);
    }

    /* Keep overlay invisible - maintains the transparency when the container is hovered over */
    .img-zoom-container:hover .img-zoom-overlay {
      opacity: 0;
    }
    `;
    
    // Create a <style> element to hold the CSS
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    // Adding the zoom container class to all images
    document.querySelectorAll('img').forEach(img => {
        // Create a container <div> element and add the 'img-zoom-container' class
        const container = document.createElement('div');
        container.classList.add('img-zoom-container');

        // Insert the container before the image and move the image inside the container
        img.parentNode.insertBefore(container, img);
        container.appendChild(img);

        // Create an overlay <div> element and add the 'img-zoom-overlay' class
        const overlay = document.createElement('div');
        overlay.classList.add('img-zoom-overlay');
        
        // Append the overlay to the container
        container.appendChild(overlay);
    });

})();
