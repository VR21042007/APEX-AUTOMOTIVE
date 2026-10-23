import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x161616)
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 200)
camera.position.set(7, 4, 7)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
document.body.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2))
const key = new THREE.DirectionalLight(0xfff2e0, 4)
key.position.set(5, 7, 5)
scene.add(key)
const rim = new THREE.DirectionalLight(0xff5a1f, 4)
rim.position.set(-6, 3, -4)
scene.add(rim)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.5, 0)
controls.update()

const grid = new THREE.GridHelper(20, 40, 0x555555, 0x2a2a2a)
scene.add(grid)
scene.add(new THREE.AxesHelper(4))

const loader = new GLTFLoader()
loader.load('/models/car-concept.glb', (gltf) => {
  const car = gltf.scene
  car.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(car)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  const lines = []
  lines.push('size: ' + size.toArray().map((n) => n.toFixed(2)).join(', '))
  lines.push('center: ' + center.toArray().map((n) => n.toFixed(2)).join(', '))
  for (const name of ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR', 'BodyHood', 'BodyDoorLColor1', 'BodyDoorRColor1']) {
    const o = car.getObjectByName(name)
    if (!o) continue
    const world = new THREE.Vector3()
    o.getWorldPosition(world)
    lines.push(name + ': ' + world.toArray().map((n) => n.toFixed(2)).join(', '))
  }
  document.getElementById('log').textContent = lines.join('\n')
  console.log(lines.join('\n'))
  scene.add(car)
  document.body.dataset.ready = 'true'
})

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
