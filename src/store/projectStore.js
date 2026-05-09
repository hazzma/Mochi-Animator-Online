import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInterpolatedPosition } from '../utils/tweenUtils';

const useProjectStore = create(
  persist(
    (set, get) => ({
      screen: 'home', // 'home' | 'editor'
      
      // History for Undo/Redo
      past: [],
      future: [],

      project: {
        meta: {
          name: "untitled",
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
          onionSkin: false,
        }
      },

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
        project: newProject,
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
            width,
            height,
            pixels: new Array(width * height).fill(false),
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

      updateSpritePixels: (spriteId, pixels) => {
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
        get().recordHistory();
        set((state) => {
          const { [spriteId]: _, ...remainingKeyframes } = state.project.keyframes;
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
            pixels: [...spriteToCopy.pixels]
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

      renameSprite: (spriteId, name) => {
        set((state) => ({
          project: {
            ...state.project,
            sprites: state.project.sprites.map(s => 
              s.id === spriteId ? { ...s, name } : s
            )
          }
        }));
      },

      toggleSpriteVisibility: (spriteId) => set((state) => ({
        project: {
          ...state.project,
          sprites: state.project.sprites.map(s => 
            s.id === spriteId ? { ...s, visible: !s.visible } : s
          )
        }
      })),

      // Keyframe Actions
      setKeyframe: (spriteId, frameIndex, data) => {
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
    }
  )
);

export default useProjectStore;
