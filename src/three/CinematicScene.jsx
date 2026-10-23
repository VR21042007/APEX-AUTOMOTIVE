import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cinematicState } from '../lib/cinematicState'
import { instantiateCar } from '../lib/carModel'
import { StudioFloor, StudioLighting } from './Studio'

// Each held pair is a shot. The transitions orbit the same car and keep the
// camera outside the body while the focus point moves between real GLB meshes.
const DESKTOP_STOPS = [
  { at: 0, angle: 0.72, radius: 7.8, height: 1.35, target: [0, 0.62, 0], fov: 34 },
  { at: 0.09, angle: 0.25, radius: 6.3, height: 1.05, target: [0, 0.62, 0], fov: 32 },
  { at: 0.1, angle: 0.08, radius: 2.8, height: 0.72, focus: 'BodyHood', fov: 29 },
  { at: 0.19, angle: 0.08, radius: 2.8, height: 0.72, focus: 'BodyHood', fov: 29 },
  { at: 0.2, angle: 0.22, radius: 3.45, height: 0.7, focus: 'BodyWindshield', fov: 30 },
  { at: 0.29, angle: 0.22, radius: 3.45, height: 0.7, focus: 'BodyWindshield', fov: 30 },
  { at: 0.3, angle: 0.58, radius: 7.4, height: 0.34, target: [0, 0.62, 0], fov: 32 },
  { at: 0.39, angle: 0.58, radius: 7.4, height: 0.34, target: [0, 0.62, 0], fov: 32 },
  { at: 0.4, angle: -0.36, radius: 2.35, height: 0.4, focus: 'WheelFrontRBrakeDisc', fov: 26 },
  { at: 0.51, angle: -0.36, radius: 2.35, height: 0.4, focus: 'WheelFrontRBrakeDisc', fov: 26 },
  { at: 0.52, angle: -1.57, radius: 7.5, height: 0.83, target: [0, 0.62, 0], fov: 34 },
  { at: 0.63, angle: -1.57, radius: 7.5, height: 0.83, target: [0, 0.62, 0], fov: 34 },
  { at: 0.64, angle: -2.58, radius: 2.4, height: 0.42, focus: 'WheelRearRRim', fov: 26 },
  { at: 0.75, angle: -2.58, radius: 2.4, height: 0.42, focus: 'WheelRearRRim', fov: 26 },
  { at: 0.76, angle: -2.58, radius: 7.5, height: 0.95, target: [0, 0.62, 0], fov: 33 },
  { at: 0.78, angle: -3.14, radius: 7.5, height: 0.9, target: [0, 0.62, 0], fov: 33 },
  { at: 0.8, angle: -4.7, radius: 7.4, height: 0.85, target: [0, 0.62, 0], fov: 33 },
  { at: 0.82, angle: -6.1, radius: 6.8, height: 0.82, focus: 'BodyWindshield', fov: 32 },
  { at: 0.83, angle: -6.1, radius: 3.7, height: 0.5, focus: 'InteriorSeatsColor1', fov: 27 },
  { at: 0.87, angle: -6.1, radius: 3.7, height: 0.5, focus: 'InteriorSeatsColor1', fov: 27 },
  { at: 0.88, angle: -6.1, radius: 5.8, height: 0.95, target: [0, 0.62, 0], fov: 32 },
  { at: 0.94, angle: -6.1, radius: 7.5, height: 0.92, target: [0, 0.62, 0], fov: 34 },
  { at: 1, angle: -6.1, radius: 7.5, height: 0.92, target: [0, 0.62, 0], fov: 34 },
]

const MOBILE_STOPS = DESKTOP_STOPS.map((stop) => ({
  ...stop,
  radius: stop.radius * 1.16,
  height: stop.height + 0.14,
  fov: stop.fov + 16,
}))

const smoothstep = (value) => value * value * (3 - 2 * value)

function resolveTarget(stop, focusTargets) {
  const target = (stop.focus && focusTargets[stop.focus]) || stop.target || [0, 0.62, 0]
  return target.map((value, index) => value + (stop.aimOffset?.[index] || 0))
}

function sampleCamera(stops, progress, focusTargets) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1)
  let from = stops[0]
  let to = stops[stops.length - 1]
  for (let index = 0; index < stops.length - 1; index += 1) {
    if (clamped >= stops[index].at && clamped <= stops[index + 1].at) {
      from = stops[index]
      to = stops[index + 1]
      break
    }
  }

  const range = to.at - from.at || 1
  const local = smoothstep(THREE.MathUtils.clamp((clamped - from.at) / range, 0, 1))
  const fromTarget = resolveTarget(from, focusTargets)
  const toTarget = resolveTarget(to, focusTargets)
  const target = fromTarget.map((value, index) => THREE.MathUtils.lerp(value, toTarget[index], local))
  const angle = THREE.MathUtils.lerp(from.angle, to.angle, local)
  const radius = THREE.MathUtils.lerp(from.radius, to.radius, local)
  const cameraLift = THREE.MathUtils.lerp(from.height, to.height, local)

  return {
    position: [
      target[0] + Math.sin(angle) * radius,
      target[1] + cameraLift,
      target[2] + Math.cos(angle) * radius,
    ],
    target,
    fov: THREE.MathUtils.lerp(from.fov, to.fov, local),
  }
}

function CinematicCar({ source }) {
  const car = useMemo(() => instantiateCar(source, { cloneMaterials: true }), [source])
  const basePosition = useMemo(() => car?.position.clone(), [car])
  const wheelObjects = useMemo(() => {
    if (!car) return []
    return ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR']
      .map((name) => car.getObjectByName(name))
      .filter(Boolean)
      .map((wheel) => ({ wheel, rotation: wheel.rotation.x }))
  }, [car])

  useFrame(() => {
    if (!car || !basePosition) return
    const drive = smoothstep(THREE.MathUtils.clamp((cinematicState.progress - 0.87) / 0.13, 0, 1))
    const distance = drive * 2.2
    car.position.set(basePosition.x, basePosition.y, basePosition.z + distance)
    wheelObjects.forEach(({ wheel, rotation }) => {
      wheel.rotation.x = rotation + drive * 18
    })
  })

  return car ? <primitive object={car} /> : null
}

function CinematicRunway() {
  const roadRef = useRef(null)
  const leftEdgeRef = useRef(null)
  const rightEdgeRef = useRef(null)
  const dashesRef = useRef([])

  useFrame(() => {
    const progress = THREE.MathUtils.clamp((cinematicState.progress - 0.86) / 0.14, 0, 1)
    const reveal = smoothstep(progress)
    const roadDistance = progress * 16
    const road = roadRef.current
    if (road) {
      road.material.opacity = reveal * 0.96
      road.visible = reveal > 0.002
    }
    ;[leftEdgeRef.current, rightEdgeRef.current].forEach((edge) => {
      if (!edge) return
      edge.material.opacity = reveal * 0.86
      edge.visible = reveal > 0.002
    })
    dashesRef.current.forEach((dash, index) => {
      if (!dash) return
      const base = -38 + index * 4
      dash.position.z = ((((base - roadDistance + 40) % 80) + 80) % 80) - 40
      dash.material.opacity = reveal * 0.8
      dash.visible = reveal > 0.002
    })
  })

  return (
    <group>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]} visible={false}>
        <planeGeometry args={[11, 100]} />
        <meshStandardMaterial color="#252a2e" roughness={0.9} metalness={0.06} transparent opacity={0} />
      </mesh>
      <mesh ref={leftEdgeRef} rotation={[-Math.PI / 2, 0, 0]} position={[-4.15, -0.002, 0]} visible={false}>
        <planeGeometry args={[0.035, 100]} />
        <meshBasicMaterial color="#a8b2b6" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh ref={rightEdgeRef} rotation={[-Math.PI / 2, 0, 0]} position={[4.15, -0.002, 0]} visible={false}>
        <planeGeometry args={[0.035, 100]} />
        <meshBasicMaterial color="#a8b2b6" transparent opacity={0} toneMapped={false} />
      </mesh>
      {Array.from({ length: 20 }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => { dashesRef.current[index] = node }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.002, -38 + index * 4]}
          visible={false}
        >
          <planeGeometry args={[0.09, 1.8]} />
          <meshBasicMaterial color="#c7cbca" transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function StudioRoom() {
  const wallMaterials = useRef([])
  const bright = useMemo(() => new THREE.Color('#858d8e'), [])
  const dark = useMemo(() => new THREE.Color('#07101b'), [])
  const road = useMemo(() => new THREE.Color('#20262c'), [])

  useFrame(() => {
    const p = THREE.MathUtils.clamp(cinematicState.progress, 0, 1)
    const studio = THREE.MathUtils.smoothstep(p, 0.46, 0.57)
    const driving = THREE.MathUtils.smoothstep(p, 0.84, 0.98)
    wallMaterials.current.forEach((material) => {
      if (!material) return
      material.color.copy(bright).lerp(dark, studio).lerp(road, driving)
      material.opacity = 1 - driving
      material.visible = driving < 0.995
    })
  })

  const addWallMaterial = (index) => (material) => {
    wallMaterials.current[index] = material
  }

  return (
    <group>
      <mesh position={[0, 4.9, -11]}>
        <planeGeometry args={[36, 10]} />
        <meshStandardMaterial ref={addWallMaterial(0)} color="#858d8e" roughness={0.72} metalness={0.12} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 4.9, 11]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[36, 10]} />
        <meshStandardMaterial ref={addWallMaterial(1)} color="#858d8e" roughness={0.72} metalness={0.12} transparent depthWrite={false} />
      </mesh>
      <mesh position={[-11, 4.9, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[22, 10]} />
        <meshStandardMaterial ref={addWallMaterial(2)} color="#858d8e" roughness={0.72} metalness={0.12} transparent depthWrite={false} />
      </mesh>
      <mesh position={[11, 4.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[22, 10]} />
        <meshStandardMaterial ref={addWallMaterial(3)} color="#858d8e" roughness={0.72} metalness={0.12} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

function CameraRig({ reduced, focusTargets }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const isMobile = size.width < 780
  const target = useRef(new THREE.Vector3())
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const focusLightRef = useRef(null)
  const focusLightTargetRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    const initial = sampleCamera(
      isMobile ? MOBILE_STOPS : DESKTOP_STOPS,
      cinematicState.progress,
      focusTargets,
    )
    camera.position.set(...initial.position)
    target.current.set(...initial.target)
    camera.fov = initial.fov
    camera.updateProjectionMatrix()
    camera.lookAt(target.current)
    initialized.current = true
  }, [camera, focusTargets, isMobile])

  useFrame((state, delta) => {
    if (!initialized.current) return
    const progress = cinematicState.progress
    const stops = isMobile ? MOBILE_STOPS : DESKTOP_STOPS
    const sample = sampleCamera(stops, progress, focusTargets)
    const drive = smoothstep(THREE.MathUtils.clamp((progress - 0.87) / 0.13, 0, 1))
    const time = state.clock.elapsedTime
    const drift = reduced ? 0 : 1

    const mobileDriveShift = isMobile ? smoothstep(THREE.MathUtils.clamp((progress - 0.88) / 0.07, 0, 1)) * 1.05 : 0
    desiredPosition.current
      .set(...sample.position)
      .add(new THREE.Vector3(
        Math.sin(time * 0.19) * 0.022 * drift,
        Math.sin(time * 0.23 + 1.4) * 0.016 * drift,
        drive * 2.2,
      ))
    desiredPosition.current.y -= mobileDriveShift
    desiredTarget.current.set(...sample.target)
    desiredTarget.current.z += drive * 2.2
    desiredTarget.current.y -= mobileDriveShift

    if (!reduced) {
      desiredTarget.current.x += cinematicState.pointerX * (isMobile ? 0.04 : 0.08)
      desiredTarget.current.y += cinematicState.pointerY * (isMobile ? 0.02 : 0.035)
    }

    const damping = 1 - Math.exp(-delta * 4.5)
    camera.position.lerp(desiredPosition.current, damping)
    target.current.lerp(desiredTarget.current, damping)
    camera.lookAt(target.current)

    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__apexCamera = {
        progress,
        mobile: isMobile,
        position: camera.position.toArray(),
        target: target.current.toArray(),
        fov: camera.fov,
      }
    }

    if (focusLightRef.current && focusLightTargetRef.current) {
      focusLightTargetRef.current.position.copy(target.current)
      focusLightTargetRef.current.updateWorldMatrix(true, false)
      focusLightRef.current.position.set(
        camera.position.x + 0.25,
        camera.position.y + 0.8,
        camera.position.z + 0.25,
      )
      const detail = (progress > 0.38 && progress < 0.52) || (progress > 0.62 && progress < 0.76)
      const intensity = detail ? 9 : progress > 0.08 && progress < 0.88 ? 4 : 0
      focusLightRef.current.intensity = THREE.MathUtils.damp(
        focusLightRef.current.intensity,
        intensity,
        5,
        delta,
      )
    }

    if (Math.abs(camera.fov - sample.fov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, sample.fov, 4, delta)
      camera.updateProjectionMatrix()
    }
  })

  return (
    <spotLight
      ref={focusLightRef}
      color="#c4efd8"
      intensity={0}
      angle={0.42}
      penumbra={0.85}
      distance={8}
      decay={2}
      castShadow={false}
    >
      <object3D ref={focusLightTargetRef} attach="target" />
    </spotLight>
  )
}

export function CinematicScene({ model, active = true, reduced = false, className = '' }) {
  const focusTargets = useMemo(() => {
    if (!model) return {}
    const car = instantiateCar(model)
    car.updateMatrixWorld(true)
    const names = [
      'BodyHood',
      'BodyWindshield',
      'BodyUnderside',
      'WheelFrontRBrakeDisc',
      'WheelRearRRim',
      'InteriorSteeringWheel01',
      'InteriorSeatsColor1',
      'BodyTaillights',
    ]
    return Object.fromEntries(
      names.flatMap((name) => {
        const part = car.getObjectByName(name)
        if (!part) return []
        const bounds = new THREE.Box3().setFromObject(part)
        const center = bounds.getCenter(new THREE.Vector3())
        return [[name, center.toArray()]]
      }),
    )
  }, [model])

  useEffect(() => {
    if (!import.meta.env.DEV || !model || typeof window === 'undefined') return undefined
    let meshes = 0
    model.traverse((object) => {
      if (object.isMesh) meshes += 1
    })
    window.__apexModelReady = { meshes, focusTargets: Object.keys(focusTargets) }
    return () => {
      window.__apexCamera = null
      window.__apexModelReady = null
    }
  }, [focusTargets, model])

  if (!model) return null

  return (
    <div className={`cinematic-scene ${className}`.trim()} aria-hidden="true">
      <Canvas
        frameloop={active && !reduced ? 'always' : 'demand'}
        dpr={[1, 1.55]}
        shadows
        camera={{ position: [5.15, 2.1, 6.9], fov: 34, near: 0.1, far: 90 }}
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
        <CameraRig reduced={reduced} focusTargets={focusTargets} />
        <StudioLighting progressSource={cinematicState} />
        <CinematicCar source={model} />
        <StudioRoom />
        <StudioFloor />
        <CinematicRunway />
      </Canvas>
    </div>
  )
}
