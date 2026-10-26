import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CarObject, StudioFloor, StudioLighting } from './Studio'

const VIEW_POSITIONS = {
  front: [0.1, 1.35, 7.4],
  profile: [7.4, 1.3, 0.25],
  rear: [0.15, 1.4, -7.5],
  home: [5.3, 2.15, 6.1],
}

const VIEW_TARGETS = {
  front: [0, 0.5, 0.1],
  profile: [0, 0.5, 0.05],
  rear: [0, 0.52, -0.1],
  home: [0, 0.52, 0],
}

function ViewerCamera({ view, viewNonce, onOrbitStart }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const controls = useRef(null)
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const animating = useRef(true)

  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    const distanceScale = aspect < 1 ? 1.42 : aspect < 1.3 ? 1.14 : 1
    const next = VIEW_POSITIONS[view] || VIEW_POSITIONS.home
    const target = VIEW_TARGETS[view] || VIEW_TARGETS.home
    desiredPosition.current.set(next[0] * distanceScale, next[1], next[2] * distanceScale)
    desiredTarget.current.set(...target)
    animating.current = true
  }, [view, viewNonce, size.width, size.height])

  useFrame((_, delta) => {
    if (!animating.current) return
    const damp = 1 - Math.exp(-delta * 4.6)
    camera.position.lerp(desiredPosition.current, damp)
    if (controls.current) {
      controls.current.target.lerp(desiredTarget.current, damp)
      controls.current.update()
    }
    if (camera.position.distanceTo(desiredPosition.current) < 0.025) {
      animating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.52, 0]}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.62}
      zoomSpeed={0.55}
      minDistance={4.7}
      maxDistance={10}
      minPolarAngle={0.24}
      maxPolarAngle={1.48}
      onStart={() => {
        animating.current = false
        onOrbitStart?.()
      }}
    />
  )
}

function PresentationRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
      <ringGeometry args={[3.05, 3.075, 128]} />
      <meshBasicMaterial color="#ff7a00" transparent opacity={0.16} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function InteractiveViewer({ model, active = true, view = 'home', viewNonce = 0, onOrbitStart }) {
  if (!model) return null

  return (
    <Canvas
      className="interactive-viewer__canvas"
      frameloop={active ? 'always' : 'demand'}
      dpr={[1, 1.5]}
      shadows
      camera={{ position: [5.3, 2.15, 6.1], fov: 34, near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.12
      }}
    >
      <ViewerCamera view={view} viewNonce={viewNonce} onOrbitStart={onOrbitStart} />
      <StudioLighting compact />
      <CarObject source={model} />
      <StudioFloor compact reflective={false} />
      <PresentationRing />
    </Canvas>
  )
}
