import { fireDissolveStyle } from './fireDissolve'

// Keyframes match docs/design/boards/09-fire-the-dissolve.html for a 40-minute sit:
// 00:00, 08:00, 20:00, 40:00 -> p = 0, 0.2, 0.5, 1.

describe('fireDissolveStyle', () => {
  it('00:00 - the whole campfire, full flame', () => {
    const s = fireDissolveStyle(0)
    expect(s.sceneOpacity).toBeCloseTo(1)
    expect(s.flameScale).toBeCloseTo(1)
    expect(s.glowSizePx).toBeCloseTo(360)
    expect(s.glowAlpha).toBeCloseTo(0.3)
    expect(s.hintOpacity).toBeCloseTo(1)
    expect(s.chromeOpacity).toBeCloseTo(1)
  })

  it('08:00 - ground and stones fading, logs still there', () => {
    const s = fireDissolveStyle(0.2)
    expect(s.sceneOpacity).toBeCloseTo(0.71)
    expect(s.flameScale).toBeCloseTo(0.868)
  })

  it('20:00 - only the fire, smaller, held in the dark', () => {
    const s = fireDissolveStyle(0.5)
    expect(s.sceneOpacity).toBeCloseTo(0.275)
    expect(s.flameScale).toBeCloseTo(0.67)
    expect(s.hintOpacity).toBe(0) // 1 - 0.5*2.4 < 0, clamped
  })

  it('40:00 - one small flame, nothing new offered', () => {
    const s = fireDissolveStyle(1)
    expect(s.sceneOpacity).toBe(0) // 1 - 1.45 clamped to 0
    expect(s.flameScale).toBeCloseTo(0.34)
    expect(s.glowSizePx).toBeCloseTo(130)
    expect(s.glowAlpha).toBeCloseTo(0.13)
    expect(s.hintOpacity).toBe(0)
    expect(s.chromeOpacity).toBeCloseTo(0.15) // clamped floor
  })

  it('clamps out-of-range progress', () => {
    expect(fireDissolveStyle(-1)).toEqual(fireDissolveStyle(0))
    expect(fireDissolveStyle(2)).toEqual(fireDissolveStyle(1))
  })
})
