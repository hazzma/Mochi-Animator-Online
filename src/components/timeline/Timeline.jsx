import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Trash2, PlusCircle } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import TimelineRuler from './TimelineRuler';
import TimelineRow from './TimelineRow';
import { getInterpolatedPosition } from '../../utils/tweenUtils';

const Timeline = () => {
  const { project, setKeyframe, deleteKeyframe, setCurrentFrame, togglePlay, setMeta, toggleShapeLock, updateSpriteRange, addGlobalKeyframe, deleteGlobalKeyframe } = useProjectStore();
  const { meta, sprites, keyframes, editor } = project;
  const { isPlaying, currentFrame } = editor;
  const scrollContainerRef = React.useRef(null);

  const handleWheel = (e) => {
    if (e.shiftKey && scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

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
        fps={meta.fps}
        onSetFrame={setCurrentFrame}
        onAddKeypoint={(frame) => {
          if (!editor.selectedSpriteId) return;
          const pos = getInterpolatedPosition(keyframes[editor.selectedSpriteId], frame);
          setKeyframe(editor.selectedSpriteId, frame, { 
            x: pos.x, 
            y: pos.y, 
            rotation: pos.rotation || 0, 
            visible: true 
          });
        }}
      />
      
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar"
      >
        <div className="min-w-max">
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
                onToggleShapeLock={toggleShapeLock}
                onUpdateRange={updateSpriteRange}
              />
            ))
          )}
        </div>
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

        {/* Global Scrubber */}
        <div className="flex-1 flex items-center gap-4 px-2">
           <span className="text-[10px] font-mono text-oled w-12 text-center bg-black/50 py-1 rounded border border-[#333]">
              {currentFrame.toString().padStart(3, '0')}
           </span>
           <input 
              type="range"
              min="0"
              max={meta.totalFrames - 1}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(Number(e.target.value))}
              className="flex-1 h-1 bg-[#333] accent-oled rounded-lg appearance-none cursor-pointer hover:bg-[#444] transition-colors"
           />
        </div>

        {/* Keypoint Actions (Add/Delete) */}
        <div className="flex items-center gap-2 border-l border-[#333] pl-4">
           <button 
              onClick={() => addGlobalKeyframe(currentFrame)}
              className="flex items-center gap-2 px-3 h-7 rounded text-[9px] font-bold uppercase transition-all border bg-oled/10 text-oled border-oled/30 hover:bg-oled/20 shadow-[0_0_10px_rgba(0,255,65,0.1)]"
              title="Add Keypoint for ALL layers at current frame"
           >
              <PlusCircle size={12} />
              Add Global
           </button>
           <button 
              onClick={() => deleteGlobalKeyframe(currentFrame)}
              className="flex items-center gap-2 px-3 h-7 rounded text-[9px] font-bold uppercase transition-all border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
              title="Delete Keypoint for ALL layers at current frame"
           >
              <Trash2 size={12} />
              Delete Global
           </button>
        </div>

        <div className="flex items-center gap-6 border-l border-[#333] pl-6 flex-1 justify-end">
          <div className="flex items-center gap-3 w-48">
            <span className="text-[9px] text-[#888] font-bold whitespace-nowrap">DURATION (FRAMES)</span>
            <input 
              type="range" 
              min="1" max="200" step="1"
              className="w-full accent-oled bg-[#333] h-1 rounded-lg appearance-none cursor-pointer"
              value={meta.totalFrames}
              onChange={(e) => setMeta({ totalFrames: Number(e.target.value) })}
            />
            <input 
              type="number"
              min="1" max="999"
              className="w-12 bg-black border border-[#444] text-[10px] px-1 rounded text-oled font-mono text-center outline-none"
              value={meta.totalFrames}
              onChange={(e) => setMeta({ totalFrames: Math.max(1, Number(e.target.value)) })}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-[#111] px-2 py-1 rounded border border-[#444]">
            <span className="text-[9px] text-[#888] font-bold">FPS</span>
            <select 
              className="bg-transparent outline-none text-xs text-oled font-bold cursor-pointer"
              value={meta.fps}
              onChange={(e) => setMeta({ fps: Number(e.target.value) })}
            >
              <option value={12}>12 FPS</option>
              <option value={24}>24 FPS</option>
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
