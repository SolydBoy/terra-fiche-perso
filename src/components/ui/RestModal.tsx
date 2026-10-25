import { useState } from 'react'
import type { Wound, WoundSeverity } from '../../engine/types'
import { useCharacterStore } from '../../store/characterStore'
import { calcHpBase } from '../../engine/stats'

// ── Types ──────────────────────────────────────────────────────────────────────

type NR = -2 | -1 | 0 | 1 | 2 | 3

type OutcomeKind =
  | { kind: 'stable' }
  | { kind: 'heal_hp'; amount: number }
  | { kind: 'heal_full' }
  | { kind: 'aggravation_auto' }
  | { kind: 'chance_heal'; die: number; threshold: number }
  | { kind: 'chance_aggravation'; die: number; threshold: number }

type ResolvedOutcome = 'stable' | 'heal_full' | 'becomes_treated' | 'aggravation' | { type: 'heal_hp'; amount: number }

type WoundResolution = {
  wound: Wound
  outcome: OutcomeKind
  rolledValue: number | null
  resolved: ResolvedOutcome | null
}

// ── Règles de guérison ─────────────────────────────────────────────────────────

function getOutcome(wound: Wound, nr: NR): OutcomeKind {
  const { severity, treated } = wound

  if (severity === 'légère') {
    if (treated) {
      if (nr <= -2) return { kind: 'stable' }
      if (nr === -1) return { kind: 'heal_hp', amount: 1 }
      if (nr === 0)  return { kind: 'heal_hp', amount: 2 }
      if (nr === 1)  return { kind: 'heal_hp', amount: 3 }
      return { kind: 'heal_full' }
    } else {
      if (nr <= -1) return { kind: 'stable' }
      if (nr <= 1)  return { kind: 'chance_heal', die: 6, threshold: 2 }
      return { kind: 'chance_heal', die: 6, threshold: 3 }
    }
  }

  if (severity === 'grave') {
    if (treated) {
      if (nr === -2) return { kind: 'chance_aggravation', die: 6, threshold: 2 }
      if (nr === -1) return { kind: 'chance_aggravation', die: 6, threshold: 1 }
      if (nr === 0)  return { kind: 'heal_hp', amount: 1 }
      if (nr === 1)  return { kind: 'heal_hp', amount: 2 }
      if (nr === 2)  return { kind: 'heal_hp', amount: 3 }
      return { kind: 'heal_hp', amount: 4 }
    } else {
      if (nr === -2) return { kind: 'chance_aggravation', die: 6, threshold: 4 }
      if (nr === -1) return { kind: 'chance_aggravation', die: 6, threshold: 3 }
      if (nr === 0)  return { kind: 'chance_aggravation', die: 6, threshold: 2 }
      if (nr <= 2)   return { kind: 'stable' }
      return { kind: 'chance_heal', die: 6, threshold: 2 }
    }
  }

  // critique
  if (treated) {
    if (nr === -2) return { kind: 'aggravation_auto' }
    if (nr === -1) return { kind: 'chance_aggravation', die: 6, threshold: 2 }
    if (nr === 0)  return { kind: 'stable' }
    if (nr === 1)  return { kind: 'heal_hp', amount: 1 }
    if (nr === 2)  return { kind: 'heal_hp', amount: 2 }
    return { kind: 'heal_hp', amount: 3 }
  } else {
    if (nr <= 0) return { kind: 'aggravation_auto' }
    if (nr <= 2) return { kind: 'chance_aggravation', die: 6, threshold: 2 }
    return { kind: 'stable' }
  }
}

function resolveFromOutcome(outcome: OutcomeKind, wound: Wound, roll?: number): ResolvedOutcome {
  switch (outcome.kind) {
    case 'stable':             return 'stable'
    case 'heal_hp':            return { type: 'heal_hp', amount: outcome.amount }
    case 'heal_full':          return 'heal_full'
    case 'aggravation_auto':   return 'aggravation'
    case 'chance_heal':
      if (roll! <= outcome.threshold) return wound.treated ? 'heal_full' : 'becomes_treated'
      return 'stable'
    case 'chance_aggravation': return roll! <= outcome.threshold ? 'aggravation' : 'stable'
  }
}

function initResolutions(wounds: Wound[], nr: NR): WoundResolution[] {
  return wounds.map(wound => {
    const outcome = getOutcome(wound, nr)
    const needsDice = outcome.kind === 'chance_heal' || outcome.kind === 'chance_aggravation'
    return {
      wound,
      outcome,
      rolledValue: null,
      resolved: needsDice ? null : resolveFromOutcome(outcome, wound),
    }
  })
}

// ── Constantes UI ──────────────────────────────────────────────────────────────

const NR_OPTIONS: { value: NR; label: string; sub: string; cls: string }[] = [
  { value: -2, label: '−2', sub: 'Terrible',  cls: 'border-red-800    text-red-400    hover:bg-red-900/30' },
  { value: -1, label: '−1', sub: 'Mauvais',   cls: 'border-orange-800 text-orange-400 hover:bg-orange-900/30' },
  { value:  0, label:  '0', sub: 'Neutre',    cls: 'border-zinc-600   text-zinc-300   hover:bg-zinc-800' },
  { value:  1, label: '+1', sub: 'Correct',   cls: 'border-teal-800   text-teal-400   hover:bg-teal-900/30' },
  { value:  2, label: '+2', sub: 'Bon',       cls: 'border-green-800  text-green-400  hover:bg-green-900/30' },
  { value:  3, label: '+3', sub: 'Parfait',   cls: 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/30' },
]

const SEVERITY_ICON: Record<WoundSeverity, string> = { légère: '●', grave: '▲', critique: '◆' }
const SEVERITY_COLOR: Record<WoundSeverity, string> = {
  légère: 'text-yellow-400', grave: 'text-orange-500', critique: 'text-red-500',
}
const SEVERITY_NEXT: Partial<Record<WoundSeverity, WoundSeverity>> = { légère: 'grave', grave: 'critique' }

// ── Dé animé ──────────────────────────────────────────────────────────────────

function DiceRoller({ die, onRolled }: { die: number; onRolled: (v: number) => void }) {
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
      if (Date.now() - start >= 1000) {
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
        <span>🎲</span> Lancer le d{die}
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

// ── Helpers d'affichage ────────────────────────────────────────────────────────

function outcomeDesc(o: OutcomeKind): { text: string; color: string } {
  switch (o.kind) {
    case 'stable':            return { text: 'Aucun changement', color: 'text-zinc-500' }
    case 'heal_hp':           return { text: `+${o.amount} PV récupérés`, color: 'text-emerald-400' }
    case 'heal_full':         return { text: 'Guérison complète', color: 'text-emerald-300' }
    case 'aggravation_auto':  return { text: 'Aggravation automatique', color: 'text-red-400' }
    case 'chance_heal': {
      const pct = Math.round((o.threshold / o.die) * 100)
      return { text: `${pct}% de guérison — d${o.die} ≤ ${o.threshold}`, color: 'text-teal-400' }
    }
    case 'chance_aggravation': {
      const pct = Math.round((o.threshold / o.die) * 100)
      return { text: `${pct}% d'aggravation — d${o.die} ≤ ${o.threshold}`, color: 'text-orange-400' }
    }
  }
}

function resolvedDesc(r: ResolvedOutcome): { text: string; color: string } {
  if (r === 'stable')          return { text: '→ Stable', color: 'text-zinc-400' }
  if (r === 'heal_full')       return { text: '→ Guérison complète !', color: 'text-emerald-400' }
  if (r === 'becomes_treated') return { text: '→ Passe à l\'état soignée', color: 'text-teal-400' }
  if (r === 'aggravation')     return { text: '→ Aggravation !', color: 'text-red-400' }
  return { text: `→ +${r.amount} PV`, color: 'text-emerald-400' }
}

// ── Carte par blessure ─────────────────────────────────────────────────────────

function WoundCard({ res, onRolled }: { res: WoundResolution; onRolled: (v: number) => void }) {
  const { wound, outcome, resolved } = res
  const needsDice = outcome.kind === 'chance_heal' || outcome.kind === 'chance_aggravation'
  const die = needsDice ? (outcome as { die: number }).die : 6
  const od = outcomeDesc(outcome)

  const isAggravated = resolved === 'aggravation'
  const isHealed     = resolved === 'heal_full' || (typeof resolved === 'object' && resolved !== null)

  return (
    <div className={`rounded-lg p-3 space-y-2 border transition-colors ${
      isAggravated
        ? 'border-red-700/80 bg-red-950/20'
        : isHealed
          ? 'border-emerald-800/60 bg-emerald-950/10'
          : 'border-zinc-700/80 bg-[#141414]'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs shrink-0 ${SEVERITY_COLOR[wound.severity]}`}>
          {SEVERITY_ICON[wound.severity]}
        </span>
        <span className="text-xs font-semibold text-zinc-200 flex-1 truncate">
          {wound.description}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
          wound.treated
            ? 'border-emerald-700 text-emerald-400'
            : 'border-orange-800 text-orange-400'
        }`}>
          {wound.treated ? 'Soignée' : 'Non soignée'}
        </span>
      </div>

      <p className={`text-[11px] ${od.color}`}>{od.text}</p>

      {needsDice && (
        <div className="flex items-center gap-3 pt-0.5">
          <DiceRoller die={die} onRolled={onRolled} />
          {resolved && (
            <p className={`text-xs font-bold ${resolvedDesc(resolved).color}`}>
              {resolvedDesc(resolved).text}
            </p>
          )}
        </div>
      )}

      {!needsDice && resolved && (
        <p className={`text-xs font-semibold ${resolvedDesc(resolved).color}`}>
          {resolvedDesc(resolved).text}
          {isAggravated && (
            <span className="ml-2 text-red-300 animate-pulse">⚠ Aggravation !</span>
          )}
        </p>
      )}
    </div>
  )
}

// ── Modal principal ────────────────────────────────────────────────────────────

export function RestModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase]             = useState<'nr' | 'resolve'>('nr')
  const [nr, setNr]                   = useState<NR | null>(null)
  const [resolutions, setResolutions] = useState<WoundResolution[]>([])
  const [fvReset, setFvReset]         = useState(false)

  const { character, updateField, removeWound, toggleWoundTreated, updateWoundSeverity, updateWoundHpCost } = useCharacterStore()

  function selectNr(value: NR) {
    setNr(value)
    setResolutions(initResolutions(character.wounds, value))
    setPhase('resolve')
  }

  function handleDiceRolled(woundId: string, rollValue: number) {
    setResolutions(prev => prev.map(res => {
      if (res.wound.id !== woundId) return res
      return { ...res, rolledValue: rollValue, resolved: resolveFromOutcome(res.outcome, res.wound, rollValue) }
    }))
  }

  const allResolved = resolutions.every(r => r.resolved !== null)

  const summary = resolutions.reduce(
    (acc, r) => {
      if (!r.resolved) return acc
      if (r.resolved === 'heal_full')       acc.healed++
      else if (r.resolved === 'becomes_treated') acc.treated++
      else if (r.resolved === 'aggravation') acc.aggravated++
      else if (typeof r.resolved === 'object') acc.hpGain += r.resolved.amount
      return acc
    },
    { healed: 0, treated: 0, aggravated: 0, hpGain: 0 },
  )

  function apply() {
    let totalHpGain = 0

    for (const res of resolutions) {
      if (!res.resolved) continue

      if (res.resolved === 'heal_full') {
        // removeWound restaure déjà wound.hpCost dans hpCurrent — ne pas ajouter à totalHpGain
        removeWound(res.wound.id)

      } else if (res.resolved === 'becomes_treated') {
        if (!res.wound.treated) toggleWoundTreated(res.wound.id)

      } else if (res.resolved === 'aggravation') {
        const nextSev = SEVERITY_NEXT[res.wound.severity]
        if (nextSev) updateWoundSeverity(res.wound.id, nextSev)

      } else if (typeof res.resolved === 'object') {
        const amount    = res.resolved.amount
        const newHpCost = res.wound.hpCost - amount
        if (res.wound.hpCost > 0 && newHpCost <= 0) {
          // Blessure entièrement guérie : removeWound restaure hpCost dans hpCurrent
          removeWound(res.wound.id)
        } else if (res.wound.hpCost > 0) {
          // Guérison partielle : on réduit le coût et on récupère les PV correspondants
          totalHpGain += amount
          updateWoundHpCost(res.wound.id, newHpCost)
        }
      }
    }

    if (totalHpGain > 0) {
      const fresh = useCharacterStore.getState().character
      updateField('hpCurrent', Math.min(fresh.hpCurrent + totalHpGain, calcHpBase(fresh)))
    }

    if (fvReset) {
      updateField('fv', -1)
    }

    const c = useCharacterStore.getState().character
    updateField('faim', Math.max(0, c.faim - 40))
    updateField('soif', Math.max(0, c.soif - 50))

    onClose()
  }

  const nrLabel = nr !== null ? (nr >= 0 ? `+${nr}` : String(nr)) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg mx-4 bg-[#111] border border-zinc-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
            Résolution du Repos
            {nr !== null && (
              <span className="ml-2 text-zinc-400 normal-case font-normal text-xs">NR {nrLabel}</span>
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

          {/* ── Phase 1 : Sélection du NR ── */}
          {phase === 'nr' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">Quel est le Niveau de Repos de cette nuit ?</p>
              <div className="grid grid-cols-6 gap-2">
                {NR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => selectNr(opt.value)}
                    className={`flex flex-col items-center py-3 rounded-lg border transition-colors ${opt.cls}`}
                  >
                    <span className="text-lg font-bold font-mono">{opt.label}</span>
                    <span className="text-[10px] mt-0.5 opacity-70">{opt.sub}</span>
                  </button>
                ))}
              </div>
              {/* FV → −1 */}
              <button
                onClick={() => setFvReset(v => !v)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border
                            text-xs transition-colors text-left ${
                  fvReset
                    ? 'border-teal-600 bg-teal-900/20 text-teal-300'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                                  transition-colors ${
                  fvReset ? 'border-teal-500 bg-teal-600' : 'border-zinc-600'
                }`}>
                  {fvReset && <span className="text-black text-[10px] font-bold leading-none">✓</span>}
                </span>
                <span>
                  Ce repos ramène la FV à <span className="font-bold font-mono">−1</span>
                  <span className="text-zinc-600 ml-1">(relais / avant-poste / nuits suffisantes en ville)</span>
                </span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300
                           border border-zinc-800 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          )}

          {/* ── Phase 2 : Résolution des blessures ── */}
          {phase === 'resolve' && (
            <div className="space-y-3">
              {character.wounds.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-6">
                  Aucune blessure — le personnage récupère sans complication.
                  {fvReset && <span className="block mt-1 text-teal-400 not-italic">FV → −1</span>}
                  <span className="block mt-1 text-blue-400 not-italic">−40 Faim · −50 Soif</span>
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {resolutions.map(res => (
                    <WoundCard
                      key={res.wound.id}
                      res={res}
                      onRolled={(v) => handleDiceRolled(res.wound.id, v)}
                    />
                  ))}
                </div>
              )}

              {/* Récapitulatif */}
              {allResolved && resolutions.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs border-t border-zinc-800 pt-3">
                  {summary.hpGain > 0 && (
                    <span className="text-emerald-400">+{summary.hpGain} PV</span>
                  )}
                  {summary.healed > 0 && (
                    <span className="text-emerald-400">
                      {summary.healed} blessure{summary.healed > 1 ? 's' : ''} guérie{summary.healed > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.treated > 0 && (
                    <span className="text-teal-400">
                      {summary.treated} blessure{summary.treated > 1 ? 's' : ''} passée{summary.treated > 1 ? 's' : ''} en état soignée
                    </span>
                  )}
                  {summary.aggravated > 0 && (
                    <span className="text-red-400">
                      {summary.aggravated} aggravation{summary.aggravated > 1 ? 's' : ''}
                    </span>
                  )}
                  {fvReset && (
                    <span className="text-teal-400">FV → −1</span>
                  )}
                  <span className="text-blue-400">−40 Faim · −50 Soif</span>
                  {summary.hpGain === 0 && summary.healed === 0 && summary.treated === 0 && summary.aggravated === 0 && !fvReset && (
                    <span className="text-zinc-500">Aucun changement aux blessures</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPhase('nr')}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200
                             border border-zinc-800 rounded-lg transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={apply}
                  disabled={!allResolved && character.wounds.length > 0}
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
