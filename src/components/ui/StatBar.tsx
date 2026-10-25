import { useRef } from 'react'
import type { ModifierSource } from '../../engine/types'
import { BreakdownPopover } from './BreakdownPopover'

interface Props {
  label: string
  current: number
  max: number
  barColor: string
  breakdown?: { sources: ModifierSource[]; total: number }
  warning?: string | null
  onUpdate?: (value: number) => void
  clampToMax?: boolean
  min?: number
}

/** Long-press sur le bouton + : déclenche onLongPress après `ms` ms, sinon onPress */
function useLongPress(onLongPress: () => void, onPress: () => void, ms = 600) {
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fired  = useRef(false)

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    fired.current = false
    timer.current = setTimeout(() => {
      fired.current = true
      onLongPress()
    }, ms)
  }

  function stop() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (!fired.current) onPress()
  }

  function cancel() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    fired.current = true
  }

  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: cancel, onTouchStart: start, onTouchEnd: stop }
}

export function StatBar({
  label,
  current,
  max,
  barColor,
  breakdown,
  warning,
  onUpdate,
  clampToMax = true,
  min = 0,
}: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0

  function adjust(delta: number) {
    if (!onUpdate) return
    const next = current + delta
    const clamped = clampToMax ? Math.min(max, Math.max(min, next)) : Math.max(min, next)
    onUpdate(clamped)
  }

  function handleInput(raw: string) {
    if (!onUpdate) return
    const v = parseInt(raw, 10)
    if (isNaN(v)) return
    const clamped = clampToMax ? Math.min(max, Math.max(min, v)) : Math.max(min, v)
    onUpdate(clamped)
  }

  const plusHandlers = useLongPress(
    () => onUpdate?.(max),   // long press → remise à fond
    () => adjust(1),          // clic court → +1
  )

  return (
    <div className="space-y-1.5">
      {/* Ligne label + contrôles */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-zinc-400 uppercase tracking-widest text-[11px] font-semibold">
            {label}
          </span>
          {breakdown && (
            <BreakdownPopover sources={breakdown.sources} total={breakdown.total} label={label} />
          )}
        </div>

        {/* Valeur — éditable ou non */}
        {onUpdate ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => adjust(-1)}
              className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300
                         text-xs flex items-center justify-center transition-colors"
            >−</button>
            <input
              type="number"
              value={current}
              onChange={(e) => handleInput(e.target.value)}
              className="w-12 text-center bg-[#1a1a1a] border border-zinc-600 rounded
                         text-white text-xs font-mono py-0.5 focus:border-orange-500
                         focus:outline-none [appearance:textfield]
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-zinc-500 text-xs font-mono">/{max}</span>
            <button
              {...plusHandlers}
              title="Clic : +1 · Maintenir : remettre à fond"
              className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300
                         text-xs flex items-center justify-center transition-colors select-none"
            >+</button>
          </div>
        ) : (
          <span className="font-mono text-zinc-300 text-xs shrink-0">
            {current}<span className="text-zinc-600">/{max}</span>
          </span>
        )}
      </div>

      {/* Barre */}
      <div className="h-2.5 bg-[#2e2e2e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {warning && (
        <p className="text-[11px] text-orange-400 font-semibold">{warning}</p>
      )}
    </div>
  )
}
