import { useState } from 'react';
import useProjectStore from '../../store/projectStore';
import { 
  Pencil, Eraser, PaintBucket, Square, Circle,
  MousePointer2, Undo2, Redo2, Layers,
  Grid3X3, HelpCircle, X,
  Clock, Type, Activity, BarChart3, Image as ImageIcon,
  Magnet, RotateCw
} from 'lucide-react';

const CanvasToolbar = () => {
  const { project, setEditor, undo, redo, addComponent, rotateSprite } = useProjectStore();
    const { activeTool, radius, zoom, onionSkin, showGrid, brushSize, brushShape, currentMode, selectedSpriteId, snappingEnabled } = project.editor;
  const [showHelp, setShowHelp] = useState(false);

  const tools = [
    { id: 'move', icon: MousePointer2, label: 'Move Tool', desc: 'Select and move layers. Creating multiple points on the timeline will automatically animate the motion.', shortcut: 'V or Ctrl+S' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate', desc: 'Rotate 90° clockwise.', shortcut: 'Shift+R' },
    { id: 'pencil', icon: Pencil, label: 'Pencil', desc: 'Draw pixels. Shared across all frames in this layer.', shortcut: 'P or B' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', desc: 'Remove pixels.', shortcut: 'E' },
    { id: 'fill', icon: PaintBucket, label: 'Fill', desc: 'Flood fill area with pixels.', shortcut: 'F' },
    { id: 'rect', icon: Square, label: 'Rectangle', desc: 'Draw hollow rectangles.', shortcut: 'R' },
    { id: 'roundedRect', icon: Square, label: 'Rounded Rect', desc: 'Draw rectangles with adjustable corner radius.', shortcut: 'O', sub: true },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', desc: 'Draw hollow circles and ovals.', shortcut: 'C' },
  ];

  const designerTools = [
    { id: 'move', icon: MousePointer2, label: 'Select Tool', desc: 'Select and move UI components.', shortcut: 'V' },
    { id: 'ui-clock', icon: Clock, label: 'Clock', desc: 'Add a digital/analog clock component.', shortcut: 'T' },
    { id: 'ui-label', icon: Type, label: 'Text Label', desc: 'Add a static or dynamic text label.', shortcut: 'L' },
    { id: 'ui-bar', icon: Activity, label: 'Progress Bar', desc: 'Add a battery, RAM, or health bar.', shortcut: 'B' },
    { id: 'ui-graph', icon: BarChart3, label: 'Graph', desc: 'Add a real-time line/bar graph.', shortcut: 'G' },
    { id: 'ui-icon', icon: ImageIcon, label: 'Asset Icon', desc: 'Add a pre-defined icon from the library.', shortcut: 'I' },
  ];

  return (
    <div className="h-12 border-b border-[#333] bg-[#1a1a1a] flex items-center px-4 justify-between shrink-0 z-30 relative">
      <div className="flex items-center gap-1">
        {/* Undo/Redo Group */}
        <div className="flex items-center gap-1 mr-4 border-r border-[#333] pr-4">
          <button 
            onClick={undo}
            className="p-1.5 rounded hover:bg-[#222] text-[#666] hover:text-white transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={redo}
            className="p-1.5 rounded hover:bg-[#222] text-[#666] hover:text-white transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Tools Group */}
        <div className="flex items-center gap-1">
          {(currentMode === 'designer' ? designerTools : tools).map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'rotate') {
                  rotateSprite(selectedSpriteId);
                  return;
                }
                if (currentMode === 'designer' && tool.id.startsWith('ui-')) {
                  addComponent(tool.id);
                } else {
                  setEditor({ activeTool: tool.id });
                }
              }}
              className={`p-2 rounded flex items-center justify-center transition-all group relative ${
                activeTool === tool.id 
                  ? (currentMode === 'designer' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-oled/20 text-oled border border-oled/30')
                  : 'text-[#666] hover:bg-[#222] hover:text-[#999]'
              }`}
            >
              <tool.icon size={18} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
              {tool.sub && <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-[#444] rounded-full" />}
              
              {/* Tooltip Overlay */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#333] font-bold uppercase tracking-wider">
                {tool.label} <span className={currentMode === 'designer' ? 'text-blue-400 ml-1' : 'text-oled ml-1'}>[{tool.shortcut}]</span>
              </div>
            </button>
          ))}
        </div>

        {/* Visibility Toggles */}
        <div className="ml-4 pl-4 border-l border-[#333] flex items-center gap-1">
          <button
            onClick={() => setEditor({ onionSkin: !onionSkin })}
            className={`p-2 rounded flex items-center justify-center transition-all group relative ${
              onionSkin 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-[#666] hover:bg-[#222] hover:text-[#999]'
            }`}
          >
            <Layers size={18} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#333] font-bold uppercase tracking-wider">
              Onion Skin (Ghosting)
            </div>
          </button>
          <button
            onClick={() => setEditor({ showGrid: !showGrid })}
            className={`p-2 rounded flex items-center justify-center transition-all group relative ${
              showGrid 
                ? 'bg-oled/20 text-oled border border-oled/30' 
                : 'text-[#666] hover:bg-[#222] hover:text-[#999]'
            }`}
          >
            <Grid3X3 size={18} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#333] font-bold uppercase tracking-wider">
              Toggle Grid
            </div>
          </button>
          <button
            onClick={() => setEditor({ snappingEnabled: !snappingEnabled })}
            className={`p-2 rounded flex items-center justify-center transition-all group relative ${
              snappingEnabled 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'text-[#666] hover:bg-[#222] hover:text-[#999]'
            }`}
          >
            <Magnet size={18} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#333] font-bold uppercase tracking-wider">
              Smart Snapping (Canva-style)
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {activeTool === 'roundedRect' && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
            <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">Radius</span>
            <input 
              type="range" 
              min="0" max="24" 
              value={radius}
              onChange={(e) => setEditor({ radius: Number(e.target.value) })}
              className="w-24 accent-oled bg-[#333] h-1 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-oled font-mono w-4 text-center">{radius}</span>
          </div>
        )}
        
        {/* Brush Settings (Pencil/Eraser) */}
        {(activeTool === 'pencil' || activeTool === 'eraser') && (
          <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">Size</span>
              <input 
                type="range" 
                min="1" max="16" 
                value={brushSize}
                onChange={(e) => setEditor({ brushSize: Number(e.target.value) })}
                className="w-20 accent-oled bg-[#333] h-1 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-oled font-mono w-4 text-center">{brushSize}</span>
            </div>
            <div className="flex items-center bg-[#222] rounded border border-[#333] overflow-hidden">
              <button
                onClick={() => setEditor({ brushShape: 'square' })}
                className={`p-1.5 transition-all ${brushShape === 'square' ? 'bg-oled text-black' : 'text-[#666] hover:text-white'}`}
                title="Square Brush"
              >
                <Square size={12} fill={brushShape === 'square' ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setEditor({ brushShape: 'circle' })}
                className={`p-1.5 transition-all ${brushShape === 'circle' ? 'bg-oled text-black' : 'text-[#666] hover:text-white'}`}
                title="Circle Brush"
              >
                <Circle size={12} fill={brushShape === 'circle' ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        )}

        {/* Zoom Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">Zoom</span>
            <input 
              type="range" 
              min="1" max="32" step="0.5"
              value={zoom}
              onChange={(e) => setEditor({ zoom: Number(e.target.value) })}
              className="w-24 accent-oled bg-[#333] h-1 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-oled font-mono w-8 text-right">{zoom}x</span>
          </div>

          <button 
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#555] hover:text-oled hover:border-oled/50 transition-all"
            title="Help & Shortcuts"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-12 bg-[#222] px-6 flex items-center justify-between border-b border-[#333]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#888]">Mochi Animator Guide</span>
              <button onClick={() => setShowHelp(false)} className="text-[#555] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section>
                <h3 className="text-oled text-xs font-bold uppercase mb-4 tracking-widest">Core Tools</h3>
                <div className="space-y-4">
                  {tools.map(t => (
                    <div key={t.id} className="flex gap-4">
                      <div className="w-8 h-8 shrink-0 bg-[#222] rounded-lg flex items-center justify-center text-white">
                        <t.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#eee]">{t.label} <span className="text-oled/50 ml-1">[{t.shortcut}]</span></p>
                        <p className="text-[10px] text-[#666] leading-relaxed">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="space-y-8">
                <div>
                  <h3 className="text-blue-400 text-xs font-bold uppercase mb-4 tracking-widest">Animation (Keypoints)</h3>
                  <div className="bg-[#0a0a0a] border border-blue-500/20 p-4 rounded-xl">
                    <p className="text-[10px] text-[#aaa] leading-relaxed mb-3">
                      To create motion like <strong>KineMaster</strong>:
                    </p>
                    <ol className="text-[10px] text-[#888] space-y-2 list-decimal list-inside">
                      <li>Select a layer (sprite).</li>
                      <li>Move the layer to create the 1st <strong>Keypoint</strong>.</li>
                      <li>Go to another frame and move it again for the 2nd point.</li>
                      <li><strong>To Delete:</strong> Click the diamond dot on the timeline or use the "Delete Keypoint" button.</li>
                    </ol>
                  </div>
                </div>
                <div>
                  <h3 className="text-purple-400 text-xs font-bold uppercase mb-4 tracking-widest">Smart Guides (Magnet)</h3>
                  <div className="bg-[#0a0a0a] border border-purple-500/20 p-4 rounded-xl">
                    <p className="text-[10px] text-[#aaa] leading-relaxed mb-3">
                      Align objects perfectly like in <strong>Canva</strong>:
                    </p>
                    <ul className="text-[10px] text-[#888] space-y-2 list-disc list-inside">
                      <li>Toggle the <strong>Magnet</strong> icon to enable/disable.</li>
                      <li>Magenta lines appear when centered or aligned with other objects.</li>
                      <li>Resizing will "snap" to match the size of other objects.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
            <div className="p-4 bg-[#111] border-t border-[#333] text-center">
              <button 
                onClick={() => setShowHelp(false)}
                className="px-8 py-2 bg-oled text-black text-[11px] font-black uppercase rounded-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]"
              >
                Let's Draw!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasToolbar;
