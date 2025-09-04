# React Game Framework PRD - Asteroids-Optimized

## Executive Summary
Build a React-based game framework specifically designed for arcade-style games with Three.js rendering, complex entity management, upgrade systems, and overlay-based UI. The framework should support the patterns identified in the working Asteroids implementation while providing clean React paradigms.

## Architecture Requirements

### Core Framework Structure
```
<GameProvider>
  <ThreeJSRenderer>
    <EntityManager />
    <ParticleSystem />
    <PostProcessing />
  </ThreeJSRenderer>
  <GameUI>
    <HUD />
    <OverlayManager />
    <StatusConsole />
  </GameUI>
</GameProvider>
```

### 1. Game State Management

**Primary State Object:**
```typescript
interface GameState {
  // Core game state
  score: number;
  wave: number;
  gameOver: boolean;
  paused: boolean;
  pausedForUpgrade: boolean;
  
  // Player state
  invuln: number;
  combo: number;
  comboTimer: number;
  
  // Currency system (4 types)
  currencies: {
    salvage: number;
    gold: number;
    platinum: number;
    adamantium: number;
  };
  
  // Modification system
  mods: {
    fireRateMul: number;
    engineMul: number;
    spread: false | true | 'wide';
    pierce: false | true | 'super' | 'ultra';
    shields: number;
    ricochet: number;
    drones: number;
    magnet?: number;
    magnetLvl?: number;
  };
  
  // UI state
  currentOverlay: 'start' | 'upgrade' | 'hangar' | 'pause' | 'gameover' | null;
  upgradeHistory: Upgrade[];
  rerollCount: number;
}
```

**State Management Hook:**
```jsx
const useGameState = () => {
  const [state, setState] = useState(initialGameState);
  
  // Atomic update functions
  const addCurrency = (type: string, amount: number) => {
    setState(prev => ({
      ...prev,
      currencies: { ...prev.currencies, [type]: prev.currencies[type] + amount }
    }));
  };
  
  const applyUpgrade = (upgrade: Upgrade) => {
    setState(prev => ({
      ...prev,
      mods: { ...prev.mods, ...upgrade.apply() },
      upgradeHistory: [upgrade, ...prev.upgradeHistory].slice(0, 8)
    }));
  };
  
  return { state, setState, addCurrency, applyUpgrade };
};
```

### 2. Three.js Integration Layer

**Scene Management Hook:**
```jsx
const useThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
  }>();
  
  useEffect(() => {
    // Initialize Three.js exactly like vanilla implementation
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    
    // Your exact camera setup
    const WORLD = { width: 750, height: 498 };
    const VISIBLE_HEIGHT = WORLD.height / 5;
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = VISIBLE_HEIGHT;
    const frustumWidth = VISIBLE_HEIGHT * aspect;
    
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2, frustumWidth / 2,
      frustumHeight / 2, -frustumHeight / 2,
      0.1, 100
    );
    
    // Your exact postprocessing pipeline
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const outlinePass = new OutlinePass(/* your exact settings */);
    const bloom = new UnrealBloomPass(/* your exact settings */);
    const vignettePass = new ShaderPass(/* your exact vignette shader */);
    
    composer.addPass(outlinePass);
    composer.addPass(bloom);
    composer.addPass(vignettePass);
    
    // Your exact lighting setup
    const key = new THREE.PointLight(0x6688ff, 1.4, 220);
    const ambient = new THREE.AmbientLight(0x334455, 0.85);
    // etc...
    
    sceneRef.current = { scene, camera, renderer, composer };
    mountRef.current?.appendChild(renderer.domElement);
    
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);
  
  return { mountRef, scene: sceneRef.current };
};
```

### 3. Entity Management System

**Entity Pool Hook:**
```jsx
const useEntityPool = <T extends THREE.Object3D>(
  createFn: () => T,
  poolSize: number = 100
) => {
  const pool = useRef<T[]>([]);
  const active = useRef<Set<T>>(new Set());
  
  const spawn = useCallback((...args: any[]) => {
    let entity = pool.current.pop();
    if (!entity) {
      entity = createFn();
    }
    
    // Reset entity state
    entity.visible = true;
    active.current.add(entity);
    
    return entity;
  }, [createFn]);
  
  const despawn = useCallback((entity: T) => {
    entity.visible = false;
    active.current.delete(entity);
    pool.current.push(entity);
  }, []);
  
  return { spawn, despawn, active: Array.from(active.current) };
};
```

**Entity Manager Component:**
```jsx
const EntityManager = ({ gameState, onCollision }) => {
  const { scene } = useContext(ThreeSceneContext);
  
  const bullets = useEntityPool(() => createBullet(), 200);
  const asteroids = useEntityPool(() => createAsteroid('large'), 100);
  const enemies = useEntityPool(() => createHunter(), 20);
  const pickups = useEntityPool(() => createPickup('salvage'), 50);
  
  // Your exact update logic in useEffect with requestAnimationFrame
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now() / 1000;
    
    const gameLoop = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(now - lastTime, 0.033);
      lastTime = now;
      
      if (!gameState.paused && !gameState.gameOver) {
        // Update all entities using your exact logic
        updateBullets(dt, bullets.active);
        updateAsteroids(dt, asteroids.active);
        updateEnemies(dt, enemies.active);
        updatePickups(dt, pickups.active);
        
        // Your exact collision detection
        checkCollisions(bullets.active, asteroids.active, enemies.active);
      }
      
      frameId = requestAnimationFrame(gameLoop);
    };
    
    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState.paused, gameState.gameOver]);
  
  return null; // This component only manages entities, doesn't render UI
};
```

### 4. Overlay System

**Overlay Manager:**
```jsx
const OverlayManager = ({ currentOverlay, gameState, onUpgrade, onShopPurchase }) => {
  const overlayComponents = {
    start: <StartScreen />,
    upgrade: <UpgradeScreen onUpgrade={onUpgrade} />,
    hangar: <HangarShop onPurchase={onShopPurchase} currencies={gameState.currencies} />,
    pause: <PauseMenu />,
    gameover: <GameOverScreen score={gameState.score} />
  };
  
  return (
    <div className="overlay-container">
      {Object.entries(overlayComponents).map(([key, component]) => (
        <div 
          key={key}
          className={`overlay ${currentOverlay === key ? 'show' : 'hide'}`}
          hidden={currentOverlay !== key}
        >
          {component}
        </div>
      ))}
    </div>
  );
};
```

### 5. Constants & Configuration

**Game Constants (your exact values):**
```jsx
export const GAME_CONSTANTS = {
  WORLD: { width: 750, height: 498 },
  VISIBLE_HEIGHT: 99.6,
  
  PLAYER: {
    accel: 40,
    maxSpeed: 40,
    friction: 0.98,
    turn: 3.2,
    fireRate: 0.16,
    radius: 1.5
  },
  
  ASTEROIDS: {
    large: { r: 6, score: 20, next: 'medium', count: 2 },
    medium: { r: 3.5, score: 50, next: 'small', count: 2 },
    small: { r: 2.0, score: 100, next: null, count: 0 },
    baseSpeed: 8,
  },
  
  BULLET: { speed: 70, life: 1.1, r: 0.2 },
  
  ENEMY: {
    radius: 1.2,
    accel: 20,
    maxSpeed: 26,
    fireRate: 0.9,
    bulletSpeed: 55,
    bulletLife: 1.6,
    score: 150,
    preferredDist: 14,
  },
  
  COMBO_TIMER: 2.3,
  COMBO_DECAY: 0.25,
  INVULN_SPAWN: 2.0,
  INVULN_WAVE: 3.0,
  INVULN_HIT: 1.0,
};
```

## Implementation Plan for Claude Code

### Phase 1: Core Framework (Blocks 1-3)
```
Block 1: Game State Management
- Implement useGameState hook with exact state structure
- Currency management functions
- Mod application system
- State persistence patterns

Block 2: Three.js Integration Layer  
- useThreeScene hook with exact renderer setup
- Camera following with shake system
- Postprocessing pipeline (bloom, outline, vignette)
- Resize handling

Block 3: Entity Management System
- useEntityPool hook for object pooling
- Entity lifecycle management
- Collision detection system
- World wrapping utilities
```

### Phase 2: UI Framework (Blocks 4-6)
```
Block 4: Overlay System
- OverlayManager component
- Overlay transition system
- Canvas blur effects
- Common overlay patterns

Block 5: HUD Components
- CurrencyDisplay with glass effects
- UpgradeHistory stack
- Minimap with tactical display
- StatusConsole with debug features

Block 6: Interactive Components  
- UpgradeCard with 3D rotation
- ShopCard with purchase logic
- RaritySystem for styling
- Keyboard shortcut handling
```

### Phase 3: Game-Specific Systems (Blocks 7-9)
```
Block 7: Audio System
- SFX hook with Web Audio API
- Volume/mute controls
- Your exact frequency/waveform definitions
- Storage persistence

Block 8: Input Management
- Keyboard/mouse input hooks
- Mouse aiming system with reticle
- Input state management
- Control mode switching

Block 9: Particle & VFX Systems
- ParticleSystem component
- DebrisSystem component  
- Warp effect system
- Visual feedback patterns
```

## Acceptance Criteria

### Framework Completeness
- [ ] Drop-in replacement for vanilla Three.js setup
- [ ] All 16 upgrade types supported with rarity system
- [ ] 4-currency system with exact drop rates
- [ ] Overlay system with transitions matching vanilla
- [ ] Entity pooling with performance matching vanilla
- [ ] Audio system with all 9 SFX types
- [ ] Input handling supporting both keyboard and mouse modes

### Developer Experience
- [ ] TypeScript definitions for all interfaces
- [ ] Hot reload support during development
- [ ] Debug console integration
- [ ] Easy entity creation/destruction APIs
- [ ] State inspection tools

### Performance Requirements
- [ ] 60 FPS with 200+ entities on screen
- [ ] Memory stable (no leaks from entity pools)
- [ ] Startup time under 2 seconds
- [ ] Bundle size optimized for game assets

### Compatibility
- [ ] Works with Vite development setup
- [ ] Supports asset loading from public/ directory
- [ ] No external dependencies beyond Three.js and React
- [ ] Mobile-responsive design patterns

## Deliverables

1. **Core framework package** (`src/framework/`)
2. **Example game implementation** (basic asteroids using the framework)
3. **TypeScript definitions** for all APIs
4. **Documentation** with migration guide from vanilla
5. **Development setup** with Vite configuration

## Success Metrics

- Framework reduces game development from 2100 lines to under 800 lines
- Entity management code becomes declarative instead of imperative
- UI state and game logic cleanly separated
- New features can be added without touching core systems
- Framework can support other arcade games (Pac-Man, Space Invaders, etc.)

---

**Bottom Line:** This PRD would have Claude Code build the framework first, then you rebuild your game cleanly within that framework instead of trying to port the existing implementation. The framework preserves all your patterns while providing React-native APIs.
