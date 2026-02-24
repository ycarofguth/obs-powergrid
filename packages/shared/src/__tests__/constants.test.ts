import { describe, it, expect } from 'vitest'
import { SIDECAR_PORT, SIDECAR_URL, NEUTRALINO_PORT, VITE_DEV_PORT } from '../index'

describe('shared constants', () => {
  it('exports correct port values', () => {
    expect(SIDECAR_PORT).toBe(47531)
    expect(NEUTRALINO_PORT).toBe(47532)
    expect(VITE_DEV_PORT).toBe(47533)
  })

  it('builds SIDECAR_URL from SIDECAR_PORT', () => {
    expect(SIDECAR_URL).toBe(`http://localhost:${SIDECAR_PORT}`)
  })
})
