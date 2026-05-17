import { useEffect, useRef } from 'react';
import useProjectStore from '../../store/projectStore';
import { renderProjectFrame } from '../../utils/canvasUtils';

const MiniPreview = () => {
  const canvasRef = useRef(null);
  const { project } = useProjectStore();
  const { editor, meta } = project;
  const { currentFrame } = editor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for mini preview (usually 1x or 2x)
    const scale = 1;
    
    renderProjectFrame(ctx, project, currentFrame, scale);
  }, [project, currentFrame, meta]);

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
