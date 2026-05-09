import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import TimelineRuler from './TimelineRuler';
import TimelineRow from './TimelineRow';
import { getInterpolatedPosition } from '../../utils/tweenUtils';

const Timeline = () => {
  const { project, setKeyframe, deleteKeyframe, setCurrentFrame, togglePlay } = useProjectStore();
  const { meta, sprites, keyframes, editor } = project;
  const { isPlaying, currentFrame } = editor;

  const handleToggleKeyframe = (spriteId, frameIndex) => {
    if (keyframes[spriteId]?.[frameIndex]) {
      deleteKeyframe(spriteId, frameIndex);
    } else {
      // Create new keyframe at current interpolated position
      const pos = getInterpolatedPosition(keyframes[spriteId], frameIndex);
      setKeyframe(spriteId, frameIndex, { 
        x: pos.x, 
        y: pos.y, 
        visible: true 
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] overflow-hidden">
      <TimelineRuler 
        totalFrames={meta.totalFrames} 
        currentFrame={currentFrame}
        onSetFrame={setCurrentFrame}
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sprites.length === 0 ? (
          <div className="p-10 text-center text-[#444] text-[10px] font-bold uppercase tracking-widest">
            Add layers to start animating.
          </div>
        ) : (
          [...sprites].reverse().map(sprite => (
            <TimelineRow
              key={sprite.id}
              sprite={sprite}
              keyframes={keyframes[sprite.id]}
              totalFrames={meta.totalFrames}
              currentFrame={currentFrame}
              isPlaying={isPlaying}
              onToggleKeyframe={handleToggleKeyframe}
              onSetFrame={setCurrentFrame}
            />
          ))
        )}
      </div>

      {/* Playback Controls */}
      <div className="h-10 bg-[#222] border-t border-[#333] flex items-center px-4 gap-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-7 bg-[#333] hover:bg-[#444] text-white rounded flex items-center justify-center transition-colors"
            onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
            title="Previous Frame"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            className={`px-6 h-7 rounded text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              isPlaying 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
                : 'bg-oled/10 text-oled border border-oled/30 shadow-[0_0_15px_rgba(0,255,65,0.1)] hover:bg-oled/20'
            }`}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            className="w-8 h-7 bg-[#333] hover:bg-[#444] text-white rounded flex items-center justify-center transition-colors"
            onClick={() => setCurrentFrame(Math.min(meta.totalFrames - 1, currentFrame + 1))}
            title="Next Frame"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-4 border-l border-[#333] pl-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#666] font-bold">TOTAL FRAMES</span>
            <input 
              type="number" 
              className="w-12 bg-black border border-[#444] text-xs px-1 rounded text-oled"
              value={meta.totalFrames}
              onChange={(e) => {/* Action for meta update */}}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#666] font-bold">FPS</span>
            <input 
              type="number" 
              className="w-10 bg-black border border-[#444] text-xs px-1 rounded text-oled"
              value={meta.fps}
              onChange={(e) => {/* Action for meta update */}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
