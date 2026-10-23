import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { loadCarModel, instantiateCar } from '/src/lib/carModel.js'

const params = new URLSearchParams(location.search)
const viewName = params.get('view') || 'hero'

const VIEWS = {
  hero: {
    camera: [6.2, 2.15, 7.3],
    target: [0, 0.54, 0.1],
    fov: 31,
    env: 0.9,
    exposure: 1.16,
  },
  side: {
    camera: [7.8, 1.52, 1.15],
    target: [0, 0.52, 0.12],
    fov: 27.5,
    env: 0.85,
    exposure: 1.13,
  },
  front: {
    camera: [4.95, 1.85, 6.4],
    target: [0, 0.52, 0.22],
    fov: 30,
    env: 0.95,
    exposure: 1.18,
  },
  rear: {
    camera: [4.55, 1.86, -6.15],
    target: [0, 0.54, -0.12],
    fov: 30,
    env: 0.95,
    exposure: 1.18,
  },
  detail: {
    camera: [3.2, 1.0, 3.55],
    target: [0.72, 0.38, 1.35],
    fov: 31,
    env: 0.95,
    exposure: 1.2,
  },
}

const config = VIEWS[viewName] || VIEWS.hero
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(1)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = config.exposure
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  config.fov,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)
camera.position.set(...config.camera)
camera.lookAt(...config.target)

const pmrem = new THREE.PMREMGenerator(renderer)
const envScene = new RoomEnvironment()
const envMap = pmrem.fromScene(envScene, 0.04).texture
scene.environment = envMap
scene.environmentIntensity = config.env

const ambient = new THREE.AmbientLight('#f8eadd', 0.34)
scene.add(ambient)

const key = new THREE.DirectionalLight('#fff2df', 4.2)
key.position.set(4.5, 7, 5)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
key.shadow.camera.left = -5
key.shadow.camera.right = 5
key.shadow.camera.top = 5
key.shadow.camera.bottom = -5
key.shadow.camera.near = 0.5
key.shadow.camera.far = 20
key.shadow.bias = -0.0004
scene.add(key)

const warmRim = new THREE.DirectionalLight('#ff5a1f', 2.8)
warmRim.position.set(-5.5, 2.8, -3.5)
scene.add(warmRim)

const coolRim = new THREE.DirectionalLight('#d9e5ff', 1.65)
coolRim.position.set(1, 4, -6)
scene.add(coolRim)

const topPool = new THREE.SpotLight('#fff4e7', 34, 20, 0.6, 1, 1.2)
topPool.position.set(1.5, 7.5, 2.5)
scene.add(topPool)

const glowCanvas = document.createElement('canvas')
glowCanvas.width = 512
glowCanvas.height = 512
const glowCtx = glowCanvas.getContext('2d')
const glowGradient = glowCtx.createRadialGradient(256, 270, 20, 256, 270, 230)
glowGradient.addColorStop(0, 'rgba(72, 55, 43, 0.82)')
glowGradient.addColorStop(0.38, 'rgba(35, 27, 21, 0.52)')
glowGradient.addColorStop(0.72, 'rgba(12, 10, 8, 0.18)')
glowGradient.addColorStop(1, 'rgba(5, 5, 4, 0)')
glowCtx.fillStyle = glowGradient
glowCtx.fillRect(0, 0, 512, 512)
const glowTexture = new THREE.CanvasTexture(glowCanvas)
glowTexture.colorSpace = THREE.SRGBColorSpace
const floorGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 9.5),
  new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }),
)
floorGlow.rotation.x = -Math.PI / 2
floorGlow.position.y = -0.006
scene.add(floorGlow)

const shadowCanvas = document.createElement('canvas')
shadowCanvas.width = 512
shadowCanvas.height = 512
const shadowCtx = shadowCanvas.getContext('2d')
const shadowGradient = shadowCtx.createRadialGradient(256, 256, 20, 256, 256, 256)
shadowGradient.addColorStop(0, 'rgba(0,0,0,0.72)')
shadowGradient.addColorStop(0.48, 'rgba(0,0,0,0.34)')
shadowGradient.addColorStop(1, 'rgba(0,0,0,0)')
shadowCtx.fillStyle = shadowGradient
shadowCtx.fillRect(0, 0, 512, 512)
const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
const contactShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(5.8, 3.1),
  new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.8,
  }),
)
contactShadow.rotation.x = -Math.PI / 2
contactShadow.position.y = 0.001
scene.add(contactShadow)

loadCarModel()
  .then((source) => {
    const car = instantiateCar(source)
    car.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(car)

    if (viewName === 'detail') {
      const target = new THREE.Vector3(...config.target)
      camera.lookAt(target)
    }

    renderer.render(scene, camera)
    document.body.dataset.ready = 'true'
  })
  .catch((error) => {
    console.error(error)
    document.body.dataset.error = error.message
  })

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.render(scene, camera)
})
