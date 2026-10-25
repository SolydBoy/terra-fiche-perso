import { useState, Fragment } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { SKILLS } from '../../engine/skills'
import { useItemsStore } from '../../store/itemsStore'
import type { WoundSeverity } from '../../engine/types'
import { getSkillBreakdown } from '../../engine/dons'
import { computeAllBonuses } from '../../engine/traits'
import { calcPeMax, calcPeRecovery, calcHpMax, calcBM } from '../../engine/stats'
import { useBreakdownTooltip, BreakdownPopover } from '../ui/BreakdownPopover'
import { CATEGORY_STYLE } from './SkillsTab'
import type { SkillDef } from '../../engine/skills'
import { TECHNIQUES } from '../../engine/techniques'
import type { TechniqueCategory, TechniqueDef } from '../../engine/techniques'
import type { AttackDef } from '../../engine/items'
import { getCachedTechniquesData } from '../../lib/syncTechniquesNotion'
import type { SyncedTechniqueDef } from '../../lib/notionConvertTechniques'
import { SPELLS, POWER_LEVELS, POWER_LABELS, SPELL_MASTERY_MOD, TYPE_MASTERY_MOD } from '../../engine/magic'
import type { MasteryLevel } from '../../engine/magic'

// ─── Helpers règles ────────────────────────────────────────────────────────────

/** Bonus de défense issu des niveaux de Dextérité (règles) */
function calcDefenseBonus(dex: number): number {
  let bonus = 0
  if (dex >= 2)  bonus += 1   // +1 jet de défense
  if (dex >= 7)  bonus += 1   // +1 défense
  if (dex >= 15) bonus += 2   // +2 en défense
  return bonus
}

// ─── Carte de compétence de combat ────────────────────────────────────────────
// Deux boutons : ⚔ Attaque (1d20 + niveau arme) | 🛡 Défense (1d20 + bonus Dex)

function CombatSkillCard({
  skill,
  defenseBonus,
  donBonus     = 0,
  accentColor  = 'text-red-400',
  barColor     = 'bg-red-600',
}: {
  skill:        SkillDef
  defenseBonus: number
  donBonus?:    number
  accentColor?: string
  barColor?:    string
}) {
  const { character } = useCharacterStore()
  const [copiedAtk, setCopiedAtk] = useState(false)
  const [copiedDef, setCopiedDef] = useState(false)

  const base = (character.skills ?? {})[skill.id] ?? 0
  const lvl  = base + donBonus
  const pct  = Math.round((lvl / 20) * 100)

  const breakdown = getSkillBreakdown(base, character.dons ?? [], skill.id, skill.category)
  const { handlers: tooltipHandlers, tooltip } = useBreakdownTooltip(breakdown, lvl)

  function rollAttack(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(`/gr 1d20+${lvl} ${skill.name}`)
    setCopiedAtk(true)
    setTimeout(() => setCopiedAtk(false), 2000)
  }

  function rollDefense(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(`/gr 1d20+${defenseBonus + lvl} défense`)
    setCopiedDef(true)
    setTimeout(() => setCopiedDef(false), 2000)
  }

  return (
    <div
      {...tooltipHandlers}
      className="relative flex flex-col bg-[#1a1a1a] border border-zinc-800 rounded-md
                 overflow-hidden hover:border-zinc-700 transition-colors"
    >
      {tooltip}

      <div className="px-1.5 pt-1.5 pb-1 space-y-1">
        {/* Nom + niveau */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-500 font-medium leading-tight flex-1 min-w-0 truncate">
            {skill.name}
            {donBonus !== 0 && (
              <span className={`ml-1 font-bold ${donBonus > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                {donBonus > 0 ? `+${donBonus}` : donBonus}
              </span>
            )}
          </span>
          <span className={`font-mono font-bold text-xs w-4 text-center shrink-0 ${lvl > 0 ? accentColor : 'text-zinc-600'}`}>
            {lvl}
          </span>
        </div>

        {/* Boutons de jet */}
        <div className="flex gap-0.5">
          <button
            onClick={rollAttack}
            className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-colors
                        ${copiedAtk
                          ? 'bg-emerald-700/40 text-emerald-400'
                          : 'bg-red-900/40 hover:bg-red-900/70 text-red-300'}`}
          >
            {copiedAtk ? '✓' : `⚔+${lvl}`}
          </button>
          <button
            onClick={rollDefense}
            className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-colors
                        ${copiedDef
                          ? 'bg-emerald-700/40 text-emerald-400'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
          >
            {copiedDef ? '✓' : `🛡+${defenseBonus + lvl}`}
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-[2px] w-full bg-zinc-800">
        <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Stat de combat (armure, défense, critique) ────────────────────────────────

function CombatStatBadge({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center bg-[#242424] border border-zinc-700 rounded-lg px-4 py-2.5 min-w-[72px]">
      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">{label}</span>
      <span className="font-mono font-bold text-xl text-zinc-100 leading-none">{value}</span>
      {sub && <span className="text-[9px] text-zinc-600 mt-0.5">{sub}</span>}
    </div>
  )
}

function InitiativeButton({ dex }: { dex: number }) {
  const [copied, setCopied] = useState(false)
  function roll() {
    navigator.clipboard.writeText(`/gr 1d20+${dex} initiative`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={roll}
      className="flex flex-col items-center bg-[#242424] border border-zinc-700 hover:border-orange-600
                 rounded-lg px-4 py-2.5 min-w-[72px] transition-colors"
    >
      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Initiative</span>
      <span className={`font-mono font-bold text-xl leading-none transition-colors ${copied ? 'text-emerald-400' : 'text-zinc-100'}`}>
        {copied ? '✓' : `+${dex}`}
      </span>
      <span className="text-[9px] text-zinc-600 mt-0.5">1d20 + Dex</span>
    </button>
  )
}

// ─── Bouton d'action copiable (PE déduits + loggés au clic) ──────────────────

function ActionCopyButton({ label, text, cost, fatigue, isAttack, cls, logLabel }: {
  label:      string
  text:       string
  cost?:      number
  /** Fatigue générée par cette action (s'accumule sur le tour) */
  fatigue?:   number
  /** Si true, le coût réel = cost + combatFatigue accumulée */
  isAttack?:  boolean
  cls:        string
  logLabel?:  string
}) {
  const { character, spendPE, logAction, addFatigue, combatFatigue } = useCharacterStore()
  const peCurrent    = character.peCurrent ?? 0
  const baseCost     = cost ?? 0
  const effectiveCost = baseCost + (isAttack ? combatFatigue : 0)
  const canAfford    = effectiveCost === 0 || peCurrent >= effectiveCost
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!canAfford) return
    navigator.clipboard.writeText(text)
    if (effectiveCost > 0) {
      spendPE(effectiveCost)
      logAction(logLabel ?? label, effectiveCost)
    }
    if (fatigue && fatigue > 0) {
      addFatigue(fatigue)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showFatigueExtra = isAttack && combatFatigue > 0

  return (
    <button
      onClick={handleClick}
      disabled={!canAfford}
      className={`text-[9px] px-2 py-1 rounded border font-bold transition-colors shrink-0 ${
        copied       ? 'bg-emerald-700/40 border-emerald-700 text-emerald-400'
        : !canAfford ? 'opacity-30 cursor-not-allowed border-zinc-700 text-zinc-600'
        : cls
      }`}
    >
      {copied ? '✓' : label}
      {!copied && effectiveCost > 0 && (
        <span className="ml-1 text-[8px] opacity-60">
          {showFatigueExtra
            ? <>{effectiveCost}PE <span className="text-orange-400">({baseCost}+{combatFatigue}f)</span></>
            : <>{effectiveCost}PE{fatigue ? <span className="text-orange-400 ml-0.5">+{fatigue}f</span> : null}</>
          }
        </span>
      )}
    </button>
  )
}

// ─── Bouton de lancer de sort (coût PE + corruption) ──────────────────────────

function SpellCastButton({ label, text, peCost, corruptionCost, cls }: {
  label:          string
  text:           string
  peCost:         number
  corruptionCost: number
  cls:            string
}) {
  const { character, spendPE, logAction, addCorruption } = useCharacterStore()
  const peCurrent = character.peCurrent ?? 0
  const canAfford = peCost === 0 || peCurrent >= peCost
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!canAfford) return
    navigator.clipboard.writeText(text)
    if (peCost > 0) {
      spendPE(peCost)
      logAction(label, peCost)
    }
    if (corruptionCost > 0) addCorruption(corruptionCost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canAfford}
      className={`text-[9px] px-2 py-1 rounded border font-bold transition-colors shrink-0 ${
        copied       ? 'bg-emerald-700/40 border-emerald-700 text-emerald-400'
        : !canAfford ? 'opacity-30 cursor-not-allowed border-zinc-700 text-zinc-600'
        : cls
      }`}
    >
      {copied ? '✓' : label}
      {!copied && (
        <span className="ml-1 text-[8px] opacity-60">
          {peCost}PE <span className="text-purple-400">+{corruptionCost}c</span>
        </span>
      )}
    </button>
  )
}

// ─── Bulle info PE (max breakdown + actions dépensées ce tour) ───────────────

type PeBreakdown = ReturnType<typeof calcPeMax>

function PeInfoBubble({ peBreakdown, peRecovery }: { peBreakdown: PeBreakdown; peRecovery: number }) {
  const { combatLog } = useCharacterStore()
  const [open, setOpen] = useState(false)
  const spent = combatLog.reduce((s, e) => s + e.cost, 0)

  return (
    <div className="relative shrink-0">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-400
                   hover:text-sky-300 text-[9px] font-bold flex items-center justify-center transition-colors"
      >ⓘ</button>

      {open && (
        <div className="absolute right-0 top-5 z-50 bg-[#1c1c1c] border border-zinc-700
                        rounded-lg p-2.5 min-w-[190px] shadow-xl pointer-events-none">

          {/* Breakdown max PE */}
          <p className="text-[9px] uppercase tracking-widest text-sky-500 font-bold mb-1">
            Max endurance
          </p>
          {peBreakdown.sources.map((src, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-[10px] text-zinc-400 truncate">{src.label}</span>
              <span className="text-[10px] font-mono text-sky-300 shrink-0">
                {src.value > 0 ? `+${src.value}` : src.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-zinc-700/60 mt-1 pt-1">
            <span className="text-[9px] text-zinc-500">Total</span>
            <span className="text-[9px] font-mono font-bold text-sky-300">{peBreakdown.total}</span>
          </div>

          {/* Récupération par tour */}
          <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mt-2.5 mb-1">
            Récupération / tour
          </p>
          <div className="flex items-center justify-between gap-3 py-0.5">
            <span className="text-[10px] text-zinc-400">Récupération normale</span>
            <span className="text-[10px] font-mono text-emerald-300">+{peRecovery}</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-0.5">
            <span className="text-[10px] text-zinc-400">Si PE négatifs</span>
            <span className="text-[10px] font-mono text-emerald-300">+{Math.floor(peRecovery / 2)}</span>
          </div>

          {/* Log des actions ce tour */}
          {combatLog.length > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-widest text-red-500 font-bold mt-2.5 mb-1">
                Dépensés ce tour
              </p>
              {combatLog.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="text-[10px] text-zinc-300 truncate">{e.label}</span>
                  <span className="text-[10px] font-mono text-red-400 shrink-0">−{e.cost}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-zinc-700/60 mt-1 pt-1">
                <span className="text-[9px] text-zinc-500">Total dépensé</span>
                <span className="text-[9px] font-mono font-bold text-red-400">−{spent}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Blessure rapide ──────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: { value: WoundSeverity; label: string }[] = [
  { value: 'légère',   label: 'Légère'   },
  { value: 'grave',    label: 'Grave'    },
  { value: 'critique', label: 'Critique' },
]

function QuickWoundForm() {
  const { addWound } = useCharacterStore()
  const [open,     setOpen]     = useState(false)
  const [damage,   setDamage]   = useState('')
  const [severity, setSeverity] = useState<WoundSeverity>('légère')

  function submit() {
    const cost = Math.max(0, parseInt(damage, 10) || 0)
    addWound(severity, `Blessure ${severity}`, cost)
    setDamage('')
    setSeverity('légère')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="shrink-0 px-2 py-1 rounded border border-red-900/60 text-red-400
                 hover:bg-red-900/30 text-[10px] font-bold transition-colors"
    >
      ⚔ Blessure
    </button>
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input
        autoFocus
        type="number"
        min={0}
        placeholder="PV"
        value={damage}
        onChange={(e) => setDamage(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        className="w-12 text-center bg-[#0f0f0f] border border-red-800/60 rounded
                   text-[10px] text-red-300 font-mono py-1 focus:outline-none focus:border-red-500
                   [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value as WoundSeverity)}
        className="bg-[#0f0f0f] border border-zinc-700 rounded text-[10px] text-zinc-300
                   py-1 px-1.5 focus:outline-none"
      >
        {SEVERITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={submit}
        className="px-2 py-1 rounded bg-red-900/50 border border-red-800/60 text-red-300
                   text-[10px] font-bold hover:bg-red-900/80 transition-colors"
      >
        Appliquer
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-zinc-600 hover:text-zinc-400 text-[10px] transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Bannière mode combat (PV + PE bar + fin de tour) ─────────────────────────

function CombatBanner({ peBreakdown, peRecovery }: { peBreakdown: PeBreakdown; peRecovery: number }) {
  const { character, endTurn, setCombatMode, updateField, combatFatigue, addFatigue } = useCharacterStore()
  const donBonuses = computeAllBonuses(character)
  const hpBreakdown = calcHpMax(character, donBonuses)
  const hpMax     = hpBreakdown.total
  const hpCurrent = character.hpCurrent ?? 0
  const peMax     = peBreakdown.total
  const peCurrent = character.peCurrent ?? 0
  const low  = peCurrent <= Math.floor(peMax * 0.3)
  const pct  = Math.max(0, Math.min(100, (peCurrent / peMax) * 100))
  const nextTurn = peCurrent < 0
    ? Math.floor(peRecovery / 2)
    : Math.min(peMax, peCurrent + peRecovery)

  return (
    <div className="bg-[#1a1a1a] border border-sky-800/50 rounded-xl p-3 space-y-2">

      {/* Barre PV */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-red-400 shrink-0 w-6">PV</span>
        <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hpCurrent <= Math.floor(hpMax * 0.3) ? 'bg-red-600' :
              hpCurrent <= Math.floor(hpMax * 0.6) ? 'bg-orange-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100))}%` }}
          />
        </div>
        <span className={`font-mono font-bold text-sm shrink-0 w-14 text-right ${
          hpCurrent <= Math.floor(hpMax * 0.3) ? 'text-red-400' : 'text-emerald-300'
        }`}>
          {hpCurrent} / {hpMax}
        </span>
        <BreakdownPopover sources={hpBreakdown.sources} total={hpBreakdown.total} label="PV" />
        <button
          onClick={() => updateField('hpCurrent', Math.min(hpMax, hpCurrent + 1))}
          className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
        >+</button>
        <button
          onClick={() => updateField('hpCurrent', Math.max(0, hpCurrent - 1))}
          className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
        >−</button>
        <QuickWoundForm />
      </div>

      {/* Barre PE */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-sky-400 shrink-0 w-6">PE</span>
        <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${low ? 'bg-red-500' : 'bg-sky-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`font-mono font-bold text-sm shrink-0 w-14 text-right ${low ? 'text-red-400' : peCurrent < 0 ? 'text-red-500' : 'text-sky-300'}`}>
          {peCurrent} / {peMax}
        </span>
        {/* Bulle info — toujours visible */}
        <PeInfoBubble peBreakdown={peBreakdown} peRecovery={peRecovery} />
        <button
          onClick={() => updateField('peCurrent', Math.min(peMax, peCurrent + 1))}
          className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
        >+</button>
        <button
          onClick={() => updateField('peCurrent', peCurrent - 1)}
          className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
        >−</button>
      </div>

      {/* Fatigue accumulée */}
      {combatFatigue > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-orange-400 shrink-0">⚡ Fatigue</span>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (combatFatigue / 10) * 100)}%` }}
            />
          </div>
          <span className="font-mono font-bold text-sm text-orange-300 shrink-0 w-6 text-right">
            +{combatFatigue}
          </span>
          <span className="text-[9px] text-orange-600 shrink-0">PE/attaque</span>
          <button
            onClick={() => addFatigue(-1)}
            className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
          >−</button>
          <button
            onClick={() => addFatigue(1)}
            className="shrink-0 w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
          >+</button>
        </div>
      )}

      {/* Contrôles + preview récupération */}
      <div className="flex gap-2 items-center">
        <button
          onClick={endTurn}
          className="flex-1 py-1.5 rounded-lg bg-sky-900/40 hover:bg-sky-900/70 border border-sky-800/60
                     text-sky-300 text-[10px] font-bold transition-colors"
        >
          ⟳ Fin de tour
          {peCurrent < peMax && (
            <span className="ml-1 text-sky-500">
              (+{peRecovery}{peCurrent < 0 ? '/2' : ''} → {nextTurn} PE)
            </span>
          )}
          {combatFatigue > 0 && (
            <span className="ml-1 text-orange-600">· fatigue remise à 0</span>
          )}
        </button>
        <button
          onClick={() => setCombatMode(false)}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                     text-zinc-400 text-[10px] font-bold transition-colors"
        >
          ✕ Fin de combat
        </button>
      </div>
    </div>
  )
}

// ─── Bouton entrer en combat (initiative + activation) ────────────────────────

function EnterCombatButton({ dex }: { dex: number }) {
  const { setCombatMode } = useCharacterStore()
  const [copied, setCopied] = useState(false)

  function enter() {
    navigator.clipboard.writeText(`/gr 1d20+${dex} initiative`)
    setCombatMode(true)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={enter}
      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors border ${
        copied
          ? 'bg-emerald-900/40 border-emerald-800/60 text-emerald-400'
          : 'bg-red-900/30 hover:bg-red-900/60 border-red-900/60 text-red-300'
      }`}
    >
      {copied
        ? `✓ Initiative +${dex} copiée — En combat !`
        : `⚔ Entrer en combat  ·  initiative 1d20+${dex}`}
    </button>
  )
}

// ─── Badge Bonus de Maîtrise ──────────────────────────────────────────────────

const BM_COLOR = [
  'text-zinc-500 border-zinc-700',    // 0
  'text-yellow-600 border-yellow-800/60',  // 1
  'text-yellow-500 border-yellow-700/60',  // 2
  'text-orange-400 border-orange-700/60',  // 3
  'text-orange-300 border-orange-600/60',  // 4
  'text-amber-300  border-amber-500/60',   // 5
]

function BmBadge({ bm, lvl }: { bm: number; lvl: number }) {
  const [show, setShow] = useState(false)
  const cls = BM_COLOR[Math.min(bm, 5)]

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border cursor-default ${cls}`}>
        BM {bm > 0 ? `+${bm}` : '0'}
      </span>

      {show && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50
                        bg-[#1c1c1c] border border-zinc-700 rounded-lg
                        px-2.5 py-2 min-w-[180px] shadow-xl pointer-events-none">
          <p className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mb-1.5">
            Bonus de Maîtrise
          </p>
          <p className="text-[10px] text-zinc-300 leading-relaxed mb-1.5">
            Niveau {lvl} → +{bm} aux dégâts de base
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {([
              [0,  '0–3',   '0'],
              [1,  '4–7',   '+1'],
              [2,  '8–11',  '+2'],
              [3,  '12–15', '+3'],
              [4,  '16–19', '+4'],
              [5,  '20',    '+5'],
            ] as [number, string, string][]).map(([b, range, val]) => (
              <div key={b} className={`flex justify-between gap-2 text-[9px] ${b === bm ? 'text-amber-300 font-bold' : 'text-zinc-600'}`}>
                <span>{range}</span>
                <span className="font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ligne d'attaque (avec tooltip description au hover) ──────────────────────

function WeaponAttackRow({
  atk, skill, lvl, weaponName, multi, bm,
}: {
  atk:        AttackDef
  skill:      ReturnType<typeof SKILLS['find']>
  lvl:        number
  weaponName: string
  multi:      boolean
  bm:         number
}) {
  const [showDesc, setShowDesc] = useState(false)

  // Formules de dégâts avec BM intégré (s'applique à tous les jets, base + écarts)
  const dmgText  = (d: string | undefined) => bm > 0 && d ? `${d}+${bm}` : (d ?? '')
  const baseDamageText  = dmgText(atk.damage)
  const baseDamageLabel = atk.damage ? `🎲 ${dmgText(atk.damage)}` : ''
  const dmg5Text  = dmgText(atk.damage5)
  const dmg10Text = dmgText(atk.damage10)

  return (
    <div
      className={`relative flex flex-wrap items-center gap-1.5
                  ${multi ? 'pl-3 border-l border-zinc-800' : ''}`}
      onMouseEnter={() => atk.description ? setShowDesc(true) : undefined}
      onMouseLeave={() => setShowDesc(false)}
    >
      {atk.name && (
        <span className="text-[9px] text-zinc-500 italic shrink-0 min-w-[4rem]">{atk.name}</span>
      )}

      {skill && (
        <ActionCopyButton
          label={`⚔ +${lvl}`}
          text={`/gr 1d20+${lvl} ${weaponName}${atk.name ? ` — ${atk.name}` : ''}`}
          cost={atk.peUseCost}
          fatigue={atk.fatigueCost}
          isAttack
          logLabel={`${weaponName}${atk.name ? ` — ${atk.name}` : ''}`}
          cls="border-red-800/60 text-red-400 hover:bg-red-900/30"
        />
      )}

      {(atk.damage || atk.effect) && (
        <>
          {atk.damage && (
            <ActionCopyButton
              label={baseDamageLabel}
              text={`/r ${baseDamageText}`}
              cls="border-orange-800/60 text-orange-400 hover:bg-orange-900/30"
            />
          )}
          {atk.effect && (
            <span className="text-[9px] text-zinc-500 italic">{atk.effect}</span>
          )}
        </>
      )}

      {(atk.damage5 || atk.effect5) && (
        <>
          <ActionCopyButton
            label={`+5 › ${atk.damage5 ? dmg5Text : atk.effect5}`}
            text={atk.damage5 ? `/r ${dmg5Text}` : (atk.effect5 ?? '')}
            cls="border-yellow-800/60 text-yellow-500 hover:bg-yellow-900/30"
          />
          {atk.damage5 && atk.effect5 && (
            <span className="text-[9px] text-yellow-700 italic">{atk.effect5}</span>
          )}
        </>
      )}

      {(atk.damage10 || atk.effect10) && (
        <>
          <ActionCopyButton
            label={`+10 › ${atk.damage10 ? dmg10Text : atk.effect10}`}
            text={atk.damage10 ? `/r ${dmg10Text}` : (atk.effect10 ?? '')}
            cls="border-red-700/60 text-red-300 hover:bg-red-900/30"
          />
          {atk.damage10 && atk.effect10 && (
            <span className="text-[9px] text-red-700 italic">{atk.effect10}</span>
          )}
        </>
      )}

      {/* Tooltip description */}
      {atk.description && showDesc && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50
                        bg-[#1c1c1c] border border-zinc-700 rounded-lg
                        px-2.5 py-1.5 min-w-[160px] max-w-[260px]
                        shadow-xl pointer-events-none">
          <p className="text-[10px] text-zinc-300 leading-relaxed">{atk.description}</p>
        </div>
      )}
    </div>
  )
}

// ─── Panel d'actions combat ────────────────────────────────────────────────────

function CombatActionsPanel() {
  const { character }        = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()
  const donBonuses   = computeAllBonuses(character)
  const skillBonuses = donBonuses.skills

  const weapons = (character.inventory ?? [])
    .map((item) => ({ item, def: ITEMS_LIST.find((d) => d.id === item.itemId) }))
    .filter(({ def }) => def?.category === 'Arme' && (def?.damage || def?.combatSkillId || def?.attacks?.length))

  const acquiredIds  = character.techniquesAcquises ?? []
  const peCosts      = character.techniquePeCosts  ?? {}
  const allTechs: SyncedTechniqueDef[] = getCachedTechniquesData()?.techniques ?? TECHNIQUES
  const techniques   = allTechs.filter((t) => t.type === 'technique' && t.peCost !== undefined && acquiredIds.includes(t.id))
  const attaques     = allTechs.filter((t) => t.type === 'attaque'   && acquiredIds.includes(t.id))

  const spellIds  = character.sortilegesAcquis ?? []
  const spells    = SPELLS.filter((s) => spellIds.includes(s.id))
  const fluxBase  = (character.skills ?? {})['flux-magiques'] ?? 0
  const fluxLvl   = getSkillBreakdown(fluxBase, character.dons ?? [], 'flux-magiques', 'Spécialisé')
    .reduce((sum, src) => sum + src.value, 0)

  const empty = weapons.length === 0 && techniques.length === 0 && attaques.length === 0 && spells.length === 0

  return (
    <div className="bg-[#1a1a1a] border border-red-900/40 rounded-xl p-4 space-y-4">
      <h2 className="text-[10px] uppercase tracking-widest text-red-400 font-bold
                     border-b border-red-900/40 pb-1">
        ⚔ Actions de combat
      </h2>

      {/* ── Armes ──────────────────────────────────────── */}
      {weapons.map(({ item, def }) => {
        if (!def) return null
        const skill = def.combatSkillId ? SKILLS.find((s) => s.id === def.combatSkillId) : undefined
        const base  = skill ? ((character.skills ?? {})[skill.id] ?? 0) : 0
        const lvl   = base + (skillBonuses[def.combatSkillId ?? ''] ?? 0)
        const bm    = calcBM(lvl)

        // Normalise en tableau d'attaques pour un rendu uniforme
        const attacks: AttackDef[] = def.attacks?.length
          ? def.attacks
          : (def.damage || def.peUseCost || skill)
            ? [{
                name:        undefined,
                description: def.description,
                damage:      def.damage,
                effect:      def.effect,
                damage5:     def.damage5,
                effect5:     def.effect5,
                damage10:    def.damage10,
                effect10:    def.effect10,
                peUseCost:   def.peUseCost,
                fatigueCost: def.fatigueCost,
              }]
            : []

        return (
          <div key={item.id} className="space-y-1.5">
            {/* En-tête arme */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-200 font-semibold">{def.name}</span>
              {skill && <span className="text-[9px] text-zinc-500">{skill.name} ({lvl})</span>}
              <BmBadge bm={bm} lvl={lvl} />
              {def.url && (
                <a
                  href={def.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700
                             text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                  title="Fiche Notion"
                >↗</a>
              )}
            </div>

            {/* Rangée(s) d'attaques */}
            {attacks.map((atk, i) => (
              <WeaponAttackRow
                key={i}
                atk={atk}
                skill={skill}
                lvl={lvl}
                weaponName={def.name}
                multi={attacks.length > 1}
                bm={bm}
              />
            ))}

            {/* Aucune attaque — juste le jet de compétence */}
            {attacks.length === 0 && skill && (
              <div className="flex flex-wrap gap-1.5">
                <ActionCopyButton
                  label={`⚔ +${lvl}`}
                  text={`/gr 1d20+${lvl} ${def.name}`}
                  isAttack
                  logLabel={`${def.name} — attaque`}
                  cls="border-red-800/60 text-red-400 hover:bg-red-900/30"
                />
              </div>
            )}
          </div>
        )
      })}

      {/* ── Techniques actives ─────────────────────────── */}
      {techniques.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Techniques</p>
          <div className="flex flex-wrap gap-1.5">
            {techniques.map((t) => {
              const copyText = t.effect ?? t.description
              return (
                <Fragment key={t.id}>
                  <ActionCopyButton
                    label={t.name}
                    text={copyText}
                    cost={peCosts[t.id] ?? t.peCost}
                    fatigue={t.fatigueCost}
                    cls="border-blue-800/60 text-blue-400 hover:bg-blue-900/30"
                  />
                  {t.url && (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Fiche Notion"
                      className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-700
                                 text-[9px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                    >↗</a>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Attaques spéciales ─────────────────────────── */}
      {attaques.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Attaques Spéciales</p>
          <div className="flex flex-wrap gap-1.5">
            {attaques.map((t) => {
              const copyText = t.effect ?? t.description
              return (
                <Fragment key={t.id}>
                  <ActionCopyButton
                    label={t.name}
                    text={copyText}
                    cost={peCosts[t.id] ?? t.peCost}
                    fatigue={t.fatigueCost}
                    isAttack
                    cls="border-purple-800/60 text-purple-400 hover:bg-purple-900/30"
                  />
                  {t.url && (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Fiche Notion"
                      className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-700
                                 text-[9px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                    >↗</a>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sortilèges ─────────────────────────────────── */}
      {spells.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
            Sortilèges · Corruption {character.corruption ?? 0}/100
          </p>
          <div className="space-y-2">
            {spells.map((spell) => {
              const masterySpell = (character.sortMastery ?? {})[spell.id] as MasteryLevel | undefined
              const masteryType  = (character.sortTypeMastery ?? {})[spell.type] as MasteryLevel | undefined
              const mod = fluxLvl
                + (masterySpell ? SPELL_MASTERY_MOD[masterySpell] : 0)
                + (masteryType  ? TYPE_MASTERY_MOD[masteryType]   : 0)

              return (
                <div key={spell.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-zinc-300 font-semibold shrink-0">{spell.name}</span>
                  {POWER_LEVELS.map((power) => {
                    const def = spell.powers[power]
                    return (
                      <SpellCastButton
                        key={power}
                        label={POWER_LABELS[power]}
                        text={`/r 1d20+${mod} Maîtrise des Flux Magiques — ${spell.name} (${POWER_LABELS[power]})`}
                        peCost={def.peCost}
                        corruptionCost={def.corruptionCost}
                        cls="border-indigo-800/60 text-indigo-400 hover:bg-indigo-900/30"
                      />
                    )
                  })}
                  {spell.url && (
                    <a
                      href={spell.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Fiche Notion"
                      className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-700
                                 text-[9px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                    >↗</a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {empty && (
        <p className="text-xs text-zinc-600 italic">
          Aucune arme (avec dégâts renseignés dans items-extra.ts) ni technique acquise.
        </p>
      )}
    </div>
  )
}

// ─── Séparateur de section ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  )
}

// ─── Onglet Combat ─────────────────────────────────────────────────────────────

const MELEE_IDS    = ['hache', 'longue-masse', 'petite-masse', 'longue-lame', 'petite-lame', 'lance', 'main-nue']
const DISTANCE_IDS = ['visee', 'rechargement']
const TACTICAL_IDS = ['tactique-militaire', 'leadership', 'intimidation', 'furtivite', 'acrobaties']

export function CombatTab() {
  const { character, updateField, combatMode } = useCharacterStore()
  const { items: ITEMS_LIST }                  = useItemsStore()

  const donBonuses   = computeAllBonuses(character)
  const skillBonuses = donBonuses.skills

  const effectiveDex  = character.dexterite + (donBonuses.characteristics.dexterite ?? 0)
  const defenseBonus  = calcDefenseBonus(effectiveDex)
  const peBreakdown   = calcPeMax(character, donBonuses)
  const peRecovery    = calcPeRecovery(character, donBonuses)
  const armureBase    = character.armure ?? 0
  const armureTraits  = donBonuses.armure

  const allEquippedIds = [
    ...Object.values(character.equipped ?? {}),
    ...(character.equippedList ?? []),
  ]

  const equippedArmor = allEquippedIds.reduce((sum, instanceId) => {
    const inst = (character.inventory ?? []).find((i) => i.id === instanceId)
    const def  = ITEMS_LIST.find((d) => d.id === inst?.itemId)
    return sum + (def?.effects?.armor ?? 0)
  }, 0)

  const equippedDefenseItems = allEquippedIds
    .map((instanceId) => {
      const inst = (character.inventory ?? []).find((i) => i.id === instanceId)
      const def  = ITEMS_LIST.find((d) => d.id === inst?.itemId)
      return def?.effects?.defenseBonus ? { name: def.name, bonus: def.effects.defenseBonus } : null
    })
    .filter((x): x is { name: string; bonus: number } => x !== null)

  const equippedDefenseBonus = equippedDefenseItems.reduce((sum, x) => sum + x.bonus, 0)

  const defenseSources = [
    { label: `Dextérité (${effectiveDex})`, value: defenseBonus },
    ...equippedDefenseItems.map((x) => ({ label: x.name, value: x.bonus })),
  ]
  const { handlers: defenseHandlers, tooltip: defenseTooltip } =
    useBreakdownTooltip(defenseSources, defenseBonus + equippedDefenseBonus)

  const armureSources = [
    { label: 'Base', value: armureBase },
    ...(armureTraits  !== 0 ? [{ label: 'Traits',      value: armureTraits  }] : []),
    ...(equippedArmor !== 0 ? [{ label: 'Équipement',  value: equippedArmor }] : []),
  ]
  const { handlers: armureHandlers, tooltip: armureTooltip } =
    useBreakdownTooltip(armureSources, armureBase + equippedArmor + armureTraits)

  const skillById = (id: string) => SKILLS.find((s) => s.id === id)

  return (
    <div className="space-y-4">

      {/* ── Mode combat toggle ───────────────────────────────────────────── */}
      {combatMode
        ? <CombatBanner peBreakdown={peBreakdown} peRecovery={peRecovery} />
        : <EnterCombatButton dex={effectiveDex} />}

      {/* ── Actions combat (visible en mode combat seulement) ───────────── */}
      {combatMode && <CombatActionsPanel />}

      {/* ── Stats de combat ──────────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
        <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3
                       border-b border-zinc-700/60 pb-1">
          Stats de combat
        </h2>
        <div className="flex gap-2 items-stretch">
          <div
            {...armureHandlers}
            className="flex flex-col items-center justify-center bg-[#242424] border border-zinc-700 rounded-lg px-4 py-2.5 min-w-[72px]"
          >
            {armureTooltip}
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Armure</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateField('armure', Math.max(0, armureBase - 1))}
                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300
                           text-xs flex items-center justify-center transition-colors"
              >−</button>
              <span className="font-mono font-bold text-xl text-zinc-100 w-7 text-center">
                {armureBase + equippedArmor + armureTraits}
              </span>
              <button
                onClick={() => updateField('armure', armureBase + 1)}
                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300
                           text-xs flex items-center justify-center transition-colors"
              >+</button>
            </div>
            <span className="text-[9px] text-zinc-600 mt-0.5">base {armureBase}{armureTraits !== 0 ? ` ${armureTraits > 0 ? '+' : ''}${armureTraits} traits` : ''}{equippedArmor > 0 ? ` +${equippedArmor} éq.` : ''}</span>
          </div>
          <div {...defenseHandlers} className="relative">
            {defenseTooltip}
            <CombatStatBadge
              label="Défense"
              value={(() => { const total = defenseBonus + equippedDefenseBonus; return total > 0 ? `+${total}` : String(total) })()}
              sub={equippedDefenseBonus > 0 ? `Dex ${effectiveDex} +${equippedDefenseBonus} éq.` : `Dex ${effectiveDex}`}
            />
          </div>
          <InitiativeButton dex={effectiveDex} />
        </div>
      </div>

      {/* ── Armes ───────────────────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-red-900/40 rounded-xl p-4">

        <SectionLabel>Corps à corps</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {MELEE_IDS.map((id) => {
            const skill = skillById(id)
            return skill ? (
              <CombatSkillCard
                key={id}
                skill={skill}
                defenseBonus={defenseBonus + equippedDefenseBonus}
                donBonus={skillBonuses[id] ?? 0}
              />
            ) : null
          })}
        </div>

        <SectionLabel>Distance</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {DISTANCE_IDS.map((id) => {
            const skill = skillById(id)
            return skill ? (
              <CombatSkillCard
                key={id}
                skill={skill}
                defenseBonus={defenseBonus + equippedDefenseBonus}
                donBonus={skillBonuses[id] ?? 0}
              />
            ) : null
          })}
        </div>
      </div>

      {/* ── Commandement & Appui ────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-orange-900/40 rounded-xl p-4">
        <SectionLabel>Commandement & Appui</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {TACTICAL_IDS.map((id) => {
            const skill = skillById(id)
            if (!skill) return null
            const style = CATEGORY_STYLE[skill.category]
            return (
              <CombatSkillCard
                key={id}
                skill={skill}
                defenseBonus={defenseBonus + equippedDefenseBonus}
                donBonus={skillBonuses[id] ?? 0}
                accentColor={style.lvl}
                barColor={style.bar}
              />
            )
          })}
        </div>
      </div>

      {/* ── Attaques Spéciales débloquées ───────────────────────────────── */}
      <AcquiredAttaques />

    </div>
  )
}

// ─── Panneau des attaques spéciales acquises ───────────────────────────────────

const TIER_BADGE: Record<TechniqueCategory, string> = {
  'Novice':        'bg-zinc-700 text-zinc-300',
  'Adepte':        'bg-blue-900/70 text-blue-300',
  'Professionnel': 'bg-purple-900/70 text-purple-300',
  'Maître':        'bg-orange-900/70 text-orange-300',
}

function AcquiredTechniqueCard({ t, peCosts }: {
  t: TechniqueDef
  peCosts: Record<string, number>
}) {
  const effectivePe = peCosts[t.id] ?? t.peCost
  const isAttaque = t.type === 'attaque'
  const borderCls = isAttaque ? 'border-red-900/40' : 'border-blue-900/40'
  const nameCls   = isAttaque ? 'text-red-300'      : 'text-blue-300'
  const headerBg  = isAttaque ? 'bg-red-950/20'     : 'bg-blue-950/20'

  return (
    <div className={`flex flex-col rounded-lg border overflow-hidden ${borderCls}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 px-2.5 py-2 ${headerBg}`}>
        <p className={`flex-1 text-xs font-bold leading-tight ${nameCls}`}>{t.name}</p>
        {effectivePe !== undefined && effectivePe > 0 && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded
                           bg-sky-950/60 border border-sky-800/50 text-sky-300">
            {effectivePe} PE
          </span>
        )}
        {t.fatigueCost && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded
                           bg-orange-950/60 border border-orange-800/50 text-orange-300">
            +{t.fatigueCost}f
          </span>
        )}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_BADGE[t.category]}`}>
          {t.category}
        </span>
        {t.url && (
          <a
            href={t.url}
            target="_blank"
            rel="noreferrer"
            title="Ouvrir dans Notion"
            className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700
                       text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
          >↗</a>
        )}
      </div>

      {/* ── Effets mécaniques ──────────────────────────────────── */}
      <div className="px-2.5 py-2 bg-[#111]">
        {t.effect ? (
          <p className="text-[10px] text-zinc-200 leading-relaxed whitespace-pre-line">{t.effect}</p>
        ) : (
          <p className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-line">{t.description}</p>
        )}
      </div>

      {/* ── Lore — toujours visible si les deux champs existent ── */}
      {t.effect && t.description && (
        <div className="px-2.5 py-2 bg-[#0d0d0d] border-t border-zinc-800/60">
          <p className="text-[10px] text-zinc-500 italic leading-relaxed">{t.description}</p>
        </div>
      )}
    </div>
  )
}

function AcquiredAttaques() {
  const { character } = useCharacterStore()
  const acquiredIds = character.techniquesAcquises ?? []
  const peCosts     = character.techniquePeCosts ?? {}

  const allTechs   = getCachedTechniquesData()?.techniques ?? TECHNIQUES
  const attaques   = allTechs.filter((t) => t.type === 'attaque'   && acquiredIds.includes(t.id))
  const techniques = allTechs.filter((t) => t.type === 'technique' && t.peCost !== undefined && acquiredIds.includes(t.id))

  if (attaques.length === 0 && techniques.length === 0) return null

  // Regrouper par famille
  function groupByFamily(list: typeof attaques) {
    const map: Record<string, typeof list> = {}
    for (const t of list) {
      if (!map[t.family]) map[t.family] = []
      map[t.family].push(t)
    }
    return map
  }

  return (
    <div className="space-y-3">

      {attaques.length > 0 && (
        <div className="bg-[#1a1a1a] border border-red-900/40 rounded-xl p-4">
          <h2 className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-3
                         border-b border-red-900/40 pb-1">
            ⚔ Attaques Spéciales
          </h2>
          <div className="space-y-3">
            {Object.entries(groupByFamily(attaques)).map(([family, techs]) => (
              <div key={family}>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">{family}</p>
                <div className="grid grid-cols-2 gap-2">
                  {techs.map((t) => <AcquiredTechniqueCard key={t.id} t={t} peCosts={peCosts} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {techniques.length > 0 && (
        <div className="bg-[#1a1a1a] border border-blue-900/40 rounded-xl p-4">
          <h2 className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3
                         border-b border-blue-900/40 pb-1">
            ◆ Techniques Actives
          </h2>
          <div className="space-y-3">
            {Object.entries(groupByFamily(techniques)).map(([family, techs]) => (
              <div key={family}>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">{family}</p>
                <div className="grid grid-cols-2 gap-2">
                  {techs.map((t) => <AcquiredTechniqueCard key={t.id} t={t} peCosts={peCosts} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
