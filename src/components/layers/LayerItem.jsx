import { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Copy, Trash2, Lock, Unlock } from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const LayerItem = ({ sprite, isSelected, onSelect, onToggleVisibility, onToggleLock, onDelete, onRename }) => {
  const canvasRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(sprite.name);
  const { duplicateSprite } = useProjectStore();

  // Render thumbnail... (omitted for brevity, assume unchanged)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    const scale = Math.min(32 / sprite.width, 16 / sprite.height, 1);
    const offsetX = (32 - sprite.width * scale) / 2;
    const offsetY = (16 - sprite.height * scale) / 2;

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        if (sprite.pixels[y * sprite.width + x]) {
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
  }, [sprite]);

  const handleRename = () => {
    if (name === sprite.name) {
      setIsEditing(false);
      return;
    }
    const result = onRename(sprite.id, name);
    if (result?.error) {
      alert(result.error);
      setName(sprite.name);
    }
    setIsEditing(false);
  };

  return (
    <div 
      onClick={() => onSelect(sprite.id)}
      className={`group flex items-center px-3 py-2 gap-3 cursor-pointer border-b border-[#222] transition-all ${
        isSelected ? 'bg-oled/10 border-oled/30 shadow-[inset_2px_0_0_#00FF41]' : 'hover:bg-[#222]'
      }`}
    >
      {/* Thumbnail */}
      <canvas 
        ref={canvasRef} 
        width={32} 
        height={16} 
        className="bg-black border border-[#444] rounded-sm shrink-0"
      />

      {/* Name / Editor */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <input
            autoFocus
            className="w-full bg-[#333] text-xs px-1 border border-oled/50 outline-none rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)}
            className={`text-[11px] truncate ${isSelected ? 'text-oled font-bold' : 'text-[#aaa]'}`}
          >
            {sprite.name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(sprite.id); }}
          className={`p-1 rounded hover:bg-[#333] transition-colors ${sprite.visible ? 'text-oled/60' : 'text-[#444]'}`}
          title={sprite.visible ? 'Hide' : 'Show'}
        >
          {sprite.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock(sprite.id); }}
          className={`p-1 rounded hover:bg-[#333] transition-colors ${sprite.locked ? 'text-yellow-400' : 'text-[#555] hover:text-[#aaa]'}`}
          title={sprite.locked ? 'Unlock Layer' : 'Lock Layer'}
        >
          {sprite.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); duplicateSprite(sprite.id); }}
          className="p-1 rounded hover:bg-[#333] text-[#555] hover:text-blue-400 transition-colors"
          title="Duplicate"
        >
          <Copy size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(sprite.id); }}
          disabled={sprite.locked}
          className={`p-1 rounded hover:bg-[#333] transition-colors ${sprite.locked ? 'text-[#333] cursor-not-allowed' : 'text-[#555] hover:text-red-500'}`}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default LayerItem;
