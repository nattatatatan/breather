import { ago, clock, durationLong, hours, minutes, percent, tenure } from './format'

describe('format', () => {
  it('clock', () => {
    expect(clock(1800)).toBe('30:00')
    expect(clock(65)).toBe('01:05')
    expect(clock(3909)).toBe('1:05:09')
    expect(clock(-3)).toBe('00:00')
  })

  it('hours', () => {
    expect(hours(138 * 3600 + 20)).toBe('138h')
    expect(hours(1240 * 3600)).toBe('1,240h')
    expect(hours(45 * 60)).toBe('45m')
  })

  it('minutes and durationLong', () => {
    expect(minutes(1800)).toBe('30m')
    expect(minutes(4800)).toBe('1h 20m')
    expect(durationLong(1800)).toBe('30 minutes')
    expect(durationLong(3600)).toBe('1 hour')
    expect(durationLong(5400)).toBe('1 hour 30 minutes')
  })

  it('tenure', () => {
    const now = new Date('2026-09-23T12:00:00')
    expect(tenure('2025-07-01', now)).toBe('1y 2m')
    expect(tenure('2020-05-01', now)).toBe('6y')
    expect(tenure('2026-01-10', now)).toBe('8m')
    expect(tenure('2026-09-20', now)).toBe('1m')
  })

  it('ago', () => {
    const now = new Date('2026-09-23T12:00:00Z')
    expect(ago('2026-09-23T08:00:00Z', now)).toBe('4h')
    expect(ago('2026-09-22T11:00:00Z', now)).toBe('1d')
    expect(ago('2026-09-23T11:59:30Z', now)).toBe('now')
  })

  it('percent', () => {
    expect(percent(92, 100)).toBe(92)
    expect(percent(1, 0)).toBe(0)
  })
})
