import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { cinematicState } from '../../lib/cinematicState'
import { instantiateCar } from '../../lib/carModel'
import { TIMELINE, pulse, ramp } from '../../lib/cinematicTimeline'
import { SCENE_LABELS, WHEEL_LABELS, applyShell, applyTracks, buildCarRig } from './carRig'
import { driveState } from './driveState'

const { explode: EXPLODE, xray: XRAY, wheel: WHEEL, cockpit: COCKPIT } = TIMELINE

// Display tiles go fully black when off and glow with their own texture when on.
function setDisplay(material, level) {
  material.color.setScalar(0.04 + level * 0.96)
  material.emissiveIntensity = level * 1.15
}

function explodeAmount(progress, [start, end]) {
  return Math.min(ramp(progress, start, end), 1 - ramp(progress, ...EXPLODE.reassemble))
}

function xrayGlowWindow(index, count) {
  const [start, end] = XRAY.components
  const step = (end - start) / count
  const from = start + index * step
  return [from, from + step * 0.3, from + step * 1.05, from + step * 1.4]
}

// Labels live in one DOM layer over the canvas. The car projects each anchor
// to the screen every frame and writes position and opacity directly.
export function SceneLabelLayer({ registry }) {
  return (
    <div className="scene-labels" aria-hidden="true">
      {SCENE_LABELS.map((label) => (
        <div
          key={label.id}
          ref={(node) => {
            if (node) registry.current[label.id] = node
            else delete registry.current[label.id]
          }}
          className={`scene-label${label.flip ? ' scene-label--flip' : ''}`}
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <span className="scene-label__dot" />
          <span className="scene-label__line" />
          <span className="scene-label__text">
            {label.index && <small>{label.index}</small>}
            <strong>{label.title}</strong>
            {label.detail && <em>{label.detail}</em>}
          </span>
        </div>
      ))}
    </div>
  )
}

const projected = new THREE.Vector3()

function placeLabel(node, point, opacity, camera, size) {
  if (!node) return
  if (opacity <= 0.001) {
    if (node.style.visibility !== 'hidden') node.style.visibility = 'hidden'
    return
  }
  projected.copy(point).project(camera)
  const visible = projected.z < 1
  node.style.visibility = visible ? 'visible' : 'hidden'
  node.style.opacity = opacity.toFixed(3)
  node.style.transform = `translate3d(${((projected.x + 1) / 2) * size.width}px, ${((1 - projected.y) / 2) * size.height}px, 0)`
}

// Coil-over added to the front-left corner; the source model has wishbones but no spring.
function CoilOver({ coilRef, from, to }) {
  const { geometry, quaternion, position, length } = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const span = end.clone().sub(start)
    const turns = 9
    const points = []
    for (let step = 0; step <= turns * 24; step += 1) {
      const t = step / (turns * 24)
      const angle = t * turns * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * 0.055, t * span.length(), Math.sin(angle) * 0.055))
    }
    const curve = new THREE.CatmullRomCurve3(points)
    return {
      geometry: new THREE.TubeGeometry(curve, turns * 24, 0.009, 6, false),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), span.clone().normalize()),
      position: start,
      length: span.length(),
    }
  }, [from, to])

  return (
    <group ref={coilRef} position={position} quaternion={quaternion} visible={false}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#ff7a00" metalness={0.6} roughness={0.32} />
      </mesh>
      <mesh position={[0, length / 2, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, length * 0.92, 16]} />
        <meshStandardMaterial color="#b9bdc0" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, length * 0.75, 0]}>
        <cylinderGeometry args={[0.034, 0.034, length * 0.4, 16]} />
        <meshStandardMaterial color="#1a1d20" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  )
}

export function CinematicCar({ source, onRig, labels }) {
  const car = useMemo(() => instantiateCar(source, { cloneMaterials: true }), [source])
  const rig = useMemo(() => (car ? buildCarRig(car) : null), [car])
  const labelPoint = useMemo(() => new THREE.Vector3(), [])
  const coilRef = useRef(null)
  const coilBase = useRef(null)
  const cabinLightRef = useRef(null)

  useEffect(() => {
    if (rig) onRig?.(rig)
  }, [rig, onRig])

  const cabinLight = useMemo(() => {
    if (!rig) return null
    const steering = rig.cockpit.steering
    return [steering.x - 0.25, steering.y + 0.35, steering.z - 0.3]
  }, [rig])

  const coil = useMemo(() => {
    if (!rig) return null
    const { center } = rig.wheel
    return {
      from: [center.x - 0.3, center.y - 0.08, center.z - 0.04],
      to: [center.x - 0.5, center.y + 0.42, center.z - 0.1],
    }
  }, [rig])

  useFrame((state) => {
    if (!rig) return
    const p = cinematicState.progress
    const time = state.clock.elapsedTime
    const nodes = labels?.current || {}
    const { camera, size } = state

    // Exploded view: each group lifts in sequence, floats, then reassembles.
    for (const group of rig.explode) {
      const amount = explodeAmount(p, EXPLODE.parts[group.key])
      group.entries.forEach(({ offset, bob }, index) => {
        offset.amount = amount
        bob.amount = amount * Math.sin(time * 0.9 + index * 1.7 + group.key.length) * 0.6
      })
    }
    for (const label of rig.explodeLabels) {
      const amount = explodeAmount(p, EXPLODE.parts[label.key])
      labelPoint.copy(label.base).addScaledVector(label.offset, amount)
      const opacity = Math.max(0, amount * 1.2 - 0.2) * (1 - ramp(p, 0.2, 0.215))
      placeLabel(nodes[`explode-${label.key}`], labelPoint, opacity, camera, size)
    }

    // Wheel teardown on the front-left corner.
    const wheelReturn = 1 - ramp(p, WHEEL.returnStart, WHEEL.returnEnd)
    const out = ramp(p, ...WHEEL.out) * wheelReturn
    const separate = ramp(p, ...WHEEL.separate) * wheelReturn
    rig.wheel.out.forEach((entry) => (entry.amount = out))
    rig.wheel.separate.forEach((entry) => (entry.amount = separate))
    if (coilRef.current) {
      if (!coilBase.current) coilBase.current = coilRef.current.position.clone()
      coilRef.current.visible = out > 0.002
      coilRef.current.position.copy(coilBase.current).add(new THREE.Vector3(0.34 * out, 0, 0.1 * out))
    }
    const wheelLabel = pulse(p, 0.49, 0.505, 0.528, 0.54)
    for (const item of WHEEL_LABELS) {
      const anchor = rig.wheel.labels[item.key]
      labelPoint.copy(anchor.base).addScaledVector(anchor.out, out).addScaledVector(anchor.separate, separate)
      placeLabel(nodes[`wheel-${item.key}`], labelPoint, wheelLabel, camera, size)
    }

    // Rolling: wheels turn with the distance covered on the circuit.
    const roll = driveState.distance / rig.wheel.radius
    const wheelSpin = separate * 0.9
    for (const entry of rig.spinners) {
      entry.spin.angle = roll + (entry.object.name === 'WHEEL_LF' ? wheelSpin : 0)
    }
    applyTracks(rig.tracks)

    // X-ray: shell turns to glass, a scan band sweeps nose to tail, parts glow.
    const ghost = ramp(p, ...XRAY.fadeIn) * (1 - ramp(p, ...XRAY.restore))
    applyShell(rig, ghost)
    const scan = ramp(p, ...XRAY.scan)
    rig.ghostMaterial.uniforms.uScanZ.value = THREE.MathUtils.lerp(rig.dims.length * 0.62, -rig.dims.length * 0.62, scan)
    rig.xray.forEach((component, index) => {
      const glow = pulse(p, ...xrayGlowWindow(index, rig.xray.length)) * (ghost > 0 ? 1 : 0)
      component.materials.forEach(({ material, emissive, intensity }) => {
        material.emissive.copy(emissive).lerp(rig.glowColor, glow)
        material.emissiveIntensity = THREE.MathUtils.lerp(intensity, 0.45, glow)
      })
      placeLabel(nodes[`xray-${component.key}`], component.anchor, glow, camera, size)
    })

    // Cockpit: the main display flickers on, then the indicator tiles light in
    // sequence across the binnacle while the cabin light warms up.
    const boot = ramp(p, ...COCKPIT.displays) * (1 - ramp(p, 0.845, 0.86))
    const cabin = ramp(p, ...COCKPIT.lighting) * (1 - ramp(p, 0.845, 0.86))
    if (cabinLightRef.current) cabinLightRef.current.intensity = cabin * 2.4
    const { screens, indicators } = rig.cockpit
    const flicker = boot > 0.05 && boot < 0.22 ? (Math.sin(time * 61) > 0.1 ? 1 : 0.35) : 1
    const screenLevel = THREE.MathUtils.smoothstep(boot, 0.05, 0.25) * flicker
    screens.forEach(({ material }) => setDisplay(material, screenLevel))
    indicators.forEach(({ material }, index) => {
      const start = 0.25 + (index / Math.max(1, indicators.length)) * 0.45
      setDisplay(material, THREE.MathUtils.smoothstep(boot, start, start + 0.06))
    })
  })

  if (!car || !rig) return null

  return (
    <>
      <primitive object={car} />

      {coil && <CoilOver coilRef={coilRef} from={coil.from} to={coil.to} />}

      {cabinLight && (
        <pointLight ref={cabinLightRef} position={cabinLight} color="#ffb27a" intensity={0} distance={2.6} decay={2} />
      )}
    </>
  )
}
