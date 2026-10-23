import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { instantiateCar } from '../lib/carModel'
import { cinematicState } from '../lib/cinematicState'

let floorGlowTexture = null

function makeFloorGlowTexture() {
  if (floorGlowTexture) return floorGlowTexture
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(256, 270, 20, 256, 270, 230)
  gradient.addColorStop(0, 'rgba(0, 184, 122, 0.35)')
  gradient.addColorStop(0.34, 'rgba(0, 90, 60, 0.55)')
  gradient.addColorStop(0.7, 'rgba(5, 8, 6, 0.3)')
  gradient.addColorStop(1, 'rgba(2, 4, 3, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 512)
  floorGlowTexture = new THREE.CanvasTexture(canvas)
  floorGlowTexture.colorSpace = THREE.SRGBColorSpace
  return floorGlowTexture
}

export function CarObject({ source, ...props }) {
  const car = useMemo(() => instantiateCar(source, { cloneMaterials: true }), [source])
  if (!car) return null
  return <primitive object={car} {...props} />
}

export function StudioLighting({ compact = false, progressSource }) {
  const sweepLightRef = useRef(null)

  useFrame(() => {
    const light = sweepLightRef.current
    if (!light) return
    const progress = compact ? 0 : progressSource?.progress ?? cinematicState.progress
    const p = THREE.MathUtils.clamp(progress, 0, 1)
    light.position.set(
      THREE.MathUtils.lerp(2.2, -1.8, p),
      4.6,
      THREE.MathUtils.lerp(4.6, -1.2, p)
    )
    light.target.position.set(0, 0.42, 0)
    light.target.updateWorldMatrix(true, false)
    light.intensity = THREE.MathUtils.lerp(12, 30, p)
  })

  return (
    <>
      <ambientLight intensity={compact ? 0.16 : 0.16} color="#e9f1f6" />
      <hemisphereLight args={['#dce3e8', '#0a1a15', compact ? 0.3 : 0.35]} />
      <directionalLight
        color="#e9f1f6"
        intensity={compact ? 2.8 : 3.2}
        position={[4, 7, 5]}
        castShadow
      />
      <directionalLight color="#b9c8d6" intensity={compact ? 1 : 1.1} position={[-3, 4, -6]} />
      <spotLight
        ref={sweepLightRef}
        color="#f2e8cf"
        angle={0.9}
        penumbra={1}
        distance={30}
        decay={2}
        castShadow={false}
      >
        <object3D attach="target" position={[0, 0.42, 0]} />
      </spotLight>
      <spotLight
        color="#8fb3d6"
        intensity={compact ? 7 : 9}
        position={[-6, 3, -4]}
        angle={0.55}
        penumbra={1}
        distance={18}
        castShadow={false}
      />
      <spotLight
        color="#f2e8cf"
        intensity={compact ? 5 : 6.5}
        position={[6, 3, -4]}
        angle={0.55}
        penumbra={1}
        distance={18}
        castShadow={false}
      />
      <Environment
        resolution={compact ? 128 : 192}
        frames={1}
        environmentIntensity={compact ? 0.4 : 0.5}
      >
        <color attach="background" args={['#050807']} />
        <Lightformer
          form="rect"
          intensity={compact ? 3.6 : 4}
          color="#f2e8cf"
          scale={[9, 2.8, 1]}
          position={[0, 5, -3.5]}
          rotation={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={compact ? 1.4 : 1.6}
          color="#e9f1f6"
          scale={[5, 1, 1]}
          position={[-2, 2.5, 5.5]}
          rotation={[0, Math.PI, 0]}
        />
        <Lightformer
          form="ring"
          intensity={compact ? 1 : 1.2}
          color="#ffffff"
          scale={2.6}
          position={[2.5, 5.5, 2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </Environment>
    </>
  )
}

export function StudioFloor({ compact = false, intensity = 1 }) {
  const glow = useMemo(() => makeFloorGlowTexture(), [])

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial
          color="#020403"
          roughness={0.18}
          metalness={0.3}
          envMapIntensity={0.4}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshBasicMaterial
          map={glow}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.5 * intensity}
        scale={compact ? 7 : 9}
        blur={2.8}
        far={3.5}
        resolution={compact ? 256 : 512}
        color="#000000"
        frames={1}
      />
    </>
  )
}
