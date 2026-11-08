/**
 * Keyframes used only by the Projects section. Scoped with a `pj-` prefix.
 * Anything inside a `[data-pj-paused="true"]` subtree freezes, which is how
 * the stage parks its CSS loops while it is scrolled off-screen.
 */
const CSS = `
@keyframes pj-dash { to { stroke-dashoffset: -32; } }
@keyframes pj-bob { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-7px,0); } }
@keyframes pj-bar { 0%,100% { transform: scaleY(var(--pj-lo, 0.35)); } 50% { transform: scaleY(1); } }
@keyframes pj-playhead { from { transform: translateX(0); } to { transform: translateX(var(--pj-travel, 200px)); } }
@keyframes pj-scan { from { transform: translateY(-100%); } to { transform: translateY(420%); } }
@keyframes pj-beam { 0%,100% { opacity: 0.75; transform: scaleX(1); } 45% { opacity: 1; transform: scaleX(1.08); } 60% { opacity: 0.85; } }
@keyframes pj-spin { to { transform: rotate(360deg); } }
@keyframes pj-spin-rev { to { transform: rotate(-360deg); } }
@keyframes pj-node { 0%,100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.35); opacity: 1; } }
@keyframes pj-rise { 0% { transform: translate3d(0, 0, 0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate3d(0, -120px, 0); opacity: 0; } }
[data-pj-paused="true"] *, [data-pj-paused="true"] *::before, [data-pj-paused="true"] *::after { animation-play-state: paused !important; }
`

export function ProjectsKeyframes() {
  return <style>{CSS}</style>
}
