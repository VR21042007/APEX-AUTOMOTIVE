import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const CAR_MODEL_URL = '/models/car-concept.glb'
export const CAR_CREDIT =
  'Car Concept by Eric Chadwick / Darmstadt Graphics Group (CC BY 4.0), based on Concept Car 004 by Unity Fan (CC0).'

const CAR_WHEELS = ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR']

let cachedPromise = null
const progressListeners = new Set()

function emitProgress(value) {
  for (const listener of progressListeners) listener(value)
}

function makePlateTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 1024)
  gradient.addColorStop(0, '#141517')
  gradient.addColorStop(1, '#050505')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 1024)
  ctx.strokeStyle = 'rgba(244, 241, 235, 0.45)'
  ctx.lineWidth = 8
  ctx.strokeRect(32, 32, 960, 960)
  ctx.fillStyle = '#F2E8CF'
  ctx.fillRect(32, 32, 960, 90)
  ctx.fillStyle = '#F2E8CF'
  ctx.font = '700 300px Anton, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('APEX', 512, 430)
  ctx.fillStyle = '#F3EFE7'
  ctx.font = '600 74px Manrope, Arial, sans-serif'
  ctx.letterSpacing = '18px'
  ctx.fillText('ASTRA / 001', 512, 670)
  ctx.fillStyle = '#F2E8CF'
  ctx.font = '500 48px Manrope, Arial, sans-serif'
  ctx.fillText('PERFORMANCE DIVISION', 512, 790)
  ctx.strokeStyle = 'rgba(244, 241, 235, 0.18)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(190, 870)
  ctx.lineTo(834, 870)
  ctx.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

const processedMaterials = new WeakSet()

function styleMaterial(material) {
  if (!material || processedMaterials.has(material)) return material
  processedMaterials.add(material)
  const name = material.name || ''

  if (name.startsWith('Paint 1')) {
    material.color?.set('#004225')
    material.metalness = 0.82
    material.roughness = 0.14
    material.normalScale?.set(0.06, 0.06)
    if ('clearcoat' in material) {
      material.clearcoat = 1
      material.clearcoatRoughness = 0.025
    }
    material.envMapIntensity = 1.18
    material.needsUpdate = true
  } else if (name.startsWith('Paint 2')) {
    material.color?.set('#002d1f')
    material.metalness = 0.8
    material.roughness = 0.18
    material.normalScale?.set(0.05, 0.05)
    if ('clearcoat' in material) {
      material.clearcoat = 1
      material.clearcoatRoughness = 0.04
    }
    material.envMapIntensity = 1.05
    material.needsUpdate = true
  } else if (name.startsWith('Glass')) {
    material.color?.set('#9aa6aa')
    material.metalness = 0
    material.roughness = 0.03
    material.envMapIntensity = 1.4
    if ('transmission' in material) material.transmission = 0.92
    if ('thickness' in material) material.thickness = 0.2
    if ('ior' in material) material.ior = 1.48
  } else if (name === 'Rim1' || name === 'Rim2') {
    material.color?.set('#b7b9bb')
    material.metalness = 1
    material.roughness = 0.24
    material.envMapIntensity = 1.5
  } else if (name === 'Brake') {
    material.color?.set('#00331c')
    material.metalness = 0.6
    material.roughness = 0.35
  } else if (name === 'Disc') {
    material.color?.set('#a4a5a5')
    material.metalness = 1
    material.roughness = 0.38
  } else if (name === 'Headlight') {
    material.emissive?.set('#e6f2ff')
    material.emissiveIntensity = 2.4
    material.roughness = 0.12
  } else if (name === 'Brakelight' || name === 'Signallight') {
    material.color?.set('#e51f00')
    material.emissive?.set('#ff2600')
    material.emissiveIntensity = name === 'Brakelight' ? 3.6 : 2.2
    material.roughness = 0.22
  } else if (name === 'Tireside' || name === 'Tiretread') {
    material.color?.set('#080808')
    material.roughness = 0.82
    material.metalness = 0.05
  } else if (name === 'Interior 3 Carmine') {
    material.color?.set('#55200f')
    material.roughness = 0.66
  } else if (name === 'License') {
    material.map?.dispose?.()
    material.map = makePlateTexture()
    material.color?.set('#ffffff')
    material.metalness = 0.25
    material.roughness = 0.38
    material.needsUpdate = true
  }

  if (material.map) {
    material.map.anisotropy = 8
    material.map.needsUpdate = true
  }
  if (material.normalMap) material.normalMap.anisotropy = 4
  return material
}

function prepareCarScene(gltf) {
  const scene = gltf.scene
  scene.updateMatrixWorld(true)

  const emblem = scene.getObjectByName('InteriorSteeringEmblem')
  if (emblem) emblem.visible = false

  scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = true
    child.receiveShadow = true
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach(styleMaterial)
  })

  const box = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  box.getCenter(center)

  let wheelBottom = Infinity
  for (const name of CAR_WHEELS) {
    const wheel = scene.getObjectByName(name)
    if (!wheel) continue
    const wheelBox = new THREE.Box3().setFromObject(wheel)
    wheelBottom = Math.min(wheelBottom, wheelBox.min.y)
  }
  if (!Number.isFinite(wheelBottom)) wheelBottom = box.min.y

  scene.userData.placement = {
    x: -center.x,
    y: -wheelBottom + 0.015,
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
