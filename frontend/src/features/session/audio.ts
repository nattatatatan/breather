// A soft synthesized bell: a few decaying sine partials, ~3s, gentle volume. Used at the start
// and end of a sitting when the profile's sound is "bell". Never throws if audio is blocked or
// unsupported (autoplay policy, no AudioContext, headless test environments, ...).

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext
}

const BELL_PARTIALS = [
  { freq: 440, gain: 0.16 },
  { freq: 880, gain: 0.08 },
  { freq: 1320, gain: 0.04 },
] as const

const BELL_DURATION_S = 3

export class SessionBell {
  private ctx: AudioContext | null = null

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    try {
      const Ctx = window.AudioContext ?? (window as unknown as WebkitWindow).webkitAudioContext
      if (!Ctx) return null
      this.ctx = new Ctx()
      return this.ctx
    } catch {
      return null
    }
  }

  /** Plays the bell. Resolves quietly (no-op) if audio is unavailable or blocked. */
  async play(): Promise<void> {
    const ctx = this.ensureContext()
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') await ctx.resume()
      const now = ctx.currentTime
      const master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)
      for (const { freq, gain } of BELL_PARTIALS) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const partialGain = ctx.createGain()
        partialGain.gain.setValueAtTime(gain, now)
        partialGain.gain.exponentialRampToValueAtTime(0.0001, now + BELL_DURATION_S)
        osc.connect(partialGain)
        partialGain.connect(master)
        osc.start(now)
        osc.stop(now + BELL_DURATION_S + 0.1)
      }
    } catch {
      // Sound is decorative; a blocked or failing AudioContext is never fatal.
    }
  }

  /** Releases the underlying AudioContext. Safe to call more than once. */
  dispose(): void {
    try {
      this.ctx?.close()
    } catch {
      // Already closed or unsupported.
    }
    this.ctx = null
  }
}
