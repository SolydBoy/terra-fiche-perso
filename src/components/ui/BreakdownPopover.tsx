import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ModifierSource } from '../../engine/types'
import type { BreakdownSource } from '../../engine/dons'

// ─── Hook tooltip au survol ────────────────────────────────────────────────────

export function useBreakdownTooltip(sources: BreakdownSource[], total: number) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  // N'affiche rien si toutes les valeurs sont à 0
  const hasContent = sources.some((s) => s.value !== 0)

  const handlers = hasContent
    ? {
        onMouseEnter: (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
        onMouseMove:  (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
        onMouseLeave: () => setPos(null),
      }
    : {}

  const tooltip =
    hasContent && pos
      ? createPortal(
          <div
            className="fixed z-[9999] w-52 bg-[#242424] border border-zinc-600
                       rounded-lg shadow-2xl p-2.5 pointer-events-none"
            style={{
              top:  Math.min(pos.y + 14, window.innerHeight - 180),
              left: Math.min(pos.x + 14, window.innerWidth  - 220),
            }}
          >
            <table className="w-full">
              <tbody>
                {sources.map((s, i) => (
                  <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                    <td className="py-0.5 text-zinc-300 text-[11px]">{s.label}</td>
                    <td className={`py-0.5 text-right font-mono font-semibold text-[11px] whitespace-nowrap ${
                      s.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {s.value >= 0 ? '+' : ''}{s.value}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-500">
                  <td className="pt-1.5 text-zinc-200 text-[11px] font-semibold">Total</td>
                  <td className="pt-1.5 text-right font-mono font-bold text-white text-[11px]">
                    {total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>,
          document.body
        )
      : null

  return { handlers, tooltip }
}

// ─── Tooltip emplacement objet (max + liste inventaire) ───────────────────────

export function useSlotTooltip(
  label: string,
  maxSources: { label: string; value: number }[],
  maxTotal: number,
  inventoryItems: string[] = [],
) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const handlers = {
    onMouseEnter: (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
    onMouseMove:  (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setPos(null),
  }

  const tooltip = pos
    ? createPortal(
        <div
          className="fixed z-[9999] w-52 bg-[#242424] border border-zinc-600
                     rounded-lg shadow-2xl p-2.5 pointer-events-none"
          style={{
            top:  Math.min(pos.y + 14, window.innerHeight - 220),
            left: Math.min(pos.x + 14, window.innerWidth  - 220),
          }}
        >
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">{label}</p>

          {/* Détail du max */}
          <table className="w-full mb-2.5">
            <tbody>
              {maxSources.map((s, i) => (
                <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                  <td className="py-0.5 text-zinc-300 text-[11px]">{s.label}</td>
                  <td className={`py-0.5 text-right font-mono font-semibold text-[11px] ${s.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.value >= 0 ? '+' : ''}{s.value}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-500">
                <td className="pt-1.5 text-zinc-200 text-[11px] font-semibold">Max</td>
                <td className="pt-1.5 text-right font-mono font-bold text-white text-[11px]">{maxTotal}</td>
              </tr>
            </tfoot>
          </table>

          {/* Liste inventaire */}
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Dans l'inventaire</p>
          {inventoryItems.length === 0 ? (
            <p className="text-[11px] text-zinc-600 italic">Aucun objet</p>
          ) : (
            <ul className="space-y-0.5">
              {inventoryItems.map((item, i) => (
                <li key={i} className="text-[11px] text-zinc-300">· {item}</li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )
    : null

  return { handlers, tooltip }
}

// ─── Popover au clic (stats PV / PE / etc.) ───────────────────────────────────

interface Props {
  sources: ModifierSource[]
  total: number
  label: string
}

export function BreakdownPopover({ sources, total, label }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const popW = 260
    const popH = 220

    let left = rect.left
    let top  = rect.bottom + 8

    if (left + popW > window.innerWidth  - 12) left = window.innerWidth  - popW - 12
    if (top  + popH > window.innerHeight - 12) top  = rect.top - popH - 8

    setPos({ top, left })
    setOpen((v) => !v)
  }

  const mainSources = sources.filter((s) => !s.info)
  const infoSources = sources.filter((s) => s.info)

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-4 h-4 rounded-full border border-zinc-600 text-zinc-500 text-[10px]
                   flex items-center justify-center hover:border-orange-400 hover:text-orange-400
                   transition-colors leading-none shrink-0"
        aria-label={`Détail ${label}`}
      >
        i
      </button>

      {open && createPortal(
        <div
          className="fixed z-[9999] w-64 bg-[#242424] border border-zinc-600
                     rounded-lg shadow-2xl p-3 text-sm"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="text-zinc-400 uppercase tracking-widest text-[10px] mb-2 font-bold">
            {label}
          </p>

          {/* Sources principales (comptent dans le total) */}
          <table className="w-full">
            <tbody>
              {mainSources.map((s, i) => (
                <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                  <td className="py-1 text-zinc-300 text-xs">{s.label}</td>
                  <td className={`py-1 text-right font-mono font-semibold text-xs ${
                    s.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {s.value >= 0 ? '+' : ''}{s.value}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-500">
                <td className="pt-2 text-zinc-200 text-xs font-semibold">Max</td>
                <td className="pt-2 text-right font-mono font-bold text-white text-xs">{total}</td>
              </tr>
            </tfoot>
          </table>

          {/* Sources informatives (blessures, etc.) */}
          {infoSources.length > 0 && (
            <>
              <p className="mt-3 mb-1 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                Déduit du courant
              </p>
              <table className="w-full">
                <tbody>
                  {infoSources.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                      <td className="py-1 text-zinc-400 text-xs">{s.label}</td>
                      <td className={`py-1 text-right font-mono font-semibold text-xs ${
                        s.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {s.value >= 0 ? '+' : ''}{s.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
