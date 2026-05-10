import fs from 'fs';

const w = 48; const h = 24;
const f1 = new Array(w * h).fill(0);
const f2 = new Array(w * h).fill(0);
const f3 = new Array(w * h).fill(0);

function drawEye(pixels, cx, cy, type) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let dx = x - cx;
      let dy = y - cy;
      if (type === 'open') {
        if (dy >= -8 && dy <= 7) {
          let progress = (dy + 8) / 15;
          let hw = 7 - progress * 2;
          if (Math.abs(dx) <= hw) {
            if ((dy === -8 || dy === 7) && Math.abs(dx) >= Math.floor(hw)) continue;
            pixels[y * w + x] = 1;
          }
        }
      } else if (type === 'half') {
        if (dy >= 2 && dy <= 7) {
          let progress = (dy + 8) / 15;
          let hw = 7 - progress * 2;
          if (Math.abs(dx) <= hw) pixels[y * w + x] = 1;
        }
      } else if (type === 'closed') {
        if (dy >= 6 && dy <= 7) {
          if (Math.abs(dx) <= 6) pixels[y * w + x] = 1;
        }
      }
    }
  }
}

drawEye(f1, 12, 12, 'open'); drawEye(f1, 36, 12, 'open');
drawEye(f2, 12, 12, 'half'); drawEye(f2, 36, 12, 'half');
drawEye(f3, 12, 12, 'closed'); drawEye(f3, 36, 12, 'closed');

const DEFAULT_ASSETS = [
  {
    id: 'eye-blink-rounded',
    name: 'Rounded Trapezoid Blink',
    width: 48,
    height: 24,
    frames: [
      { delay: 12, pixels: f1 },
      { delay: 2, pixels: f2 },
      { delay: 2, pixels: f3 },
      { delay: 2, pixels: f2 }
    ]
  },
  {
    id: 'smile-mouth',
    name: 'Big Smile',
    width: 40,
    height: 12,
    pixels: new Array(40 * 12).fill(0).map((_, i) => {
       const x = i % 40;
       const y = Math.floor(i / 40);
       if (y === 6 && x > 10 && x < 30) return 1;
       if (y === 7 && (x === 10 || x === 30)) return 1;
       if (y === 8 && (x === 9 || x === 31)) return 1;
       return 0;
    })
  },
  {
    id: 'heart-eyes',
    name: 'Heart Eyes',
    width: 24,
    height: 20,
    pixels: new Array(24 * 20).fill(0).map((_, i) => {
       const x = i % 24;
       const y = Math.floor(i / 24);
       return Math.abs(x-12) + Math.abs(y-8) < 6 ? 1 : 0;
    })
  }
];

fs.writeFileSync('src/data/defaultAssets.js', 'export const DEFAULT_ASSETS = ' + JSON.stringify(DEFAULT_ASSETS, null, 2) + ';', 'utf8');
