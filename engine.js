const HEROES = [
  { id: 'slavik', name: 'Славік', color: '#81bcff', height: 38 },
  { id: 'dasha', name: 'Даша', color: '#ff8ac1', height: 35 },
  { id: 'katya', name: 'Катя', color: '#ffb49d', height: 32 }
];
const ROUND_SECONDS = { seek: 45, hide: 38 };
const STEP = 4;
const RADIUS = 4;
const REACH = 12;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function blocked(map, x, y, r = RADIUS) {
  const [left, top, right, bottom] = map.bounds;
  return x < left + r || x > right - r || y < top + r || y > bottom - r ||
    map.solids.some(([sx, sy, w, h]) => x > sx - r && x < sx + w + r && y > sy - r && y < sy + h + r);
}

function spotDistance(actor, item) {
  const dx = Math.max(0, Math.abs(actor.x - item.x) - item.w / 2);
  const dy = Math.max(0, item.y - item.d - actor.y, actor.y - item.y);
  return Math.hypot(dx, dy);
}

function makeNavigation(map) {
  const columns = WIDTH / STEP;
  const rows = Math.floor(HEIGHT / STEP);
  const size = columns * rows;
  const point = i => ({ x: (i % columns) * STEP, y: Math.floor(i / columns) * STEP });
  const open = Uint8Array.from({ length: size }, (_, i) => {
    const { x, y } = point(i);
    return Number(!blocked(map, x, y));
  });
  const around = (position, max = 6) => {
    let best = -1;
    let bestDistance = max + .001;
    const spread = Math.ceil(max / STEP);
    const cx = Math.round(position.x / STEP);
    const cy = Math.round(position.y / STEP);
    for (let y = Math.max(0, cy - spread); y <= Math.min(rows - 1, cy + spread); y++) {
      for (let x = Math.max(0, cx - spread); x <= Math.min(columns - 1, cx + spread); x++) {
        const i = y * columns + x;
        const gap = Math.hypot(x * STEP - position.x, y * STEP - position.y);
        if (open[i] && gap < bestDistance) {
          best = i;
          bestDistance = gap;
        }
      }
    }
    return best;
  };
  const doors = new Map(map.spots.map(item => {
    const approaches = [
      { x: item.x, y: item.y + 8 },
      { x: item.x - item.w / 2 - 8, y: item.y - 4 },
      { x: item.x + item.w / 2 + 8, y: item.y - 4 },
      { x: item.x, y: item.y - item.d - 8 }
    ].map(p => around(p)).filter(i => i >= 0 && spotDistance(point(i), item) <= REACH);
    return [item, [...new Set(approaches)]];
  }));

  function path(from, destination, item = null) {
    const start = around(from, 10);
    const goals = item ? doors.get(item) : [around(destination, 10)];
    if (start < 0 || !goals?.length || goals[0] < 0) return null;
    const parents = new Int32Array(size).fill(-1);
    const queue = new Int32Array(size);
    parents[start] = start;
    queue[0] = start;
    let count = 1;
    for (let head = 0; head < count; head++) {
      const i = queue[head];
      if (goals.includes(i)) {
        const route = [point(i)];
        let previousDirection = 0;
        for (let current = i; current !== start; current = parents[current]) {
          const parent = parents[current];
          const direction = current - parent;
          if (previousDirection && direction !== previousDirection) route.push(point(current));
          previousDirection = direction;
        }
        route.push(point(start));
        return route.reverse();
      }
      for (const next of [i - columns, i + columns, i - 1, i + 1]) {
        if (!open[next] || parents[next] !== -1) continue;
        parents[next] = i;
        queue[count++] = next;
      }
    }
    return null;
  }
  return { path };
}

function actorAt(hero, point) {
  return { hero, ...point, face: 'down', stride: 0, moving: false, hidden: null, found: false, route: [] };
}

function animate(actor, dx, dy) {
  if (!dx && !dy) return;
  actor.moving = true;
  actor.stride += Math.hypot(dx, dy);
  actor.face = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

function followRoute(actor, budget) {
  while (actor.route.length && budget > 0) {
    const next = actor.route[0];
    const gap = distance(actor, next);
    const stride = Math.min(gap, budget);
    if (gap > .001) animate(actor, (next.x - actor.x) * stride / gap, (next.y - actor.y) * stride / gap);
    if (gap <= budget) {
      actor.x = next.x;
      actor.y = next.y;
      actor.route.shift();
    } else {
      actor.x += (next.x - actor.x) * stride / gap;
      actor.y += (next.y - actor.y) * stride / gap;
    }
    budget -= stride;
  }
  return actor.route.length === 0;
}

class HideAndSeek {
  constructor(map, hero, role, onEvent = () => {}) {
    this.map = map;
    this.role = role;
    this.onEvent = onEvent;
    this.nav = makeNavigation(map);
    this.player = actorAt(hero, map.spawn);
    const others = shuffled(HEROES.filter(candidate => candidate !== hero));
    this.actors = [this.player, ...others.map((candidate, i) => actorAt(candidate, {
      x: map.spawn.x + (i ? 22 : -22), y: map.spawn.y
    }))];
    this.seeker = role === 'seek' ? this.player : this.actors[1];
    this.hiders = this.actors.filter(actor => actor !== this.seeker);
    this.checked = new Set();
    this.inspected = new Set();
    this.phase = 'ready';
    this.time = ROUND_SECONDS[role];
    this.clue = null;
    this.clueIn = 7;
    this.exposure = 0;
    this.seekerWait = 0;
    this.cooldown = 0;
    this.walkTarget = null;
    this.actionTarget = null;
  }

  start() {
    const spots = shuffled(this.map.spots.filter(item => spotDistance(this.map.spawn, item) > 30));
    let index = 0;
    for (const actor of this.hiders) {
      if (actor === this.player) continue;
      const item = spots[index++];
      if (this.role === 'seek') {
        actor.hidden = item;
      } else {
        actor.target = item;
        actor.route = this.nav.path(actor, null, item) || [];
      }
    }
    this.phase = 'count';
    this.time = this.role === 'seek' ? 3 : 12;
  }

  get active() {
    return this.phase === 'count' || this.phase === 'hunt';
  }

  get found() {
    return this.hiders.filter(actor => actor.found).length;
  }

  nearby() {
    if (this.player.hidden) return this.player.hidden;
    return this.map.spots.reduce((best, item) => {
      const gap = spotDistance(this.player, item);
      return gap <= REACH && (!best || gap < spotDistance(this.player, best)) ? item : best;
    }, null);
  }

  pointAt(position) {
    if (!this.active || this.player.hidden || (this.role === 'seek' && this.phase === 'count')) return;
    const item = [...this.map.spots].reverse().find(spot =>
      Math.abs(spot.x - position.x) <= spot.w / 2 + 2 && position.y <= spot.y + 2 &&
      position.y >= spot.y - spot.d - 15
    );
    const route = this.nav.path(this.player, position, item);
    if (!route) return;
    this.player.route = route;
    this.walkTarget = route.at(-1);
    this.actionTarget = item || null;
  }

  interact(item = this.nearby()) {
    if (!this.active || this.cooldown > 0 || (this.role === 'seek' && this.phase === 'count')) return;
    if (!item || spotDistance(this.player, item) > REACH) {
      this.onEvent('note', 'Підійди ближче до схованки');
      return;
    }
    this.cooldown = .32;
    this.player.route = [];
    this.walkTarget = null;
    this.actionTarget = null;
    if (this.role === 'hide') {
      if (this.player.hidden) {
        this.player.hidden = null;
        this.onEvent('move', 'Ти вийшов зі схованки');
      } else if (this.hiders.some(actor => actor !== this.player && (actor.hidden === item || actor.target === item))) {
        this.onEvent('note', 'Ця схованка вже зайнята');
      } else {
        this.player.hidden = item;
        this.onEvent('move', `Твоя схованка · ${item.name}`);
      }
      return;
    }
    if (this.checked.has(item)) {
      this.onEvent('note', 'Цю схованку вже перевірено');
      return;
    }
    this.checked.add(item);
    const actor = this.hiders.find(friend => friend.hidden === item && !friend.found);
    if (actor) {
      this.reveal(actor, item);
      if (this.found === this.hiders.length) this.end(true);
    } else {
      this.onEvent('empty', `${item.name} · порожньо`);
    }
  }

  reveal(actor, item) {
    if (item) {
      actor.x = item.x;
      actor.y = item.y + 3;
    }
    actor.hidden = null;
    actor.found = true;
    actor.face = 'down';
    if (this.clue?.item === item) this.clue = null;
    this.onEvent('found', actor === this.player ? 'Тебе знайшли!' : `Знайдено: ${actor.hero.name}!`);
  }

  end(win) {
    this.phase = 'ended';
    this.win = win;
    this.clue = null;
    this.onEvent(win ? 'win' : 'lose');
  }

  movePlayer(dx, dy, dt) {
    const player = this.player;
    if (player.hidden || (this.role === 'seek' && this.phase === 'count')) return;
    const direction = Math.hypot(dx, dy);
    if (direction) {
      player.route = [];
      this.walkTarget = null;
      this.actionTarget = null;
      const speed = 115 * dt / direction;
      const x = player.x + dx * speed;
      const y = player.y + dy * speed;
      const old = { x: player.x, y: player.y };
      if (!blocked(this.map, x, player.y)) player.x = x;
      if (!blocked(this.map, player.x, y)) player.y = y;
      animate(player, player.x - old.x, player.y - old.y);
      return;
    }
    if (!this.walkTarget || !followRoute(player, 115 * dt)) return;
    this.walkTarget = null;
    if (this.actionTarget) this.interact(this.actionTarget);
    this.actionTarget = null;
  }

  updateSeeker(dt) {
    const seeker = this.seeker;
    if (!this.seekerTarget) {
      const choices = shuffled(this.map.spots.filter(item => !this.inspected.has(item)));
      if (!choices.length) {
        this.inspected.clear();
        return;
      }
      this.seekerTarget = choices.slice(0, 2).reduce((a, b) => spotDistance(seeker, a) < spotDistance(seeker, b) ? a : b);
      seeker.route = this.nav.path(seeker, null, this.seekerTarget) || [];
      this.seekerWait = 2.2;
    }
    if (followRoute(seeker, 64 * dt)) {
      this.seekerWait -= dt;
      if (this.seekerWait <= 0) {
        const item = this.seekerTarget;
        this.inspected.add(item);
        this.seekerTarget = null;
        const actor = this.hiders.find(friend => friend.hidden === item);
        if (actor) {
          this.reveal(actor, item);
          if (actor === this.player) this.end(false);
        }
      }
    }
    if (this.phase !== 'hunt' || this.player.hidden) {
      this.exposure = 0;
      return;
    }
    const p = this.player;
    const gap = distance(p, seeker);
    const clear = [0.25, .5, .75].every(t =>
      !blocked(this.map, p.x + (seeker.x - p.x) * t, p.y + (seeker.y - p.y) * t, 0)
    );
    this.exposure = gap < 34 && clear ? this.exposure + dt : 0;
    if (this.exposure >= .75) {
      this.reveal(p);
      this.end(false);
    }
  }

  step(dt, dx = 0, dy = 0) {
    if (!this.active) return;
    this.time -= dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.actors.forEach(actor => { actor.moving = false; });
    this.movePlayer(dx, dy, dt);
    if (!this.active) return;
    if (this.phase === 'count') {
      if (this.role === 'hide') {
        for (const actor of this.hiders) {
          if (!actor.target || !followRoute(actor, 100 * dt)) continue;
          actor.hidden = actor.target;
          actor.target = null;
        }
      }
      if (this.time <= 0) {
        this.phase = 'hunt';
        this.time = ROUND_SECONDS[this.role];
        this.onEvent('hunt', this.role === 'seek' ? 'Шукай обох друзів!' : `${this.seeker.hero.name} починає пошук!`);
      }
      return;
    }
    if (this.time <= 0) {
      this.end(this.role === 'hide');
      return;
    }
    if (this.role === 'hide') {
      this.updateSeeker(dt);
      return;
    }
    this.clueIn -= dt;
    if (this.clueIn <= 0) {
      const candidates = this.hiders.filter(actor => !actor.found);
      this.clue = { item: candidates[Math.floor(Math.random() * candidates.length)].hidden, until: this.time - 2.7 };
      this.clueIn = 8;
      this.onEvent('clue', 'Десь зашурхотіло…');
    }
    if (this.clue && this.time < this.clue.until) this.clue = null;
  }
}
