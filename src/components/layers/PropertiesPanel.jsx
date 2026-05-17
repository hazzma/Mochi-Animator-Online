import useProjectStore from '../../store/projectStore';
import { Settings2, Maximize2, Move, RotateCw } from 'lucide-react';
import { getInterpolatedPosition } from '../../utils/tweenUtils';

const PropertiesPanel = () => {
  const { project, setKeyframe, recordHistory, setSpriteRotation } = useProjectStore();
  const { sprites, keyframes, editor } = project;
  const { selectedSpriteId, currentFrame } = editor;

  const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
  const currentPos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);

  if (!selectedSprite) return null;

  const rotation = selectedSprite.rotation ?? 0;
  const isLocked = selectedSprite.locked;

  const handleUpdateKeyframe = (key, value) => {
    if (isLocked) return;
    recordHistory();
    setKeyframe(selectedSpriteId, currentFrame, { [key]: Number(value) });
  };

  const handleUpdateSize = (key, value) => {
    if (isLocked) return;
    recordHistory();
    const newW = key === 'width' ? Number(value) : selectedSprite.width;
    const newH = key === 'height' ? Number(value) : selectedSprite.height;
    
    const newPixels = new Array(newW * newH).fill(false);
    for (let y = 0; y < Math.min(newH, selectedSprite.height); y++) {
      for (let x = 0; x < Math.min(newW, selectedSprite.width); x++) {
        newPixels[y * newW + x] = selectedSprite.pixels[y * selectedSprite.width + x];
      }
    }

    useProjectStore.setState((state) => ({
      project: {
        ...state.project,
        sprites: state.project.sprites.map(s => 
          s.id === selectedSpriteId ? { ...s, width: newW, height: newH, pixels: newPixels } : s
        )
      }
    }));
  };

  const handleRotation = (val) => {
    if (isLocked) return;
    const deg = ((Number(val) % 360) + 360) % 360;
    setSpriteRotation(selectedSpriteId, deg, true);
  };

  return (
    <div className="border-t border-[#333] bg-[#1a1a1a] p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={12} className="text-oled" />
        <span className="text-[10px] text-oled uppercase font-bold tracking-wider">Properties</span>
        {isLocked && <span className="ml-auto text-[9px] text-yellow-400 font-bold uppercase">Locked</span>}
      </div>

      {/* Position */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Move size={10} className="text-[#555]" />
          <span className="text-[9px] text-[#555] uppercase font-bold">Position</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-[#121212] border border-[#333] rounded px-2 py-1">
            <span className="text-[9px] text-[#444] font-bold">X</span>
            <input 
              type="number"
              className="bg-transparent text-xs text-white w-full outline-none"
              value={currentPos.x}
              disabled={isLocked}
              onChange={(e) => handleUpdateKeyframe('x', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#121212] border border-[#333] rounded px-2 py-1">
            <span className="text-[9px] text-[#444] font-bold">Y</span>
            <input 
              type="number"
              className="bg-transparent text-xs text-white w-full outline-none"
              value={currentPos.y}
              disabled={isLocked}
              onChange={(e) => handleUpdateKeyframe('y', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Maximize2 size={10} className="text-[#555]" />
          <span className="text-[9px] text-[#555] uppercase font-bold">Size (Pixels)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-[#121212] border border-[#333] rounded px-2 py-1">
            <span className="text-[9px] text-[#444] font-bold">W</span>
            <input 
              type="number"
              min="1" max="128"
              className="bg-transparent text-xs text-white w-full outline-none"
              value={selectedSprite.width}
              disabled={isLocked}
              onChange={(e) => handleUpdateSize('width', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#121212] border border-[#333] rounded px-2 py-1">
            <span className="text-[9px] text-[#444] font-bold">H</span>
            <input 
              type="number"
              min="1" max="64"
              className="bg-transparent text-xs text-white w-full outline-none"
              value={selectedSprite.height}
              disabled={isLocked}
              onChange={(e) => handleUpdateSize('height', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <RotateCw size={10} className="text-[#555]" />
          <span className="text-[9px] text-[#555] uppercase font-bold">Rotation</span>
          <span className="ml-auto text-[9px] text-oled font-mono font-bold">{rotation}°</span>
        </div>
        <input
          type="range"
          min="0" max="359"
          value={rotation}
          disabled={isLocked}
          onChange={(e) => handleRotation(e.target.value)}
          className="w-full h-1 accent-oled rounded cursor-pointer"
        />
        <div className="grid grid-cols-4 gap-1">
          {[0, 90, 180, 270].map(deg => (
            <button
              key={deg}
              onClick={() => handleRotation(deg)}
              disabled={isLocked}
              className={`text-[9px] py-1 rounded border font-bold transition-all ${
                rotation === deg
                  ? 'bg-oled/20 text-oled border-oled/40'
                  : 'bg-[#222] text-[#555] border-[#333] hover:text-[#999]'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
