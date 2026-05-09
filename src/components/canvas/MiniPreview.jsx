import React, { useEffect, useRef } from 'react';
import useProjectStore from '../../store/projectStore';
import { getInterpolatedPosition } from '../../utils/tweenUtils';

const MiniPreview = () => {
  const canvasRef = useRef(null);
  const { project } = useProjectStore();
  const { sprites, keyframes, editor, meta } = project;
  const { currentFrame } = editor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for mini preview (usually 1x or 2x)
    const scale = 1;
    
    // Clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all visible sprites
    sprites.forEach(sprite => {
      if (!sprite.visible) return;
      const pos = getInterpolatedPosition(keyframes[sprite.id], currentFrame);
      if (!pos || !pos.visible) return;

      ctx.fillStyle = '#00FF41'; // OLED Green
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          if (sprite.pixels[y * sprite.width + x]) {
            ctx.fillRect((pos.x + x) * scale, (pos.y + y) * scale, scale, scale);
          }
        }
      }
    });
  }, [sprites, keyframes, currentFrame, meta]);

  return (
    <div className="absolute bottom-4 right-4 z-20 bg-black border border-[#333] rounded shadow-2xl overflow-hidden pointer-events-none">
      <div className="bg-[#111] px-2 py-1 border-b border-[#333] flex justify-between items-center">
        <span className="text-[8px] text-[#555] uppercase font-bold tracking-widest">OLED PREVIEW (1X)</span>
        <div className="w-1.5 h-1.5 bg-oled rounded-full animate-pulse"></div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={128} 
        height={64} 
        className="block"
      />
    </div>
  );
};

export default MiniPreview;
