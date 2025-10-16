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

// DYNAMIC GRADIENT FOR 404 SVG
// This will replace <img.error-404-illustration> with an inlined SVG,
// insert a full-size rect that uses a radialGradient, and update the
// gradient center on pointer move so it lies in the same direction from
// the viewport center as the pointer but at half the distance.
(function setup404SvgGradient() {
  const img = document.querySelector('img.error-404-illustration');
  if (!img) return; // nothing to do on other pages

  async function inlineSvg() {
    try {
      const src = img.getAttribute('src');
      const res = await fetch(src);
      if (!res.ok) throw new Error('SVG fetch failed: ' + res.status);
      const svgText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) throw new Error('No <svg> found in file');

      // Make sure the inlined svg is safe to insert into the current doc
      svg.removeAttribute('xmlns:xlink');

      // Read viewBox to size the background rect
      const viewBox = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      const vbWidth = viewBox[2] || svg.clientWidth || 960;
      const vbHeight = viewBox[3] || svg.clientHeight || 400;

      // Create defs and radialGradient
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      // Remove existing dynamic gradient if present
      const existing = defs.querySelector('#dynamic-404-gradient');
      if (existing) existing.remove();

      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      grad.setAttribute('id', 'dynamic-404-gradient');
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      // initial values will be updated on pointer move
      grad.setAttribute('cx', vbWidth / 2);
      grad.setAttribute('cy', vbHeight / 2);
      grad.setAttribute('r', Math.max(vbWidth, vbHeight) * 0.8);

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');

      // read CSS vars for the colors (fallback to hard-coded colors)
      const rootStyles = getComputedStyle(document.documentElement);
      const bright = (rootStyles.getPropertyValue('--bright') || '#42d1ff').trim();
      const medium = (rootStyles.getPropertyValue('--medium-dark') || '#054459').trim();

      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', bright);
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', medium);

      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);

  // Preserve the original image's classes on the inlined SVG so CSS can target it
  const originalClass = img.getAttribute('class');
  if (originalClass) svg.setAttribute('class', originalClass);

  // Replace the <img> with the inlined svg in the document
  img.parentNode.replaceChild(document.importNode(svg, true), img);

      // After insertion, find the new gradient element and the svg DOM node
      const insertedSvg = document.querySelector('svg');
      const insertedDefs = insertedSvg.querySelector('defs');
      const dynamicGrad = insertedDefs.querySelector('#dynamic-404-gradient');

      // Find the letter shapes and apply the gradient as their fill.
      // Heuristic: SVG paths that were originally filled with the light gray
      // color (#d9d9d9). If none found, fall back to the first three paths.
      let letterPaths = Array.from(insertedSvg.querySelectorAll('path[fill="#d9d9d9"]'));
      if (letterPaths.length === 0) {
        const allPaths = Array.from(insertedSvg.querySelectorAll('path'));
        letterPaths = allPaths.slice(0, 3);
      }
      letterPaths.forEach(p => p.setAttribute('fill', 'url(#dynamic-404-gradient)'));

      // Helper to update gradient center based on pointer coords
      let rafPending = false;
      let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      function updateGradientToPointer(pointerX, pointerY) {
        // viewport center
        const cxViewport = window.innerWidth / 2;
        const cyViewport = window.innerHeight / 2;

        // vector from center to pointer
        const dx = pointerX - cxViewport;
        const dy = pointerY - cyViewport;

        // target point is half the distance in the same direction
        const targetX = cxViewport + dx * 0.5;
        const targetY = cyViewport + dy * 0.5;

        // Convert viewport coordinates to SVG user coordinates taking into
        // account how the SVG is scaled when rendered.
        const svgRect = insertedSvg.getBoundingClientRect();
        const viewBoxParts = (insertedSvg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
        const vbX = viewBoxParts[0] || 0;
        const vbY = viewBoxParts[1] || 0;
        const vbW = viewBoxParts[2] || vbWidth;
        const vbH = viewBoxParts[3] || vbHeight;

        const scaleX = vbW / svgRect.width;
        const scaleY = vbH / svgRect.height;

        const userX = (targetX - svgRect.left) * scaleX + vbX;
        const userY = (targetY - svgRect.top) * scaleY + vbY;

        dynamicGrad.setAttribute('cx', userX);
        dynamicGrad.setAttribute('cy', userY);
      }

      function onPointerMove(e) {
        const pointerX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || lastPointer.x;
        const pointerY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || lastPointer.y;
        lastPointer.x = pointerX; lastPointer.y = pointerY;

        if (rafPending) return;
        rafPending = true;
        window.requestAnimationFrame(() => {
          updateGradientToPointer(pointerX, pointerY);
          rafPending = false;
        });
      }

      // initialize gradient position to center (no pointer movement yet)
      updateGradientToPointer(lastPointer.x, lastPointer.y);

      // Listen for pointer moves on the window (works for mouse and touch)
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });

      // Update when resizing or scrolling as svg position changes
      window.addEventListener('resize', () => updateGradientToPointer(lastPointer.x, lastPointer.y));
      window.addEventListener('scroll', () => updateGradientToPointer(lastPointer.x, lastPointer.y));

    } catch (err) {
      console.error('Failed to inline 404 SVG and setup gradient:', err);
    }
  }

  inlineSvg();
})();