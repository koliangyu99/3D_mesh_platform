import React from 'react';
import * as THREE from 'three';

// ============================================
// LIGHTING PRESET CONFIGURATIONS
// ============================================

/**
 * Get room lighting configuration based on preset
 * @param {string} preset - The lighting preset name
 * @param {object} roomBounds - Room boundaries {minX, maxX, minY, maxY, minZ, maxZ, centerX, centerY, centerZ}
 * @returns {object|null} Lighting configuration or null if preset is 'off'
 */
export function getRoomLightingConfig(preset, roomBounds) {
  if (!roomBounds) return null;
  
  const { minX, maxX, minY, maxY, minZ, maxZ, centerX, centerY, centerZ } = roomBounds;
  
  // Calculate ceiling height (90% of max height to place lights below ceiling)
  // This positions lights at the TOP of the room, pointing downward
  const ceilingY = maxY * 0.9;
  
  // Calculate corner positions
  const cornerMargin = 0.8; // 80% towards corners from center
  const corner1X = centerX + (maxX - centerX) * cornerMargin;
  const corner1Z = centerZ + (maxZ - centerZ) * cornerMargin;
  const corner2X = centerX + (minX - centerX) * cornerMargin;
  const corner2Z = centerZ + (maxZ - centerZ) * cornerMargin;
  const corner3X = centerX + (minX - centerX) * cornerMargin;
  const corner3Z = centerZ + (minZ - centerZ) * cornerMargin;
  const corner4X = centerX + (maxX - centerX) * cornerMargin;
  const corner4Z = centerZ + (minZ - centerZ) * cornerMargin;
  
  // Calculate light distance based on room size
  const roomSize = Math.max(maxX - minX, maxZ - minZ);
  const lightDistance = roomSize * 0.8;
  
  const configs = {
    'off': null,
    
    'warm-evening': {
      ambientLight: { 
        color: '#fff5e6', 
        intensity: 0.3 
      },
      hemisphereLight: { 
        skyColor: '#fff5e6', 
        groundColor: '#8B7355', 
        intensity: 0.4,
        position: [0, ceilingY, 0]
      },
      pointLights: [
        // 4 corner ceiling lights
        { 
          position: [corner1X, ceilingY, corner1Z], 
          color: '#ffdb99', 
          intensity: 1.2, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner2X, ceilingY, corner2Z], 
          color: '#ffdb99', 
          intensity: 1.2, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner3X, ceilingY, corner3Z], 
          color: '#ffdb99', 
          intensity: 1.2, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner4X, ceilingY, corner4Z], 
          color: '#ffdb99', 
          intensity: 1.2, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        // 1 center ceiling light
        { 
          position: [centerX, ceilingY, centerZ], 
          color: '#ffe4b3', 
          intensity: 1.5, 
          distance: lightDistance * 1.2, 
          decay: 2,
          castShadow: true 
        },
      ]
    },
    
    'bright-day': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.6 
      },
      hemisphereLight: { 
        skyColor: '#87CEEB', 
        groundColor: '#f0f0f0', 
        intensity: 0.7,
        position: [0, ceilingY, 0]
      },
      pointLights: [
        { 
          position: [corner1X, ceilingY, corner1Z], 
          color: '#ffffff', 
          intensity: 1.8, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner2X, ceilingY, corner2Z], 
          color: '#ffffff', 
          intensity: 1.8, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner3X, ceilingY, corner3Z], 
          color: '#ffffff', 
          intensity: 1.8, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner4X, ceilingY, corner4Z], 
          color: '#ffffff', 
          intensity: 1.8, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [centerX, ceilingY, centerZ], 
          color: '#f5f5f5', 
          intensity: 2.2, 
          distance: lightDistance * 1.2, 
          decay: 2,
          castShadow: true 
        },
      ]
    },
    
    'cozy-night': {
      ambientLight: { 
        color: '#ffd699', 
        intensity: 0.15 
      },
      hemisphereLight: { 
        skyColor: '#ffd699', 
        groundColor: '#4a3728', 
        intensity: 0.2,
        position: [0, ceilingY, 0]
      },
      pointLights: [
        { 
          position: [corner1X, ceilingY, corner1Z], 
          color: '#ffb366', 
          intensity: 0.8, 
          distance: lightDistance * 0.7, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner3X, ceilingY, corner3Z], 
          color: '#ffb366', 
          intensity: 0.8, 
          distance: lightDistance * 0.7, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [centerX, ceilingY - 0.5, centerZ], 
          color: '#ffcc80', 
          intensity: 1.0, 
          distance: lightDistance * 0.6, 
          decay: 2,
          castShadow: true 
        },
      ]
    },
    
    'studio-neutral': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.4 
      },
      hemisphereLight: { 
        skyColor: '#ffffff', 
        groundColor: '#cccccc', 
        intensity: 0.5,
        position: [0, ceilingY, 0]
      },
      pointLights: [
        { 
          position: [corner1X, ceilingY, corner1Z], 
          color: '#ffffff', 
          intensity: 1.4, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner2X, ceilingY, corner2Z], 
          color: '#ffffff', 
          intensity: 1.4, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner3X, ceilingY, corner3Z], 
          color: '#ffffff', 
          intensity: 1.4, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner4X, ceilingY, corner4Z], 
          color: '#ffffff', 
          intensity: 1.4, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [centerX, ceilingY, centerZ], 
          color: '#ffffff', 
          intensity: 1.8, 
          distance: lightDistance * 1.2, 
          decay: 2,
          castShadow: true 
        },
      ]
    },
    
    'sunset': {
      ambientLight: { 
        color: '#ffcc99', 
        intensity: 0.25 
      },
      hemisphereLight: { 
        skyColor: '#ff9966', 
        groundColor: '#8B6347', 
        intensity: 0.35,
        position: [0, ceilingY, 0]
      },
      pointLights: [
        { 
          position: [corner1X, ceilingY, corner1Z], 
          color: '#ff9966', 
          intensity: 1.0, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner2X, ceilingY, corner2Z], 
          color: '#ffaa77', 
          intensity: 1.0, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner3X, ceilingY, corner3Z], 
          color: '#ff9966', 
          intensity: 1.0, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [corner4X, ceilingY, corner4Z], 
          color: '#ffaa77', 
          intensity: 1.0, 
          distance: lightDistance, 
          decay: 2,
          castShadow: true 
        },
        { 
          position: [centerX, ceilingY, centerZ], 
          color: '#ffbb88', 
          intensity: 1.3, 
          distance: lightDistance * 1.2, 
          decay: 2,
          castShadow: true 
        },
      ]
    },
  };
  
  return configs[preset] || null;
}

/**
 * Get furniture lighting configuration based on preset
 * @param {string} preset - The lighting preset name
 * @returns {object} Lighting configuration
 */
export function getFurnitureLightingConfig(preset) {
  const configs = {
    'default': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.1 
      },
      directionalLight: { 
        color: '#fff1e0', 
        position: [5, 10, 7], 
        intensity: 1.8,
        castShadow: true,
        shadowMapSize: [2048, 2048]
      }
    },
    
    'bright': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.3 
      },
      directionalLight: { 
        color: '#ffffff', 
        position: [5, 10, 7], 
        intensity: 2.5,
        castShadow: true,
        shadowMapSize: [2048, 2048]
      }
    },
    
    'soft': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.4 
      },
      directionalLight: { 
        color: '#fff5e6', 
        position: [5, 10, 7], 
        intensity: 1.2,
        castShadow: true,
        shadowMapSize: [2048, 2048]
      }
    },
    
    'dramatic': {
      ambientLight: { 
        color: '#ffffff', 
        intensity: 0.05 
      },
      directionalLight: { 
        color: '#ffffff', 
        position: [8, 15, 10], 
        intensity: 3.0,
        castShadow: true,
        shadowMapSize: [2048, 2048]
      }
    },
  };
  
  return configs[preset] || configs['default'];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate bounding box of a room model
 * @param {THREE.Object3D} roomScene - The room 3D object
 * @returns {object} Room bounds with min, max, and center coordinates
 */
export function calculateRoomBounds(roomScene) {
  const box = new THREE.Box3().setFromObject(roomScene);
  
  return {
    minX: box.min.x,
    maxX: box.max.x,
    minY: box.min.y,
    maxY: box.max.y,
    minZ: box.min.z,
    maxZ: box.max.z,
    centerX: (box.min.x + box.max.x) / 2,
    centerY: (box.min.y + box.max.y) / 2,
    centerZ: (box.min.z + box.max.z) / 2,
  };
}

// ============================================
// REACT COMPONENTS
// ============================================

/**
 * RoomLights Component - Renders lighting specifically for room.glb
 * @param {object} props
 * @param {string} props.preset - The lighting preset name
 * @param {object} props.roomBounds - Room boundaries
 * @param {number} props.intensityMultiplier - Multiplier for all light intensities (default: 1.0)
 */
export function RoomLights({ preset, roomBounds, intensityMultiplier = 1.0 }) {
  if (preset === 'off' || !roomBounds) return null;
  
  const config = getRoomLightingConfig(preset, roomBounds);
  if (!config) return null;
  
  return (
    <>
      {/* Ambient light for room */}
      <ambientLight 
        color={config.ambientLight.color}
        intensity={config.ambientLight.intensity * intensityMultiplier}
      />
      
      {/* Hemisphere light for ceiling/floor color bounce */}
      {config.hemisphereLight && (
        <hemisphereLight
          color={config.hemisphereLight.skyColor}
          groundColor={config.hemisphereLight.groundColor}
          intensity={config.hemisphereLight.intensity * intensityMultiplier}
          position={config.hemisphereLight.position}
        />
      )}
      
      {/* Point lights positioned around the room */}
      {config.pointLights.map((light, index) => (
        <pointLight
          key={`room-light-${index}`}
          position={light.position}
          color={light.color}
          intensity={light.intensity * intensityMultiplier}
          distance={light.distance}
          decay={light.decay}
          castShadow={light.castShadow}
        />
      ))}
    </>
  );
}

/**
 * FurnitureLights Component - Renders lighting for furniture items
 * @param {object} props
 * @param {string} props.preset - The lighting preset name
 * @param {number} props.intensityMultiplier - Multiplier for all light intensities (default: 1.0)
 */
export function FurnitureLights({ preset, intensityMultiplier = 1.0 }) {
  const config = getFurnitureLightingConfig(preset);
  
  return (
    <>
      {/* Ambient light for furniture */}
      <ambientLight 
        color={config.ambientLight.color}
        intensity={config.ambientLight.intensity * intensityMultiplier}
      />
      
      {/* Directional light for furniture (main light source) */}
      <directionalLight
        color={config.directionalLight.color}
        position={config.directionalLight.position}
        intensity={config.directionalLight.intensity * intensityMultiplier}
        castShadow={config.directionalLight.castShadow}
        shadow-mapSize-width={config.directionalLight.shadowMapSize[0]}
        shadow-mapSize-height={config.directionalLight.shadowMapSize[1]}
      />
    </>
  );
}