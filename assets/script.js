// IMPORT UNIVERSAL LINKS AND DIVS

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

    // notify consumers that the universal navbar has been loaded
    if (id === "universal-navbar") {
      window.dispatchEvent(new Event('universal-navbar-loaded'));
    }
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error);
  }
}

importLinks('/assets/universal-data.html');

importDiv("universal-navbar", "/assets/universal-navbar.html");
importDiv("universal-footer", "/assets/universal-footer.html");

// MOBILE NAVBAR MENU TOGGLE
window.addEventListener('universal-navbar-loaded', () => {
  const navbar = document.querySelector('.navbar');
  const toggle = document.getElementById('nav-toggle') || document.querySelector('.nav-toggle');
  if (!navbar || !toggle) return;

  function expandNavbar() {
    navbar.classList.remove('normal');
    navbar.classList.add('expanded');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function collapseNavbar() {
    navbar.classList.remove('expanded');
    navbar.classList.add('normal');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', (e) => {
    if (navbar.classList.contains('expanded')) {
      collapseNavbar();
    } else {
      expandNavbar();
    }
    e.stopPropagation();
  });

  // close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.classList.contains('expanded')) return;
    if (!navbar.contains(e.target)) {
      collapseNavbar();
    }
  });

  // close when resizing back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 700 && navbar.classList.contains('expanded')) {
      collapseNavbar();
    }
  });
});