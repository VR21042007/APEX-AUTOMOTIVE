import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { cinematicState } from '../../lib/cinematicState'
import { environmentWeights } from '../../lib/cinematicTimeline'
import { driveState } from './driveState'
import { asphaltTexture, carbonWeaveTexture, glowTexture, kerbTexture } from './textures'

const mix3 = (target, weights, studio, carbon, track) =>
  target
    .copy(studio)
    .multiplyScalar(weights.studio)
    .add(tmpColor.copy(carbon).multiplyScalar(weights.carbon))
    .add(tmpColor2.copy(track).multiplyScalar(weights.track))
const blend = (weights, studio, carbon, track) =>
  studio * weights.studio + carbon * weights.carbon + track * weights.track

const tmpColor = new THREE.Color()
const tmpColor2 = new THREE.Color()
const color = (hex) => new THREE.Color(hex)

const PALETTE = {
  key: [color('#ffffff'), color('#dfe8f2'), color('#ffb36b')],
  fill: [color('#eef2f5'), color('#9fb4c8'), color('#8fa6d6')],
  skyHemi: [color('#ffffff'), color('#1c2430'), color('#6d7fb0')],
  groundHemi: [color('#c8cac8'), color('#020304'), color('#21160f')],
  floor: [color('#d4d7d5'), color('#060708'), color('#060708')],
}

function useWeights() {
  const ref = useRef(environmentWeights(0))
  useFrame(() => {
    ref.current = environmentWeights(cinematicState.progress)
  }, -1)
  return ref
}

function setOpacity(material, value) {
  if (!material) return
  material.opacity = value
  material.visible = value > 0.003
}

function WorldLighting({ weights }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const ambient = useRef(null)
  const hemi = useRef(null)
  const key = useRef(null)
  const fill = useRef(null)
  const sweep = useRef(null)
  const rimLeft = useRef(null)
  const rimRight = useRef(null)
  const flood = useRef(null)
  const fog = useMemo(() => new THREE.Fog('#c7764a', 20, 90), [])
  const fogStudio = useMemo(() => color('#e7e9e7'), [])
  const fogCarbon = useMemo(() => color('#050607'), [])
  const fogTrack = useMemo(() => color('#3a2a3a'), [])
  const keyPosition = useMemo(
    () => [new THREE.Vector3(4, 9, 5), new THREE.Vector3(1.5, 8, 1.5), new THREE.Vector3(-7, 4.5, -11)],
    [],
  )

  useFrame((state) => {
    const w = weights.current
    const time = state.clock.elapsedTime
    if (ambient.current) ambient.current.intensity = blend(w, 0.9, 0.04, 0.22)
    if (hemi.current) {
      hemi.current.intensity = blend(w, 1.1, 0.12, 0.75)
      mix3(hemi.current.color, w, ...PALETTE.skyHemi)
      mix3(hemi.current.groundColor, w, ...PALETTE.groundHemi)
    }
    if (key.current) {
      key.current.intensity = blend(w, 3.4, 0.55, 3.1)
      mix3(key.current.color, w, ...PALETTE.key)
      key.current.position
        .copy(keyPosition[0])
        .multiplyScalar(w.studio)
        .addScaledVector(keyPosition[1], w.carbon)
        .addScaledVector(keyPosition[2], w.track)
    }
    if (fill.current) {
      fill.current.intensity = blend(w, 1.5, 0, 0.6)
      mix3(fill.current.color, w, ...PALETTE.fill)
    }
    // Carbon chamber: a narrow light bar sweeps nose to tail, rims trace the silhouette.
    if (sweep.current) {
      sweep.current.intensity = w.carbon * 90
      sweep.current.position.set(0.4, 4.2, Math.sin(time * 0.42) * 3.4)
    }
    for (const rim of [rimLeft.current, rimRight.current]) {
      if (!rim) continue
      rim.intensity = w.carbon * 60 + w.track * 20
    }
    if (flood.current) {
      flood.current.intensity = w.track * 160
    }

    gl.toneMappingExposure = blend(w, 0.98, 1.25, 1.08)
    if (scene.fog !== fog) scene.fog = fog
    mix3(fog.color, w, fogStudio, fogCarbon, fogTrack)
    fog.near = blend(w, 40, 14, 22)
    fog.far = blend(w, 120, 40, 95)
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.9} />
      <hemisphereLight ref={hemi} args={['#ffffff', '#c8cac8', 1.1]} />
      <directionalLight
        ref={key}
        position={[4, 9, 5]}
        intensity={3.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      <directionalLight ref={fill} position={[-5, 4, -4]} intensity={1.5} />
      <spotLight ref={sweep} color="#f4f6f8" angle={0.22} penumbra={0.9} distance={12} decay={2} intensity={0}>
        <object3D attach="target" position={[0, 0.4, 0]} />
      </spotLight>
      <spotLight ref={rimLeft} position={[5.5, 3.4, -5.5]} color="#cfe3ff" angle={0.5} penumbra={1} distance={16} decay={2} intensity={0}>
        <object3D attach="target" position={[0, 0.6, 0]} />
      </spotLight>
      <spotLight ref={rimRight} position={[-5.5, 3.4, -5.5]} color="#cfe3ff" angle={0.5} penumbra={1} distance={16} decay={2} intensity={0}>
        <object3D attach="target" position={[0, 0.6, 0]} />
      </spotLight>
      <spotLight ref={flood} position={[2, 11, 12]} color="#e8efff" angle={0.45} penumbra={0.8} distance={30} decay={2} intensity={0}>
        <object3D attach="target" position={[0, 0.4, 0]} />
      </spotLight>
    </>
  )
}

// Reflections on the paint come from this environment map. Each mood has its
// own light formers. The cube map is re-captured only while the mood weights are
// changing; a static scene costs nothing extra per frame.
const LIGHT_FORMERS = [
  // White studio: overhead softbox, side strips, front fill.
  { form: 'rect', scale: [12, 4], position: [0, 6, -1], rotation: [Math.PI / 2, 0, 0], mood: ['studio', 2.6] },
  { form: 'rect', scale: [7, 2.4], position: [-7, 2.5, 0], rotation: [0, Math.PI / 2, 0], mood: ['studio', 1.7] },
  { form: 'rect', scale: [7, 2.4], position: [7, 2.5, 0], rotation: [0, -Math.PI / 2, 0], mood: ['studio', 1.7] },
  { form: 'rect', scale: [10, 3], position: [0, 2, 8], rotation: [0, Math.PI, 0], mood: ['studio', 1.2] },
  // Carbon chamber: narrow ceiling bars and two rim blades.
  { form: 'rect', scale: [0.35, 10], position: [-2, 5, 0], rotation: [Math.PI / 2, 0, 0], mood: ['carbon', 4.5] },
  { form: 'rect', scale: [0.35, 10], position: [0, 5, 0], rotation: [Math.PI / 2, 0, 0], mood: ['carbon', 5] },
  { form: 'rect', scale: [0.35, 10], position: [2, 5, 0], rotation: [Math.PI / 2, 0, 0], mood: ['carbon', 4.5] },
  { form: 'rect', scale: [0.25, 4], position: [-6, 1.5, -3], rotation: [0, Math.PI / 2, 0], mood: ['carbon', 4] },
  { form: 'rect', scale: [0.25, 4], position: [6, 1.5, -3], rotation: [0, -Math.PI / 2, 0], mood: ['carbon', 4] },
  // Circuit: warm horizon band, dusk sky, two floodlights.
  { form: 'rect', scale: [60, 3], position: [0, 1.2, -25], rotation: [0, 0, 0], color: '#ff9a52', mood: ['track', 2.8] },
  { form: 'rect', scale: [40, 40], position: [0, 18, 0], rotation: [Math.PI / 2, 0, 0], color: '#41558c', mood: ['track', 0.7] },
  { form: 'circle', scale: [2, 2], position: [6, 9, 10], rotation: [0, Math.PI, 0], color: '#eef3ff', mood: ['track', 3] },
  { form: 'circle', scale: [2, 2], position: [-6, 9, 10], rotation: [0, Math.PI, 0], color: '#eef3ff', mood: ['track', 3] },
]

function EnvironmentMap({ weights }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const rig = useMemo(() => {
    const virtualScene = new THREE.Scene()
    const target = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType })
    const camera = new THREE.CubeCamera(0.1, 100, target)
    const formers = LIGHT_FORMERS.map((former) => {
      const geometry = former.form === 'circle' ? new THREE.CircleGeometry(0.5, 48) : new THREE.PlaneGeometry(1, 1)
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...former.position)
      mesh.rotation.set(...former.rotation)
      mesh.scale.set(former.scale[0], former.scale[1], 1)
      virtualScene.add(mesh)
      return { mesh, base: new THREE.Color(former.color || '#ffffff'), mood: former.mood }
    })
    return { virtualScene, target, camera, formers, key: '' }
  }, [])

  useEffect(() => {
    scene.environment = rig.target.texture
    return () => {
      if (scene.environment === rig.target.texture) scene.environment = null
      rig.target.dispose()
      rig.formers.forEach(({ mesh }) => {
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
    }
  }, [rig, scene])

  useFrame(() => {
    const w = weights.current
    const key = `${w.studio.toFixed(3)}|${w.carbon.toFixed(3)}|${w.track.toFixed(3)}`
    if (key === rig.key) return
    rig.key = key
    for (const former of rig.formers) {
      const [mood, intensity] = former.mood
      const level = w[mood] * intensity
      former.mesh.visible = level > 0.01
      former.mesh.material.color.copy(former.base).multiplyScalar(level)
    }
    rig.camera.update(gl, rig.virtualScene)
  })

  return null
}

function ReflectiveFloor({ weights, reflective }) {
  const material = useRef(null)
  const mesh = useRef(null)

  useFrame(() => {
    const w = weights.current
    if (mesh.current) mesh.current.visible = w.track < 0.995
    if (!material.current) return
    mix3(material.current.color, w, ...PALETTE.floor)
    material.current.roughness = blend(w, 0.55, 0.32, 0.32)
    if (reflective) material.current.mixStrength = blend(w, 0.9, 4.2, 4.2)
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[140, 140]} />
      {reflective ? (
        <MeshReflectorMaterial
          ref={material}
          blur={[300, 90]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.9}
          mixContrast={1}
          depthScale={0.9}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          mirror={0.6}
          roughness={0.55}
          metalness={0.25}
          color="#d4d7d5"
        />
      ) : (
        <meshStandardMaterial ref={material} color="#d4d7d5" roughness={0.45} metalness={0.2} />
      )}
    </mesh>
  )
}

// Seamless white cyclorama.
function StudioSet({ weights }) {
  const wall = useRef(null)
  const softbox = useRef(null)
  useFrame(() => {
    setOpacity(wall.current, weights.current.studio)
    setOpacity(softbox.current, weights.current.studio)
  })
  return (
    <group>
      <mesh position={[0, 8, 0]} renderOrder={-5}>
        <cylinderGeometry args={[19, 19, 16, 64, 1, true]} />
        <meshStandardMaterial ref={wall} color="#eef0ee" roughness={0.92} side={THREE.BackSide} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 7.5, -1]} rotation={[Math.PI / 2, 0, 0]} renderOrder={-5}>
        <planeGeometry args={[11, 4]} />
        <meshBasicMaterial ref={softbox} color="#ffffff" transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Octagonal room lined in carbon twill, with ceiling light bars and wall blades.
function CarbonChamber({ weights }) {
  const materials = useRef([])
  const weave = useMemo(() => {
    const texture = carbonWeaveTexture().clone()
    texture.repeat.set(150, 18)
    texture.needsUpdate = true
    return texture
  }, [])
  const ceilingWeave = useMemo(() => {
    const texture = carbonWeaveTexture().clone()
    texture.repeat.set(70, 70)
    texture.needsUpdate = true
    return texture
  }, [])
  const add = (index) => (node) => {
    materials.current[index] = node
  }

  useFrame(() => {
    const level = weights.current.carbon
    materials.current.forEach((material) => setOpacity(material, level))
  })

  const blades = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8
    return [Math.sin(angle) * 10.2, Math.cos(angle) * 10.2, angle]
  })

  return (
    <group>
      <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 8, 0]} renderOrder={-5}>
        <cylinderGeometry args={[10.5, 10.5, 8, 8, 1, true]} />
        <meshStandardMaterial
          ref={add(0)}
          map={weave}
          emissiveMap={weave}
          emissive="#8d99a6"
          emissiveIntensity={0.55}
          color="#9aa0a6"
          roughness={0.34}
          metalness={0.55}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={-5}>
        <circleGeometry args={[10.6, 8]} />
        <meshStandardMaterial
          ref={add(1)}
          map={ceilingWeave}
          emissiveMap={ceilingWeave}
          emissive="#8d99a6"
          emissiveIntensity={0.35}
          color="#8a9096"
          roughness={0.4}
          metalness={0.5}
          transparent
          depthWrite={false}
        />
      </mesh>
      {[-2, 0, 2].map((x, index) => (
        <mesh key={x} position={[x, 7.9, 0]}>
          <boxGeometry args={[0.16, 0.04, 9]} />
          <meshBasicMaterial ref={add(2 + index)} color="#f4f7fa" transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {blades.map(([x, z, angle], index) => (
        <mesh key={index} position={[x, 3.4, z]} rotation={[0, angle, 0]}>
          <boxGeometry args={[0.05, 5.6, 0.05]} />
          <meshBasicMaterial ref={add(5 + index)} color="#cfe3ff" transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {/* Display plinth outline on the floor. */}
      {[
        [0, 2.95, 6.4, 0.025],
        [0, -2.95, 6.4, 0.025],
        [3.2, 0, 0.025, 5.9],
        [-3.2, 0, 0.025, 5.9],
      ].map(([x, z, w, d], index) => (
        <mesh key={`line-${index}`} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial ref={add(13 + index)} color="#5d6670" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const SKY_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vDirection;
  void main() {
    float h = vDirection.y;
    vec3 zenith = vec3(0.035, 0.055, 0.12);
    vec3 upper = vec3(0.16, 0.13, 0.27);
    vec3 horizon = vec3(1.0, 0.46, 0.2);
    vec3 ground = vec3(0.05, 0.035, 0.035);
    vec3 color = mix(horizon, upper, smoothstep(0.0, 0.22, h));
    color = mix(color, zenith, smoothstep(0.2, 0.7, h));
    color = mix(ground, color, smoothstep(-0.05, 0.01, h));
    // Setting sun behind the car.
    vec3 sunDirection = normalize(vec3(-0.75, 0.025, -1.0));
    float sun = pow(max(dot(normalize(vDirection), sunDirection), 0.0), 220.0);
    float halo = pow(max(dot(normalize(vDirection), sunDirection), 0.0), 9.0);
    color += vec3(1.0, 0.62, 0.32) * (sun * 3.0 + halo * 0.45);
    gl_FragColor = vec4(color, uOpacity);
  }
`

const TRACK_LENGTH = 240
const POLE_SPACING = 24
const POLES = TRACK_LENGTH / POLE_SPACING

function wrap(value, length) {
  return ((((value + length / 2) % length) + length) % length) - length / 2
}

// Dusk circuit: the car stays put while the asphalt, kerbs and floodlights stream past.
function Racetrack({ weights }) {
  const group = useRef(null)
  const sky = useRef(null)
  const fade = useRef([])
  const poles = useRef([])
  const halos = useRef([])
  const asphalt = useMemo(() => {
    const texture = asphaltTexture().clone()
    texture.repeat.set(3, TRACK_LENGTH / 5)
    texture.needsUpdate = true
    return texture
  }, [])
  const kerb = useMemo(() => {
    const texture = kerbTexture().clone()
    texture.repeat.set(1, TRACK_LENGTH / 2)
    texture.needsUpdate = true
    return texture
  }, [])
  const glow = useMemo(() => glowTexture(), [])
  const hills = useMemo(() => {
    const segments = 160
    const positions = []
    const height = (t) => 3 + Math.sin(t * 7) * 1.6 + Math.sin(t * 19 + 1.3) * 0.9 + Math.sin(t * 43) * 0.35
    for (let index = 0; index < segments; index += 1) {
      const a = (index / segments) * Math.PI * 2
      const b = ((index + 1) / segments) * Math.PI * 2
      const [x1, z1, x2, z2] = [Math.sin(a) * 100, Math.cos(a) * 100, Math.sin(b) * 100, Math.cos(b) * 100]
      positions.push(x1, -1, z1, x2, -1, z2, x2, height(b), z2, x1, -1, z1, x2, height(b), z2, x1, height(a), z1)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [])
  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  const add = (index) => (node) => {
    fade.current[index] = node
  }

  useFrame(() => {
    const level = weights.current.track
    if (group.current) group.current.visible = level > 0.003
    if (level <= 0.003) return
    skyMaterial.uniforms.uOpacity.value = level
    fade.current.forEach((material) => material && (material.opacity = level))
    const distance = driveState.distance
    asphalt.offset.y = distance / 5
    kerb.offset.y = distance / 2
    poles.current.forEach((pole, index) => {
      if (!pole) return
      const side = index % 2 === 0 ? 1 : -1
      const slot = Math.floor(index / 2)
      pole.position.set(side * 10.5, 0, wrap(slot * POLE_SPACING - distance + (side > 0 ? 0 : POLE_SPACING / 2), TRACK_LENGTH))
    })
    halos.current.forEach((halo) => halo && (halo.material.opacity = level * 0.7))
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={sky} material={skyMaterial} renderOrder={-10}>
        <sphereGeometry args={[110, 48, 24]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial ref={add(0)} color="#0d0f0d" roughness={1} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[15, TRACK_LENGTH]} />
        <meshStandardMaterial ref={add(1)} map={asphalt} color="#a9adb3" roughness={0.78} metalness={0.05} transparent />
      </mesh>
      {[-1, 1].map((side, index) => (
        <group key={side}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 7.95, 0.006, 0]} receiveShadow>
            <planeGeometry args={[1.1, TRACK_LENGTH]} />
            <meshStandardMaterial ref={add(2 + index)} map={kerb} roughness={0.6} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 7.2, 0.007, 0]}>
            <planeGeometry args={[0.16, TRACK_LENGTH]} />
            <meshBasicMaterial ref={add(4 + index)} color="#e9e6df" transparent />
          </mesh>
          <mesh position={[side * 12.5, 0.55, 0]}>
            <boxGeometry args={[0.4, 1.1, TRACK_LENGTH]} />
            <meshStandardMaterial ref={add(6 + index)} color="#2a2d31" roughness={0.6} metalness={0.3} transparent />
          </mesh>
          <mesh position={[side * 12.28, 1.08, 0]}>
            <boxGeometry args={[0.05, 0.06, TRACK_LENGTH]} />
            <meshBasicMaterial ref={add(8 + index)} color="#ff7a00" transparent toneMapped={false} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: POLES * 2 }, (_, index) => (
        <group key={index} ref={(node) => (poles.current[index] = node)}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 10, 8]} />
            <meshStandardMaterial color="#1b1d20" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[index % 2 === 0 ? -0.6 : 0.6, 10, 0]}>
            <boxGeometry args={[1.4, 0.18, 0.5]} />
            <meshBasicMaterial color="#fff6e8" toneMapped={false} />
          </mesh>
          <sprite ref={(node) => (halos.current[index] = node)} position={[index % 2 === 0 ? -0.6 : 0.6, 9.9, 0]} scale={[1.7, 1.7, 1]}>
            <spriteMaterial map={glow} color="#fff1dc" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        </group>
      ))}
      {/* Distant hills in silhouette against the dusk sky. */}
      <mesh geometry={hills}>
        <meshBasicMaterial ref={add(10)} color="#120d18" side={THREE.DoubleSide} transparent />
      </mesh>
    </group>
  )
}

// Slow-drifting dust caught in the light; denser in the carbon chamber.
function Atmosphere({ weights }) {
  const points = useRef(null)
  const geometry = useMemo(() => {
    const count = 700
    const positions = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 18
      positions[index * 3 + 1] = Math.random() * 6
      positions[index * 3 + 2] = (Math.random() - 0.5) * 18
    }
    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return buffer
  }, [])
  const glow = useMemo(() => glowTexture(), [])

  useFrame((state) => {
    if (!points.current) return
    const w = weights.current
    const level = w.carbon * 0.55 + w.track * 0.3
    points.current.visible = level > 0.01
    points.current.material.opacity = level
    points.current.rotation.y = state.clock.elapsedTime * 0.012
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
    points.current.position.z = w.track > 0.01 ? -((driveState.distance * 0.6) % 18) + 9 : 0
  })

  return (
    <points ref={points} geometry={geometry} visible={false}>
      <pointsMaterial
        map={glow}
        size={0.05}
        sizeAttenuation
        color="#e6eef8"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0}
      />
    </points>
  )
}

export function CinematicWorld({ reflective = true }) {
  const weights = useWeights()
  return (
    <>
      <WorldLighting weights={weights} />
      <EnvironmentMap weights={weights} />
      <ReflectiveFloor weights={weights} reflective={reflective} />
      <StudioSet weights={weights} />
      <CarbonChamber weights={weights} />
      <Racetrack weights={weights} />
      <Atmosphere weights={weights} />
    </>
  )
}
