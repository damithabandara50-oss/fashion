import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, Search, X, Code, Sparkles, SlidersHorizontal, ChevronRight, ZoomIn, ZoomOut, ArrowRight, Layers, Cpu, PaintBucket } from 'lucide-react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Environment, ContactShadows, PresentationControls, Float, MeshDistortMaterial, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- Custom GLSL Shader for Liquid Glass Background ---
const LiquidBackgroundMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#050505'),
    uResolution: new THREE.Vector2()
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      
      // Fluid distortion
      float noise1 = snoise(uv * 3.0 + uTime * 0.2);
      float noise2 = snoise(uv * 2.0 - uTime * 0.15);
      
      uv.x += noise1 * 0.1;
      uv.y += noise2 * 0.1;
      
      // Radial gradient based on distorted UV
      float dist = distance(uv, vec2(0.5));
      float intensity = smoothstep(0.8, 0.0, dist);
      
      // Mix base dark color with the theme color
      vec3 baseColor = vec3(0.02, 0.02, 0.02);
      vec3 finalColor = mix(baseColor, uColor, intensity * 0.5);
      
      // Add glass-like refractive highlights that move with time
      float h1x = 0.4 + sin(uTime * 0.5) * 0.15;
      float h1y = 0.3 + cos(uTime * 0.3) * 0.15;
      float highlight = smoothstep(0.4, 0.0, distance(uv, vec2(h1x, h1y))) * 0.5;
      
      float h2x = 0.6 + cos(uTime * 0.4) * 0.15;
      float h2y = 0.7 + sin(uTime * 0.6) * 0.15;
      float highlight2 = smoothstep(0.5, 0.0, distance(uv, vec2(h2x, h2y))) * 0.3;
      
      finalColor += (highlight + highlight2) * uColor;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ LiquidBackgroundMaterial });

function LiquidBackgroundScene({ themeColor }: { themeColor: string }) {
  const materialRef = useRef<any>();
  const targetColor = useMemo(() => new THREE.Color(themeColor), [themeColor]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uColor.lerp(targetColor, 0.05);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[4, 4]} />
      {/* @ts-ignore */}
      <liquidBackgroundMaterial ref={materialRef} />
    </mesh>
  );
}

function LiquidBackground({ themeColor }: { themeColor: string }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <LiquidBackgroundScene themeColor={themeColor} />
      </Canvas>
    </div>
  );
}

// --- Data ---
const FASHION_ITEMS = [
  {
    id: '1',
    name: 'Crimson Aether Gown',
    designer: 'House of Veles',
    price: '$4,200',
    color: '#991b1b', // Red
    materialType: 'liquid-satin',
    thumbnail: 'https://images.unsplash.com/photo-1566160983987-14c59415cbce?q=80&w=400&auto=format&fit=crop',
    description: 'A fluid, gravity-defying gown woven from smart-silk. The fabric adapts to ambient temperature, shifting its crimson hue dynamically.',
  },
  {
    id: '2',
    name: 'Cobalt Nexus Jacket',
    designer: 'Aero Dynamics',
    price: '$2,850',
    color: '#1e3a8a', // Blue
    materialType: 'matte-cotton',
    thumbnail: 'https://images.unsplash.com/photo-1550614000-4b95d466f168?q=80&w=400&auto=format&fit=crop',
    description: 'Structured yet weightless. This jacket features micro-actuators that maintain its sharp silhouette regardless of movement.',
  },
  {
    id: '3',
    name: 'Viridian Silk Suit',
    designer: 'Eco Luxe',
    price: '$3,100',
    color: '#064e3b', // Green
    materialType: 'silk',
    thumbnail: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=400&auto=format&fit=crop',
    description: 'Tailored perfection. The viridian threads are infused with bioluminescent algae that emit a soft glow in low light.',
  },
  {
    id: '4',
    name: 'Obsidian Void Coat',
    designer: 'Noir Tech',
    price: '$5,500',
    color: '#111111', // Dark Gray/Black
    materialType: 'obsidian',
    thumbnail: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&auto=format&fit=crop',
    description: 'An overcoat that absorbs 99% of visible light. It creates a striking silhouette that seems to cut a hole in reality itself.',
  },
];

// --- 3D Components ---

function CameraController({ isZoomed }: { isZoomed: boolean }) {
  const { camera } = useThree();
  useFrame(() => {
    const targetZ = isZoomed ? 3.5 : 6;
    const targetY = isZoomed ? 0.5 : 0;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
  });
  return null;
}

function Mannequin() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      // Subtle torso breathing
      const torso = group.current.children[2]; // Index 2 is the Torso mesh
      if (torso) {
        const t = state.clock.elapsedTime;
        torso.scale.set(1, 1 + Math.sin(t * 2) * 0.01, 1 + Math.sin(t * 2) * 0.02);
      }
    }
  });

  const skinMaterial = (
    <meshPhysicalMaterial 
      color="#ffe0bd" 
      transmission={0.2} 
      opacity={1} 
      metalness={0.1} 
      roughness={0.4} 
      ior={1.4} 
      thickness={2} 
      specularIntensity={0.5} 
      clearcoat={0.1} 
    />
  );

  return (
    <group ref={group} dispose={null} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.22, 64, 64]} />
        {skinMaterial}
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 32]} />
        {skinMaterial}
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.7, 64, 64]} />
        {skinMaterial}
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.4, 0.8, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.09, 0.8, 32, 32]} />
        {skinMaterial}
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.4, 0.8, 0]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.09, 0.8, 32, 32]} />
        {skinMaterial}
      </mesh>
      {/* Left Leg */}
      <mesh position={[-0.14, -0.3, 0]} castShadow>
        <capsuleGeometry args={[0.11, 1.0, 32, 32]} />
        {skinMaterial}
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.14, -0.3, 0]} castShadow>
        <capsuleGeometry args={[0.11, 1.0, 32, 32]} />
        {skinMaterial}
      </mesh>
    </group>
  );
}

function Garment({ activeItem }: { activeItem: typeof FASHION_ITEMS[0] }) {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [morphTarget, setMorphTarget] = useState(0);

  // Trigger morph animation on item change
  useEffect(() => {
    setMorphTarget(1);
    const timeout = setTimeout(() => setMorphTarget(0), 500);
    return () => clearTimeout(timeout);
  }, [activeItem]);

  useFrame(() => {
    if (materialRef.current) {
      const targetColor = new THREE.Color(activeItem.color);
      materialRef.current.color.lerp(targetColor, 0.08);
      
      const isLiquidSatin = activeItem.materialType === 'liquid-satin';
      const isMatte = activeItem.materialType === 'matte-cotton';
      const isSilk = activeItem.materialType === 'silk';
      const isObsidian = activeItem.materialType === 'obsidian';

      // Dynamic Fabric Physics & Material Properties
      materialRef.current.roughness = THREE.MathUtils.lerp(materialRef.current.roughness, isMatte ? 0.8 : isLiquidSatin ? 0.05 : isSilk ? 0.3 : 0.1, 0.08);
      materialRef.current.metalness = THREE.MathUtils.lerp(materialRef.current.metalness, isObsidian ? 0.9 : isLiquidSatin ? 0.4 : 0.1, 0.08);
      materialRef.current.clearcoat = THREE.MathUtils.lerp(materialRef.current.clearcoat, isLiquidSatin || isObsidian ? 1.0 : 0.0, 0.08);
      
      // Distort parameters for cloth physics simulation
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, isLiquidSatin ? 0.25 : isSilk ? 0.1 : 0.02, 0.05);
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, isLiquidSatin ? 3 : 1, 0.05);
    }

    if (meshRef.current) {
      // Instant Morphing Effect (Auto-Wear)
      const currentScale = meshRef.current.scale.x;
      const targetScale = 1 + (morphTarget * 0.1);
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.15);
      meshRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow receiveShadow>
      {/* The Garment Geometry - shaped like a dress, open ended */}
      <cylinderGeometry args={[0.32, 0.48, 1.4, 64, 64, true]} />
      <MeshDistortMaterial 
        ref={materialRef}
        color={activeItem.color}
        envMapIntensity={2}
        clearcoatRoughness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// --- Pages ---

function CollectionPage({ setThemeColor }: { setThemeColor: (c: string) => void }) {
  const [activeItem, setActiveItem] = useState(FASHION_ITEMS[0]);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setThemeColor(activeItem.color);
  }, [activeItem, setThemeColor]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Content */}
      <main className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-100px)] px-4 pb-4 pt-6 gap-6">
        
        {/* Left: 3D Model Viewer (Three.js WebGL) */}
        <div className="flex-1 relative liquid-glass rounded-3xl overflow-hidden group">
          {/* Virtual Try-On Badge */}
          <div className="absolute top-6 right-6 z-20 liquid-glass-heavy px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/80">
            <Sparkles className="w-4 h-4 text-yellow-200" />
            Live 3D Render
          </div>

          {/* Zoom Control */}
          <button 
            onClick={() => setIsZoomed(!isZoomed)}
            className="absolute bottom-24 right-6 z-20 w-12 h-12 liquid-glass-heavy rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Three.js Canvas */}
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
              <fog attach="fog" args={['#050505', 5, 15]} />
              
              {/* Studio Cinematic Lighting */}
              <ambientLight intensity={0.3} />
              <spotLight position={[5, 8, 5]} angle={0.2} penumbra={1} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />
              <spotLight position={[-5, 5, -5]} angle={0.3} penumbra={1} intensity={1.5} />
              
              {/* Dynamic Aura Lighting */}
              <rectAreaLight width={4} height={4} color={activeItem.color} intensity={8} position={[3, 2, 3]} lookAt={[0, 0, 0]} />
              <rectAreaLight width={4} height={4} color="#ffffff" intensity={3} position={[-3, 0, 3]} lookAt={[0, 0, 0]} />

              <PresentationControls 
                global 
                config={{ mass: 1, tension: 170, friction: 26 }} 
                snap={{ mass: 2, tension: 300 }} 
                rotation={[0, 0, 0]} 
                polar={[-Math.PI / 6, Math.PI / 6]} 
                azimuth={[-Math.PI / 1.5, Math.PI / 1.5]}
              >
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.05, 0.05]}>
                  <Suspense fallback={null}>
                    <Garment activeItem={activeItem} />
                    <Mannequin />
                  </Suspense>
                </Float>
              </PresentationControls>

              <ContactShadows position={[0, -2.5, 0]} opacity={0.8} scale={10} blur={2.5} far={4} color={activeItem.color} />
              <Environment preset="studio" />
              
              <CameraController isZoomed={isZoomed} />
            </Canvas>
          </div>

          {/* Model Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 liquid-glass-heavy px-6 py-3 rounded-full pointer-events-none">
            <SlidersHorizontal className="w-4 h-4 text-white/60" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Drag to Rotate</span>
          </div>
        </div>

        {/* Right: Product Details & Selector */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 z-20">
          
          {/* Active Product Info */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="liquid-glass rounded-3xl p-8 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-white/50 mb-2">{activeItem.designer}</p>
                  <h2 className="text-3xl font-light tracking-tight leading-none text-glow">{activeItem.name}</h2>
                </div>
                <span className="text-xl font-light">{activeItem.price}</span>
              </div>
              
              <p className="text-sm text-white/60 leading-relaxed font-light mt-2">
                {activeItem.description}
              </p>

              <div className="mt-4 flex gap-3">
                <button 
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-medium uppercase tracking-wider text-sm hover:bg-white/90 transition-colors"
                  style={{ boxShadow: `0 0 20px ${activeItem.color}40` }}
                >
                  Add to Cart
                </button>
                <button className="w-14 h-14 liquid-glass-heavy rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Product Gallery / Selector */}
          <div className="flex-1 liquid-glass rounded-3xl p-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">More from Collection</h3>
              <span className="text-xs text-white/30">Scroll</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {FASHION_ITEMS.map((item) => (
                <motion.div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeItem.id === item.id 
                      ? 'liquid-glass-heavy border-white/30' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Active Indicator */}
                  {activeItem.id === item.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-white/50">{item.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Scrolling Content Section */}
      <section className="relative z-10 px-6 py-32 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6 text-glow">Beyond the Fabric</h2>
          <p className="text-white/60 max-w-2xl font-light text-lg">
            Experience fashion in a new dimension. Our liquid glass interface and real-time physics engine bring haute couture to your digital wardrobe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Haptic Feedback', desc: 'Feel the texture of virtual silk and obsidian through advanced haptic integration.' },
            { title: 'Adaptive Sizing', desc: 'Our AI analyzes your measurements to drape the 3D model with millimeter precision.' },
            { title: 'Sustainable Future', desc: 'Zero waste. Infinite possibilities. Try on thousands of garments without environmental impact.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8, ease: "easeOut" }}
              className="liquid-glass rounded-3xl p-10 hover:bg-white/10 transition-colors group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full liquid-glass-heavy flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-xl font-medium mb-4">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function DeliverablesPage({ setThemeColor }: { setThemeColor: (c: string) => void }) {
  useEffect(() => {
    setThemeColor('#0ea5e9'); // Sky Blue theme for tech
  }, [setThemeColor]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 px-6 py-12 max-w-7xl mx-auto min-h-screen"
    >
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4 text-glow">Technical Deliverables</h2>
        <p className="text-white/60 max-w-2xl font-light text-lg">
          Architecture, GLSL Shaders, and 3D Asset Workflows for Fluid Dynamics Luxe.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: GLB Loading Boilerplate */}
        <section className="liquid-glass rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <Code className="w-8 h-8 text-sky-400" />
            <h3 className="text-2xl font-medium">Three.js Boilerplate: Dynamic Cloth Swapping</h3>
          </div>
          <p className="text-white/70 mb-6 font-light leading-relaxed">
            To achieve seamless "Auto-Wear" without clipping, we load the base Metahuman skeleton and dynamically bind new garment meshes to it. This ensures the cloth deforms perfectly with the avatar's idle animations.
          </p>
          <div className="bg-[#0a0a0a] rounded-2xl p-6 overflow-x-auto border border-white/10">
            <pre className="text-sm font-mono text-sky-200/90">
{`import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export function AvatarWithDynamicCloth({ garmentUrl }) {
  // 1. Load Base Avatar (Metahuman Proxy)
  const { scene: avatarScene } = useGLTF('/models/metahuman_base.glb');
  
  // 2. Load Selected Garment
  const { scene: garmentScene } = useGLTF(garmentUrl);

  // 3. Merge and Bind Skeleton
  const mergedScene = useMemo(() => {
    const clone = avatarScene.clone();
    
    // Find the avatar's main skeleton/body mesh
    const bodyNode = clone.getObjectByName('Body_Mesh');
    
    // Extract the cloth mesh from the loaded garment GLB
    const clothMesh = garmentScene.getObjectByName('Cloth_Mesh');
    
    if (bodyNode && clothMesh) {
      // Bind the cloth to the avatar's skeleton for perfect deformation
      clothMesh.skeleton = bodyNode.skeleton;
      
      // Add the cloth to the avatar scene
      clone.add(clothMesh);
    }
    
    return clone;
  }, [avatarScene, garmentScene]);

  return <primitive object={mergedScene} />;
}

// Preload assets for instant swapping
useGLTF.preload('/models/metahuman_base.glb');`}
            </pre>
          </div>
        </section>

        {/* Section 2: GLSL Shader */}
        <section className="liquid-glass rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <PaintBucket className="w-8 h-8 text-sky-400" />
            <h3 className="text-2xl font-medium">GLSL Shader: Dynamic "Liquid Glass" Background</h3>
          </div>
          <p className="text-white/70 mb-6 font-light leading-relaxed">
            The background of this application is powered by a custom WebGL Fragment Shader. It uses Simplex Noise to create fluid, refractive distortions that are dynamically tinted by the <code>uColor</code> uniform (extracted from the active garment).
          </p>
          <div className="bg-[#0a0a0a] rounded-2xl p-6 overflow-x-auto border border-white/10">
            <pre className="text-sm font-mono text-sky-200/90">
{`uniform float uTime;
uniform vec3 uColor; // Injected via React state based on garment
varying vec2 vUv;

// Simplex 2D noise function omitted for brevity...
float snoise(vec2 v) { /* ... */ }

void main() {
  vec2 uv = vUv;
  
  // 1. Fluid distortion using time-based noise
  float noise1 = snoise(uv * 3.0 + uTime * 0.2);
  float noise2 = snoise(uv * 2.0 - uTime * 0.15);
  uv.x += noise1 * 0.1;
  uv.y += noise2 * 0.1;
  
  // 2. Radial gradient based on distorted UV
  float dist = distance(uv, vec2(0.5));
  float intensity = smoothstep(0.8, 0.0, dist);
  
  // 3. Mix base dark color with the dynamic garment theme color
  vec3 baseColor = vec3(0.02, 0.02, 0.02);
  vec3 finalColor = mix(baseColor, uColor, intensity * 0.5);
  
  // 4. Add glass-like refractive highlights that move with time
  float h1x = 0.4 + sin(uTime * 0.5) * 0.15;
  float h1y = 0.3 + cos(uTime * 0.3) * 0.15;
  float highlight = smoothstep(0.4, 0.0, distance(uv, vec2(h1x, h1y))) * 0.5;
  
  float h2x = 0.6 + cos(uTime * 0.4) * 0.15;
  float h2y = 0.7 + sin(uTime * 0.6) * 0.15;
  float highlight2 = smoothstep(0.5, 0.0, distance(uv, vec2(h2x, h2y))) * 0.3;
  
  finalColor += (highlight + highlight2) * uColor;
  
  gl_FragColor = vec4(finalColor, 1.0);
}`}
            </pre>
          </div>
        </section>

        {/* Section 3: 3D Workflow */}
        <section className="liquid-glass rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <Layers className="w-8 h-8 text-sky-400" />
            <h3 className="text-2xl font-medium">Robust Workflow: Web-Optimized 3D Clothes</h3>
          </div>
          <p className="text-white/70 mb-8 font-light leading-relaxed">
            Creating high-fidelity, physics-ready garments for the web requires a strict pipeline to balance visual quality (Metahuman standards) with performance (120 FPS, low bandwidth).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-medium mb-2 text-white">1. Simulation & Design</h4>
              <p className="text-sm text-white/60">Use <strong>Marvelous Designer</strong> or <strong>CLO3D</strong> to create the garment patterns and simulate high-poly cloth physics. Export the high-poly mesh.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-medium mb-2 text-white">2. Retopology & Baking</h4>
              <p className="text-sm text-white/60">Import to <strong>Blender</strong>. Perform manual retopology to reduce the mesh to &lt;10k polygons. Bake Normal, Ambient Occlusion, and Roughness maps from the high-poly to the low-poly mesh.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-medium mb-2 text-white">3. Rigging & Weight Transfer</h4>
              <p className="text-sm text-white/60">Align the garment with the base Metahuman skeleton. Use Blender's <strong>Data Transfer</strong> modifier to copy vertex weights from the avatar's body to the garment, ensuring perfect deformation without clipping.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-medium mb-2 text-white">4. Material Setup (glTF PBR)</h4>
              <p className="text-sm text-white/60">Configure PBR materials for export. Use the <code>KHR_materials_transmission</code> extension for liquid glass/silk, and <code>KHR_materials_clearcoat</code> for satin finishes.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h4 className="text-lg font-medium text-white">5. Compression & Delivery</h4>
              </div>
              <p className="text-sm text-white/60">Process the final GLB through <strong>gltf-transform</strong>. Apply <strong>Draco compression</strong> for geometry and <strong>KTX2/BasisU</strong> compression for textures. This reduces a 50MB garment down to ~2MB, allowing instant loading on the web.</p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function DesignersPage({ setThemeColor }: { setThemeColor: (c: string) => void }) {
  useEffect(() => {
    setThemeColor('#4f46e5'); // Indigo theme
  }, [setThemeColor]);

  const designers = [
    { name: 'House of Veles', role: 'Avant-Garde Physics', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
    { name: 'Aero Dynamics', role: 'Structural Engineering', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop' },
    { name: 'Eco Luxe', role: 'Bioluminescent Textiles', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
    { name: 'Noir Tech', role: 'Light-Absorbing Materials', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 px-6 py-20 max-w-7xl mx-auto min-h-screen"
    >
      <div className="flex flex-col items-center text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6 text-glow">The Visionaries</h2>
        <p className="text-white/60 max-w-2xl font-light text-lg">
          Meet the minds engineering the future of digital and physical haute couture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {designers.map((designer, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            className="liquid-glass rounded-3xl p-6 hover:bg-white/10 transition-colors group cursor-pointer flex flex-col items-center text-center"
          >
            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-2 border-white/10 group-hover:border-white/30 transition-colors">
              <img src={designer.image} alt={designer.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">{designer.name}</h3>
            <p className="text-sm text-white/50 font-mono uppercase tracking-widest">{designer.role}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function EditorialPage({ setThemeColor }: { setThemeColor: (c: string) => void }) {
  useEffect(() => {
    setThemeColor('#d97706'); // Amber theme
  }, [setThemeColor]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 px-6 py-20 max-w-7xl mx-auto min-h-screen"
    >
      <div className="liquid-glass-heavy rounded-3xl overflow-hidden relative h-[60vh] flex items-end p-10 group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop" 
          alt="Editorial Cover" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-white/70 mb-4 block">Issue 04 • The Virtual Thread</span>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-4 text-glow">Weaving Reality</h2>
          <p className="text-white/80 font-light text-lg mb-6">
            How smart-silk and liquid satin are blurring the lines between digital avatars and physical runways.
          </p>
          <button className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider hover:text-white/70 transition-colors">
            Read Story <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Navbar() {
  const location = useLocation();
  const navItems = [
    { name: 'Collection', path: '/' },
    { name: 'Designers', path: '/designers' },
    { name: 'Editorial', path: '/editorial' },
    { name: 'Architecture', path: '/deliverables' },
  ];

  return (
    <header className="relative z-50 flex items-center justify-between px-8 py-6 liquid-glass border-b-0 rounded-b-3xl mx-4 mt-4">
      <div className="flex items-center gap-4">
        <Menu className="w-6 h-6 text-white/70 hover:text-white cursor-pointer transition-colors" />
        <Link to="/" className="text-2xl font-bold tracking-tighter uppercase">Aura</Link>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase text-white/60">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path}
            className={`cursor-pointer transition-colors ${location.pathname === item.path ? 'text-white text-glow' : 'hover:text-white'}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <Search className="w-5 h-5 text-white/70 hover:text-white cursor-pointer transition-colors" />
        <div className="relative cursor-pointer group">
          <ShoppingBag className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-black text-[10px] font-bold flex items-center justify-center rounded-full">
            2
          </span>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const [themeColor, setThemeColor] = useState(FASHION_ITEMS[0].color);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-white/20">
      
      {/* Real GLSL Shader Background */}
      <LiquidBackground themeColor={themeColor} />

      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<CollectionPage setThemeColor={setThemeColor} />} />
          <Route path="/designers" element={<DesignersPage setThemeColor={setThemeColor} />} />
          <Route path="/editorial" element={<EditorialPage setThemeColor={setThemeColor} />} />
          <Route path="/deliverables" element={<DeliverablesPage setThemeColor={setThemeColor} />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
