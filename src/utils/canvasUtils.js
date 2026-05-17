import { getInterpolatedPosition } from './tweenUtils';

/**
 * Canvas utility functions for pixel manipulation and drawing.
 */

// Flood Fill Algorithm (4-way)
export const floodFill = (pixels, width, height, startX, startY, newValue) => {
  const newPixels = [...pixels];
  const targetValue = pixels[startY * width + startX];
  if (targetValue === newValue) return newPixels;

  const stack = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (x >= 0 && x < width && y >= 0 && y < height && newPixels[idx] === targetValue) {
      newPixels[idx] = newValue;
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }
  return newPixels;
};

// Draw Rectangle
export const drawRect = (pixels, width, height, x1, y1, x2, y2, value) => {
  const newPixels = [...pixels];
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        newPixels[y * width + x] = value;
      }
    }
  }
  return newPixels;
};

// Draw Rounded Rectangle
export const drawRoundedRect = (pixels, width, height, x1, y1, x2, y2, radius, value) => {
  const newPixels = [...pixels];
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  const r = Math.min(radius, (endX - startX) / 2, (endY - startY) / 2);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      let inCorner = false;
      // Check corners
      if (x < startX + r && y < startY + r) { // Top Left
        if (Math.pow(x - (startX + r), 2) + Math.pow(y - (startY + r), 2) > r * r) inCorner = true;
      } else if (x > endX - r && y < startY + r) { // Top Right
        if (Math.pow(x - (endX - r), 2) + Math.pow(y - (startY + r), 2) > r * r) inCorner = true;
      } else if (x < startX + r && y > endY - r) { // Bottom Left
        if (Math.pow(x - (startX + r), 2) + Math.pow(y - (endY - r), 2) > r * r) inCorner = true;
      } else if (x > endX - r && y > endY - r) { // Bottom Right
        if (Math.pow(x - (endX - r), 2) + Math.pow(y - (endY - r), 2) > r * r) inCorner = true;
      }

      if (!inCorner) {
        newPixels[y * width + x] = value;
      }
    }
  }
  return newPixels;
};

// Draw Ellipse (Bresenham's like)
export const drawEllipse = (pixels, width, height, x1, y1, x2, y2, value) => {
  const newPixels = [...pixels];
  const xc = (x1 + x2) / 2;
  const yc = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;

  if (rx === 0 || ry === 0) return newPixels;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - xc) / rx;
      const dy = (y - yc) / ry;
      if (dx * dx + dy * dy <= 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          newPixels[y * width + x] = value;
        }
      }
    }
  }
  return newPixels;
};

export const renderProjectFrame = (ctx, project, frameIndex, scale = 1, color = '#00FF41') => {
  const { meta, sprites, keyframes } = project;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, meta.canvasW * scale, meta.canvasH * scale);

  sprites.forEach(sprite => {
    if (!sprite.visible) return;

    const start = sprite.startFrame ?? 0;
    const end = sprite.endFrame ?? (meta.totalFrames - 1);
    if (frameIndex < start || frameIndex > end) return;

    const pos = getInterpolatedPosition(keyframes[sprite.id], frameIndex);
    if (!pos || !pos.visible) return;

    const pixelsToRender = (!sprite.shapeLocked && pos.pixels) ? pos.pixels : sprite.pixels;
    const rotation = ((sprite.rotation ?? 0) * Math.PI) / 180;
    const centerX = (pos.x + sprite.width / 2) * scale;
    const centerY = (pos.y + sprite.height / 2) * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    ctx.fillStyle = color;

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        if (pixelsToRender[y * sprite.width + x]) {
          ctx.fillRect((pos.x + x) * scale, (pos.y + y) * scale, scale, scale);
        }
      }
    }

    ctx.restore();

    (sprite.uiComponents || []).forEach(comp => {
      const cx = (pos.x + comp.x) * scale;
      const cy = (pos.y + comp.y) * scale;
      const cw = comp.w * scale;
      const ch = comp.h * scale;

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, scale);

      if (comp.type === 'ui-clock') {
        ctx.font = `${Math.max(8, ch * 0.8)}px monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(comp.props?.format?.includes('ss') ? '12:00:00' : '12:00', cx, cy);
      } else if (comp.type === 'ui-label') {
        ctx.font = `${Math.max(8, ch * 0.8)}px monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(comp.props?.text || 'LABEL', cx, cy);
      } else if (comp.type === 'ui-bar') {
        ctx.strokeRect(cx, cy, cw, ch);
        const fillW = (cw * (comp.props?.value || 0)) / 100;
        ctx.fillRect(cx + scale, cy + scale, Math.max(0, fillW - scale * 2), Math.max(0, ch - scale * 2));
      } else if (comp.type === 'ui-graph') {
        ctx.beginPath();
        ctx.moveTo(cx, cy + ch);
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const wave = 0.5 + Math.sin((frameIndex + i) * 0.9) * 0.35;
          ctx.lineTo(cx + cw * t, cy + ch * (1 - wave));
        }
        ctx.stroke();
      } else if (comp.type === 'ui-icon') {
        ctx.strokeRect(cx, cy, Math.min(cw, ch), Math.min(cw, ch));
        ctx.fillRect(cx + cw * 0.25, cy + ch * 0.25, cw * 0.5, ch * 0.5);
      }

      ctx.restore();
    });
  });
};
