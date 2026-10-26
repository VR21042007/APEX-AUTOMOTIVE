import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const CAR_MODEL_URL = '/models/mclaren-p1.glb'
export const CAR_CREDIT =
  '“Mclaren P1 | www.vecarz.com” by vecarz (CC BY 4.0), via Sketchfab.'

export const CAR_WHEELS = ['WHEEL_LF', 'WHEEL_RF', 'WHEEL_LR', 'WHEEL_RR']

let cachedPromise = null
const progressListeners = new Set()

function emitProgress(value) {
  for (const listener of progressListeners) listener(value)
}

const processedMaterials = new WeakSet()

export const PAPAYA = '#ff7a00'

function styleMaterial(material) {
  if (!material || processedMaterials.has(material)) return material
  processedMaterials.add(material)
  const name = material.name || ''

  if (name === 'Carpaint') {
    material.color?.set(PAPAYA)
    material.metalness = 0.55
    material.roughness = 0.3
    if ('clearcoat' in material) {
      material.clearcoat = 1
      material.clearcoatRoughness = 0.03
    }
    material.envMapIntensity = 1.35
  } else if (name === 'Carpaint_Black') {
    material.envMapIntensity = 1.1
  } else if (name === 'Windows' || name === 'Windows_alpha' || name === 'Clear_Glass') {
    material.envMapIntensity = 0.8
  } else if (name === 'Chrome') {
    // The source file marks chrome as a 10x white emitter, which reads as a flat white blob.
    material.emissive?.set('#000000')
    material.emissiveIntensity = 0
    material.metalness = 1
    material.roughness = 0.12
  } else if (name === 'Headlights') {
    material.emissive?.set('#e6f2ff')
    material.emissiveMap = material.map
    material.emissiveIntensity = 0.9
  } else if (name === 'Taillights') {
    material.emissiveIntensity = 0.35
  } else if (name === 'Brake_Disk') {
    material.color?.set('#3a3c3e')
    material.metalness = 1
    material.roughness = 0.34
  } else if (name === 'INT_DISPLAY') {
    material.emissive?.set('#ffffff')
    material.emissiveMap = material.map
    material.emissiveIntensity = 0
  }

  material.needsUpdate = true
  if (material.map) {
    material.map.anisotropy = 8
    material.map.needsUpdate = true
  }
  if (material.normalMap) material.normalMap.anisotropy = 4
  return material
}

// Real McLaren P1 length. The source file is modelled at roughly 1:2.3 scale.
const TARGET_LENGTH = 4.59

function prepareCarScene(gltf) {
  const model = gltf.scene
  model.updateMatrixWorld(true)
  const rawBox = new THREE.Box3().setFromObject(model, true)
  const rawSize = rawBox.getSize(new THREE.Vector3())
  model.scale.multiplyScalar(TARGET_LENGTH / rawSize.z)

  const scene = new THREE.Group()
  scene.name = 'ApexCar'
  scene.add(model)
  scene.updateMatrixWorld(true)

  scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = true
    child.receiveShadow = true
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach(styleMaterial)
  })

  const box = new THREE.Box3().setFromObject(scene, true)
  const center = new THREE.Vector3()
  box.getCenter(center)

  let wheelBottom = Infinity
  for (const name of CAR_WHEELS) {
    const wheel = scene.getObjectByName(name)
    if (!wheel) continue
    const wheelBox = new THREE.Box3().setFromObject(wheel, true)
    wheelBottom = Math.min(wheelBottom, wheelBox.min.y)
  }
  if (!Number.isFinite(wheelBottom)) wheelBottom = box.min.y

  scene.userData.placement = {
    x: -center.x,
    y: -wheelBottom + 0.005,
    z: -center.z,
    length: box.max.z - box.min.z,
    width: box.max.x - box.min.x,
    height: box.max.y - box.min.y,
  }

  return scene
}

export function loadCarModel() {
  if (cachedPromise) return cachedPromise

  cachedPromise = new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('GET', CAR_MODEL_URL, true)
    request.responseType = 'arraybuffer'

    request.onprogress = (event) => {
      if (!event.lengthComputable || !event.total) return
      emitProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    }

    request.onerror = () => reject(new Error('Unable to download the vehicle model.'))
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Vehicle model request failed (${request.status}).`))
        return
      }
      emitProgress(100)
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      loader.parse(
        request.response,
        `${CAR_MODEL_URL.substring(0, CAR_MODEL_URL.lastIndexOf('/') + 1)}`,
        (gltf) => {
          try {
            resolve(prepareCarScene(gltf))
          } catch (error) {
            reject(error)
          }
        },
        (error) => reject(error)
      )
    }

    request.send()
  })

  return cachedPromise
}

export function subscribeToLoadProgress(listener) {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

export function instantiateCar(source, { cloneMaterials = false } = {}) {
  if (!source) return null
  const car = source.clone(true)
  const placement = source.userData.placement
  car.position.set(placement.x, placement.y, placement.z)
  car.rotation.set(0, 0, 0)
  car.scale.setScalar(1)

  if (cloneMaterials) {
    const materialCache = new Map()
    const cloneMaterial = (material) => {
      if (!material) return material
      if (materialCache.has(material)) return materialCache.get(material)
      const clone = material.clone()
      materialCache.set(material, clone)
      return clone
    }
    car.traverse((child) => {
      if (!child.isMesh) return
      child.material = Array.isArray(child.material)
        ? child.material.map(cloneMaterial)
        : cloneMaterial(child.material)
    })
  }

  return car
}
