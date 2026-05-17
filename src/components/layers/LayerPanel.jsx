import { useState } from 'react';
import useProjectStore from '../../store/projectStore';
import LayerItem from './LayerItem';
import PropertiesPanel from './PropertiesPanel';

const LayerPanel = () => {
  const { 
    project, 
    setEditor, 
    addSprite, 
    deleteSprite, 
    renameSprite, 
    toggleSpriteVisibility,
    toggleSpriteLock
  } = useProjectStore();
  const { sprites, editor } = project;
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpriteName, setNewSpriteName] = useState('');
  const [newW, setNewW] = useState(128);
  const [newH, setNewH] = useState(64);

  const handleAddSprite = (e) => {
    e.preventDefault();
    if (!newSpriteName) return;
    addSprite(newSpriteName, Number(newW), Number(newH));
    setNewSpriteName('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="h-10 border-b border-[#333] flex items-center px-3 justify-between shrink-0 bg-[#222]">
        <span className="text-[10px] text-[#888] uppercase font-bold tracking-wider">Layers</span>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`text-lg leading-none transition-colors ${showAddForm ? 'text-oled' : 'text-[#666] hover:text-[#999]'}`}
        >
          {showAddForm ? '−' : '+'}
        </button>
      </div>

      {/* Add Sprite Form */}
      {showAddForm && (
        <form onSubmit={handleAddSprite} className="p-3 border-b border-[#333] bg-[#222] flex flex-col gap-2">
          <input
            autoFocus
            placeholder="Sprite Name"
            className="bg-[#121212] text-xs px-2 py-1 border border-[#444] rounded outline-none focus:border-oled/50"
            value={newSpriteName}
            onChange={(e) => setNewSpriteName(e.target.value)}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-[#666] block mb-0.5">WIDTH</label>
              <input 
                type="number" 
                min="1" max="128"
                className="w-full bg-[#121212] text-xs px-2 py-1 border border-[#444] rounded"
                value={newW}
                onChange={(e) => setNewW(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-[#666] block mb-0.5">HEIGHT</label>
              <input 
                type="number" 
                min="1" max="64"
                className="w-full bg-[#121212] text-xs px-2 py-1 border border-[#444] rounded"
                value={newH}
                onChange={(e) => setNewH(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-oled/10 hover:bg-oled/20 text-oled text-[10px] py-1.5 font-bold rounded border border-oled/30 transition-all"
          >
            CREATE SPRITE
          </button>
        </form>
      )}

      {/* Sprite List */}
      <div className="flex-1 overflow-y-auto">
        {sprites.length === 0 ? (
          <div className="p-8 text-center text-[#444] text-xs italic">
            No sprites yet.
          </div>
        ) : (
          [...sprites].reverse().map((sprite) => (
            <LayerItem
              key={sprite.id}
              sprite={sprite}
              isSelected={editor.selectedSpriteId === sprite.id}
              onSelect={(id) => setEditor({ selectedSpriteId: id })}
              onToggleVisibility={toggleSpriteVisibility}
              onToggleLock={toggleSpriteLock}
              onDelete={deleteSprite}
              onRename={renameSprite}
            />
          ))
        )}
      </div>

      {/* Properties Panel (NEW) */}
      <PropertiesPanel />
    </div>
  );
};

export default LayerPanel;
