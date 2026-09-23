import { DISCARD_UNDER_SECONDS, recordReturn, shouldDiscard } from './returns'

describe('recordReturn', () => {
  it('appends rounded elapsed seconds in order', () => {
    let returns: number[] = []
    returns = recordReturn(returns, 12.4)
    returns = recordReturn(returns, 95.6)
    returns = recordReturn(returns, 240)
    expect(returns).toEqual([12, 96, 240])
  })

  it('never goes negative', () => {
    expect(recordReturn([], -5)).toEqual([0])
  })

  it('clamps to the session length when given', () => {
    expect(recordReturn([10], 1800, 1200)).toEqual([10, 1200])
  })

  it('does not mutate the existing array', () => {
    const original = [5]
    const next = recordReturn(original, 10)
    expect(original).toEqual([5])
    expect(next).toEqual([5, 10])
  })
})

describe('shouldDiscard', () => {
  it('discards sittings under the threshold', () => {
    expect(shouldDiscard(0)).toBe(true)
    expect(shouldDiscard(59)).toBe(true)
  })

  it('keeps sittings at or above the threshold', () => {
    expect(shouldDiscard(DISCARD_UNDER_SECONDS)).toBe(false)
    expect(shouldDiscard(90)).toBe(false)
  })
})
