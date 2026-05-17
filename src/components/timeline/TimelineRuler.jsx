const TimelineRuler = ({ totalFrames, currentFrame, fps = 12, onSetFrame }) => {
  return (
    <div className="h-8 border-b border-[#333] bg-[#222] flex sticky top-0 z-10">
      {/* Spacer for row names */}
      <div className="w-40 border-r border-[#333] shrink-0"></div>
      
      {/* Frames */}
      <div className="flex-1 flex overflow-x-auto no-scrollbar relative">
        {Array.from({ length: totalFrames }).map((_, i) => {
          // Determine interval for labels (every half second or full second)
          const isSecond = i % fps === 0;
          const isHalfSecond = i % Math.max(1, Math.floor(fps / 2)) === 0 && !isSecond;
          
          return (
            <div
              key={i}
              onClick={() => onSetFrame(i)}
              className={`w-6 h-full shrink-0 border-r border-[#333]/50 flex flex-col items-center justify-center text-[8px] cursor-pointer hover:bg-[#333] transition-colors ${
                currentFrame === i ? 'bg-oled/20 text-oled font-bold' : 'text-[#666]'
              }`}
            >
              {isSecond || isHalfSecond || i % 5 === 0 ? (
                <>
                  <span>{i}</span>
                  {(isSecond || isHalfSecond) && (
                    <span className="text-[7px] text-[#444] -mt-1 font-mono">
                      {(i / fps).toFixed(1)}s
                    </span>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineRuler;
