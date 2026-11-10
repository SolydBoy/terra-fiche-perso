import { useRef } from 'react'

interface Props {
  label: string
  value: number
  onUpdate: (value: number) => void
  min?: number
  max?: number
}

type RGB = [number, number, number]

// Échelle de couleurs : noir d'encre → bronze terne → or éclatant
const STOPS: { t: number; c: RGB }[] = [
  { t: 0,   c: [6, 6, 6] },
  { t: 0.5, c: [110, 98, 78] },
  { t: 1,   c: [255, 200, 40] },
]

function lerpColor(t: number): RGB {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i], b = STOPS[i + 1]
    if (x <= b.t) {
      const k = (x - a.t) / (b.t - a.t)
      return a.c.map((v, j) => Math.round(v + (b.c[j] - v) * k)) as RGB
    }
  }
  return STOPS[STOPS.length - 1].c
}

const rgb = ([r, g, b]: RGB, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`

/** Barre de réputation (−10 → +10, bipolaire) ou de notoriété (0 → 10) : plus c'est haut plus c'est doré, plus c'est bas plus c'est noir. */
export function ReputationBar({ label, value, onUpdate, min = -10, max = 10 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const v = Math.min(max, Math.max(min, value))
  const t = (v - min) / (max - min)          // 0 → 1
  const color = lerpColor(t)
  const gold  = Math.max(0, (t - 0.5) * 2)    // 0 → 1 sur la moitié haute
  const dark  = Math.max(0, (0.5 - t) * 2)    // 0 → 1 sur la moitié basse

  // Origine du remplissage : 0 si l'échelle le contient (barre bipolaire), sinon le minimum
  const origin    = Math.min(max, Math.max(min, 0))
  const toPct     = (x: number) => ((x - min) / (max - min)) * 100
  const originPct = toPct(origin)
  const fillPct   = Math.abs(toPct(v) - originPct)
  const bipolar   = min < 0 && max > 0

  function set(next: number) {
    onUpdate(Math.min(max, Math.max(min, Math.round(next))))
  }

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = (e.clientX - rect.left) / rect.width
    set(min + ratio * (max - min))
  }

  // Remplissage : dégradé de la couleur courante, plus lumineux vers l'extrémité
  const tip  = gold > 0 ? lerpColor(Math.min(1, t + 0.15)) : color
  const base = gold > 0 ? lerpColor(Math.max(0.5, t - 0.25)) : color
  const fillStyle: React.CSSProperties = {
    width: `${fillPct}%`,
    ...(v >= origin ? { left: `${originPct}%` } : { right: `${100 - originPct}%` }),
    background: v >= origin
      ? `linear-gradient(90deg, ${rgb(base)}, ${rgb(tip)})`
      : `linear-gradient(270deg, ${rgb(lerpColor(0.5))} -60%, ${rgb(color)})`,
    boxShadow: gold > 0
      ? `0 0 ${4 + gold * 10}px ${rgb([255, 190, 40], 0.25 + gold * 0.45)}`
      : dark > 0
        ? `inset 0 0 4px rgba(0,0,0,0.9), 0 0 ${dark * 6}px rgba(0,0,0,0.9)`
        : 'none',
  }

  const valueColor = gold > 0
    ? rgb(lerpColor(Math.max(0.65, t)))
    : dark > 0
      ? rgb([161 - dark * 70, 161 - dark * 70, 170 - dark * 70])
      : 'rgb(161,161,170)'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-zinc-400 uppercase tracking-widest text-[11px] font-semibold">
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => set(v - 1)}
            disabled={v <= min}
            className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs
                       flex items-center justify-center transition-colors disabled:opacity-30"
          >−</button>
          <span
            className="w-8 text-center text-xs font-mono font-bold transition-colors duration-300"
            style={{
              color: valueColor,
              textShadow: gold > 0.4 ? `0 0 6px ${rgb([255, 190, 40], gold * 0.7)}` : 'none',
            }}
          >
            {bipolar && v > 0 ? `+${v}` : v}
          </span>
          <button
            onClick={() => set(v + 1)}
            disabled={v >= max}
            className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs
                       flex items-center justify-center transition-colors disabled:opacity-30"
          >+</button>
        </div>
      </div>

      {/* Piste : cliquable pour fixer la valeur */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        title={`${label} : ${bipolar && v > 0 ? '+' : ''}${v} (cliquer pour régler)`}
        className="relative h-2.5 rounded-full cursor-pointer bg-[#2e2e2e]"
      >
        {/* Repère du 0 (uniquement pour une échelle négative → positive) */}
        {bipolar && (
          <div
            className="absolute top-[-2px] bottom-[-2px] w-px bg-zinc-500/80 z-10"
            style={{ left: `${originPct}%` }}
          />
        )}
        {/* Remplissage */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-300"
          style={fillStyle}
        />
      </div>
    </div>
  )
}
