/* 
  To create a toggle button that will enable or disable the sidebar
  Author: Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
*/
$(document).ready(function () {
    // Create the toggle button
    var toggleButton = $('<button>')
        .attr('id', 'toggle-sidebar')
        .text('Hide Sidebar') // Default button text
        .css({
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: '1000',
            backgroundColor: 'orange', // Initial orange background
            color: 'white',
            border: 'none',
            padding: '5px 15px',
            cursor: 'pointer',
            borderRadius: '5px',
        });

    // Append the button to the body
    $('body').append(toggleButton);

    // Function to update the button text and sidebar state
    function updateButtonState(isSidebarVisible) {
        if (isSidebarVisible) {
            $('#toggle-sidebar').text('Hide Sidebar');
            $('#mw-panel').show(); // Show the sidebar
            $('#content').css('margin-left', '12em'); // Adjust content margin for sidebar
        } else {
            $('#toggle-sidebar').text('Show Sidebar');
            $('#mw-panel').hide(); // Hide the sidebar
            $('#content').css('margin-left', '0'); // Remove margin when sidebar is hidden
        }
    }

    // Load the initial state from localStorage (default to true if not found)
    var isSidebarVisible = localStorage.getItem('sidebarVisible') !== 'false';

    // Apply the initial state
    updateButtonState(isSidebarVisible);

    // Click event to toggle the sidebar
    $('#toggle-sidebar').click(function () {
        isSidebarVisible = !isSidebarVisible; // Toggle the state
        localStorage.setItem('sidebarVisible', isSidebarVisible); // Save state to localStorage
        updateButtonState(isSidebarVisible); // Update the UI with the new state
    });
});
