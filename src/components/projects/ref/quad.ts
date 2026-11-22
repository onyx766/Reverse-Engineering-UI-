/**
 * Projective "pin the corners" transforms. An element of size w × h laid out
 * at the stage origin (transform-origin 0 0) is mapped so its corners land on
 * four measured points of the reference render, which reproduces the
 * perspective of every tilted pane exactly instead of approximating it with
 * rotateY + perspective guesses.
 */

export type Pt = readonly [number, number]
/** corners in order: top-left, top-right, bottom-right, bottom-left */
export type Quad = readonly [Pt, Pt, Pt, Pt]

/** CSS matrix3d that maps the rectangle (0,0)-(w,h) onto `q` (Heckbert's square→quad). */
export function quadMatrix(w: number, h: number, q: Quad): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  let g = 0
  let k = 0
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1
    g = (dx3 * dy2 - dx2 * dy3) / den
    k = (dx1 * dy3 - dx3 * dy1) / den
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + k * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + k * y3
  // unit square → pixels: divide the u terms by w and the v terms by h
  const A = a / w
  const B = b / h
  const D = d / w
  const E = e / h
  const G = g / w
  const H = k / h
  const n = (v: number) => (Math.abs(v) < 1e-12 ? 0 : +v.toFixed(9))
  return `matrix3d(${n(A)},${n(D)},0,${n(G)},${n(B)},${n(E)},0,${n(H)},0,0,1,0,${n(x0)},${n(y0)},0,1)`
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function lerpQuad(p: Quad, q: Quad, t: number): Quad {
  return [0, 1, 2, 3].map((i) => [lerp(p[i][0], q[i][0], t), lerp(p[i][1], q[i][1], t)] as const) as unknown as Quad
}

export function shiftQuad(q: Quad, dx: number, dy = 0): Quad {
  return q.map(([x, y]) => [x + dx, y + dy] as const) as unknown as Quad
}
