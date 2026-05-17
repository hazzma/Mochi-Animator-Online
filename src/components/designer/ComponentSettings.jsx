import useProjectStore from '../../store/projectStore';
import { Trash2, Type, Clock, Activity } from 'lucide-react';

const ComponentSettings = () => {
  const { project, updateComponent, removeUISprite } = useProjectStore();
  const { selectedSpriteId, selectedCompId } = project.editor;
  
  const sprite = project.sprites.find(s => s.id === selectedSpriteId);
  const component = sprite?.uiComponents?.find(c => c.id === selectedCompId);
  const isLocked = sprite?.locked;

  if (!component) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 p-6">
        <div className="text-4xl mb-4">🖱️</div>
        <p className="text-[10px] uppercase font-bold tracking-widest leading-tight">
          Select a component on the canvas to edit its properties
        </p>
      </div>
    );
  }

  const handleUpdate = (data) => {
    if (isLocked) return;
    updateComponent(selectedSpriteId, selectedCompId, data, true);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#222]">
        <div className="flex items-center gap-2">
          {component.type === 'ui-clock' && <Clock size={14} className="text-blue-400" />}
          {component.type === 'ui-label' && <Type size={14} className="text-blue-400" />}
          {component.type === 'ui-bar' && <Activity size={14} className="text-blue-400" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{component.type.replace('ui-', '')}</span>
        </div>
        <button 
          onClick={() => {
            removeUISprite(selectedSpriteId);
          }}
          disabled={isLocked}
          className={`p-1.5 rounded transition-colors ${isLocked ? 'text-[#333] cursor-not-allowed' : 'hover:bg-red-500/20 text-[#666] hover:text-red-500'}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Transform Group */}
        <div>
          <h4 className="text-[9px] font-bold text-[#555] uppercase tracking-widest mb-3">Transform</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">X Position</label>
              <input 
                type="number"
                value={Math.round(component.x)}
                disabled={isLocked}
                onChange={(e) => handleUpdate({ x: parseInt(e.target.value) || 0 })}
                className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Y Position</label>
              <input 
                type="number"
                value={Math.round(component.y)}
                disabled={isLocked}
                onChange={(e) => handleUpdate({ y: parseInt(e.target.value) || 0 })}
                className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Width</label>
              <input 
                type="number"
                value={Math.round(component.w)}
                disabled={isLocked}
                onChange={(e) => handleUpdate({ w: parseInt(e.target.value) || 1 })}
                className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Height</label>
              <input 
                type="number"
                value={Math.round(component.h)}
                disabled={isLocked}
                onChange={(e) => handleUpdate({ h: parseInt(e.target.value) || 1 })}
                className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Content Group */}
        <div>
          <h4 className="text-[9px] font-bold text-[#555] uppercase tracking-widest mb-3">Settings</h4>
          <div className="space-y-4">
            {component.type === 'ui-label' && (
              <div>
                <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Text Content</label>
                <input 
                  type="text"
                  value={component.props.text}
                  disabled={isLocked}
                  onChange={(e) => handleUpdate({ props: { ...component.props, text: e.target.value } })}
                  className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50"
                />
              </div>
            )}

            {component.type === 'ui-clock' && (
              <div>
                <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Time Format</label>
                <select 
                  value={component.props.format}
                  disabled={isLocked}
                  onChange={(e) => handleUpdate({ props: { ...component.props, format: e.target.value } })}
                  className="w-full bg-black border border-[#333] rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="HH:mm">HH:mm (24h)</option>
                  <option value="hh:mm">hh:mm (12h)</option>
                  <option value="HH:mm:ss">HH:mm:ss</option>
                </select>
              </div>
            )}

            {component.type === 'ui-bar' && (
              <div>
                <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Value ({component.props.value}%)</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={component.props.value}
                  disabled={isLocked}
                  onChange={(e) => handleUpdate({ props: { ...component.props, value: parseInt(e.target.value) } })}
                  className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
            
            {component.type === 'ui-icon' && (
              <div>
                <label className="text-[8px] text-[#444] uppercase font-bold block mb-1">Icon Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {['battery', 'heart', 'wifi', 'bluetooth'].map(icon => (
                    <button 
                      key={icon}
                      onClick={() => handleUpdate({ props: { ...component.props, icon } })}
                      disabled={isLocked}
                      className={`p-2 rounded border transition-all text-center ${
                        component.props.icon === icon ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black border-[#333] text-[#555] hover:text-white'
                      }`}
                    >
                      <span className="text-[10px]">★</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentSettings;
