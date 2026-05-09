import React, { useMemo } from 'react';
import useProjectStore from '../../store/projectStore';
import { generateCLibrary } from '../../utils/exportEngine';

const ExportModal = ({ onClose }) => {
  const { project } = useProjectStore();
  
  const { header, source, memoryUsage } = useMemo(() => {
    return generateCLibrary(project);
  }, [project]);

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl flex flex-col max-w-4xl w-full h-[80vh]">
        {/* Header */}
        <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 shrink-0 bg-[#222] rounded-t-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-oled">Export C/C++ Library</h2>
            <div className="px-2 py-0.5 bg-black rounded border border-[#333] text-[9px] text-[#666]">
              Est. Memory: <span className="text-white">{memoryUsage} bytes</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-[#333] flex flex-col">
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] text-[9px] text-[#555] font-bold uppercase">Header File (.h)</div>
            <pre className="flex-1 p-4 text-[10px] font-mono text-[#aaa] overflow-auto bg-[#0a0a0a] selection:bg-oled/30">
              {header}
            </pre>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] text-[9px] text-[#555] font-bold uppercase">Source File (.cpp)</div>
            <pre className="flex-1 p-4 text-[10px] font-mono text-[#aaa] overflow-auto bg-[#0a0a0a] selection:bg-oled/30">
              {source}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-[#333] flex items-center justify-end px-6 gap-3 shrink-0 bg-[#222] rounded-b-lg">
          <button 
            onClick={() => downloadFile(header, `${project.meta.name}.h`)}
            className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded text-[10px] font-bold uppercase transition-all"
          >
            Download .h
          </button>
          <button 
            onClick={() => downloadFile(source, `${project.meta.name}.cpp`)}
            className="px-6 py-2 bg-oled hover:bg-[#00e039] text-black rounded text-[10px] font-bold uppercase transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]"
          >
            Download .cpp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
