import './style.css';

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ===== HERO CANVAS — CIRCUIT NODES =====
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];
let animFrame;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function createNodes() {
  const count = Math.floor((canvas.width * canvas.height) / 18000);
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.5,
    cyan: Math.random() > 0.5,
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cyanColor = 'rgba(0, 245, 255,';
  const purpleColor = 'rgba(191, 95, 255,';

  nodes.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = n.cyan ? `${cyanColor} 0.6)` : `${purpleColor} 0.5)`;
    ctx.fill();
  });

  const maxDist = 140;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.25;
        const col = nodes[i].cyan ? cyanColor : purpleColor;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `${col} ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  animFrame = requestAnimationFrame(drawCanvas);
}

function initCanvas() {
  resizeCanvas();
  createNodes();
  cancelAnimationFrame(animFrame);
  drawCanvas();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createNodes();
}, { passive: true });

initCanvas();

// ===== COUNTER ANIMATION =====
function formatNumber(n) {
  if (n >= 1000) {
    return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace('.0', '') + 'K';
  }
  return n.toString();
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = formatNumber(current) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ===== INTERSECTION OBSERVER =====
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== COUNTER OBSERVER =====
const counterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ===== HUD BAR OBSERVER =====
const barObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.hud-bar__fill').forEach(fill => {
        const w = fill.dataset.width;
        fill.style.width = w + '%';
      });
      barObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.3 }
);

const hudPanel = document.querySelector('.hud-panel');
if (hudPanel) barObserver.observe(hudPanel);

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const offset = 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
