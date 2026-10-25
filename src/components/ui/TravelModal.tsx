import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { computeAllBonuses } from '../../engine/traits'

// ── Types ──────────────────────────────────────────────────────────────────────

type Terrain = 'route' | 'foret' | 'montagne'
type Phase   = 'setup' | 'resolve'

interface DayResult {
  day:          number
  fvBefore:     number
  fvAfter:      number
  status:       'normal' | 'demi_seuil' | 'epuise'
  stressRolled: number | null   // d10 → stress = stressRolled × hoursPerDay
  constRolled:  number | null   // d20 → DC 14 (épuisé seulement)
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const TERRAIN_OPTIONS = [
  {
    id:          'route' as Terrain,
    label:       'Route / Plaine',
    sub:         '+1 FV / jour',
    fvPerDay:    1,
    icon:        '🛣',
    cls:         'border-emerald-800 text-emerald-400 hover:bg-emerald-900/20',
    selectedCls: 'border-emerald-500 bg-emerald-900/30 text-emerald-200',
  },
  {
    id:          'foret' as Terrain,
    label:       'Forêt / Collines',
    sub:         '+2 FV / jour',
    fvPerDay:    2,
    icon:        '🌲',
    cls:         'border-yellow-800 text-yellow-400 hover:bg-yellow-900/20',
    selectedCls: 'border-yellow-500 bg-yellow-900/30 text-yellow-200',
  },
  {
    id:          'montagne' as Terrain,
    label:       'Désert / Montagne',
    sub:         '+3 FV / jour',
    fvPerDay:    3,
    icon:        '⛰',
    cls:         'border-red-900 text-red-400 hover:bg-red-900/20',
    selectedCls: 'border-red-600 bg-red-900/30 text-red-200',
  },
]

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

// ── Logique de calcul ──────────────────────────────────────────────────────────

function buildDayResults(
  fvCurrent:    number,
  terrain:      Terrain,
  days:         number,
  constitution: number,
): DayResult[] {
  const half      = Math.ceil(constitution / 2)
  const fvPerDay  = TERRAIN_OPTIONS.find(t => t.id === terrain)!.fvPerDay
  const results: DayResult[] = []

  let fv = fvCurrent
  for (let d = 1; d <= days; d++) {
    const fvBefore = fv
    const fvAfter  = fv + fvPerDay

    let status: DayResult['status']
    if (fvBefore >= constitution) status = 'epuise'
    else if (fvBefore >= half)   status = 'demi_seuil'
    else                          status = 'normal'

    results.push({ day: d, fvBefore, fvAfter, status, stressRolled: null, constRolled: null })
    fv = fvAfter
  }

  return results
}

// ── Dé animé ──────────────────────────────────────────────────────────────────

function DiceRoller({ die, label, onRolled }: { die: number; label?: string; onRolled: (v: number) => void }) {
  const [display, setDisplay] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [done, setDone]       = useState(false)

  function handleRoll() {
    if (rolling || done) return
    const result = Math.floor(Math.random() * die) + 1
    setRolling(true)
    const start = Date.now()
    const id = setInterval(() => {
      setDisplay(Math.floor(Math.random() * die) + 1)
      if (Date.now() - start >= 900) {
        clearInterval(id)
        setDisplay(result)
        setRolling(false)
        setDone(true)
        onRolled(result)
      }
    }, 60)
  }

  if (!rolling && !done) {
    return (
      <button
        onClick={handleRoll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-600
                   text-zinc-300 hover:border-orange-500 hover:text-orange-400 transition-colors text-xs"
      >
        <span>🎲</span> {label ?? `d${die}`}
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${rolling ? 'animate-pulse' : ''}`}>
      <span className="font-mono text-lg font-bold text-white bg-zinc-800 border border-zinc-600
                       rounded w-8 h-8 flex items-center justify-center">
        {display}
      </span>
      <span className="text-zinc-500">/ d{die}</span>
    </div>
  )
}

// ── Carte par jour ─────────────────────────────────────────────────────────────

function DayCard({
  result,
  hoursPerDay,
  onStressRolled,
  onConstRolled,
}: {
  result:         DayResult
  hoursPerDay:    number
  onStressRolled: (v: number) => void
  onConstRolled:  (v: number) => void
}) {
  if (result.status === 'normal') {
    return (
      <div className="flex items-center gap-3 py-1.5 px-2 text-xs text-zinc-500
                      border-b border-zinc-800/40 last:border-0">
        <span className="text-zinc-700 font-mono shrink-0">J{result.day}</span>
        <span>FV {result.fvBefore} → {result.fvAfter}</span>
        <span className="text-emerald-700 ml-auto">✓ Normal</span>
      </div>
    )
  }

  const isEpuise     = result.status === 'epuise'
  const constFailed  = result.constRolled !== null && result.constRolled < 14
  const stressGained = result.stressRolled !== null ? result.stressRolled * hoursPerDay : null

  return (
    <div className={`rounded-lg p-3 space-y-2 border ${
      isEpuise
        ? 'border-red-800/70 bg-red-950/15'
        : 'border-orange-800/50 bg-orange-950/10'
    }`}>

      {/* En-tête */}
      <div className="flex items-center gap-2">
        <span className="text-zinc-600 font-mono text-[11px] shrink-0">J{result.day}</span>
        <span className={`text-xs font-bold ${isEpuise ? 'text-red-400' : 'text-orange-400'}`}>
          {isEpuise ? '🔴 Épuisé' : '🟡 Demi-seuil'}
        </span>
        <span className="text-zinc-600 text-[10px] ml-auto font-mono">
          FV {result.fvBefore} → {result.fvAfter}
        </span>
      </div>

      {/* Stress */}
      <div className="space-y-1">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
          Stress — {hoursPerDay}h × 1d10
        </p>
        <div className="flex items-center gap-3">
          <DiceRoller die={10} onRolled={onStressRolled} />
          {stressGained !== null && (
            <p className="text-xs font-semibold text-orange-300">
              {result.stressRolled} × {hoursPerDay}h = +{stressGained} stress
            </p>
          )}
        </div>
      </div>

      {/* Constitution (épuisé seulement) */}
      {isEpuise && (
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Constitution DC 14 — épuisement
          </p>
          <div className="flex items-center gap-3">
            <DiceRoller die={20} label="d20 (DC 14)" onRolled={onConstRolled} />
            {result.constRolled !== null && (
              <p className={`text-xs font-bold ${constFailed ? 'text-red-400' : 'text-emerald-400'}`}>
                {constFailed
                  ? `Échec (${result.constRolled} < 14) — ⚠ Blessure légère !`
                  : `Réussite (${result.constRolled} ≥ 14)`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal principal ────────────────────────────────────────────────────────────

export function TravelModal({ onClose }: { onClose: () => void }) {
  const { character, updateField, addWound } = useCharacterStore()

  const [phase, setPhase]           = useState<Phase>('setup')
  const [terrain, setTerrain]       = useState<Terrain | null>(null)
  const [days, setDays]             = useState(1)
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [dayResults, setDayResults] = useState<DayResult[]>([])

  const donBonuses     = computeAllBonuses(character)
  const effectiveCon   = character.constitution + (donBonuses.characteristics?.constitution ?? 0)
  const halfSeuil      = Math.ceil(effectiveCon / 2)
  const fvPreview      = terrain
    ? character.fv + TERRAIN_OPTIONS.find(t => t.id === terrain)!.fvPerDay * days
    : character.fv

  // ── Phase 1 → 2 ────────────────────────────────────────────────────────────

  function startResolve() {
    if (!terrain) return
    setDayResults(buildDayResults(character.fv, terrain, days, effectiveCon))
    setPhase('resolve')
  }

  // ── Handlers dés ───────────────────────────────────────────────────────────

  function handleStressRolled(idx: number, value: number) {
    setDayResults(prev => prev.map((r, i) => i === idx ? { ...r, stressRolled: value } : r))
  }
  function handleConstRolled(idx: number, value: number) {
    setDayResults(prev => prev.map((r, i) => i === idx ? { ...r, constRolled: value } : r))
  }

  // ── Calculs résumé ─────────────────────────────────────────────────────────

  const allResolved = dayResults.every(r => {
    if (r.status === 'normal') return true
    if (r.stressRolled === null) return false
    if (r.status === 'epuise' && r.constRolled === null) return false
    return true
  })

  const totalFvGain   = terrain
    ? TERRAIN_OPTIONS.find(t => t.id === terrain)!.fvPerDay * days
    : 0
  const totalStress   = dayResults.reduce((sum, r) =>
    r.stressRolled !== null ? sum + r.stressRolled * hoursPerDay : sum, 0)
  const blessureJours = dayResults.filter(r =>
    r.status === 'epuise' && r.constRolled !== null && r.constRolled < 14)

  const newFv        = character.fv + totalFvGain
  const newFaim      = Math.max(0, character.faim - 40 * days)
  const newSoif      = Math.max(0, character.soif - 50 * days)
  const newStress    = Math.min(200, character.stress + totalStress)

  // ── Appliquer ──────────────────────────────────────────────────────────────

  function apply() {
    updateField('fv', newFv)
    updateField('faim', newFaim)
    updateField('soif', newSoif)
    if (totalStress > 0) updateField('stress', newStress)
    for (const r of blessureJours) {
      addWound('légère', `Épuisement (Jour ${r.day})`, 0)
    }
    onClose()
  }

  // ── Helpers affichage ──────────────────────────────────────────────────────

  const fvStatusLabel =
    character.fv >= effectiveCon ? '🔴 Épuisé'
    : character.fv >= halfSeuil   ? '🟡 Demi-seuil'
    : null

  const terrainSelected = terrain ? TERRAIN_OPTIONS.find(t => t.id === terrain)! : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg mx-4 bg-[#111] border border-zinc-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
            Résolution du Voyage
            {phase === 'resolve' && terrainSelected && (
              <span className="ml-2 text-zinc-400 normal-case font-normal text-xs">
                {days}j · {terrainSelected.label}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-5">

          {/* ──────────────── Phase 1 : Configuration ──────────────── */}
          {phase === 'setup' && (
            <div className="space-y-5">

              {/* FV actuelle */}
              <div className="flex items-center gap-3 text-xs bg-zinc-900/70 rounded-lg px-3 py-2 border border-zinc-800">
                <span className="text-zinc-500">FV actuelle :</span>
                <span className={`font-bold font-mono ${
                  character.fv >= effectiveCon ? 'text-red-400'
                  : character.fv >= halfSeuil   ? 'text-orange-400'
                  : 'text-zinc-200'
                }`}>
                  {character.fv} / {effectiveCon}
                </span>
                {fvStatusLabel && (
                  <span className={`ml-auto text-[11px] ${
                    character.fv >= effectiveCon ? 'text-red-400' : 'text-orange-400'
                  }`}>
                    {fvStatusLabel}
                  </span>
                )}
              </div>

              {/* Terrain */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Terrain traversé
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TERRAIN_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTerrain(opt.id)}
                      className={`flex flex-col items-center py-3 rounded-lg border transition-colors ${
                        terrain === opt.id ? opt.selectedCls : opt.cls
                      }`}
                    >
                      <span className="text-xl mb-1">{opt.icon}</span>
                      <span className="text-[11px] font-semibold leading-tight text-center px-1">
                        {opt.label}
                      </span>
                      <span className="text-[10px] opacity-60 mt-0.5">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée en jours */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Durée — {days} jour{days > 1 ? 's' : ''}
                </p>
                <div className="flex gap-1.5">
                  {DAYS_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`flex-1 h-9 rounded-lg border text-xs font-bold transition-colors ${
                        days === d
                          ? 'border-orange-500 bg-orange-900/30 text-orange-300'
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures de marche par jour */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Heures de marche / jour
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setHoursPerDay(h => Math.max(1, h - 1))}
                    className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm shrink-0"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold text-zinc-200 w-8 text-center">
                    {hoursPerDay}h
                  </span>
                  <button
                    onClick={() => setHoursPerDay(h => Math.min(16, h + 1))}
                    className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm shrink-0"
                  >
                    +
                  </button>
                  <span className="text-zinc-600 text-xs">
                    ({hoursPerDay * days}h au total)
                  </span>
                </div>
              </div>

              {/* Préview résumé */}
              {terrain && (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-zinc-500">FV :</span>
                    <span className={`font-bold font-mono ${
                      fvPreview >= effectiveCon ? 'text-red-400'
                      : fvPreview >= halfSeuil   ? 'text-orange-400'
                      : 'text-zinc-200'
                    }`}>
                      {character.fv} → {fvPreview}
                      {fvPreview >= effectiveCon && ' 🔴'}
                      {fvPreview >= halfSeuil && fvPreview < effectiveCon && ' 🟡'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-zinc-500">
                    <span>Faim −{40 * days}</span>
                    <span>Soif −{50 * days}</span>
                  </div>
                  {fvPreview >= halfSeuil && (
                    <p className="text-orange-500 text-[10px]">
                      {fvPreview >= effectiveCon
                        ? '⚠ Épuisement : jets de Constitution DC 14 + stress/heure'
                        : '⚠ Demi-seuil : stress/heure · −1 aux jets physiques'}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200
                             border border-zinc-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={startResolve}
                  disabled={!terrain}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40
                             text-black text-xs font-bold rounded-lg transition-colors"
                >
                  Calculer le voyage →
                </button>
              </div>

            </div>
          )}

          {/* ──────────────── Phase 2 : Résolution ──────────────── */}
          {phase === 'resolve' && (
            <div className="space-y-3">

              <div className="max-h-80 overflow-y-auto pr-1 space-y-1.5">
                {dayResults.map((result, i) => (
                  <DayCard
                    key={i}
                    result={result}
                    hoursPerDay={hoursPerDay}
                    onStressRolled={(v) => handleStressRolled(i, v)}
                    onConstRolled={(v) => handleConstRolled(i, v)}
                  />
                ))}
              </div>

              {/* Récapitulatif */}
              {allResolved && (
                <div className="border-t border-zinc-800 pt-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Résumé
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className={newFv >= effectiveCon ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                      FV {character.fv} → {newFv}
                      {newFv >= effectiveCon && ' 🔴 Épuisé'}
                      {newFv >= halfSeuil && newFv < effectiveCon && ' 🟡'}
                    </span>
                    <span className="text-zinc-500">
                      Faim {character.faim} → {newFaim}
                    </span>
                    <span className="text-zinc-500">
                      Soif {character.soif} → {newSoif}
                    </span>
                    {totalStress > 0 && (
                      <span className="text-orange-400 font-semibold">
                        Stress +{totalStress} (→ {newStress})
                      </span>
                    )}
                    {blessureJours.length > 0 && (
                      <span className="text-red-400 font-bold">
                        +{blessureJours.length} blessure{blessureJours.length > 1 ? 's' : ''} légère{blessureJours.length > 1 ? 's' : ''} (épuisement)
                      </span>
                    )}
                    {totalStress === 0 && blessureJours.length === 0 && (
                      <span className="text-zinc-600">Voyage sans complication</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPhase('setup')}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200
                             border border-zinc-800 rounded-lg transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={apply}
                  disabled={!allResolved}
                  className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40
                             text-black text-xs font-bold rounded-lg transition-colors"
                >
                  Appliquer
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
