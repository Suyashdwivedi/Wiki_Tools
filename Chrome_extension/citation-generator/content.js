// Create the floating button
let button = null;
let isGenerating = false;

function createButton() {
  if (button) return;
  
  button = document.createElement('button');
  button.id = 'wiki-cite-btn';
  button.innerHTML = '📝';
  button.title = 'Generate Wikipedia Citation - by Suyash Dwivedi';
  
  document.body.appendChild(button);
  
  button.addEventListener('click', generateCitation);
}

async function generateCitation() {
  if (isGenerating) return;
  
  isGenerating = true;
  const originalText = button.innerHTML;
  button.innerHTML = '⏳';
  button.disabled = true;
  
  try {
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const citerUrl = `https://citer.toolforge.org/?user_input=${encodedUrl}`;
    
    // Fetch citation from Citer
    const response = await fetch(citerUrl);
    const html = await response.text();
    
    // Parse the HTML to extract citation
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all textareas and look for the web citation
    const textareas = doc.querySelectorAll('textarea');
    let citation = '';
    
    // Look for {{cite web specifically
    for (const textarea of textareas) {
      const content = textarea.value || textarea.textContent;
      if (content.includes('{{cite web')) {
        citation = content;
        break;
      }
    }
    
    // If not found in textareas, try other elements
    if (!citation) {
      const allElements = doc.querySelectorAll('textarea, pre, code, div');
      for (const element of allElements) {
        const content = element.value || element.textContent;
        if (content.includes('{{cite web')) {
          citation = content;
          break;
        }
      }
    }
    
    // If still not found, search in the entire body
    if (!citation) {
      const bodyText = doc.body.textContent;
      const lines = bodyText.split('\n');
      for (const line of lines) {
        if (line.includes('{{cite web')) {
          citation = line.trim();
          break;
        }
      }
    }
    
    if (!citation) {
      throw new Error('Could not extract citation from Citer response. The page might not be supported.');
    }
    
    // Clean up the citation
    citation = citation.trim();
    citation = citation.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    
    // Extract only the {{cite web}} part if there are multiple lines
    const lines = citation.split('\n');
    for (const line of lines) {
      if (line.includes('{{cite web')) {
        citation = line.trim();
        break;
      }
    }
    
    // Remove leading asterisk and spaces if present
    citation = citation.replace(/^\*\s*/, '').trim();
    
    // Convert date format from YYYY-MM-DD to DD Month YYYY
    citation = citation.replace(/date=(\d{4})-(\d{2})-(\d{2})/g, (match, year, month, day) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = months[parseInt(month) - 1];
      return `date=${parseInt(day)} ${monthName} ${year}`;
    });
    
    // Convert access-date format as well
    citation = citation.replace(/access-date=(\d{4})-(\d{2})-(\d{2})/g, (match, year, month, day) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = months[parseInt(month) - 1];
      return `access-date=${parseInt(day)} ${monthName} ${year}`;
    });
    
    // Generate a random ref name (m + random number)
    const refName = 'm' + Math.floor(Math.random() * 1000);
    
    // Wrap in ref tags
    citation = `<ref name="${refName}">${citation}</ref>`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(citation);
    
    // Play sound
    try {
      const audio = new Audio('https://suyashdwivedi.github.io/alert.mp3');
      audio.volume = 0.5;
      await audio.play();
      console.log('Sound played successfully!');
    } catch (error) {
      console.log('Could not play sound:', error);
    }
    
    // Show success
    button.innerHTML = '✓';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
    
  } catch (error) {
    console.error('Citation error:', error);
    button.innerHTML = '✗';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  } finally {
    isGenerating = false;
    button.disabled = false;
  }
}

// Create button on page load
createButton();