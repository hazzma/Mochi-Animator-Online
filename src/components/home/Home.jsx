import React, { useState } from 'react';
import { Plus, Upload, Clock, Box, Trash2, ArrowRight } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
// import logoUrl from '../../assets/PCB LOGO.png';
const logoUrl = "logo.svg";

const Home = () => {
  const { loadProject, project: currentProject } = useProjectStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (!name) return;
    
    const newProject = {
      meta: {
        name,
        fps: 12,
        totalFrames: 24,
        canvasW: 128,
        canvasH: 64,
      },
      sprites: [
        {
          id: "sprite_001",
          name: "Main Layer",
          visible: true,
          locked: false,
          width: 128,
          height: 64,
          pixels: new Array(128 * 64).fill(false),
        }
      ],
      keyframes: {
        "sprite_001": {
          0: { x: 0, y: 0, visible: true },
        }
      },
      editor: {
        selectedSpriteId: "sprite_001",
        currentFrame: 0,
        activeTool: "pencil", 
        zoom: 4,
        isPlaying: false,
        showGrid: true,
        radius: 4,
      }
    };
    
    loadProject(newProject);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        loadProject(json);
      } catch (err) {
        alert("Invalid project file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-8 relative overflow-y-auto">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-oled/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Container - Added margin top/bottom for better spacing when scrollable */}
      <div className="max-w-4xl w-full z-10 flex flex-col items-center py-12">
        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative group">
             <div className="absolute inset-0 bg-oled/10 blur-3xl group-hover:bg-oled/20 transition-all duration-500 rounded-full"></div>
             <img 
               src="pcb_logo.png" 
               alt="Logo" 
               className="w-64 h-64 relative object-contain drop-shadow-[0_0_30px_rgba(0,255,65,0.3)] animate-in zoom-in duration-1000 scale-150" 
             />
          </div>
          <h1 className="mt-10 text-4xl font-black tracking-tighter uppercase italic">
            Mochi <span className="text-oled">Animator</span>
          </h1>
          <p className="text-[#666] mt-2 text-sm font-medium tracking-widest uppercase">Pixel Art Editor for OLED Screens</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
          
          {/* New Project Card */}
          <div 
            onClick={() => setShowNewForm(true)}
            className="group relative bg-[#121212] border border-[#333] hover:border-oled/50 p-8 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-oled/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-oled/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-oled" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Create New</h3>
              <p className="text-[#666] text-xs leading-relaxed">Start a fresh animation from scratch for your OLED display.</p>
            </div>
          </div>

          {/* Import Project Card */}
          <label className="group relative bg-[#121212] border border-[#333] hover:border-blue-500/50 p-8 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl">
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Import Project</h3>
              <p className="text-[#666] text-xs leading-relaxed">Load an existing project file from your computer.</p>
            </div>
          </label>
        </div>

        {/* Recent Project / Continue */}
        {currentProject && (
          <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
            <button 
              onClick={() => loadProject(currentProject)}
              className="w-full bg-[#1a1a1a] border border-[#333] hover:border-[#444] p-4 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center">
                  <Clock size={18} className="text-[#888]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-[#666] uppercase font-bold">Continue Last Session</p>
                  <p className="text-sm font-bold text-[#eee]">{currentProject.meta.name}</p>
                </div>
              </div>
              <ArrowRight className="text-[#444] group-hover:text-oled transition-colors" size={20} />
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-20 text-[10px] text-[#444] uppercase font-bold tracking-[0.2em] flex items-center gap-4">
          <span>V1.0.4 Stable</span>
          <span className="w-1 h-1 bg-[#333] rounded-full"></span>
          <span>Engine: React 19</span>
          <span className="w-1 h-1 bg-[#333] rounded-full"></span>
          <span>Target: OLED 128x64</span>
        </div>
      </div>

      {/* New Project Modal Overlay */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <form onSubmit={handleCreateNew} className="bg-[#121212] border border-[#333] p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Box size={20} className="text-oled" />
              New Project
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#555] uppercase font-bold block mb-1">Project Name</label>
                <input 
                  autoFocus
                  className="w-full bg-[#0a0a0a] border border-[#333] focus:border-oled/50 rounded-lg px-4 py-3 text-sm outline-none transition-all"
                  placeholder="e.g. Happy Eyes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 opacity-50">
                <div>
                  <label className="text-[10px] text-[#555] uppercase font-bold block mb-1">Width</label>
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs text-[#666]">128px</div>
                </div>
                <div>
                  <label className="text-[10px] text-[#555] uppercase font-bold block mb-1">Height</label>
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs text-[#666]">64px</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setShowNewForm(false)}
                className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-3 bg-oled text-black rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:scale-[1.02] transition-all"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Home;
