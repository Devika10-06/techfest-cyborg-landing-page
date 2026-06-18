import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);

// ===== GLOBALS =====
const W = () => window.innerWidth;
const H = () => window.innerHeight;
let isLoaded = false;

// ===== RENDERER + SCENE =====
const canvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015);

const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 200);
camera.position.set(0, 0, W() < 768 ? 9 : 6.5);

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0x050510, 6));

const cyanLight = new THREE.PointLight(0x00f5ff, 14, 26);
cyanLight.position.set(-3, 3, 7);
scene.add(cyanLight);

const purpleLight = new THREE.PointLight(0xbf00ff, 14, 26);
purpleLight.position.set(3, -2, 7);
scene.add(purpleLight);

const pinkLight = new THREE.PointLight(0xff006e, 6, 18);
pinkLight.position.set(0, -4, 4);
scene.add(pinkLight);

const rimLight = new THREE.DirectionalLight(0x223366, 2);
rimLight.position.set(0, 8, -4);
scene.add(rimLight);

// ===== MATERIALS =====
const MAT = {
  dark:   new THREE.MeshStandardMaterial({ color: 0x0b0b1a, metalness: 0.92, roughness: 0.08 }),
  mid:    new THREE.MeshStandardMaterial({ color: 0x181825, metalness: 0.75, roughness: 0.2 }),
  grille: new THREE.MeshStandardMaterial({ color: 0x1a2233, metalness: 0.95, roughness: 0.04 }),
  cyan:   new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 1.1 }),
  purple: new THREE.MeshStandardMaterial({ color: 0xbf00ff, emissive: new THREE.Color(0xbf00ff), emissiveIntensity: 1.1 }),
  pink:   new THREE.MeshStandardMaterial({ color: 0xff006e, emissive: new THREE.Color(0xff006e), emissiveIntensity: 0.9 }),
  visor:  new THREE.MeshStandardMaterial({ color: 0x001426, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 0.15, transparent: true, opacity: 0.94 }),
  ring1:  new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: new THREE.Color(0x00f5ff), emissiveIntensity: 0.6, transparent: true, opacity: 0.65 }),
  ring2:  new THREE.MeshStandardMaterial({ color: 0xbf00ff, emissive: new THREE.Color(0xbf00ff), emissiveIntensity: 0.6, transparent: true, opacity: 0.5 }),
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

  const headGeo = new THREE.BoxGeometry(2.1, 2.5, 1.9);
  g.add(mesh(headGeo, MAT.dark));
  g.add(edges(headGeo, 0x00f5ff, 0.2));

  // Panel grooves
  const panelGeo = new THREE.BoxGeometry(2.05, 0.04, 1.95);
  [0.45, 0, -0.45].forEach(y => g.add(mesh(panelGeo, MAT.mid, 0, y, 0)));

  // Forehead plate
  const foreGeo = new THREE.BoxGeometry(1.65, 0.55, 0.12);
  g.add(mesh(foreGeo, MAT.mid, 0, 0.82, 0.97));
  g.add(line([[-0.76,0.94,1.06],[-0.22,0.94,1.06],[-0.22,0.74,1.06],[0.22,0.74,1.06],[0.22,0.94,1.06],[0.76,0.94,1.06]], 0x00f5ff));
  g.add(line([[-0.5,0.6,1.06],[-0.5,0.5,1.06],[-0.2,0.5,1.06]], 0x00f5ff, 0.55));
  g.add(line([[0.5,0.6,1.06],[0.5,0.5,1.06],[0.2,0.5,1.06]], 0x00f5ff, 0.55));

  // Visor
  g.add(mesh(new THREE.BoxGeometry(1.92, 0.44, 0.16), MAT.visor, 0, 0.15, 0.93));

  // Eyes
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.22, 0.12), MAT.cyan, -0.46, 0.15, 1.01));
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.22, 0.12), MAT.purple, 0.46, 0.15, 1.01));

  // Pupil dots
  g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), MAT.pink, -0.46, 0.15, 1.08));
  g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), MAT.pink, 0.46, 0.15, 1.08));

  // Scan line
  const scanMesh = mesh(new THREE.BoxGeometry(2.0, 0.022, 0.02), MAT.cyan.clone(), 0, 0, 0.97);
  scanMesh.material.emissiveIntensity = 2.5;
  scanMesh.name = 'scanLine';
  g.add(scanMesh);

  // Nose
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.42, 0.13), MAT.mid, 0, -0.2, 0.96));

  // Mouth grille
  for (let i = 0; i < 7; i++) {
    g.add(mesh(new THREE.BoxGeometry(1.25, 0.07, 0.13), MAT.grille, 0, -0.62 + i * 0.105, 0.93));
  }
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.78, 0.1), MAT.dark, 0, -0.62, 0.88));

  // Jaw details
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.06, 0.05), MAT.cyan.clone(), 0, -0.3, 0.97));

  // Ear plates
  const earGeo = new THREE.BoxGeometry(0.32, 0.95, 0.95);
  [-1.21, 1.21].forEach((x, i) => {
    g.add(mesh(earGeo, MAT.mid, x, 0.1, 0));
    g.add(edges(earGeo, i === 0 ? 0x00f5ff : 0xbf00ff, 0.2, x, 0.1, 0));
    g.add(mesh(new THREE.SphereGeometry(0.08, 8, 8), i === 0 ? MAT.cyan : MAT.purple, x * 1.08, 0.38, 0));
    g.add(mesh(new THREE.SphereGeometry(0.055, 8, 8), MAT.pink, x * 1.08, 0.14, 0));
    g.add(mesh(new THREE.SphereGeometry(0.04, 8, 8), i === 0 ? MAT.purple : MAT.cyan, x * 1.08, -0.1, 0));
  });

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.38, 0.55, 0.65, 8);
  g.add(mesh(neckGeo, MAT.dark, 0, -1.57, 0));
  g.add(edges(neckGeo, 0x00f5ff, 0.15, 0, -1.57, 0));
  for (let i = 0; i < 4; i++) {
    g.add(mesh(new THREE.TorusGeometry(0.44 + i * 0.016, 0.012, 6, 24), MAT.cyan.clone(), 0, -1.3 - i * 0.14, 0));
  }

  // Collar
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.18, 1.3), MAT.mid, 0, -1.98, 0));
  g.add(edges(new THREE.BoxGeometry(2.3, 0.18, 1.3), 0x00f5ff, 0.12, 0, -1.98, 0));

  // Antennas
  const antGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.95, 6);
  const antMat = new THREE.MeshStandardMaterial({ color: 0x7788aa, metalness: 1, roughness: 0.04 });
  [-0.72, 0.72].forEach((x, i) => {
    g.add(mesh(antGeo, antMat, x, 1.7, 0));
    g.add(mesh(new THREE.SphereGeometry(0.09, 10, 10), i === 0 ? MAT.cyan : MAT.purple, x, 2.22, 0));
  });

  // Orbiting rings
  const r1 = mesh(new THREE.TorusGeometry(2.1, 0.028, 8, 96), MAT.ring1);
  r1.rotation.x = 0.28; r1.name = 'ring1';
  g.add(r1);
  const r2 = mesh(new THREE.TorusGeometry(2.6, 0.02, 8, 96), MAT.ring2);
  r2.rotation.x = -1.1; r2.rotation.z = 0.48; r2.name = 'ring2';
  g.add(r2);
  const r3 = mesh(new THREE.TorusGeometry(2.85, 0.015, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0xff006e, emissive: new THREE.Color(0xff006e), emissiveIntensity: 0.5, transparent: true, opacity: 0.35 }));
  r3.rotation.z = 0.72; r3.rotation.y = 0.4; r3.name = 'ring3';
  g.add(r3);

  // Orbit particles
  const orbitGeo = new THREE.BufferGeometry();
  const orbitPos = new Float32Array(240);
  const orbitCol = new Float32Array(240);
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 2.1 + (Math.random() - 0.5) * 0.6;
    const tiltX = 0.28 + (Math.random() - 0.5) * 0.5;
    orbitPos[i*3]   = Math.cos(angle) * r;
    orbitPos[i*3+1] = Math.sin(angle) * r * Math.sin(tiltX) + 0.2;
    orbitPos[i*3+2] = Math.sin(angle) * r * Math.cos(tiltX);
    const t = Math.random();
    if (t < 0.33) { orbitCol[i*3]=0; orbitCol[i*3+1]=0.96; orbitCol[i*3+2]=1; }
    else if (t < 0.66) { orbitCol[i*3]=0.75; orbitCol[i*3+1]=0; orbitCol[i*3+2]=1; }
    else { orbitCol[i*3]=1; orbitCol[i*3+1]=0; orbitCol[i*3+2]=0.43; }
  }
  orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
  orbitGeo.setAttribute('color', new THREE.BufferAttribute(orbitCol, 3));
  const orbitPts = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
    size: 0.07, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true
  }));
  orbitPts.name = 'orbitPts';
  g.add(orbitPts);

  return g;
}

// ===== LIGHTNING SPARKS =====
function buildLightningSystem() {
  const group = new THREE.Group();
  const bolts = [];
  const boltMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0 });

  function createBolt() {
    const pts = [];
    let x = (Math.random() - 0.5) * 3, y = (Math.random() - 0.5) * 2;
    const steps = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i <= steps; i++) {
      pts.push(new THREE.Vector3(x, y, 1.5));
      x += (Math.random() - 0.5) * 1.2;
      y += (Math.random() - 0.5) * 0.8;
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = boltMat.clone();
    const bolt = new THREE.Line(geo, mat);
    group.add(bolt);
    bolts.push({ line: bolt, life: 0, maxLife: 0.15 + Math.random() * 0.1, color: Math.random() > 0.5 ? 0x00f5ff : 0xbf00ff });
    if (bolts.length > 20) {
      const old = bolts.shift();
      group.remove(old.line);
      old.line.geometry.dispose();
    }
    setTimeout(createBolt, 100 + Math.random() * 800);
  }
  createBolt();

  function update(dt) {
    bolts.forEach(b => {
      b.life += dt;
      const p = b.life / b.maxLife;
      b.line.material.opacity = p < 0.3 ? p / 0.3 * 0.9 : (1 - p) * 0.9;
      b.line.material.color.set(b.color);
    });
  }
  return { group, update };
}

// ===== SPACE TUNNEL =====
function buildTunnel() {
  const group = new THREE.Group();
  const segments = 30;
  const ringMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0 });

  for (let i = 0; i < segments; i++) {
    const z = -(i * 8 + 10);
    const r = 3 + Math.random() * 1.5;
    const sides = 6 + Math.floor(Math.random() * 4);
    const pts = [];
    for (let j = 0; j <= sides; j++) {
      const ang = (j / sides) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = ringMat.clone();
    mat.color.set(i % 3 === 0 ? 0x00f5ff : i % 3 === 1 ? 0xbf00ff : 0xff006e);
    mat.opacity = 0;
    const ring = new THREE.Line(geo, mat);
    ring.position.z = z;
    ring.rotation.z = Math.random() * Math.PI;
    group.add(ring);
  }
  return group;
}

// ===== PARTICLE FIELD =====
function buildParticles() {
  const count = 3200;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 60;
    pos[i*3+1] = (Math.random() - 0.5) * 60;
    pos[i*3+2] = (Math.random() - 0.5) * 40 - 10;
    const t = Math.random();
    if (t < 0.33) { col[i*3]=0; col[i*3+1]=0.96; col[i*3+2]=1; }
    else if (t < 0.66) { col[i*3]=0.75; col[i*3+1]=0; col[i*3+2]=1; }
    else { col[i*3]=1; col[i*3+1]=0; col[i*3+2]=0.43; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.045, vertexColors: true, transparent: true, opacity: 0.5, sizeAttenuation: true
  }));
}

// ===== GRID =====
function buildGrid() {
  const h = new THREE.GridHelper(60, 50, 0x00f5ff, 0x001122);
  h.material.transparent = true;
  h.material.opacity = 0.06;
  h.position.y = -5;
  return h;
}

// ===== ENERGY NODES (background decoration) =====
function buildEnergyNodes() {
  const group = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const r = 0.06 + Math.random() * 0.12;
    const geo = new THREE.OctahedronGeometry(r);
    const color = [0x00f5ff, 0xbf00ff, 0xff006e][i % 3];
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: new THREE.Color(color), emissiveIntensity: 0.8,
      metalness: 0.9, roughness: 0.1
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 12,
      -5 - Math.random() * 15
    );
    m.userData.rotSpeed = (Math.random() - 0.5) * 0.04;
    m.userData.floatPhase = Math.random() * Math.PI * 2;
    group.add(m);
  }
  return group;
}

// ===== INIT SCENE =====
const cyborgHead = buildCyborgHead();
cyborgHead.scale.setScalar(0);
scene.add(cyborgHead);

const lightning = buildLightningSystem();
scene.add(lightning.group);

const tunnel = buildTunnel();
scene.add(tunnel);

const particles = buildParticles();
scene.add(particles);

const energyNodes = buildEnergyNodes();
scene.add(energyNodes);

scene.add(buildGrid());

// ===== SCROLL PROXY =====
const proxy = { x: 0, y: 0.3, z: 0, rotX: 0, rotY: 0, scale: 1, camZ: camera.position.z, camY: 0, tunnelZ: 0 };

// ===== MOUSE TRACKING =====
const mouse = { x: 0, y: 0, raw: { x: 0, y: 0 } };
const mouseS = { x: 0, y: 0 };

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / W() - 0.5) * 2;
  mouse.y = -(e.clientY / H() - 0.5) * 2;
  mouse.raw.x = e.clientX;
  mouse.raw.y = e.clientY;
}, { passive: true });

// ===== GSAP SCROLL ANIMATIONS =====
const heroEnd = W() < 768 ? 0 : 3;

gsap.to(proxy, {
  x: heroEnd, y: 0, z: -1.5, rotY: -0.65, scale: 0.7,
  ease: 'none',
  scrollTrigger: { trigger: '#stats', start: 'top bottom', end: 'top 10%', scrub: 1.8 }
});
gsap.to(proxy, {
  x: W() < 768 ? 0 : -3, y: -0.3, z: -3, rotY: 0.55, scale: 0.45,
  ease: 'none',
  scrollTrigger: { trigger: '#events', start: 'top bottom', end: 'top 10%', scrub: 1.8 }
});
gsap.to(proxy, {
  x: 0, y: 0, z: -5, rotY: 0, scale: 0.32,
  ease: 'none',
  scrollTrigger: { trigger: '#ca', start: 'top bottom', end: 'top 10%', scrub: 2 }
});
gsap.to(proxy, {
  tunnelZ: -80,
  ease: 'power2.in',
  scrollTrigger: { trigger: '#footer', start: 'top bottom', end: 'top 30%', scrub: 2 }
});
gsap.to(proxy, {
  camZ: (W() < 768 ? 9 : 6.5) + 2,
  ease: 'none',
  scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 2 }
});

// Tunnel rings fade in on footer approach
ScrollTrigger.create({
  trigger: '#footer',
  start: 'top 80%',
  end: 'top 20%',
  scrub: 1,
  onUpdate(self) {
    tunnel.children.forEach((ring, i) => {
      ring.material.opacity = Math.max(0, self.progress * 0.6 - (i / tunnel.children.length) * 0.1);
    });
  }
});

// ===== ANIMATION LOOP =====
const clock = new THREE.Clock();
let lastT = 0;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = t - lastT;
  lastT = t;

  mouseS.x += (mouse.x - mouseS.x) * 0.045;
  mouseS.y += (mouse.y - mouseS.y) * 0.045;

  // Idle breathe — amplitude increases if user hasn't moved
  const idleRotY = Math.sin(t * 0.35) * 0.12;
  const idleRotX = Math.sin(t * 0.22) * 0.045;
  const idleY = Math.sin(t * 0.48) * 0.07;
  const breathe = 1 + Math.sin(t * 0.55) * 0.012;

  const heroInfluence = Math.max(0, 1 - window.scrollY / (H() * 0.65));
  const mx = mouseS.x * 0.38 * heroInfluence;
  const my = mouseS.y * 0.28 * heroInfluence;

  cyborgHead.position.set(proxy.x + mx * heroInfluence, proxy.y + idleY, proxy.z);
  cyborgHead.rotation.set(proxy.rotX + idleRotX + my * heroInfluence, proxy.rotY + idleRotY + mx * 0.8, 0);
  cyborgHead.scale.setScalar(proxy.scale * breathe);

  camera.position.z += (proxy.camZ - camera.position.z) * 0.05;
  camera.position.y += (-mouseS.y * 0.14 - camera.position.y) * 0.03;
  camera.position.x += (-mouseS.x * 0.08 - camera.position.x) * 0.03;

  // Tunnel movement
  tunnel.position.z = proxy.tunnelZ;
  tunnel.children.forEach((ring, i) => {
    ring.rotation.z += 0.002 + (i % 3) * 0.001;
  });

  // Ring rotations
  const r1 = cyborgHead.getObjectByName('ring1');
  const r2 = cyborgHead.getObjectByName('ring2');
  const r3 = cyborgHead.getObjectByName('ring3');
  if (r1) r1.rotation.y = t * 0.55;
  if (r2) r2.rotation.y = -t * 0.35;
  if (r3) r3.rotation.x = t * 0.22;

  const op = cyborgHead.getObjectByName('orbitPts');
  if (op) op.rotation.y = t * 0.28;

  // Scan line
  const sl = cyborgHead.getObjectByName('scanLine');
  if (sl) {
    const s = Math.sin(t * 0.95);
    sl.position.y = s * 1.22;
    sl.material.opacity = 0.2 + Math.abs(s) * 1.1;
    sl.material.emissiveIntensity = 1 + Math.abs(s) * 3;
  }

  // Particle drift
  particles.rotation.y = t * 0.006;
  particles.rotation.x = t * 0.003;

  // Energy nodes
  energyNodes.children.forEach(n => {
    n.rotation.x += n.userData.rotSpeed;
    n.rotation.y += n.userData.rotSpeed * 0.7;
    n.position.y += Math.sin(t + n.userData.floatPhase) * 0.003;
    n.material.emissiveIntensity = 0.5 + Math.sin(t * 1.5 + n.userData.floatPhase) * 0.3;
  });

  // Light dance
  cyanLight.position.set(Math.sin(t * 0.55) * 4, Math.cos(t * 0.4) * 2.5 + 2, 7);
  purpleLight.position.set(Math.cos(t * 0.45) * 4, Math.sin(t * 0.38) * 2.5 - 1.5, 7);
  pinkLight.position.set(Math.sin(t * 0.33) * 3, -4 + Math.cos(t * 0.44) * 1.5, 5);

  // Pulse eyes
  const ei = 0.7 + Math.sin(t * 1.85) * 0.28;
  MAT.cyan.emissiveIntensity = ei;
  MAT.purple.emissiveIntensity = ei;

  // Lightning
  lightning.update(dt);

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener('resize', () => {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
}, { passive: true });

// ===== LOADING SCREEN =====
const loaderEl = document.getElementById('loader');
const loaderBar = document.getElementById('loaderBar');
const loaderPct = document.getElementById('loaderPct');
const loaderStatus = document.getElementById('loaderStatus');
const loaderLogo = document.getElementById('loaderLogo');

// Loader particle canvas
const lCanvas = document.getElementById('loaderCanvas');
lCanvas.width = W(); lCanvas.height = H();
const lCtx = lCanvas.getContext('2d');

const statusMsgs = [
  'INITIALIZING SYSTEMS...',
  'LOADING NEURAL NETWORKS...',
  'CALIBRATING CYBORG SYSTEMS...',
  'SYNCING PARTICLE FIELDS...',
  'PREPARING QUANTUM CORES...',
  'SYSTEM READY',
];

const loaderParticles = Array.from({ length: 220 }, () => ({
  x: Math.random() * W(),
  y: Math.random() * H(),
  tx: W() / 2 + (Math.random() - 0.5) * 260,
  ty: H() / 2 + (Math.random() - 0.5) * 60,
  vx: 0, vy: 0,
  size: 1.5 + Math.random() * 3,
  color: Math.random() > 0.5 ? '#00f5ff' : '#bf00ff',
  assembled: false,
}));

let progress = 0;
let animFrame;

function drawLoader(t) {
  lCtx.clearRect(0, 0, W(), H());
  progress = Math.min(progress + 0.38, 100);
  const pct = progress / 100;

  loaderParticles.forEach(p => {
    if (pct > 0.5) {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      p.vx += dx * 0.09;
      p.vy += dy * 0.09;
      p.vx *= 0.72; p.vy *= 0.72;
    } else {
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = (Math.random() - 0.5) * 1.5;
    }
    p.x += p.vx; p.y += p.vy;

    lCtx.beginPath();
    lCtx.arc(p.x, p.y, p.size * pct, 0, Math.PI * 2);
    lCtx.fillStyle = p.color;
    lCtx.globalAlpha = 0.5 + pct * 0.4;
    lCtx.fill();
  });

  // Scan line across logo
  const scanY = H() / 2 - 60 + Math.sin(t * 0.003) * 40;
  const scanGrad = lCtx.createLinearGradient(0, scanY, 0, scanY + 3);
  scanGrad.addColorStop(0, 'transparent');
  scanGrad.addColorStop(0.5, 'rgba(0,245,255,0.4)');
  scanGrad.addColorStop(1, 'transparent');
  lCtx.globalAlpha = 0.6;
  lCtx.fillStyle = scanGrad;
  lCtx.fillRect(W() / 2 - 180, scanY, 360, 3);
  lCtx.globalAlpha = 1;

  loaderBar.style.width = progress + '%';
  loaderPct.textContent = Math.floor(progress) + '%';
  const si = Math.min(Math.floor(pct * statusMsgs.length), statusMsgs.length - 1);
  loaderStatus.textContent = statusMsgs[si];

  if (progress < 100) {
    animFrame = requestAnimationFrame(t => drawLoader(t));
  } else {
    setTimeout(finishLoading, 500);
  }
}

function finishLoading() {
  loaderEl.classList.add('done');
  isLoaded = true;
  setTimeout(startHeroEntrance, 600);
}

function startHeroEntrance() {
  cyborgHead.scale.setScalar(0);
  gsap.to(cyborgHead.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'back.out(1.6)' });
  gsap.from('.hero__eyebrow', { opacity: 0, y: 24, duration: 1, delay: 0.3, ease: 'power3.out' });
  gsap.from('.hero__title-line', { opacity: 0, y: 50, duration: 1.1, delay: 0.55, ease: 'power3.out', onStart: startTypewriter });
  gsap.from('.hero__title-year', { opacity: 0, y: 24, duration: 0.9, delay: 0.85, ease: 'power3.out' });
  gsap.from('.hero__sub', { opacity: 0, y: 18, duration: 0.9, delay: 1.05, ease: 'power3.out' });
  gsap.from('.hero__typewriter', { opacity: 0, duration: 0.6, delay: 1.3 });
  gsap.from('.hero__cta', { opacity: 0, y: 18, duration: 0.9, delay: 1.5, ease: 'power3.out' });
  gsap.from('.hero__date', { opacity: 0, duration: 0.8, delay: 1.7 });
}

requestAnimationFrame(t => drawLoader(t));

// ===== TYPEWRITER =====
const phrases = [
  'WHERE HUMANS MEET MACHINES',
  '30 YEARS OF INNOVATION',
  'ASIA\'S LARGEST TECH FESTIVAL',
  '₹1 CRORE IN PRIZES',
  'IIT BOMBAY · DECEMBER 2025',
];
let phraseIdx = 0;
let charIdx = 0;
let deleting = false;
let twTimer = null;
const twEl = document.getElementById('heroTypewriter');

function startTypewriter() {
  if (twTimer) clearTimeout(twTimer);
  typeStep();
}
function typeStep() {
  const phrase = phrases[phraseIdx];
  if (!deleting) {
    twEl.textContent = phrase.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === phrase.length) { deleting = true; twTimer = setTimeout(typeStep, 2200); return; }
  } else {
    twEl.textContent = phrase.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; twTimer = setTimeout(typeStep, 350); return; }
  }
  twTimer = setTimeout(typeStep, deleting ? 42 : 68);
}

// ===== CUSTOM CURSOR =====
const cursorEl = document.getElementById('cursor');
const cursorOrb = cursorEl?.querySelector('.cursor__orb');
const cursorRing = cursorEl?.querySelector('.cursor__ring');
const trailEl = cursorEl?.querySelector('.cursor__trail');
let trailX = 0, trailY = 0;
let cursorX = 0, cursorY = 0;

if (cursorEl) {
  document.addEventListener('mousemove', e => {
    cursorX = e.clientX; cursorY = e.clientY;
    if (cursorEl) cursorEl.style.transform = `translate(${cursorX}px,${cursorY}px)`;
  });

  function animateCursorTrail() {
    trailX += (cursorX - trailX) * 0.22;
    trailY += (cursorY - trailY) * 0.22;
    if (trailEl) trailEl.style.transform = `translate(${trailX - cursorX}px,${trailY - cursorY}px)`;
    requestAnimationFrame(animateCursorTrail);
  }
  animateCursorTrail();

  // Hover states
  document.querySelectorAll('a, button, .mag-btn, .holo-card, .carousel-btn').forEach(el => {
    el.addEventListener('mouseenter', () => cursorEl.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorEl.classList.remove('hover'));
  });

  document.addEventListener('mousedown', () => cursorEl.classList.add('click'));
  document.addEventListener('mouseup', () => cursorEl.classList.remove('click'));
}

// ===== MAGNETIC BUTTONS =====
document.querySelectorAll('.mag-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.28;
    const dy = (e.clientY - cy) * 0.28;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ===== CLICK SHOCKWAVE =====
const swCanvas = document.getElementById('shockwaveCanvas');
swCanvas.width = W(); swCanvas.height = H();
const swCtx = swCanvas.getContext('2d');
const waves = [];

document.addEventListener('click', e => {
  waves.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 });
});

function drawShockwaves() {
  swCtx.clearRect(0, 0, W(), H());
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.r += 14;
    w.life -= 0.028;
    if (w.life <= 0) { waves.splice(i, 1); continue; }

    const grad = swCtx.createRadialGradient(w.x, w.y, w.r * 0.7, w.x, w.y, w.r);
    grad.addColorStop(0, `rgba(0,245,255,0)`);
    grad.addColorStop(0.6, `rgba(0,245,255,${w.life * 0.35})`);
    grad.addColorStop(0.85, `rgba(191,0,255,${w.life * 0.25})`);
    grad.addColorStop(1, `rgba(0,245,255,0)`);

    swCtx.beginPath();
    swCtx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    swCtx.fillStyle = grad;
    swCtx.fill();
  }
  requestAnimationFrame(drawShockwaves);
}
drawShockwaves();

window.addEventListener('resize', () => {
  swCanvas.width = W(); swCanvas.height = H();
  lCanvas.width = W(); lCanvas.height = H();
});

// ===== GLITCH CORRUPTION (random intervals) =====
function scheduleGlitch() {
  setTimeout(() => {
    const sects = document.querySelectorAll('.hero__title, .hero__sub, .section-title');
    if (sects.length) {
      const el = sects[Math.floor(Math.random() * sects.length)];
      el.classList.add('glitching');
      el.addEventListener('animationend', () => el.classList.remove('glitching'), { once: true });
    }
    scheduleGlitch();
  }, 3500 + Math.random() * 5000);
}
scheduleGlitch();

// ===== LIQUID METAL BUTTONS =====
document.querySelectorAll('[data-liquid]').forEach(cvs => {
  const btn = cvs.closest('.btn--liquid');
  if (!btn) return;
  cvs.width = btn.offsetWidth || 200;
  cvs.height = btn.offsetHeight || 52;
  const ctx = cvs.getContext('2d');
  const drops = Array.from({ length: 12 }, () => ({
    x: Math.random() * cvs.width,
    y: Math.random() * cvs.height,
    r: 4 + Math.random() * 8,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
  }));
  let active = false;

  btn.addEventListener('mouseenter', () => { active = true; });
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    drops[0].x = e.clientX - rect.left;
    drops[0].y = e.clientY - rect.top;
  });
  btn.addEventListener('mouseleave', () => { active = false; });

  function drawLiquid() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    if (!active) { requestAnimationFrame(drawLiquid); return; }
    drops.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > cvs.width) d.vx *= -1;
      if (d.y < 0 || d.y > cvs.height) d.vy *= -1;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 2.5);
      g.addColorStop(0, 'rgba(255,255,255,0.5)');
      g.addColorStop(0.4, 'rgba(0,245,255,0.3)');
      g.addColorStop(1, 'rgba(0,245,255,0)');
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
    requestAnimationFrame(drawLiquid);
  }
  drawLiquid();
});

// ===== HOLOGRAPHIC CARD MOUSE TRACKING =====
document.querySelectorAll('.holo-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const my = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const shine = card.querySelector('.holo-card__shine');
    if (shine) { shine.style.setProperty('--mx', mx + '%'); shine.style.setProperty('--my', my + '%'); }
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    card.style.transform = `rotateX(${-dy * 12}deg) rotateY(${dx * 12}deg) scale(1.04) translateZ(20px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    const shine = card.querySelector('.holo-card__shine');
    if (shine) { shine.style.setProperty('--mx', '50%'); shine.style.setProperty('--my', '50%'); }
  });
});

// ===== EVENTS CAROUSEL =====
(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const dotsContainer = document.getElementById('carouselDots');
  const cards = track?.querySelectorAll('.holo-card');
  if (!track || !cards?.length) return;

  const total = cards.length;
  let current = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartAngle = 0;
  let angleOffset = 0;

  // Create dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(d);
  });

  function getRadius() { return Math.min(W() * 0.32, 480); }

  function positionCards() {
    const rad = getRadius();
    cards.forEach((card, i) => {
      const angle = angleOffset + (i / total) * Math.PI * 2;
      const x = Math.sin(angle) * rad;
      const z = Math.cos(angle) * rad - rad;
      const scl = 0.5 + 0.5 * ((z + rad) / (2 * rad));
      const opacity = 0.3 + 0.7 * scl;
      card.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scl})`;
      card.style.opacity = opacity;
      card.style.zIndex = Math.round(scl * 100);
      card.style.pointerEvents = i === current ? 'auto' : 'none';
    });
    const dots = dotsContainer.querySelectorAll('button');
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    const targetAngle = -(current / total) * Math.PI * 2;
    gsap.to({ a: angleOffset }, {
      a: targetAngle, duration: 0.75, ease: 'power3.out',
      onUpdate: function() { angleOffset = this.targets()[0].a; positionCards(); }
    });
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Drag
  track.addEventListener('mousedown', e => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartAngle = angleOffset;
    track.classList.add('dragging');
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    angleOffset = dragStartAngle + dx * 0.005;
    current = Math.round((-angleOffset / (Math.PI * 2)) * total);
    current = ((current % total) + total) % total;
    positionCards();
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');
    goTo(current);
  });

  // Touch
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; dragStartAngle = angleOffset; }, { passive: true });
  track.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - touchStartX;
    angleOffset = dragStartAngle + dx * 0.005;
    positionCards();
  }, { passive: true });
  track.addEventListener('touchend', () => {
    current = Math.round((-angleOffset / (Math.PI * 2)) * total);
    current = ((current % total) + total) % total;
    goTo(current);
  });

  positionCards();
  window.addEventListener('resize', positionCards);

  // Auto-rotate
  let autoTimer = setInterval(() => goTo(current + 1), 4500);
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => { autoTimer = setInterval(() => goTo(current + 1), 4500); });
})();

// ===== REVEAL OBSERVER =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const delay = parseInt(e.target.dataset.delay || '0', 10);
    setTimeout(() => e.target.classList.add('visible'), delay);
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ===== COUNTER OBSERVER =====
function runCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 2400;
  const start = performance.now();
  function fmt(n) { return n >= 1000 ? Math.round(n / 1000) + 'K' : String(n); }
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const e2 = 1 - Math.pow(1 - p, 3.5);
    el.textContent = fmt(Math.round(e2 * target)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (!e.isIntersecting) return; runCounter(e.target); counterObs.unobserve(e.target); });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

// ===== CA TIMELINE SCROLL =====
const timelineFill = document.getElementById('timelineFill');
const timelineNodes = document.querySelectorAll('.timeline__node');

ScrollTrigger.create({
  trigger: '#ca',
  start: 'top 80%',
  end: 'bottom 60%',
  scrub: 1,
  onUpdate(self) {
    if (timelineFill) timelineFill.style.height = (self.progress * 100) + '%';
    timelineNodes.forEach((node, i) => {
      const threshold = (i + 1) / timelineNodes.length;
      if (self.progress >= threshold * 0.7) {
        node.classList.add('glow');
      }
    });
  }
});

// ===== AUDIO =====
let audioPlaying = false;
let audioInitialized = false;
const audioBtn = document.getElementById('audioBtn');
const audioViz = document.getElementById('audioViz');
const vizBars = audioViz?.querySelectorAll('span');

// Synthesize ambient sound with Web Audio API (no external file needed)
let audioCtx = null;
let oscillators = [];
let gainNode = null;

function initAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(audioCtx.destination);

  // Ambient drone layers
  const freqs = [55, 110, 165, 220, 330];
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = i < 2 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    oscGain.gain.value = i < 2 ? 0.18 : 0.06;
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start();
    oscillators.push(osc);
  });

  // Subtle noise layer
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  noiseSource.connect(gainNode);
  noiseSource.start();
}

function toggleAudio() {
  if (!audioInitialized) initAudio();
  audioPlaying = !audioPlaying;
  if (gainNode) {
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setTargetAtTime(audioPlaying ? 0.35 : 0, audioCtx.currentTime, 0.5);
  }
  audioBtn?.classList.toggle('off', !audioPlaying);
  const iconOn = audioBtn?.querySelector('.audio-btn__icon--on');
  const iconOff = audioBtn?.querySelector('.audio-btn__icon--off');
  if (iconOn) iconOn.style.display = audioPlaying ? '' : 'none';
  if (iconOff) iconOff.style.display = audioPlaying ? 'none' : '';
}

audioBtn?.addEventListener('click', toggleAudio);

// Animate visualizer bars
function animateViz() {
  if (vizBars) {
    vizBars.forEach((bar, i) => {
      const h = audioPlaying ? (4 + Math.sin(Date.now() * 0.005 * (i + 1) + i) * 7 + Math.random() * 3).toFixed(1) : '3';
      bar.style.height = h + 'px';
    });
  }
  requestAnimationFrame(animateViz);
}
animateViz();

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => {
  const o = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', o);
  document.body.style.overflow = o ? 'hidden' : '';
});
document.querySelectorAll('.m-link').forEach(a => {
  a.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
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

// ===== SOCIAL SPARK EFFECT =====
document.querySelectorAll('.social-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const spark = btn.querySelector('.social-btn__spark');
    if (!spark) return;
    spark.animate([
      { opacity: 0, transform: 'scale(0.3)' },
      { opacity: 0.55, transform: 'scale(1.6)' },
      { opacity: 0, transform: 'scale(0.8)' },
    ], { duration: 500, easing: 'ease-out' });
  });
});
