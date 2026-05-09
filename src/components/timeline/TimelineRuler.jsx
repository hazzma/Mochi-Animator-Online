import React from 'react';

const TimelineRuler = ({ totalFrames, currentFrame, onSetFrame }) => {
  return (
    <div className="h-8 border-b border-[#333] bg-[#222] flex sticky top-0 z-10">
      {/* Spacer for row names */}
      <div className="w-40 border-r border-[#333] shrink-0"></div>
      
      {/* Frames */}
      <div className="flex-1 flex overflow-x-auto no-scrollbar relative">
        {Array.from({ length: totalFrames }).map((_, i) => (
          <div
            key={i}
            onClick={() => onSetFrame(i)}
            className={`w-6 h-full shrink-0 border-r border-[#333]/50 flex items-center justify-center text-[9px] cursor-pointer hover:bg-[#333] transition-colors ${
              currentFrame === i ? 'bg-oled/20 text-oled font-bold' : 'text-[#666]'
            }`}
          >
            {i % 5 === 0 ? i : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineRuler;
