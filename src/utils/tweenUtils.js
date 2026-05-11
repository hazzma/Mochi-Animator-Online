/**
 * Utility functions for keyframe interpolation (tweening).
 */

export const getInterpolatedPosition = (keyframesForSprite, frameIndex) => {
  if (!keyframesForSprite) return { x: 0, y: 0, visible: true };

  const frames = Object.keys(keyframesForSprite)
    .map(Number)
    .sort((a, b) => a - b);

  if (frames.length === 0) return { x: 0, y: 0, visible: true };

  // If frame exact match
  if (keyframesForSprite[frameIndex] !== undefined) {
    const kf = keyframesForSprite[frameIndex];
    return { ...kf, visible: kf.visible !== false }; // Default to true
  }

  // Find nearest prev and next
  let prevFrame = -1;
  let nextFrame = -1;

  for (let f of frames) {
    if (f < frameIndex) prevFrame = f;
    if (f > frameIndex) {
      nextFrame = f;
      break;
    }
  }

  // Case: only one keyframe
  if (prevFrame === -1 && nextFrame === -1) return { x: 0, y: 0, visible: true };
  
  // Case: frame is before the first keyframe
  if (prevFrame === -1) {
    const kf = keyframesForSprite[nextFrame];
    return { ...kf, visible: kf.visible !== false };
  }
  
  // Case: frame is after the last keyframe
  if (nextFrame === -1) {
    const kf = keyframesForSprite[prevFrame];
    return { ...kf, visible: kf.visible !== false };
  }

  // Linear Interpolation
  const t = (frameIndex - prevFrame) / (nextFrame - prevFrame);
  const p1 = keyframesForSprite[prevFrame];
  const p2 = keyframesForSprite[nextFrame];

  return {
    x: Math.round(p1.x + (p2.x - p1.x) * t),
    y: Math.round(p1.y + (p2.y - p1.y) * t),
    rotation: p1.rotation + (p2.rotation - p1.rotation) * t || 0,
    visible: p1.visible !== false, // Default to true
    pixels: p1.pixels // Pass along custom frame pixels if they exist
  };
};
