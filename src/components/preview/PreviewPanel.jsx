import React, { useRef, useEffect, useState } from 'react';
import useProjectStore from '../../store/projectStore';
import { getInterpolatedPosition } from '../../utils/tweenUtils';

const PreviewPanel = ({ onClose }) => {
  const canvasRef = useRef(null);
  const { project, setCurrentFrame, setEditor, setMeta } = useProjectStore();
  const { meta, sprites, keyframes, editor } = project;
  const { currentFrame, isPlaying } = editor;

  // Playback Logic
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((currentFrame + 1) % meta.totalFrames);
      }, 1000 / meta.fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentFrame, meta.fps, meta.totalFrames]);

  // Render Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const zoom = 2; // 2x scale for preview

    // OLED Style: Black BG
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all visible sprites
    sprites.forEach(sprite => {
      if (!sprite.visible) return;

      const pos = getInterpolatedPosition(keyframes[sprite.id], currentFrame);
      if (!pos || !pos.visible) return;

      // OLED Green
      ctx.fillStyle = '#00FF41';
      
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          if (sprite.pixels[y * sprite.width + x]) {
            ctx.fillRect(
              (pos.x + x) * zoom, 
              (pos.y + y) * zoom, 
              zoom, 
              zoom
            );
          }
        }
      }
    });
  }, [sprites, keyframes, currentFrame]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-6 flex flex-col gap-6 max-w-md w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#888]">OLED Preview</h2>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">✕</button>
        </div>

        {/* OLED Screen Simulation */}
        <div className="flex justify-center">
          <div className="p-2 bg-[#0a0a0a] rounded border-4 border-[#333] shadow-inner">
            <canvas 
              ref={canvasRef} 
              width={128 * 2} 
              height={64 * 2} 
              className="block"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setEditor({ isPlaying: !isPlaying })}
              className={`w-24 py-2 rounded text-[10px] font-bold uppercase transition-all ${
                isPlaying 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
                  : 'bg-oled/10 text-oled border border-oled/30 shadow-[0_0_15px_rgba(0,255,65,0.1)]'
              }`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#333] pt-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#555] font-bold uppercase">Frame Rate (FPS)</label>
              <select 
                value={meta.fps}
                onChange={(e) => setMeta({ fps: Number(e.target.value) })}
                className="bg-black border border-[#333] text-xs px-2 py-1 rounded text-oled outline-none"
              >
                {[6, 12, 24, 30, 60].map(fps => (
                  <option key={fps} value={fps}>{fps} FPS</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#555] font-bold uppercase">Current Frame</label>
              <div className="text-xs font-mono text-[#aaa] py-1">
                {currentFrame + 1} / {meta.totalFrames}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
