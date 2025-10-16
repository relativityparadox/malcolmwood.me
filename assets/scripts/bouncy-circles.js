
const bg = document.getElementById('background-circles');

const circlesConfig = [
  { size: 150, color: '#ff001a' },
  { size: 150, color: '#d5ff00' },
  { size: 150, color: '#4ef2ed' },
  { size: 150, color: '#ff001a' },
  { size: 150, color: '#d5ff00' },
  { size: 150, color: '#4ef2ed' }
];

const circles = [];

circlesConfig.forEach(config => {
  const el = document.createElement('div');
  el.classList.add('bouncy-circle');
  el.style.width = `${config.size}px`;
  el.style.height = `${config.size}px`;
  el.style.backgroundColor = config.color;

  const maxX = window.innerWidth - config.size;
  const maxY = window.innerHeight - config.size;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  const dx = (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? -1 : 1);
  const dy = (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? -1 : 1);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  bg.appendChild(el);

  circles.push({ el, x, y, dx, dy, size: config.size });
});

function animate() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  circles.forEach(c => {
    c.x += c.dx;
    c.y += c.dy;

    const maxX = width - c.size;
    const maxY = height - c.size;

    if (c.x <= 0 || c.x >= maxX) c.dx *= -1;
    if (c.y <= 0 || c.y >= maxY) c.dy *= -1;

    c.el.style.left = `${c.x}px`;
    c.el.style.top = `${c.y}px`;
  });

  requestAnimationFrame(animate);
}

animate();