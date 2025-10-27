import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, TransformControls, Html, Environment } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
// NEW: Import lighting system
import { calculateRoomBounds, RoomLights, FurnitureLights } from './lightingSystem';

// --- Basic CSS Styles (replaces Tailwind) ---
const styles = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#27272a', // A dark gray color
    color: 'white',
  },
  uiContainer: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  button: {
    backgroundColor: '#4f46e5',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  activeButton: {
    backgroundColor: '#22c55e',
  },
  infoPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '16px',
    borderRadius: '8px',
    width: '250px',
  },
  libraryPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '16px',
    borderRadius: '8px',
    width: '250px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  },
  libraryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    borderBottom: '1px solid #3f3f46',
  },
  select: {
    backgroundColor: '#3f3f46',
    color: 'white',
    border: '1px solid #52525b',
    borderRadius: '8px',
    padding: '8px',
    fontWeight: 'bold',
  }
};

// Zustand store for state management
const useStore = create((set) => ({
  items: [],
  library: [], 
  environment: 'studio', 
  setEnvironment: (env) => set({ environment: env }),
  // NEW: Room lighting state
  roomLightingPreset: 'warm-evening',
  setRoomLightingPreset: (preset) => set({ roomLightingPreset: preset }),
  // NEW: Furniture lighting state
  furnitureLightingPreset: 'default',
  setFurnitureLightingPreset: (preset) => set({ furnitureLightingPreset: preset }),
  // NEW: Track room bounds
  roomBounds: null,
  setRoomBounds: (bounds) => set({ roomBounds: bounds }),
  // NEW: Light intensity multipliers
  roomLightIntensity: 1.0,
  setRoomLightIntensity: (intensity) => set({ roomLightIntensity: intensity }),
  furnitureLightIntensity: 1.0,
  setFurnitureLightIntensity: (intensity) => set({ furnitureLightIntensity: intensity }),
  // NEW: Room material brightness (overexposure effect)
  roomMaterialBrightness: 1.0,
  setRoomMaterialBrightness: (brightness) => set({ roomMaterialBrightness: brightness }),
  addLibraryItem: (newItem) => set((state) => ({
    library: [...state.library, newItem]
  })),
  removeLibraryItem: (url) => set((state) => ({
    library: state.library.filter(item => item.url !== url),
    items: state.items.filter(item => item.url !== url),
  })),
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  updateItem: (id, newProps) => set((state) => ({
    items: state.items.map((item) => (item.id === id ? { ...item, ...newProps } : item))
  })),
  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
    selectedItem: null,
  })),
  loadScene: (sceneData) => set({
    items: sceneData.items || [],
    library: sceneData.library || [],
    environment: sceneData.environment || 'studio',
    // NEW: Load lighting presets
    roomLightingPreset: sceneData.roomLightingPreset || 'warm-evening',
    furnitureLightingPreset: sceneData.furnitureLightingPreset || 'default',
    roomLightIntensity: sceneData.roomLightIntensity || 1.0,
    furnitureLightIntensity: sceneData.furnitureLightIntensity || 1.0,
    roomMaterialBrightness: sceneData.roomMaterialBrightness || 1.0,
    selectedItem: null,
  }),
  selectedItem: null,
  setSelectedItem: (id) => set({ selectedItem: id }),
  transformMode: 'translate',
  setTransformMode: (mode) => set({ transformMode: mode }),
}));

// Component for a single piece of furniture
function FurnitureModel({ id, url, position, rotation, scale, name }) {
  const { scene } = useGLTF(url);
  const { setSelectedItem, updateItem, setRoomBounds } = useStore();
  const transform = useRef();
  const transformMode = useStore((state) => state.transformMode);
  const roomMaterialBrightness = useStore((state) => state.roomMaterialBrightness);
  
  // NEW: Check if this is the room model
  const isRoom = name && name.toLowerCase() === 'room.glb';

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (isRoom) {
          // Room doesn't cast shadows, only receives
          child.castShadow = false;
          child.receiveShadow = true;
          
          // NEW: Apply material brightness adjustment for overexposure effect
          if (child.material) {
            // Store original material properties if not already stored
            if (!child.material.userData.originalColor) {
              child.material.userData.originalColor = child.material.color.clone();
              child.material.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : null;
              child.material.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
            }
            
            // Apply brightness multiplier
            const originalColor = child.material.userData.originalColor;
            child.material.color.r = Math.min(originalColor.r * roomMaterialBrightness, 1);
            child.material.color.g = Math.min(originalColor.g * roomMaterialBrightness, 1);
            child.material.color.b = Math.min(originalColor.b * roomMaterialBrightness, 1);
            
            // Also increase emissive for glow effect
            if (child.material.emissive) {
              const originalEmissive = child.material.userData.originalEmissive;
              if (originalEmissive) {
                child.material.emissive.copy(originalEmissive);
              }
              // Add brightness-based emissive glow
              const glowIntensity = (roomMaterialBrightness - 1) * 0.5;
              child.material.emissiveIntensity = child.material.userData.originalEmissiveIntensity + glowIntensity;
            }
            
            child.material.needsUpdate = true;
          }
        } else {
          // Furniture casts and receives shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });
    
    // NEW: If this is the room, calculate its bounds
    if (isRoom) {
      const bounds = calculateRoomBounds(scene);
      setRoomBounds(bounds);
    }
    
    return () => {
      // Clean up room bounds when room is removed
      if (isRoom) {
        setRoomBounds(null);
      }
    };
  }, [scene, isRoom, setRoomBounds, roomMaterialBrightness]);

  useEffect(() => {
    if (transform.current) {
      const controls = transform.current;
      const handleDragEnd = () => {
        const object = controls.object;
        if (object) {
          updateItem(id, {
            position: [object.position.x, object.position.y, object.position.z],
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: [object.scale.x, object.scale.y, object.scale.z],
          });
        }
      };
      controls.addEventListener('mouseUp', handleDragEnd);
      return () => controls.removeEventListener('mouseUp', handleDragEnd);
    }
  }, [transform, id, updateItem]);

  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const isSelected = useStore((state) => state.selectedItem === id);

  return (
    <TransformControls ref={transform} object={clonedScene} enabled={isSelected} showX={isSelected} showY={isSelected} showZ={isSelected} mode={transformMode}>
      <primitive
        object={clonedScene}
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={(e) => { e.stopPropagation(); setSelectedItem(id); }}
      />
    </TransformControls>
  );
}

function FurnitureItems() {
  const items = useStore((state) => state.items);
  return (
    <>
      {items.map((item) => (
        <Suspense key={item.id} fallback={<Html center><div>Loading...</div></Html>}>
          <FurnitureModel {...item} />
        </Suspense>
      ))}
    </>
  );
}

function Scene() {
  const setSelectedItem = useStore((state) => state.setSelectedItem);
  const environment = useStore((state) => state.environment);
  // NEW: Get lighting states
  const roomLightingPreset = useStore((state) => state.roomLightingPreset);
  const furnitureLightingPreset = useStore((state) => state.furnitureLightingPreset);
  const roomBounds = useStore((state) => state.roomBounds);
  const roomLightIntensity = useStore((state) => state.roomLightIntensity);
  const furnitureLightIntensity = useStore((state) => state.furnitureLightIntensity);
  
  const { floorColor, floorSize } = useControls('Floor', {
      floorColor: '#888888',
      floorSize: { value: 20, min: 1, max: 100}
  });

  return (
    <>
      {/* NEW: Use FurnitureLights component instead of hardcoded lights */}
      <FurnitureLights preset={furnitureLightingPreset} intensityMultiplier={furnitureLightIntensity} />
      
      {/* NEW: Add RoomLights if room exists */}
      {roomBounds && <RoomLights preset={roomLightingPreset} roomBounds={roomBounds} intensityMultiplier={roomLightIntensity} />}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={() => setSelectedItem(null)}>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
      <gridHelper args={[floorSize, floorSize]} />
      <FurnitureItems />
      <OrbitControls makeDefault />
      <Environment preset={environment} />
    </>
  );
}

function InfoPanel() {
  const { items, selectedItem: selectedId, deleteItem } = useStore();
  const selectedItem = items.find(item => item.id === selectedId);

  if (!selectedItem) return null;

  const rotationDeg = selectedItem.rotation.map(rad => (rad * 180 / Math.PI).toFixed(1));
  const scaleFactor = selectedItem.scale.map(s => s.toFixed(2)).join(', ');
  
  const handleDelete = () => {
    deleteItem(selectedId);
  }

  return (
    <div style={styles.infoPanel}>
      <h3 style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '10px' }}>Properties</h3>
      <div>
        <p><strong>ID:</strong> {selectedItem.id.substring(0, 8)}</p>
        <p><strong>Position (x,y,z):</strong> {selectedItem.position.map(p => p.toFixed(2)).join(', ')}</p>
        <p><strong>Rotation (°):</strong> {rotationDeg.join(', ')}</p>
        <p><strong>Scale:</strong> {scaleFactor}</p>
      </div>
      <button onClick={handleDelete} style={{...styles.button, backgroundColor: '#ef4444', marginTop: '16px', width: '100%'}}>Delete Selected Item</button>
    </div>
  );
}

function LibraryPanel() {
  const { library, removeLibraryItem, addItem } = useStore();

  const handleAddItemToScene = (libraryItem) => {
    const newItem = {
      ...libraryItem,
      id: uuidv4(),
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    addItem(newItem);
  };

  return (
    <div style={styles.libraryPanel}>
      <h3 style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '10px' }}>Library</h3>
      {library.length === 0 && <p style={{fontSize: '0.9em', color: '#a1a1aa'}}>Upload a .glb file to add items.</p>}
      {library.map((libItem) => (
        <div key={libItem.url} style={styles.libraryItem}>
          <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{libItem.name}</span>
          <div style={{display: 'flex', gap: '5px', marginLeft: '10px'}}>
            <button onClick={() => handleAddItemToScene(libItem)} style={{...styles.button, padding: '4px 8px', fontSize: '0.8em'}}>Add</button>
            <button onClick={() => removeLibraryItem(libItem.url)} style={{...styles.button, backgroundColor: '#7f1d1d', padding: '4px 8px', fontSize: '0.8em'}}>X</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { 
    addLibraryItem, 
    library, 
    transformMode, 
    setTransformMode, 
    loadScene, 
    environment, 
    setEnvironment,
    // NEW: Get lighting states
    roomLightingPreset,
    setRoomLightingPreset,
    furnitureLightingPreset,
    setFurnitureLightingPreset,
    roomBounds,
    roomLightIntensity,
    setRoomLightIntensity,
    furnitureLightIntensity,
    setFurnitureLightIntensity,
    roomMaterialBrightness,
    setRoomMaterialBrightness
  } = useStore();
  
  const fileInputRef = useRef();
  const sceneInputRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.glb')) {
      const isDuplicate = library.some(item => item.name === file.name);
      if (isDuplicate) {
        alert(`${file.name} is already in the library.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        addLibraryItem({ name: file.name, url: e.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a .glb file.');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSceneLoad = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const sceneData = JSON.parse(e.target.result);
          loadScene(sceneData);
        } catch (err) {
          alert('Error loading scene file. It may be corrupted.');
        }
      };
      reader.readAsText(file);
    }
    if (sceneInputRef.current) sceneInputRef.current.value = "";
  };
  
  const handleSave = () => {
    const state = useStore.getState();
    const sceneData = {
      library: state.library,
      items: state.items,
      environment: state.environment,
      // NEW: Save lighting presets
      roomLightingPreset: state.roomLightingPreset,
      furnitureLightingPreset: state.furnitureLightingPreset,
      roomLightIntensity: state.roomLightIntensity,
      furnitureLightIntensity: state.furnitureLightIntensity,
      roomMaterialBrightness: state.roomMaterialBrightness,
    };
    const sceneString = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([sceneString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportInfo = () => {
    const state = useStore.getState();
    
    const itemsInfo = state.items.map(item => ({
      id: item.id,
      name: item.name,
      position: item.position,
      rotation: item.rotation,
      scale: item.scale,
    }));
    
    const infoData = {
      environment: state.environment,
      items: itemsInfo,
      // NEW: Export lighting presets
      roomLightingPreset: state.roomLightingPreset,
      furnitureLightingPreset: state.furnitureLightingPreset,
      roomLightIntensity: state.roomLightIntensity,
      furnitureLightIntensity: state.furnitureLightIntensity,
      roomMaterialBrightness: state.roomMaterialBrightness,
    };
    
    const infoString = JSON.stringify(infoData, null, 2);
    const blob = new Blob([infoString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene_info.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.appContainer}>
      <Leva collapsed />
      <div style={styles.uiContainer}>
        <h1 style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Virtual Room</h1>
        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={() => fileInputRef.current.click()}>
            Add to Library
          </button>
          <button style={{...styles.button, backgroundColor: '#10b981'}} onClick={handleSave}>Save Scene</button>
          <button style={{...styles.button, backgroundColor: '#0ea5e9'}} onClick={() => sceneInputRef.current.click()}>Load Scene</button>
          <button style={{...styles.button, backgroundColor: '#f59e0b'}} onClick={handleExportInfo}>Export Info</button>
        </div>
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, ...(transformMode === 'translate' && styles.activeButton)}} 
            onClick={() => setTransformMode('translate')}>
            Move
          </button>
          <button 
            style={{...styles.button, ...(transformMode === 'rotate' && styles.activeButton)}} 
            onClick={() => setTransformMode('rotate')}>
            Rotate
          </button>
          <button 
            style={{...styles.button, ...(transformMode === 'scale' && styles.activeButton)}} 
            onClick={() => setTransformMode('scale')}>
            Scale
          </button>
        </div>
        
        {/* Environment selector */}
        <div style={styles.buttonGroup}>
          <label htmlFor="env-select" style={{alignSelf: 'center'}}>Environment:</label>
          <select id="env-select" value={environment} onChange={(e) => setEnvironment(e.target.value)} style={styles.select}>
            <option value="studio">Studio</option>
            <option value="city">City</option>
            <option value="dawn">Dawn</option>
            <option value="sunset">Sunset</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>
        
        {/* NEW: Room Lighting selector */}
        <div style={styles.buttonGroup}>
          <label htmlFor="room-light-select" style={{alignSelf: 'center'}}>Room Lighting:</label>
          <select 
            id="room-light-select" 
            value={roomLightingPreset} 
            onChange={(e) => setRoomLightingPreset(e.target.value)} 
            style={styles.select}
            disabled={!roomBounds}
          >
            <option value="off">Off</option>
            <option value="warm-evening">Warm Evening</option>
            <option value="bright-day">Bright Day</option>
            <option value="cozy-night">Cozy Night</option>
            <option value="studio-neutral">Studio Neutral</option>
            <option value="sunset">Sunset</option>
          </select>
        </div>
        
        {/* NEW: Furniture Lighting selector */}
        <div style={styles.buttonGroup}>
          <label htmlFor="furniture-light-select" style={{alignSelf: 'center'}}>Furniture Lighting:</label>
          <select 
            id="furniture-light-select" 
            value={furnitureLightingPreset} 
            onChange={(e) => setFurnitureLightingPreset(e.target.value)} 
            style={styles.select}
          >
            <option value="default">Default</option>
            <option value="bright">Bright</option>
            <option value="soft">Soft</option>
            <option value="dramatic">Dramatic</option>
          </select>
        </div>
        
        {/* NEW: Room Light Intensity Slider */}
        <div style={styles.buttonGroup}>
          <label htmlFor="room-intensity" style={{alignSelf: 'center', minWidth: '120px'}}>
            Room Intensity: {roomLightIntensity.toFixed(1)}x
          </label>
          <input 
            id="room-intensity"
            type="range" 
            min="0" 
            max="3" 
            step="0.1" 
            value={roomLightIntensity}
            onChange={(e) => setRoomLightIntensity(parseFloat(e.target.value))}
            disabled={!roomBounds}
            style={{flex: 1, cursor: roomBounds ? 'pointer' : 'not-allowed'}}
          />
        </div>
        
        {/* NEW: Furniture Light Intensity Slider */}
        <div style={styles.buttonGroup}>
          <label htmlFor="furniture-intensity" style={{alignSelf: 'center', minWidth: '120px'}}>
            Furniture Intensity: {furnitureLightIntensity.toFixed(1)}x
          </label>
          <input 
            id="furniture-intensity"
            type="range" 
            min="0" 
            max="3" 
            step="0.1" 
            value={furnitureLightIntensity}
            onChange={(e) => setFurnitureLightIntensity(parseFloat(e.target.value))}
            style={{flex: 1, cursor: 'pointer'}}
          />
        </div>
        
        {/* NEW: Room Material Brightness Slider (Overexposure Effect) */}
        <div style={styles.buttonGroup}>
          <label htmlFor="room-material-brightness" style={{alignSelf: 'center', minWidth: '120px'}}>
            Room Brightness: {roomMaterialBrightness.toFixed(1)}x
          </label>
          <input 
            id="room-material-brightness"
            type="range" 
            min="0.5" 
            max="3" 
            step="0.1" 
            value={roomMaterialBrightness}
            onChange={(e) => setRoomMaterialBrightness(parseFloat(e.target.value))}
            disabled={!roomBounds}
            style={{flex: 1, cursor: roomBounds ? 'pointer' : 'not-allowed'}}
          />
        </div>
      </div>
      
      <input type="file" accept=".glb" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
      <input type="file" accept=".json" ref={sceneInputRef} onChange={handleSceneLoad} style={{ display: 'none' }} />

      <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
        <Scene />
      </Canvas>
      
      <InfoPanel />
      <LibraryPanel />
    </div>
  );
}