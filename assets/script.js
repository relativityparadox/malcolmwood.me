async function importLinks(url) {
  try {
    const response = await fetch(url);
    const htmlText = await response.text();

    const tempDoc = new DOMParser().parseFromString(htmlText, 'text/html');
    const linkElements = tempDoc.querySelectorAll('link');

    linkElements.forEach(link => {
      document.head.appendChild(link.cloneNode(true));
    });
  } catch (error) {
    console.error('Failed to import links:', error);
  }
}

async function importDiv(id, filePath) {
  const container = document.getElementById(id);
  if (!container) {
    console.warn(`No element with id="${id}" found to import content.`);
    return;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const html = await response.text();

    container.innerHTML = html;
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error);
  }
}

importLinks('/assets/universal-data.html');

importDiv("universal-navbar", "/universal-navbar.html");
importDiv("universal-footer", "/universal-footer.html");