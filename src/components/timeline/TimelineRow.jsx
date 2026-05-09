import React from 'react';

const TimelineRow = ({ sprite, keyframes, totalFrames, currentFrame, isPlaying, onToggleKeyframe, onSetFrame }) => {
  return (
    <div className="h-8 border-b border-[#222] flex hover:bg-[#1f1f1f] transition-colors">
      {/* Sprite Info */}
      <div className="w-40 border-r border-[#333] shrink-0 flex items-center px-3 gap-2 bg-[#1a1a1a]">
        <div className="w-2 h-2 rounded-full bg-oled/50"></div>
        <span className="text-[10px] text-[#aaa] truncate">{sprite.name}</span>
      </div>

      {/* Frame Cells */}
      <div className="flex-1 flex overflow-x-auto no-scrollbar relative">
        {Array.from({ length: totalFrames }).map((_, i) => {
          const hasKeyframe = keyframes && keyframes[i];
          
          return (
            <div
              key={i}
              onClick={() => onSetFrame(i)}
              onDoubleClick={() => onToggleKeyframe(sprite.id, i)}
              className={`w-6 h-full shrink-0 border-r border-[#222] flex items-center justify-center relative cursor-pointer ${
                currentFrame === i ? 'bg-white/5' : ''
              }`}
            >
              {hasKeyframe && (
                <div 
                  className={`w-2.5 h-2.5 rotate-45 border transform transition-all hover:scale-125 ${
                    currentFrame === i 
                      ? 'bg-oled border-white shadow-[0_0_10px_#00FF41] z-10' 
                      : 'bg-[#444] border-[#666] opacity-60'
                  } ${isPlaying && currentFrame === i ? 'animate-pulse' : ''}`}
                  title={`Frame ${i}: X:${keyframes[i].x} Y:${keyframes[i].y}`}
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
