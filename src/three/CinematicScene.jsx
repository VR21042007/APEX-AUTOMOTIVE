import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { cinematicState } from '../lib/cinematicState'
import { TIMELINE } from '../lib/cinematicTimeline'
import { CinematicCar, SceneLabelLayer } from './cinematic/CinematicCar'
import { applyShell } from './cinematic/carRig'
import { CinematicWorld } from './cinematic/Environments'
import { updateDrive } from './cinematic/driveState'

const CAR_CENTER = [0, 0.55, 0]

// Camera keyframes. Orbit stops circle a target ({angle, radius, height});
// eye stops place the camera directly and aim it by yaw/pitch. `shift` slides
// the framing sideways (fraction of the viewport) to make room for the copy.
function buildStops(anchors) {
  const { wheel, eye, steering } = anchors
  const wheelFocus = [wheel.x + 0.75, wheel.y + 0.02, wheel.z + 0.1]
  return [
    // 01 Hero, white studio.
    // The car sits low and right so it clears the headline at top left.
    { at: 0, angle: 0.72, radius: 10, height: 0.95, target: [0, 1.05, 0], fov: 32, shift: 0.15 },
    { at: 0.06, angle: 0.62, radius: 9.8, height: 1.0, target: [0, 1.0, 0], fov: 32, shift: 0.15 },
    // 02 Exploded view: elevated, locked on the car while it comes apart.
    { at: 0.1, angle: 0.92, radius: 11.6, height: 3.6, target: [0, 0.85, 0], fov: 34, shift: 0.14 },
    { at: 0.2, angle: 1.2, radius: 11.8, height: 3.9, target: [0, 0.9, 0], fov: 34, shift: 0.14 },
    { at: 0.245, angle: 1.45, radius: 10.4, height: 3.2, target: [0, 0.75, 0], fov: 34, shift: 0.02 },
    // 03 X-ray: high rear three-quarter so the cell, engine and corners read.
    { at: 0.29, angle: 2.2, radius: 8.9, height: 3.3, target: [0, 0.6, -0.2], fov: 34, shift: -0.14 },
    { at: 0.39, angle: 2.55, radius: 8.6, height: 3.0, target: [0, 0.6, -0.2], fov: 34, shift: -0.14 },
    { at: 0.415, angle: 2.2, radius: 8.6, height: 2.2, target: CAR_CENTER, fov: 34, shift: 0 },
    // 04 Wheel teardown, front-left corner.
    { at: 0.45, angle: 0.42, radius: 4.9, height: 0.45, target: wheelFocus, fov: 30, shift: 0.19 },
    { at: 0.53, angle: 0.55, radius: 4.6, height: 0.4, target: wheelFocus, fov: 30, shift: 0.19 },
    { at: 0.565, angle: 1.45, radius: 8.6, height: 0.75, target: CAR_CENTER, fov: 31, shift: 0 },
    // 05 Carbon chamber, low and slow around the side.
    { at: 0.6, angle: 1.62, radius: 8.6, height: 0.2, target: [0, 0.95, 0], fov: 30, shift: 0 },
    { at: 0.67, angle: 2.25, radius: 8.1, height: 0.3, target: [0, 0.95, 0], fov: 30, shift: 0 },
    // 06 Cockpit entry: swing to the nose, glide over the hood, through the
    // windscreen and turn into the driver's seat.
    { at: 0.69, angle: 0.2, radius: 8.2, height: 0.8, target: [eye.x, 0.8, 0], fov: 34, shift: 0 },
    { at: 0.705, eye: [eye.x, 1.35, 6.4], yaw: Math.PI, pitch: -0.1, fov: 36 },
    { at: 0.73, eye: [eye.x, 1.12, 3.1], yaw: Math.PI, pitch: -0.12, fov: 40 },
    { at: 0.748, eye: [eye.x, eye.y + 0.04, steering.z + 0.85], yaw: Math.PI, pitch: -0.12, fov: 46 },
    { at: 0.765, eye: [eye.x - 0.12, eye.y + 0.02, steering.z - 0.05], yaw: Math.PI * 1.45, pitch: -0.18, fov: 56 },
    { at: 0.785, eye: [eye.x, eye.y, eye.z], yaw: Math.PI * 2, pitch: -0.2, fov: 60 },
    { at: 0.85, eye: [eye.x, eye.y, eye.z], yaw: Math.PI * 2, pitch: -0.2, fov: 60 },
    // 07 Circuit: hard cut (hidden by the dip to black) to a low tracking shot.
    { at: 0.852, angle: 0.62, radius: 7.4, height: 0.25, target: [0, 0.6, 0.3], fov: 30, shift: 0, cut: true },
    { at: 0.93, angle: 0.36, radius: 8.2, height: 0.55, target: [0, 0.65, 0], fov: 31, shift: 0 },
    { at: 1, angle: 0.22, radius: 9.2, height: 0.95, target: [0, 0.7, 0], fov: 33, shift: 0 },
  ]
}

const smooth = (value) => value * value * (3 - 2 * value)
const lerp = THREE.MathUtils.lerp

function lookTarget(stop) {
  if (stop.target && !stop.eye) return stop.target
  const [x, y, z] = stop.eye
  const yaw = stop.yaw ?? 0
  const pitch = stop.pitch ?? 0
  return [x + Math.sin(yaw) * Math.cos(pitch) * 2, y + Math.sin(pitch) * 2, z + Math.cos(yaw) * Math.cos(pitch) * 2]
}

function orbitPosition(target, angle, radius, height) {
  return [target[0] + Math.sin(angle) * radius, target[1] + height, target[2] + Math.cos(angle) * radius]
}

function sampleCamera(stops, progress, mobile) {
  const p = THREE.MathUtils.clamp(progress, 0, 1)
  let index = stops.findIndex((stop, i) => i < stops.length - 1 && p >= stop.at && p <= stops[i + 1].at)
  if (index === -1) index = stops.length - 2
  const from = stops[index]
  const to = stops[index + 1]
  const t = to.cut ? (p >= to.at ? 1 : 0) : smooth(THREE.MathUtils.clamp((p - from.at) / (to.at - from.at || 1), 0, 1))
  const scale = mobile ? 1.28 : 1
  const fovBoost = (stop) => (mobile ? (stop.eye ? 12 : 16) : 0)

  let position
  let target
  if (!from.eye && !to.eye) {
    // Orbit to orbit: interpolate the orbit itself so the camera arcs.
    target = from.target.map((value, axis) => lerp(value, to.target[axis], t))
    position = orbitPosition(
      target,
      lerp(from.angle, to.angle, t),
      lerp(from.radius, to.radius, t) * scale,
      lerp(from.height, to.height, t) + (mobile ? 0.25 : 0),
    )
  } else {
    const point = (stop) =>
      stop.eye || orbitPosition(stop.target, stop.angle, stop.radius * scale, stop.height + (mobile ? 0.25 : 0))
    const a = point(from)
    const b = point(to)
    position = a.map((value, axis) => lerp(value, b[axis], t))
    if (from.eye && to.eye && from.yaw !== undefined && to.yaw !== undefined) {
      // Turn the head by yaw, not by a straight line between look points.
      const yaw = lerp(from.yaw, to.yaw, t)
      const pitch = lerp(from.pitch ?? 0, to.pitch ?? 0, t)
      target = lookTarget({ eye: position, yaw, pitch })
    } else {
      const ta = lookTarget(from)
      const tb = lookTarget(to)
      target = ta.map((value, axis) => lerp(value, tb[axis], t))
    }
  }

  return {
    position,
    target,
    fov: lerp(from.fov + fovBoost(from), to.fov + fovBoost(to), t),
    shift: mobile ? 0 : lerp(from.shift ?? 0, to.shift ?? 0, t),
    interior: (from.eye ? 1 - t : 0) + (to.eye ? t : 0),
  }
}

function CameraRig({ reduced, anchors }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const mobile = size.width < 780
  const stops = useMemo(() => buildStops(anchors), [anchors])
  const target = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const lastDesired = useRef(null)
  const shift = useRef(0)

  useEffect(() => {
    const initial = sampleCamera(stops, cinematicState.progress, mobile)
    camera.position.set(...initial.position)
    target.current.set(...initial.target)
    camera.fov = initial.fov
    camera.lookAt(target.current)
    camera.updateProjectionMatrix()
    lastDesired.current = null
  }, [camera, stops, mobile])

  useFrame((state, delta) => {
    const progress = cinematicState.progress
    updateDrive(progress, delta, reduced)
    const sample = sampleCamera(stops, progress, mobile)
    const time = state.clock.elapsedTime
    const drift = reduced ? 0 : 1 - sample.interior * 0.7

    desired.current.set(...sample.position)
    desired.current.x += Math.sin(time * 0.19) * 0.022 * drift
    desired.current.y += Math.sin(time * 0.23 + 1.4) * 0.016 * drift
    desiredTarget.current.set(...sample.target)
    if (!reduced && sample.interior < 0.5) {
      desiredTarget.current.x += cinematicState.pointerX * (mobile ? 0.04 : 0.08)
      desiredTarget.current.y += cinematicState.pointerY * (mobile ? 0.02 : 0.035)
    }

    // Large jumps in the keyframes are cuts: snap instead of flying through the car.
    const jumped = lastDesired.current && lastDesired.current.distanceTo(desired.current) > 1.5
    lastDesired.current = (lastDesired.current || new THREE.Vector3()).copy(desired.current)
    const damping = jumped ? 1 : 1 - Math.exp(-delta * (sample.interior > 0.1 ? 6 : 4.5))
    camera.position.lerp(desired.current, damping)
    target.current.lerp(desiredTarget.current, damping)
    camera.lookAt(target.current)

    const nextFov = jumped ? sample.fov : THREE.MathUtils.damp(camera.fov, sample.fov, 4, delta)
    const near = lerp(0.1, 0.02, sample.interior)
    shift.current = jumped ? sample.shift : THREE.MathUtils.damp(shift.current, sample.shift, 4, delta)
    camera.fov = nextFov
    camera.near = near
    if (Math.abs(shift.current) > 0.0005) {
      camera.setViewOffset(size.width, size.height, -shift.current * size.width, 0, size.width, size.height)
    } else if (camera.view?.enabled) {
      camera.clearViewOffset()
    }
    camera.updateProjectionMatrix()

    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__apexCamera = {
        progress,
        mobile,
        position: camera.position.toArray(),
        target: target.current.toArray(),
        fov: camera.fov,
      }
    }
  })

  return null
}

// Shadows are redrawn only when something moves: a scroll step, the floating
// panels of the exploded view, or the wheels turning on the circuit.
function ShadowScheduler() {
  const gl = useThree((state) => state.gl)
  const lastProgress = useRef(-1)
  const frame = useRef(0)

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])

  useFrame(() => {
    const progress = cinematicState.progress
    frame.current += 1
    const floating = progress > TIMELINE.explode.parts.frontBumper[0] && progress < TIMELINE.explode.reassemble[1]
    const driving = progress > TIMELINE.drive[0] && frame.current % 3 === 0
    if (progress !== lastProgress.current || floating || driving) gl.shadowMap.needsUpdate = true
    lastProgress.current = progress
  })

  return null
}

// Compiles every shader the story will need, including the see-through X-ray
// variants, right after the car loads instead of mid-scroll.
function ShaderWarmup({ rig }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (!rig) return
    applyShell(rig, 0.5)
    gl.compile(scene, camera)
    applyShell(rig, 0)
    gl.compileAsync(scene, camera).catch(() => {})
  }, [rig, gl, scene, camera])

  return null
}

export function CinematicScene({ model, active = true, reduced = false, className = '' }) {
  const [rig, setRig] = useState(null)
  const labels = useRef({})
  const maxDpr = typeof window === 'undefined' ? 1.5 : Math.min(window.devicePixelRatio || 1, 1.5)
  const [dpr, setDpr] = useState(Math.min(maxDpr, 1.25))
  const onRig = useCallback((next) => setRig(next), [])
  const anchors = useMemo(() => {
    if (!rig) return null
    const steering = rig.cockpit.steering
    return {
      wheel: rig.wheel.center,
      steering,
      eye: new THREE.Vector3(steering.x, steering.y + 0.21, steering.z - 0.5),
    }
  }, [rig])

  useEffect(() => {
    if (!import.meta.env.DEV || !rig || typeof window === 'undefined') return undefined
    window.__apexRig = rig
    window.__apexModelReady = {
      parts: rig.tracks.length,
      shell: rig.shell.length,
      xray: rig.xray.map((component) => `${component.key}:${component.materials.length}`),
      steering: rig.cockpit.steering.toArray().map((value) => Number(value.toFixed(2))),
    }
    return () => {
      window.__apexCamera = null
      window.__apexModelReady = null
      window.__apexRig = null
    }
  }, [rig])

  if (!model) return null

  return (
    <div className={`cinematic-scene ${className}`.trim()} aria-hidden="true">
      <Canvas
        frameloop={active && !reduced ? 'always' : 'demand'}
        dpr={dpr}
        shadows
        camera={{ position: [6.8, 1.8, 6.9], fov: 32, near: 0.1, far: 240 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          if (import.meta.env.DEV) window.__apexGl = gl
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(maxDpr)} onDecline={() => setDpr(1)} flipflops={3} onFallback={() => setDpr(1)} />
        {anchors && <CameraRig reduced={reduced} anchors={anchors} />}
        <ShadowScheduler />
        <ShaderWarmup rig={rig} />
        <CinematicWorld reflective={typeof window === 'undefined' || window.innerWidth >= 780} />
        <CinematicCar source={model} onRig={onRig} labels={labels} />
      </Canvas>
      <SceneLabelLayer registry={labels} />
    </div>
  )
}
