import { useMemo } from 'react';
import useProjectStore from '../../store/projectStore';
import { generateCLibrary } from '../../utils/exportEngine';
import JSZip from 'jszip';
import { Archive, FileCode, FileText, Download } from 'lucide-react';

const ExportModal = ({ onClose }) => {
  const { project } = useProjectStore();
  
  const { header, source, readme, memoryUsage } = useMemo(() => {
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

  const downloadZip = async () => {
    const zip = new JSZip();
    const folderName = project.meta.name || "mochi_anim";
    
    zip.file(`${folderName}.h`, header);
    zip.file(`${folderName}.cpp`, source);
    zip.file(`README.md`, readme);
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl flex flex-col max-w-4xl w-full h-[80vh]">
        {/* Header */}
        <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 shrink-0 bg-[#222] rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-oled/10 rounded flex items-center justify-center">
               <Archive size={16} className="text-oled" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Export Mochi Library</h2>
            <div className="px-2 py-0.5 bg-black rounded border border-[#333] text-[9px] text-[#666]">
              Est. Memory: <span className="text-white">{memoryUsage} bytes</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-[#333] flex flex-col">
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] flex items-center justify-between">
               <span className="text-[9px] text-[#555] font-bold uppercase">Header File (.h)</span>
               <FileCode size={12} className="text-[#333]" />
            </div>
            <pre className="flex-1 p-4 text-[10px] font-mono text-[#aaa] overflow-auto bg-[#0a0a0a] selection:bg-oled/30">
              {header}
            </pre>
          </div>
          <div className="flex-1 border-r border-[#333] flex flex-col">
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] flex items-center justify-between">
               <span className="text-[9px] text-[#555] font-bold uppercase">Source File (.cpp)</span>
               <FileCode size={12} className="text-[#333]" />
            </div>
            <pre className="flex-1 p-4 text-[10px] font-mono text-[#aaa] overflow-auto bg-[#0a0a0a] selection:bg-oled/30">
              {source}
            </pre>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] text-[9px] text-[#555] font-bold uppercase">Documentation (.md)</div>
            <pre className="flex-1 p-4 text-[10px] font-mono text-[#888] overflow-auto bg-[#0a0a0a] selection:bg-oled/30 whitespace-pre-wrap">
              {readme}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-[#333] flex items-center justify-between px-6 shrink-0 bg-[#222] rounded-b-lg">
          <div className="flex gap-2">
            <button 
              onClick={() => downloadFile(readme, `README.md`)}
              className="px-4 py-2 bg-[#333]/50 hover:bg-[#333] text-[#888] hover:text-white rounded text-[9px] font-bold uppercase transition-all flex items-center gap-2 border border-white/5"
            >
              <FileText size={12} /> .md
            </button>
            <button 
              onClick={() => downloadFile(header, `${project.meta.name}.h`)}
              className="px-4 py-2 bg-[#333]/50 hover:bg-[#333] text-[#888] hover:text-white rounded text-[9px] font-bold uppercase transition-all flex items-center gap-2 border border-white/5"
            >
              <FileCode size={12} /> .h
            </button>
            <button 
              onClick={() => downloadFile(source, `${project.meta.name}.cpp`)}
              className="px-4 py-2 bg-[#333]/50 hover:bg-[#333] text-[#888] hover:text-white rounded text-[9px] font-bold uppercase transition-all flex items-center gap-2 border border-white/5"
            >
              <FileCode size={12} /> .cpp
            </button>
          </div>

          <button 
            onClick={downloadZip}
            className="px-8 py-3 bg-oled hover:bg-[#00e039] text-black rounded-lg text-[11px] font-black uppercase transition-all shadow-[0_0_30px_rgba(0,255,65,0.25)] flex items-center gap-3 active:scale-95 group"
          >
            <Download size={16} className="group-hover:bounce" />
            Download All (.ZIP)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
