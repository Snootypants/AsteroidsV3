import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { 
  WORLD, 
  VISIBLE_HEIGHT, 
  RENDERER_SETTINGS, 
  POSTPROCESSING, 
  LIGHTING, 
  FOG,
  STARFIELD 
} from '../constants/gameConstants';
import { generateStarBrightness, rand } from '../utils/mathUtils';

export interface ThreeSceneRefs {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  outlineTargets: THREE.Object3D[];
  outlinePass: OutlinePass;
  warpEffect: {
    active: boolean;
    progress: number;
    direction: { x: number; y: number };
  };
  currentStars: THREE.Points | null;
}

export interface ThreeSceneHook {
  mountRef: React.RefObject<HTMLDivElement>;
  sceneRefs: React.RefObject<ThreeSceneRefs>;
  
  // Camera controls
  setCameraFollow: (target: THREE.Object3D | null) => void;
  addCameraShake: (magnitude: number, duration: number, originX?: number, originY?: number) => void;
  updateZoom: (zoom: number) => void;
  
  // Starfield effects
  makeStars: () => void;
  startWarpEffect: (direction: { x: number; y: number }) => void;
  
  // Outline system
  addOutlineTarget: (object: THREE.Object3D) => void;
  removeOutlineTarget: (object: THREE.Object3D) => void;
  
  // Scene management
  addToScene: (object: THREE.Object3D) => void;
  removeFromScene: (object: THREE.Object3D) => void;
  
  // Update loop
  update: (deltaTime: number, gameState: { paused: boolean; gameOver: boolean }) => void;
}

// Exact vignette shader from vanilla
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: POSTPROCESSING.vignette.offset },
    darkness: { value: POSTPROCESSING.vignette.darkness },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = vUv - 0.5;
      float vignette = smoothstep(0.8, offset, length(uv));
      gl_FragColor = vec4(texel.rgb * (1.0 - vignette * darkness), texel.a);
    }
  `
};

export const useThreeScene = (): ThreeSceneHook => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<ThreeSceneRefs | null>(null);
  const cameraFollowTarget = useRef<THREE.Object3D | null>(null);
  const shakeState = useRef({ time: 0, magnitude: 0 });
  
  // Initialize Three.js scene with exact vanilla settings
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Renderer setup (exact vanilla settings)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: RENDERER_SETTINGS.antialias, 
      alpha: RENDERER_SETTINGS.alpha 
    });
    renderer.setPixelRatio(RENDERER_SETTINGS.pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = RENDERER_SETTINGS.toneMappingExposure;
    renderer.setClearColor(RENDERER_SETTINGS.clearColor, RENDERER_SETTINGS.clearAlpha);
    renderer.domElement.id = 'game-canvas';
    
    // Camera setup (exact vanilla calculations)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = VISIBLE_HEIGHT;
    const frustumWidth = frustumHeight * aspect;
    
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      100
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1.0;
    camera.updateProjectionMatrix();
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG.color, FOG.density);
    
    // Lighting setup (exact vanilla configuration)
    const keyLight = new THREE.PointLight(
      LIGHTING.key.color, 
      LIGHTING.key.intensity, 
      LIGHTING.key.distance
    );
    keyLight.position.set(...LIGHTING.key.position);
    scene.add(keyLight);
    
    const ambientLight = new THREE.AmbientLight(
      LIGHTING.ambient.color, 
      LIGHTING.ambient.intensity
    );
    scene.add(ambientLight);
    
    const hemisphereLight = new THREE.HemisphereLight(
      LIGHTING.hemisphere.skyColor,
      LIGHTING.hemisphere.groundColor,
      LIGHTING.hemisphere.intensity
    );
    scene.add(hemisphereLight);
    
    const fillLight = new THREE.DirectionalLight(
      LIGHTING.fill.color,
      LIGHTING.fill.intensity
    );
    fillLight.position.set(...LIGHTING.fill.position);
    scene.add(fillLight);
    
    // Postprocessing pipeline (exact vanilla setup)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // Outline pass
    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    outlinePass.edgeStrength = POSTPROCESSING.outline.edgeStrength;
    outlinePass.edgeGlow = POSTPROCESSING.outline.edgeGlow;
    outlinePass.edgeThickness = POSTPROCESSING.outline.edgeThickness;
    outlinePass.pulsePeriod = POSTPROCESSING.outline.pulsePeriod;
    outlinePass.visibleEdgeColor.set(POSTPROCESSING.outline.visibleEdgeColor);
    outlinePass.hiddenEdgeColor.set(POSTPROCESSING.outline.hiddenEdgeColor);
    composer.addPass(outlinePass);
    
    // Bloom pass
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      POSTPROCESSING.bloom.strength,
      POSTPROCESSING.bloom.radius,
      POSTPROCESSING.bloom.threshold
    );
    bloom.threshold = POSTPROCESSING.bloom.threshold;
    bloom.strength = POSTPROCESSING.bloom.strength;
    bloom.radius = POSTPROCESSING.bloom.radius;
    composer.addPass(bloom);
    
    // Vignette pass
    const vignettePass = new ShaderPass(VignetteShader);
    composer.addPass(vignettePass);
    
    // Initialize scene refs
    sceneRefs.current = {
      scene,
      camera,
      renderer,
      composer,
      outlineTargets: [],
      outlinePass,
      warpEffect: {
        active: false,
        progress: 0,
        direction: { x: 0, y: 1 }
      },
      currentStars: null
    };
    
    mountRef.current.appendChild(renderer.domElement);
    
    // Create initial starfield
    makeStarsInternal();
    
    console.log('[Framework] Three.js scene initialized');
    
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  
  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!sceneRefs.current) return;
      
      const { camera, renderer, composer, outlinePass } = sceneRefs.current;
      const aspect = window.innerWidth / window.innerHeight;
      const frustumHeight = VISIBLE_HEIGHT;
      const frustumWidth = frustumHeight * aspect;
      
      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      outlinePass.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Internal starfield creation (exact vanilla implementation)
  const makeStarsInternal = useCallback(() => {
    if (!sceneRefs.current) return;
    
    const { scene } = sceneRefs.current;
    
    // Remove existing stars
    if (sceneRefs.current.currentStars) {
      scene.remove(sceneRefs.current.currentStars);
    }
    
    const geometry = new THREE.BufferGeometry();
    const count = STARFIELD.count;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const driftVelocities = new Float32Array(count * 2); // vx, vy for each star
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * WORLD.width * STARFIELD.widthMultiplier;
      positions[i * 3 + 1] = (Math.random() - 0.5) * WORLD.height * STARFIELD.heightMultiplier;
      positions[i * 3 + 2] = STARFIELD.depthMin + Math.random() * (STARFIELD.depthMax - STARFIELD.depthMin);
      
      sizes[i] = STARFIELD.sizeMin + Math.random() * (STARFIELD.sizeMax - STARFIELD.sizeMin);
      
      const brightness = generateStarBrightness();
      colors[i * 3 + 0] = 0.67 * brightness; // R component (blue-white)
      colors[i * 3 + 1] = 0.8 * brightness;  // G component  
      colors[i * 3 + 2] = 1.0 * brightness;  // B component (strongest for blue-white)
      
      // Calculate drift velocity based on depth - closer stars drift faster
      const depth = positions[i * 3 + 2]; // Z position
      const driftSpeed = THREE.MathUtils.mapLinear(depth, STARFIELD.depthMin, STARFIELD.depthMax, 0.1, 0.5);
      driftVelocities[i * 2 + 0] = rand(-driftSpeed, driftSpeed); // vx
      driftVelocities[i * 2 + 1] = rand(-driftSpeed, driftSpeed); // vy
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 1.5,
      color: 0xddffff,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      vertexColors: true
    });
    
    const stars = new THREE.Points(geometry, material);
    stars.userData.kind = 'stars';
    stars.userData.originalPositions = positions.slice();
    stars.userData.driftVelocities = driftVelocities;
    stars.renderOrder = -1; // Render behind everything
    scene.add(stars);
    
    sceneRefs.current.currentStars = stars;
    console.log('[Framework] Stars generated:', count);
  }, []);
  
  // Warp effect system
  const updateWarpEffect = useCallback((deltaTime: number) => {
    if (!sceneRefs.current?.warpEffect.active || !sceneRefs.current.currentStars) return;
    
    const { warpEffect, currentStars } = sceneRefs.current;
    warpEffect.progress += deltaTime * 3.0;
    
    const positions = currentStars.geometry.attributes.position;
    const originalPositions = currentStars.userData.originalPositions;
    
    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const origX = originalPositions[i3];
      const origY = originalPositions[i3 + 1];
      const origZ = originalPositions[i3 + 2];
      
      if (warpEffect.progress < 1.0) {
        const stretchFactor = warpEffect.progress * 25;
        const newX = origX + warpEffect.direction.x * stretchFactor;
        const newY = origY + warpEffect.direction.y * stretchFactor;
        
        positions.setXYZ(i, newX, newY, origZ);
      }
    }
    
    positions.needsUpdate = true;
    
    if (warpEffect.progress < 1.0) {
      const material = currentStars.material as THREE.PointsMaterial;
      material.opacity = 0.8 + (warpEffect.progress * 0.4);
    }
    
    if (warpEffect.progress >= 1.0) {
      warpEffect.active = false;
      console.log('[Framework] Warp effect complete');
      setTimeout(() => makeStarsInternal(), 100);
    }
  }, [makeStarsInternal]);
  
  // Starfield drift system for subtle parallax movement
  const updateStarfieldDrift = useCallback((deltaTime: number) => {
    if (!sceneRefs.current?.currentStars || sceneRefs.current.warpEffect.active) return;
    
    const { currentStars } = sceneRefs.current;
    const positions = currentStars.geometry.attributes.position;
    const driftVelocities = currentStars.userData.driftVelocities;
    
    if (!driftVelocities) return;
    
    // World bounds for wrapping (extended beyond game world for seamless effect)
    const boundX = WORLD.width * STARFIELD.widthMultiplier * 0.5;
    const boundY = WORLD.height * STARFIELD.heightMultiplier * 0.5;
    
    for (let i = 0; i < positions.count; i++) {
      // Get current position
      let x = positions.getX(i);
      let y = positions.getY(i);
      
      // Apply drift velocity
      x += driftVelocities[i * 2 + 0] * deltaTime;
      y += driftVelocities[i * 2 + 1] * deltaTime;
      
      // Wrap around world bounds
      if (x > boundX) x = -boundX;
      if (x < -boundX) x = boundX;
      if (y > boundY) y = -boundY;
      if (y < -boundY) y = boundY;
      
      // Update position
      positions.setXY(i, x, y);
    }
    
    positions.needsUpdate = true;
  }, []);
  
  // Camera shake system (exact vanilla implementation)
  const updateCameraShake = useCallback((deltaTime: number) => {
    if (!sceneRefs.current) return;
    
    const { camera } = sceneRefs.current;
    const shake = shakeState.current;
    
    if (shake.time > 0) {
      shake.time -= deltaTime;
      const t = Math.random() * Math.PI * 2;
      const shakeX = Math.cos(t) * shake.magnitude;
      const shakeY = Math.sin(t) * shake.magnitude;
      
      if (cameraFollowTarget.current) {
        camera.position.x = cameraFollowTarget.current.position.x + shakeX;
        camera.position.y = cameraFollowTarget.current.position.y + shakeY;
      } else {
        camera.position.x = shakeX;
        camera.position.y = shakeY;
      }
    } else if (cameraFollowTarget.current) {
      // Normal following when not shaking
      camera.position.x = cameraFollowTarget.current.position.x;
      camera.position.y = cameraFollowTarget.current.position.y;
    }
  }, []);
  
  // Hook interface
  const setCameraFollow = useCallback((target: THREE.Object3D | null) => {
    cameraFollowTarget.current = target;
  }, []);
  
  const addCameraShake = useCallback((magnitude: number, duration: number, originX?: number, originY?: number) => {
    let adjustedMagnitude = magnitude * 0.35; // Global reduction like vanilla
    
    // Distance falloff if origin provided
    if (originX !== undefined && originY !== undefined && cameraFollowTarget.current) {
      const dx = originX - cameraFollowTarget.current.position.x;
      const dy = originY - cameraFollowTarget.current.position.y;
      const dist = Math.hypot(dx, dy);
      const maxRadius = Math.hypot(WORLD.width * 0.5, WORLD.height * 0.5);
      const falloff = Math.max(0, 1 - dist / maxRadius);
      adjustedMagnitude *= falloff * 0.9;
    }
    
    if (adjustedMagnitude <= 0.001) return;
    
    const shake = shakeState.current;
    shake.magnitude = Math.max(shake.magnitude, adjustedMagnitude);
    shake.time = Math.max(shake.time, duration * 0.8);
  }, []);
  
  const updateZoom = useCallback((zoom: number) => {
    if (!sceneRefs.current) return;
    sceneRefs.current.camera.zoom = zoom;
    sceneRefs.current.camera.updateProjectionMatrix();
  }, []);
  
  const makeStars = useCallback(() => {
    makeStarsInternal();
  }, [makeStarsInternal]);
  
  const startWarpEffect = useCallback((direction: { x: number; y: number }) => {
    if (!sceneRefs.current) return;
    
    sceneRefs.current.warpEffect.active = true;
    sceneRefs.current.warpEffect.progress = 0;
    sceneRefs.current.warpEffect.direction = direction;
  }, []);
  
  const addOutlineTarget = useCallback((object: THREE.Object3D) => {
    if (!sceneRefs.current) return;
    sceneRefs.current.outlineTargets.push(object);
    sceneRefs.current.outlinePass.selectedObjects = sceneRefs.current.outlineTargets;
  }, []);
  
  const removeOutlineTarget = useCallback((object: THREE.Object3D) => {
    if (!sceneRefs.current) return;
    const index = sceneRefs.current.outlineTargets.indexOf(object);
    if (index >= 0) {
      sceneRefs.current.outlineTargets.splice(index, 1);
      sceneRefs.current.outlinePass.selectedObjects = sceneRefs.current.outlineTargets;
    }
  }, []);
  
  const addToScene = useCallback((object: THREE.Object3D) => {
    if (!sceneRefs.current) return;
    sceneRefs.current.scene.add(object);
  }, []);
  
  const removeFromScene = useCallback((object: THREE.Object3D) => {
    if (!sceneRefs.current) return;
    sceneRefs.current.scene.remove(object);
  }, []);
  
  const update = useCallback((deltaTime: number, _gameState: { paused: boolean; gameOver: boolean }) => {
    updateWarpEffect(deltaTime);
    updateStarfieldDrift(deltaTime); // Always update drift for ambient feel
    updateCameraShake(deltaTime);
    
    // Update outline targets
    if (sceneRefs.current) {
      sceneRefs.current.outlinePass.selectedObjects = sceneRefs.current.outlineTargets;
    }
  }, [updateWarpEffect, updateStarfieldDrift, updateCameraShake]);
  
  return {
    mountRef,
    sceneRefs,
    setCameraFollow,
    addCameraShake,
    updateZoom,
    makeStars,
    startWarpEffect,
    addOutlineTarget,
    removeOutlineTarget,
    addToScene,
    removeFromScene,
    update,
  };
};