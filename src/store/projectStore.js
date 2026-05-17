import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInterpolatedPosition } from '../utils/tweenUtils';

const DEFAULT_META = {
  name: "untitled",
  fps: 12,
  totalFrames: 24,
  canvasW: 128,
  canvasH: 64,
};

const DEFAULT_EDITOR = {
  selectedSpriteId: "sprite_001",
  currentFrame: 0,
  activeTool: "pencil",
  zoom: 4,
  isPlaying: false,
  showGrid: true,
  radius: 4,
  onionSkin: false,
  brushSize: 1,
  brushShape: 'square',
  currentMode: 'animator',
  selectedCompId: null,
  snappingEnabled: true,
};

const createDefaultSprite = () => ({
  id: "sprite_001",
  name: "Main Layer",
  visible: true,
  locked: false,
  shapeLocked: true,
  rotation: 0,
  width: 128,
  height: 64,
  pixels: new Array(128 * 64).fill(false),
  uiComponents: [],
  startFrame: 0,
  endFrame: DEFAULT_META.totalFrames - 1,
});

const normalizeProject = (project = {}) => {
  const meta = { ...DEFAULT_META, ...(project.meta || {}) };
  const sprites = (project.sprites?.length ? project.sprites : [createDefaultSprite()]).map((sprite) => ({
    visible: true,
    locked: false,
    shapeLocked: true,
    rotation: 0,
    uiComponents: [],
    startFrame: 0,
    endFrame: meta.totalFrames - 1,
    ...sprite,
    pixels: sprite.pixels || new Array((sprite.width || meta.canvasW) * (sprite.height || meta.canvasH)).fill(false),
  }));

  const selectedSpriteId = sprites.some(s => s.id === project.editor?.selectedSpriteId)
    ? project.editor.selectedSpriteId
    : sprites[0]?.id;

  return {
    meta,
    sprites,
    keyframes: project.keyframes || { [sprites[0].id]: { 0: { x: 0, y: 0, visible: true } } },
    editor: {
      ...DEFAULT_EDITOR,
      ...(project.editor || {}),
      selectedSpriteId,
      currentFrame: Math.min(project.editor?.currentFrame ?? 0, meta.totalFrames - 1),
    },
  };
};

const isSpriteLocked = (project, spriteId) => {
  return project.sprites.some(sprite => sprite.id === spriteId && sprite.locked);
};

const useProjectStore = create(
  persist(
    (set, get) => ({
      screen: 'home', // 'home' | 'editor'
      
      // History for Undo/Redo
      past: [],
      future: [],

      project: normalizeProject(),

      // --- HELPER FOR HISTORY ---
      recordHistory: () => {
        const state = get();
        const currentProject = JSON.parse(JSON.stringify(state.project));
        set({
          past: [currentProject, ...state.past].slice(0, 50), // Limit to 50 undos
          future: []
        });
      },

      undo: () => {
        const { past, project, future } = get();
        if (past.length === 0) return;

        const previous = past[0];
        const newPast = past.slice(1);
        
        set({
          project: previous,
          past: newPast,
          future: [JSON.parse(JSON.stringify(project)), ...future]
        });
      },

      redo: () => {
        const { past, project, future } = get();
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        set({
          project: next,
          past: [JSON.parse(JSON.stringify(project)), ...past],
          future: newFuture
        });
      },

      // --- GENERAL ACTIONS ---
      setScreen: (screen) => set({ screen }),
      
      loadProject: (newProject) => set({ 
        project: normalizeProject(newProject),
        screen: 'editor',
        past: [],
        future: []
      }),

      setMeta: (updates) => {
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            meta: { ...state.project.meta, ...updates }
          }
        }));
      },

      setEditor: (updates) => set((state) => ({
        project: {
          ...state.project,
          editor: { ...state.project.editor, ...updates }
        }
      })),

      // Sprite Actions
      addSprite: (name, width = 128, height = 64) => {
        get().recordHistory();
        set((state) => {
          const id = `sprite_${Date.now()}`;
          const newSprite = {
            id,
            name,
            visible: true,
            locked: false,
            shapeLocked: true,
            rotation: 0,
            width,
            height,
            pixels: new Array(width * height).fill(false),
            uiComponents: [],
            startFrame: 0,
            endFrame: state.project.meta.totalFrames - 1,
          };
          
          return {
            project: {
              ...state.project,
              sprites: [...state.project.sprites, newSprite],
              keyframes: {
                ...state.project.keyframes,
                [id]: { 0: { x: 0, y: 0, visible: true } }
              }
            }
          };
        });
      },

      addAssetSprite: (asset) => {
        get().recordHistory();
        set((state) => {
          const id = `sprite_${Date.now()}`;
          const newSprite = {
            id,
            name: asset.name,
            visible: true,
            locked: false,
            shapeLocked: true,
            width: asset.width || 128,
            height: asset.height || 64,
            pixels: asset.pixels || new Array((asset.width || 128) * (asset.height || 64)).fill(false),
            uiComponents: [],
            startFrame: 0,
            endFrame: state.project.meta.totalFrames - 1,
          };

          const keyframes = {};
          if (asset.frames && asset.frames.length > 0) {
            let currentF = 0;
            const totalF = state.project.meta.totalFrames;
            
            // Loop the animation frames to fill the entire timeline
            while (currentF < totalF) {
              for (const frame of asset.frames) {
                if (currentF >= totalF) break;
                keyframes[currentF] = { x: 0, y: 0, visible: true, pixels: frame.pixels };
                currentF += frame.delay;
              }
              // If delay is 0 or undefined, prevent infinite loop
              if (asset.frames.every(f => !f.delay)) break;
            }
            
            newSprite.pixels = asset.frames[0].pixels;
            newSprite.shapeLocked = false;
          } else {
            keyframes[0] = { x: 0, y: 0, visible: true };
          }

          return {
            project: {
              ...state.project,
              sprites: [...state.project.sprites, newSprite],
              keyframes: {
                ...state.project.keyframes,
                [id]: keyframes
              },
              editor: {
                ...state.project.editor,
                selectedSpriteId: id
              }
            }
          };
        });
      },

      setSpriteRotation: (spriteId, rotation, record = false) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        if (record) get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s =>
              s.id === spriteId ? { ...s, rotation } : s
            )
          }
        }));
      },

      rotateSprite: (spriteId) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        get().recordHistory();
        set((state) => {
          const sprite = state.project.sprites.find(s => s.id === spriteId);
          if (!sprite) return state;

          const oldW = sprite.width;
          const oldH = sprite.height;
          const oldPixels = sprite.pixels;
          // After 90° CW rotation: new dims are (oldH x oldW)
          const newPixels = new Array(oldH * oldW).fill(false);

          for (let y = 0; y < oldH; y++) {
            for (let x = 0; x < oldW; x++) {
              // 90° CW: new(x, y) = old(oldH-1-y, x) in new grid of (oldH cols x oldW rows)
              const newX = oldH - 1 - y;
              const newY = x;
              newPixels[newY * oldH + newX] = oldPixels[y * oldW + x];
            }
          }

          return {
            project: {
              ...state.project,
              sprites: state.project.sprites.map(s => 
                s.id === spriteId ? { ...s, width: oldH, height: oldW, pixels: newPixels } : s
              )
            }
          };
        });
      },

      moveSpriteKeyframes: (spriteId, dx, dy) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        set((state) => {
          const spriteKeyframes = state.project.keyframes[spriteId];
          if (!spriteKeyframes) return state;

          const newKeyframes = {};
          Object.entries(spriteKeyframes).forEach(([frame, data]) => {
            newKeyframes[frame] = {
              ...data,
              x: (data.x || 0) + dx,
              y: (data.y || 0) + dy
            };
          });

          return {
            project: {
              ...state.project,
              keyframes: {
                ...state.project.keyframes,
                [spriteId]: newKeyframes
              }
            }
          };
        });
      },

      resizeSprite: (spriteId, newW, newH, snapshot = null) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        // Only record history if NOT in the middle of a continuous drag resize
        if (!snapshot) get().recordHistory();
        
        set((state) => {
          const sprite = state.project.sprites.find(s => s.id === spriteId);
          if (!sprite) return state;

          const baseW = snapshot ? snapshot.w : sprite.width;
          const baseH = snapshot ? snapshot.h : sprite.height;
          const basePixels = snapshot ? snapshot.pixels : sprite.pixels;
          const baseKeyframes = snapshot ? snapshot.keyframes : state.project.keyframes[spriteId];
          
          const rescale = (pixels, oldW, oldH) => {
            if (!pixels) return null;
            const newPixels = new Array(newW * newH).fill(false);
            for (let y = 0; y < newH; y++) {
              for (let x = 0; x < newW; x++) {
                const oldX = Math.floor(x * oldW / newW);
                const oldY = Math.floor(y * oldH / newH);
                newPixels[y * newW + x] = pixels[oldY * oldW + oldX];
              }
            }
            return newPixels;
          };

          // Update all keyframe pixels from the snapshot to avoid cumulative errors
          const newKeyframes = {};
          Object.entries(baseKeyframes || {}).forEach(([frame, data]) => {
            newKeyframes[frame] = {
              ...data,
              pixels: rescale(data.pixels, baseW, baseH)
            };
          });

          return {
            project: {
              ...state.project,
              sprites: state.project.sprites.map(s => 
                s.id === spriteId ? { ...s, width: newW, height: newH, pixels: rescale(basePixels, baseW, baseH) } : s
              ),
              keyframes: {
                ...state.project.keyframes,
                [spriteId]: newKeyframes
              }
            }
          };
        });
      },

      updateSpritePixels: (spriteId, pixels) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        // We don't record history on EVERY pixel drawn for performance, 
        // usually handled on mouse up in the canvas. 
        // But for things like Fill, we should.
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, pixels } : s
            )
          }
        }));
      },

      deleteSprite: (spriteId) => {
        if (isSpriteLocked(get().project, spriteId)) return { error: "Layer is locked." };
        get().recordHistory();
        set((state) => {
          const remainingKeyframes = Object.fromEntries(
            Object.entries(state.project.keyframes).filter(([id]) => id !== spriteId)
          );
          return {
            project: {
              ...state.project,
              sprites: state.project.sprites.filter(s => s.id !== spriteId),
              keyframes: remainingKeyframes,
              editor: {
                ...state.project.editor,
                selectedSpriteId: state.project.editor.selectedSpriteId === spriteId ? null : state.project.editor.selectedSpriteId
              }
            }
          };
        });
      },

      duplicateSprite: (spriteId) => {
        get().recordHistory();
        set((state) => {
          const spriteToCopy = state.project.sprites.find(s => s.id === spriteId);
          if (!spriteToCopy) return state;

          const id = `sprite_${Date.now()}`;
          const newSprite = {
            ...spriteToCopy,
            id,
            name: `${spriteToCopy.name} (Copy)`,
            pixels: [...spriteToCopy.pixels],
            startFrame: spriteToCopy.startFrame ?? 0,
            endFrame: spriteToCopy.endFrame ?? (state.project.meta.totalFrames - 1),
          };

          // Copy keyframes from the current frame
          const currentKF = getInterpolatedPosition(state.project.keyframes[spriteId], state.project.editor.currentFrame);

          return {
            project: {
              ...state.project,
              sprites: [...state.project.sprites, newSprite],
              keyframes: {
                ...state.project.keyframes,
                [id]: { [state.project.editor.currentFrame]: { ...currentKF } }
              },
              editor: {
                ...state.project.editor,
                selectedSpriteId: id
              }
            }
          };
        });
      },

      toggleSpriteVisibility: (spriteId) => {
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, visible: !s.visible } : s
            )
          }
        }));
      },

      toggleSpriteLock: (spriteId) => {
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, locked: !s.locked } : s
            )
          }
        }));
      },

      toggleShapeLock: (spriteId) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, shapeLocked: s.shapeLocked === false ? true : false } : s
            )
          }
        }));
      },

      // UI Designer Actions
      addComponent: (type) => {
        get().recordHistory();
        set((state) => {
          const id = `comp_${Date.now()}`;
          const spriteId = `layer_${Date.now()}`;
          
          const baseName = type.replace('ui-', '').toUpperCase();
          let name = baseName;
          let counter = 1;
          while (state.project.sprites.some(s => s.name === name)) {
            name = `${baseName} ${counter++}`;
          }

          const defaults = {
            'ui-clock': { w: 40, h: 12, props: { format: 'HH:mm', size: 1 } },
            'ui-label': { w: 60, h: 10, props: { text: 'HELLO WORLD', size: 1 } },
            'ui-bar': { w: 32, h: 8, props: { value: 75, style: 'solid' } },
            'ui-graph': { w: 40, h: 20, props: { type: 'line' } },
            'ui-icon': { w: 16, h: 16, props: { icon: 'battery' } },
          };
          
          const comp = {
            id,
            type,
            x: 10,
            y: 10,
            ...(defaults[type] || { w: 20, h: 20, props: {} })
          };

          const newSprite = {
            id: spriteId,
            name: name,
            visible: true,
            locked: false,
            shapeLocked: true,
            width: state.project.meta.canvasW,
            height: state.project.meta.canvasH,
            pixels: new Array(state.project.meta.canvasW * state.project.meta.canvasH).fill(false),
            uiComponents: [comp],
            startFrame: 0,
            endFrame: state.project.meta.totalFrames - 1,
          };

          return {
            project: {
              ...state.project,
              editor: { ...state.project.editor, selectedSpriteId: spriteId, selectedCompId: id },
              sprites: [...state.project.sprites, newSprite],
              keyframes: {
                ...state.project.keyframes,
                [spriteId]: { 0: { x: 0, y: 0, visible: true } }
              }
            }
          };
        });
      },

      renameSprite: (spriteId, newName) => {
        const state = get();
        if (state.project.sprites.some(s => s.id !== spriteId && s.name === newName)) {
          return { error: "Name already exists!" };
        }
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, name: newName } : s
            )
          }
        }));
        return { success: true };
      },

      updateSpriteRange: (spriteId, startFrame, endFrame) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, startFrame, endFrame } : s
            )
          }
        }));
      },

      removeUISprite: (spriteId) => {
        if (isSpriteLocked(get().project, spriteId)) return { error: "Layer is locked." };
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            editor: { ...state.project.editor, selectedSpriteId: null, selectedCompId: null },
            sprites: state.project.sprites.filter(s => s.id !== spriteId),
            keyframes: Object.fromEntries(
              Object.entries(state.project.keyframes).filter(([id]) => id !== spriteId)
            )
          }
        }));
      },

      updateComponent: (spriteId, compId, data, record = false) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        if (record) get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => {
              if (s.id !== spriteId) return s;
              return {
                ...s,
                uiComponents: s.uiComponents.map(c => 
                  c.id === compId ? { ...c, ...data } : c
                )
              };
            })
          }
        }));
      },

      removeComponent: (spriteId, compId) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        get().recordHistory();
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId 
                ? { ...s, uiComponents: s.uiComponents.filter(c => c.id !== compId) } 
                : s
            )
          }
        }));
      },

      // Keyframe Actions
      updateKeyframePixels: (spriteId, frameIndex, pixels) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        set((state) => ({
          project: {
            ...state.project,
            keyframes: {
              ...state.project.keyframes,
              [spriteId]: {
                ...state.project.keyframes[spriteId],
                [frameIndex]: { ...(state.project.keyframes[spriteId]?.[frameIndex] || { x: 0, y: 0, visible: true }), pixels }
              }
            }
          }
        }));
      },

      setKeyframe: (spriteId, frameIndex, data, record = false) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        if (record) get().recordHistory();
        // Only record history if it's a significant change (not during drag, handled by dragEnd)
        set((state) => ({
          project: {
            ...state.project,
            keyframes: {
              ...state.project.keyframes,
              [spriteId]: {
                ...state.project.keyframes[spriteId],
                [frameIndex]: { ...(state.project.keyframes[spriteId]?.[frameIndex] || {}), ...data }
              }
            }
          }
        }));
      },

      deleteKeyframe: (spriteId, frameIndex) => {
        if (isSpriteLocked(get().project, spriteId)) return;
        get().recordHistory();
        set((state) => {
          const spriteKeyframes = { ...state.project.keyframes[spriteId] };
          delete spriteKeyframes[frameIndex];
          return {
            project: {
              ...state.project,
              keyframes: {
                ...state.project.keyframes,
                [spriteId]: spriteKeyframes
              }
            }
          };
        });
      },

      setCurrentFrame: (frame) => set((state) => ({
        project: {
          ...state.project,
          editor: { ...state.project.editor, currentFrame: frame }
        }
      })),

      togglePlay: () => set((state) => ({
        project: {
          ...state.project,
          editor: { ...state.project.editor, isPlaying: !state.project.editor.isPlaying }
        }
      })),

      tickFrame: () => set((state) => {
        const { currentFrame } = state.project.editor;
        const { totalFrames } = state.project.meta;
        return {
          project: {
            ...state.project,
            editor: { ...state.project.editor, currentFrame: (currentFrame + 1) % totalFrames }
          }
        };
      }),
    }),
    {
      name: 'mochi-animator-storage',
      partialize: (state) => ({ project: state.project, screen: state.screen }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        project: normalizeProject(persistedState?.project),
      }),
    }
  )
);

export default useProjectStore;
