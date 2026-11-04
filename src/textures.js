import * as THREE from 'three';

function canvas(width, height) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function toTexture(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  return t;
}

function grime(ctx, w, h, seed, count = 90, alpha = 0.1) {
  const rand = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 2 + rand() * 38;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(12, 16, 15, ${alpha * (0.3 + rand())})`);
    g.addColorStop(1, 'rgba(12, 16, 15, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // scratches
  ctx.lineWidth = 1;
  for (let i = 0; i < 34; i++) {
    ctx.strokeStyle = `rgba(12, 15, 13, ${0.04 + rand() * alpha})`;
    ctx.beginPath();
    ctx.moveTo(rand() * w, rand() * h);
    ctx.lineTo(rand() * w, rand() * h);
    ctx.stroke();
  }
}

export function concreteTexture(repeatX = 5, repeatY = 7) {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const rand = rng(13);
  ctx.fillStyle = '#343b39';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i++) {
    const v = 36 + Math.floor(rand() * 38);
    ctx.fillStyle = `rgba(${v},${v + 4},${v + 1},${0.12 + rand() * 0.32})`;
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 3, 1 + rand() * 3);
  }
  ctx.strokeStyle = 'rgba(15,20,19,.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    let x = rand() * 512;
    let y = rand() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x += (rand() - 0.5) * 90;
      y += rand() * 50;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  grime(ctx, 512, 512, 44, 100, 0.2);
  return toTexture(c, repeatX, repeatY);
}

export function tileWallTexture(repeatX = 5, repeatY = 3) {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const rand = rng(9);
  ctx.fillStyle = '#8d927d';
  ctx.fillRect(0, 0, 512, 512);
  const tw = 86;
  const th = 62;
  for (let y = 0; y < 9; y++) {
    for (let x = -1; x < 7; x++) {
      const ox = x * tw + (y % 2) * tw * 0.5;
      const shade = 142 + Math.floor(rand() * 20);
      ctx.fillStyle = `rgb(${shade - 15},${shade - 4},${shade - 25})`;
      ctx.fillRect(ox + 2, y * th + 2, tw - 4, th - 4);
      ctx.strokeStyle = 'rgba(48, 53, 45, .23)';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + 2, y * th + 2, tw - 4, th - 4);
    }
  }
  // teal wainscot
  ctx.fillStyle = '#2f6967';
  ctx.fillRect(0, 350, 512, 162);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let x = 0; x < 512; x += 64) ctx.fillRect(x, 355, 3, 152);
  grime(ctx, 512, 512, 75, 80, 0.23);
  // stains running down
  for (let i = 0; i < 15; i++) {
    const x = rand() * 512;
    const g = ctx.createLinearGradient(0, 100, 0, 512);
    g.addColorStop(0, 'rgba(38,42,34,0)');
    g.addColorStop(1, `rgba(38,42,34,${0.08 + rand() * 0.13})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 100, 2 + rand() * 12, 412);
  }
  return toTexture(c, repeatX, repeatY);
}

export function carpetTexture(repeatX = 8, repeatY = 10) {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const rand = rng(17);
  ctx.fillStyle = '#521d22';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    const v = rand();
    ctx.fillStyle = v > .5 ? 'rgba(114,42,45,.2)' : 'rgba(23,10,12,.25)';
    ctx.fillRect(rand() * 512, rand() * 512, 1, 2);
  }
  ctx.strokeStyle = 'rgba(188,150,96,.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.strokeRect(18 + i * 12, 18 + i * 12, 476 - i * 24, 476 - i * 24);
  }
  // diamond motif
  ctx.strokeStyle = 'rgba(197,163,105,.13)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(x + 64, y + 30);
      ctx.lineTo(x + 98, y + 64);
      ctx.lineTo(x + 64, y + 98);
      ctx.lineTo(x + 30, y + 64);
      ctx.closePath();
      ctx.stroke();
    }
  }
  grime(ctx, 512, 512, 55, 60, 0.24);
  return toTexture(c, repeatX, repeatY);
}

export function metalTexture(repeatX = 4, repeatY = 3, tint = '#58615e') {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const rand = rng(23);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    ctx.strokeStyle = 'rgba(16,22,21,.26)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, 256, 32);
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    ctx.fillRect(0, y + 1, 256, 1);
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(${20 + rand() * 30},${25 + rand() * 30},${23 + rand() * 28},${.05 + rand() * .16})`;
    ctx.fillRect(rand() * 256, rand() * 256, 3 + rand() * 18, 2 + rand() * 8);
  }
  // rivets
  for (let x = 10; x < 256; x += 42) {
    for (let y = 9; y < 256; y += 32) {
      ctx.fillStyle = 'rgba(228,225,202,.22)';
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  grime(ctx, 256, 256, 61, 26, .18);
  return toTexture(c, repeatX, repeatY);
}

export function woodTexture(repeatX = 3, repeatY = 3) {
  const c = canvas(512, 256);
  const ctx = c.getContext('2d');
  const rand = rng(31);
  ctx.fillStyle = '#573c28';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${20 + rand() * 30},${12 + rand() * 15},${8 + rand() * 10},${.05 + rand() * .16})`;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    const y = rand() * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + (rand() - .5) * 20, 320, y + (rand() - .5) * 26, 512, y + (rand() - .5) * 10);
    ctx.stroke();
  }
  grime(ctx, 512, 256, 43, 35, .17);
  return toTexture(c, repeatX, repeatY);
}

export function hazardTexture() {
  const c = canvas(256, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d4ae36';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#1c1e1a';
  for (let x = -64; x < 300; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 32, 0);
    ctx.lineTo(x + 64, 64);
    ctx.lineTo(x + 32, 64);
    ctx.closePath();
    ctx.fill();
  }
  grime(ctx, 256, 64, 15, 22, .15);
  return toTexture(c, 5, 1);
}

function wrapText(ctx, text, maxWidth, lineHeight, y) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, 0, y);
      line = word;
      y += lineHeight;
    } else line = test;
  }
  if (line) ctx.fillText(line, 0, y);
  return y;
}

export function signTexture({
  width = 1024, height = 512, bg = '#20120f', title = 'PLAYTIME CO.',
  subtitle = '', body = '', accent = '#d72b32', style = 'classic', footer = ''
} = {}) {
  const c = canvas(width, height);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (style === 'logo') {
    // sunburst
    ctx.save();
    ctx.translate(width / 2, height * 0.43);
    for (let i = 0; i < 32; i++) {
      ctx.rotate((Math.PI * 2) / 32);
      ctx.fillStyle = i % 2 ? 'rgba(240,187,66,.12)' : 'rgba(240,187,66,.04)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, -height); ctx.lineTo(-70, -height); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,221,174,.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    ctx.strokeRect(35, 35, width - 70, height - 70);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2e7c8';
    ctx.font = `900 ${Math.floor(height * .2)}px Impact, Haettenschweiler, sans-serif`;
    ctx.fillText(title, width / 2, height * .5);
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.floor(height * .055)}px "Courier New", monospace`;
    ctx.letterSpacing = '8px';
    ctx.fillText(subtitle || 'A WORLD OF PLAY', width / 2, height * .63);
    ctx.fillStyle = 'rgba(242,231,200,.55)';
    ctx.font = `700 ${Math.floor(height * .03)}px "Courier New", monospace`;
    ctx.fillText('PLAY • LAUGH • STAY', width / 2, height * .82);
    return toTexture(c);
  }

  if (style === 'poster') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    // stylized blue monster silhouette
    ctx.save();
    ctx.translate(width * .56, height * .55);
    ctx.fillStyle = 'rgba(24, 79, 119, .38)';
    ctx.beginPath();
    ctx.ellipse(0, 20, width * .24, height * .32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -height * .2, width * .15, height * .18, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = 'rgba(247,235,201,.9)';
    ctx.beginPath(); ctx.arc(-width * .06, -height * .23, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width * .06, -height * .23, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#15110f';
    ctx.beginPath(); ctx.arc(-width * .055, -height * .23, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width * .065, -height * .23, 8, 0, Math.PI * 2); ctx.fill();
    // grin
    ctx.strokeStyle = '#d8c9a8'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(0, -height * .15, width * .105, .12, Math.PI - .12); ctx.stroke();
    // arms
    ctx.strokeStyle = 'rgba(24,79,119,.38)'; ctx.lineWidth = width * .06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-width * .2, 0); ctx.quadraticCurveTo(-width * .36, height * .1, -width * .3, height * .27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width * .2, 0); ctx.quadraticCurveTo(width * .36, height * .1, width * .3, height * .27); ctx.stroke();
    ctx.restore();
    // text
    ctx.fillStyle = '#f0e4c6';
    ctx.font = `900 ${Math.floor(height * .17)}px Impact, Haettenschweiler, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height * .2);
    ctx.strokeStyle = accent; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(width * .17, height * .25); ctx.lineTo(width * .83, height * .25); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.floor(height * .045)}px "Courier New", monospace`;
    ctx.fillText(subtitle, width / 2, height * .33);
    ctx.fillStyle = 'rgba(240,228,198,.7)';
    ctx.font = `700 ${Math.floor(height * .028)}px "Courier New", monospace`;
    ctx.fillText(body, width / 2, height * .88);
    ctx.strokeStyle = 'rgba(240,228,198,.3)'; ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
    return toTexture(c);
  }

  if (style === 'employee') {
    // security door / industrial notice
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(241,230,200,.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.fillStyle = accent;
    ctx.font = `900 ${Math.floor(height * .21)}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height * .34);
    ctx.fillStyle = '#ece3c9';
    ctx.font = `700 ${Math.floor(height * .075)}px "Courier New", monospace`;
    ctx.fillText(subtitle, width / 2, height * .5);
    if (body) {
      ctx.fillStyle = 'rgba(236,227,201,.6)';
      ctx.font = `700 ${Math.floor(height * .05)}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      wrapText(ctx, body, width - 100, height * .07, height * .64);
    }
    if (footer) {
      ctx.fillStyle = 'rgba(236,227,201,.35)';
      ctx.font = `700 ${Math.floor(height * .035)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(footer, width / 2, height * .92);
    }
    return toTexture(c);
  }

  // generic label
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(235,223,192,.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = `900 ${Math.floor(height * .25)}px Impact, sans-serif`;
  ctx.fillText(title, width / 2, height * .43);
  ctx.fillStyle = '#ece3c9';
  ctx.font = `700 ${Math.floor(height * .08)}px "Courier New", monospace`;
  ctx.fillText(subtitle, width / 2, height * .6);
  if (body) {
    ctx.fillStyle = 'rgba(236,227,201,.6)';
    ctx.font = `700 ${Math.floor(height * .05)}px "Courier New", monospace`;
    ctx.fillText(body, width / 2, height * .75);
  }
  return toTexture(c);
}

export function toyBoxTexture(color = '#b42c33', name = 'HUGGY WUGGY') {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(255,255,255,.09)';
  for (let i = 0; i < 8; i++) ctx.fillRect(0, i * 32, 256, 4);
  ctx.fillStyle = 'rgba(241,229,199,.93)';
  ctx.fillRect(18, 18, 220, 128);
  ctx.fillStyle = '#1d5b84';
  ctx.beginPath(); ctx.ellipse(128, 84, 50, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f6e9c6';
  ctx.beginPath(); ctx.arc(112, 70, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(145, 70, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#181512';
  ctx.beginPath(); ctx.arc(114, 71, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(143, 71, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8c7a3'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(128, 93, 26, .15, Math.PI - .15); ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '900 27px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 185);
  ctx.fillStyle = 'rgba(10,12,12,.6)';
  ctx.font = '700 10px "Courier New", monospace';
  ctx.fillText('PLAYTIME CO. • AGES 4+', 128, 211);
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 240);
  return toTexture(c);
}

export function paperTexture(base = '#cfc2a1', seed = 8) {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(40,36,28,${rand() * .09})`;
    ctx.fillRect(rand() * 128, rand() * 128, 1, 1);
  }
  return toTexture(c);
}

export function radialSprite(color = 'rgba(220,235,220,.8)') {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(.25, color.replace(/[\d.]+\)$/, '.45)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(c);
}

export function flashSprite() {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,252,226,1)');
  g.addColorStop(.15, 'rgba(255,235,172,.8)');
  g.addColorStop(.55, 'rgba(255,170,60,.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(c);
}
