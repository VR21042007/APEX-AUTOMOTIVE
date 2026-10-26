import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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
  gradient.addColorStop(0, 'rgba(120, 58, 10, 0.14)')
  gradient.addColorStop(0.34, 'rgba(48, 24, 6, 0.2)')
  gradient.addColorStop(0.7, 'rgba(5, 8, 6, 0.16)')
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
  const keyLightRef = useRef(null)
  const ambientRef = useRef(null)
  const scene = useThree((state) => state.scene)
  const fog = useMemo(() => new THREE.Fog(new THREE.Color('#101820'), 18, 66), [])
  const brightBackground = useMemo(() => new THREE.Color('#81898a'), [])
  const darkBackground = useMemo(() => new THREE.Color('#080d13'), [])

  useFrame(() => {
    const light = sweepLightRef.current
    const progress = compact ? 0 : progressSource?.progress ?? cinematicState.progress
    const p = THREE.MathUtils.clamp(progress, 0, 1)
    const dark = compact ? 1 : THREE.MathUtils.smoothstep(p, 0.46, 0.57)
    const road = compact ? 0 : THREE.MathUtils.smoothstep(p, 0.84, 0.98)

    if (light) {
      light.position.set(
        THREE.MathUtils.lerp(2.2, -1.8, p),
        THREE.MathUtils.lerp(6.2, 4.2, dark),
        THREE.MathUtils.lerp(4.6, -1.2, p),
      )
      light.target.position.set(0, 0.42, 0)
      light.target.updateWorldMatrix(true, false)
      light.intensity = THREE.MathUtils.lerp(22, 16, dark) + road * 4
      light.color.set(road > 0.01 ? '#d9e4ed' : '#f2e8cf')
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.lerp(4.4, 1.8, dark) + road * 1.3
      keyLightRef.current.position.set(4, THREE.MathUtils.lerp(8, 5, dark), 5)
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(1.2, 0.34, dark) + road * 0.48
    }

    scene.background = null
    scene.fog = road > 0.18 ? fog : null
    if (scene.fog) {
      scene.fog.color.copy(darkBackground).lerp(brightBackground, road * 0.16)
      scene.fog.near = THREE.MathUtils.lerp(20, 13, road)
      scene.fog.far = THREE.MathUtils.lerp(72, 50, road)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={compact ? 0.34 : 1.2} color="#e9f1f6" />
      <hemisphereLight args={['#e7edf0', '#12231d', compact ? 0.42 : 0.68]} />
      <directionalLight
        ref={keyLightRef}
        color="#e9f1f6"
        intensity={compact ? 2.5 : 4.4}
        position={[4, 8, 5]}
        castShadow
      />
      <directionalLight color="#c8d8e2" intensity={compact ? 1.15 : 1.8} position={[-3, 4, -6]} />
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
        environmentIntensity={compact ? 0.48 : 0.78}
      >
        <Lightformer
          form="rect"
          intensity={compact ? 4.2 : 5.3}
          color="#f2e8cf"
          scale={[11, 3.2, 1]}
          position={[0, 5, -3.5]}
          rotation={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={compact ? 2.2 : 2.8}
          color="#e9f1f6"
          scale={[5, 1, 1]}
          position={[-2, 2.5, 5.5]}
          rotation={[0, Math.PI, 0]}
        />
        <Lightformer
          form="ring"
          intensity={compact ? 1.4 : 1.8}
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
  const floorRef = useRef(null)
  const glowRef = useRef(null)
  const polished = useMemo(() => new THREE.Color('#92999a'), [])
  const midnight = useMemo(() => new THREE.Color('#020403'), [])

  useFrame(() => {
    const p = compact ? 1 : THREE.MathUtils.clamp(cinematicState.progress, 0, 1)
    const dark = compact ? 1 : THREE.MathUtils.smoothstep(p, 0.46, 0.57)
    if (floorRef.current) {
      floorRef.current.color.copy(polished).lerp(midnight, dark)
    }
    if (glowRef.current) glowRef.current.opacity = compact ? 0.35 : THREE.MathUtils.lerp(0.1, 0.35, dark)
  })

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial
          ref={floorRef}
          color="#92999a"
          roughness={0.24}
          metalness={0.12}
          envMapIntensity={0.72}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshBasicMaterial
          ref={glowRef}
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
