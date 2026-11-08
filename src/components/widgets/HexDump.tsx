import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type FieldKind = 'header' | 'meta' | 'data' | 'footer' | 'none'

export interface HexRow {
  offset: string
  bytes: string[]
  ascii: string
  /** per-byte field classification, same length as `bytes` */
  kinds?: FieldKind[]
}

const KIND_CLASS: Record<FieldKind, string> = {
  header: 'text-accent',
  meta: 'text-accent2',
  data: 'text-emerald-300',
  footer: 'text-amber-300',
  none: 'text-muted',
}

const LEGEND: { kind: FieldKind; label: string }[] = [
  { kind: 'header', label: 'Header' },
  { kind: 'meta', label: 'Metadata' },
  { kind: 'data', label: 'Data (zlib)' },
  { kind: 'footer', label: 'Footer' },
]

const SWATCH: Record<FieldKind, string> = {
  header: 'bg-accent',
  meta: 'bg-accent2',
  data: 'bg-emerald-400',
  footer: 'bg-amber-400',
  none: 'bg-muted',
}

/** Hex view with per-byte field colouring and a structure legend. */
export function HexDump({ rows, legend = true }: { rows: HexRow[]; legend?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="no-scrollbar overflow-x-auto font-mono text-[11px] leading-[1.75]">
        {rows.map((row, r) => (
          <motion.div
            key={row.offset}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: r * 0.07 }}
            className="flex items-center gap-3 whitespace-nowrap"
          >
            <span className="text-muted/60">{row.offset}</span>
            <span className="flex gap-[0.42em]">
              {row.bytes.map((b, i) => (
                <span
                  key={i}
                  className={cn(
                    'transition-colors duration-300',
                    KIND_CLASS[row.kinds?.[i] ?? 'none'],
                  )}
                >
                  {b}
                </span>
              ))}
            </span>
            <span className="text-muted/80">{row.ascii}</span>
          </motion.div>
        ))}
      </div>

      {legend && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-accent/15 pt-2.5">
          {LEGEND.map((l, i) => (
            <motion.span
              key={l.kind}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted"
            >
              <span className={cn('h-2 w-2 rounded-[3px]', SWATCH[l.kind])} />
              {l.label}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  )
}
