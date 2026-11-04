import * as THREE from 'three';
import './styles.css';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { createHuggy, updateHuggy, createGrabPack, updateGrabPack, createPoppy } from './character.js';
import { Soundscape } from './audio.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ------------------------------------------------------------------ renderer
const canvas = $('game');

// Probe the GPU before building the real renderer so software rasterizers can
// skip MSAA, shadows and postprocessing entirely. SwiftShader in CI is roughly
// two orders of magnitude slower than a real GPU.
function isSoftwareGPU() {
  try {
    const probe = document.createElement('canvas');
    const ctx = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!ctx) return true;
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    const lost = ctx.isContextLost?.();
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return lost || /swiftshader|llvmpipe|softpipe|software/i.test(name);
  } catch (error) {
    return true;
  }
}
const softwareRenderer = isSoftwareGPU();
if (softwareRenderer) document.documentElement.classList.add('low-fx');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: !softwareRenderer, powerPreference: 'default', alpha: false, stencil: false,
    preserveDrawingBuffer: false
  });
} catch (error) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
}
const maxPixelRatio = softwareRenderer ? .7 : 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
const gl = renderer.getContext();
const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
const gpuName = debugExt ? String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)) : '';
renderer.shadowMap.enabled = !softwareRenderer;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x040909, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040a0b);
scene.fog = new THREE.FogExp2(0x071111, 0.019);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 180);
camera.rotation.order = 'YXZ';
camera.position.set(0, 2.0, 24.6);
scene.add(camera);

// Postprocessing is a luxury the software rasterizer cannot afford; it also
// costs a full-resolution copy every frame on real GPUs, but bloom is core to
// the look so keep it there.
const usePost = !softwareRenderer;
let composer = null;
let bloom = null;
if (usePost) {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.52, 0.68, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}
function renderFrame() {
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// ------------------------------------------------------------------ world
const world = buildWorld(scene);
const huggy = createHuggy();
huggy.position.set(0, 1.42, -4.0);
huggy.userData.baseY = 1.42;
huggy.userData.mode = 'statue';
world.root.add(huggy);

const grabPack = createGrabPack();
grabPack.visible = false;
camera.add(grabPack);

const carriedPoppy = new THREE.Group();
const carriedDoll = createPoppy();
carriedDoll.position.y = -0.84;
carriedPoppy.add(carriedDoll);
carriedPoppy.scale.setScalar(.43);
carriedPoppy.position.set(-.48, -.63, -.98);
carriedPoppy.rotation.set(-.12, .22, .14);
carriedPoppy.visible = false;
camera.add(carriedPoppy);

// flashlight
const flashlight = new THREE.SpotLight(0xffedc8, 39, 20, .42, .6, 1.35);
flashlight.position.set(.16, -.09, .06);
flashlight.target.position.set(0, -.02, -4);
flashlight.castShadow = false;
camera.add(flashlight);
camera.add(flashlight.target);
flashlight.visible = false;

// ------------------------------------------------------------------ ui refs
const ui = {
  hud: $('hud'), menu: $('menu'), play: $('play-button'), how: $('how-button'), howScreen: $('how-screen'),
  howClose: $('how-close'), pause: $('pause-screen'), resume: $('resume-button'), quit: $('quit-button'),
  death: $('death-screen'), retry: $('retry-button'), deathQuit: $('death-quit'),
  win: $('win-screen'), again: $('again-button'), loading: $('loading'),
  objective: $('objective'), objectiveDetail: $('objective-detail'), fuseDots: [...document.querySelectorAll('.fuse-dot')],
  tapeCount: $('tape-count'), interact: $('interact'), interactLabel: $('interact-label'), crosshair: $('crosshair'),
  stamina: $('stamina'), staminaWrap: $('stamina-wrap'), subtitle: $('subtitle'), toast: $('toast'),
  alarm: document.querySelector('.alarm-flash'), damage: document.querySelector('.damage-flash'),
  intro: $('intro-title'), chasePopup: $('chase-popup'), mobile: $('mobile-controls'),
  joystick: $('joystick'), stick: $('joystick-knob'), lookPad: $('look-pad'),
  mobileUse: $('mobile-use'), mobileSprint: $('mobile-sprint'), mobileLight: $('mobile-light'),
  statTime: $('stat-time'), statTapes: $('stat-tapes')
};

// ------------------------------------------------------------------ state
const sound = new Soundscape();
const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && matchMedia('(max-width: 1024px)').matches);
const autoCapture = navigator.webdriver === true;
const player = {
  x: 0, z: 24.5, eye: 1.68, radius: .34, yaw: 0, pitch: -.015,
  stamina: 100, sprintLocked: false, bob: 0, stepTimer: 0, walkBlend: 0
};
const inventory = { fuses: 0, tapes: 0, poppy: false };
const game = {
  state: 'menu', beforePause: 'playing', elapsed: 0, started: false,
  controlLocked: false, flashlight: true, dead: false, grace: 0
};
const chase = {
  active: false, speed: 4.65, gate: { triggered: false, t: 0, broken: false },
  loading: { triggered: false, t: 0, broken: false }, stepTimer: 0, growlTimer: 3, lastDistance: 99
};
let cutscene = null;
let shake = 0;
let gameTime = 0;
let subtitleTimer = null;
let toastTimer = null;
let introTimer = null;
let currentInteract = null;
let locked = false;
let mouseHeld = false;
let jumpScareTimer = null;

const keys = new Set();
const touch = { joyX: 0, joyY: 0, joyId: null, lookId: null, lookX: 0, lookY: 0, sprint: false };

// ------------------------------------------------------------------ helpers
function setObjective(title, detail) {
  ui.objective.textContent = title;
  ui.objectiveDetail.textContent = detail;
}

function updateFuseHud() {
  ui.fuseDots.forEach((d, i) => d.classList.toggle('filled', i < inventory.fuses));
}

function showSubtitle(text, duration = 4.4) {
  clearTimeout(subtitleTimer);
  ui.subtitle.innerHTML = text;
  ui.subtitle.classList.add('show');
  subtitleTimer = setTimeout(() => ui.subtitle.classList.remove('show'), duration * 1000);
}

function showToast(text, warn = false, duration = 2.5) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.classList.toggle('warn', warn);
  ui.toast.classList.add('show');
  toastTimer = setTimeout(() => ui.toast.classList.remove('show'), duration * 1000);
}

function addShake(amount) {
  shake = Math.min(1.4, shake + amount);
}

function requestLock() {
  if (isTouch || autoCapture) return;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    try { canvas.requestPointerLock(); } catch { }
  }
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function positionFree(x, z) {
  let inZone = false;
  for (const zone of world.zones) {
    if (x > zone.x1 && x < zone.x2 && z > zone.z1 && z < zone.z2) { inZone = true; break; }
  }
  if (!inZone) return false;
  const r = player.radius;
  for (const c of world.colliders) {
    if (x > c.x1 - r && x < c.x2 + r && z > c.z1 - r && z < c.z2 + r) return false;
  }
  if (world.doorBlocked() && x > -2.25 - r && x < 2.25 + r && z > -22.45 - r && z < -21.4 + r) return false;
  if (world.loadingDoorBlocked() && x > -2.8 - r && x < 2.8 + r && z > -55.5 - r && z < -54.3 + r) return false;
  return true;
}

function movePlayer(dx, dz) {
  if (positionFree(player.x + dx, player.z)) player.x += dx;
  if (positionFree(player.x, player.z + dz)) player.z += dz;
}

function nearestExit() {
  return Math.hypot(player.x, player.z + 74.5);
}

// ------------------------------------------------------------------ game flow
function startGame() {
  if (game.started) return;
  game.started = true;
  game.state = 'playing';
  game.elapsed = 0;
  game.controlLocked = false;
  sound.init();
  ui.menu.classList.add('hidden');
  ui.howScreen.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  ui.loading.classList.add('done');
  gameTime = 0;
  grabPack.visible = true;
  flashlight.visible = game.flashlight;
  if (isTouch) ui.mobile.classList.remove('hidden');
  player.x = 0; player.z = 24.5; player.yaw = 0; player.pitch = -.015;
  setObjective('RESTORE THE FACTORY POWER', 'Locate three fuses. Make the lights come back.');
  ui.stick.style.transform = 'translate(-50%, -50%)';
  updateFuseHud();
  requestLock();
  setTimeout(() => showSubtitle('The invitation said the factory was still open. The front gate was already unlocked.', 5.2), 1300);
  clearTimeout(introTimer);
  introTimer = setTimeout(() => {
    ui.intro.classList.add('out');
    setTimeout(() => ui.intro.classList.add('hidden'), 850);
  }, 2600);
}

function resetToMenu() {
  location.reload();
}

function pauseGame() {
  if (!['playing', 'chase'].includes(game.state) || game.controlLocked) return;
  game.beforePause = game.state;
  game.state = 'paused';
  ui.pause.classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  if (sound.ctx?.state === 'running') sound.ctx.suspend();
}

function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = game.beforePause;
  ui.pause.classList.add('hidden');
  if (sound.ctx?.state === 'suspended') sound.ctx.resume();
  requestLock();
}

function powerOn() {
  if (world.state.power) return;
  world.setPower(true);
  sound.powerOn();
  addShake(.26);
  setObjective('RETRIEVE POPPY', 'The showroom is powered. She is waiting inside the glass case.');
  showToast('AUXILIARY POWER ONLINE');
  showSubtitle('The lights stutter awake. Somewhere down the hall, a music box begins to play.', 5);
  setTimeout(() => showSubtitle('<span class="who">PA SYSTEM:</span> Attention, employees. The showroom is now open. Please do not touch the exhibits.', 5), 5200);
  // brief emf surge in the flashlight
  game.flashlight = false;
  flashlight.visible = false;
  setTimeout(() => { game.flashlight = true; flashlight.visible = true; }, 380);
}

function beginChaseSequence() {
  if (game.state === 'chase') return;
  game.state = 'chase';
  game.controlLocked = true;
  inventory.poppy = true;
  world.poppyItem.active = false;
  world.setPoppyTaken();
  world.poppyPlaceholder.visible = false;
  carriedPoppy.visible = true;
  sound.glassBreak();
  sound.roar();
  sound.startChase();
  ui.alarm.classList.add('on');
  ui.chasePopup.classList.remove('hidden');
  ui.chasePopup.style.animation = 'none';
  void ui.chasePopup.offsetWidth;
  ui.chasePopup.style.animation = '';
  addShake(.9);
  setObjective('RUN.', 'Reach the loading bay. Do not look back.');
  const dx = 0 - player.x;
  const dz = -4 - player.z;
  const targetYaw = Math.atan2(-dx, -dz);
  cutscene = {
    t: 0, duration: 3.0, lookYaw: targetYaw, startYaw: player.yaw,
    glassDone: false, chaseStarted: false, huggyLive: false, roarDone: false
  };
  // face the statue
  setTimeout(() => {}, 0);
}

function finishChaseSequence() {
  if (!cutscene) return;
  game.controlLocked = false;
  chase.active = true;
  game.grace = 1.1;
  ui.chasePopup.classList.add('hidden');
  showSubtitle('<span class="who">POPPY:</span> Run. He only wants to hug you.', 4.2);
}

function triggerWin() {
  if (game.state === 'win' || game.state === 'dead') return;
  game.state = 'win';
  chase.active = false;
  game.controlLocked = true;
  sound.win();
  ui.alarm.classList.remove('on');
  world.setChase(false);
  grabPack.visible = false;
  if (document.pointerLockElement) document.exitPointerLock();
  setTimeout(() => {
    ui.hud.classList.add('hidden');
    ui.win.classList.remove('hidden');
    ui.statTime.textContent = formatTime(gameTime);
    ui.statTapes.textContent = `${inventory.tapes} / 3`;
  }, 850);
}

function die() {
  if (game.state === 'dead' || game.state === 'win' || jumpScareTimer) return;
  game.state = 'dead';
  game.controlLocked = true;
  chase.active = false;
  sound.lose();
  ui.alarm.classList.remove('on');
  ui.damage.style.transition = 'none';
  ui.damage.style.opacity = '.85';
  requestAnimationFrame(() => {
    ui.damage.style.transition = 'opacity .7s';
    ui.damage.style.opacity = '0';
  });
  addShake(1.2);
  if (document.pointerLockElement) document.exitPointerLock();
  jumpScareTimer = setTimeout(() => {
    ui.death.classList.remove('hidden');
    ui.hud.classList.add('hidden');
    jumpScareTimer = null;
  }, 700);
}

function retryChase() {
  clearTimeout(jumpScareTimer);
  jumpScareTimer = null;
  ui.death.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  ui.alarm.classList.add('on');
  game.state = 'chase';
  game.controlLocked = false;
  game.dead = false;
  chase.active = true;
  chase.gate = { triggered: false, t: 0, broken: false };
  chase.loading = { triggered: false, t: 0, broken: false };
  chase.growlTimer = 2;
  game.grace = 1.4;
  world.openGate();
  world.openLoadingDoor();
  world.setChase(true);
  carriedPoppy.visible = true;
  player.x = 5.6; player.z = -16.5; player.yaw = Math.PI; player.pitch = -.01;
  player.stamina = 100;
  huggy.position.set(0, 0, -4);
  huggy.userData.baseY = 0;
  huggy.userData.mode = 'live';
  huggy.rotation.y = Math.PI;
  sound.startChase();
  setObjective('RUN.', 'Reach the loading bay. Do not look back.');
  showToast('KEEP MOVING');
  requestLock();
}

// ------------------------------------------------------------------ interactions
function labelFor(item) {
  if (item.type === 'fuse') return 'PICK UP FUSE';
  if (item.type === 'tape') return 'PLAY TAPE';
  if (item.type === 'poppy') return world.state.power ? 'TAKE POPPY' : 'CASE SEALED';
  if (item.type === 'breaker') return world.state.power ? 'POWER ONLINE' : `INSERT FUSES — ${inventory.fuses}/3`;
  if (item.type === 'exit') return 'ESCAPE THE FACTORY';
  return 'INTERACT';
}

function collectFuse(item) {
  item.active = false;
  item.object.visible = false;
  inventory.fuses = Math.min(3, inventory.fuses + 1);
  updateFuseHud();
  sound.pickup();
  showToast(`POWER FUSE ACQUIRED  ${inventory.fuses} / 3`);
  if (inventory.fuses === 3) {
    setObjective('RESTORE THE FACTORY POWER', 'All three fuses found. Return to the auxiliary fuse bank.');
    showSubtitle('Three fuses. The fuse bank is in the showroom, beside the security gate.', 4.5);
  } else {
    setObjective('RESTORE THE FACTORY POWER', `Locate power fuses. ${inventory.fuses} of 3 recovered.`);
  }
}

function collectTape(item) {
  item.active = false;
  item.object.visible = false;
  inventory.tapes = Math.min(3, inventory.tapes + 1);
  ui.tapeCount.textContent = `${inventory.tapes} / 3 TAPES`;
  sound.tape();
  showToast('ARCHIVE TAPE RECOVERED');
  showSubtitle(item.lore || 'A damaged tape hisses. Nothing else remains.', 6.5);
}

function useBreaker() {
  if (world.state.power) {
    sound.denied();
    showToast('POWER ALREADY ONLINE', true);
    return;
  }
  if (inventory.fuses < 3) {
    sound.denied();
    showToast(`FUSE BANK INCOMPLETE — ${inventory.fuses} / 3`, true);
    showSubtitle(`Three sockets. ${3 - inventory.fuses} still empty.`, 2.8);
    return;
  }
  powerOn();
}

function takePoppy() {
  if (!world.state.power) {
    sound.denied();
    showToast('CASE IS MAGNETICALLY SEALED', true);
    showSubtitle('A small voice behind the glass: “The lights first. Then me.”', 4);
    return;
  }
  if (inventory.poppy) return;
  beginChaseSequence();
}

function interact() {
  if (game.state === 'paused' || game.state === 'dead' || game.state === 'win' || game.controlLocked) return;
  if (currentInteract) {
    const item = currentInteract;
    grabPack.userData.trigger = 1.4;
    if (item.type === 'fuse') collectFuse(item);
    else if (item.type === 'tape') collectTape(item);
    else if (item.type === 'breaker') useBreaker();
    else if (item.type === 'poppy') takePoppy();
    else if (item.type === 'exit') triggerWin();
    else sound.interact();
    return;
  }
  if (game.state === 'chase' && nearestExit() < 3.2) triggerWin();
}

function updateInteraction() {
  if (['paused', 'dead', 'win', 'menu'].includes(game.state) || game.controlLocked) {
    currentInteract = null;
    ui.interact.classList.remove('show');
    ui.crosshair.classList.remove('hot');
    return;
  }
  const raycaster = updateInteraction.raycaster || (updateInteraction.raycaster = new THREE.Raycaster());
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  raycaster.far = 8;
  const hits = raycaster.intersectObjects(world.interactMeshes, false);
  let found = null;
  for (const hit of hits) {
    const item = hit.object.userData.interact;
    if (!item || !item.active) continue;
    if (hit.distance > (item.range || 3)) continue;
    found = item;
    break;
  }
  if (!found && game.state === 'chase' && nearestExit() < 5.5) {
    found = world.exitItem;
  }
  currentInteract = found;
  const show = Boolean(found);
  ui.interact.classList.toggle('show', show);
  ui.crosshair.classList.toggle('hot', show);
  if (show) ui.interactLabel.textContent = labelFor(found);
}

// ------------------------------------------------------------------ aiming / input
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (game.state === 'paused') resumeGame();
    else pauseGame();
    return;
  }
  if (!['playing', 'chase'].includes(game.state)) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyF', 'KeyQ'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE' && !e.repeat) interact();
  if (e.code === 'KeyF' && !e.repeat) {
    game.flashlight = !game.flashlight;
    flashlight.visible = game.flashlight;
    sound.interact();
    showToast(game.flashlight ? 'FLASHLIGHT ON' : 'FLASHLIGHT OFF', false, 1.5);
  }
  keys.add(e.code);
});
document.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('mousedown', (e) => {
  if (!['playing', 'chase'].includes(game.state)) return;
  if (e.button === 0) {
    mouseHeld = true;
    if (!isTouch && !autoCapture && document.pointerLockElement !== canvas) {
      requestLock();
      return;
    }
    if (!game.controlLocked) interact();
  }
});
window.addEventListener('mouseup', () => { mouseHeld = false; });
document.addEventListener('mousemove', (e) => {
  if (!['playing', 'chase'].includes(game.state) || game.controlLocked) return;
  if (document.pointerLockElement === canvas) {
    player.yaw -= e.movementX * .00215;
    player.pitch -= e.movementY * .00205;
    player.pitch = clamp(player.pitch, -1.38, 1.38);
  } else if (mouseHeld) {
    player.yaw -= e.movementX * .003;
    player.pitch = clamp(player.pitch - e.movementY * .0028, -1.38, 1.38);
  }
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });

// mobile joystick
function bindJoystick() {
  const stick = ui.joystick;
  const knob = ui.stick;
  const max = 44;
  stick.addEventListener('pointerdown', (e) => {
    if (touch.joyId !== null) return;
    touch.joyId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    moveStick(e);
  });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === touch.joyId) moveStick(e); });
  const end = (e) => {
    if (e.pointerId !== touch.joyId) return;
    touch.joyId = null; touch.joyX = 0; touch.joyY = 0;
    knob.style.transform = 'translate(-50%, -50%)';
  };
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);
  function moveStick(e) {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    touch.joyX = dx / max;
    touch.joyY = dy / max;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}

function bindLookPad() {
  const pad = ui.lookPad;
  pad.addEventListener('pointerdown', (e) => {
    if (touch.lookId !== null) return;
    touch.lookId = e.pointerId;
    touch.lookX = e.clientX; touch.lookY = e.clientY;
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.pointerId !== touch.lookId || !['playing', 'chase'].includes(game.state) || game.controlLocked) return;
    const dx = e.clientX - touch.lookX;
    const dy = e.clientY - touch.lookY;
    touch.lookX = e.clientX; touch.lookY = e.clientY;
    player.yaw -= dx * .0042;
    player.pitch = clamp(player.pitch - dy * .0038, -1.38, 1.38);
  });
  const end = (e) => { if (e.pointerId === touch.lookId) touch.lookId = null; };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}
bindJoystick();
bindLookPad();

ui.mobileUse.addEventListener('pointerdown', (e) => { e.preventDefault(); interact(); });
function bindHold(el, on, off) {
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); on(); });
  el.addEventListener('pointerup', (e) => { e.preventDefault(); off(); });
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
bindHold(ui.mobileSprint, () => { touch.sprint = true; }, () => { touch.sprint = false; });
ui.mobileLight.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.flashlight = !game.flashlight;
  flashlight.visible = game.flashlight;
});

// ------------------------------------------------------------------ menu buttons
ui.play.addEventListener('click', startGame);
ui.how.addEventListener('click', () => ui.howScreen.classList.remove('hidden'));
ui.howClose.addEventListener('click', () => ui.howScreen.classList.add('hidden'));
ui.resume.addEventListener('click', resumeGame);
ui.quit.addEventListener('click', resetToMenu);
ui.retry.addEventListener('click', retryChase);
ui.deathQuit.addEventListener('click', resetToMenu);
ui.again.addEventListener('click', resetToMenu);
ui.howScreen.addEventListener('click', (e) => { if (e.target === ui.howScreen) ui.howScreen.classList.add('hidden'); });

// ------------------------------------------------------------------ update loops
function updateMenu(dt, t) {
  camera.position.set(Math.sin(t * .12) * .48, 2.0 + Math.sin(t * .24) * .03, 24.5);
  player.yaw = Math.sin(t * .1) * .045;
  player.pitch = -.005 + Math.sin(t * .17) * .014;
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.fov = 66;
  camera.updateProjectionMatrix();
}

function updateControls(dt, t) {
  if (game.controlLocked || !['playing', 'chase'].includes(game.state)) {
    return { moving: false, sprinting: false };
  }
  let f = 0, r = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) r += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) r -= 1;
  if (isTouch) {
    f += -touch.joyY;
    r += touch.joyX;
  }
  const len = Math.hypot(f, r);
  if (len > 1) { f /= len; r /= len; }
  const moving = len > .08;
  const sprintIntent = moving && (keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.sprint) && player.stamina > .5;
  let speed = sprintIntent ? 6.55 : 3.75;
  if (game.state === 'chase') speed *= 1.02;
  const forwardX = -Math.sin(player.yaw);
  const forwardZ = -Math.cos(player.yaw);
  const rightX = Math.cos(player.yaw);
  const rightZ = -Math.sin(player.yaw);
  const dx = (forwardX * f + rightX * r) * speed * dt;
  const dz = (forwardZ * f + rightZ * r) * speed * dt;
  if (moving) movePlayer(dx, dz);

  if (sprintIntent && moving) {
    player.stamina = Math.max(0, player.stamina - 17.5 * dt);
  } else {
    player.stamina = Math.min(100, player.stamina + (moving ? 10.5 : 15) * dt);
  }
  if (player.stamina <= 0) player.sprintLocked = true;
  if (player.stamina > 26) player.sprintLocked = false;

  // step audio
  if (moving) {
    player.stepTimer -= dt * (sprintIntent ? 1.55 : 1);
    if (player.stepTimer <= 0) {
      player.stepTimer = sprintIntent ? .31 : .45;
      sound.footstep(sprintIntent);
      if (game.state === 'chase') addShake(.015);
    }
    player.bob += dt * (sprintIntent ? 12.5 : 8.4);
    player.walkBlend = Math.min(1, player.walkBlend + dt * 6);
  } else {
    player.walkBlend = Math.max(0, player.walkBlend - dt * 7);
    player.bob += dt * 2;
  }
  player.yaw = ((player.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return { moving, sprinting: sprintIntent };
}

function updateCamera(dt, t, moving, sprinting) {
  let px = player.x;
  let pz = player.z;
  let py = player.eye;
  const bobAmt = player.walkBlend * (sprinting ? .052 : .034);
  py += Math.sin(player.bob * 2) * bobAmt + Math.sin(t * 1.3) * .005;
  const side = Math.sin(player.bob) * player.walkBlend * .014;
  const rightX = Math.cos(player.yaw);
  const rightZ = -Math.sin(player.yaw);
  px += rightX * side;
  pz += rightZ * side;
  if (shake > .001) {
    const s = shake * .055;
    px += (Math.random() - .5) * s;
    py += (Math.random() - .5) * s;
    pz += (Math.random() - .5) * s;
  }
  camera.position.set(px, py, pz);
  let roll = Math.sin(player.bob) * player.walkBlend * .0045;
  if (game.state === 'chase') roll += Math.sin(t * 5.2) * .0018;
  camera.rotation.set(player.pitch, player.yaw, roll);
  const targetFov = (sprinting ? 74 : 68) + (game.state === 'chase' ? 2 : 0);
  camera.fov = lerp(camera.fov, targetFov, Math.min(1, dt * 3.5));
  camera.updateProjectionMatrix();
}

function updateCutscene(dt) {
  if (!cutscene) return;
  cutscene.t += dt;
  const t = cutscene.t;
  const lookT = smooth(clamp(t / 1.0, 0, 1));
  player.yaw = lerpAngle(cutscene.startYaw, cutscene.lookYaw, lookT);
  player.pitch = lerp(player.pitch, -.035, Math.min(1, dt * 2.2));

  if (t > .18 && !cutscene.glassDone) {
    cutscene.glassDone = true;
    sound.glassBreak();
  }
  if (t > .6 && !cutscene.huggyLive) {
    cutscene.huggyLive = true;
    huggy.userData.mode = 'live';
    huggy.userData.baseY = 1.42;
    world.lights.beacons.forEach(b => { if (b.material) b.material.emissiveIntensity = 4; });
    ui.intro.classList.add('hidden');
  }
  if (t > .8 && !cutscene.chaseStarted) {
    cutscene.chaseStarted = true;
    world.setChase(true);
    sound.startChase();
    ui.alarm.classList.add('on');
    addShake(.8);
    showToast('SECURITY BREACH', true, 2.2);
  }
  if (t > 1.0 && huggy.userData.baseY > .02) {
    huggy.userData.baseY = Math.max(0, huggy.userData.baseY - dt * 4.2);
    huggy.position.y = huggy.userData.baseY;
    if (huggy.userData.baseY < .05) addShake(.5);
  }
  if (t > 1.35 && !cutscene.roarDone) {
    cutscene.roarDone = true;
    sound.roar();
    addShake(.9);
  }
  if (t > 1.4) {
    const dx = player.x - huggy.position.x;
    const dz = player.z - huggy.position.z;
    huggy.rotation.y = lerpAngle(huggy.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 5));
  }
  if (t > 2.15) {
    cutscene = null;
    finishChaseSequence();
  }
}

function canHuggyStand(x, z) {
  let inZone = false;
  for (const zone of world.zones) {
    if (x > zone.x1 && x < zone.x2 && z > zone.z1 && z < zone.z2) { inZone = true; break; }
  }
  if (!inZone) return false;
  if (world.doorBlocked() && x > -2.3 && x < 2.3 && z > -22.6 && z < -21.2) return false;
  if (world.loadingDoorBlocked() && x > -2.9 && x < 2.9 && z > -55.7 && z < -54.1) return false;
  return true;
}

function updateChaseAI(dt, t) {
  // doors slam behind the player
  if (game.state === 'chase' && player.z < -23.0 && !chase.gate.triggered) {
    chase.gate.triggered = true;
    chase.gate.t = 0;
    world.closeGate();
    sound.door(1.2);
    showSubtitle('The security gate slams shut behind you.', 2.6);
    addShake(.32);
  }
  if (chase.gate.triggered && !chase.gate.broken) {
    chase.gate.t += dt;
    if (chase.gate.t > 2.5) {
      chase.gate.broken = true;
      world.breakGate();
      sound.door(1.7);
      addShake(.6);
      showSubtitle('Metal screams. He is through.', 2.2);
    }
  }
  if (game.state === 'chase' && player.z < -55.8 && !chase.loading.triggered) {
    chase.loading.triggered = true;
    chase.loading.t = 0;
    world.closeLoadingDoor();
    sound.door(1.3);
    addShake(.3);
  }
  if (chase.loading.triggered && !chase.loading.broken) {
    chase.loading.t += dt;
    if (chase.loading.t > 2.35) {
      chase.loading.broken = true;
      world.breakLoadingDoor();
      sound.door(1.8);
      addShake(.7);
      showSubtitle('The Loading Bay doors buckle inward.', 2.2);
    }
  }

  if (!chase.active) return;
  if (game.state !== 'chase' || game.controlLocked) return;

  const dx = player.x - huggy.position.x;
  const dz = player.z - huggy.position.z;
  const dist = Math.hypot(dx, dz);
  chase.lastDistance = dist;

  const desired = dist > 9 ? 5.3 : dist > 4 ? 4.8 : 4.35;
  const step = desired * dt;
  if (dist > .42) {
    const nx = huggy.position.x + (dx / dist) * step;
    const nz = huggy.position.z + (dz / dist) * step;
    let moved = false;
    if (canHuggyStand(nx, nz)) { huggy.position.x = nx; huggy.position.z = nz; moved = true; }
    else if (canHuggyStand(nx, huggy.position.z)) { huggy.position.x = nx; moved = true; }
    else if (canHuggyStand(huggy.position.x, nz)) { huggy.position.z = nz; moved = true; }
    if (moved) {
      huggy.rotation.y = lerpAngle(huggy.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 7));
      addShake(Math.max(0, (1.2 - dist / 7)) * .01);
    }
  }
  updateHuggy(huggy, dt, desired, true, true);

  chase.stepTimer -= dt;
  if (chase.stepTimer <= 0) {
    chase.stepTimer = dist < 12 ? .34 : .55;
    if (dist < 20) {
      sound.makeNoise(.18, .11, 120, 'lowpass');
      sound.tone(48, .14, .09, 'sine', -8);
    }
  }
  chase.growlTimer -= dt;
  if (chase.growlTimer <= 0) {
    chase.growlTimer = 5.5 + Math.random() * 5;
    if (dist < 18) sound.roar();
  }
  if (dist < 10) {
    if (Math.sin(t * 5.3) > .96) sound.heartbeat(clamp(1.8 - dist / 10, .3, 1.5));
  }
  if (dist < 1.28 && game.grace <= 0) {
    die();
  }
}

function updateWorldState(dt, t) {
  // ambient scare triggers
  if (game.state === 'playing' && player.z < 3.2 && !updateWorldState.enteredHall) {
    updateWorldState.enteredHall = true;
    showSubtitle('The showroom still smells like birthday cake. The air is freezing.', 4.6);
  }
  if (game.state === 'playing' && player.x > 18.5 && !updateWorldState.enteredStorage) {
    updateWorldState.enteredStorage = true;
    showSubtitle('A GrabPack access cage. Of course they locked the fuse inside.', 4);
  }
  if (game.state === 'playing' && player.z < -26.5 && !updateWorldState.enteredMaint) {
    updateWorldState.enteredMaint = true;
    showSubtitle('Maintenance. The power hum is louder than it should be.', 3.6);
  }
  if (game.state === 'chase' && player.z < -58 && !updateWorldState.sawDock) {
    updateWorldState.sawDock = true;
    showSubtitle('<span class="who">POPPY:</span> The loading bay. Don\'t stop for the door.', 3.4);
  }
  if (game.grace > 0) game.grace -= dt;

  if (game.state === 'chase' && nearestExit() < 2.9) triggerWin();

  // flashlight breathes
  if (flashlight.visible) {
    flashlight.intensity = 37 + Math.sin(t * 9.4) * .9 + Math.sin(t * 31.7) * .45;
  }
  // fov / fog shift
  scene.fog.density = lerp(scene.fog.density, game.state === 'chase' ? .023 : .019, Math.min(1, dt * 1.5));
  if (bloom) bloom.strength = lerp(bloom.strength, game.state === 'chase' ? .66 : .52, Math.min(1, dt * 2));
}

function updateHUD(dt, moving, sprinting) {
  const pct = clamp(player.stamina, 0, 100);
  ui.stamina.style.width = `${pct}%`;
  ui.stamina.style.background = pct < 30 ? 'linear-gradient(90deg,#d85a4f,#ff8a6b)' : pct < 60 ? 'linear-gradient(90deg,#d8b04f,#f0d77a)' : 'linear-gradient(90deg,#76d6b1,#d9e88c)';
  const showStamina = sprinting || pct < 99.2;
  ui.staminaWrap.classList.toggle('show', showStamina);
  if (!isTouch) {
    const hint = document.querySelector('.hint');
    if (hint) hint.style.opacity = gameTime > 20 ? '.35' : '1';
  }
}

// ------------------------------------------------------------------ loop
let last = performance.now();
let elapsed = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(.05, Math.max(.0001, (now - last) / 1000));
  last = now;
  elapsed += dt;
  if (game.started && ['playing', 'chase'].includes(game.state)) gameTime += dt;

  let moving = false, sprinting = false;
  if (game.state === 'menu') {
    updateMenu(dt, elapsed);
  } else if (game.state === 'paused') {
    // frozen but still redraw
  } else if (game.state === 'dead' || game.state === 'win') {
    // subtle handheld cam
    camera.position.set(player.x, player.eye + Math.sin(elapsed * 1.1) * .01, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  } else {
    if (cutscene) updateCutscene(dt);
    const movement = updateControls(dt, elapsed);
    moving = movement.moving; sprinting = movement.sprinting;
    updateCamera(dt, elapsed, moving, sprinting);
    updateWorldState(dt, elapsed);
    updateChaseAI(dt, elapsed);
    updateInteraction();
  }

  if (game.state === 'menu') {
    updateInteraction();
  }

  world.update(dt, elapsed);
  if (game.state !== 'menu') updateGrabPack(grabPack, dt, grabPack.userData.trigger > .4);
  else updateGrabPack(grabPack, dt, false);

  if (huggy.userData.mode === 'live' && !chase.active && game.state !== 'chase') {
    updateHuggy(huggy, dt, 0, false, game.state === 'dead');
  } else if (huggy.userData.mode === 'statue') {
    updateHuggy(huggy, dt, 0, false, false);
  }

  if (!['paused', 'dead', 'win'].includes(game.state)) {
    updateHUD(dt, moving, sprinting);
  }
  shake = Math.max(0, shake - dt * 3.3);
  renderFrame();
}

// ------------------------------------------------------------------ resize
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(w, h);
  if (composer) {
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  }
}
window.addEventListener('resize', onResize);

// ------------------------------------------------------------------ boot
renderFrame();
requestAnimationFrame(animate);
setTimeout(() => {
  ui.loading.classList.add('done');
  setTimeout(() => ui.loading.classList.add('hidden'), 900);
}, 550);

// expose a tiny debug surface for capture/QA tools
window.__pop = {
  get state() { return game.state; },
  get quality() { return { softwareRenderer, gpuName, usePost, pixelRatio: renderer.getPixelRatio() }; },
  get info() { return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, points: renderer.info.render.points, lines: renderer.info.render.lines, programs: renderer.info.programs?.length ?? 0, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries }; },
  setScale(s) { renderer.setPixelRatio(s); renderer.setSize(window.innerWidth, window.innerHeight); },
  renderer, scene, camera,
  get player() { return { ...player }; },
  get inventory() { return { ...inventory }; },
  get huggy() { return { x: huggy.position.x, z: huggy.position.z }; },
  get interact() { return currentInteract?.type || null; },
  start: startGame,
  interact,
  teleport(x, z) { player.x = x; player.z = z; },
  power: powerOn,
  chase: beginChaseSequence,
  win: triggerWin
};
