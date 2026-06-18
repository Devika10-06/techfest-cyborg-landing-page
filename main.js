import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ===== RENDERER + SCENE =====
const canvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.018);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, window.innerWidth < 768 ? 9 : 6.5);

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0x050510, 4));

const cyanLight = new THREE.PointLight(0x00f5ff, 10, 22);
cyanLight.position.set(-3, 3, 6);
scene.add(cyanLight);

const purpleLight = new THREE.PointLight(0xbf5fff, 10, 22);
purpleLight.position.set(3, -2, 6);
scene.add(purpleLight);

const rimLight = new THREE.DirectionalLight(0x223366, 2.5);
rimLight.position.set(0, 8, -4);
scene.add(rimLight);

// ===== MATERIALS (shared) =====
const MAT = {
  dark:   new THREE.MeshStandardMaterial({ color: 0x0b0b1a, metalness: 0.92, roughness: 0.08 }),
  mid:    new THREE.MeshStandardMaterial({ color: 0x181825, metalness: 0.75, roughness: 0.2 }),
  grille: new THREE.MeshStandardMaterial({ color: 0x1a2233, metalness: 0.95, roughness: 0.04 }),
  cyan:   new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 0.9 }),
  purple: new THREE.MeshStandardMaterial({ color: 0xbf5fff, emissive: new THREE.Color(0xbf5fff), emissiveIntensity: 0.9 }),
  visor:  new THREE.MeshStandardMaterial({ color: 0x001426, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 0.1, transparent: true, opacity: 0.94 }),
  ring1:  new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 0.55, transparent: true, opacity: 0.72 }),
  ring2:  new THREE.MeshStandardMaterial({ color: 0xbf5fff, emissive: new THREE.Color(0xbf5fff), emissiveIntensity: 0.55, transparent: true, opacity: 0.52 }),
};

// ===== HELPERS =====
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function edges(geo, color, opacity = 0.25, x = 0, y = 0, z = 0) {
  const ls = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  ls.position.set(x, y, z);
  return ls;
}

function line(points, color, opacity = 0.85) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

// ===== CYBORG HEAD =====
function buildCyborgHead() {
  const g = new THREE.Group();

  // Head block
  const headGeo = new THREE.BoxGeometry(2.1, 2.5, 1.9);
  g.add(mesh(headGeo, MAT.dark));
  g.add(edges(headGeo, 0x00f5ff, 0.18));

  // Forehead plate
  const foreGeo = new THREE.BoxGeometry(1.65, 0.55, 0.12);
  g.add(mesh(foreGeo, MAT.mid, 0, 0.82, 0.97));

  // Forehead circuit traces
  g.add(line([[-0.76,0.94,1.06],[-0.22,0.94,1.06],[-0.22,0.74,1.06],[0.22,0.74,1.06],[0.22,0.94,1.06],[0.76,0.94,1.06]], 0x00f5ff));
  g.add(line([[-0.5,0.6,1.06],[-0.5,0.5,1.06],[-0.2,0.5,1.06]], 0x00f5ff, 0.6));
  g.add(line([[0.5,0.6,1.06],[0.5,0.5,1.06],[0.2,0.5,1.06]], 0x00f5ff, 0.6));

  // Visor background
  g.add(mesh(new THREE.BoxGeometry(1.92, 0.42, 0.16), MAT.visor, 0, 0.15, 0.93));

  // Left eye (cyan)
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.2, 0.12), MAT.cyan, -0.46, 0.15, 1.0));
  // Right eye (purple)
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.2, 0.12), MAT.purple, 0.46, 0.15, 1.0));

  // Scan line (will be animated)
  const scanMesh = mesh(new THREE.BoxGeometry(2.0, 0.022, 0.02), MAT.cyan.clone(), 0, 0, 0.97);
  scanMesh.material.emissiveIntensity = 2;
  scanMesh.name = 'scanLine';
  g.add(scanMesh);

  // Nose bridge
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.42, 0.13), MAT.mid, 0, -0.2, 0.96));

  // Mouth grille
  for (let i = 0; i < 7; i++) {
    g.add(mesh(new THREE.BoxGeometry(1.25, 0.07, 0.13), MAT.grille, 0, -0.62 + i * 0.105, 0.93));
  }
  // Grille frame
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.78, 0.1), MAT.dark, 0, -0.62, 0.88));

  // Ear plates
  const earGeo = new THREE.BoxGeometry(0.32, 0.95, 0.95);
  [-1.21, 1.21].forEach((x, i) => {
    g.add(mesh(earGeo, MAT.mid, x, 0.1, 0));
    g.add(edges(earGeo, i === 0 ? 0x00f5ff : 0xbf5fff, 0.18, x, 0.1, 0));
    // Ear indicator dots
    g.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), i === 0 ? MAT.cyan : MAT.purple, x * 1.1, 0.35, 0));
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), i === 0 ? MAT.purple : MAT.cyan, x * 1.1, 0.1, 0));
  });

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.38, 0.55, 0.65, 8);
  g.add(mesh(neckGeo, MAT.dark, 0, -1.57, 0));
  g.add(edges(neckGeo, 0x00f5ff, 0.15, 0, -1.57, 0));

  // Collar flares
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.18, 1.3), MAT.mid, 0, -1.98, 0));
  g.add(edges(new THREE.BoxGeometry(2.3, 0.18, 1.3), 0x00f5ff, 0.1, 0, -1.98, 0));

  // Antennas
  const antGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.9, 6);
  const antMat = new THREE.MeshStandardMaterial({ color: 0x7788aa, metalness: 1, roughness: 0.05 });
  [-0.72, 0.72].forEach((x, i) => {
    g.add(mesh(antGeo, antMat, x, 1.68, 0));
    const tipMat = i === 0 ? MAT.cyan : MAT.purple;
    g.add(mesh(new THREE.SphereGeometry(0.085, 10, 10), tipMat, x, 2.18, 0));
  });

  // Orbiting rings
  const r1 = mesh(new THREE.TorusGeometry(2.05, 0.028, 8, 96), MAT.ring1);
  r1.rotation.x = 0.28; r1.name = 'ring1';
  g.add(r1);

  const r2 = mesh(new THREE.TorusGeometry(2.55, 0.02, 8, 96), MAT.ring2);
  r2.rotation.x = -1.1; r2.rotation.z = 0.48; r2.name = 'ring2';
  g.add(r2);

  // Data particles orbiting the head
  const orbitGeo = new THREE.BufferGeometry();
  const orbitPos = new Float32Array(180);
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const r = 2.05 + (Math.random() - 0.5) * 0.5;
    const tiltX = 0.28 + (Math.random() - 0.5) * 0.4;
    orbitPos[i * 3]     = Math.cos(angle) * r;
    orbitPos[i * 3 + 1] = Math.sin(angle) * r * Math.sin(tiltX) + 0.2;
    orbitPos[i * 3 + 2] = Math.sin(angle) * r * Math.cos(tiltX);
  }
  orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
  const orbitPts = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
    color: 0x00f5ff, size: 0.06, transparent: true, opacity: 0.7, sizeAttenuation: true
  }));
  orbitPts.name = 'orbitPts';
  g.add(orbitPts);

  return g;
}

// ===== PARTICLE FIELD =====
function buildParticles() {
  const count = 2400;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 50;
    pos[i*3+1] = (Math.random() - 0.5) * 50;
    pos[i*3+2] = (Math.random() - 0.5) * 30 - 8;

    if (Math.random() > 0.5) {
      col[i*3]=0; col[i*3+1]=0.96; col[i*3+2]=1;        // cyan
    } else {
      col[i*3]=0.75; col[i*3+1]=0.37; col[i*3+2]=1;     // purple
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.045, vertexColors: true, transparent: true, opacity: 0.55, sizeAttenuation: true
  }));
}

// ===== GRID PLANE =====
function buildGrid() {
  const helper = new THREE.GridHelper(40, 40, 0x00f5ff, 0x001122);
  helper.material.transparent = true;
  helper.material.opacity = 0.06;
  helper.position.y = -4.5;
  return helper;
}

// ===== INIT SCENE =====
const cyborgHead = buildCyborgHead();
scene.add(cyborgHead);

const particles = buildParticles();
scene.add(particles);

scene.add(buildGrid());

// ===== SCROLL PROXY =====
// GSAP animates this proxy; render loop reads it
const proxy = { x: 0, y: 0.3, z: 0, rotX: 0, rotY: 0, scale: 1, camZ: camera.position.z };

// ===== MOUSE TRACKING =====
const mouse = { x: 0, y: 0 };
const mouseS = { x: 0, y: 0 }; // smoothed

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

// ===== GSAP SCROLL ANIMATIONS =====
// Hero -> About: head moves right, shrinks
gsap.to(proxy, {
  x: window.innerWidth < 768 ? 0 : 3,
  y: 0,
  z: -1.5,
  rotY: -0.7,
  scale: 0.68,
  ease: 'none',
  scrollTrigger: {
    trigger: '#about',
    start: 'top bottom',
    end: 'top 15%',
    scrub: 1.8,
  }
});

// About -> Events: head moves left and back
gsap.to(proxy, {
  x: window.innerWidth < 768 ? 0 : -3.2,
  y: -0.3,
  z: -3,
  rotY: 0.6,
  scale: 0.42,
  ease: 'none',
  scrollTrigger: {
    trigger: '#events',
    start: 'top bottom',
    end: 'top 15%',
    scrub: 1.8,
  }
});

// Events -> Footer: head fades to center/back
gsap.to(proxy, {
  x: 0,
  y: 0,
  z: -6,
  rotY: 0,
  scale: 0.3,
  ease: 'none',
  scrollTrigger: {
    trigger: '#footer',
    start: 'top bottom',
    end: 'top 30%',
    scrub: 2,
  }
});

// Camera subtle pull back on scroll
gsap.to(proxy, {
  camZ: (window.innerWidth < 768 ? 9 : 6.5) + 1.5,
  ease: 'none',
  scrollTrigger: {
    trigger: 'main',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 2,
  }
});

// ===== ANIMATION LOOP =====
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Smooth mouse
  mouseS.x += (mouse.x - mouseS.x) * 0.04;
  mouseS.y += (mouse.y - mouseS.y) * 0.04;

  // Idle micro animation
  const idleRotY = Math.sin(t * 0.35) * 0.12;
  const idleRotX = Math.sin(t * 0.22) * 0.04;
  const idleY = Math.sin(t * 0.45) * 0.06;

  // Mouse only affects in hero zone (scroll < 50% of first section)
  const heroInfluence = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.6));
  const mx = mouseS.x * 0.35 * heroInfluence;
  const my = mouseS.y * 0.25 * heroInfluence;

  // Apply proxy + idle + mouse to head
  cyborgHead.position.set(proxy.x + mx, proxy.y + idleY, proxy.z);
  cyborgHead.rotation.set(
    proxy.rotX + idleRotX + my,
    proxy.rotY + idleRotY + mx * 0.8,
    0
  );
  cyborgHead.scale.setScalar(proxy.scale);

  // Camera follow
  camera.position.z += (proxy.camZ - camera.position.z) * 0.06;
  camera.position.y += (-mouseS.y * 0.15 - camera.position.y) * 0.03;

  // Ring rotations
  const r1 = cyborgHead.getObjectByName('ring1');
  const r2 = cyborgHead.getObjectByName('ring2');
  if (r1) r1.rotation.y = t * 0.55;
  if (r2) r2.rotation.y = -t * 0.35;

  // Orbit particles
  const op = cyborgHead.getObjectByName('orbitPts');
  if (op) op.rotation.y = t * 0.25;

  // Scan line sweep
  const sl = cyborgHead.getObjectByName('scanLine');
  if (sl) {
    const s = Math.sin(t * 0.95);
    sl.position.y = s * 1.2;
    sl.material.opacity = 0.2 + Math.abs(s) * 0.9;
    sl.material.emissiveIntensity = 0.8 + Math.abs(s) * 2.5;
  }

  // Particle field drift
  particles.rotation.y = t * 0.006;
  particles.rotation.x = t * 0.003;

  // Light dance
  cyanLight.position.set(Math.sin(t * 0.55) * 3.5, Math.cos(t * 0.4) * 2.5 + 2, 6);
  purpleLight.position.set(Math.cos(t * 0.45) * 3.5, Math.sin(t * 0.38) * 2.5 - 1.5, 6);

  // Pulse eye glow
  const eyeIntensity = 0.7 + Math.sin(t * 1.8) * 0.25;
  MAT.cyan.emissiveIntensity = eyeIntensity;
  MAT.purple.emissiveIntensity = eyeIntensity;

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

// ===== REVEAL OBSERVER =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const delay = parseInt(e.target.dataset.delay || '0', 10);
    setTimeout(() => e.target.classList.add('visible'), delay);
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ===== COUNTER OBSERVER =====
function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 0) + 'K' : String(n);
}
function runCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 2200;
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatNum(Math.round(eased * target)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    runCounter(e.target);
    counterObs.unobserve(e.target);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

// ===== STAT BAR OBSERVER =====
// Animate stat bars when visible
const statFillObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const pct = e.target.style.getPropertyValue('--pct') ||
                getComputedStyle(e.target).getPropertyValue('--pct').trim();
    if (pct) e.target.style.width = pct;
    statFillObs.unobserve(e.target);
  });
}, { threshold: 0.3 });
document.querySelectorAll('.stat-card__fill').forEach(el => statFillObs.observe(el));

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  const o = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', o);
  document.body.style.overflow = o ? 'hidden' : '';
});
document.querySelectorAll('.m-link').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
  });
});

// ===== 3D CARD TILT =====
document.querySelectorAll('.tilt-wrapper').forEach(wrapper => {
  const card = wrapper.querySelector('.event-card');
  if (!card) return;

  wrapper.addEventListener('mousemove', e => {
    const rect = wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    card.style.transform = `perspective(900px) rotateX(${-dy * 10}deg) rotateY(${dx * 10}deg) translateZ(12px)`;
    card.style.transition = 'transform 0.1s ease, border-color 0.3s, box-shadow 0.3s';

    // Shine position
    const mx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const my = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const shine = card.querySelector('.event-card__shine');
    if (shine) shine.style.setProperty('--mx', mx + '%'), shine.style.setProperty('--my', my + '%');
  });

  wrapper.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    card.style.transition = 'transform 0.5s ease, border-color 0.3s, box-shadow 0.3s';
  });
});

// ===== GSAP hero entrance =====
gsap.from('.hero__eyebrow', { opacity: 0, y: 20, duration: 1, delay: 0.3, ease: 'power3.out' });
gsap.from('.hero__title-line', { opacity: 0, y: 40, duration: 1.1, delay: 0.55, ease: 'power3.out' });
gsap.from('.hero__title-year', { opacity: 0, y: 20, duration: 0.9, delay: 0.85, ease: 'power3.out' });
gsap.from('.hero__sub', { opacity: 0, y: 16, duration: 0.9, delay: 1.05, ease: 'power3.out' });
gsap.from('.hero__cta', { opacity: 0, y: 16, duration: 0.9, delay: 1.25, ease: 'power3.out' });
gsap.from('.hero__date', { opacity: 0, duration: 0.8, delay: 1.45, ease: 'power3.out' });

// Entrance: head scales from 0
cyborgHead.scale.setScalar(0);
gsap.to(cyborgHead.scale, { x: 1, y: 1, z: 1, duration: 1.4, delay: 0.2, ease: 'back.out(1.4)' });
