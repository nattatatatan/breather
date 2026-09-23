import { holdProgress, isHoldComplete } from './holdToEnd'

describe('holdProgress', () => {
  it('is 0 at the start of the hold', () => {
    expect(holdProgress(1000, 1000, 1500)).toBe(0)
  })

  it('is fractional partway through', () => {
    expect(holdProgress(1000, 1750, 1500)).toBeCloseTo(0.5)
  })

  it('reaches 1 exactly at the duration', () => {
    expect(holdProgress(1000, 2500, 1500)).toBe(1)
  })

  it('clamps to 1 past the duration (a slow tick should not overshoot)', () => {
    expect(holdProgress(1000, 4000, 1500)).toBe(1)
  })

  it('clamps to 0 for a clock that appears to go backwards', () => {
    expect(holdProgress(1000, 500, 1500)).toBe(0)
  })
})

describe('isHoldComplete', () => {
  it('is false below 1 and true at or above 1', () => {
    expect(isHoldComplete(0.999)).toBe(false)
    expect(isHoldComplete(1)).toBe(true)
  })
})
