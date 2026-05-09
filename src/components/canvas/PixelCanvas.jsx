import React, { useRef, useEffect, useState } from 'react';
import useProjectStore from '../../store/projectStore';
import { getInterpolatedPosition } from '../../utils/tweenUtils';
import { floodFill, drawRect, drawEllipse, drawRoundedRect } from '../../utils/canvasUtils';

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const { project, updateSpritePixels, setKeyframe, recordHistory } = useProjectStore();
  const { meta, sprites, keyframes, editor } = project;
  const { currentFrame, zoom, showGrid, activeTool, selectedSpriteId, radius } = editor;

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Helper to get selected sprite
  const selectedSprite = sprites.find(s => s.id === selectedSpriteId);

  // Keyboard listeners for Shift
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Shift') setIsShiftPressed(true); };
    const handleKeyUp = (e) => { if (e.key === 'Shift') setIsShiftPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Render Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Onion Skin (Previous and Next Frames)
    if (editor.onionSkin) {
      ctx.globalAlpha = 0.2;
      [currentFrame - 1, currentFrame + 1].forEach(frame => {
        if (frame < 0 || frame >= meta.totalFrames) return;
        
        sprites.forEach(sprite => {
          if (!sprite.visible) return;
          const pos = getInterpolatedPosition(keyframes[sprite.id], frame);
          if (!pos || !pos.visible) return;
          
          ctx.fillStyle = '#ffffff';
          for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
              if (sprite.pixels[y * sprite.width + x]) {
                ctx.fillRect((pos.x + x) * zoom, (pos.y + y) * zoom, zoom, zoom);
              }
            }
          }
        });
      });
      ctx.globalAlpha = 1.0;
    }

    // Render all visible sprites
    sprites.forEach(sprite => {
      if (!sprite.visible) return;

      const pos = getInterpolatedPosition(keyframes[sprite.id], currentFrame);
      if (!pos || !pos.visible) return;

      // Draw sprite pixels
      ctx.fillStyle = sprite.id === selectedSpriteId ? '#00FF41' : '#ffffff';
      
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          if (sprite.pixels[y * sprite.width + x]) {
            ctx.fillRect(
              (pos.x + x) * zoom, 
              (pos.y + y) * zoom, 
              zoom, 
              zoom
            );
          }
        }
      }

      // Subtle outline for selected sprite boundary
      if (sprite.id === selectedSpriteId) {
        ctx.strokeStyle = activeTool === 'move' ? '#00FF41' : '#444'; 
        ctx.setLineDash(activeTool === 'move' ? [] : [2, 2]);
        ctx.strokeRect(
          pos.x * zoom, 
          pos.y * zoom, 
          sprite.width * zoom, 
          sprite.height * zoom
        );
        ctx.setLineDash([]);
      }
    });

    // Main Workspace Border
    ctx.strokeStyle = '#222';
    ctx.strokeRect(0, 0, meta.canvasW * zoom, meta.canvasH * zoom);

    // Render Grid
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= meta.canvasW; x++) {
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, meta.canvasH * zoom);
      }
      for (let y = 0; y <= meta.canvasH; y++) {
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(meta.canvasW * zoom, y * zoom);
      }
      ctx.stroke();
    }

    // Render Preview Overlay (Ghost)
    if (isDragging && startPos && currentPos && ['rect', 'ellipse', 'roundedRect'].includes(activeTool)) {
      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      let { x: x1, y: y1 } = startPos;
      let { x: x2, y: y2 } = currentPos;

      if (isShiftPressed) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        x2 = x1 + (dx >= 0 ? size : -size);
        y2 = y1 + (dy >= 0 ? size : -size);
      }

      ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      const px1 = (pos.x + Math.min(x1, x2)) * zoom;
      const py1 = (pos.y + Math.min(y1, y2)) * zoom;
      const pw = (Math.abs(x2 - x1) + 1) * zoom;
      const ph = (Math.abs(y2 - y1) + 1) * zoom;
      
      ctx.strokeRect(px1, py1, pw, ph);
      ctx.setLineDash([]);
    }

  }, [sprites, keyframes, currentFrame, zoom, showGrid, selectedSpriteId, meta, isDragging, startPos, currentPos, isShiftPressed, activeTool, editor.onionSkin]);

  // Interaction Logic
  const getPixelCoords = (e) => {
    // Using native offsetX/Y is more reliable for canvas interactions
    const { offsetX, offsetY } = e.nativeEvent || e;
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / meta.canvasW;
    const scaleY = rect.height / meta.canvasH;
    
    const x = Math.floor(offsetX / scaleX);
    const y = Math.floor(offsetY / scaleY);
    
    return { x: Math.max(0, Math.min(x, meta.canvasW - 1)), 
             y: Math.max(0, Math.min(y, meta.canvasH - 1)) };
  };

  const handleMouseDown = (e) => {
    if (!selectedSpriteId) return;
    const { x, y } = getPixelCoords(e);
    
    // RECORD HISTORY BEFORE CHANGE
    recordHistory();
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDragging(true);

    if (activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'fill') {
      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      const relX = x - pos.x;
      const relY = y - pos.y;
      
      if (activeTool === 'fill') {
        applyFill(relX, relY);
      } else {
        applyDraw(relX, relY);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedSpriteId) return;
    const { x, y } = getPixelCoords(e);
    setCurrentPos({ x, y });

    if (activeTool === 'move') {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      
      if (dx !== 0 || dy !== 0) {
        // Use interpolated position as the baseline if no keyframe exists at current frame
        const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
        
        setKeyframe(selectedSpriteId, currentFrame, { 
          x: pos.x + dx, 
          y: pos.y + dy,
          visible: true
        });
        setStartPos({ x, y });
      }
    } else if (activeTool === 'pencil' || activeTool === 'eraser') {
      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      const relX = x - pos.x;
      const relY = y - pos.y;
      applyDraw(relX, relY);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !selectedSpriteId) return;

    const { x, y } = getPixelCoords(e);
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    
    // Relative coordinates
    let rx1 = startPos.x - pos.x;
    let ry1 = startPos.y - pos.y;
    let rx2 = x - pos.x;
    let ry2 = y - pos.y;

    if (isShiftPressed && ['rect', 'ellipse', 'roundedRect'].includes(activeTool)) {
      const dx = rx2 - rx1;
      const dy = ry2 - ry1;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      rx2 = rx1 + (dx >= 0 ? size : -size);
      ry2 = ry1 + (dy >= 0 ? size : -size);
    }
    
    if (activeTool === 'rect') {
      applyRect(rx1, ry1, rx2, ry2);
    } else if (activeTool === 'ellipse') {
      applyEllipse(rx1, ry1, rx2, ry2);
    } else if (activeTool === 'roundedRect') {
      applyRoundedRect(rx1, ry1, rx2, ry2);
    }

    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Action Applications
  const applyDraw = (x, y) => {
    if (!selectedSprite || x < 0 || x >= selectedSprite.width || y < 0 || y >= selectedSprite.height) return;
    const newPixels = [...selectedSprite.pixels];
    const idx = y * selectedSprite.width + x;
    const value = activeTool === 'pencil';
    if (newPixels[idx] !== value) {
      newPixels[idx] = value;
      updateSpritePixels(selectedSpriteId, newPixels);
    }
  };

  const applyFill = (x, y) => {
    if (!selectedSprite || x < 0 || x >= selectedSprite.width || y < 0 || y >= selectedSprite.height) return;
    const newPixels = floodFill(selectedSprite.pixels, selectedSprite.width, selectedSprite.height, x, y, true);
    updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyRect = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const newPixels = drawRect(selectedSprite.pixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, true);
    updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyRoundedRect = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const newPixels = drawRoundedRect(selectedSprite.pixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, radius, true);
    updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyEllipse = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const newPixels = drawEllipse(selectedSprite.pixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, true);
    updateSpritePixels(selectedSpriteId, newPixels);
  };

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        width={meta.canvasW * zoom}
        height={meta.canvasH * zoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (isDragging) handleMouseUp({ clientX: 0, clientY: 0 }); }}
        className="cursor-crosshair block"
      />
    </div>
  );
};

export default PixelCanvas;
