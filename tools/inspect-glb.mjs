import fs from 'node:fs'

const buffer = fs.readFileSync('public/models/car-concept.glb')
const jsonLength = buffer.readUInt32LE(12)
const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'))
const paint = (json.materials || []).filter((material) => material.name?.startsWith('Paint'))

for (const material of paint) {
  const pbr = material.pbrMetallicRoughness || {}
  console.log(
    JSON.stringify(
      {
        name: material.name,
        baseColor: pbr.baseColorFactor,
        metalness: pbr.metallicFactor,
        roughness: pbr.roughnessFactor,
        baseColorTexture: pbr.baseColorTexture,
        metallicRoughnessTexture: pbr.metallicRoughnessTexture,
        normalTexture: material.normalTexture,
        occlusionTexture: material.occlusionTexture,
        emissiveTexture: material.emissiveTexture,
        extensions: material.extensions,
        extras: material.extras,
      },
      null,
      2,
    ),
  )
}
