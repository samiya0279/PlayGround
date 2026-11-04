import * as THREE from 'three';

function furBump() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8c8c8c';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1700; i++) {
    const v = 50 + Math.random() * 150;
    ctx.strokeStyle = `rgba(${v},${v},${v},.55)`;
    ctx.lineWidth = 1;
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - .5) * 3, y + 2 + Math.random() * 5);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 4);
  return t;
}

function rod(radius, length, material, radialSegments = 10) {
  const g = new THREE.CylinderGeometry(radius, radius * .9, length, radialSegments);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function ball(rx, ry, rz, material, seg = 20) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(10, seg - 4)), material);
  m.scale.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cone(r, h, material, seg = 10) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  m.castShadow = true;
  return m;
}

function smileShape(width, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width, depth * .4);
  shape.bezierCurveTo(-width * .6, -depth, width * .6, -depth, width, depth * .4);
  shape.bezierCurveTo(width * .45, depth * .8, -width * .45, depth * .8, -width, depth * .4);
  return shape;
}

export function createHuggy() {
  const root = new THREE.Group();
  root.name = 'Huggy Wuggy';

  const bump = furBump();
  const fur = new THREE.MeshStandardMaterial({
    color: 0x1b5f98, roughness: .94, metalness: .02, bumpMap: bump, bumpScale: .19,
    emissive: 0x03121f, emissiveIntensity: .55
  });
  const furDark = new THREE.MeshStandardMaterial({ color: 0x12446f, roughness: .96, bumpMap: bump, bumpScale: .15 });
  const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xd8c08f, roughness: .82, bumpMap: bump, bumpScale: .04 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x3d060b, roughness: .78, emissive: 0x180004, emissiveIntensity: .7 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xeee5ca, roughness: .55 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf5f0d8, roughness: .3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0b0d0b, roughness: .35 });
  const clawMat = new THREE.MeshStandardMaterial({ color: 0xcbb68d, roughness: .7 });

  // torso
  const torso = ball(.83, 1.13, .62, fur, 28);
  torso.position.y = 2.23;
  root.add(torso);
  const belly = ball(.58, .76, .1, furDark, 20);
  belly.position.set(0, 2.1, .58);
  root.add(belly);

  // hips
  const hip = ball(.64, .4, .48, furDark, 18);
  hip.position.y = 1.4;
  root.add(hip);

  // head group
  const head = new THREE.Group();
  head.position.y = 3.55;
  root.add(head);
  const skull = ball(.69, .65, .64, fur, 28);
  head.add(skull);

  // ears
  for (const s of [-1, 1]) {
    const ear = ball(.21, .26, .12, fur, 12);
    ear.position.set(s * .61, .23, -.02);
    head.add(ear);
    const inner = ball(.12, .16, .06, furDark, 10);
    inner.position.set(s * .62, .23, .08);
    head.add(inner);
  }

  // muzzle
  const muzzle = ball(.48, .3, .3, muzzleMat, 24);
  muzzle.position.set(0, -.19, .5);
  head.add(muzzle);

  // mouth
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(smileShape(.47, .34), 24), mouthMat);
  mouth.position.set(0, -.2, .775);
  mouth.scale.y = -1;
  head.add(mouth);

  // lips outline
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.44, .035, 8, 28, Math.PI), mouthMat);
  lip.rotation.z = Math.PI;
  lip.position.set(0, -.23, .78);
  lip.scale.set(1, .65, 1);
  head.add(lip);

  // teeth
  for (let i = 0; i < 7; i++) {
    const t = cone(.043, .16, toothMat, 5);
    t.position.set(-.35 + i * .116, -.05, .81);
    t.rotation.z = .04 * (i - 3);
    head.add(t);
  }
  for (let i = 0; i < 6; i++) {
    const t = cone(.04, .14, toothMat, 5);
    t.position.set(-.3 + i * .12, -.38, .81);
    t.rotation.x = Math.PI;
    head.add(t);
  }

  // eyes
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = ball(.22, .26, .12, eyeMat, 18);
    eye.position.set(s * .259, .13, .54);
    head.add(eye);
    const pupil = ball(.085, .105, .035, pupilMat, 12);
    pupil.position.set(s * .25, .13, .655);
    head.add(pupil);
    const glint = ball(.024, .028, .01, new THREE.MeshBasicMaterial({ color: 0xffffff }), 8);
    glint.position.set(s * .23, .17, .69);
    head.add(glint);
    eyes.push(eye);
  }

  // eyebrows (fur)
  for (const s of [-1, 1]) {
    const brow = ball(.25, .08, .06, furDark, 10);
    brow.position.set(s * .24, .38, .52);
    brow.rotation.z = s * -.12;
    head.add(brow);
  }

  // arms
  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * .78, 2.93, 0);
    shoulder.rotation.z = side * .12;
    root.add(shoulder);
    const upper = rod(.17, 1.18, fur, 12);
    upper.position.y = -.59;
    shoulder.add(upper);
    const elbow = ball(.19, .19, .19, fur, 12);
    elbow.position.y = -1.17;
    shoulder.add(elbow);
    const fore = new THREE.Group();
    fore.position.y = -1.17;
    shoulder.add(fore);
    const lower = rod(.14, 1.06, fur, 12);
    lower.position.y = -.52;
    fore.add(lower);
    const hand = ball(.22, .28, .16, furDark, 14);
    hand.position.y = -1.06;
    hand.scale.x = .22;
    fore.add(hand);
    for (let f = 0; f < 4; f++) {
      const finger = rod(.043, .4, furDark, 6);
      finger.position.set((f - 1.5) * .1, -1.38, .04);
      finger.rotation.z = (f - 1.5) * -.12;
      fore.add(finger);
      const claw = cone(.035, .11, clawMat, 6);
      claw.position.set((f - 1.5) * .1, -1.6, .04);
      claw.rotation.x = Math.PI;
      fore.add(claw);
    }
    arms.push({ shoulder, fore, side });
  }

  // legs
  const legs = [];
  for (const side of [-1, 1]) {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * .38, 1.35, 0);
    root.add(hipJoint);
    const thigh = rod(.22, .8, fur, 12);
    thigh.position.y = -.4;
    hipJoint.add(thigh);
    const knee = ball(.21, .2, .2, fur, 12);
    knee.position.y = -.8;
    hipJoint.add(knee);
    const shin = new THREE.Group();
    shin.position.y = -.8;
    hipJoint.add(shin);
    const calf = rod(.18, .72, fur, 12);
    calf.position.y = -.35;
    shin.add(calf);
    const foot = ball(.29, .15, .46, furDark, 14);
    foot.position.set(0, -.73, .15);
    shin.add(foot);
    for (let t = 0; t < 3; t++) {
      const toe = ball(.065, .08, .12, clawMat, 8);
      toe.position.set((t - 1) * .12, -.83, .55);
      shin.add(toe);
    }
    legs.push({ hip: hipJoint, shin, side });
  }

  root.userData = { head, arms, legs, eyes, torso, mouth, mode: 'statue', walkTime: 0, breathe: 0 };
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

export function updateHuggy(huggy, dt, speed = 0, moving = false, enraged = false) {
  const d = huggy.userData;
  d.breathe += dt;
  if (d.mode === 'statue') {
    // rigid display pose, faint torso breath
    d.torso.scale.y = 1.13 + Math.sin(d.breathe * 1.1) * .012;
    return;
  }
  const targetSpeed = moving ? Math.min(speed, 7) : 0;
  d.walkTime += dt * (2.1 + targetSpeed * 1.15);
  const stride = moving ? Math.min(1, targetSpeed / 4) : 0;
  for (const leg of d.legs) {
    const phase = d.walkTime + (leg.side > 0 ? Math.PI : 0);
    leg.hip.rotation.x = Math.sin(phase) * .64 * stride;
    leg.shin.rotation.x = Math.max(0, -Math.sin(phase + .8)) * .55 * stride;
  }
  for (const arm of d.arms) {
    const phase = d.walkTime + (arm.side > 0 ? 0 : Math.PI);
    arm.shoulder.rotation.x = -Math.sin(phase) * .55 * stride;
    arm.shoulder.rotation.z = arm.side * (.12 + (enraged ? .22 : 0));
    arm.fore.rotation.x = -.12 - Math.max(0, Math.sin(phase + .5)) * .3 * stride - (enraged ? .3 : 0);
  }
  const bob = Math.abs(Math.sin(d.walkTime)) * .085 * stride;
  huggy.position.y = (d.baseY || 0) + bob;
  d.torso.scale.set(.83 + Math.sin(d.breathe * 2) * .008, 1.13 + Math.sin(d.breathe * 2) * .014, .62);
  d.head.rotation.z = Math.sin(d.walkTime * .52) * .055 * (stride + .3);
  d.head.rotation.x = Math.sin(d.walkTime * .8) * .035 * stride + (enraged ? -.08 : 0);
  d.mouth.scale.y = -1 - Math.abs(Math.sin(d.breathe * 2.2)) * .025;
  if (enraged) {
    d.eyes.forEach(e => { e.material.emissive?.setHex(0x220000); });
  }
}

export function createPoppy() {
  const root = new THREE.Group();
  root.name = 'Poppy';
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xf2e8dc, roughness: .34, metalness: .02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xb84b21, roughness: .72 });
  const dressMat = new THREE.MeshStandardMaterial({ color: 0x59765a, roughness: .83 });
  const dressDark = new THREE.MeshStandardMaterial({ color: 0x3e5a42, roughness: .86 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1b1b17, roughness: .4 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xfdfaf0, roughness: .2 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x4e8c5f, roughness: .2, emissive: 0x0a2a12, emissiveIntensity: .3 });
  const black = new THREE.MeshStandardMaterial({ color: 0x080a08, roughness: .25 });
  const red = new THREE.MeshStandardMaterial({ color: 0xb43f3c, roughness: .5 });

  const head = ball(.2, .22, .195, porcelain, 24);
  head.position.y = .84;
  root.add(head);
  const jaw = ball(.145, .1, .15, porcelain, 18);
  jaw.position.set(0, .72, .03);
  root.add(jaw);

  const hairCap = ball(.22, .205, .21, hairMat, 24);
  hairCap.position.set(0, .9, -.045);
  root.add(hairCap);
  const fringe = ball(.19, .1, .1, hairMat, 16);
  fringe.position.set(0, 1.01, .13);
  root.add(fringe);
  for (const s of [-1, 1]) {
    const bun = ball(.11, .13, .11, hairMat, 16);
    bun.position.set(s * .22, .94, -.02);
    root.add(bun);
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(.08, .018, 6, 14), red);
    ribbon.position.set(s * .22, .94, .07);
    root.add(ribbon);
  }

  for (const s of [-1, 1]) {
    const eye = ball(.058, .07, .027, eyeWhite, 14);
    eye.position.set(s * .078, .86, .181);
    root.add(eye);
    const p = ball(.03, .04, .012, iris, 10);
    p.position.set(s * .078, .855, .207);
    root.add(p);
    const pupil = ball(.015, .021, .007, black, 8);
    pupil.position.set(s * .078, .855, .218);
    root.add(pupil);
    // lashes
    const lash = new THREE.Mesh(new THREE.BoxGeometry(.06, .009, .01), black);
    lash.position.set(s * .078, .928, .195);
    lash.rotation.z = s * .08;
    root.add(lash);
  }
  // nose + smile
  const nose = ball(.017, .019, .014, porcelain, 8);
  nose.position.set(0, .79, .197);
  root.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.043, .008, 5, 14, Math.PI), red);
  smile.rotation.z = Math.PI;
  smile.position.set(0, .758, .198);
  root.add(smile);
  // cheeks
  for (const s of [-1, 1]) {
    const cheek = ball(.045, .027, .01, new THREE.MeshStandardMaterial({ color: 0xd9a08e, roughness: .8 }), 8);
    cheek.position.set(s * .12, .77, .178);
    root.add(cheek);
  }

  // neck / dress
  const neck = rod(.055, .12, porcelain, 10);
  neck.position.y = .66;
  root.add(neck);
  const bodice = new THREE.Mesh(new THREE.ConeGeometry(.23, .44, 18, 1, false), dressMat);
  bodice.position.y = .42;
  root.add(bodice);
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(.32, .33, 22, 1, true), dressMat);
  skirt.position.y = .25;
  skirt.material.side = THREE.DoubleSide;
  root.add(skirt);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.13, .032, 6, 18), dressDark);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = .64;
  root.add(collar);
  const button = ball(.022, .022, .012, new THREE.MeshStandardMaterial({ color: 0xc9a54b, roughness: .4 }), 8);
  button.position.set(0, .52, .22);
  root.add(button);

  // arms
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * .2, .56, 0);
    shoulder.rotation.z = s * .42;
    root.add(shoulder);
    const upper = rod(.038, .25, dressMat, 8);
    upper.position.y = -.12;
    shoulder.add(upper);
    const lower = rod(.032, .22, porcelain, 8);
    lower.position.y = -.35;
    lower.rotation.z = s * -.15;
    shoulder.add(lower);
    const hand = ball(.045, .06, .035, porcelain, 8);
    hand.position.set(s * .035, -.48, 0);
    shoulder.add(hand);
  }

  // legs
  for (const s of [-1, 1]) {
    const leg = rod(.043, .23, porcelain, 8);
    leg.position.set(s * .085, .08, 0);
    root.add(leg);
    const sock = rod(.048, .09, new THREE.MeshStandardMaterial({ color: 0xf1eee2, roughness: .8 }), 8);
    sock.position.set(s * .085, .06, 0);
    root.add(sock);
    const shoe = ball(.065, .04, .11, shoeMat, 10);
    shoe.position.set(s * .085, -.025, .04);
    root.add(shoe);
  }

  root.scale.setScalar(1.45);
  root.position.y = .84;
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return root;
}

function makeGlove(color, wristColor) {
  const gloveMat = new THREE.MeshStandardMaterial({ color, roughness: .58, metalness: .02 });
  const cuffMat = new THREE.MeshStandardMaterial({ color: wristColor, roughness: .45, metalness: .18 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101719, roughness: .8 });
  const g = new THREE.Group();
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.075, .09, .2, 10), cuffMat);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.z = .07;
  g.add(cuff);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(.082, 14, 10), gloveMat);
  palm.scale.set(1, .85, .95);
  palm.position.z = -.13;
  g.add(palm);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Group();
    finger.position.set((i - 1.5) * .038, -.005, -.19);
    const seg = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .075, 4, 8), gloveMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.z = -.045;
    finger.add(seg);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.019, 8, 6), gloveMat);
    tip.position.z = -.09;
    finger.add(tip);
    g.add(finger);
    fingers.push(finger);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(.022, .07, 4, 8), gloveMat);
  thumb.rotation.z = 1.05;
  thumb.position.set(-.08, -.01, -.12);
  g.add(thumb);
  // forearm extends downward, out of the camera so it reads as a glove at the screen edge
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.046, .06, .55, 8), dark);
  arm.position.set(-.01, -.33, .02);
  arm.rotation.z = .1;
  g.add(arm);
  [cuff, palm, arm, thumb].forEach(m => { m.castShadow = true; });
  g.userData = { fingers, palm, cuff };
  return g;
}

export function createGrabPack() {
  const root = new THREE.Group();
  root.position.set(.56, -.62, -.86);
  root.rotation.set(-.24, -.16, -.1);
  const right = makeGlove(0x2d9dd0, 0xd7b43b);
  right.scale.setScalar(1.42);
  root.add(right);

  const left = new THREE.Group();
  left.position.set(-.92, -.04, -.03);
  left.rotation.set(.1, .18, .1);
  const l = makeGlove(0xc6433d, 0xb89d36);
  l.scale.setScalar(1.95);
  left.add(l);
  left.visible = false;
  root.add(left);

  // grabpack pack back plate hints at lower screen
  const pack = new THREE.Group();
  pack.position.set(-.26, -.22, .28);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.44, .35, .06), new THREE.MeshStandardMaterial({ color: 0x222a2b, roughness: .72 }));
  plate.rotation.x = -.32;
  pack.add(plate);
  for (const s of [-1, 1]) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(.075, .018, 6, 14), new THREE.MeshStandardMaterial({ color: s < 0 ? 0xb53d39 : 0x2e91be, roughness: .5 }));
    coil.position.set(s * .12, .01, -.02);
    pack.add(coil);
  }
  root.add(pack);

  root.userData = { right, left, pack, active: 0, cooldown: 0, trigger: 0 };
  root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return root;
}

export function updateGrabPack(pack, dt, grabbing = false) {
  const d = pack.userData;
  d.trigger = Math.max(0, d.trigger - dt * 2.8);
  const out = grabbing ? Math.sin(Math.min(1, d.trigger) * Math.PI) : 0;
  const breathe = performance.now() * .001;
  pack.position.x = .56 + Math.sin(breathe * .7) * .006;
  pack.position.y = -.62 + Math.sin(breathe * 1.05) * .008;
  pack.rotation.z = -.1 + Math.sin(breathe * .6) * .012;
  d.right.position.z = 0 - out * .72;
  d.right.position.y = 0 + out * .23;
  d.right.rotation.x = -.24 + out * .35;
  d.right.userData.fingers.forEach((f, i) => {
    f.rotation.x = out * .7 + Math.sin(breathe * 1.3 + i) * .03;
  });
  d.left.position.y = -.04 + Math.sin(breathe * .9 + 1) * .01;
}
