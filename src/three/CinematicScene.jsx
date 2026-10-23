import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cinematicState } from '../lib/cinematicState'
import { instantiateCar } from '../lib/carModel'
import { CarObject, StudioFloor, StudioLighting } from './Studio'

// A continuous orbit keeps the camera outside the body as it travels through
// the front, side and rear studies. The old point-to-point path cut diagonally
// through the car between several views and made the changes feel abrupt.
const DESKTOP_STOPS = [
  { at: 0, angle: 0.72, radius: 7.7, height: 2.0, target: [0, 0.72, 0], fov: 32 },
  { at: 0.11, angle: 0.48, radius: 6.1, height: 2.05, focus: 'InteriorCage', aimOffset: [0, 0.12, 0], fov: 30 },
  { at: 0.19, angle: 0.48, radius: 6.1, height: 2.05, focus: 'InteriorCage', aimOffset: [0, 0.12, 0], fov: 30 },
  { at: 0.24, angle: -1.08, radius: 6.1, height: 1.15, focus: 'BodyUnderside', aimOffset: [0, 0.05, 0], fov: 30 },
  { at: 0.34, angle: -1.08, radius: 6.1, height: 1.15, focus: 'BodyUnderside', aimOffset: [0, 0.05, 0], fov: 30 },
  { at: 0.39, angle: -1.62, radius: 4.9, height: 1.0, focus: 'WheelFrontRBrakeDisc', aimOffset: [0, 0, 0], fov: 28 },
  { at: 0.49, angle: -1.62, radius: 4.9, height: 1.0, focus: 'WheelFrontRBrakeDisc', aimOffset: [0, 0, 0], fov: 28 },
  { at: 0.54, angle: -2.42, radius: 5.4, height: 1.55, focus: 'Engine', aimOffset: [0, 0.12, 0], fov: 29 },
  { at: 0.64, angle: -2.42, radius: 5.4, height: 1.55, focus: 'Engine', aimOffset: [0, 0.12, 0], fov: 29 },
  { at: 0.69, angle: -3.14, radius: 4.9, height: 1.65, focus: 'BodyTaillights', aimOffset: [0, 0.08, 0], fov: 27 },
  { at: 0.79, angle: -3.14, radius: 4.9, height: 1.65, focus: 'BodyTaillights', aimOffset: [0, 0.08, 0], fov: 27 },
  { at: 0.86, angle: -4.55, radius: 6.8, height: 2.0, target: [0, 0.72, 0], fov: 31 },
  { at: 0.95, angle: -5.25, radius: 7.6, height: 1.8, target: [0, 0.68, 0], fov: 31 },
  { at: 1, angle: -5.56, radius: 7.7, height: 2.0, target: [0, 0.72, 0], fov: 32 },
]

const MOBILE_STOPS = DESKTOP_STOPS.map((stop) => ({
  ...stop,
  radius: stop.radius + 1.15,
  height: stop.height + 0.15,
  fov: stop.fov + 10,
}))

const smoothstep = (value) => value * value * (3 - 2 * value)

function resolveTarget(stop, focusTargets) {
  const target = (stop.focus && focusTargets[stop.focus]) || stop.target || [0, 0.65, 0]
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

  return {
    position: (() => {
      const angle = THREE.MathUtils.lerp(from.angle, to.angle, local)
      const radius = THREE.MathUtils.lerp(from.radius, to.radius, local)
      return [
        Math.sin(angle) * radius,
        THREE.MathUtils.lerp(from.height, to.height, local),
        Math.cos(angle) * radius,
      ]
    })(),
    target: [
      THREE.MathUtils.lerp(fromTarget[0], toTarget[0], local),
      THREE.MathUtils.lerp(fromTarget[1], toTarget[1], local),
      THREE.MathUtils.lerp(fromTarget[2], toTarget[2], local),
    ],
    fov: THREE.MathUtils.lerp(from.fov, to.fov, local),
  }
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
      focusTargets
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
    const stops = isMobile ? MOBILE_STOPS : DESKTOP_STOPS
    const sample = sampleCamera(stops, cinematicState.progress, focusTargets)
    const time = state.clock.elapsedTime
    const drift = reduced ? 0 : 1

    desiredPosition.current
      .set(...sample.position)
      .add(
        new THREE.Vector3(
          Math.sin(time * 0.19) * 0.035 * drift,
          Math.sin(time * 0.23 + 1.4) * 0.025 * drift,
          0,
        ),
      )
    desiredTarget.current.set(...sample.target)

    if (!reduced) {
      desiredTarget.current.x += cinematicState.pointerX * (isMobile ? 0.08 : 0.16)
      desiredTarget.current.y += cinematicState.pointerY * (isMobile ? 0.035 : 0.07)
    }

    const damping = 1 - Math.exp(-delta * 3.1)
    camera.position.lerp(desiredPosition.current, damping)
    target.current.lerp(desiredTarget.current, damping)
    camera.lookAt(target.current)

    if (focusLightRef.current && focusLightTargetRef.current) {
      focusLightTargetRef.current.position.copy(target.current)
      focusLightTargetRef.current.updateWorldMatrix(true, false)
      focusLightRef.current.position.set(
        camera.position.x + 0.25,
        camera.position.y + 1.1,
        camera.position.z + 0.25
      )
      const featureFocus = cinematicState.progress > 0.08 && cinematicState.progress < 0.86
      focusLightRef.current.intensity = THREE.MathUtils.damp(
        focusLightRef.current.intensity,
        featureFocus ? 16 : 0,
        5,
        delta
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
      color="#9cffd8"
      intensity={0}
      angle={0.42}
      penumbra={0.85}
      distance={9}
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
    const names = ['InteriorCage', 'BodyUnderside', 'WheelFrontRBrakeDisc', 'Engine', 'BodyTaillights']
    return Object.fromEntries(
      names.flatMap((name) => {
        const part = car.getObjectByName(name)
        if (!part) return []
        const bounds = new THREE.Box3().setFromObject(part)
        const center = bounds.getCenter(new THREE.Vector3())
        return [[name, center.toArray()]]
      })
    )
  }, [model])

  if (!model) return null

  return (
    <div className={`cinematic-scene ${className}`.trim()} aria-hidden="true">
      <Canvas
        frameloop={active && !reduced ? 'always' : 'demand'}
        dpr={[1, 1.65]}
        shadows
        camera={{ position: [7.15, 2.42, 7.25], fov: 33.5, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.08
        }}
      >
        <CameraRig reduced={reduced} focusTargets={focusTargets} />
        <StudioLighting progressSource={cinematicState} />
        <CarObject source={model} />
        <StudioFloor />
      </Canvas>
    </div>
  )
}
