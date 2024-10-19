// Author Information
// Author: Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)

// Scroll to Top and Scroll to Bottom Buttons Implementation
$(document).ready(function() {
    // Create the Scroll to Bottom Button
    var scrollButtonBottom = $('<button id="scrollToBottom" style="position:fixed; top:20px; left:20px; z-index:1000; background-color:#007BFF; color:white; border:none; border-radius:5px; padding:10px; font-size:16px; cursor:pointer; opacity: 1;">▼</button>');
    $('body').append(scrollButtonBottom);

    // Create the Scroll to Top Button
    var scrollButtonTop = $('<button id="scrollToTop" style="position:fixed; bottom:20px; left:20px; z-index:1000; background-color:#007BFF; color:white; border:none; border-radius:5px; padding:10px; font-size:16px; cursor:pointer; opacity: 1;">▲</button>');
    $('body').append(scrollButtonTop);

    // Action: Scroll to the bottom of the page when clicked
    $('#scrollToBottom').click(function() {
        $('html, body').animate({ scrollTop: $(document).height() }, 'slow');
    });

    // Action: Scroll to the top of the page when clicked
    $('#scrollToTop').click(function() {
        $('html, body').animate({ scrollTop: 0 }, 'slow');
    });

    // Function to reduce opacity after 2 seconds
    function reduceOpacityAfterDelay() {
        setTimeout(function() {
            scrollButtonTop.css('opacity', 0.25);
            scrollButtonBottom.css('opacity', 0.25);
        }, 2000); // 2 seconds
    }

    // Timeout variable to store the setTimeout reference
    var hideTimeout;

    // Show buttons with full opacity when hovered, reduce opacity after 2 seconds
    $('#scrollToTop, #scrollToBottom').mouseenter(function() {
        // Clear any previous timeout to prevent premature opacity reduction
        clearTimeout(hideTimeout);

        // Set opacity to 1 (fully visible)
        $(this).css('opacity', 1);

        // Set a timeout to reduce opacity after 2 seconds
        hideTimeout = setTimeout(function() {
            scrollButtonTop.css('opacity', 0.25);
            scrollButtonBottom.css('opacity', 0.25);
        }, 2000);
    });

    // Ensure buttons become fully visible when the mouse leaves and enters again
    $('#scrollToTop, #scrollToBottom').mouseleave(function() {
        // After leaving the button, still trigger the opacity reduction after the delay
        hideTimeout = setTimeout(function() {
            scrollButtonTop.css('opacity', 0.25);
            scrollButtonBottom.css('opacity', 0.25);
        }, 2000);
    });

    // Image Carousel Functionality
    var currentIndex = 0;
    var images = $('.carousel-image');

    // Initially hide all images and show the first one
    images.hide().eq(currentIndex).show();

    // Next button: Show the next image in the carousel
    $('#next').click(function() {
        images.eq(currentIndex).hide();
        currentIndex = (currentIndex + 1) % images.length;  // Loop back to the first image after the last
        images.eq(currentIndex).fadeIn('slow');
    });

    // Previous button: Show the previous image in the carousel
    $('#prev').click(function() {
        images.eq(currentIndex).hide();
        currentIndex = (currentIndex - 1 + images.length) % images.length;  // Loop back to the last image after the first
        images.eq(currentIndex).fadeIn('slow');
    });
});
