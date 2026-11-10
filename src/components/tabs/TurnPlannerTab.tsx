import { useRef, useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { useItemsStore } from '../../store/itemsStore'
import { computeAllBonuses } from '../../engine/traits'
import { calcPeMax, calcPeRecovery, calcBM } from '../../engine/stats'
import { SKILLS } from '../../engine/skills'
import { getSkillBreakdown } from '../../engine/dons'
import { TECHNIQUES } from '../../engine/techniques'
import { getCachedTechniquesData } from '../../lib/syncTechniquesNotion'
import type { SyncedTechniqueDef } from '../../lib/notionConvertTechniques'
import { SPELLS, POWER_LEVELS, POWER_LABELS, SPELL_MASTERY_MOD, TYPE_MASTERY_MOD } from '../../engine/magic'
import type { MasteryLevel } from '../../engine/magic'
import type { AttackDef } from '../../engine/items'
import type { Character } from '../../engine/types'
import { normalizePlanner, simulateTurn } from '../../engine/turnPlanner'
import type {
  PlanActionKind,
  PlanActionTemplate,
  PlannedAction,
  PlanRoll,
  StepResult,
  TurnPlanState,
  TurnResult,
} from '../../engine/turnPlanner'

// ─── Styles ────────────────────────────────────────────────────────────────────

const KIND_STYLE: Record<PlanActionKind, string> = {
  attaque:   'border-red-800/70 text-red-300 bg-red-950/40',
  technique: 'border-blue-800/70 text-blue-300 bg-blue-950/40',
  speciale:  'border-purple-800/70 text-purple-300 bg-purple-950/40',
  sort:      'border-indigo-800/70 text-indigo-300 bg-indigo-950/40',
  deplacement: 'border-amber-800/70 text-amber-200 bg-amber-950/30',
  competence:  'border-teal-800/70 text-teal-200 bg-teal-950/40',
  perso:     'border-emerald-800/70 text-emerald-300 bg-emerald-950/40',
}

function newUid() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Actions disponibles ───────────────────────────────────────────────────────

/** Jet de compétence en combat : 1 PE */
const SKILL_ACTION_COST = 1
/** Compétences déjà couvertes ailleurs : attaques (étiquettes d'armes) et Flux Magiques (sorts) */
const ATTACK_SKILL_IDS = new Set(['hache', 'longue-masse', 'petite-masse', 'longue-lame', 'petite-lame', 'lance', 'main-nue', 'visee', 'flux-magiques'])

/** Se déplacer : 1 PE minimum, coût réglable sur chaque étiquette du plan */
const MOVE_ACTION: PlanActionTemplate = {
  key: 'base:move', kind: 'deplacement', label: '👣 Se déplacer',
  cost: 1, fatigue: 0, isAttack: false, corruption: 0, variableCost: true,
}

interface PaletteGroup {
  title:   string
  actions: PlanActionTemplate[]
}

function buildPalette(
  character: Character,
  items: ReturnType<typeof useItemsStore.getState>['items'],
  planner: TurnPlanState,
): PaletteGroup[] {
  const groups: PaletteGroup[] = [{ title: 'Mouvement', actions: [MOVE_ACTION] }]
  const skillBonuses = computeAllBonuses(character).skills

  // Armes (toutes celles de l'inventaire, comme l'onglet Combat)
  const weaponActions: PlanActionTemplate[] = []
  for (const item of character.inventory ?? []) {
    const def = items.find((d) => d.id === item.itemId)
    if (!def || def.category !== 'Arme') continue
    if (!(def.damage || def.combatSkillId || def.attacks?.length)) continue
    const attacks: AttackDef[] = def.attacks?.length
      ? def.attacks
      : [{ name: undefined, damage: def.damage, peUseCost: def.peUseCost, fatigueCost: def.fatigueCost }]
    // Mêmes jets que l'onglet Combat : attaque (/gr 1d20+niveau) et dégâts avec BM
    const skill = def.combatSkillId ? SKILLS.find((sk) => sk.id === def.combatSkillId) : undefined
    const lvl   = skill ? ((character.skills ?? {})[skill.id] ?? 0) + (skillBonuses[skill.id] ?? 0) : 0
    const bm    = calcBM(lvl)
    const dmg   = (d: string) => (bm > 0 ? `${d}+${bm}` : d)
    attacks.forEach((atk, i) => {
      const name  = `${def.name}${atk.name ? ` — ${atk.name}` : ''}`
      const rolls: PlanRoll[] = []
      if (skill)        rolls.push({ label: `Attaque (${skill.name} ${lvl})`, command: `/gr 1d20+${lvl} ${name}` })
      if (atk.damage)   rolls.push({ label: 'Dégâts', command: `/r ${dmg(atk.damage)}` })
      if (atk.damage5)  rolls.push({ label: 'Dégâts si +5', command: `/r ${dmg(atk.damage5)}`, optional: true })
      if (atk.damage10) rolls.push({ label: 'Dégâts si +10', command: `/r ${dmg(atk.damage10)}`, optional: true })
      weaponActions.push({
        key:        `atk:${item.id}:${i}`,
        kind:       'attaque',
        label:      `⚔ ${def.name}${atk.name ? ` — ${atk.name}` : ''}`,
        cost:       atk.peUseCost ?? 0,
        fatigue:    atk.fatigueCost ?? 0,
        isAttack:   true,
        corruption: 0,
        rolls,
      })
    })
  }
  if (weaponActions.length) groups.push({ title: 'Armes', actions: weaponActions })

  // Techniques et attaques spéciales acquises
  const acquired = character.techniquesAcquises ?? []
  const peCosts  = character.techniquePeCosts ?? {}
  const allTechs: SyncedTechniqueDef[] = getCachedTechniquesData()?.techniques ?? TECHNIQUES
  const techniques = allTechs
    .filter((t) => t.type === 'technique' && t.peCost !== undefined && acquired.includes(t.id))
    .map((t): PlanActionTemplate => ({
      key: `tech:${t.id}`, kind: 'technique', label: t.name,
      cost: peCosts[t.id] ?? t.peCost ?? 0, fatigue: t.fatigueCost ?? 0, isAttack: false, corruption: 0,
    }))
  if (techniques.length) groups.push({ title: 'Techniques', actions: techniques })

  const speciales = allTechs
    .filter((t) => t.type === 'attaque' && acquired.includes(t.id))
    .map((t): PlanActionTemplate => ({
      key: `tech:${t.id}`, kind: 'speciale', label: t.name,
      cost: peCosts[t.id] ?? t.peCost ?? 0, fatigue: t.fatigueCost ?? 0, isAttack: true, corruption: 0,
    }))
  if (speciales.length) groups.push({ title: 'Attaques spéciales', actions: speciales })

  // Compétences (1 PE) : médicales toujours proposées, les autres dès le niveau 1
  const skillActions = [...SKILLS]
    .filter((sk) => !ATTACK_SKILL_IDS.has(sk.id))
    .map((sk) => ({ sk, lvl: ((character.skills ?? {})[sk.id] ?? 0) + (skillBonuses[sk.id] ?? 0) }))
    .filter(({ sk, lvl }) => sk.category === 'Médical' || lvl > 0)
    .sort((a, b) => Number(b.sk.category === 'Médical') - Number(a.sk.category === 'Médical'))
    .map(({ sk, lvl }): PlanActionTemplate => ({
      key: `skill:${sk.id}`, kind: 'competence',
      label: `${sk.category === 'Médical' ? '✚' : '◆'} ${sk.name}`,
      cost: SKILL_ACTION_COST, fatigue: 0, isAttack: false, corruption: 0,
      rolls: [{ label: `${sk.name} (${lvl})`, command: `/gr 1d20+${lvl} ${sk.name}` }],
    }))
  if (skillActions.length) groups.push({ title: 'Compétences · 1 PE', actions: skillActions })

  // Sortilèges (une étiquette par puissance)
  const spellIds = character.sortilegesAcquis ?? []
  const fluxBase = (character.skills ?? {})['flux-magiques'] ?? 0
  const fluxLvl  = getSkillBreakdown(fluxBase, character.dons ?? [], 'flux-magiques', 'Spécialisé')
    .reduce((sum, src) => sum + src.value, 0)
  const spells = SPELLS.filter((s) => spellIds.includes(s.id)).flatMap((s) => {
    const masterySpell = (character.sortMastery ?? {})[s.id] as MasteryLevel | undefined
    const masteryType  = (character.sortTypeMastery ?? {})[s.type] as MasteryLevel | undefined
    const mod = fluxLvl
      + (masterySpell ? SPELL_MASTERY_MOD[masterySpell] : 0)
      + (masteryType  ? TYPE_MASTERY_MOD[masteryType]   : 0)
    return POWER_LEVELS.map((power): PlanActionTemplate => ({
      key: `sort:${s.id}:${power}`, kind: 'sort', label: `✦ ${s.name} · ${POWER_LABELS[power]}`,
      cost: s.powers[power].peCost, fatigue: 0, isAttack: false, corruption: s.powers[power].corruptionCost,
      rolls: [{
        label:   `Flux Magiques (${mod >= 0 ? '+' : ''}${mod})`,
        command: `/r 1d20+${mod} Maîtrise des Flux Magiques — ${s.name} (${POWER_LABELS[power]})`,
      }],
    }))
  })
  if (spells.length) groups.push({ title: 'Sortilèges', actions: spells })

  groups.push({
    title: 'Perso',
    actions: planner.customActions.map((c): PlanActionTemplate => ({
      key: c.key, kind: 'perso', label: c.label, cost: c.cost, fatigue: 0, isAttack: false, corruption: 0,
    })),
  })

  return groups
}

// ─── Étiquette ─────────────────────────────────────────────────────────────────

function CostChip({ action, step }: { action: PlanActionTemplate; step?: StepResult }) {
  const cost = step ? step.cost : action.cost
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 font-mono text-[9px] opacity-80">
      <span>{cost}PE</span>
      {step && step.fatigueExtra > 0 && (
        <span className="text-orange-400">({action.cost}+{step.fatigueExtra}f)</span>
      )}
      {action.fatigue > 0 && <span className="text-orange-400">+{action.fatigue}f</span>}
      {action.corruption > 0 && <span className="text-purple-400">+{action.corruption}c</span>}
    </span>
  )
}

function Tag({
  action, step, faded, stale, onPointerDown, onRemove, onCostChange,
}: {
  action:        PlanActionTemplate
  step?:         StepResult
  faded?:        boolean
  stale?:        boolean
  onPointerDown: (e: React.PointerEvent) => void
  onRemove?:     () => void
  /** Présent sur une étiquette du plan à coût réglable */
  onCostChange?: (cost: number) => void
}) {
  const bad  = step?.unaffordable
  const debt = step && !bad && step.peAfter < 0
  return (
    <div
      onPointerDown={onPointerDown}
      title={
        stale ? "Cette action n'est plus disponible sur la fiche"
        : bad ? `PE insuffisants : ${step.peBefore} PE pour un coût de ${step.cost}`
        : debt ? 'Les PE passent en négatif'
        : 'Glisser pour déplacer'
      }
      className={`group relative inline-flex flex-col items-start rounded-md border px-2 py-1
                  text-[10px] font-bold select-none touch-none cursor-grab active:cursor-grabbing
                  transition-opacity ${KIND_STYLE[action.kind]}
                  ${faded ? 'opacity-30' : ''} ${stale ? 'opacity-50 border-dashed' : ''}
                  ${bad ? '!border-red-500 ring-1 ring-red-500/60' : ''}
                  ${debt ? '!border-orange-500' : ''}`}
    >
      <span className="flex items-center whitespace-nowrap">
        {action.label}
        {onCostChange ? (
          <span className="ml-1.5 inline-flex items-center gap-0.5 font-mono text-[9px]">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onCostChange(action.cost - 1)}
              disabled={action.cost <= 1}
              className="w-3.5 h-3.5 rounded bg-black/30 hover:bg-black/50 flex items-center justify-center disabled:opacity-30"
              title="−1 PE"
            >−</button>
            <span className="min-w-[2.2em] text-center">{action.cost}PE</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onCostChange(action.cost + 1)}
              className="w-3.5 h-3.5 rounded bg-black/30 hover:bg-black/50 flex items-center justify-center"
              title="+1 PE"
            >+</button>
          </span>
        ) : (
          <CostChip action={action} step={step} />
        )}
        {onRemove && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="ml-1.5 -mr-0.5 w-3.5 h-3.5 rounded text-zinc-500 hover:text-red-400
                       hover:bg-red-950/60 flex items-center justify-center leading-none"
            title="Retirer"
          >×</button>
        )}
      </span>
      {step && (
        <span className={`text-[9px] font-mono font-normal ${
          bad ? 'text-red-400' : step.peAfter < 0 ? 'text-orange-400' : 'text-zinc-500'
        }`}>
          → {step.peAfter} PE
        </span>
      )}
    </div>
  )
}

// ─── Barre de PE découpée par action ──────────────────────────────────────────

const KIND_BAR: Record<PlanActionKind, string> = {
  attaque:   'bg-red-600',
  technique: 'bg-blue-600',
  speciale:  'bg-purple-600',
  sort:      'bg-indigo-500',
  deplacement: 'bg-amber-600',
  competence:  'bg-teal-600',
  perso:     'bg-emerald-600',
}

function PeSegmentBar({ actions, result, peMax }: {
  actions: PlanActionTemplate[]
  result:  TurnResult
  peMax:   number
}) {
  const scale = Math.max(peMax, result.peStart, 1)
  const pct   = (v: number) => `${(v / scale) * 100}%`
  let available = Math.max(0, result.peStart)

  return (
    <div className="space-y-1">
      <div className="relative flex h-5 rounded-md bg-[#262626] overflow-hidden">
        {result.steps.map((step, i) => {
          const w = Math.max(0, Math.min(step.cost, available))
          available -= w
          if (w <= 0) return null
          const a = actions[i]
          return (
            <div
              key={i}
              title={step.unaffordable
                ? `${a.label} : ${step.cost} PE — il ne reste que ${Math.max(0, step.peBefore)} PE`
                : `${a.label} : ${step.cost} PE`}
              className={`h-full border-r border-black/50 flex items-center justify-center
                          text-[9px] font-bold text-white/90 transition-all duration-300 ${KIND_BAR[a.kind]}`}
              style={{
                width: pct(w),
                // Action impayable : hachures rouges par-dessus la couleur de l'action
                ...(step.unaffordable && {
                  backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.55) 0 4px, rgba(239,68,68,0.9) 4px 8px)',
                }),
              }}
            >
              {w >= 1 ? (step.unaffordable ? `${w}/${step.cost}` : step.cost) : ''}
            </div>
          )
        })}
        {result.peEnd > 0 && (
          <div
            className="h-full bg-sky-400/90 flex items-center justify-center text-[9px] font-bold text-sky-950 transition-all duration-300"
            style={{ width: pct(result.peEnd) }}
            title={`Restant : ${result.peEnd} PE`}
          >
            {result.peEnd}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-zinc-600">
        <span>0</span>
        <span>max {peMax}</span>
      </div>
    </div>
  )
}

// ─── Drag & drop (pointer events : souris + tactile) ──────────────────────────

type DragSource =
  | { from: 'palette'; action: PlanActionTemplate }
  | { from: 'plan'; index: number; action: PlanActionTemplate }

type DropTarget = { index: number } | { remove: true } | null

interface DragState {
  source: DragSource
  x:      number
  y:      number
  target: DropTarget
}

function findDropTarget(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  const planEl = el.closest<HTMLElement>('[data-plan]')
  if (planEl) {
    const slots = Array.from(planEl.querySelectorAll<HTMLElement>('[data-slot]'))
    let index = slots.length
    for (let i = 0; i < slots.length; i++) {
      const r = slots[i].getBoundingClientRect()
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) { index = i; break }
    }
    return { index }
  }
  if (el.closest('[data-palette]')) return { remove: true }
  return null
}

// ─── Petite stat du résumé ────────────────────────────────────────────────────

function Stat({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
      <div className="font-mono text-lg font-bold leading-tight">{children}</div>
      {sub && <p className="text-[10px] text-zinc-500 font-mono">{sub}</p>}
    </div>
  )
}

// ─── Onglet ────────────────────────────────────────────────────────────────────

export function TurnPlannerTab() {
  const { character, updateField, combatMode, logAction, addFatigue, addCorruption } = useCharacterStore()
  const { items } = useItemsStore()

  const planner = normalizePlanner(character.turnPlan)
  const save = (next: TurnPlanState) => updateField('turnPlan', next)

  const donBonuses = computeAllBonuses(character)
  const peMax      = calcPeMax(character, donBonuses).total
  const recovery   = calcPeRecovery(character, donBonuses)
  const peCurrent  = character.peCurrent ?? 0
  const peStart    = planner.peStartOverride ?? peCurrent

  const palette = buildPalette(character, items, planner)
  const templateByKey = new Map(palette.flatMap((g) => g.actions).map((a) => [a.key, a]))

  // Les étiquettes du plan reprennent les valeurs actuelles de la fiche (coût modifié, etc.)
  const resolved = planner.actions.map((a) => {
    const tpl = templateByKey.get(a.key)
    const merged = tpl ? { ...tpl, uid: a.uid, ...(tpl.variableCost && { cost: Math.max(1, a.cost) }) } : a
    return { action: merged as PlannedAction, stale: !tpl }
  })
  const result = simulateTurn(resolved.map((r) => r.action), peStart, peMax, recovery)
  const blocked = result.steps.some((s) => s.unaffordable)

  // ── Résolution du tour ──
  // Gardée hors du composant : survit aux changements d'onglet (pas au rechargement)
  const [resolution, setResolutionState] = useState<Resolution | null>(() => lastResolution)
  const setResolution = (r: Resolution | null) => { lastResolution = r; setResolutionState(r) }

  function resolveTurn() {
    if (resolved.length === 0 || blocked) return
    const store = useCharacterStore.getState()
    const snapshot: Resolution['snapshot'] = {
      peCurrent:            store.character.peCurrent ?? 0,
      corruption:           store.character.corruption ?? 0,
      corruptionWeeklyUsed: store.character.corruptionWeeklyUsed ?? 0,
      turnPlan:             planner,
      combatLog:            store.combatLog,
      combatFatigue:        store.combatFatigue,
    }
    const entries = resolved.map(({ action }, k) => ({ action, step: result.steps[k] }))

    // Les coûts s'appliquent aux PE réels de la fiche (même si le début du tour a été ajusté)
    updateField('peCurrent', snapshot.peCurrent - result.spent)
    if (result.corruption > 0) addCorruption(result.corruption)
    if (combatMode) {
      entries.forEach(({ action, step }) => { if (step.cost > 0) logAction(action.label, step.cost) })
      if (result.fatigue > 0) addFatigue(result.fatigue)
    }
    save({ ...planner, actions: [], peStartOverride: null })

    setResolution({
      entries,
      spent:      result.spent,
      peBefore:   snapshot.peCurrent,
      peAfter:    snapshot.peCurrent - result.spent,
      corruption: result.corruption,
      snapshot,
    })
  }

  function undoResolution() {
    if (!resolution) return
    const { snapshot } = resolution
    updateField('peCurrent', snapshot.peCurrent)
    updateField('corruption', snapshot.corruption)
    updateField('corruptionWeeklyUsed', snapshot.corruptionWeeklyUsed)
    updateField('turnPlan', snapshot.turnPlan)
    useCharacterStore.setState({ combatLog: snapshot.combatLog, combatFatigue: snapshot.combatFatigue })
    setResolution(null)
  }

  // ── Drag state ──
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef    = useRef<DragState | null>(null)
  const pendingRef = useRef<{ source: DragSource; x0: number; y0: number } | null>(null)
  const plannerRef = useRef(planner)
  plannerRef.current = planner

  function append(action: PlanActionTemplate) {
    const p = plannerRef.current
    save({ ...p, actions: [...p.actions, { ...action, uid: newUid() }] })
  }

  function applyDrop(source: DragSource, target: DropTarget) {
    if (!target) return
    const p = plannerRef.current
    const actions = [...p.actions]
    if ('remove' in target) {
      if (source.from === 'plan') {
        actions.splice(source.index, 1)
        save({ ...p, actions })
      }
      return
    }
    let index = target.index
    let item: PlannedAction
    if (source.from === 'plan') {
      ;[item] = actions.splice(source.index, 1)
      if (source.index < index) index--
    } else {
      item = { ...source.action, uid: newUid() }
    }
    actions.splice(index, 0, item)
    save({ ...p, actions })
  }

  function stopListening() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
  }

  function onMove(e: PointerEvent) {
    const p = pendingRef.current
    if (!p) return
    if (!dragRef.current && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 5) return
    e.preventDefault()
    const next: DragState = { source: p.source, x: e.clientX, y: e.clientY, target: findDropTarget(e.clientX, e.clientY) }
    dragRef.current = next
    setDrag(next)
  }

  function onUp() {
    stopListening()
    const p = pendingRef.current
    const d = dragRef.current
    pendingRef.current = null
    dragRef.current = null
    setDrag(null)
    if (!p) return
    if (d) applyDrop(d.source, d.target)
    else if (p.source.from === 'palette') append(p.source.action)  // simple clic → ajout en fin de tour
  }

  function onCancel() {
    stopListening()
    pendingRef.current = null
    dragRef.current = null
    setDrag(null)
  }

  function startPointer(e: React.PointerEvent, source: DragSource) {
    if (e.button !== 0) return
    pendingRef.current = { source, x0: e.clientX, y0: e.clientY }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
  }

  function setActionCost(index: number, cost: number) {
    save({ ...planner, actions: planner.actions.map((a, k) => (k === index ? { ...a, cost: Math.max(1, cost) } : a)) })
  }

  function removeAction(index: number) {
    save({ ...planner, actions: planner.actions.filter((_, k) => k !== index) })
  }

  function setPeStart(v: number | null) {
    save({ ...planner, peStartOverride: v === null ? null : Math.min(peMax, v) })
  }

  // ── Actions perso ──
  const [customLabel, setCustomLabel] = useState('')
  const [customCost,  setCustomCost]  = useState('1')
  function addCustom() {
    const label = customLabel.trim()
    if (!label) return
    const cost = Math.max(0, parseInt(customCost, 10) || 0)
    save({ ...planner, customActions: [...planner.customActions, { key: `perso:${newUid()}`, label, cost }] })
    setCustomLabel('')
    setCustomCost('1')
  }
  function removeCustom(key: string) {
    save({ ...planner, customActions: planner.customActions.filter((c) => c.key !== key) })
  }

  const target   = drag?.target ?? null
  const isTarget = !!target && 'index' in target

  return (
    <div className="space-y-3">

      {/* ── Prochain tour ─────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-700/60 pb-1">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Prochain tour</h2>
          <button
            onClick={() => save({ ...planner, actions: [] })}
            disabled={planner.actions.length === 0}
            className="ml-auto text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-500
                       hover:text-red-400 hover:border-red-900 disabled:opacity-30 transition-colors"
          >Vider</button>
          <button
            onClick={resolveTurn}
            disabled={planner.actions.length === 0 || blocked}
            title={blocked ? 'PE insuffisants pour une des actions' : 'Dépenser les PE, appliquer la corruption et afficher les jets à faire'}
            className="ml-2 text-[11px] px-3 py-1 rounded-md border border-orange-600 bg-orange-500 text-black font-bold
                       hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >⚔ Résoudre le tour</button>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Début du tour"
            sub={planner.peStartOverride === null
              ? 'PE actuels'
              : <button onClick={() => setPeStart(null)} className="hover:text-sky-300" title="Revenir aux PE actuels de la fiche">↺ PE actuels ({peCurrent})</button>}
          >
            <span className="inline-flex items-center gap-1.5">
              <button
                onClick={() => setPeStart(peStart - 1)}
                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center"
                title="Moins de PE au début du tour (ex. défenses avant ton tour)"
              >−</button>
              <span className={peStart < 0 ? 'text-red-400' : 'text-sky-300'}>{peStart}</span>
              <button
                onClick={() => setPeStart(peStart + 1)}
                disabled={peStart >= peMax}
                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center disabled:opacity-30"
              >+</button>
              <span className="text-xs text-zinc-500">PE</span>
            </span>
          </Stat>
          <Stat
            label="Coût total"
            sub={[
              result.fatigue > 0 ? `fatigue ${result.fatigue}` : null,
              result.corruption > 0 ? `corruption +${result.corruption}` : null,
            ].filter(Boolean).join(' · ') || `${planner.actions.length} action${planner.actions.length > 1 ? 's' : ''}`}
          >
            <span className="text-orange-300">{result.spent}</span> <span className="text-xs text-zinc-500">PE</span>
          </Stat>
          <Stat
            label="Fin du tour"
            sub={blocked ? <span className="text-red-400">PE insuffisants</span> : result.peEnd < 0 ? <span className="text-orange-400">PE négatifs</span> : undefined}
          >
            <span className={result.peEnd < 0 ? 'text-red-400' : 'text-sky-300'}>{result.peEnd}</span> <span className="text-xs text-zinc-500">PE</span>
          </Stat>
          <Stat
            label="Tour suivant"
            sub={result.peEnd < 0
              ? <span className="text-orange-400">récup. ÷2 (+{Math.floor(recovery / 2)})</span>
              : result.peEnd + recovery > peMax ? `+${recovery}, plafonné au max` : `+${recovery} de récup.`}
          >
            <span className="text-sky-300">{result.peNext}</span> <span className="text-xs text-zinc-500">PE</span>
          </Stat>
        </div>

        <PeSegmentBar actions={resolved.map((r) => r.action)} result={result} peMax={peMax} />

        {/* Zone de dépôt : les actions du tour, dans l'ordre */}
        <div
          data-plan
          className={`min-h-[56px] rounded-lg border border-dashed p-2 flex flex-wrap items-start gap-1.5
                      transition-colors ${isTarget ? 'border-amber-500/80 bg-amber-950/10' : 'border-zinc-700/70'}`}
        >
          {resolved.length === 0 && !isTarget && (
            <span className="text-[11px] text-zinc-600 italic self-center px-1">
              Glisse (ou clique) des actions ci-dessous pour préparer ton tour
            </span>
          )}
          {resolved.map(({ action, stale }, k) => {
            const isDragged = drag?.source.from === 'plan' && drag.source.index === k
            return (
              <div key={action.uid} className="contents">
                {isTarget && target.index === k && <DropMarker />}
                <div data-slot>
                  <Tag
                    action={action}
                    step={result.steps[k]}
                    stale={stale}
                    faded={isDragged}
                    onPointerDown={(e) => startPointer(e, { from: 'plan', index: k, action })}
                    onRemove={() => removeAction(k)}
                    onCostChange={action.variableCost ? (v) => setActionCost(k, v) : undefined}
                  />
                </div>
              </div>
            )
          })}
          {isTarget && target.index === resolved.length && <DropMarker />}
        </div>
      </div>

      {resolution && (
        <ResolutionPanel resolution={resolution} onUndo={undoResolution} onClose={() => setResolution(null)} />
      )}

      {/* ── Palette ─────────────────────────────────── */}
      <div
        data-palette
        className={`bg-[#1a1a1a] border rounded-xl p-4 space-y-3 transition-colors ${
          target && 'remove' in target && drag?.source.from === 'plan'
            ? 'border-red-700 bg-red-950/20'
            : 'border-zinc-800'
        }`}
      >
        <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-700/60 pb-1">
          Actions disponibles
          {drag?.source.from === 'plan'
            ? <span className="ml-2 normal-case text-red-400">déposer ici pour retirer</span>
            : <span className="ml-2 normal-case font-normal text-zinc-600">glisser dans le tour · clic = ajouter à la fin</span>}
        </h2>
        {palette.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{group.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.actions.map((a) => (
                <Tag
                  key={a.key}
                  action={a}
                  onPointerDown={(e) => startPointer(e, { from: 'palette', action: a })}
                  onRemove={a.kind === 'perso' ? () => removeCustom(a.key) : undefined}
                />
              ))}
            </div>
            {group.title === 'Perso' && (
              <form
                onSubmit={(e) => { e.preventDefault(); addCustom() }}
                className="flex items-center gap-1.5 max-w-sm"
              >
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Action perso…"
                  className="flex-1 min-w-0 bg-[#0f0f0f] border border-zinc-700 rounded px-2 py-1 text-[11px]
                             text-zinc-200 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="number"
                  min={0}
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  title="Coût en PE"
                  className="w-11 text-center bg-[#0f0f0f] border border-zinc-700 rounded py-1 text-[11px] font-mono
                             text-sky-300 focus:outline-none focus:border-emerald-600
                             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-zinc-500">PE</span>
                <button
                  type="submit"
                  className="px-2 py-1 rounded border border-emerald-800/70 text-emerald-300 text-[10px] font-bold
                             hover:bg-emerald-950/60 transition-colors"
                >+</button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Fantôme de l'étiquette en cours de déplacement */}
      {drag && (
        <div
          className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 rotate-2 drop-shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          <Tag action={drag.source.action} onPointerDown={() => {}} />
        </div>
      )}
    </div>
  )
}

// ─── Résolution : jets à copier ───────────────────────────────────────────────

let lastResolution: Resolution | null = null

interface Resolution {
  entries:    { action: PlannedAction; step: StepResult }[]
  spent:      number
  peBefore:   number
  peAfter:    number
  corruption: number
  snapshot: {
    peCurrent:            number
    corruption:           number
    corruptionWeeklyUsed: number
    turnPlan:             TurnPlanState
    combatLog:            ReturnType<typeof useCharacterStore.getState>['combatLog']
    combatFatigue:        number
  }
}

function CopyButton({ text, label = 'Copier', primary }: { text: string; label?: string; primary?: boolean }) {
  const [done, setDone] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch { return }
    setDone(true)
    setTimeout(() => setDone(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-bold transition-colors ${
        done ? 'border-emerald-700 bg-emerald-900/40 text-emerald-300'
        : primary ? 'border-orange-600 text-orange-300 hover:bg-orange-950/50'
        : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
      }`}
    >{done ? '✓ Copié' : label}</button>
  )
}

function ResolutionPanel({ resolution, onUndo, onClose }: {
  resolution: Resolution
  onUndo:     () => void
  onClose:    () => void
}) {
  const allCommands = resolution.entries
    .flatMap(({ action }) => (action.rolls ?? []).filter((r) => !r.optional).map((r) => r.command))
  return (
    <div className="bg-[#1a1a1a] border border-orange-900/60 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap border-b border-orange-900/40 pb-1">
        <h2 className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">Tour résolu</h2>
        <span className="font-mono text-[11px] text-zinc-400">
          −{resolution.spent} PE ({resolution.peBefore} → <span className={resolution.peAfter < 0 ? 'text-red-400' : 'text-sky-300'}>{resolution.peAfter}</span>)
          {resolution.corruption > 0 && <span className="text-purple-400"> · corruption +{resolution.corruption}</span>}
        </span>
        <div className="ml-auto flex gap-1.5">
          {allCommands.length > 0 && <CopyButton text={allCommands.join('\n')} label={`📋 Tout copier (${allCommands.length})`} primary />}
          <button
            onClick={onUndo}
            className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-900 transition-colors"
            title="Rendre les PE et la corruption, et remettre le plan"
          >↶ Annuler</button>
          <button
            onClick={onClose}
            className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >Fermer</button>
        </div>
      </div>

      <ol className="space-y-2">
        {resolution.entries.map(({ action, step }, i) => (
          <li key={action.uid} className="space-y-1">
            <div className="flex items-baseline gap-2 text-[11px]">
              <span className="font-mono text-zinc-600 w-4 shrink-0">{i + 1}.</span>
              <span className="font-bold text-zinc-200">{action.label}</span>
              <span className="font-mono text-[10px] text-zinc-500">
                {step.cost} PE{step.fatigueExtra > 0 && ` (dont ${step.fatigueExtra} de fatigue)`}
                {action.corruption > 0 && <span className="text-purple-400"> · +{action.corruption} corruption</span>}
              </span>
            </div>
            {(action.rolls ?? []).length === 0 ? (
              <p className="pl-6 text-[10px] text-zinc-600 italic">Pas de jet</p>
            ) : (
              <div className="pl-6 space-y-1">
                {(action.rolls ?? []).map((roll) => (
                  <div key={roll.command} className={`flex items-center gap-2 ${roll.optional ? 'opacity-60' : ''}`}>
                    <span className="text-[10px] text-zinc-500 w-36 shrink-0 truncate" title={roll.label}>{roll.label}</span>
                    <code className="flex-1 min-w-0 truncate font-mono text-[11px] text-orange-200 bg-black/40 rounded px-2 py-0.5" title={roll.command}>
                      {roll.command}
                    </code>
                    <CopyButton text={roll.command} />
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function DropMarker() {
  return (
    <span className="relative w-0 self-stretch -mr-1.5" aria-hidden>
      <span className="absolute -left-[3px] top-0 bottom-0 w-0.5 rounded bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
    </span>
  )
}
