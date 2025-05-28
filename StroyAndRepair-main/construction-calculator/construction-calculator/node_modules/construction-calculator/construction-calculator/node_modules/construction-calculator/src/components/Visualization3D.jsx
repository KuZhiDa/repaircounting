import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Environment, 
  PerspectiveCamera, 
  Float, 
  Sparkles, 
  ContactShadows,
  Sky,
  Stars,
  Cloud,
  useTexture,
  useCursor,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing';
import { a, useSpring } from '@react-spring/three';
import ColorPicker from './ColorPicker'; // Ваш компонент выбора цвета

// Текстуры
import brick from '../assets/images/materials/brick.jpg';
import wood from '../assets/images/materials/wood.jpg';
import tile from '../assets/images/materials/tile.jpg';
import concrete from '../assets/images/materials/concrete.jpg';
import roofTexture from '../assets/images/materials/roof.jpg';

// Вспомогательные компоненты
const Box = ({ args, position, rotation, children, ...props }) => {
  return (
    <mesh position={position} rotation={rotation} {...props}>
      <boxGeometry args={args} />
      {children}
    </mesh>
  );
};

const RoundedBox = ({ args, position, rotation, children, ...props }) => {
  return (
    <mesh position={position} rotation={rotation} {...props}>
      <roundedBoxGeometry args={[...args, 0.05]} />
      <meshStandardMaterial 
        {...props}
        roughness={0.2}
        metalness={0.1}
      />
      {children}
    </mesh>
  );
};

const AnimatedMaterial = ({ color, ...props }) => {
  const { color: springColor } = useSpring({
    color,
    config: { tension: 100, friction: 30 }
  });
  return <a.meshStandardMaterial color={springColor} {...props} />;
};

const Particles = ({ count = 1000 }) => {
  const particles = useRef();
  
  useFrame(() => {
    if (particles.current) {
      particles.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 10)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={new Float32Array(count * 3).map(() => Math.random() * 0.5 + 0.5)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};

// Компонент для интерактивного выбора цвета
const ColorSelector = ({ position, onColorChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [color, setColor] = useState('#4287f5');
  
  const handleClick = () => setShowPicker(!showPicker);
  
  const handleColorChange = (newColor) => {
    setColor(newColor);
    onColorChange(newColor);
  };

  return (
    <group position={position}>
      <mesh onClick={handleClick}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {showPicker && (
        <Html center>
          <div style={{ 
            position: 'absolute', 
            top: '50px', 
            left: '-100px',
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <ColorPicker color={color} onChange={handleColorChange} />
            <button 
              onClick={() => setShowPicker(false)}
              style={{ 
                marginTop: '10px',
                padding: '5px 10px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Закрыть
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

// Основной компонент сцены
const Scene = ({ category, calcType, inputs, result }) => {
  const { materials = [] } = result || {};
  const controlsRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [paintColor, setPaintColor] = useState('#4287f5');
  const [roofColor, setRoofColor] = useState('#8b0000');
  
  // Загружаем текстуры
  const brickTexture = useTexture(brick);
  const woodTexture = useTexture(wood);
  const tileTexture = useTexture(tile);
  const concreteTexture = useTexture(concrete);
  const roofTextureMap = useTexture(roofTexture);

  const commonParams = {
    wallThickness: 0.2,
    floorThickness: 0.1,
    ceilingThickness: 0.1,
    materialColor: '#f0f0f0',
    floorColor: '#808080',
    gridColor: '#cccccc'
  };

  const createRoom = (length, width, height) => {
    return (
      <group>
        <Box args={[length, commonParams.floorThickness, width]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color={commonParams.floorColor} 
            map={concreteTexture}
            roughness={0.7}
            metalness={0.2}
          />
        </Box>

        <Box args={[length, commonParams.ceilingThickness, width]} position={[0, height, 0]}>
          <meshStandardMaterial 
            color={commonParams.materialColor} 
            roughness={0.5}
          />
        </Box>

        <Box args={[commonParams.wallThickness, height, width]} position={[-length/2, height/2, 0]}>
          <meshStandardMaterial 
            color={commonParams.materialColor} 
            roughness={0.4}
            metalness={0.1}
          />
        </Box>
        <Box args={[commonParams.wallThickness, height, width]} position={[length/2, height/2, 0]}>
          <meshStandardMaterial 
            color={commonParams.materialColor} 
            roughness={0.4}
            metalness={0.1}
          />
        </Box>
        <Box args={[length, height, commonParams.wallThickness]} position={[0, height/2, -width/2]}>
          <meshStandardMaterial 
            color={commonParams.materialColor} 
            roughness={0.4}
            metalness={0.1}
          />
        </Box>
        <Box args={[length, height, commonParams.wallThickness]} position={[0, height/2, width/2]}>
          <meshStandardMaterial 
            color={commonParams.materialColor} 
            roughness={0.4}
            metalness={0.1}
          />
        </Box>
      </group>
    );
  };

  const renderPaintVisualization = () => {
    return (
      <group>
        {createRoom(inputs.length, inputs.width, inputs.height)}
        
        <ColorSelector 
          position={[0, inputs.height + 1, 0]} 
          onColorChange={setPaintColor}
        />
        
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.01}>
          <Box args={[inputs.length - 0.1, inputs.height - 0.1, commonParams.wallThickness - 0.05]} 
               position={[0, inputs.height/2, -inputs.width/2 + 0.05]}>
            <AnimatedMaterial 
              color={paintColor} 
              transparent 
              opacity={0.9}
              roughness={0.2}
              metalness={0.3}
            />
          </Box>
          <Box args={[inputs.length - 0.1, inputs.height - 0.1, commonParams.wallThickness - 0.05]} 
               position={[0, inputs.height/2, inputs.width/2 - 0.05]}>
            <AnimatedMaterial 
              color={paintColor} 
              transparent 
              opacity={0.9}
              roughness={0.2}
              metalness={0.3}
            />
          </Box>
          <Box args={[commonParams.wallThickness - 0.05, inputs.height - 0.1, inputs.width - 0.1]} 
               position={[-inputs.length/2 + 0.05, inputs.height/2, 0]}>
            <AnimatedMaterial 
              color={paintColor} 
              transparent 
              opacity={0.9}
              roughness={0.2}
              metalness={0.3}
            />
          </Box>
          <Box args={[commonParams.wallThickness - 0.05, inputs.height - 0.1, inputs.width - 0.1]} 
               position={[inputs.length/2 - 0.05, inputs.height/2, 0]}>
            <AnimatedMaterial 
              color={paintColor} 
              transparent 
              opacity={0.9}
              roughness={0.2}
              metalness={0.3}
            />
          </Box>
        </Float>
        
        <Sparkles 
          count={50} 
          size={2} 
          scale={[inputs.length, inputs.height, inputs.width]} 
          position={[0, inputs.height/2, 0]}
          color={paintColor}
          speed={0.1}
        />
      </group>
    );
  };

  const renderTilesVisualization = () => {
    const tileWidth = inputs.tile_width;
    const tileHeight = inputs.tile_height || inputs.tile_width;
    const tilesX = Math.ceil(inputs.length / tileWidth);
    const tilesZ = Math.ceil(inputs.width / tileHeight);
    const gap = inputs.gap_width || 0.01;

    return (
      <group>
        {createRoom(inputs.length, inputs.width, inputs.height)}
        
        <group position={[-inputs.length/2 + tileWidth/2, commonParams.floorThickness + 0.01, -inputs.width/2 + tileHeight/2]}>
          {Array.from({ length: tilesX }).map((_, i) => 
            Array.from({ length: tilesZ }).map((_, j) => (
              <RoundedBox
                key={`${i}-${j}`}
                args={[tileWidth - gap, 0.05, tileHeight - gap]}
                position={[i * tileWidth, 0, j * tileHeight]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
              >
                <meshStandardMaterial 
                  color={(i + j) % 2 === 0 ? '#ffffff' : '#e0e0e0'}
                  roughness={0.1}
                  metalness={hovered ? 0.9 : 0.5}
                  map={tileTexture}
                />
              </RoundedBox>
            ))
          )}
        </group>
        
        <Environment preset="city" />
      </group>
    );
  };

  const renderWallpaperVisualization = () => {
    const patternColor = inputs.color || '#ff6b6b';

    return (
      <group>
        {createRoom(inputs.length, inputs.width, inputs.height)}
        
        <Box args={[inputs.length - 0.1, inputs.height - 0.1, commonParams.wallThickness - 0.05]} 
             position={[0, inputs.height/2, -inputs.width/2 + 0.05]}>
          <meshStandardMaterial 
            color={patternColor} 
            transparent 
            opacity={0.9}
            roughness={0.3}
            metalness={0.1}
          />
        </Box>
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <group position={[0, inputs.height * 0.7, -inputs.width/2 + 0.1]}>
            <Box args={[0.3, 0.3, 0.05]}>
              <meshStandardMaterial color="#ffffff" />
            </Box>
          </group>
        </Float>
      </group>
    );
  };

  const renderLaminateVisualization = () => {
    const boardWidth = inputs.laminate_width;
    const boardLength = inputs.laminate_length;
    const boardsX = Math.ceil(inputs.length / boardWidth);
    const boardsZ = Math.ceil(inputs.width / boardLength);

    return (
      <group>
        {createRoom(inputs.length, inputs.width, inputs.height)}
        
        <group position={[-inputs.length/2 + boardWidth/2, commonParams.floorThickness + 0.01, -inputs.width/2 + boardLength/2]}>
          {Array.from({ length: boardsX }).map((_, i) => 
            Array.from({ length: boardsZ }).map((_, j) => (
              <Box
                key={`${i}-${j}`}
                args={[boardWidth - 0.01, 0.05, boardLength - 0.01]}
                position={[i * boardWidth, 0, j * boardLength]}
                rotation={[0, (i + j) % 2 === 0 ? 0 : Math.PI/2, 0]}
              >
                <meshStandardMaterial 
                  map={woodTexture}
                  roughness={0.3}
                  metalness={0.1}
                />
              </Box>
            ))
          )}
        </group>
        
        <Environment preset="apartment" />
      </group>
    );
  };

  const renderFoundationVisualization = () => {
    return (
      <group>
        <Box args={[inputs.length, inputs.depth, inputs.width]} position={[0, -inputs.depth/2, 0]}>
          <meshStandardMaterial 
            map={concreteTexture}
            roughness={0.8} 
            metalness={0.1}
          />
        </Box>
        
        <Box args={[inputs.length * 2, inputs.depth * 0.5, inputs.width * 2]} position={[0, -inputs.depth - inputs.depth * 0.25, 0]}>
          <meshStandardMaterial color="#5c4033" roughness={1} />
        </Box>
        
        <Sky sunPosition={[100, 20, 100]} />
        <Cloud position={[20, -inputs.depth, -20]} opacity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </group>
    );
  };

  const renderBricksVisualization = () => {
    const brickLength = inputs.brick_length || 0.25;
    const brickHeight = inputs.brick_height || 0.065;
    const brickWidth = inputs.wall_thickness * 0.12 || 0.12;
    const bricksX = Math.ceil(inputs.wall_length / brickLength);
    const bricksY = Math.ceil(inputs.wall_height / brickHeight);

    return (
      <group position={[0, inputs.wall_height/2, 0]}>
        {Array.from({ length: bricksY }).map((_, row) => 
          Array.from({ length: bricksX }).map((_, col) => (
            <Box
              key={`${row}-${col}`}
              args={[brickLength, brickHeight, brickWidth]}
              position={[
                -inputs.wall_length/2 + col * brickLength + brickLength/2,
                row * brickHeight + brickHeight/2,
                0
              ]}
            >
              <meshStandardMaterial 
                map={brickTexture}
                roughness={0.6}
                metalness={0.1}
              />
            </Box>
          ))
        )}
        
        <Particles count={1000} />
      </group>
    );
  };

  const renderRoofingVisualization = () => {
    const roofAngle = inputs.roof_slope ? Math.atan(inputs.roof_slope / 100) : Math.PI/6;
    const roofHeight = inputs.roof_width/2 * Math.tan(roofAngle);
    const roofLength = inputs.roof_length || 10;
    const roofWidth = inputs.roof_width || 6;

    return (
      <group>
        {/* Основание дома */}
        <Box args={[roofLength, 3, roofWidth]} position={[0, 1.5, 0]}>
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </Box>
        
        {/* Селектор цвета крыши */}
        <ColorSelector 
          position={[0, 6 + roofHeight, 0]} 
          onColorChange={setRoofColor}
        />
        
        {/* Двускатная крыша */}
        <group position={[0, 3 + roofHeight/2, 0]}>
          {/* Левая сторона крыши */}
          <mesh rotation={[0, 0, Math.PI/2 + roofAngle]}>
            <planeGeometry args={[roofLength, roofWidth/Math.cos(roofAngle)]} />
            <meshStandardMaterial 
              color={roofColor} 
              map={roofTextureMap}
              side={THREE.DoubleSide} 
              roughness={0.3} 
              metalness={0.7} 
            />
          </mesh>
          
          {/* Правая сторона крыши */}
          <mesh rotation={[0, 0, Math.PI/2 - roofAngle]}>
            <planeGeometry args={[roofLength, roofWidth/Math.cos(roofAngle)]} />
            <meshStandardMaterial 
              color={roofColor} 
              map={roofTextureMap}
              side={THREE.DoubleSide} 
              roughness={0.3} 
              metalness={0.7} 
            />
          </mesh>
          
          {/* Фронтоны */}
          <Box args={[roofWidth * Math.tan(roofAngle), roofWidth, 0.1]} position={[roofLength/2, 0, 0]}>
            <meshStandardMaterial color="#d0d0d0" />
          </Box>
          <Box args={[roofWidth * Math.tan(roofAngle), roofWidth, 0.1]} position={[-roofLength/2, 0, 0]}>
            <meshStandardMaterial color="#d0d0d0" />
          </Box>
        </group>
        
        {/* Водосточная система */}
        <group position={[0, 3, roofWidth/2]}>
          <Box args={[roofLength, 0.05, 0.05]} position={[0, roofHeight, 0]}>
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </Box>
          {Array.from({ length: Math.floor(roofLength) }).map((_, i) => (
            <Box 
              key={i}
              args={[0.05, 0.5, 0.05]} 
              position={[-roofLength/2 + 0.5 + i, roofHeight - 0.25, 0]}
            >
              <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
            </Box>
          ))}
        </group>
        
        {/* Эффекты */}
        <EffectComposer>
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
        
        {/* Окружение */}
        <Environment preset="dawn" />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      </group>
    );
  };

  const renderVisualization = () => {
    switch (calcType) {
      case 'paint':
        return renderPaintVisualization();
      case 'tiles':
        return renderTilesVisualization();
      case 'wallpaper':
        return renderWallpaperVisualization();
      case 'laminate':
        return renderLaminateVisualization();
      case 'foundation':
        return renderFoundationVisualization();
      case 'bricks':
        return renderBricksVisualization();
      case 'roofing':
        return renderRoofingVisualization();
      default:
        return (
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Text 
              position={[0, 2, 0]} 
              fontSize={0.5} 
              color="black"
            >
              Визуализация для этого типа расчета в разработке
            </Text>
          </Float>
        );
    }
  };

  const cameraPosition = useMemo(() => {
    if (!inputs) return [10, 10, 10];
    
    let maxDim = 10;
    if (calcType === 'foundation') {
      maxDim = Math.max(inputs.length, inputs.width, inputs.depth) * 1.5;
    } else if (calcType === 'bricks') {
      maxDim = Math.max(inputs.wall_length, inputs.wall_height) * 1.5;
    } else if (calcType === 'roofing') {
      maxDim = Math.max(inputs.roof_length || 10, inputs.roof_width || 6) * 1.5;
    } else {
      maxDim = Math.max(
        inputs.length || inputs.wall_length || 0, 
        inputs.width || 1, 
        inputs.height || inputs.wall_height || 0
      ) * 1.5;
    }
    
    return [maxDim, maxDim, maxDim];
  }, [calcType, inputs]);

  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={cameraPosition} 
        fov={50}
        near={0.1}
        far={1000}
      />
      
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ffaa00" />
      
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      
      <gridHelper args={[20, 20, '#666666', '#444444']} rotation={[Math.PI/2, 0, 0]} />
      <axesHelper args={[5]} />
      
      {renderVisualization()}
      
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
        <group position={[0, 5, 0]}>
          {materials.map((mat, i) => (
            <Text
              key={i}
              position={[0, -i * 0.5, 0]}
              fontSize={0.3}
              color="black"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
            >
              {mat.name}: {mat.quantity} {mat.unit}
            </Text>
          ))}
        </group>
      </Float>
      
      <ContactShadows 
        position={[0, -0.5, 0]} 
        opacity={0.5} 
        width={10} 
        height={10} 
        blur={2} 
        far={5} 
      />
    </>
  );
};

// Основной компонент
const Visualization3D = ({ category, calcType, inputs, result }) => {
  return (
    <div className="visualization-container" style={{ width: '100%', height: '600px' }}>
      <Suspense fallback={<div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        color: '#333',
        fontSize: '18px'
      }}>Загрузка 3D сцены...</div>}>
        <Canvas 
          gl={{ 
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace
          }}
          shadows
          dpr={[1, 2]}
        >
          <Scene 
            category={category}
            calcType={calcType}
            inputs={inputs}
            result={result}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Visualization3D;