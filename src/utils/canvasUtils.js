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
