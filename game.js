const byId = id => document.getElementById(id);
const canvas = byId('world');
const ctx = canvas.getContext('2d');
const status = byId('status');
const timer = byId('timer');
const objective = byId('objective');
const phaseLabel = byId('phase');
const setupButton = byId('start');
const pauseButton = byId('pause-button');
const touchAction = byId('touch-action');
const rules = byId('rules');
const soundButton = byId('sound-button');
const mask = byId('stage-mask');
const overlayButton = byId('overlay-button');
const keys = new Set();
const fingers = new Map();
const mapButtons = new Map();
const heroButtons = new Map();
const crew = new Map();
const grounds = {};
let selectedMap = 'house';
let selectedHero = HEROES[0];
let role = 'seek';
let game;
let paused = false;
let rulesPaused = false;
let sound = true;
let audioContext;
let notice = null;
let noticeUntil = 0;
let previousFrame = 0;

function imageFor(hero, view) {
  const image = new Image();
  image.src = `assets/${hero.id}-${view}.png`;
  return image;
}

const sprites = Object.fromEntries(HEROES.map(hero => [hero.id, {
  front: imageFor(hero, 'front'), back: imageFor(hero, 'back'), walk: imageFor(hero, 'walk')
}]));

function clickSound(kind) {
  if (!sound || !audioContext || audioContext.state !== 'running') return;
  const pitches = {
    start: [330, 440, 550], move: [440, 330], found: [550, 720],
    hunt: [400, 550], empty: [210], clue: [780, 620], win: [523, 659, 784], lose: [392, 311, 220]
  }[kind];
  pitches?.forEach((pitch, i) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const time = audioContext.currentTime + i * .078;
    oscillator.type = 'triangle';
    oscillator.frequency.value = pitch;
    gain.gain.setValueAtTime(.05, time);
    gain.gain.exponentialRampToValueAtTime(.001, time + .12);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + .13);
  });
}

function enableAudio() {
  if (!sound || !window.AudioContext) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
}

function chooseButtons(buttons, value) {
  for (const [key, button] of buttons) button.setAttribute('aria-pressed', String(key === value));
}

function setupMaps() {
  for (const [key, map] of Object.entries(MAPS)) {
    const button = document.createElement('button');
    button.type = 'button';
    const thumb = document.createElement('canvas');
    thumb.width = 60;
    thumb.height = 32;
    thumb.setAttribute('aria-hidden', 'true');
    drawMapThumbnail(thumb, key);
    const ground = document.createElement('canvas');
    ground.width = WIDTH;
    ground.height = HEIGHT;
    renderMapBase(ground.getContext('2d', { willReadFrequently: true }), key);
    grounds[key] = ground;
    const label = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = map.name;
    const description = document.createElement('small');
    description.textContent = map.description;
    label.append(title, description);
    button.append(thumb, label);
    button.addEventListener('click', () => {
      selectedMap = key;
      chooseButtons(mapButtons, key);
      reset();
    });
    mapButtons.set(key, button);
    byId('maps').append(button);
  }
  chooseButtons(mapButtons, selectedMap);
}

function setupHeroes() {
  for (const hero of HEROES) {
    const button = document.createElement('button');
    button.type = 'button';
    const portrait = imageFor(hero, 'avatar');
    portrait.alt = '';
    const title = document.createElement('span');
    title.textContent = hero.name;
    button.append(portrait, title);
    button.addEventListener('click', () => {
      selectedHero = hero;
      chooseButtons(heroButtons, hero);
      reset();
    });
    byId('heroes').append(button);
    heroButtons.set(hero, button);
    const face = document.createElement('div');
    face.className = 'crew-face';
    const icon = imageFor(hero, 'avatar');
    icon.alt = hero.name;
    face.append(icon);
    byId('crew').append(face);
    crew.set(hero, face);
  }
  chooseButtons(heroButtons, selectedHero);
}

function onEvent(kind, message) {
  if (message) {
    notice = message;
    noticeUntil = performance.now() + (kind === 'found' ? 2500 : 1850);
  }
  clickSound(kind);
  if (['move', 'found', 'hunt', 'win', 'lose'].includes(kind)) updatePanel();
}

function clearMovement() {
  keys.clear();
  for (const button of fingers.values()) button.classList.remove('held');
  fingers.clear();
}

function reset() {
  game = new HideAndSeek(MAPS[selectedMap], selectedHero, role, onEvent);
  paused = false;
  notice = null;
  clearMovement();
  byId('location').textContent = game.map.name;
  updatePanel();
}

function startRound() {
  reset();
  enableAudio();
  game.start();
  clickSound('start');
  updatePanel();
  document.activeElement?.blur();
  if (window.innerWidth <= 690) canvas.scrollIntoView({ block: 'nearest' });
}

function togglePause() {
  if (!game.active) return;
  paused = !paused;
  clearMovement();
  updatePanel();
  if (!paused) document.activeElement?.blur();
}

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function updatePanel() {
  const active = game.active;
  for (const button of [...mapButtons.values(), ...heroButtons.values(), ...roleButtons.values()]) button.disabled = active;
  setupButton.classList.toggle('in-round', active);
  setText(setupButton, active ? 'Завершити раунд' : '▶  Почати раунд');
  pauseButton.hidden = !active;
  pauseButton.setAttribute('aria-label', paused ? 'Продовжити гру' : 'Призупинити гру');
  setText(pauseButton, paused ? '▶' : 'Ⅱ');
  byId('touch-controls').hidden = !active;
  for (const actor of game.actors) {
    const face = crew.get(actor.hero);
    face.classList.toggle('waiting', active && !!actor.hidden && actor !== game.player);
    face.classList.toggle('found', actor.found);
    const label = `${actor.hero.name}${actor === game.player ? ' · ти' : ''}${actor.found ? ' · знайдено' : ''}`;
    if (face.title !== label) face.title = label;
  }
}

function renderHud(now) {
  const seconds = Math.max(0, Math.ceil(game.time));
  setText(timer, `0:${String(seconds).padStart(2, '0')}`);
  timer.classList.toggle('urgent', game.phase === 'hunt' && seconds <= 8);
  const phases = { ready: 'Підготовка', count: 'Відлік', hunt: 'Пошук', ended: 'Раунд завершено' };
  setText(phaseLabel, paused ? 'Пауза' : phases[game.phase]);
  objective.hidden = !game.active || paused || (role === 'seek' && game.phase === 'count');
  const action = role === 'seek' ? 'Перевірити' : game.player.hidden ? 'Вийти' : 'Сховатися';
  setText(touchAction, action);
  let prompt = 'Обирай карту, героя й роль.';
  if (game.phase === 'ended') {
    prompt = game.win ? 'Раунд виграно!' : 'Раунд програно.';
  } else if (game.active) {
    const item = game.nearby();
    const takingCount = game.phase === 'count' && role === 'seek';
    if (takingCount) prompt = 'Друзі розбігаються по схованках…';
    else if (notice && now < noticeUntil) prompt = notice;
    else if (role === 'hide' && game.phase === 'hunt' && distance(game.player, game.seeker) < 58) prompt = 'Чутно кроки неподалік!';
    else if (item) prompt = `${item.name} · ${action.toLowerCase()}`;
    else if (role === 'seek') prompt = 'Підійди до предмета з жовтою позначкою.';
    else prompt = 'Обери предмет, за яким можна сховатися.';
    if (role === 'seek') {
      setText(objective, `Знайдено ${game.found} / 2`);
    } else {
      const label = game.player.hidden ? 'Ти у схованці' : game.phase === 'count' ? 'Знайди схованку' : 'Ти на видноті';
      setText(objective, label);
    }
  }
  setText(status, prompt);
  renderOverlay(seconds);
}

function renderOverlay(seconds) {
  const counting = game.phase === 'count' && role === 'seek';
  mask.hidden = !counting && !paused && game.phase !== 'ended';
  if (mask.hidden) return;
  overlayButton.hidden = !paused && game.phase !== 'ended';
  if (paused) {
    setText(byId('overlay-icon'), 'Ⅱ');
    setText(byId('overlay-title'), 'Пауза');
    setText(byId('overlay-detail'), 'Час зупинився.');
    setText(overlayButton, 'Продовжити');
  } else if (counting) {
    setText(byId('overlay-icon'), seconds);
    setText(byId('overlay-title'), 'Рахуй до трьох!');
    setText(byId('overlay-detail'), 'Друзі ховаються.');
  } else {
    const title = role === 'seek'
      ? (game.win ? 'Усіх знайдено!' : 'Час вийшов!')
      : (game.win ? 'Ти перехитрив усіх!' : 'Тебе знайшли!');
    const detail = role === 'seek'
      ? `Знайдено друзів · ${game.found} з 2`
      : (game.win ? 'Ти протримався до кінця раунду.' : `${game.seeker.hero.name} виграє раунд.`);
    setText(byId('overlay-icon'), game.win ? '✦' : '×');
    setText(byId('overlay-title'), title);
    setText(byId('overlay-detail'), detail);
    setText(overlayButton, 'Зіграти ще');
  }
}

const roleButtons = new Map([...byId('roles').querySelectorAll('button')].map(button => [button.dataset.role, button]));
for (const [key, button] of roleButtons) {
  button.addEventListener('click', () => {
    role = key;
    chooseButtons(roleButtons, key);
    reset();
  });
}

setupButton.addEventListener('click', () => game.active ? reset() : startRound());
pauseButton.addEventListener('click', togglePause);
overlayButton.addEventListener('click', () => paused ? togglePause() : startRound());
soundButton.addEventListener('click', () => {
  sound = !sound;
  soundButton.setAttribute('aria-pressed', String(sound));
  if (sound) enableAudio();
});
byId('rules-button').addEventListener('click', () => {
  rulesPaused = game.active && !paused;
  if (rulesPaused) togglePause();
  rules.showModal();
});
rules.addEventListener('close', () => {
  if (rulesPaused && paused) togglePause();
  rulesPaused = false;
});

const movement = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
};
window.addEventListener('keydown', event => {
  if (rules.open || !game.active) return;
  if (event.code === 'Escape' && !event.repeat) {
    event.preventDefault();
    togglePause();
    return;
  }
  if (paused || event.ctrlKey || event.altKey || event.metaKey) return;
  if (movement[event.code]) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === 'KeyE' || (event.code === 'Space' && !event.target.closest?.('button'))) {
    event.preventDefault();
    if (!event.repeat) game.interact();
  }
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', clearMovement);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.active && !paused) togglePause();
});

for (const button of byId('touch-controls').querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    fingers.set(event.pointerId, button);
    button.classList.add('held');
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(name, event => {
      fingers.delete(event.pointerId);
      if (![...fingers.values()].includes(button)) button.classList.remove('held');
    });
  }
}
touchAction.addEventListener('click', () => { if (!paused) game.interact(); });
canvas.addEventListener('click', event => {
  if (paused || !game.active) return;
  if (game.player.hidden) {
    const box = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - box.left) * WIDTH / box.width, y: (event.clientY - box.top) * HEIGHT / box.height };
    if (spotDistance(point, game.player.hidden) <= 16) game.interact();
    return;
  }
  const box = canvas.getBoundingClientRect();
  game.pointAt({ x: (event.clientX - box.left) * WIDTH / box.width, y: (event.clientY - box.top) * HEIGHT / box.height });
});

function frame(now) {
  const dt = Math.min(.04, (now - previousFrame) / 1000);
  previousFrame = now;
  if (game.active && !paused) {
    const directions = new Set([...Array.from(keys, key => movement[key]), ...Array.from(fingers.values(), button => button.dataset.move)]);
    const dx = Number(directions.has('right')) - Number(directions.has('left'));
    const dy = Number(directions.has('down')) - Number(directions.has('up'));
    game.step(dt, dx, dy);
  }
  renderHud(now);
  drawScene(ctx, grounds[selectedMap], game, sprites, now);
  requestAnimationFrame(frame);
}

setupMaps();
setupHeroes();
reset();
requestAnimationFrame(frame);
