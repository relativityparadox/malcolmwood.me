async function injectLinksFromHTML(url) {
  try {
    const response = await fetch(url);
    const htmlText = await response.text();

    const tempDoc = new DOMParser().parseFromString(htmlText, 'text/html');
    const linkElements = tempDoc.querySelectorAll('link');

    linkElements.forEach(link => {
      document.head.appendChild(link.cloneNode(true));
    });
  } catch (error) {
    console.error('Failed to inject links from HTML:', error);
  }
}


injectLinksFromHTML('/assets/universal-data.html');