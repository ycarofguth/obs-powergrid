#!/usr/bin/env node
// Generate ICO file from PNG images (no external dependencies)
// ICO format: header + directory entries + raw PNG data

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const iconsDir = join(import.meta.dirname, '..', 'apps', 'desktop', 'resources', 'icons')
const sizes = [16, 32, 48, 64, 128, 256]
const pngs = []

for (const size of sizes) {
  const file = join(iconsDir, `icon-${size}.png`)
  try {
    pngs.push({ size, data: readFileSync(file) })
  } catch {
    // skip missing sizes
  }
}

if (pngs.length === 0) {
  console.error('No PNG icons found')
  process.exit(1)
}

// ICO header: 6 bytes
const headerSize = 6
const entrySize = 16
const dataOffset = headerSize + entrySize * pngs.length

const header = Buffer.alloc(headerSize)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: 1 = ICO
header.writeUInt16LE(pngs.length, 4) // count

const entries = Buffer.alloc(entrySize * pngs.length)
let offset = dataOffset

for (let i = 0; i < pngs.length; i++) {
  const { size, data } = pngs[i]
  const pos = i * entrySize
  entries.writeUInt8(size >= 256 ? 0 : size, pos) // width (0 = 256)
  entries.writeUInt8(size >= 256 ? 0 : size, pos + 1) // height
  entries.writeUInt8(0, pos + 2) // color count
  entries.writeUInt8(0, pos + 3) // reserved
  entries.writeUInt16LE(1, pos + 4) // planes
  entries.writeUInt16LE(32, pos + 6) // bit count
  entries.writeUInt32LE(data.length, pos + 8) // bytes in res
  entries.writeUInt32LE(offset, pos + 12) // image offset
  offset += data.length
}

const outPath = process.argv[2] || join(iconsDir, 'icon.ico')
writeFileSync(outPath, Buffer.concat([header, entries, ...pngs.map((p) => p.data)]))
console.log(`Generated: ${outPath} (${pngs.length} sizes)`)
