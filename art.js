const INK = '#332737';
const COLORS = {
  rose: ['#673d57', '#a65873', '#d87c8d', '#f3b1a9'],
  moss: ['#344a44', '#56745a', '#83a66d', '#b5cc87'],
  blue: ['#34495e', '#516f8d', '#769eb2', '#aac6cd'],
  amber: ['#684336', '#a16a44', '#ce9460', '#f4c17d']
};

function pixelArt(ctx) {
  const rect = (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const shape = (color, points) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.fill();
  };
  const box = (x, y, w, h, palette, top = 5) => {
    const [dark, mid, light, shine] = palette;
    rect(INK, x - 1, y - 1, w + 2, h + 2);
    rect(mid, x, y, w, h);
    rect(light, x, y, w, top);
    rect(shine, x + 1, y + 1, w - 2, 1);
    rect(dark, x, y + h - 3, w, 3);
    rect(dark, x + w - 3, y + top, 3, h - top);
  };
  const tuft = (x, y, palette, flip = false) => {
    const [dark, mid, light, shine] = palette;
    rect(dark, x + 3, y + 2, 12, 2);
    rect(mid, x + 3, y - 4, 3, 6);
    rect(light, x + 6, y - 2, 4, 4);
    rect(light, x + 10, y - 5, 3, 7);
    rect(mid, x + 13, y - 1, 2, 3);
    if (flip) rect(shine, x + 4, y - 6, 2, 2);
  };
  return { rect, shape, box, tuft };
}

function rng(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function drawGround(ctx, kind) {
  const { rect, shape, tuft } = pixelArt(ctx);
  const random = rng(51);
  const garden = kind === 'yard';
  rect(garden ? '#546f52' : '#334c46', 0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 370; i++) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const dark = garden ? '#4b664b' : '#2e433f';
    const light = garden ? '#638057' : '#3c554a';
    rect(i % 3 ? light : dark, x, y, 2 + random() * 8, i % 3 ? 1 : 3);
    if (!(i % 10)) tuft(x, y, garden ? COLORS.moss : ['#304641', '#415a4d', '#4b6350', '#78905d'], i % 20 === 0);
  }
  for (const x of [0, 23, 54, 82, 126, 164, 212, 251, 293, 333, 374, 411, 449, 481, 506]) {
    tree(ctx, x, 27 + random() * 16, .76 + random() * .35, true);
  }
  if (!garden) {
    for (const [x, y, scale] of [[10, 102, .86], [506, 106, .85], [13, 208, .92],
      [503, 223, .82], [19, 293, 1.16], [487, 296, 1.08]]) tree(ctx, x, y, scale, true);
    return;
  }
  rect('#3f5747', 31, 53, 449, 226);
  rect('#90a266', 34, 57, 443, 218);
  rect('#788f59', 37, 61, 438, 211);
  shape('#b99c6e', [[37, 167], [151, 167], [204, 145], [319, 145], [366, 188], [475, 188],
    [475, 216], [357, 216], [308, 170], [217, 170], [161, 195], [37, 195]]);
  rect('#bf9f72', 240, 169, 33, 103);
  rect('#c5a77b', 34, 276, 445, 4);
  for (let i = 0; i < 420; i++) {
    const x = 38 + random() * 435;
    const y = 64 + random() * 207;
    const value = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[0];
    rect(value > 150 ? '#b29569' : (i % 3 ? '#82965c' : '#6e8855'), x, y, 2 + random() * 4, 1);
    if (value < 150 && i % 22 === 0) {
      rect('#566f50', x, y, 2, 4);
      rect(i % 44 === 0 ? '#f3cd76' : '#f2b5ae', x - 1, y, 3, 2);
    }
  }
  for (const [x, y, w, h] of [[35, 59, 443, 5], [34, 65, 5, 73], [474, 64, 5, 70],
    [34, 221, 5, 50], [474, 218, 5, 54], [34, 270, 196, 5], [282, 270, 196, 5]]) {
    rect('#435547', x, y, w, h);
    rect('#b6966e', x, y, w, 2);
  }
  for (let x = 35; x < 478; x += 17) {
    rect('#876c54', x, 51, 4, 13);
    rect('#ccaa7d', x, 51, 4, 2);
  }
}

function tree(ctx, x, y, scale, dark = false) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const { rect, shape } = pixelArt(ctx);
  rect('#263b38', -19, -4, 41, 7);
  rect('#715347', -3, -11, 7, 12);
  shape(dark ? '#2a413d' : '#405841', [[-23, -9], [-23, -23], [-16, -23], [-16, -32],
    [-7, -32], [-7, -39], [10, -39], [10, -34], [19, -34], [19, -27],
    [24, -27], [24, -13], [19, -13], [19, -7], [8, -7], [8, -3], [-9, -3], [-9, -9]]);
  rect(dark ? '#3b5b4a' : '#6c8a57', -17, -27, 34, 13);
  rect(dark ? '#466350' : '#83a264', -10, -32, 21, 9);
  rect(dark ? '#466350' : '#86a364', -18, -23, 11, 6);
  rect(dark ? '#57705a' : '#a0b676', -8, -31, 12, 3);
  rect(dark ? '#355047' : '#5a764e', 5, -14, 13, 5);
  rect(dark ? '#496651' : '#95ab6e', 12, -22, 6, 3);
  rect(dark ? '#59725a' : '#a9b778', -14, -22, 3, 2);
  ctx.restore();
}

function planks(ctx, x, y, w, h, colors, tile = false) {
  const { rect } = pixelArt(ctx);
  const random = rng(x + 48);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  rect(colors[0], x, y, w, h);
  for (let row = 0; row * 8 < h; row++) {
    const start = y + row * 8;
    rect(colors[row % 3 ? 1 : 2], x, start + 1, w, 1);
    for (let col = x - row % 3 * 9; col < x + w; col += tile ? 16 : 34) {
      rect(colors[2], col, start, 1, 8);
      rect(colors[1], col + 3 + random() * 9, start + 4, 4 + random() * 8, 1);
      if (random() > .78) rect(colors[2], col + 17, start + 5, 3, 1);
    }
  }
  ctx.restore();
}

function windowFrame(ctx, x, y, width = 23) {
  const { rect } = pixelArt(ctx);
  rect('#473841', x - 2, y - 2, width + 4, 17);
  rect('#d8aa86', x, y, width, 13);
  rect('#59746b', x + 2, y + 2, width - 4, 9);
  rect('#9ab8a4', x + 3, y + 3, width - 7, 3);
  rect('#cca484', x + (width >> 1) - 1, y + 1, 2, 11);
  rect('#c9a485', x - 2, y + 12, width + 4, 2);
}

function roomWalls(ctx, map, workshop) {
  const { rect, box } = pixelArt(ctx);
  rect('#252f33', 29, 32, 455, 248);
  rect('#55413c', 33, 35, 447, 241);
  rect('#e0ae81', 34, 37, 445, 4);
  const wall = workshop ? '#8d796a' : '#c59778';
  const paper = workshop ? '#a08c77' : '#d9aa8c';
  rect(paper, 37, 41, 439, 22);
  rect(wall, 37, 58, 439, 6);
  for (let x = 42; x < 476; x += 12) {
    rect(wall, x, 43, 1, 13);
    rect(workshop ? '#b09a7d' : '#e3b494', x + 1, 43, 1, 12);
  }
  const rooms = workshop
    ? [[36, 63, 130, 151, ['#a48164', '#aa8a6a', '#92715b']],
      [173, 63, 174, 153, ['#998671', '#a8937a', '#8b796a']],
      [354, 63, 123, 158, ['#9a897d', '#a59486', '#8c7b71']]]
    : [[36, 63, 145, 139, ['#b88b75', '#c4947f', '#a97867']],
      [186, 63, 150, 139, ['#c3a071', '#cdab7b', '#ad8c64']],
      [340, 63, 137, 139, ['#ae927d', '#bca08a', '#9d836f']]];
  planks(ctx, 36, 63, 441, 211, workshop ? ['#ad9278', '#b59b83', '#9f876e'] : ['#ceab82', '#d6b18b', '#bd9a75']);
  for (const [x, y, w, h, colors] of rooms) {
    planks(ctx, x, y, w, h, colors, workshop);
    rect('#00000018', x, y, w, 5);
  }
  for (const [x, y, w, h] of map.walls) {
    const tall = h > w;
    rect('#2d252b44', x + 2, y + 4, w + 2, h + 2);
    rect('#604a43', x - 1, y, w + 2, h);
    rect('#8d6655', x, y - (tall ? 2 : 4), w, h);
    rect('#deb18d', x, y - (tall ? 2 : 5), tall ? 2 : w, tall ? h : 2);
    if (!tall) rect('#a27b66', x + 2, y + 1, w - 4, 2);
  }
  rect('#6c5548', 32, 63, 5, 211);
  rect('#d2a581', 34, 63, 2, 208);
  rect('#674e45', 476, 63, 5, 211);
  rect('#c69d7f', 476, 63, 2, 208);
  rect('#6c5146', 34, 273, 198, 5);
  rect('#6c5146', 284, 273, 195, 5);
  rect('#e2b089', 34, 273, 198, 2);
  rect('#e2b089', 284, 273, 195, 2);
  for (let y = 274; y < HEIGHT; y += 6) {
    rect('#53433f', 231, y, 53, 6);
    rect('#a4846c', 233, y, 49, 4);
    rect('#c4a483', 233, y, 49, 1);
  }
  for (const x of workshop ? [93, 246, 366, 418] : [105, 246, 389, 433]) windowFrame(ctx, x, 44, workshop ? 17 : 26);
  const picture = (x, y, c) => {
    box(x, y, 11, 12, COLORS.amber, 1);
    rect('#f2c59b', x + 2, y + 2, 7, 8);
    rect(c, x + 4, y + 4, 4, 4);
    rect('#d8956d', x + 3, y + 7, 5, 2);
  };
  picture(151, 46, '#8c748e');
  picture(309, 46, '#6d8f70');
  if (!workshop) {
    for (const [x, y] of [[218, 63], [296, 63], [217, 192], [300, 192]]) {
      rect('#ffe9ad24', x - 4, y, 17, 9);
      rect('#ffd592', x, y - 3, 7, 5);
      rect('#fff0c2', x + 1, y - 3, 5, 2);
    }
  }
}

function yardWalls(ctx, map) {
  const { rect, box } = pixelArt(ctx);
  for (const [x, y, w, h] of map.walls) {
    rect('#45574788', x + 4, y + 4, w + 3, h + 2);
    rect('#584f44', x + 1, y, w, h);
    rect('#ad8c68', x + 1, y, 3, h);
    for (let yy = y; yy < y + h; yy += 12) box(x - 1, yy - 2, 8, 7, COLORS.amber, 2);
  }
}

function drawProp(ctx, item) {
  const { rect: rawRect, shape, box, tuft } = pixelArt(ctx);
  const { x, y, w, d, type } = item;
  const c = COLORS[item.color];
  const [dark, mid, light, shine] = c;
  const l = Math.round(x - w / 2);
  const t = y - d;
  const rect = (color, dx, dy, width, height) => rawRect(color, l + dx, t + dy, width, height);
  if (type !== 'rug') rect('#322c3433', 2, d - 4, w + 4, 7);
  switch (type) {
    case 'rug':
      rect(dark, -1, -1, w + 2, d + 2);
      rect(mid, 0, 0, w, d);
      rect(light, 2, 2, w - 4, d - 4);
      rect(mid, 4, 4, w - 8, d - 8);
      for (let i = 4; i < w - 3; i += 5) {
        rect(shine, i, 1, 2, 2);
        rect(shine, i, d - 2, 2, 2);
      }
      for (let i = 8; i < w - 6; i += 13) {
        rect(light, i, d / 2 - 3, 5, 6);
        rect(shine, i + 2, d / 2 - 1, 2, 2);
      }
      break;
    case 'wardrobe':
      box(l, t - 14, w, d + 14, c, 6);
      rect(dark, w / 2, -8, 1, d + 4);
      for (const px of [3, w / 2 + 3]) {
        rect(dark, px, -5, w / 2 - 6, d - 1);
        rect(mid, px + 1, -4, w / 2 - 8, d - 3);
        rect(light, px + 2, -3, 1, d - 6);
      }
      rect('#edc381', w / 2 - 4, 4, 2, 3);
      rect('#edc381', w / 2 + 2, 4, 2, 3);
      break;
    case 'curtain':
      rect(INK, -2, -17, w + 4, 4);
      rect('#e5bd92', -1, -17, w + 2, 1);
      rect(dark, 0, -13, w, d + 12);
      rect('#627b79', 7, -12, w - 14, 13);
      rect('#a2c1ae', 8, -11, w - 16, 4);
      rect(mid, 1, -13, 7, d + 11);
      rect(mid, w - 8, -13, 7, d + 11);
      rect(light, 2, -12, 2, d + 8);
      rect(light, w - 7, -12, 2, d + 8);
      rect(shine, 2, 2, 5, 1);
      rect(shine, w - 7, 2, 5, 1);
      break;
    case 'bed':
      box(l, t - 6, w, d + 6, COLORS.amber);
      rect('#ead0b1', 2, 0, w - 4, d - 4);
      rect('#fff0d2', 5, 1, w - 10, 7);
      rect('#d6b49e', 5, 8, w - 10, 1);
      rect(light, 2, 10, w - 4, d - 12);
      rect(shine, 2, 10, w - 4, 2);
      rect(mid, 3, 16, w - 6, 1);
      rect(shine, 6, 18, w - 12, 1);
      break;
    case 'sofa':
      box(l, t - 7, w, d + 7, c, 6);
      rect(dark, 2, 2, w - 4, 4);
      rect(light, 3, 7, w - 6, 7);
      rect(mid, w / 2, 4, 1, 10);
      rect(shine, 6, 3, 6, 4);
      rect('#dba486', w - 12, 2, 6, 5);
      rect(mid, 1, 5, 4, d - 6);
      rect(mid, w - 5, 5, 4, d - 6);
      rect(shine, 2, 5, 2, 2);
      break;
    case 'table':
    case 'bench':
      rect(INK, 2, 3, 4, d - 1);
      rect(INK, w - 6, 3, 4, d - 1);
      box(l, t - (type === 'table' ? 5 : 3), w, d - 4, COLORS.amber, d - 8);
      rect('#ad774e', 2, 0, w - 5, 1);
      if (type === 'table') {
        rect(light, 6, -3, 12, 7);
        rect(shine, 7, -3, 10, 1);
        rect('#f6dcad', 10, -2, 5, 4);
        rect('#946450', w - 8, -2, 4, 4);
      }
      break;
    case 'chest':
    case 'crate':
    case 'console':
      box(l, t - 3, w, d + 3, type === 'console' ? c : COLORS.amber);
      rect('#77513e', 1, 4, w - 2, 2);
      if (type === 'crate') {
        rect('#bd8958', 2, 7, 3, d - 8);
        rect('#bd8958', w - 6, 7, 3, d - 8);
        rect('#c79563', 3, d - 5, w - 6, 2);
      } else {
        rect('#eaca7d', w / 2 - 2, 5, 4, 4);
        rect('#705241', w / 2 - 1, 7, 2, 1);
      }
      break;
    case 'basket':
    case 'barrel':
      box(l + 1, t - 2, w - 2, d + 2, COLORS.amber, 5);
      rect('#805940', 2, -1, w - 4, 3);
      for (let i = 4; i < w - 4; i += 4) rect('#bb8354', i, 4, 1, d - 7);
      rect('#6d5b56', 0, 5, w, 2);
      rect('#7f6353', 1, d - 4, w - 2, 2);
      if (type === 'basket') {
        rect(light, 4, -3, 8, 5);
        rect(shine, 5, -3, 6, 1);
      }
      break;
    case 'plant':
      box(l + 3, t + 3, w - 6, d - 3, COLORS.amber, 2);
      tuft(l, t + 1, COLORS.moss, true);
      tuft(l + 4, t - 6, COLORS.moss, true);
      tuft(l - 3, t - 7, COLORS.moss);
      rect('#b8c885', 7, -5, 2, 3);
      break;
    case 'tree':
      tree(ctx, x, y, .82);
      break;
    case 'bush':
      rect(dark, 0, 1, w, d - 3);
      rect(mid, 2, -2, w - 4, d - 2);
      rect(light, 5, -5, w - 10, 11);
      rect(light, 2, 1, 5, 5);
      rect(shine, 8, -3, 5, 2);
      rect(dark, w - 7, 4, 4, 2);
      rect('#ebbc85', 6, 5, 2, 2);
      rect('#ebbc85', w - 8, 0, 2, 2);
      break;
    case 'playhouse':
      box(l + 3, t - 5, w - 6, d + 5, c);
      shape(INK, [[l - 2, t - 4], [x, t - 23], [l + w + 2, t - 4], [l + w + 2, t], [l - 2, t]]);
      shape(mid, [[l, t - 5], [x, t - 21], [l + w, t - 5], [l + w, t - 2], [l, t - 2]]);
      rect(light, 6, -7, w - 12, 2);
      rect('#44383b', 7, 7, 7, 7);
      rect('#b1bca0', 8, 8, 5, 4);
      rect(INK, w - 17, 7, 10, d - 7);
      rect(dark, w - 16, 8, 8, d - 9);
      break;
    case 'slide':
      box(l + 2, t - 9, 13, 15, COLORS.rose);
      rect('#5e4957', 5, 4, 3, d - 4);
      rect('#a27270', 1, 3, 9, 2);
      rect('#a27270', 1, 9, 9, 2);
      rect('#a27270', 1, 15, 9, 2);
      shape(INK, [[l + 12, t - 4], [l + 20, t - 4], [l + w + 1, y - 1], [l + w - 10, y - 1]]);
      shape(light, [[l + 13, t - 3], [l + 19, t - 3], [l + w - 1, y - 2], [l + w - 9, y - 2]]);
      rect(shine, w - 9, d - 4, 8, 2);
      break;
    case 'swing':
      rect(dark, 2, -8, 3, d + 7);
      rect(dark, w - 5, -8, 3, d + 7);
      rect(light, 2, -8, 2, d + 4);
      rect(light, w - 5, -8, 2, d + 4);
      rect(INK, 0, -11, w, 4);
      rect(shine, 1, -11, w - 2, 2);
      rect('#e4c7a3', 12, -7, 1, 19);
      rect('#e4c7a3', w - 13, -7, 1, 19);
      rect(INK, 10, 11, w - 20, 5);
      rect(mid, 11, 11, w - 22, 2);
      break;
    case 'tire':
      rect(INK, 3, 0, w - 6, d);
      rect(INK, 0, 4, w, d - 8);
      rect('#625b64', 4, 1, w - 8, d - 4);
      rect('#50454f', 2, 5, w - 4, d - 7);
      rect('#2c2c37', 6, 5, w - 12, d - 9);
      rect(mid, 4, 2, w - 9, 2);
      break;
    case 'shelves':
      box(l, t - 13, w, d + 13, c, 4);
      for (const row of [-8, 1, 9]) {
        rect(dark, 2, row, w - 5, 6);
        rect('#e1ab6e', 4, row + 1, 5, 5);
        rect('#9c697b', 11, row + 2, 5, 4);
        rect('#9eae80', 19, row, 6, 6);
      }
      break;
    case 'screen':
      for (let i = 0; i < 3; i++) {
        box(l + i * 11, t - 11 + i % 2 * 2, 11, d + 8, c, 3);
        rect(shine, 2 + i * 11, -4, 6, 1);
        rect(dark, 4 + i * 11, 2, 2, 2);
      }
      break;
    case 'stool':
      rect(dark, 2, 2, 3, d - 1);
      rect(dark, w - 5, 2, 3, d - 1);
      box(l + 1, t - 3, w - 2, d - 3, c, 4);
      break;
  }
}

function renderMapBase(ctx, kind) {
  const map = MAPS[kind];
  drawGround(ctx, kind);
  if (kind === 'yard') yardWalls(ctx, map);
  else roomWalls(ctx, map, kind === 'workshop');
  map.props.filter(item => item.type === 'rug').forEach(item => drawProp(ctx, item));
}

function drawMapThumbnail(canvas, kind) {
  const sheet = document.createElement('canvas');
  sheet.width = WIDTH;
  sheet.height = HEIGHT;
  const ctx = sheet.getContext('2d', { willReadFrequently: true });
  renderMapBase(ctx, kind);
  MAPS[kind].props.filter(item => item.type !== 'rug').sort((a, b) => a.y - b.y).forEach(item => drawProp(ctx, item));
  const thumb = canvas.getContext('2d');
  thumb.imageSmoothingEnabled = false;
  thumb.drawImage(sheet, 19, 31, 474, 252, 0, 0, canvas.width, canvas.height);
}

function drawActor(ctx, actor, imageSet, emphasized, now) {
  const { rect } = pixelArt(ctx);
  const { x, y, hero } = actor;
  const art = imageSet[hero.id];
  const h = hero.height;
  rect('#26263450', x - 8, y - 1, 16, 4);
  rect('#26263430', x - 10, y, 20, 2);
  const offset = actor.moving ? Math.round(Math.sin(actor.stride / 3) * .8) : 0;
  if (actor.face === 'left' || actor.face === 'right') {
    const frame = actor.moving ? Math.floor(actor.stride / 3) % 8 : 0;
    const width = Math.round(h * 36 / 41);
    if (art.walk.complete && art.walk.naturalWidth) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (actor.face === 'left') ctx.scale(-1, 1);
      ctx.drawImage(art.walk, frame % 4 * 36, Math.floor(frame / 4) * 48 + 3, 36, 42,
        -Math.floor(width / 2), -h + offset, width, h);
      ctx.restore();
    }
  } else {
    const image = actor.face === 'up' ? art.back : art.front;
    if (image.complete && image.naturalWidth) {
      const w = Math.round(h * image.width / image.height);
      ctx.drawImage(image, Math.round(x - w / 2), Math.round(y - h + offset), w, h);
    }
  }
  if (emphasized || actor.found) {
    const color = actor.found ? '#f3d68b' : hero.color;
    const top = Math.round(y - h - 7 + (Math.sin(now / 180) > .45 ? 1 : 0));
    rect('#302839', x - 3, top - 1, 7, 4);
    rect(color, x - 2, top, 5, 2);
    rect(color, x - 1, top + 2, 3, 1);
  }
}

function drawScene(ctx, base, game, sprites, now) {
  const { rect } = pixelArt(ctx);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0);
  const nearby = game.active ? game.nearby() : null;
  const entries = [
    ...game.map.props.filter(item => item.type !== 'rug').map(item => ({ y: item.y, item })),
    ...game.actors.filter(actor => !actor.hidden).map(actor => ({ y: actor.y, actor }))
  ].sort((a, b) => a.y - b.y);
  if (game.walkTarget) {
    const { x, y } = game.walkTarget;
    rect('#ffe6ad88', x - 4, y - 1, 9, 2);
    rect('#ffe6ad88', x - 1, y - 4, 2, 9);
  }
  for (const { item, actor } of entries) {
    if (actor) {
      drawActor(ctx, actor, sprites, actor === game.player, now);
      continue;
    }
    drawProp(ctx, item);
    if (item.hide && game.active && !game.checked.has(item)) {
      rect('#412c38a0', item.x - 2, item.y + 2, 4, 3);
      rect('#efd394', item.x - 1, item.y + 2, 2, 2);
    }
    if (item === nearby && !(game.role === 'seek' && game.phase === 'count')) {
      const x = item.x;
      const w = item.w / 2 + 3;
      rect('#fff3bb', x - w, item.y + 2, 5, 2);
      rect('#fff3bb', x - w, item.y - 1, 2, 5);
      rect('#fff3bb', x + w - 5, item.y + 2, 5, 2);
      rect('#fff3bb', x + w - 2, item.y - 1, 2, 5);
    }
    if (game.checked.has(item)) {
      rect('#392f3e', item.x - 4, item.y + 1, 8, 6);
      rect('#c5cf99', item.x - 2, item.y + 4, 2, 1);
      rect('#c5cf99', item.x, item.y + 3, 2, 1);
    }
    if (game.clue?.item === item) {
      const n = Math.round(Math.sin(now / 160) * 3);
      const x = item.x + item.w / 2 + 5;
      const y = item.y - item.d - 4 + n;
      rect('#fff2af', x - 4, y, 9, 2);
      rect('#fff2af', x, y - 4, 2, 9);
      rect('#ffe19d', x + 7, y - 6, 2, 2);
    }
  }
}
