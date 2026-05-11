import React, { useRef, useEffect, useState } from 'react';
import useProjectStore from '../../store/projectStore';
import { getInterpolatedPosition } from '../../utils/tweenUtils';
import { floodFill, drawRect, drawEllipse, drawRoundedRect } from '../../utils/canvasUtils';

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const { 
    project, 
    updateSpritePixels, 
    updateKeyframePixels, 
    updateComponent, 
    setKeyframe, 
    recordHistory, 
    removeUISprite, 
    setEditor,
    addSprite,
    moveSpriteKeyframes,
    resizeSprite
  } = useProjectStore();
  const { meta, sprites, keyframes, editor } = project;
  const { currentFrame, zoom, showGrid, activeTool, selectedSpriteId, radius } = editor;

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [compDragOffset, setCompDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'tl', 'tr', 'bl', 'br'
  const [resizeSnapshot, setResizeSnapshot] = useState(null);
  const [snapGuides, setSnapGuides] = useState([]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Pinch to Zoom Listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
        const currentZoom = useProjectStore.getState().project.editor.zoom;
        useProjectStore.getState().setEditor({ 
          zoom: Math.max(1, Math.min(32, currentZoom + zoomDelta)) 
        });
      }
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
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
          
          const pixelsToRender = (!sprite.shapeLocked && pos.pixels) ? pos.pixels : sprite.pixels;
          
          ctx.fillStyle = '#ffffff';
          for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
              if (pixelsToRender[y * sprite.width + x]) {
                ctx.fillRect((pos.x + x) * zoom, (pos.y + y) * zoom, zoom, zoom);
              }
            }
          }
        });
      });
      ctx.globalAlpha = 1.0;
    }

    // ---------------------------------------------------------
    // Step 3: Smartwatch Frame (Designer Mode Only)
    // ---------------------------------------------------------
    if (editor.currentMode === 'designer') {
      ctx.save();
      const framePadding = 40;
      const cornerRadius = 30;
      
      // Outer Case
      ctx.fillStyle = '#111';
      ctx.shadowBlur = 40;
      ctx.shadowColor = 'black';
      
      const fw = meta.canvasW * zoom + framePadding * 2;
      const fh = meta.canvasH * zoom + framePadding * 2;
      const fx = -framePadding;
      const fy = -framePadding;
      
      // Draw rounded case
      ctx.beginPath();
      ctx.roundRect(fx, fy, fw, fh, cornerRadius);
      ctx.fill();
      
      // Bezel
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Decorative Watch Buttons
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.roundRect(fx + fw - 10, fy + fh * 0.2, 12, 30, 4); // Crown/Button
      ctx.fill();
      
      ctx.restore();
    }

    // Render all visible sprites
    sprites.forEach(sprite => {
      if (!sprite.visible) return;

      const start = sprite.startFrame ?? 0;
      const end = sprite.endFrame ?? (meta.totalFrames - 1);
      if (currentFrame < start || currentFrame > end) return;

      const pos = getInterpolatedPosition(keyframes[sprite.id], currentFrame);
      if (!pos || !pos.visible) return;

      // Determine which pixels to render
      const pixelsToRender = (!sprite.shapeLocked && pos.pixels) ? pos.pixels : sprite.pixels;

      // Draw sprite pixels
      ctx.fillStyle = sprite.id === selectedSpriteId ? '#00FF41' : '#ffffff';
      
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          if (pixelsToRender[y * sprite.width + x]) {
            ctx.fillRect(
              (pos.x + x) * zoom, 
              (pos.y + y) * zoom, 
              zoom, 
              zoom
            );
          }
        }
      }

      // ---------------------------------------------------------
      // Step 3: Render UI Components & Virtual Pixel Bounding Box
      // ---------------------------------------------------------
      const getTightBounds = (pixels, w, h) => {
        let minX = w, minY = h, maxX = -1, maxY = -1, hasContent = false;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (pixels[y * w + x]) {
              if (x < minX) minX = x; if (y < minY) minY = y;
              if (x > maxX) maxX = x; if (y > maxY) maxY = y;
              hasContent = true;
            }
          }
        }
        return hasContent ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w, h };
      };

      const componentsToRender = sprite.uiComponents && sprite.uiComponents.length > 0 ? [...sprite.uiComponents] : [];
      
      if (componentsToRender.length === 0 && sprite.id === selectedSpriteId && (editor.currentMode === 'designer' || activeTool === 'move')) {
         const bounds = getTightBounds(pixelsToRender, sprite.width, sprite.height);
         componentsToRender.push({ id: 'pixel_body', x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, type: 'pixel_body' });
      }

      componentsToRender.forEach(comp => {
        ctx.save();
        const cx = (pos.x + comp.x) * zoom;
        const cy = (pos.y + comp.y) * zoom;
        const cw = comp.w * zoom;
        const ch = comp.h * zoom;

        // Selection highlight
        if (sprite.id === selectedSpriteId && (editor.selectedCompId === comp.id || comp.id === 'pixel_body')) {
          ctx.strokeStyle = '#00FF41';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 1, cy - 1, cw + 2, ch + 2);
          
          // Draw Handles
          ctx.fillStyle = '#ffffff';
          const hs = 6; // handle size
          ctx.fillRect(cx - hs/2, cy - hs/2, hs, hs); // TL
          ctx.fillRect(cx + cw - hs/2, cy - hs/2, hs, hs); // TR
          ctx.fillRect(cx - hs/2, cy + ch - hs/2, hs, hs); // BL
          ctx.fillRect(cx + cw - hs/2, cy + ch - hs/2, hs, hs); // BR

          // Delete Button (X) - Top Left slightly offset
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(cx - 12, cy - 12, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('×', cx - 12, cy - 11); // Better centering
          ctx.textAlign = 'start'; // Reset
          ctx.textBaseline = 'top'; // Reset
        } else if (sprite.id === selectedSpriteId && comp.id !== 'pixel_body') {
          ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 2, cy - 2, cw + 4, ch + 4);
        }

        if (comp.id === 'pixel_body') {
           ctx.restore();
           return; // Don't draw text/UI elements for pixel layers
        }

        ctx.fillStyle = sprite.id === selectedSpriteId ? '#00FF41' : '#ffffff';
        ctx.font = `${ch * 0.8}px monospace`;
        ctx.textBaseline = 'top';

        if (comp.type === 'ui-clock') {
          const hours = systemTime.getHours().toString().padStart(2, '0');
          const mins = systemTime.getMinutes().toString().padStart(2, '0');
          ctx.fillText(`${hours}:${mins}`, cx, cy);
        } else if (comp.type === 'ui-label') {
          ctx.fillText(comp.props.text || 'LABEL', cx, cy);
        } else if (comp.type === 'ui-bar') {
          // Draw frame
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cw, ch);
          // Draw fill
          const fillW = (cw * (comp.props.value || 0)) / 100;
          ctx.fillRect(cx + 2, cy + 2, Math.max(0, fillW - 4), ch - 4);
        } else if (comp.type === 'ui-graph') {
          ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath();
          ctx.moveTo(cx, cy + ch);
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(cx + (cw * i / 4), cy + (ch * Math.random()));
          }
          ctx.stroke();
        } else if (comp.type === 'ui-icon') {
          ctx.fillRect(cx, cy, ch, ch); // Square placeholder
          ctx.font = `${ch * 0.6}px Arial`;
          ctx.fillStyle = 'black';
          ctx.fillText('!', cx + 4, cy);
        }
        
        ctx.restore();
      });

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
    ctx.strokeStyle = editor.currentMode === 'designer' ? '#000' : '#222';
    ctx.strokeRect(0, 0, meta.canvasW * zoom, meta.canvasH * zoom);

    // Render Grid
    if (showGrid && zoom >= 4 && editor.currentMode !== 'designer') {
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
    
    // Render Snap Guides (Magenta Canva-style)
    if (snapGuides.length > 0) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      snapGuides.forEach(guide => {
        ctx.beginPath();
        if (guide.type === 'v') {
          ctx.moveTo(guide.x * zoom, 0);
          ctx.lineTo(guide.x * zoom, meta.canvasH * zoom);
        } else {
          ctx.moveTo(0, guide.y * zoom);
          ctx.lineTo(meta.canvasW * zoom, guide.y * zoom);
        }
        ctx.stroke();
      });
    }

  }, [sprites, keyframes, currentFrame, zoom, showGrid, selectedSpriteId, meta, isDragging, startPos, currentPos, isShiftPressed, activeTool, editor.onionSkin, snapGuides]);

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

    // Check for component selection across ALL layers (Always active if tool is move/select or in designer)
    if (editor.currentMode === 'designer' || activeTool === 'move') {
      let hit = null;
      
      // Iterate through sprites in reverse (top to bottom)
      [...sprites].reverse().forEach(s => {
        if (hit || !s.visible) return;
        const startF = s.startFrame ?? 0;
        const endF = s.endFrame ?? (meta.totalFrames - 1);
        if (currentFrame < startF || currentFrame > endF) return;

        const pos = getInterpolatedPosition(keyframes[s.id], currentFrame);
        const relX = x - pos.x;
        const relY = y - pos.y;

        let comp = [...(s.uiComponents || [])].reverse().find(c => 
          relX >= c.x - 12 && relX <= c.x + c.w + 12 &&
          relY >= c.y - 12 && relY <= c.y + c.h + 12
        );

        // Virtual component hit detection for pixel layers
        if (!comp && (!s.uiComponents || s.uiComponents.length === 0)) {
           if (relX >= -12 && relX <= s.width + 12 && relY >= -12 && relY <= s.height + 12) {
              comp = { id: 'pixel_body', x: 0, y: 0, w: s.width, h: s.height };
           }
        }

        if (comp) {
          const hs = 10 / zoom;
          const hx = relX - comp.x;
          const hy = relY - comp.y;

          // Check Delete Button hit (cx - 12, cy - 12)
          const distToDelete = Math.sqrt((relX - (comp.x - 12/zoom))**2 + (relY - (comp.y - 12/zoom))**2);
          if ((editor.selectedCompId === comp.id || comp.id === 'pixel_body') && distToDelete < 15/zoom) { 
            // If it's a UI component, we might want to just delete the component or the whole sprite?
            // User requested delete button for layer, removeUISprite handles it.
            removeUISprite(s.id);
            setEditor({ selectedCompId: null, selectedSpriteId: null });
            hit = true;
            return;
          }

          // Check Resize Handles
          if (editor.selectedCompId === comp.id || comp.id === 'pixel_body') {
            if (Math.abs(hx) < hs && Math.abs(hy) < hs) { 
               setIsResizing(true); setResizeHandle('tl'); hit = true; 
               if (comp.id === 'pixel_body') setResizeSnapshot({ w: s.width, h: s.height, pixels: s.pixels, keyframes: keyframes[s.id] });
               return; 
            }
            if (Math.abs(hx - comp.w) < hs && Math.abs(hy) < hs) { 
               setIsResizing(true); setResizeHandle('tr'); hit = true; 
               if (comp.id === 'pixel_body') setResizeSnapshot({ w: s.width, h: s.height, pixels: s.pixels, keyframes: keyframes[s.id] });
               return; 
            }
            if (Math.abs(hx) < hs && Math.abs(hy - comp.h) < hs) { 
               setIsResizing(true); setResizeHandle('bl'); hit = true; 
               if (comp.id === 'pixel_body') setResizeSnapshot({ w: s.width, h: s.height, pixels: s.pixels, keyframes: keyframes[s.id] });
               return; 
            }
            if (Math.abs(hx - comp.w) < hs && Math.abs(hy - comp.h) < hs) { 
               setIsResizing(true); setResizeHandle('br'); hit = true; 
               if (comp.id === 'pixel_body') setResizeSnapshot({ w: s.width, h: s.height, pixels: s.pixels, keyframes: keyframes[s.id] });
               return; 
            }
          }

          // If just clicking the body
          setEditor({ selectedSpriteId: s.id, selectedCompId: comp.id });
          setCompDragOffset({ x: relX - comp.x, y: relY - comp.y });
          hit = true;
        }
      });

      if (hit) return;
    }

    if (activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'fill' || ['rect', 'ellipse', 'roundedRect'].includes(activeTool)) {
      // Bug Fix: If drawing on a UI layer, automatically create a new PIXEL layer
      const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
      if (selectedSprite && selectedSprite.uiComponents && selectedSprite.uiComponents.length > 0) {
        const newName = `Layer ${sprites.length + 1}`;
        addSprite(newName);
        // addSprite is async in store update, but for immediate drawing we need to be careful.
        // Actually, for simplicity, let's just alert or return for now, 
        // but better is to switch to a pixel layer if one exists.
        const pixelLayer = sprites.find(s => !s.uiComponents || s.uiComponents.length === 0);
        if (pixelLayer) {
          setEditor({ selectedSpriteId: pixelLayer.id });
        } else {
          // If no pixel layers at all, creating one is best
          addSprite("New Drawing");
          return; // Stop current click, user needs to click again on the new layer
        }
      }

      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      const relX = x - pos.x;
      const relY = y - pos.y;
      
      if (activeTool === 'fill') {
        applyFill(relX, relY);
      } else if (activeTool === 'pencil' || activeTool === 'eraser') {
        applyDraw(relX, relY);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedSpriteId) return;
    const { x, y } = getPixelCoords(e);
    setCurrentPos({ x, y });

    if (isResizing && editor.selectedCompId) {
      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      const relX = x - pos.x;
      const relY = y - pos.y;
      const sprite = sprites.find(s => s.id === selectedSpriteId);
      
      if (editor.selectedCompId === 'pixel_body' && resizeSnapshot) {
         // Resizing pixel layer (Maintain Aspect Ratio)
         let newW = Math.max(4, relX);
         let newH = Math.round(newW * (resizeSnapshot.h / resizeSnapshot.w));
         
         // Snapping for resize (to other objects)
         const newGuides = [];
         if (editor.snappingEnabled) {
            sprites.forEach(s => {
               if (s.id === selectedSpriteId || !s.visible) return;
               const threshold = 4;
               if (Math.abs(newW - s.width) < threshold) { newW = s.width; newH = Math.round(newW * (resizeSnapshot.h / resizeSnapshot.w)); }
               if (Math.abs(newH - s.height) < threshold) { newH = s.height; newW = Math.round(newH * (resizeSnapshot.w / resizeSnapshot.h)); }
            });
         }

         // Only trigger update if dimensions actually changed
         if (newW !== sprite.width || newH !== sprite.height) {
            resizeSprite(selectedSpriteId, newW, newH, resizeSnapshot);
         }
         setSnapGuides(newGuides);
         return;
      }

      const comp = sprite.uiComponents.find(c => c.id === editor.selectedCompId);
      
      let newBox = { x: comp.x, y: comp.y, w: comp.w, h: comp.h };
      
      if (resizeHandle === 'br') {
        newBox.w = Math.max(2, relX - comp.x);
        newBox.h = Math.max(2, relY - comp.y);
      } else if (resizeHandle === 'tl') {
        newBox.w = Math.max(2, comp.w + (comp.x - relX));
        newBox.h = Math.max(2, comp.h + (comp.y - relY));
        newBox.x = relX;
        newBox.y = relY;
      } else if (resizeHandle === 'tr') {
        newBox.w = Math.max(2, relX - comp.x);
        newBox.h = Math.max(2, comp.h + (comp.y - relY));
        newBox.y = relY;
      } else if (resizeHandle === 'bl') {
        newBox.w = Math.max(2, comp.w + (comp.x - relX));
        newBox.h = Math.max(2, relY - comp.y);
        newBox.x = relX;
      }
      
      updateComponent(selectedSpriteId, editor.selectedCompId, newBox);
      return;
    }

    if (editor.selectedCompId && !isResizing && (activeTool === 'move' || editor.currentMode === 'designer')) {
      const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
      const relX = x - pos.x;
      const relY = y - pos.y;
      
      if (editor.selectedCompId === 'pixel_body') {
         const dx = x - startPos.x;
         const dy = y - startPos.y;
         
         if (dx !== 0 || dy !== 0) {
           // FIXED: Only move the current frame's keyframe, not ALL keyframes
           // This prevents blink animation keyframes from getting shifted out of bounds
           const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
           const newX = pos.x + dx;
           const newY = pos.y + dy;

           const newGuides = [];
           let snappedX = newX;
           let snappedY = newY;

           if (editor.snappingEnabled) {
             const sprite = sprites.find(s => s.id === selectedSpriteId);
             // Use tight bounds to find the true visual center
             const getTightBoundsSnap = (pixels, w, h) => {
               let minX = w, minY = h, maxX = -1, maxY = -1, has = false;
               for (let iy = 0; iy < h; iy++) for (let ix = 0; ix < w; ix++) if (pixels[iy * w + ix]) { if (ix < minX) minX = ix; if (iy < minY) minY = iy; if (ix > maxX) maxX = ix; if (iy > maxY) maxY = iy; has = true; }
               return has ? { cx: newX + minX + (maxX - minX) / 2, cy: newY + minY + (maxY - minY) / 2, x: newX + minX, y: newY + minY, r: newX + maxX + 1, b: newY + maxY + 1 } : { cx: newX + w/2, cy: newY + h/2, x: newX, y: newY, r: newX+w, b: newY+h };
             };
             const pixelsToSnap = sprite.pixels;
             const tb = getTightBoundsSnap(pixelsToSnap, sprite.width, sprite.height);
             const threshold = 4;

             // Snap center X to canvas center
             if (Math.abs(tb.cx - meta.canvasW / 2) < threshold) { snappedX += (meta.canvasW / 2 - tb.cx); newGuides.push({ x: meta.canvasW / 2, type: 'v' }); }
             // Snap center Y to canvas center
             if (Math.abs(tb.cy - meta.canvasH / 2) < threshold) { snappedY += (meta.canvasH / 2 - tb.cy); newGuides.push({ y: meta.canvasH / 2, type: 'h' }); }

             // Snap to other sprites
             sprites.forEach(s => {
               if (s.id === selectedSpriteId || !s.visible) return;
               const sPos = getInterpolatedPosition(keyframes[s.id], currentFrame);
               // Align left edges, right edges, centers X
               if (Math.abs(tb.x - sPos.x) < threshold) { snappedX += sPos.x - tb.x; newGuides.push({ x: sPos.x, type: 'v' }); }
               if (Math.abs(tb.r - (sPos.x + s.width)) < threshold) { snappedX += (sPos.x + s.width) - tb.r; newGuides.push({ x: sPos.x + s.width, type: 'v' }); }
               // Align top edges, bottom edges, centers Y
               if (Math.abs(tb.y - sPos.y) < threshold) { snappedY += sPos.y - tb.y; newGuides.push({ y: sPos.y, type: 'h' }); }
               if (Math.abs(tb.b - (sPos.y + s.height)) < threshold) { snappedY += (sPos.y + s.height) - tb.b; newGuides.push({ y: sPos.y + s.height, type: 'h' }); }
             });
           }

           setKeyframe(selectedSpriteId, currentFrame, { x: snappedX, y: snappedY, visible: true });
           setStartPos({ x, y });
           setSnapGuides(newGuides);
         }
      } else {
         updateComponent(selectedSpriteId, editor.selectedCompId, {
           x: relX - compDragOffset.x,
           y: relY - compDragOffset.y
         });
      }
      return;
    }

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
    setIsResizing(false);
    setResizeHandle(null);
    setResizeSnapshot(null);
    setSnapGuides([]);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Action Applications
  const applyDraw = (cx, cy) => {
    if (!selectedSprite) return;
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    const basePixels = (!selectedSprite.shapeLocked && pos.pixels) ? pos.pixels : selectedSprite.pixels;
    const newPixels = [...basePixels];
    const value = activeTool === 'pencil';
    const { brushSize = 1, brushShape = 'square' } = editor;

    const r = Math.floor(brushSize / 2);
    const isEven = brushSize % 2 === 0;
    const offsetEnd = isEven ? r - 1 : r;
    let changed = false;

    for (let y = cy - r; y <= cy + offsetEnd; y++) {
      for (let x = cx - r; x <= cx + offsetEnd; x++) {
        if (x < 0 || x >= selectedSprite.width || y < 0 || y >= selectedSprite.height) continue;
        
        if (brushShape === 'circle' && brushSize > 2) {
          const centerX = cx + (isEven ? -0.5 : 0);
          const centerY = cy + (isEven ? -0.5 : 0);
          const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;
          const maxDistSq = (brushSize / 2) ** 2;
          if (distSq > maxDistSq) continue;
        }

        const idx = y * selectedSprite.width + x;
        if (newPixels[idx] !== value) {
          newPixels[idx] = value;
          changed = true;
        }
      }
    }
    
    if (changed) {
      if (!selectedSprite.shapeLocked) {
        updateKeyframePixels(selectedSpriteId, currentFrame, newPixels);
      } else {
        updateSpritePixels(selectedSpriteId, newPixels);
      }
    }
  };

  const applyFill = (x, y) => {
    if (!selectedSprite || x < 0 || x >= selectedSprite.width || y < 0 || y >= selectedSprite.height) return;
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    const basePixels = (!selectedSprite.shapeLocked && pos.pixels) ? pos.pixels : selectedSprite.pixels;
    const newPixels = floodFill(basePixels, selectedSprite.width, selectedSprite.height, x, y, true);
    if (!selectedSprite.shapeLocked) updateKeyframePixels(selectedSpriteId, currentFrame, newPixels);
    else updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyRect = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    const basePixels = (!selectedSprite.shapeLocked && pos.pixels) ? pos.pixels : selectedSprite.pixels;
    const newPixels = drawRect(basePixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, true);
    if (!selectedSprite.shapeLocked) updateKeyframePixels(selectedSpriteId, currentFrame, newPixels);
    else updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyRoundedRect = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    const basePixels = (!selectedSprite.shapeLocked && pos.pixels) ? pos.pixels : selectedSprite.pixels;
    const newPixels = drawRoundedRect(basePixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, radius, true);
    if (!selectedSprite.shapeLocked) updateKeyframePixels(selectedSpriteId, currentFrame, newPixels);
    else updateSpritePixels(selectedSpriteId, newPixels);
  };

  const applyEllipse = (x1, y1, x2, y2) => {
    if (!selectedSprite) return;
    const pos = getInterpolatedPosition(keyframes[selectedSpriteId], currentFrame);
    const basePixels = (!selectedSprite.shapeLocked && pos.pixels) ? pos.pixels : selectedSprite.pixels;
    const newPixels = drawEllipse(basePixels, selectedSprite.width, selectedSprite.height, x1, y1, x2, y2, true);
    if (!selectedSprite.shapeLocked) updateKeyframePixels(selectedSpriteId, currentFrame, newPixels);
    else updateSpritePixels(selectedSpriteId, newPixels);
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
        className="cursor-crosshair block border border-oled/50 shadow-[0_0_30px_rgba(0,255,65,0.15)] rounded-sm"
      />
    </div>
  );
};

export default PixelCanvas;
