import * as THREE from 'three';
import {
  concreteTexture, tileWallTexture, carpetTexture, metalTexture, woodTexture,
  hazardTexture, signTexture, toyBoxTexture, paperTexture, radialSprite
} from './textures.js';
import { createPoppy } from './character.js';

const PI = Math.PI;

function addBox(parent, w, h, d, mat, x, y, z, ry = 0, cast = true, receive = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}

function addCyl(parent, rt, rb, h, mat, x, y, z, seg = 12, rx = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.rotation.z = rz;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function plane(parent, w, h, mat, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, 0);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function floorPlane(parent, x1, x2, z1, z2, mat, y = .015) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat);
  m.rotation.x = -PI / 2;
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function ceilingPlane(parent, x1, x2, z1, z2, mat, y) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat);
  m.rotation.x = PI / 2;
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function makeSign(parent, texture, w, h, x, y, z, ry = 0, brightness = 1) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, color: new THREE.Color(brightness, brightness, brightness), transparent: false });
  return plane(parent, w, h, mat, x, y, z, ry);
}

function cloneTex(tex, rx, ry) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

function matWith(tex, color = 0xffffff, roughness = .9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ map: tex, color, roughness, metalness });
}

function makeFuse(color = 0x54e3a9) {
  const g = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({ color: 0x9b9d90, roughness: .35, metalness: .75 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xd7fff0, emissive: color, emissiveIntensity: 2.4, roughness: .15, metalness: .1,
    transparent: true, opacity: .9
  });
  addCyl(g, .075, .075, .15, capMat, 0, -.16, 0, 12);
  addCyl(g, .075, .075, .15, capMat, 0, .16, 0, 12);
  const glass = addCyl(g, .085, .085, .25, glassMat, 0, 0, 0, 14);
  glass.userData.isGlass = true;
  addCyl(g, .095, .095, .025, capMat, 0, .105, 0, 12);
  addCyl(g, .095, .095, .025, capMat, 0, -.105, 0, 12);
  const light = new THREE.PointLight(color, 3.5, 3.2, 2);
  g.add(light);
  g.userData.glow = light;
  return g;
}

function makeTape() {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x1c1e1c, roughness: .58 });
  const label = new THREE.MeshStandardMaterial({ color: 0xd7ccb0, roughness: .88 });
  const reelMat = new THREE.MeshStandardMaterial({ color: 0x9b9a8d, roughness: .5 });
  addBox(g, .44, .05, .28, shell, 0, 0, 0);
  addBox(g, .3, .052, .18, label, 0, .003, 0);
  for (const s of [-1, 1]) {
    const reel = addCyl(g, .052, .052, .06, reelMat, s * .09, .02, 0, 12);
    reel.rotation.x = PI / 2;
    addCyl(g, .018, .018, .065, shell, s * .09, .025, 0, 8).rotation.x = PI / 2;
  }
  addBox(g, .06, .053, .1, shell, 0, .006, -.06);
  const glow = new THREE.PointLight(0xf0c24b, 1.5, 2.2, 2);
  g.add(glow);
  return g;
}

function makeCrate(parent, x, z, w = 1.1, h = 1.0, d = 1.1, color = 0x65442c, ry = 0, colliders = []) {
  const woodMat = new THREE.MeshStandardMaterial({ color, roughness: .9 });
  const g = new THREE.Group();
  g.position.set(x, h / 2, z);
  g.rotation.y = ry;
  const body = addBox(g, w, h, d, woodMat, 0, 0, 0);
  const trim = new THREE.MeshStandardMaterial({ color: 0x3b2a1d, roughness: .8 });
  addBox(g, w + .03, .08, d + .03, trim, 0, h * .38, 0);
  addBox(g, w + .03, .08, d + .03, trim, 0, -h * .38, 0);
  addBox(g, w + .04, .1, .06, trim, 0, 0, d / 2 + .02);
  parent.add(g);
  colliders.push({ x1: x - w / 2 - .1, x2: x + w / 2 + .1, z1: z - d / 2 - .1, z2: z + d / 2 + .1 });
  return g;
}

function makeBarrel(parent, x, z, color = 0x394b42, colliders = []) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .45 });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const b = addCyl(g, .33, .33, 1.0, mat, 0, .5, 0, 16);
  b.castShadow = true;
  const band = new THREE.MeshStandardMaterial({ color: 0x161b1a, roughness: .5, metalness: .5 });
  addCyl(g, .35, .35, .06, band, 0, .22, 0, 16);
  addCyl(g, .35, .35, .06, band, 0, .78, 0, 16);
  parent.add(g);
  colliders.push({ x1: x - .42, x2: x + .42, z1: z - .42, z2: z + .42 });
  return g;
}

function makeRope(parent, points, color = 0x8c1d25) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 18, .022, 5, false);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: .8 }));
  parent.add(m);
  return m;
}

function makeStanchion(parent, x, z, colliders = []) {
  const gold = new THREE.MeshStandardMaterial({ color: 0xb59a55, roughness: .3, metalness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3f3124, roughness: .6 });
  addCyl(parent, .15, .18, .05, dark, x, .025, z, 16);
  addCyl(parent, .036, .045, .9, gold, x, .48, z, 10);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 10), gold);
  top.position.set(x, .96, z);
  parent.add(top);
  return { x, z, topY: 1 };
}

export function buildWorld(scene) {
  const root = new THREE.Group();
  root.name = 'PlaytimeCo';
  scene.add(root);

  const colliders = [];
  const interactables = [];
  const interactMeshes = [];
  const zones = [
    { x1: -14.1, x2: 14.1, z1: 4.0, z2: 27.55, id: 'lobby' },
    { x1: 14.1, x2: 15.4, z1: 17.55, z2: 21.45, id: 'storage-door' },
    { x1: 15.0, x2: 24.1, z1: 13.8, z2: 24.25, id: 'storage' },
    { x1: -3.35, x2: 3.35, z1: 1.82, z2: 4.1, id: 'arch' },
    { x1: -14.1, x2: 14.1, z1: -21.7, z2: 1.92, id: 'display' },
    { x1: -2.12, x2: 2.12, z1: -26.2, z2: -21.6, id: 'security-corridor' },
    { x1: -10.1, x2: 10.1, z1: -50.7, z2: -26.0, id: 'maintenance' },
    { x1: -2.5, x2: 2.5, z1: -55.2, z2: -50.6, id: 'loading-corridor' },
    { x1: -15.1, x2: 15.1, z1: -74.55, z2: -55.0, id: 'loading' },
  ];

  // ---------------------------------------------------------------- materials
  const concrete = concreteTexture(6, 8);
  const tile = tileWallTexture(5, 3);
  const carpet = carpetTexture(7, 8);
  const metal = metalTexture(4, 3);
  const metalDark = metalTexture(4, 3, '#3d4745');
  const wood = woodTexture(3, 2);
  const hazard = hazardTexture();

  const floorLobby = matWith(cloneTex(concrete, 5, 5), 0x88948a, .92);
  const floorDisplay = matWith(cloneTex(carpet, 6, 8), 0xa78a86, .98);
  const floorStorage = matWith(cloneTex(concrete, 2, 2), 0x777b70, .95);
  const floorMaint = matWith(cloneTex(concrete, 4, 8), 0x69756e, .9);
  const floorLoading = matWith(cloneTex(concrete, 5, 5), 0x75817c, .88);
  const wallLobby = matWith(cloneTex(tile, 4, 2), 0xc1bea4, .94);
  const wallDisplay = matWith(cloneTex(tile, 5, 2), 0xa79484, .95);
  const wallStorage = matWith(cloneTex(metal, 2, 1), 0x7b847b, .8, .2);
  const wallMaint = matWith(cloneTex(metalDark, 4, 2), 0x707c75, .82, .18);
  const wallLoading = matWith(cloneTex(metal, 4, 2), 0x68746e, .83, .15);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x242c2b, roughness: .95 });
  const ceilingLightMat = new THREE.MeshStandardMaterial({ color: 0xdce3c8, emissive: 0xbfc8aa, emissiveIntensity: 1.5, roughness: .4 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x202827, roughness: .55, metalness: .55 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: 0x111716, roughness: .5, metalness: .6 });
  const redMetal = new THREE.MeshStandardMaterial({ color: 0x8c2025, roughness: .5, metalness: .35 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xbca66b, roughness: .28, metalness: .72 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xcf9d2f, roughness: .7 });
  const hazardMat = new THREE.MeshStandardMaterial({ map: hazard, roughness: .82 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9bd1ca, transparent: true, opacity: .19, roughness: .06, metalness: .05,
    transmission: .65, thickness: .05, side: THREE.DoubleSide, depthWrite: false
  });

  // ---------------------------------------------------------------- lighting
  const hemi = new THREE.HemisphereLight(0x748c8b, 0x191b16, .7);
  scene.add(hemi);

  const lights = {
    lobby: [], display: [], maint: [], loading: [], beacons: [], signs: [], all: []
  };
  function addPoint(color, intensity, distance, x, y, z, group = 'lobby', decay = 1.7) {
    const l = new THREE.PointLight(color, intensity, distance, decay);
    l.position.set(x, y, z);
    scene.add(l);
    l.userData.base = intensity;
    l.userData.phase = Math.random() * 10;
    lights[group].push(l);
    lights.all.push(l);
    return l;
  }
  function addSpot(color, intensity, distance, x, y, z, tx, ty, tz, angle = .72, penumbra = .45, group = 'lobby', shadow = false) {
    const l = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 1.4);
    l.position.set(x, y, z);
    l.target.position.set(tx, ty, tz);
    scene.add(l, l.target);
    l.userData.base = intensity;
    l.userData.phase = Math.random() * 10;
    lights[group].push(l);
    lights.all.push(l);
    if (shadow) {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
      l.shadow.bias = -.0012;
      l.shadow.normalBias = .035;
      l.shadow.camera.near = .4;
      l.shadow.camera.far = distance;
    }
    return l;
  }

  addPoint(0xffd9a0, 38, 24, -5.5, 6.2, 21, 'lobby');
  addPoint(0xcbe9e7, 34, 25, 4.5, 6.2, 18, 'lobby');
  addPoint(0xffc77b, 24, 18, -5, 5.2, 7, 'lobby');
  addPoint(0x85b6ae, 15, 18, 8, 4.8, 8, 'lobby');
  const lobbySpot = addSpot(0xffe3b6, 95, 28, 0, 7, 14, 0, 1.3, 4, .68, .55, 'lobby', true);
  const caseSpot = addSpot(0xffe2ab, 60, 13, 5.5, 6.2, -13.2, 5.5, 1.0, -16.5, .38, .5, 'display', true);
  const statueSpot = addSpot(0x9fc7d2, 24, 15, 0, 6.2, -3.5, 0, 2.4, -3.5, .48, .55, 'display', false);
  addPoint(0x7aa9a0, 24, 18, -8, 4.2, -10, 'display');
  addPoint(0xffc98e, 18, 15, 8, 4.4, -17, 'display');
  addPoint(0x3b9e8d, 13, 13, 5.5, 2.0, -16.5, 'display');
  addPoint(0xff6751, 21, 17, -4, 4.0, -29, 'maint');
  addPoint(0x8fd9c7, 20, 17, 5, 4.0, -37, 'maint');
  addPoint(0xff6657, 18, 17, 0, 3.8, -47, 'maint');
  addPoint(0x8dbdcd, 38, 30, 0, 8.2, -65, 'loading');
  addPoint(0xd6e2cf, 25, 22, -9, 7, -61, 'loading');
  addPoint(0x9acfc9, 18, 22, 10, 6, -70, 'loading');

  const exitSpot = addSpot(0x8dffb8, 52, 16, 0, 5.2, -70, 0, 2, -75.2, .5, .45, 'loading', true);
  // The display room is unpowered until the fuse bank is restored. The statue keeps one weak work light.
  caseSpot.userData.powered = false;
  lights.display.forEach(l => { if (l !== statueSpot) l.userData.powered = false; });

  // ---------------------------------------------------------------- lobby shell
  floorPlane(root, -14.5, 14.5, 3.4, 28.1, floorLobby);
  ceilingPlane(root, -14.5, 14.5, 3.4, 28.1, ceilingMat, 7.4);
  addBox(root, 29, 7.4, .5, wallLobby, 0, 3.7, 28.3, 0, false, true);
  addBox(root, .5, 7.4, 24.8, wallLobby, -14.5, 3.7, 15.75, 0, false, true);
  // east wall with storage doorway
  addBox(root, .5, 7.4, 13.8, wallLobby, 14.5, 3.7, 10.9, 0, false, true);
  addBox(root, .5, 7.4, 6.6, wallLobby, 14.5, 3.7, 24.7, 0, false, true);
  // north wall with arch opening
  addBox(root, 11.1, 7.4, .5, wallLobby, -8.95, 3.7, 3.9, 0, false, true);
  addBox(root, 11.1, 7.4, .5, wallLobby, 8.95, 3.7, 3.9, 0, false, true);
  addBox(root, 7, 2.6, .5, wallLobby, 0, 6.1, 3.9, 0, false, true);

  // lobby trim
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc4b388, roughness: .5, metalness: .2 });
  addBox(root, 29, .16, .1, trimMat, 0, 3.4, 28.0, 0, false);
  addBox(root, .1, .16, 24.5, trimMat, -14.2, 3.4, 15.75, 0, false);
  addBox(root, .1, .16, 24.5, trimMat, 14.2, 3.4, 15.75, 0, false);

  // PLAY TIME CO. main sign
  const logoTexture = signTexture({ width: 1400, height: 560, bg: '#251512', title: 'PLAYTIME CO.', subtitle: 'A WORLD OF PLAY', accent: '#d83535', style: 'logo' });
  makeSign(root, logoTexture, 9.6, 3.6, 0, 5.45, 4.43, 0, .92);
  // sign spot brackets
  for (const s of [-1, 1]) addBox(root, .08, .16, .35, goldMat, s * 4.3, 3.6, 3.35);

  // lobby ceiling fixtures
  for (const [x, z, w] of [[-5, 21, 3.6], [5, 18, 3.1], [-5, 8, 2.7], [6.3, 7.5, 2.2]]) {
    addBox(root, w, .11, .38, ceilingLightMat, x, 7.02, z, 0, false);
    addBox(root, w + .2, .12, .5, darkMetal, x, 7.12, z, 0, false);
    addBox(root, .04, 1.6, .04, darkMetal, x - w * .35, 7.9, z);
    addBox(root, .04, 1.6, .04, darkMetal, x + w * .35, 7.9, z);
  }

  // hanging pennant banners near entrance
  for (const [x, name, color] of [[-8.6, 'SMILE', '#d8c583'], [-11.2, 'PLAY', '#cf4f4a'], [9.8, 'STAY', '#d8c583']]) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = '#2b2a1d'; ctx.font = '900 60px Impact, sans-serif'; ctx.textAlign = 'center';
    ctx.save(); ctx.translate(128, 280); ctx.rotate(-PI / 2); ctx.fillText(name, 0, 20); ctx.restore();
    ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(128, 460); ctx.lineTo(256, 512); ctx.fillStyle = '#241d16'; ctx.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const banner = plane(root, 1.35, 2.7, new THREE.MeshStandardMaterial({ map: t, roughness: .9, side: THREE.DoubleSide }), x, 5.4, 25.9);
    banner.rotation.z = (x > 0 ? -.04 : .04);
  }

  // ---------------------------------------------------------------- reception
  const deskWood = matWith(cloneTex(wood, 3, 1), 0xaf8b67, .8);
  addBox(root, 6.5, 1.08, 1.8, deskWood, 5.8, .54, 18.4);
  addBox(root, 6.9, .09, 2.15, new THREE.MeshStandardMaterial({ color: 0x2b2520, roughness: .38, metalness: .1 }), 5.8, 1.14, 18.4);
  addBox(root, 5.9, .6, .08, new THREE.MeshStandardMaterial({ color: 0x8c1f24, roughness: .65 }), 5.8, .62, 17.48);
  const deskLogo = signTexture({ width: 512, height: 128, bg: '#8c1f24', title: 'PLAYTIME CO.', subtitle: 'EMPLOYEE CHECK-IN', accent: '#e7d6ad', style: 'employee' });
  plane(root, 3.8, .95, new THREE.MeshBasicMaterial({ map: deskLogo }), 5.8, .68, 17.43);
  // monitor, phone, papers
  addBox(root, .95, .62, .08, blackMetal, 7.55, 1.48, 18.85, -.2);
  addBox(root, .07, .4, .07, darkMetal, 7.55, 1.3, 18.9);
  addBox(root, .8, .05, .45, darkMetal, 7.55, 1.2, 18.65);
  addBox(root, .42, .14, .34, new THREE.MeshStandardMaterial({ color: 0x1b2520, roughness: .4 }), 4.1, 1.25, 18.8, .3);
  addBox(root, .2, .06, .28, new THREE.MeshStandardMaterial({ color: 0x1a1a17, roughness: .3 }), 4.1, 1.36, 18.8, .3);
  for (let i = 0; i < 4; i++) {
    const p = plane(root, .34, .46, new THREE.MeshStandardMaterial({ map: paperTexture('#d8ceb1', i + 2), roughness: .9 }), 5.2 + i * .13, 1.215 + i * .003, 18.1 + (i % 2) * .08, .12 * i, -PI / 2);
  }
  colliders.push({ x1: 2.35, x2: 9.25, z1: 17.35, z2: 19.45 });
  // nameplate
  const plate = signTexture({ width: 512, height: 160, bg: '#c9b889', title: 'M. LUDWIG', subtitle: 'SECURITY', accent: '#493c25', style: 'label' });
  addBox(root, 1.15, .36, .035, new THREE.MeshBasicMaterial({ map: plate }), 6.7, 1.31, 17.33);

  // office chair
  const chair = new THREE.Group();
  chair.position.set(7.7, 0, 20.2);
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0x2c3634, roughness: .95 });
  addBox(chair, .7, .9, .14, fabricMat, 0, 1.1, -.24, 0);
  addBox(chair, .65, .12, .6, fabricMat, 0, .55, 0, 0);
  addCyl(chair, .06, .06, .5, darkMetal, 0, .3, 0, 8);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * PI * 2;
    const leg = addBox(chair, .45, .05, .06, darkMetal, Math.cos(a) * .22, .08, Math.sin(a) * .22, -a);
  }
  root.add(chair);

  // wall poster Huggy
  const posterTex = signTexture({
    width: 700, height: 1000, bg: '#d8c9a2', title: 'HUGGY WUGGY', subtitle: "HE'S ALWAYS HUGGING!",
    body: 'PLAYTIME CO. • AGES 4 AND UP', accent: '#b5262d', style: 'poster'
  });
  plane(root, 3.3, 4.7, new THREE.MeshBasicMaterial({ map: posterTex }), -14.18, 4.1, 18.2, PI / 2);
  // poster second, Poppy
  const poppyPoster = signTexture({
    width: 700, height: 1000, bg: '#24362e', title: 'POPPY', subtitle: 'SHE ALWAYS COMES BACK',
    body: 'LIMITED EDITION • 1987', accent: '#d0a54e', style: 'poster'
  });
  plane(root, 2.8, 4.0, new THREE.MeshBasicMaterial({ map: poppyPoster }), 14.18, 4.0, 12.4, -PI / 2);
  // EMPLOYEE OF THE MONTH
  const empTex = signTexture({ width: 512, height: 680, bg: '#2c3130', title: 'MISSING', subtitle: 'EMPLOYEE OF THE MONTH', body: 'MARGARET LUDWIG • SECURITY', accent: '#d4b45b', style: 'employee' });
  plane(root, 1.6, 2.12, new THREE.MeshBasicMaterial({ map: empTex }), -3.5, 4.6, 27.98, PI);

  // ---------------------------------------------------------------- ball pit
  const pitX1 = -9.9, pitX2 = -3.7, pitZ1 = 8.3, pitZ2 = 14.6;
  addBox(root, pitX2 - pitX1, .56, .18, yellowMat, (pitX1 + pitX2) / 2, .28, pitZ1);
  addBox(root, pitX2 - pitX1, .56, .18, yellowMat, (pitX1 + pitX2) / 2, .28, pitZ2);
  addBox(root, .18, .56, pitZ2 - pitZ1, yellowMat, pitX1, .28, (pitZ1 + pitZ2) / 2);
  addBox(root, .18, .56, pitZ2 - pitZ1, yellowMat, pitX2, .28, (pitZ1 + pitZ2) / 2);
  const pitSign = signTexture({ width: 512, height: 192, bg: '#c5a83d', title: 'PLAY AREA', subtitle: 'FUN FOR ALL AGES', accent: '#243929', style: 'label' });
  plane(root, 2.0, .75, new THREE.MeshBasicMaterial({ map: pitSign }), -6.8, 1.1, 14.7);
  colliders.push({ x1: pitX1 - .2, x2: pitX2 + .2, z1: pitZ1 - .2, z2: pitZ2 + .2 });

  // ball pit balls instanced
  const ballColors = [0xd23a3f, 0x3187b3, 0xe0b63f, 0x4c9d72, 0xc46a38, 0x7d5da8];
  const ballGeo = new THREE.SphereGeometry(.105, 8, 6);
  for (const col of ballColors) {
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: .48 });
    const count = 52;
    const inst = new THREE.InstancedMesh(ballGeo, mat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(pitX1 + .35 + Math.random() * (pitX2 - pitX1 - .7), .58 + Math.random() * .22, pitZ1 + .35 + Math.random() * (pitZ2 - pitZ1 - .7));
      dummy.rotation.set(Math.random() * PI, Math.random() * PI, Math.random() * PI);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.castShadow = true;
    root.add(inst);
  }

  // play structure + slide
  const playFrameMat = new THREE.MeshStandardMaterial({ color: 0xba3438, roughness: .62 });
  const playAccent = new THREE.MeshStandardMaterial({ color: 0x2b798c, roughness: .6 });
  addBox(root, .22, 3.1, .22, playFrameMat, -10.4, 1.55, 7.8);
  addBox(root, .22, 3.1, .22, playFrameMat, -8.2, 1.55, 7.8);
  addBox(root, .22, 3.1, .22, playFrameMat, -10.4, 1.55, 10.2);
  addBox(root, .22, 3.1, .22, playFrameMat, -8.2, 1.55, 10.2);
  addBox(root, 2.5, .22, 2.8, playAccent, -9.3, 3.0, 9.0);
  addBox(root, 2.5, .16, .16, playFrameMat, -9.3, 3.2, 10.25);
  const slide = addBox(root, 1.1, .12, 4.2, new THREE.MeshStandardMaterial({ color: 0xd8b53e, roughness: .42 }), -8.1, 2.0, 12.6, .1);
  slide.rotation.x = -.5;
  for (let i = 0; i < 6; i++) {
    addBox(root, .55, .04, .3, playAccent, -9.5 + (i % 2) * .6, 3.25, 7.9 + i * .5);
  }
  // balloons
  const balloonColors = [0xd72f37, 0xe1b83f, 0x2f8c7e, 0x3e8ebb];
  for (let i = 0; i < 7; i++) {
    const bx = -11.9 + (i % 3) * .55, bz = 24 - Math.floor(i / 3) * .8;
    const by = 2.6 + (i % 3) * .35;
    const b = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 12), new THREE.MeshStandardMaterial({ color: balloonColors[i % 4], roughness: .32 }));
    b.scale.y = 1.22; b.position.set(bx, by, bz); root.add(b);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, by - .3, 4), darkMetal);
    string.position.set(bx, (by - .3) / 2 + .2, bz);
    root.add(string);
  }

  // benches, lockers, plants
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x7b4b30, roughness: .7 });
  for (const [x, z, ry] of [[-11.8, 19.5, PI / 2], [-11.8, 22.3, PI / 2]]) {
    addBox(root, .45, .1, 2.4, benchMat, x, .55, z, ry);
    addBox(root, .16, .55, .16, darkMetal, x - .85, .27, z - .8, ry);
    addBox(root, .16, .55, .16, darkMetal, x + .85, .27, z - .8, ry);
    addBox(root, .16, .55, .16, darkMetal, x - .85, .27, z + .8, ry);
    addBox(root, .16, .55, .16, darkMetal, x + .85, .27, z + .8, ry);
  }
  colliders.push({ x1: -12.4, x2: -11.2, z1: 18.2, z2: 23.5 });

  // lockers near storage door
  for (let i = 0; i < 4; i++) {
    const locker = addBox(root, .8, 2.3, .5, new THREE.MeshStandardMaterial({ color: 0x415f58, roughness: .62, metalness: .3 }), 13.9, 1.15, 5.5 + i * .85);
    addBox(root, .06, .1, .06, goldMat, 13.5, 1.2, 5.5 + i * .85, 0, false);
    addBox(root, .04, .03, .3, blackMetal, 13.46, 1.55, 5.5 + i * .85, 0, false);
  }
  colliders.push({ x1: 13.35, x2: 14.1, z1: 5.0, z2: 9.2 });

  // potted plants
  for (const [x, z] of [[-13.2, 5.2], [12.8, 26.4]]) {
    addCyl(root, .32, .26, .55, new THREE.MeshStandardMaterial({ color: 0x5b3a27, roughness: .85 }), x, .28, z, 12);
    for (let i = 0; i < 8; i++) {
      const leaf = addBox(root, .06, 1.0, .18, new THREE.MeshStandardMaterial({ color: 0x2b4b34, roughness: .8 }), x + (Math.random() - .5) * .45, 1.0, z + (Math.random() - .5) * .45, Math.random() * PI);
      leaf.rotation.z = (Math.random() - .5) * 1.1;
    }
  }

  // reception crates and toy display
  makeCrate(root, 12.1, 21.2, 1.6, 1.1, 1.2, 0x9a6a43, .1, colliders);
  makeCrate(root, 12.2, 19.4, 1.0, .8, .9, 0x7e5538, -.2, colliders);
  // toy shelves against right wall
  for (let row = 0; row < 3; row++) {
    const y = .55 + row * .9;
    addBox(root, .8, .08, 5.8, new THREE.MeshStandardMaterial({ color: 0x6c4b33, roughness: .8 }), 13.8, y, 24.0);
    for (let i = 0; i < 10; i++) {
      const boxTex = toyBoxTexture(['#b42c33', '#2c6d9a', '#a78134', '#4f7b56'][i % 4], ['HUGGY', 'POPPY', 'KISSY', 'BOXY'][i % 4]);
      const boxMat = new THREE.MeshStandardMaterial({ map: boxTex, roughness: .7 });
      const b = addBox(root, .42, .54, .5, boxMat, 13.75, y + .32, 21.3 + i * .55, PI / 2);
    }
  }
  colliders.push({ x1: 13.3, x2: 14.2, z1: 21.0, z2: 26.8 });

  // ---------------------------------------------------------------- storage room
  floorPlane(root, 14.5, 24.6, 13.6, 24.5, floorStorage);
  ceilingPlane(root, 14.5, 24.6, 13.6, 24.5, ceilingMat, 4.1);
  addBox(root, 10.1, 4.1, .5, wallStorage, 19.55, 2.05, 24.6, 0, false);
  addBox(root, .5, 4.1, 11, wallStorage, 24.6, 2.05, 19.05, 0, false);
  addBox(root, 10.1, 4.1, .5, wallStorage, 19.55, 2.05, 13.55, 0, false);
  // storage side of lobby wall
  addBox(root, .35, 4.1, 3.9, wallStorage, 14.4, 2.05, 15.75, 0, false);
  addBox(root, .35, 4.1, 2.9, wallStorage, 14.4, 2.05, 22.95, 0, false);
  addBox(root, .35, 1.3, 3.9, wallStorage, 14.4, 3.45, 19.5, 0, false);
  // doorway sign
  const storageSign = signTexture({ width: 640, height: 220, bg: '#2b3732', title: 'SECURE STORAGE', subtitle: 'AUTHORIZED PERSONNEL ONLY', accent: '#e0c060', style: 'employee' });
  plane(root, 2.3, .78, new THREE.MeshBasicMaterial({ map: storageSign }), 14.18, 3.15, 19.5, -PI / 2);
  // shelves + clutter
  for (let s = 0; s < 2; s++) {
    const sz = 22.8 + s * 1.5;
    addBox(root, 5.0, .1, .55, metal, 18.4, 2.35, sz);
    addBox(root, 5.0, .1, .55, metal, 18.4, 1.2, sz);
    addBox(root, 5.0, .1, .55, metal, 18.4, .35, sz);
    addBox(root, .08, 2.5, .55, darkMetal, 15.9, 1.25, sz);
    addBox(root, .08, 2.5, .55, darkMetal, 20.9, 1.25, sz);
    for (let i = 0; i < 5; i++) {
      makeCrate(root, 16.6 + i * .85, sz + .1, .5, .5 + Math.random() * .3, .55, [0x8c623e, 0x5d4935, 0x8b7b5e][i % 3], .08, []);
    }
  }
  colliders.push({ x1: 15.7, x2: 21.2, z1: 22.3, z2: 24.4 });
  // cage
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x3d4c48, roughness: .45, metalness: .7 });
  for (let i = 0; i < 10; i++) {
    addCyl(root, .035, .035, 2.9, cageMat, 20.9, 1.5, 14.4 + i * .46, 6);
  }
  addBox(root, .1, .1, 4.6, cageMat, 20.9, 2.95, 16.5);
  addBox(root, .1, .1, 4.6, cageMat, 20.9, .12, 16.5);
  addBox(root, 3.1, .1, .1, cageMat, 22.45, 2.95, 14.4);
  addBox(root, 3.1, .1, .1, cageMat, 22.45, 2.95, 18.6);
  addBox(root, .14, 2.9, 4.7, cageMat, 24.0, 1.45, 16.5);
  addBox(root, 3.2, 2.9, .14, cageMat, 22.45, 1.45, 18.65);
  colliders.push({ x1: 20.75, x2: 24.0, z1: 14.2, z2: 18.7 });
  // cage sign
  const cageSign = signTexture({ width: 512, height: 260, bg: '#a98e3e', title: 'AUTHORIZED', subtitle: 'GRABPACK ACCESS ONLY', accent: '#1b2420', style: 'label' });
  plane(root, 1.35, .68, new THREE.MeshBasicMaterial({ map: cageSign }), 20.76, 2.3, 16.5, -PI / 2);

  // hanging storage bulb
  addCyl(root, .02, .02, 1.2, blackMetal, 19.4, 3.4, 19.7, 5);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe3a2, emissive: 0xffc86a, emissiveIntensity: 2.2 });
  addCyl(root, .1, .07, .16, bulbMat, 19.4, 2.75, 19.7, 10);
  addPoint(0xffc776, 17, 9, 19.4, 2.65, 19.7, 'lobby');

  // ---------------------------------------------------------------- display room shell
  // lobby entrance runner
  const lobbyRunner = new THREE.MeshStandardMaterial({ color: 0x631d24, roughness: .98 });
  addBox(root, 3.7, .025, 22.2, lobbyRunner, 0, .04, 15.4, 0, false, true);
  for (const s of [-1, 1]) addBox(root, .09, .04, 22.2, goldMat, s * 1.91, .05, 15.4, 0, false);
  floorPlane(root, -14.5, 14.5, -22.1, 3.4, floorDisplay);
  ceilingPlane(root, -14.5, 14.5, -22.1, 3.4, ceilingMat, 6.9);
  addBox(root, 29, 6.9, .5, wallDisplay, 0, 3.45, -22.25, 0, false, true);
  addBox(root, .5, 6.9, 25.5, wallDisplay, -14.5, 3.45, -9.35, 0, false, true);
  addBox(root, .5, 6.9, 25.5, wallDisplay, 14.5, 3.45, -9.35, 0, false, true);
  // south wall segments around arch, display side
  addBox(root, 11.1, 6.9, .35, wallDisplay, -8.95, 3.45, 4.2, 0, false, true);
  addBox(root, 11.1, 6.9, .35, wallDisplay, 8.95, 3.45, 4.2, 0, false, true);
  addBox(root, 7, 2.4, .35, wallDisplay, 0, 5.7, 4.2, 0, false, true);
  // north wall opening for maintenance
  addBox(root, 12.0, 6.9, .5, wallDisplay, -8.5, 3.45, -22.25, 0, false, true);
  addBox(root, 12.0, 6.9, .5, wallDisplay, 8.5, 3.45, -22.25, 0, false, true);
  addBox(root, 4.7, 3.2, .5, wallDisplay, 0, 5.3, -22.25, 0, false, true);
  // red carpet runner
  const runner = new THREE.MeshStandardMaterial({ color: 0x7e2027, roughness: .95 });
  addBox(root, 4.2, .035, 23.5, runner, 0, .07, -9.1, 0, false, true);
  for (const s of [-1, 1]) addBox(root, .1, .06, 23.5, goldMat, s * 2.16, .08, -9.1, 0, false);
  // arch trim
  addBox(root, .25, 5.0, .7, goldMat, -3.42, 2.5, 4.0);
  addBox(root, .25, 5.0, .7, goldMat, 3.42, 2.5, 4.0);
  addBox(root, 7.1, .25, .7, goldMat, 0, 5.0, 4.0);

  // ceiling drapes / string lights
  for (const x of [-7, 0, 7]) {
    addBox(root, .16, .24, 24.8, darkMetal, x, 6.7, -9.1);
    for (let z = -20; z < 2; z += 2.3) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd391, emissive: 0xffbc67, emissiveIntensity: 2.5 }));
      bulb.position.set(x, 6.42, z + Math.sin(z * .7) * .12);
      root.add(bulb);
    }
  }

  // display side shelves and vitrines
  function displayShelf(x, z, side) {
    addBox(root, .9, 4.2, .7, matWith(cloneTex(wood, 1, 3), 0x6c4b36, .8), x, 2.1, z);
    for (let i = 0; i < 3; i++) {
      addBox(root, .85, .08, 2.7, darkMetal, x, .7 + i * 1.2, z);
      for (let j = 0; j < 3; j++) {
        const boxTex = toyBoxTexture(['#b23238', '#2d638a', '#9d7c2f'][(i + j) % 3], ['HUGGY', 'POPPY', 'KISSY'][(i + j) % 3]);
        const b = addBox(root, .38, .48, .55, new THREE.MeshStandardMaterial({ map: boxTex, roughness: .76 }), x, .98 + i * 1.2, z - 1.0 + j * .75, side * PI / 2);
      }
    }
    colliders.push({ x1: x - .6, x2: x + .6, z1: z - 1.7, z2: z + 1.7 });
  }
  displayShelf(-13.75, -4, 1);
  displayShelf(-13.75, -10, 1);
  displayShelf(13.75, -6, -1);
  displayShelf(13.75, -12.4, -1);
  // glass display cabinets with toys
  for (const [x, z] of [[-12.8, -17.4], [12.8, -18.2]]) {
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x34453f, roughness: .55, metalness: .2 });
    addBox(root, 1.8, 1.0, 1.8, caseMat, x, .5, z);
    addBox(root, 1.6, .06, 1.6, glassMat, x, 1.55, z, 0, false);
    addBox(root, .06, 1.1, 1.6, glassMat, x - .8, 1.55, z, 0, false);
    addBox(root, .06, 1.1, 1.6, glassMat, x + .8, 1.55, z, 0, false);
    addBox(root, 1.6, 1.1, .06, glassMat, x, 1.55, z - .8, 0, false);
    addBox(root, 1.6, 1.1, .06, glassMat, x, 1.55, z + .8, 0, false);
    addBox(root, 1.8, .08, 1.8, darkMetal, x, 2.15, z);
    const plush = new THREE.Mesh(new THREE.SphereGeometry(.32, 14, 10), new THREE.MeshStandardMaterial({ color: 0x1f638f, roughness: .9 }));
    plush.scale.set(1, 1.1, .8); plush.position.set(x, 1.35, z); root.add(plush);
    colliders.push({ x1: x - .95, x2: x + .95, z1: z - .95, z2: z + .95 });
  }

  // Huggy statue pedestal
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0xc2b590, roughness: .62 });
  addBox(root, 3.4, 1.2, 3.4, pedestalMat, 0, .6, -4.0);
  addBox(root, 3.65, .18, 3.65, goldMat, 0, 1.26, -4.0);
  addBox(root, 3.5, .12, 3.5, new THREE.MeshStandardMaterial({ color: 0x3c2a26, roughness: .75 }), 0, 1.42, -4.0);
  colliders.push({ x1: -1.85, x2: 1.85, z1: -5.85, z2: -2.15 });
  const statueSign = signTexture({ width: 720, height: 260, bg: '#d0c39c', title: 'HUGGY WUGGY', subtitle: 'OUR BEST FRIEND', accent: '#aa2b31', style: 'label' });
  plane(root, 2.2, .8, new THREE.MeshBasicMaterial({ map: statueSign }), 0, .72, -2.14);
  // stanchions around pedestal
  const pts = [
    makeStanchion(root, -2.8, -2.8, colliders), makeStanchion(root, 2.8, -2.8, colliders),
    makeStanchion(root, -2.8, -5.2, colliders), makeStanchion(root, 2.8, -5.2, colliders)
  ];
  makeRope(root, [new THREE.Vector3(-2.8, .92, -2.8), new THREE.Vector3(0, .52, -2.4), new THREE.Vector3(2.8, .92, -2.8)]);
  makeRope(root, [new THREE.Vector3(-2.8, .92, -5.2), new THREE.Vector3(0, .52, -5.6), new THREE.Vector3(2.8, .92, -5.2)]);

  // Poppy case
  const poppyBase = new THREE.MeshStandardMaterial({ color: 0x3d2d26, roughness: .5, metalness: .2 });
  addBox(root, 2.0, .9, 2.0, poppyBase, 5.6, .45, -16.5);
  addBox(root, 2.1, .08, 2.1, goldMat, 5.6, .94, -16.5);
  addBox(root, 1.75, 2.7, 1.75, glassMat, 5.6, 2.33, -16.5, 0, false);
  addBox(root, 1.9, .1, 1.9, goldMat, 5.6, 3.72, -16.5);
  // case frame edges
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    addBox(root, .07, 2.8, .07, goldMat, 5.6 + sx * .87, 2.33, -16.5 + sz * .87);
  }
  colliders.push({ x1: 4.55, x2: 6.65, z1: -17.55, z2: -15.45 });
  const poppyPlaque = signTexture({ width: 720, height: 220, bg: '#d2c7a5', title: 'POPPY', subtitle: 'THE FIRST DOLL • 1950', accent: '#7e2628', style: 'label' });
  plane(root, 1.55, .48, new THREE.MeshBasicMaterial({ map: poppyPlaque }), 5.6, .72, -15.46);
  // velvet rope around poppy
  makeStanchion(root, 7.4, -15.0, colliders);
  makeStanchion(root, 7.4, -18.0, colliders);
  makeRope(root, [new THREE.Vector3(7.4, .92, -15.0), new THREE.Vector3(6.7, .52, -16.5), new THREE.Vector3(7.4, .92, -18.0)]);

  // breaker
  const breaker = new THREE.Group();
  breaker.position.set(-5.6, 0, -21.88);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x4d5c57, roughness: .55, metalness: .35 });
  addBox(breaker, 2.8, 2.6, .42, boxMat, 0, 2.4, 0);
  addBox(breaker, 2.5, .12, .5, darkMetal, 0, 3.62, 0);
  addBox(breaker, 2.2, .08, .05, hazardMat, 0, 1.45, .25);
  // fuse sockets
  for (let i = 0; i < 3; i++) {
    addCyl(breaker, .19, .19, .18, blackMetal, -0.78 + i * .78, 2.78, .25, 12, PI / 2);
    addCyl(breaker, .14, .14, .2, new THREE.MeshStandardMaterial({ color: 0x131716, emissive: 0x1a5f49, emissiveIntensity: .3 }), -0.78 + i * .78, 2.78, .28, 12, PI / 2);
  }
  // lever
  const lever = new THREE.Group();
  lever.position.set(0, 1.95, .28);
  addBox(lever, .12, .7, .1, new THREE.MeshStandardMaterial({ color: 0xa22228, roughness: .5 }), 0, .34, 0);
  addBox(lever, .23, .2, .22, new THREE.MeshStandardMaterial({ color: 0x171b1a, roughness: .4 }), 0, .72, 0);
  breaker.add(lever);
  const breakerStatus = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0x9a1717, emissiveIntensity: 2.2 });
  const statusLight = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), breakerStatus);
  statusLight.position.set(1.05, 3.15, .27);
  breaker.add(statusLight);
  const breakerGlow = new THREE.PointLight(0xff3a32, 0, 3, 2);
  breakerGlow.position.set(0, 2.4, .8);
  breaker.add(breakerGlow);
  const breakerLabel = signTexture({ width: 800, height: 260, bg: '#25302c', title: 'AUX. POWER', subtitle: 'FUSE BANK A', body: 'INSERT 3 FUSES', accent: '#d3b757', style: 'employee' });
  plane(breaker, 1.6, .52, new THREE.MeshBasicMaterial({ map: breakerLabel }), 0, 3.3, .25);
  root.add(breaker);

  // ---------------------------------------------------------------- maintenance shell
  floorPlane(root, -10.5, 10.5, -50.9, -25.8, floorMaint);
  ceilingPlane(root, -10.5, 10.5, -50.9, -25.8, ceilingMat, 5.35);
  addBox(root, .5, 5.35, 25.1, wallMaint, -10.5, 2.67, -38.35, 0, false, true);
  addBox(root, .5, 5.35, 25.1, wallMaint, 10.5, 2.67, -38.35, 0, false, true);
  // south and north walls with corridor openings
  addBox(root, 8.1, 5.35, .5, wallMaint, -6.45, 2.67, -25.6, 0, false, true);
  addBox(root, 8.1, 5.35, .5, wallMaint, 6.45, 2.67, -25.6, 0, false, true);
  addBox(root, 4.8, 1.35, .5, wallMaint, 0, 4.67, -25.6, 0, false, true);
  addBox(root, 7.9, 5.35, .5, wallMaint, -6.55, 2.67, -51.0, 0, false, true);
  addBox(root, 7.9, 5.35, .5, wallMaint, 6.55, 2.67, -51.0, 0, false, true);
  addBox(root, 5.2, .75, .5, wallMaint, 0, 5.0, -51.0, 0, false, true);
  // Using dark frames here to mask the seam.

  // Security corridor (display to maintenance)
  floorPlane(root, -2.4, 2.4, -26.0, -21.9, matWith(cloneTex(concrete, 1, 1), 0x6f7a72, .9));
  ceilingPlane(root, -2.4, 2.4, -26.0, -21.9, ceilingMat, 4.0);
  addBox(root, .45, 5.35, 4.3, wallMaint, -2.4, 2.67, -23.95, 0, false, true);
  addBox(root, .45, 5.35, 4.3, wallMaint, 2.4, 2.67, -23.95, 0, false, true);
  addBox(root, 5.2, 2.1, .5, wallMaint, 0, 4.3, -21.9, 0, false, true);
  addBox(root, 5.2, 2.1, .5, wallMaint, 0, 4.3, -26.0, 0, false, true);

  // loading corridor
  floorPlane(root, -2.7, 2.7, -55.1, -50.8, matWith(cloneTex(concrete, 1, 2), 0x6d7971, .9));
  ceilingPlane(root, -2.7, 2.7, -55.1, -50.8, ceilingMat, 4.8);
  addBox(root, .5, 6.2, 4.4, wallLoading, -2.7, 3.1, -52.95, 0, false, true);
  addBox(root, .5, 6.2, 4.4, wallLoading, 2.7, 3.1, -52.95, 0, false, true);
  addBox(root, 5.9, 1.4, .5, wallLoading, 0, 5.5, -51.0, 0, false, true);
  addBox(root, 5.9, 1.4, .5, wallLoading, 0, 5.5, -55.0, 0, false, true);

  // pipes along maintenance ceiling
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x606d61, roughness: .5, metalness: .55 });
  const pipeRed = new THREE.MeshStandardMaterial({ color: 0x8c3931, roughness: .48, metalness: .45 });
  for (const [y, z, r] of [[4.95, -27.8, .14], [4.7, -28.3, .09], [4.78, -50.4, .12]]) {
    addCyl(root, r, r, 24.5, pipeMat, 0, y, z, 10, PI / 2);
  }
  for (const x of [-8.7, -5.1, 3.4, 8.8]) {
    addCyl(root, .19, .19, 24.7, x < 0 ? pipeRed : pipeMat, x, 4.95, -38.4, 10, PI / 2);
  }
  // wall pipes
  for (const y of [.8, 1.2, 1.6]) addCyl(root, .1, .1, 23.0, pipeMat, -10.15, y, -38.0, 8, PI / 2);
  // support beams
  for (let z = -28; z >= -49; z -= 5.2) {
    addBox(root, 20.5, .22, .25, darkMetal, 0, 4.85, z);
    addBox(root, .35, 5.4, .35, darkMetal, -10.1, 2.7, z);
    addBox(root, .35, 5.4, .35, darkMetal, 10.1, 2.7, z);
  }
  // ceiling lights (industrial)
  for (const [x, z] of [[-5, -31], [5, -37], [-4, -44], [5, -48]]) {
    addBox(root, 1.4, .07, .3, ceilingLightMat, x, 4.98, z, 0, false);
    addBox(root, 1.55, .1, .38, darkMetal, x, 5.07, z, 0, false);
  }
  // hazard floor strips
  for (const [x, z, w, d] of [[0, -27.2, 7.3, .35], [0, -49.5, 6.4, .35]]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, d), hazardMat);
    strip.rotation.x = -PI / 2; strip.position.set(x, .025, z); root.add(strip);
  }
  // arrows on floor
  const arrowTex = signTexture({ width: 512, height: 512, bg: '#26332e', title: 'EXIT', subtitle: '← LOADING BAY', accent: '#d8c25d', style: 'label' });
  for (const z of [-31, -41]) {
    const a = plane(root, 1.5, 1.5, new THREE.MeshBasicMaterial({ map: arrowTex }), 0, .03, z, 0, -PI / 2);
  }

  // conveyor
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1e2220, roughness: .92 });
  addBox(root, 2.1, .5, 12, darkMetal, -7.8, .7, -36.5);
  addBox(root, 2.0, .08, 11.8, beltMat, -7.8, 1.02, -36.5);
  for (let z = -42; z <= -31; z += 1.4) {
    addCyl(root, .16, .16, 2.1, metal, -7.8, 1.02, z, 10, 0, PI / 2);
  }
  for (let z = -42; z <= -31; z += 2.2) {
    addBox(root, .16, 1.1, .16, darkMetal, -8.75, .5, z);
    addBox(root, .16, 1.1, .16, darkMetal, -6.85, .5, z);
  }
  colliders.push({ x1: -9.0, x2: -6.6, z1: -42.7, z2: -30.3 });
  // conveyor boxes / toy parts
  for (const z of [-32.2, -35.1, -38.8]) {
    const boxTex = toyBoxTexture('#6b7f76', 'TOY PARTS');
    addBox(root, .7, .55, .8, new THREE.MeshStandardMaterial({ map: boxTex, roughness: .8 }), -7.8, 1.35, z);
  }
  // machine console with tape
  addBox(root, 3.0, 1.1, 1.2, darkMetal, 7.3, .55, -32.5);
  addBox(root, 3.1, .12, 1.3, metal, 7.3, 1.15, -32.5);
  addBox(root, 1.3, .65, .1, blackMetal, 7.0, 1.6, -32.0, -.1);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x1c4f43, emissive: 0x46b699, emissiveIntensity: .9, roughness: .2 });
  plane(root, 1.1, .5, screenMat, 7.0, 1.6, -31.93, -.1);
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .06, 8), i === 0 ? redMetal : darkMetal);
    b.rotation.x = PI / 2; b.position.set(6.2 + i * .25, 1.35, -31.85); root.add(b);
  }
  colliders.push({ x1: 5.6, x2: 9.0, z1: -33.3, z2: -31.7 });

  // maintenance clutter
  for (const [x, z, s] of [[8.2, -43.2, 1.2], [6.8, -44.2, .9], [-9.2, -47.3, 1.1], [8.5, -28.9, .9]]) {
    makeCrate(root, x, z, s, s * .9, s, [0x594a39, 0x6b563c][Math.floor(Math.random() * 2)], Math.random() * .4, colliders);
  }
  makeBarrel(root, 5.4, -45.8, 0x405b4d, colliders);
  makeBarrel(root, 4.5, -46.5, 0x6d3d31, colliders);
  makeBarrel(root, -9.2, -29.2, 0x405b4d, colliders);
  // hanging chains
  for (const [x, z] of [[-4, -34], [3.5, -42], [-2, -47]]) {
    for (let i = 0; i < 9; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(.09, .022, 5, 8), pipeMat);
      link.position.set(x, 4.8 - i * .16, z);
      link.rotation.y = i % 2 ? PI / 2 : 0;
      root.add(link);
    }
  }

  // steam vents
  const steamTex = radialSprite('rgba(201,225,218,.7)');
  const steamSprites = [];
  for (const [x, y, z] of [[-10.0, 2.2, -29.5], [10.0, 1.6, -44.0], [0, 3.9, -48.3], [8.5, 2.8, -39.5]]) {
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: .07, depthWrite: false, color: 0xb8d3ca });
      const sp = new THREE.Sprite(mat);
      sp.position.set(x + (Math.random() - .5) * .5, y + i * .35, z + (Math.random() - .5) * .5);
      sp.scale.setScalar(1.2 + i * .65);
      sp.userData = { baseX: sp.position.x, baseY: sp.position.y, speed: .12 + Math.random() * .12, phase: Math.random() * 10 };
      root.add(sp); steamSprites.push(sp);
    }
  }

  // ---------------------------------------------------------------- loading dock
  floorPlane(root, -15.6, 15.6, -75.6, -54.8, floorLoading);
  ceilingPlane(root, -15.6, 15.6, -75.6, -54.8, ceilingMat, 9.4);
  addBox(root, 31.2, 9.4, .6, wallLoading, 0, 4.7, -75.9, 0, false, true);
  // south wall with loading corridor opening
  addBox(root, 13.2, 9.4, .6, wallLoading, -9.3, 4.7, -54.5, 0, false, true);
  addBox(root, 13.2, 9.4, .6, wallLoading, 9.3, 4.7, -54.5, 0, false, true);
  addBox(root, 5.4, 4.6, .6, wallLoading, 0, 7.1, -54.5, 0, false, true);
  addBox(root, .6, 9.4, 21.4, wallLoading, -15.9, 4.7, -65.2, 0, false, true);
  addBox(root, .6, 9.4, 21.4, wallLoading, 15.9, 4.7, -65.2, 0, false, true);
  // opening for corridor - mask wall
  addBox(root, 6.2, 1.0, .7, wallLoading, 0, 8.8, -54.8, 0, false, true);
  // beams
  for (const z of [-58, -64, -70, -74.5]) addBox(root, 30.5, .28, .32, darkMetal, 0, 8.6, z);
  for (const x of [-12, -6, 0, 6, 12]) addBox(root, .32, 9.2, .32, darkMetal, x, 4.6, -66);
  // skylight shafts
  for (const x of [-8, 4]) {
    addBox(root, 4.8, .08, 3.2, new THREE.MeshStandardMaterial({ color: 0x86aeb5, emissive: 0x4f8998, emissiveIntensity: .7 }), x, 9.3, -64);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x9ad1d8, transparent: true, opacity: .045, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.1, 9.4, 16, 1, true), beamMat);
    beam.position.set(x, 4.7, -64);
    beam.rotation.z = 0;
    root.add(beam);
  }
  // exit door
  addBox(root, 7.4, 7.1, .45, new THREE.MeshStandardMaterial({ color: 0x33413b, roughness: .55, metalness: .4 }), 0, 3.55, -75.5);
  for (let i = 0; i < 10; i++) addBox(root, 7.3, .06, .5, darkMetal, 0, .7 + i * .65, -75.46);
  for (const s of [-1, 1]) {
    addBox(root, .18, 7.3, .6, hazardMat, s * 3.45, 3.6, -75.46);
  }
  const exitSignTex = signTexture({ width: 620, height: 260, bg: '#173326', title: 'EXIT', subtitle: 'LOADING BAY 04', accent: '#65d99a', style: 'employee' });
  const exitSignMesh = plane(root, 3.5, 1.46, new THREE.MeshBasicMaterial({ map: exitSignTex, toneMapped: false }), 0, 6.4, -75.2);
  // emergency exit lamp
  const exitLamp = new THREE.Mesh(new THREE.BoxGeometry(1.9, .25, .18), new THREE.MeshStandardMaterial({ color: 0x8dffb4, emissive: 0x66ff99, emissiveIntensity: 3.5 }));
  exitLamp.position.set(0, 7.35, -75.28); root.add(exitLamp);

  // loading dock props
  // forklift
  const forklift = new THREE.Group();
  forklift.position.set(-10.5, 0, -62);
  forklift.rotation.y = .18;
  const forkBody = new THREE.MeshStandardMaterial({ color: 0xb58b2b, roughness: .62, metalness: .2 });
  addBox(forklift, 2.2, 1.2, 1.5, forkBody, 0, .95, 0);
  addBox(forklift, 1.0, 1.0, 1.0, darkMetal, 0, 1.85, .1);
  addBox(forklift, .7, .65, .6, new THREE.MeshStandardMaterial({ color: 0x1f2b2a, roughness: .32 }), 0, 2.55, -.1);
  addBox(forklift, .16, 2.8, .16, darkMetal, .75, 1.5, 1.0);
  addBox(forklift, .16, 2.8, .16, darkMetal, -.75, 1.5, 1.0);
  addBox(forklift, 2.0, .1, .12, darkMetal, 0, 2.9, 1.0);
  for (const s of [-1, 1]) {
    const fork = addBox(forklift, .14, .08, 2.4, darkMetal, s * .45, .1, 1.8);
    addBox(forklift, .14, .85, .1, darkMetal, s * .45, .55, 2.95);
  }
  for (const [x, z] of [[-.8, -.6], [.8, -.6], [-.8, .75], [.8, .75]]) {
    const wheel = addCyl(forklift, .34, .34, .2, blackMetal, x, .34, z, 14);
    wheel.rotation.z = PI / 2;
  }
  root.add(forklift);
  colliders.push({ x1: -12.2, x2: -8.8, z1: -63.6, z2: -60.5 });

  // pallets and shipping containers
  makeCrate(root, 11.0, -70.0, 2.0, 1.6, 1.8, 0x6c563c, -.1, colliders);
  makeCrate(root, 11.0, -68.2, 1.8, 1.1, 1.5, 0x7a6345, .15, colliders);
  makeCrate(root, 12.6, -69.2, 1.2, .9, 1.1, 0x4c4637, .3, colliders);
  makeCrate(root, -12.8, -72.3, 2.2, 2.6, 2.4, 0x505a51, .1, colliders);
  makeCrate(root, -9.2, -72.1, 1.7, 1.4, 1.8, 0x6e5a40, -.2, colliders);
  makeBarrel(root, 7.9, -72.8, 0x3c5045, colliders);
  makeBarrel(root, 8.9, -73.0, 0x653b33, colliders);
  // shipping container left wall
  addBox(root, 3.0, 2.7, 8.0, new THREE.MeshStandardMaterial({ color: 0x375650, roughness: .7, metalness: .25 }), -13.9, 1.35, -67.2);
  colliders.push({ x1: -15.4, x2: -12.4, z1: -71.2, z2: -63.2 });
  // pile of pallets
  for (let i = 0; i < 6; i++) addBox(root, 2.5, .13, 1.6, matWith(cloneTex(wood, 1, 1), 0x6e5337, .9), 4.2, .12 + i * .15, -73.1, .08, false, true);
  colliders.push({ x1: 2.9, x2: 5.5, z1: -74.0, z2: -72.2 });
  // hanging dock lamp
  addCyl(root, .02, .02, 3.0, blackMetal, 8.0, 8.0, -62.0, 5);
  const dockLamp = new THREE.Mesh(new THREE.ConeGeometry(.55, .5, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x222a27, side: THREE.DoubleSide, roughness: .6 }));
  dockLamp.position.set(8, 6.6, -62); root.add(dockLamp);
  const dockBulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe4a8, emissive: 0xffd17e, emissiveIntensity: 3 }));
  dockBulb.position.set(8, 6.45, -62); root.add(dockBulb);

  // side warning sign
  const warningTex = signTexture({ width: 600, height: 320, bg: '#a8892d', title: 'CAUTION', subtitle: 'SECURITY DOOR', body: 'DO NOT BLOCK OPENING', accent: '#20231f', style: 'label' });
  plane(root, 2.1, 1.12, new THREE.MeshBasicMaterial({ map: warningTex }), 0, 3.4, -55.15);

  // ---------------------------------------------------------------- interactable items
  const fuses = [];
  function addFuse(x, y, z, id) {
    const f = makeFuse();
    f.position.set(x, y, z);
    const item = { type: 'fuse', id, object: f, active: true, range: 4.6 };
    f.traverse(o => { o.userData.interact = item; if (o.isMesh) interactMeshes.push(o); });
    interactables.push(item);
    root.add(f);
    fuses.push({ group: f, item, baseY: y, phase: Math.random() * 6 });
    return item;
  }
  addFuse(3.35, 1.42, 18.35, 'reception');
  addFuse(22.35, 1.25, 16.5, 'storage');
  addFuse(5.6, 1.3, -15.3, 'poppy');

  const tapes = [];
  function addTape(x, y, z, id, lore) {
    const t = makeTape();
    t.position.set(x, y, z);
    t.rotation.y = Math.random() * .6 - .3;
    const item = { type: 'tape', id, object: t, active: true, range: 3.2, lore };
    t.traverse(o => { o.userData.interact = item; if (o.isMesh) interactMeshes.push(o); });
    interactables.push(item);
    root.add(t);
    tapes.push({ group: t, item, baseY: y, phase: Math.random() * 4 });
  }
  addTape(7.9, 1.35, 18.85, 'welcome', '"Day 214. The toys are learning our names. Ludwig says not to answer them after lights out."');
  addTape(16.4, 1.25, 22.9, 'storage', '"The GrabPack was designed for handling hazardous materials. It also works on locked doors. We stopped asking why."');
  addTape(7.95, 1.42, -31.9, 'factory', '"They built a playmate that never stops smiling. It is not allowed in the nursery anymore."');

  // breaker interactable
  const breakerItem = {
    type: 'breaker', object: breaker, active: true, range: 4.0,
    label: () => 'INSERT FUSES'
  };
  breaker.traverse(o => { if (o.isMesh) { o.userData.interact = breakerItem; interactMeshes.push(o); } });
  interactables.push(breakerItem);

  const poppyCase = { open: false, glass: null };
  // Poppy doll displayed
  // Lazy import due to circular-free module
  // eslint-disable-next-line no-undef
  const poppyPlaceholder = new THREE.Group();
  poppyPlaceholder.position.set(5.6, 1.0, -16.5);
  poppyPlaceholder.name = 'PoppyPlaceholder';
  const poppyDoll = createPoppy();
  poppyDoll.position.y = -.84;
  poppyPlaceholder.add(poppyDoll);
  poppyPlaceholder.userData.doll = poppyDoll;
  root.add(poppyPlaceholder);
  const poppyItem = {
    type: 'poppy', object: poppyPlaceholder, active: true, range: 3.6,
    label: () => 'TAKE POPPY'
  };
  poppyPlaceholder.userData.interact = poppyItem;
  poppyDoll.traverse(o => { if (o.isMesh) { o.userData.interact = poppyItem; interactMeshes.push(o); } });
  interactables.push(poppyItem);

  // Exit interactable
  const exitGroup = new THREE.Group();
  exitGroup.position.set(0, 1.6, -74.8);
  const exitItem = { type: 'exit', object: exitGroup, active: true, range: 5.0, label: () => 'ESCAPE' };
  exitGroup.userData.interact = exitItem;
  interactables.push(exitItem);

  // gate between display and maintenance
  const gate = new THREE.Group();
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x4b5c56, roughness: .5, metalness: .5 });
  addBox(gate, 4.6, 3.7, .3, gateMat, 0, 1.85, 0);
  for (let i = 0; i < 6; i++) addBox(gate, 4.5, .06, .36, darkMetal, 0, .4 + i * .62, 0);
  addBox(gate, 4.55, .22, .38, hazardMat, 0, .4, 0);
  addBox(gate, 4.55, .22, .38, hazardMat, 0, 3.38, 0);
  const gateLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, .12, .05), new THREE.MeshStandardMaterial({ color: 0xff5b4f, emissive: 0xff2f2f, emissiveIntensity: 2.2 }));
  gateLight.position.set(0, 2.3, .2); gate.add(gateLight);
  gate.position.set(0, 0, -21.95);
  root.add(gate);
  const gateState = { group: gate, open: 0, target: 0, closedY: 0, openY: 3.9, mesh: gateLight, broken: false };
  // door collider active while closed (checked dynamically)

  const loadingDoor = new THREE.Group();
  const ldMat = new THREE.MeshStandardMaterial({ color: 0x52635c, roughness: .48, metalness: .5 });
  addBox(loadingDoor, 5.0, 4.7, .28, ldMat, 0, 2.35, 0);
  for (let i = 0; i < 8; i++) addBox(loadingDoor, 4.9, .05, .33, darkMetal, 0, .3 + i * .57, 0);
  for (let i = 0; i < 3; i++) addBox(loadingDoor, .13, 4.7, .33, hazardMat, -1.7 + i * 1.7, 2.35, 0);
  loadingDoor.position.set(0, 0, -54.95);
  root.add(loadingDoor);
  const loadingDoorState = { group: loadingDoor, open: 0, target: 0, closedY: 0, openY: 4.9, broken: false };

  // door status beacons
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0x6b1a18, emissive: 0xff2727, emissiveIntensity: 1.8 });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, .22, 10), beaconMat);
  beacon.position.set(2.6, 3.9, -21.7);
  root.add(beacon);
  lights.beacons.push(beacon);
  const beaconLight = new THREE.PointLight(0xff2f25, 0, 6, 2);
  beaconLight.position.copy(beacon.position);
  root.add(beaconLight);
  lights.beacons.push(beaconLight);
  const beacon2 = beacon.clone();
  beacon2.position.set(2.65, 5.5, -54.0); root.add(beacon2);
  lights.beacons.push(beacon2);

  // ---------------------------------------------------------------- dust / motes
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 620;
  const dustPos = new Float32Array(dustCount * 3);
  const dustPhase = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = -14 + Math.random() * 28;
    dustPos[i * 3 + 1] = .3 + Math.random() * 6.5;
    dustPos[i * 3 + 2] = -75 + Math.random() * 102;
    dustPhase[i] = Math.random() * PI * 2;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('phase', new THREE.BufferAttribute(dustPhase, 1));
  const dustMat = new THREE.PointsMaterial({
    color: 0xc8d2b6, size: .035, transparent: true, opacity: .32,
    depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending, map: radialSprite('rgba(235,245,225,.7)')
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  root.add(dust);

  // subtle red exit glow as point light
  const exitGlow = new THREE.PointLight(0x6dff9c, 10, 9, 2);
  exitGlow.position.set(0, 4.5, -73.5);
  root.add(exitGlow);

  // ---------------------------------------------------------------- returning api
  const state = { power: false, chase: false, poppyTaken: false };
  const baseIntensity = new Map();
  lights.all.forEach(l => baseIntensity.set(l, l.intensity));

  function setPower(on) {
    state.power = on;
    gateState.target = on ? 1 : 0;
    loadingDoorState.target = on ? 1 : 0;
    breakerStatus.color.setHex(on ? 0x2f7f57 : 0x7f1d1d);
    breakerStatus.emissive.setHex(on ? 0x2fa873 : 0x9a1717);
    breakerGlow.color.setHex(on ? 0x3aff9d : 0xff3a32);
    breakerGlow.intensity = on ? 3 : 0;
    lights.display.forEach(l => { l.userData.powered = on; });
    if (on) {
      lights.display.forEach(l => {
        if (l.isPointLight) l.intensity = l.userData.base * 1.25;
      });
      beaconsPower = true;
    }
    lights.beacons.forEach(b => { if (b.isPointLight) b.intensity = on ? 4 : 0; });
  }

  let beaconsPower = false;
  let flickerTimer = 0;

  function setPoppyTaken() {
    state.poppyTaken = true;
    // hide case glass and Poppy handled by main
    const glassMeshes = [];
    // The case glass was created with a shared material; identify by position near case.
    root.traverse(o => {
      if (o.isMesh && o.material === glassMat && o.position.z < -15 && o.position.z > -18 && o.position.x > 4) glassMeshes.push(o);
    });
    glassMeshes.forEach(o => { o.visible = false; });
    poppyCase.open = true;
  }

  function setChase(on) {
    state.chase = on;
    hemi.intensity = on ? .26 : .7;
    lights.lobby.forEach(l => { l.userData.dim = on ? .28 : 1; });
    lights.display.forEach(l => { l.userData.dim = on ? .35 : 1; });
    lights.loading.forEach(l => { l.userData.dim = on ? .55 : 1; });
    if (on) {
      lights.beacons.forEach(b => { if (b.isPointLight) b.intensity = 5; });
    }
  }

  function closeGate() {
    gateState.target = 0;
    gateState.broken = false;
  }
  function openGate() { gateState.target = 1; gateState.broken = false; }
  function breakGate() {
    gateState.broken = true;
    gateState.target = 1;
    gate.children.forEach(c => { if (c.isMesh) { c.rotation.z += (Math.random() - .5) * .08; } });
  }
  function closeLoadingDoor() { loadingDoorState.target = 0; }
  function openLoadingDoor() { loadingDoorState.target = 1; }
  function breakLoadingDoor() { loadingDoorState.broken = true; loadingDoorState.target = 1; }

  function update(dt, elapsed) {
    // animated collectibles
    for (const f of fuses) {
      if (!f.item.active) continue;
      f.group.position.y = f.baseY + Math.sin(elapsed * 1.8 + f.phase) * .06;
      f.group.rotation.y += dt * .85;
      if (f.group.userData.glow) f.group.userData.glow.intensity = 2.5 + Math.sin(elapsed * 3 + f.phase) * 1.1;
    }
    for (const t of tapes) {
      if (!t.item.active) continue;
      t.group.rotation.y += dt * .25;
      t.group.position.y = t.baseY + Math.sin(elapsed * 1.2 + t.phase) * .025;
    }

    // flicker
    flickerTimer -= dt;
    if (flickerTimer <= 0) {
      flickerTimer = .04 + Math.random() * .12;
      for (const l of lights.all) {
        if (l.userData.flashOff) continue;
        let base = l.userData.base;
        if (l.userData.dim != null) base *= l.userData.dim;
        if (l.userData.powered === false) base = 0;
        if (l.isSpotLight && l === lobbySpot) base *= 1 + Math.sin(elapsed * 37) * .012;
        if (l.isSpotLight && l === exitSpot) base *= .9 + Math.sin(elapsed * 2.2) * .08;
        if (l.isPointLight) {
          const n = Math.sin(elapsed * 9.3 + l.userData.phase) * .02 + Math.sin(elapsed * 23 + l.userData.phase) * .015;
          base *= 1 + n;
        }
        const flickerChance = state.chase ? .006 : .002;
        if (Math.random() < flickerChance) {
          l.intensity = base * .12;
          l.userData.flashOff = true;
          setTimeout(() => { l.userData.flashOff = false; }, 45 + Math.random() * 130);
        } else {
          l.intensity = base;
        }
      }
    }
    // beacons pulse
    const pulse = state.chase ? .5 + .5 * Math.sin(elapsed * 7.5) : .18 + .08 * Math.sin(elapsed * 2.4);
    for (const b of lights.beacons) {
      if (b.material) b.material.emissiveIntensity = 1 + pulse * 3.4;
      if (b.isPointLight) b.intensity = (beaconsPower ? 2.4 : 0) + pulse * 3.2;
    }
    // exit sign pulses
    exitGlow.intensity = 7 + Math.sin(elapsed * 3.1) * 1.4;

    // door motion
    const gateSpeed = gateState.broken ? 3.0 : 2.2;
    gateState.open += (gateState.target - gateState.open) * Math.min(1, dt * gateSpeed);
    gate.position.y = gateState.open * 3.9;
    loadingDoorState.open += (loadingDoorState.target - loadingDoorState.open) * Math.min(1, dt * 2.0);
    loadingDoor.position.y = loadingDoorState.open * 4.85;
    // loading door open/close visual crack
    if (loadingDoorState.open > .5) loadingDoor.position.y += Math.sin(elapsed * 22) * .005;

    // steam drift
    for (const s of steamSprites) {
      s.userData.phase += dt * s.userData.speed;
      s.position.y = s.userData.baseY + (s.userData.phase % 2.6) * .55;
      s.position.x = s.userData.baseX + Math.sin(elapsed * .4 + s.userData.phase) * .35;
      s.material.opacity = .025 + .05 * Math.sin((s.userData.phase % 2.6) / 2.6 * PI);
      const sc = 1 + (s.userData.phase % 2.6) * .55;
      s.scale.setScalar(sc);
    }

    // dust drift
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3 + 1] += Math.sin(elapsed * .16 + i) * .0007;
      arr[i * 3] += Math.cos(elapsed * .11 + i * .31) * .0005;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // case spotlight pulse
    if (!state.poppyTaken) {
      campLightPulse(caseSpot, elapsed, 1 + Math.sin(elapsed * 2.1) * .06);
    }
    // spawn subtle light pulse for breaker when all fuses? handled in main
    breakerGlow.intensity += 0;
  }

  function campLightPulse(light, elapsed, mul) {
    light.intensity = light.userData.base * mul;
  }

  function doorBlocked() {
    return gateState.open < .78;
  }
  function loadingDoorBlocked() {
    return loadingDoorState.open < .78;
  }

  return {
    root, zones, colliders, interactables, interactMeshes, lights, fuses, tapes, breaker, breakerItem,
    poppyItem, poppyCase, exitItem, gateState, loadingDoorState, gate, loadingDoor,
    statueSpot, caseSpot, exitSpot, poppyPlaceholder,
    setPower, setPoppyTaken, setChase, closeGate, openGate, breakGate, closeLoadingDoor, openLoadingDoor, breakLoadingDoor,
    doorBlocked, loadingDoorBlocked, update, state
  };
}
