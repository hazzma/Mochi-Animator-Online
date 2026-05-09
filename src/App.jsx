import React, { useState } from 'react';
import useProjectStore from './store/projectStore';
import PixelCanvas from './components/canvas/PixelCanvas';
import CanvasToolbar from './components/canvas/CanvasToolbar';
import LayerPanel from './components/layers/LayerPanel';
import Timeline from './components/timeline/Timeline';
import PreviewPanel from './components/preview/PreviewPanel';
import ExportModal from './components/export/ExportModal';
import Home from './components/home/Home';
import { Home as HomeIcon } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MiniPreview from './components/canvas/MiniPreview';

function App() {
  const { project, screen, setScreen, undo, redo, setEditor, tickFrame } = useProjectStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Animation Heartbeat
  React.useEffect(() => {
    let interval;
    if (project.editor.isPlaying) {
      interval = setInterval(() => {
        tickFrame();
      }, 1000 / project.meta.fps);
    }
    return () => clearInterval(interval);
  }, [project.editor.isPlaying, project.meta.fps, tickFrame]);

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Undo/Redo
      if (ctrl && e.key === 'z') {
        if (shift) redo();
        else undo();
        e.preventDefault();
      } else if (ctrl && e.key === 'y') {
        redo();
        e.preventDefault();
      }

      // Zoom Shortcuts (Ctrl + Arrow Up/Down)
      if (ctrl && e.key === 'ArrowUp') {
        setEditor({ zoom: Math.min(project.editor.zoom + 0.5, 32) });
        e.preventDefault();
      } else if (ctrl && e.key === 'ArrowDown') {
        setEditor({ zoom: Math.max(project.editor.zoom - 0.5, 1) });
        e.preventDefault();
      }

      // Move Tool (Ctrl + S as requested, plus V)
      if (e.key.toLowerCase() === 'v' || (ctrl && e.key.toLowerCase() === 's')) {
        setEditor({ activeTool: 'move' });
        if (ctrl && e.key === 's') e.preventDefault();
      }

      // Other Tools
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'p': case 'b': setEditor({ activeTool: 'pencil' }); break;
          case 'e': setEditor({ activeTool: 'eraser' }); break;
          case 'f': setEditor({ activeTool: 'fill' }); break;
          case 'r': setEditor({ activeTool: 'rect' }); break;
          case 'o': setEditor({ activeTool: 'roundedRect' }); break;
          case 'c': setEditor({ activeTool: 'ellipse' }); break;
          default: break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [undo, redo, setEditor, project.editor.zoom]);

  if (screen === 'home') {
    return <Home />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] text-[#e0e0e0] font-sans overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen('home')}
            className="w-8 h-8 bg-[#222] hover:bg-[#333] rounded flex items-center justify-center border border-[#333] transition-colors group"
          >
            <HomeIcon size={14} className="text-[#666] group-hover:text-oled transition-colors" />
          </button>
          <div className="w-[1px] h-4 bg-[#333] mx-1"></div>
          <h1 className="font-semibold tracking-tight text-sm uppercase">
            Mochi <span className="text-oled">Animator</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
            Project: <span className="text-oled ml-1">{project.meta.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPreview(true)}
              className="px-4 py-1.5 bg-[#333] hover:bg-[#444] text-[#aaa] hover:text-white rounded text-[10px] font-bold uppercase transition-all"
            >
              Preview
            </button>
            <button 
              onClick={() => setShowExport(true)}
              className="px-4 py-1.5 bg-oled/10 hover:bg-oled/20 text-oled border border-oled/40 rounded text-[10px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,255,65,0.05)]"
            >
              Export .h
            </button>
          </div>
        </div>
      </header>
      
      {/* Resizable Editor UI */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal">
          
          {/* Main Area (Canvas + Timeline) */}
          <Panel defaultSize={80} minSize={30}>
            <PanelGroup direction="vertical">
              
              {/* Canvas Panel */}
              <Panel defaultSize={70} minSize={20}>
                <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0a] relative">
                  <CanvasToolbar />
                  <div className="flex-1 overflow-auto flex items-center justify-center p-12 custom-scrollbar">
                    <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                      <PixelCanvas />
                    </div>
                  </div>
                  <MiniPreview />
                </div>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-[#222] hover:bg-oled/50 transition-colors cursor-row-resize" />
              
              {/* Timeline Panel */}
              <Panel defaultSize={30} minSize={10}>
                <div className="h-full bg-[#111] overflow-hidden">
                  <Timeline />
                </div>
              </Panel>
              
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#222] hover:bg-oled/50 transition-colors cursor-col-resize" />

          {/* Right Sidebar (Layers) */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full border-l border-[#333] bg-[#1a1a1a]">
              <LayerPanel />
            </div>
          </Panel>
          
        </PanelGroup>
      </div>

      {showPreview && <PreviewPanel onClose={() => setShowPreview(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

export default App;
