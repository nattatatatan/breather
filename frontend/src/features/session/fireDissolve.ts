// Fire kasina dissolve math, copied verbatim from the `data-dc-script` block of
// docs/design/boards/06-session-fire-kasina.html, so the running session matches the
// design's keyframes (see docs/design/boards/09-fire-the-dissolve.html) exactly.

export interface FireDissolveStyle {
  /** Opacity of the ground/stones/logs/sparks group. */
  sceneOpacity: number
  /** Uniform scale of the flame, anchored at its base. */
  flameScale: number
  glowSizePx: number
  glowAlpha: number
  /** Opacity of the italic hint line. */
  hintOpacity: number
  /** Opacity of the top chrome (eyebrow label). */
  chromeOpacity: number
}

/** `p` is elapsed/planned. Pass 0 for `environment: 'still'`, which keeps the whole campfire. */
export function fireDissolveStyle(p: number): FireDissolveStyle {
  const cp = Math.max(0, Math.min(1, p))
  return {
    sceneOpacity: Math.max(0, 1 - cp * 1.45),
    flameScale: 1 - 0.66 * cp,
    glowSizePx: 360 - 230 * cp,
    glowAlpha: 0.3 - 0.17 * cp,
    hintOpacity: Math.max(0, 1 - cp * 2.4),
    chromeOpacity: Math.max(0.15, 1 - cp * 1.8),
  }
}
