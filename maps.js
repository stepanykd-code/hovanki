const WIDTH = 512;
const HEIGHT = 308;
const TYPES = {
  wardrobe: ['Шафа', 30, 18], curtain: ['Штори', 26, 10],
  bed: ['Ліжко', 35, 24], sofa: ['Диван', 38, 18],
  table: ['Стіл', 30, 19], chest: ['Скриня', 23, 15],
  plant: ['Великий вазон', 17, 12], basket: ['Кошик', 20, 15],
  bench: ['Лавка', 32, 13], bush: ['Кущ', 26, 15],
  playhouse: ['Ігровий будиночок', 39, 23], crate: ['Ящик', 23, 17],
  slide: ['Гірка', 31, 24], barrel: ['Бочка', 20, 15],
  shelves: ['Стелаж', 32, 15], screen: ['Ширма', 33, 13],
  tire: ['Шина', 22, 16], swing: ['Гойдалка', 37, 24],
  rug: ['Килим', 49, 27], stool: ['Табурет', 14, 11],
  console: ['Комод', 27, 14], tree: ['Дерево', 23, 17]
};

function prop(type, x, y, color, hide = true) {
  const [name, w, d] = TYPES[type];
  return { type, name, x, y, w, d, color, hide };
}

const MAPS = {
  house: {
    name: 'Будинок', description: 'Шафи, штори й тепла підлога',
    spawn: { x: 260, y: 248 }, bounds: [35, 62, 478, 274],
    walls: [[179, 63, 7, 55], [179, 145, 7, 57], [333, 63, 7, 62], [333, 152, 7, 50],
      [35, 200, 48, 7], [116, 200, 117, 7], [284, 200, 103, 7], [420, 200, 58, 7]],
    props: [
      prop('wardrobe', 61, 92, 'rose'), prop('curtain', 118, 72, 'rose'),
      prop('bed', 134, 127, 'rose'), prop('chest', 57, 158, 'rose'),
      prop('basket', 150, 184, 'rose'), prop('sofa', 255, 100, 'moss'),
      prop('table', 249, 151, 'moss'), prop('plant', 310, 180, 'moss'),
      prop('curtain', 403, 72, 'blue'), prop('wardrobe', 452, 98, 'blue'),
      prop('table', 407, 133, 'blue'), prop('basket', 365, 180, 'blue'),
      prop('chest', 456, 177, 'blue'), prop('bench', 93, 234, 'amber'),
      prop('plant', 417, 241, 'amber'),
      prop('rug', 82, 126, 'rose', false), prop('rug', 249, 140, 'moss', false),
      prop('rug', 400, 137, 'blue', false), prop('rug', 259, 261, 'amber', false),
      prop('console', 207, 88, 'moss', false), prop('stool', 388, 143, 'blue', false)
    ]
  },
  yard: {
    name: 'Майданчик', description: 'Гірка, кущі й будиночок',
    spawn: { x: 256, y: 260 }, bounds: [33, 60, 479, 278],
    walls: [[183, 69, 8, 58], [336, 181, 9, 72]],
    props: [
      prop('playhouse', 108, 108, 'rose'), prop('bush', 54, 152, 'moss'),
      prop('bench', 155, 151, 'amber'), prop('slide', 247, 126, 'blue'),
      prop('swing', 314, 116, 'rose'), prop('crate', 399, 95, 'amber'),
      prop('bush', 446, 111, 'moss'), prop('tire', 408, 160, 'blue'),
      prop('bench', 441, 206, 'amber'), prop('bush', 397, 244, 'moss'),
      prop('bush', 61, 238, 'moss'), prop('tire', 134, 227, 'rose'),
      prop('playhouse', 227, 211, 'blue'), prop('barrel', 310, 244, 'amber'),
      prop('tree', 87, 186, 'moss', false), prop('tree', 465, 252, 'moss', false)
    ]
  },
  workshop: {
    name: 'Майстерня', description: 'Стелажі, бочки й ширми',
    spawn: { x: 259, y: 250 }, bounds: [35, 62, 478, 274],
    walls: [[165, 63, 8, 62], [165, 156, 8, 55], [346, 63, 8, 84],
      [346, 178, 8, 45], [35, 212, 61, 8], [124, 212, 93, 8], [305, 220, 86, 8], [422, 220, 56, 8]],
    props: [
      prop('shelves', 67, 86, 'amber'), prop('barrel', 125, 90, 'amber'),
      prop('crate', 72, 135, 'amber'), prop('tire', 130, 170, 'blue'),
      prop('screen', 212, 88, 'moss'), prop('table', 267, 121, 'amber'),
      prop('barrel', 316, 99, 'rose'), prop('crate', 224, 172, 'rose'),
      prop('chest', 304, 186, 'amber'), prop('shelves', 396, 87, 'blue'),
      prop('wardrobe', 454, 105, 'blue'), prop('screen', 391, 147, 'rose'),
      prop('barrel', 442, 185, 'amber'), prop('crate', 103, 249, 'moss'),
      prop('shelves', 404, 248, 'amber'), prop('stool', 282, 147, 'amber', false)
    ]
  }
};

for (const map of Object.values(MAPS)) {
  map.spots = map.props.filter(item => item.hide);
  map.solids = [
    ...map.walls,
    ...map.props.filter(item => item.type !== 'rug').map(item => [
      item.x - item.w / 2, item.y - item.d, item.w, item.d
    ])
  ];
}
