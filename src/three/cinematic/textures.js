import * as THREE from 'three'

const cache = new Map()

function canvasTexture(key, width, height, draw, { repeat = [1, 1], color = true } = {}) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  if (color) texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = 8
  cache.set(key, texture)
  return texture
}

// 2x2 twill weave. Each tow is a small gradient so the strip lights pick up the
// alternating sheen that makes carbon fibre read as carbon fibre.
export function carbonWeaveTexture() {
  return canvasTexture('carbon', 256, 256, (ctx, w, h) => {
    const cells = 8
    const size = w / cells
    ctx.fillStyle = '#050607'
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        const horizontal = ((x + y) >> 1) % 2 === 0
        const gradient = horizontal
          ? ctx.createLinearGradient(0, y * size, 0, (y + 1) * size)
          : ctx.createLinearGradient(x * size, 0, (x + 1) * size, 0)
        gradient.addColorStop(0, '#0b0d0f')
        gradient.addColorStop(0.5, horizontal ? '#2a2f34' : '#1b1f23')
        gradient.addColorStop(1, '#0b0d0f')
        ctx.fillStyle = gradient
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2)
      }
    }
  })
}

export function asphaltTexture() {
  return canvasTexture('asphalt', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1d2024'
    ctx.fillRect(0, 0, w, h)
    const image = ctx.getImageData(0, 0, w, h)
    for (let index = 0; index < image.data.length; index += 4) {
      const grain = (Math.random() - 0.5) * 34
      image.data[index] += grain
      image.data[index + 1] += grain
      image.data[index + 2] += grain + 2
    }
    ctx.putImageData(image, 0, 0)
    // Darker racing line worn into the surface.
    const line = ctx.createLinearGradient(0, 0, w, 0)
    line.addColorStop(0.3, 'rgba(0,0,0,0)')
    line.addColorStop(0.5, 'rgba(0,0,0,0.28)')
    line.addColorStop(0.7, 'rgba(0,0,0,0)')
    ctx.fillStyle = line
    ctx.fillRect(0, 0, w, h)
  })
}

export function kerbTexture() {
  return canvasTexture('kerb', 64, 256, (ctx, w, h) => {
    for (let index = 0; index < 4; index += 1) {
      ctx.fillStyle = index % 2 === 0 ? '#c8202a' : '#efece6'
      ctx.fillRect(0, (index * h) / 4, w, h / 4)
    }
  })
}

// A soft round sprite for floodlight halos and dust motes.
export function glowTexture() {
  return canvasTexture('glow', 128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.45)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  })
}
