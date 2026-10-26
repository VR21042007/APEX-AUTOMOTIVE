import * as THREE from 'three'
import { CAR_WHEELS } from '../../lib/carModel'

// Builds the animation rig for one cloned P1: which nodes explode and where,
// which meshes form the outer shell for the X-ray, which internals glow, and
// pivots for the wheels. Everything is measured from the loaded model, so the
// numbers below are world-space offsets in metres (car faces +Z, left is +X).

const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()
const tmpC = new THREE.Vector3()
const tmpCentroid = new THREE.Vector3()

export const EXPLODE_GROUPS = [
  { key: 'frontBumper', nodes: ['FRONT_BUMPER'], offset: [0, -0.04, 1.45], label: 'Front bumper', index: '01' },
  { key: 'hood', nodes: ['HOOD', 'WIPER_1'], offset: [0, 1.05, 0.7], label: 'Front hood', index: '02' },
  { key: 'fenders', nodes: ['GEO_frontFender', 'FRONT_LIGHT'], offset: [0, 0.38, 1.05] },
  { key: 'doors', nodes: ['DOOR_L1', 'DOOR_R1'], side: [1.4, 0.32, 0.05], label: 'Dihedral doors', index: '03' },
  { key: 'roof', roof: true, offset: [0, 1.3, -0.12], label: 'Roof', index: '04' },
  {
    key: 'rear',
    nodes: ['g_Body_SUB2', 'g_Body_SUB4', 'g_Body_SUB13', 'REAR_LIGHT', 'WING_0', 'MOTORHOOD'],
    offset: [0, 0.48, -1.45],
    label: 'Rear clamshell',
    index: '05',
  },
  { key: 'rear', nodes: ['REAR_BUMPER'], offset: [0, -0.04, -1.9] },
]

// Outer bodywork that turns to glass during the X-ray. The carbon tub
// (g_Body_SUB5) and the mechanical layer (g_Body_SUB12) stay solid.
const SHELL_ROOTS = [
  'g_Body',
  'DOOR_L1',
  'DOOR_R1',
  'HOOD',
  'FRONT_BUMPER',
  'GEO_frontFender',
  'REAR_BUMPER',
  'WING_0',
  'MOTORHOOD',
  'WIPER_1',
  'FRONT_LIGHT',
  'REAR_LIGHT',
  'polymsh_extracted12',
  'polymsh_detached73',
]
const SHELL_EXCLUDE = new Set(['g_Body_SUB5', 'g_Body_SUB12'])

export const XRAY_COMPONENTS = [
  {
    key: 'monocage',
    nodes: ['g_Body_SUB5'],
    title: 'Carbon MonoCage',
    detail: 'One-piece carbon tub',
    anchor: (car) => [0, car.height * 0.82, 0.15],
  },
  {
    key: 'powertrain',
    engineBay: true,
    title: 'Twin-turbo V8 hybrid',
    detail: 'Mid-mounted, behind the cell',
    anchor: (car) => [0, car.height * 0.55, -car.length * 0.24],
  },
  {
    key: 'suspension',
    match: /^g_Susp_ALever|^SUSP_/,
    title: 'Double wishbones',
    detail: 'Hydro-pneumatic, all four corners',
    anchorNode: 'g_Susp_ALever_Top_LR',
  },
  {
    key: 'brakes',
    match: /^DISC_/,
    title: 'Carbon-ceramic brakes',
    detail: '390 mm discs, four corners',
    anchorNode: 'DISC_LR',
  },
]

export const WHEEL_LABELS = [
  { key: 'rim', title: 'Forged rim', detail: 'Centre-lock, ten-spoke' },
  { key: 'disc', title: 'Carbon-ceramic disc', detail: 'Six-piston caliper' },
  { key: 'arms', title: 'Double wishbone', detail: 'Upper and lower arms' },
]

// Every label the scene can show, in the order the DOM layer renders them.
export const SCENE_LABELS = [
  ...EXPLODE_GROUPS.filter((group) => group.label).map((group) => ({
    id: `explode-${group.key}`,
    index: group.index,
    title: group.label,
  })),
  ...XRAY_COMPONENTS.map((component, index) => ({
    id: `xray-${component.key}`,
    index: `0${index + 1}`,
    title: component.title,
    detail: component.detail,
  })),
  ...WHEEL_LABELS.map((item, index) => ({
    id: `wheel-${item.key}`,
    index: `0${index + 1}`,
    title: item.title,
    detail: item.detail,
    flip: item.key !== 'rim',
  })),
]

function worldCenter(object) {
  return new THREE.Box3().setFromObject(object, true).getCenter(new THREE.Vector3())
}

// Converts a world-space displacement into the object's parent space.
function toParentSpace(object, worldOffset) {
  const parent = object.parent
  parent.updateWorldMatrix(true, false)
  const inverse = parent.matrixWorld.clone().invert()
  const origin = object.getWorldPosition(new THREE.Vector3())
  const moved = origin.clone().add(worldOffset)
  return moved.applyMatrix4(inverse).sub(origin.applyMatrix4(inverse))
}

const splitCache = new WeakMap()

// Splits a mesh's triangles by a world-space test, sharing the vertex buffers.
function splitMesh(mesh, test) {
  const source = mesh.geometry
  if (splitCache.has(source)) return splitCache.get(source)
  const position = source.attributes.position
  const index = source.index
  const count = index ? index.count : position.count
  const inside = []
  const outside = []
  for (let corner = 0; corner < count; corner += 3) {
    const a = index ? index.getX(corner) : corner
    const b = index ? index.getX(corner + 1) : corner + 1
    const c = index ? index.getX(corner + 2) : corner + 2
    tmpA.fromBufferAttribute(position, a).applyMatrix4(mesh.matrixWorld)
    tmpB.fromBufferAttribute(position, b).applyMatrix4(mesh.matrixWorld)
    tmpC.fromBufferAttribute(position, c).applyMatrix4(mesh.matrixWorld)
    tmpCentroid.copy(tmpA).add(tmpB).add(tmpC).divideScalar(3)
    ;(test(tmpCentroid) ? inside : outside).push(a, b, c)
  }
  const build = (indices) => {
    if (!indices.length) return null
    const geometry = new THREE.BufferGeometry()
    for (const [name, attribute] of Object.entries(source.attributes)) geometry.setAttribute(name, attribute)
    geometry.setIndex(indices)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
  }
  const result = { inside: build(inside), outside: build(outside) }
  splitCache.set(source, result)
  return result
}

function makeGhostMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#38b6e0') },
      uScanColor: { value: new THREE.Color('#ff8a1f') },
      uScanZ: { value: 10 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec4 view = viewMatrix * world;
        vWorld = world.xyz;
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-view.xyz);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      uniform vec3 uScanColor;
      uniform float uScanZ;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        // Clamp before pow(): a negative base is undefined in GLSL and yields NaN.
        float facing = clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0);
        float rim = pow(1.0 - facing, 2.4);
        float d = (vWorld.z - uScanZ) * 3.2;
        float band = exp(-d * d);
        vec3 color = mix(uColor, uScanColor, clamp(band * 1.4, 0.0, 1.0));
        float alpha = (0.07 + rim * 0.7 + band * 0.45) * uOpacity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function uniqueMaterial(mesh) {
  if (mesh.userData.ownMaterial) return mesh.material
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone()
  mesh.userData.ownMaterial = true
  return mesh.material
}

const eachMaterial = (mesh, fn) => (Array.isArray(mesh.material) ? mesh.material.forEach(fn) : fn(mesh.material))

export function buildCarRig(car) {
  // The rig mutates the car (split meshes, ghost overlays, cloned materials), so
  // it is built once per car even when React runs the memo twice in StrictMode.
  if (car.userData.rig) return car.userData.rig
  car.updateMatrixWorld(true)
  const find = (name) => car.getObjectByName(name)
  const bounds = new THREE.Box3().setFromObject(car, true)
  const size = bounds.getSize(new THREE.Vector3())
  const dims = { length: size.z, width: size.x, height: size.y, top: bounds.max.y }

  // Every animated node keeps its rest transform; offsets are summed each frame.
  const tracks = new Map()
  const track = (object) => {
    if (!tracks.has(object)) {
      tracks.set(object, {
        object,
        basePosition: object.position.clone(),
        baseQuaternion: object.quaternion.clone(),
        offsets: [],
        spin: null,
      })
    }
    return tracks.get(object)
  }
  const addOffset = (object, worldOffset, key) => {
    const entry = { key, local: toParentSpace(object, new THREE.Vector3(...worldOffset)), amount: 0 }
    track(object).offsets.push(entry)
    return entry
  }

  // --- Roof: cut the top skin of the body away so it can lift off.
  const roofTop = dims.top
  const roofMeshes = []
  const bodyRoot = find('g_Body')
  const roofTest = (point) =>
    point.y > roofTop - 0.13 && Math.abs(point.x) < dims.width * 0.32 && point.z > -dims.length * 0.2 && point.z < dims.length * 0.1
  const bodyMeshes = []
  bodyRoot?.traverse((child) => child.isMesh && bodyMeshes.push(child))
  bodyMeshes.forEach((child) => {
    const owner = child.parent?.name || ''
    if (/SUB2$|SUB4$|SUB13$|SUB0$|SUB7$/.test(owner)) return // rear clam, glass
    const { inside, outside } = splitMesh(child, roofTest)
    if (!inside) return
    const roof = new THREE.Mesh(inside, child.material)
    roof.name = `${child.name}_Roof`
    roof.userData.roofPiece = true
    roof.castShadow = true
    roof.receiveShadow = true
    roof.position.copy(child.position)
    roof.quaternion.copy(child.quaternion)
    roof.scale.copy(child.scale)
    child.parent.add(roof)
    if (outside) child.geometry = outside
    else child.visible = false
    roofMeshes.push(roof)
  })
  car.updateMatrixWorld(true)

  // --- Engine bay: the mechanical layer runs the full length of the car, so only
  // the part behind the cabin is lifted out as the powertrain highlight.
  const mechanical = find('g_Body_SUB12')
  const engineBay = []
  mechanical?.traverse((child) => {
    if (!child.isMesh) return
    const { inside, outside } = splitMesh(child, (point) => point.z < -dims.length * 0.1 && Math.abs(point.x) < dims.width * 0.36)
    if (!inside || !outside) return
    const bay = new THREE.Mesh(inside, child.material)
    bay.name = 'EngineBay'
    bay.castShadow = true
    bay.receiveShadow = true
    bay.position.copy(child.position)
    bay.quaternion.copy(child.quaternion)
    bay.scale.copy(child.scale)
    child.parent.add(bay)
    child.geometry = outside
    engineBay.push(bay)
  })

  // --- Exploded view.
  const explode = []
  for (const group of EXPLODE_GROUPS) {
    const objects = group.roof ? roofMeshes : group.nodes.map(find).filter(Boolean)
    const entries = objects.map((object) => {
      let offset = group.offset
      if (group.side) {
        const sign = Math.sign(worldCenter(object).x) || 1
        offset = [group.side[0] * sign, group.side[1], group.side[2]]
      }
      return { object, offset: addOffset(object, offset, 'explode'), bob: addOffset(object, [0, 0.05, 0], 'bob') }
    })
    explode.push({ ...group, entries })
  }
  const explodeLabels = explode
    .filter((group) => group.label && group.entries.length)
    .map((group) => {
      const box = new THREE.Box3()
      group.entries.forEach(({ object }) => box.expandByObject(object, true))
      const center = box.getCenter(new THREE.Vector3())
      const offset = new THREE.Vector3(...(group.offset || [group.side[0], group.side[1], group.side[2]]))
      // Doors label sits on the +X door, the one facing the explode camera.
      if (group.side) center.x = Math.abs(center.x) + 0.2
      return { key: group.key, title: group.label, index: group.index, base: center, offset }
    })

  // --- X-ray shell and ghost overlays.
  const ghostMaterial = makeGhostMaterial()
  const shell = []
  SHELL_ROOTS.map(find).filter(Boolean).forEach((root) => {
    const meshes = []
    root.traverse((child) => child.isMesh && meshes.push(child))
    meshes.forEach((child) => {
      if (!child.userData.roofPiece) {
        for (let node = child; node && node !== root; node = node.parent) {
          if (SHELL_EXCLUDE.has(node.name)) return
        }
      }
      uniqueMaterial(child)
      const base = []
      eachMaterial(child, (material) =>
        base.push({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite }),
      )
      const ghost = new THREE.Mesh(child.geometry, ghostMaterial)
      ghost.visible = false
      ghost.renderOrder = 3
      ghost.frustumCulled = child.frustumCulled
      child.add(ghost)
      shell.push({ mesh: child, base, ghost, castShadow: child.castShadow })
    })
  })

  // --- Glowing internals.
  const glowColor = new THREE.Color('#ff7a00')
  const xray = XRAY_COMPONENTS.map((component) => {
    const roots = component.engineBay
      ? engineBay
      : component.nodes
      ? component.nodes.map(find).filter(Boolean)
      : (() => {
          const list = []
          car.traverse((object) => {
            if (component.match.test(object.name) && !component.match.test(object.parent?.name || '')) list.push(object)
          })
          return list
        })()
    const materials = []
    roots.forEach((root) =>
      root.traverse((child) => {
        if (!child.isMesh || child.userData.roofPiece) return
        uniqueMaterial(child)
        eachMaterial(child, (material) => {
          if (!material.emissive) return
          materials.push({ material, emissive: material.emissive.clone(), intensity: material.emissiveIntensity })
        })
      }),
    )
    const anchor = component.anchorNode
      ? worldCenter(find(component.anchorNode))
      : new THREE.Vector3(...component.anchor(dims))
    return { ...component, materials, anchor }
  })

  // --- Wheels: pivots for rolling, and the front-left corner for the teardown.
  const spinners = []
  for (const name of [...CAR_WHEELS, 'DISC_LF', 'DISC_RF', 'DISC_LR', 'DISC_RR']) {
    const object = find(name)
    if (!object) continue
    const center = worldCenter(object)
    const parent = object.parent
    const inverse = parent.matrixWorld.clone().invert()
    const pivot = center.clone().applyMatrix4(inverse)
    const axisEnd = center.clone().add(new THREE.Vector3(1, 0, 0)).applyMatrix4(inverse)
    const entry = track(object)
    entry.spin = { pivot, axis: axisEnd.sub(pivot).normalize(), angle: 0 }
    spinners.push(entry)
  }

  const wheelNode = find('WHEEL_LF')
  const wheelCenter = wheelNode ? worldCenter(wheelNode) : new THREE.Vector3(0.85, 0.33, 1.2)
  const tyreBox = wheelNode ? new THREE.Box3().setFromObject(wheelNode, true) : null
  const wheelRadius = tyreBox ? (tyreBox.max.y - tyreBox.min.y) / 2 : 0.34
  const cornerNodes = ['WHEEL_LF', 'DISC_LF', 'SUSP_LF', 'g_Susp_ALever_Top_LF', 'g_Susp_ALever_Btm_LF']
    .map(find)
    .filter(Boolean)
  const wheelOut = cornerNodes.map((object) => addOffset(object, [0.34, 0, 0.1], 'wheelOut'))
  const wheelSeparate = wheelNode ? [addOffset(wheelNode, [1.0, 0.02, 0.18], 'wheelSeparate')] : []
  const discNode = find('DISC_LF')
  const armNode = find('g_Susp_ALever_Top_LF')
  const outVector = new THREE.Vector3(0.34, 0, 0.1)
  const still = new THREE.Vector3()
  const wheelLabelAnchors = {
    rim: {
      base: wheelCenter.clone().add(new THREE.Vector3(0.12, wheelRadius * 0.7, 0)),
      out: outVector,
      separate: new THREE.Vector3(1.0, 0.02, 0.18),
    },
    disc: {
      base: discNode ? worldCenter(discNode).add(new THREE.Vector3(0.05, -0.12, 0)) : wheelCenter.clone(),
      out: outVector,
      separate: still,
    },
    arms: {
      base: armNode ? worldCenter(armNode).add(new THREE.Vector3(0, 0.16, -0.1)) : wheelCenter.clone(),
      out: outVector,
      separate: still,
    },
  }

  // --- Cockpit anchors and the indicator LEDs on the steering column.
  const steering = find('STEER_HR')
  const steeringCenter = steering ? worldCenter(steering) : new THREE.Vector3(0.32, 0.7, 0.45)
  const screens = []
  const indicators = []
  find('COCKPIT_HR')?.traverse((child) => {
    if (!child.isMesh) return
    const material = Array.isArray(child.material) ? child.material[0] : child.material
    if (material?.name !== 'INT_DISPLAY') return
    uniqueMaterial(child)
    const own = Array.isArray(child.material) ? child.material[0] : child.material
    own.emissive.set('#ffffff')
    own.emissiveMap = own.map
    own.needsUpdate = true
    const entry = { mesh: child, material: own, order: worldCenter(child).x }
    ;(child.name.startsWith('polymsh') ? screens : indicators).push(entry)
  })
  indicators.sort((a, b) => b.order - a.order)

  const rig = {
    dims,
    tracks: [...tracks.values()],
    explode,
    explodeLabels,
    shell,
    ghostMaterial,
    xray,
    glowColor,
    spinners,
    wheel: { center: wheelCenter, radius: wheelRadius, out: wheelOut, separate: wheelSeparate, labels: wheelLabelAnchors },
    cockpit: { steering: steeringCenter, screens, indicators },
  }
  car.userData.rig = rig
  return rig
}

const spinQuaternion = new THREE.Quaternion()
const spunOffset = new THREE.Vector3()

// Writes every tracked node's transform from its rest pose, spin and offsets.
export function applyTracks(tracks) {
  for (const entry of tracks) {
    const { object, basePosition, baseQuaternion, offsets, spin } = entry
    object.position.copy(basePosition)
    object.quaternion.copy(baseQuaternion)
    if (spin && spin.angle !== 0) {
      spinQuaternion.setFromAxisAngle(spin.axis, spin.angle)
      object.quaternion.premultiply(spinQuaternion)
      spunOffset.copy(basePosition).sub(spin.pivot).applyQuaternion(spinQuaternion)
      object.position.copy(spin.pivot).add(spunOffset)
    }
    for (const offset of offsets) {
      if (offset.amount) object.position.addScaledVector(offset.local, offset.amount)
    }
  }
}

// Fades the painted shell towards the ghost overlay (0 = solid, 1 = X-ray).
export function applyShell(rig, amount) {
  if (rig.shellAmount === amount) return
  rig.shellAmount = amount
  const solid = amount <= 0.001
  const hidden = amount >= 0.985
  for (const item of rig.shell) {
    item.ghost.visible = !solid
    item.mesh.castShadow = item.castShadow && amount < 0.5
    for (const base of item.base) {
      const { material } = base
      const transparent = solid ? base.transparent : true
      if (material.transparent !== transparent) {
        material.transparent = transparent
        material.needsUpdate = true
      }
      material.opacity = solid ? base.opacity : base.opacity * (1 - amount)
      material.depthWrite = solid ? base.depthWrite : false
      material.visible = !hidden
    }
  }
  rig.ghostMaterial.uniforms.uOpacity.value = amount
}
