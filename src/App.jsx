import { useEffect, useState } from 'react';
import useProjectStore from './store/projectStore';
import PixelCanvas from './components/canvas/PixelCanvas';
import CanvasToolbar from './components/canvas/CanvasToolbar';
import LayerPanel from './components/layers/LayerPanel';
import Timeline from './components/timeline/Timeline';
import PreviewPanel from './components/preview/PreviewPanel';
import ExportModal from './components/export/ExportModal';
import AssetLibrary from './components/library/AssetLibrary';
import { Download, Sparkles } from 'lucide-react';
import Home from './components/home/Home';
import { Menu, X as CloseIcon } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MiniPreview from './components/canvas/MiniPreview';
import ComponentSettings from './components/designer/ComponentSettings';

function App() {
  const { project, screen, setScreen, undo, redo, setEditor, tickFrame, removeUISprite } = useProjectStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const downloadProjectJson = () => {
    const safeName = (project.meta.name || 'mochi_project').replace(/[^a-z0-9-_]+/gi, '_');
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.mochi.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Animation Heartbeat
  useEffect(() => {
    let interval;
    if (project.editor.isPlaying) {
      interval = setInterval(() => {
        tickFrame();
      }, 1000 / project.meta.fps);
    }
    return () => clearInterval(interval);
  }, [project.editor.isPlaying, project.meta.fps, tickFrame]);

  // Keyboard Shortcuts
  useEffect(() => {
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

      // Delete Shortcut
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedSprite = project.sprites.find(s => s.id === project.editor.selectedSpriteId);
        if (project.editor.selectedCompId && !selectedSprite?.locked) {
          removeUISprite(project.editor.selectedSpriteId);
          setEditor({ selectedCompId: null, selectedSpriteId: null });
          e.preventDefault();
        }
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
  }, [
    undo,
    redo,
    setEditor,
    project.editor.zoom,
    project.editor.selectedCompId,
    project.editor.selectedSpriteId,
    project.sprites,
    removeUISprite
  ]);

  if (screen === 'home') {
    return <Home />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] text-[#e0e0e0] font-sans overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowMenu(true)}
            className="w-8 h-8 hover:bg-[#222] rounded flex items-center justify-center transition-colors text-[#666] hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="w-[1px] h-4 bg-[#333] mx-1"></div>
          <button 
            onClick={() => setScreen('home')}
            className="w-12 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-[#333] transition-colors group overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <img src="pcb_logo.png" alt="Hazzma Logo" className="w-full h-full object-contain p-0 scale-125 transition-transform group-hover:scale-[1.35]" />
          </button>
          <h1 className="font-semibold tracking-tight text-sm uppercase hidden md:block">
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
              onClick={downloadProjectJson}
              className="px-4 py-1.5 bg-[#333] hover:bg-[#444] text-[#aaa] hover:text-white rounded text-[10px] font-bold uppercase transition-all flex items-center gap-2"
            >
              <Download size={12} />
              Save JSON
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
              
              {/* Timeline Panel - Hide in Designer Mode */}
              {project.editor.currentMode !== 'designer' && (
                <>
                  <PanelResizeHandle className="h-1 bg-[#222] hover:bg-oled/50 transition-colors cursor-row-resize" />
                  <Panel defaultSize={30} minSize={10}>
                    <div className="h-full bg-[#111] overflow-hidden">
                      <Timeline />
                    </div>
                  </Panel>
                </>
              )}
              
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#222] hover:bg-oled/50 transition-colors cursor-col-resize" />

          {/* Right Sidebar (Layers or Component Settings) */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full border-l border-[#333] bg-[#1a1a1a]">
              {project.editor.currentMode === 'designer' ? (
                <ComponentSettings />
              ) : (
                <LayerPanel />
              )}
            </div>
          </Panel>
          
        </PanelGroup>
      </div>

      {showPreview && <PreviewPanel onClose={() => setShowPreview(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showLibrary && <AssetLibrary onClose={() => setShowLibrary(false)} />}

      {/* Side Navigation Menu (Hamburger) */}
      {showMenu && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[100]" onClick={() => setShowMenu(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#1a1a1a]/95 border-r border-[#333] z-[101] shadow-[10px_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#222]">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">Navigation Menu</span>
              <button onClick={() => setShowMenu(false)} className="text-[#666] hover:text-white">
                <CloseIcon size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-[9px] font-bold text-oled uppercase tracking-[0.2em] mb-4">Core Modes</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => { setEditor({ currentMode: 'animator' }); setShowMenu(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 group ${
                      project.editor.currentMode === 'animator' 
                        ? 'bg-oled/10 border-oled/30 text-oled' 
                        : 'hover:bg-[#222] border-transparent text-[#888]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                      project.editor.currentMode === 'animator' ? 'bg-oled/20' : 'bg-[#333]'
                    }`}>🎨</div>
                    <div>
                      <div className="text-[11px] font-bold">Pixel Animator</div>
                      <div className="text-[9px] opacity-60">Classic frame-by-frame & tweening</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => { setEditor({ currentMode: 'designer' }); setShowMenu(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 group ${
                      project.editor.currentMode === 'designer' 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                        : 'hover:bg-[#222] border-transparent text-[#888]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                      project.editor.currentMode === 'designer' ? 'bg-blue-500/20' : 'bg-[#333]'
                    }`}>⚙️</div>
                    <div>
                      <div className="text-[11px] font-bold">UI Designer (Lopaka)</div>
                      <div className="text-[9px] opacity-60">Drag & drop watch components</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-bold text-oled uppercase tracking-[0.2em] mb-4">Content Library</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => { downloadProjectJson(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-[#222] text-[#888] hover:text-white transition-all text-[11px] flex items-center gap-3 group"
                  >
                    <Download size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    Save Project JSON
                  </button>
                  <button 
                    onClick={() => { setShowLibrary(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-[#222] text-[#888] hover:text-white transition-all text-[11px] flex items-center gap-3 group"
                  >
                    <Sparkles size={14} className="text-oled group-hover:scale-110 transition-transform" />
                    Animation Library
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto p-6 border-t border-[#333] bg-[#111]">
              <div className="text-[9px] text-[#444] font-bold uppercase mb-2">Developed By</div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-oled/20 border border-oled/30 flex items-center justify-center text-oled font-black">H</div>
                <div>
                  <div className="text-[11px] font-bold text-[#eee]">Hazzma</div>
                  <div className="text-[9px] text-[#555]">v1.1.0-alpha</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
