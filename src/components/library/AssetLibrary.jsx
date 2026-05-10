import React from 'react';
import { X, Plus, Sparkles, Smile, Eye, Heart } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import { DEFAULT_ASSETS } from '../../data/defaultAssets';

const AssetLibrary = ({ onClose }) => {
  const { addAssetSprite } = useProjectStore();

  const handleAddAsset = (asset) => {
    addAssetSprite(asset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-oled/20 rounded-lg flex items-center justify-center">
              <Sparkles className="text-oled" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Asset Library</h2>
              <p className="text-[10px] text-[#666] font-bold uppercase tracking-tight">Premade Face Expressions & Shapes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#666] hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 custom-scrollbar">
          {DEFAULT_ASSETS.map((asset) => (
            <div 
              key={asset.id}
              onClick={() => handleAddAsset(asset)}
              className="group bg-[#222] border border-[#333] rounded-lg p-4 cursor-pointer hover:border-oled/50 hover:bg-[#282828] transition-all flex flex-col items-center gap-4"
            >
              <div className="w-full aspect-video bg-black rounded border border-[#444] flex items-center justify-center overflow-hidden relative">
                 {/* Mini Canvas Preview (Simulated) */}
                 <div className="grid grid-cols-8 gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    {asset.id === 'smile-mouth' && <Smile className="text-oled" size={32} />}
                    {asset.id.includes('eye') && <Eye className="text-oled" size={32} />}
                    {asset.id === 'heart-eyes' && <Heart className="text-oled" size={32} />}
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-oled text-black text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                      <Plus size={10} /> ADD
                    </div>
                 </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">{asset.name}</div>
                <div className="text-[9px] text-[#666] font-mono mt-1">{asset.width}x{asset.height} px</div>
              </div>
            </div>
          ))}
          
          {/* Placeholder for more */}
          <div className="border border-dashed border-[#333] rounded-lg p-4 flex flex-col items-center justify-center gap-2 opacity-30 grayscale cursor-not-allowed">
             <Plus size={24} />
             <span className="text-[9px] font-bold uppercase tracking-widest">More Soon</span>
          </div>
        </div>

        <div className="p-4 bg-[#111] border-t border-[#333] flex justify-center">
           <p className="text-[9px] text-[#555] font-bold uppercase tracking-[0.2em]">Community Assets Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default AssetLibrary;
