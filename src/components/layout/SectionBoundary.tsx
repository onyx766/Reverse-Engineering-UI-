import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Contains a crash (or a failed chunk download after a redeploy) to the
 * section that caused it, so the navbar and background keep working.
 */
export class SectionBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[section crashed]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 pt-32 text-center">
        <div className="glass relative w-full rounded-2xl p-6">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-ink">
            Segment fault
          </h2>
          <p className="mt-2 font-mono text-[11.5px] leading-relaxed text-muted">
            This section failed to load. It is usually a stale download after an update.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/15 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:bg-accent/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>
      </div>
    )
  }
}
