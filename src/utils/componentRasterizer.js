const FONT_3X5 = {
  ' ': ['000', '000', '000', '000', '000'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  'A': ['111', '101', '111', '101', '101'],
  'B': ['110', '101', '110', '101', '110'],
  'C': ['111', '100', '100', '100', '111'],
  'D': ['110', '101', '101', '101', '110'],
  'E': ['111', '100', '110', '100', '111'],
  'F': ['111', '100', '110', '100', '100'],
  'G': ['111', '100', '101', '101', '111'],
  'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'],
  'J': ['001', '001', '001', '101', '111'],
  'K': ['101', '101', '110', '101', '101'],
  'L': ['100', '100', '100', '100', '111'],
  'M': ['101', '111', '111', '101', '101'],
  'N': ['101', '111', '111', '111', '101'],
  'O': ['111', '101', '101', '101', '111'],
  'P': ['111', '101', '111', '100', '100'],
  'Q': ['111', '101', '101', '111', '001'],
  'R': ['111', '101', '111', '110', '101'],
  'S': ['111', '100', '111', '001', '111'],
  'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'],
  'V': ['101', '101', '101', '101', '010'],
  'W': ['101', '101', '111', '111', '101'],
  'X': ['101', '101', '010', '101', '101'],
  'Y': ['101', '101', '010', '010', '010'],
  'Z': ['111', '001', '010', '100', '111'],
  ':': ['000', '010', '000', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '%': ['101', '001', '010', '100', '101'],
  '!': ['010', '010', '010', '000', '010'],
};

const setPixel = (pixels, width, height, x, y, value = true) => {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= width || py < 0 || py >= height) return;
  pixels[py * width + px] = value;
};

const drawLine = (pixels, width, height, x0, y0, x1, y1) => {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y);
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;

  while (true) {
    setPixel(pixels, width, height, x, y);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

const drawRect = (pixels, width, height, x, y, w, h, fill = false) => {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + w - 1);
  const y1 = Math.round(y + h - 1);

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      if (fill || py === y0 || py === y1 || px === x0 || px === x1) {
        setPixel(pixels, width, height, px, py);
      }
    }
  }
};

const drawText = (pixels, width, height, text, x, y, scale = 1) => {
  const safeScale = Math.max(1, Math.round(scale));
  let cursorX = Math.round(x);
  const cursorY = Math.round(y);

  String(text).toUpperCase().split('').forEach(char => {
    const glyph = FONT_3X5[char] || FONT_3X5['!'];
    glyph.forEach((row, gy) => {
      row.split('').forEach((bit, gx) => {
        if (bit !== '1') return;
        drawRect(
          pixels,
          width,
          height,
          cursorX + gx * safeScale,
          cursorY + gy * safeScale,
          safeScale,
          safeScale,
          true
        );
      });
    });
    cursorX += 4 * safeScale;
  });
};

const drawIcon = (pixels, width, height, comp) => {
  const { x, y, w, h } = comp;
  const icon = comp.props?.icon || 'battery';
  drawRect(pixels, width, height, x, y, w, h, false);

  if (icon === 'heart') {
    drawLine(pixels, width, height, x + w * 0.2, y + h * 0.35, x + w * 0.5, y + h * 0.75);
    drawLine(pixels, width, height, x + w * 0.8, y + h * 0.35, x + w * 0.5, y + h * 0.75);
    drawLine(pixels, width, height, x + w * 0.2, y + h * 0.35, x + w * 0.35, y + h * 0.2);
    drawLine(pixels, width, height, x + w * 0.8, y + h * 0.35, x + w * 0.65, y + h * 0.2);
  } else if (icon === 'wifi') {
    drawLine(pixels, width, height, x + w * 0.2, y + h * 0.45, x + w * 0.5, y + h * 0.2);
    drawLine(pixels, width, height, x + w * 0.8, y + h * 0.45, x + w * 0.5, y + h * 0.2);
    drawLine(pixels, width, height, x + w * 0.35, y + h * 0.65, x + w * 0.5, y + h * 0.52);
    drawLine(pixels, width, height, x + w * 0.65, y + h * 0.65, x + w * 0.5, y + h * 0.52);
    setPixel(pixels, width, height, x + w * 0.5, y + h * 0.82);
  } else if (icon === 'bluetooth') {
    drawLine(pixels, width, height, x + w * 0.5, y + h * 0.15, x + w * 0.5, y + h * 0.85);
    drawLine(pixels, width, height, x + w * 0.5, y + h * 0.15, x + w * 0.75, y + h * 0.35);
    drawLine(pixels, width, height, x + w * 0.75, y + h * 0.35, x + w * 0.35, y + h * 0.65);
    drawLine(pixels, width, height, x + w * 0.35, y + h * 0.35, x + w * 0.75, y + h * 0.65);
    drawLine(pixels, width, height, x + w * 0.75, y + h * 0.65, x + w * 0.5, y + h * 0.85);
  } else {
    drawRect(pixels, width, height, x + 2, y + 2, Math.max(1, w - 5), Math.max(1, h - 5), true);
    drawRect(pixels, width, height, x + w, y + h * 0.35, 2, h * 0.3, true);
  }
};

export const rasterizeUIComponents = (basePixels, width, height, components = [], frameIndex = 0) => {
  const pixels = [...basePixels];

  components.forEach(comp => {
    if (comp.type === 'ui-clock') {
      const text = comp.props?.format?.includes('ss') ? '12:00:00' : '12:00';
      drawText(pixels, width, height, text, comp.x, comp.y, Math.max(1, Math.floor(comp.h / 6)));
    } else if (comp.type === 'ui-label') {
      drawText(pixels, width, height, comp.props?.text || 'LABEL', comp.x, comp.y, Math.max(1, Math.floor(comp.h / 6)));
    } else if (comp.type === 'ui-bar') {
      drawRect(pixels, width, height, comp.x, comp.y, comp.w, comp.h, false);
      const fillW = Math.round((comp.w - 4) * ((comp.props?.value || 0) / 100));
      drawRect(pixels, width, height, comp.x + 2, comp.y + 2, fillW, Math.max(1, comp.h - 4), true);
    } else if (comp.type === 'ui-graph') {
      let prev = null;
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const wave = 0.5 + Math.sin((frameIndex + i) * 0.9) * 0.35;
        const point = {
          x: comp.x + comp.w * t,
          y: comp.y + comp.h * (1 - wave),
        };
        if (prev) drawLine(pixels, width, height, prev.x, prev.y, point.x, point.y);
        prev = point;
      }
    } else if (comp.type === 'ui-icon') {
      drawIcon(pixels, width, height, comp);
    }
  });

  return pixels;
};
