import React, { useState, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';

const TimelineRow = ({ sprite, keyframes, totalFrames, currentFrame, isPlaying, onToggleKeyframe, onSetFrame, onToggleShapeLock, onUpdateRange }) => {
  const start = sprite.startFrame ?? 0;
  const end = sprite.endFrame ?? (totalFrames - 1);
  const cellWidth = 24;

  const [dragState, setDragState] = useState(null); // 'left', 'right', 'body'
  const [dragStartX, setDragStartX] = useState(0);
  const [initialRange, setInitialRange] = useState({ start: 0, end: 0 });

  const handlePointerDown = (e, type) => {
    e.stopPropagation();
    setDragState(type);
    setDragStartX(e.clientX);
    setInitialRange({ start, end });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      const deltaX = e.clientX - dragStartX;
      const deltaFrames = Math.round(deltaX / cellWidth);
      
      let newStart = initialRange.start;
      let newEnd = initialRange.end;

      if (dragState === 'left') {
        newStart = Math.max(0, Math.min(newEnd, initialRange.start + deltaFrames));
      } else if (dragState === 'right') {
        newEnd = Math.max(newStart, Math.min(totalFrames - 1, initialRange.end + deltaFrames));
      } else if (dragState === 'body') {
        const move = Math.max(-initialRange.start, Math.min(totalFrames - 1 - initialRange.end, deltaFrames));
        newStart = initialRange.start + move;
        newEnd = initialRange.end + move;
      }

      if (newStart !== start || newEnd !== end) {
        onUpdateRange(sprite.id, newStart, newEnd);
      }
    };

    const handlePointerUp = () => setDragState(null);

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, dragStartX, initialRange, start, end, sprite.id, totalFrames, onUpdateRange]);

  return (
    <div className="h-8 border-b border-[#222] flex hover:bg-[#1f1f1f] transition-colors relative">
      {/* Sprite Info */}
      <div className="w-40 border-r border-[#333] shrink-0 flex items-center px-3 gap-2 bg-[#1a1a1a] justify-between z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-oled/50 shrink-0"></div>
          <span className="text-[10px] text-[#aaa] truncate">{sprite.name}</span>
        </div>
        <button 
          onClick={() => onToggleShapeLock(sprite.id)}
          className={`p-1 rounded transition-colors shrink-0 ${sprite.shapeLocked ? 'text-oled bg-oled/10' : 'text-[#666] hover:text-white hover:bg-[#333]'}`}
          title={sprite.shapeLocked ? "Shape Locked (Tweening Mode)" : "Shape Unlocked (Frame-by-Frame Mode)"}
        >
          {sprite.shapeLocked ? <Link size={10} /> : <Unlink size={10} />}
        </button>
      </div>

      {/* Frame Cells */}
      <div className="flex-1 flex overflow-x-auto no-scrollbar relative">
        {/* The Range Bar */}
        <div 
          className="absolute top-1.5 bottom-1.5 bg-oled/20 border-y border-oled/40 rounded-sm cursor-grab active:cursor-grabbing flex z-20"
          style={{ 
            left: `${start * cellWidth}px`, 
            width: `${(end - start + 1) * cellWidth}px`,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'body')}
          onClick={(e) => {
            // Allow clicking the bar to set the frame
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const frameOffset = Math.floor(clickX / cellWidth);
            onSetFrame(start + frameOffset);
          }}
        >
          {/* Left Handle */}
          <div 
            className="w-1.5 h-full bg-oled/80 cursor-ew-resize hover:bg-oled flex-shrink-0 z-30"
            onPointerDown={(e) => handlePointerDown(e, 'left')}
          />
          <div className="flex-1 pointer-events-none" />
          {/* Right Handle */}
          <div 
            className="w-1.5 h-full bg-oled/80 cursor-ew-resize hover:bg-oled flex-shrink-0 z-30"
            onPointerDown={(e) => handlePointerDown(e, 'right')}
          />
        </div>

        {Array.from({ length: totalFrames }).map((_, i) => {
          const hasKeyframe = keyframes && keyframes[i];
          const isOutsideRange = i < start || i > end;
          
          return (
            <div
               key={i}
               onClick={() => onSetFrame(i)}
               onDoubleClick={() => {
                 if (!hasKeyframe) onToggleKeyframe(sprite.id, i);
               }}
               className={`w-6 h-full shrink-0 border-r border-[#222] flex items-center justify-center relative cursor-pointer z-10 ${
                 currentFrame === i ? 'bg-white/5' : ''
               } ${isOutsideRange ? 'opacity-30 diagonal-stripes' : ''}`}
             >
               {hasKeyframe && (
                 <div 
                   onClick={(e) => {
                     e.stopPropagation();
                     onToggleKeyframe(sprite.id, i);
                   }}
                   className={`w-2.5 h-2.5 rotate-45 border transform transition-all hover:scale-125 hover:bg-red-500 hover:border-red-400 group-hover:block ${
                     currentFrame === i 
                       ? 'bg-oled border-white shadow-[0_0_10px_#00FF41] z-10' 
                       : 'bg-[#444] border-[#666] opacity-60'
                   } ${isPlaying && currentFrame === i ? 'animate-pulse' : ''}`}
                   title={`Frame ${i}: Click to delete keypoint`}
                 />
               )}
             </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineRow;
