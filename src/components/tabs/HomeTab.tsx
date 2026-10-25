import { useState, useRef } from 'react'
import { RestModal }   from '../ui/RestModal'
import { TravelModal } from '../ui/TravelModal'
import { DeathModal }  from '../ui/DeathModal'
import { NotesPanel }  from '../ui/NotesPanel'
import { useCharacterStore } from '../../store/characterStore'
import { StatBar } from '../ui/StatBar'
import {
  calcHpMax,
  calcFvMax,
  calcEncombrementMax,
  calcInventoryPassiveBonuses,
  getBarColor,
  getStressThresholdLabel,
  getFvEffectLabel,
  getEncombrementEffectLabel,
} from '../../engine/stats'
import type { Wound, WoundSeverity, Trait } from '../../engine/types'
import { ITEMS_ALL as ITEMS_LIST } from '../../engine/items-merged'
import { useItemsStore } from '../../store/itemsStore'
import { EquipmentPanel } from './InventoryTab'
import { DONS_LIST, getSkillBreakdown } from '../../engine/dons'
import { TRAITS_LIST, computeAllBonuses } from '../../engine/traits'
import type { TraitDef, TraitType } from '../../engine/traits'
import { useSlotTooltip } from '../ui/BreakdownPopover'

const SEVERITY_ICON: Record<WoundSeverity, string> = {
  légère: '●',
  grave: '▲',
  critique: '◆',
}

const SEVERITY_COLOR: Record<WoundSeverity, string> = {
  légère: 'text-yellow-400',
  grave: 'text-orange-500',
  critique: 'text-red-500',
}

const SEVERITY_OPTIONS: WoundSeverity[] = ['légère', 'grave', 'critique']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3
                   border-b border-zinc-700/60 pb-1">
      {children}
    </h2>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
      {children}
    </div>
  )
}

function WoundRow({ wound }: { wound: Wound }) {
  const { removeWound, toggleWoundTreated, updateWoundDescription, updateWoundHpCost } =
    useCharacterStore()

  const [editingDesc, setEditingDesc] = useState(false)
  const [draftDesc,   setDraftDesc]   = useState(wound.description)
  const [draftCost,   setDraftCost]   = useState(String(wound.hpCost))

  // Sync draft si la valeur change depuis l'extérieur
  const prevCost = useRef(wound.hpCost)
  if (prevCost.current !== wound.hpCost) {
    prevCost.current = wound.hpCost
    setDraftCost(String(wound.hpCost))
  }

  function commitDesc() {
    updateWoundDescription(wound.id, draftDesc.trim() || wound.description)
    setEditingDesc(false)
  }

  function commitCost() {
    const v = parseInt(draftCost, 10)
    const cost = isNaN(v) || v < 1 ? 1 : v
    setDraftCost(String(cost))
    updateWoundHpCost(wound.id, cost)
  }

  return (
    <li className="flex items-center gap-2 py-2 border-b border-zinc-800/60 last:border-0">
      {/* Icône sévérité */}
      <span className={`text-xs shrink-0 ${SEVERITY_COLOR[wound.severity]}`}>
        {SEVERITY_ICON[wound.severity]}
      </span>

      {/* Description (cliquable pour éditer) */}
      {editingDesc ? (
        <input
          autoFocus
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onBlur={commitDesc}
          onKeyDown={(e) => { if (e.key === 'Enter') commitDesc() }}
          className="flex-1 bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-0.5
                     text-xs text-white focus:outline-none focus:border-orange-500"
        />
      ) : (
        <button
          onClick={() => { setDraftDesc(wound.description); setEditingDesc(true) }}
          className="flex-1 text-left text-xs text-zinc-200 hover:text-white truncate"
          title="Cliquer pour modifier"
        >
          {wound.description}
        </button>
      )}

      {/* Coût PV — draft local pour permettre l'édition libre */}
      <div className="flex items-center gap-1 shrink-0" title="PV retirés par cette blessure">
        <span className="text-[10px] text-zinc-600">−</span>
        <input
          type="number"
          min={1}
          value={draftCost}
          onChange={(e) => setDraftCost(e.target.value)}
          onBlur={commitCost}
          onKeyDown={(e) => { if (e.key === 'Enter') commitCost() }}
          className="w-8 text-center bg-[#0f0f0f] border border-zinc-700 rounded
                     text-xs text-red-400 font-mono py-0.5 focus:outline-none focus:border-red-600
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          title="PV retirés"
        />
        <span className="text-[10px] text-zinc-600">PV</span>
      </div>

      {/* Toggle soignée */}
      <button
        onClick={() => toggleWoundTreated(wound.id)}
        className={`shrink-0 text-[10px] px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
          wound.treated
            ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/30'
            : 'border-orange-800 text-orange-400 hover:bg-orange-900/30'
        }`}
      >
        {wound.treated ? '✓ Soignée' : '✗ Non soignée'}
      </button>

      {/* Supprimer */}
      <button
        onClick={() => removeWound(wound.id)}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded
                   text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
        aria-label="Supprimer"
      >
        ×
      </button>
    </li>
  )
}

const WOUND_PRESETS: Record<WoundSeverity, string[]> = {
  légère:   ['Coupure', 'Écorchure', 'Écchymose', 'Contusion', 'Brûlure légère', 'Entorse légère'],
  grave:    ['Fracture', 'Plaie profonde', 'Lacération', 'Brûlure grave', 'Entorse grave', 'Déchirure musculaire'],
  critique: ['Fracture ouverte', 'Hémorragie', 'Perforation', 'Traumatisme crânien', 'Brûlure étendue'],
}

function AddWoundForm() {
  const { addWound } = useCharacterStore()
  const [open, setOpen] = useState(false)
  const [severity, setSeverity] = useState<WoundSeverity>('légère')
  const [description, setDescription] = useState('')
  const [hpCost, setHpCost] = useState(1)

  function submit() {
    if (!description.trim()) return
    addWound(severity, description.trim(), hpCost)
    setDescription('')
    setHpCost(1)
    setSeverity('légère')
    setOpen(false)
  }

  function close() {
    setOpen(false)
    setDescription('')
    setHpCost(1)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter une blessure
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {/* Ligne sévérité + coût PV */}
      <div className="flex gap-2 items-center">
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value as WoundSeverity); setDescription('') }}
          className="bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-1 text-xs
                     text-zinc-200 focus:outline-none focus:border-orange-500 shrink-0"
        >
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <span className="text-[10px] text-zinc-500">−</span>
          <input
            type="number"
            min={1}
            value={hpCost}
            onChange={(e) => setHpCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-10 text-center bg-[#0f0f0f] border border-zinc-600 rounded px-1 py-1
                       text-xs text-red-400 font-mono focus:outline-none focus:border-red-600
                       [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            title="PV retirés"
          />
          <span className="text-[10px] text-zinc-500">PV</span>
        </div>
      </div>

      {/* Chips pré-faits */}
      <div className="flex flex-wrap gap-1">
        {WOUND_PRESETS[severity].map((preset) => (
          <button
            key={preset}
            onClick={() => setDescription(preset)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
              description === preset
                ? 'border-orange-600 bg-orange-900/30 text-orange-300'
                : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Description libre */}
      <input
        autoFocus
        placeholder="Description personnalisée…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') close() }}
        className="w-full bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-1 text-xs
                   text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
      />

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!description.trim()}
          className="flex-1 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40
                     text-black text-xs font-bold rounded transition-colors"
        >
          Ajouter
        </button>
        <button
          onClick={close}
          className="px-3 py-1 text-zinc-500 hover:text-zinc-200 text-xs border
                     border-zinc-700 rounded transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── Traits ───────────────────────────────────────────────────────────────────

const TRAIT_TYPE_BADGE: Record<TraitType, string> = {
  mauvais: 'border-orange-800/60 text-orange-400 bg-orange-900/20',
  neutre:  'border-zinc-700    text-zinc-500   bg-zinc-800/30',
  bon:     'border-emerald-800/60 text-emerald-400 bg-emerald-900/20',
}

function TraitPointsBadge({ trait }: { trait: TraitDef }) {
  const sign = trait.points > 0 ? '+' : ''
  return (
    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-mono whitespace-nowrap ${TRAIT_TYPE_BADGE[trait.type]}`}>
      {sign}{trait.points} pts
    </span>
  )
}

function TraitRow({ trait }: { trait: Trait }) {
  const { removeTrait } = useCharacterStore()
  return (
    <li className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-200">{trait.title}</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{trait.effect}</p>
      </div>
      <button
        onClick={() => removeTrait(trait.id)}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded mt-0.5
                   text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
        aria-label="Supprimer"
      >
        ×
      </button>
    </li>
  )
}

function AddTraitForm() {
  const { addTrait } = useCharacterStore()
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)

  const suggestions = TRAITS_LIST
    .filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  function pick(t: TraitDef) {
    addTrait(t.name, t.effect)
    setQuery('')
    setShowDrop(false)
  }

  return (
    <div className="relative mb-3">
      <div className="relative">
        <input
          placeholder="Rechercher un trait…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDrop(true) }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); setShowDrop(false) } }}
          className="w-full bg-[#0f0f0f] border border-zinc-700 rounded px-2 py-1 pr-7 text-xs
                     text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
        />
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setQuery(''); setShowDrop(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >✕</button>
        )}
      </div>
      {showDrop && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111] border border-zinc-700
                        rounded-lg overflow-hidden shadow-xl max-h-56 overflow-y-auto">
          {suggestions.map(t => (
            <button
              key={t.id}
              onMouseDown={() => pick(t)}
              className="w-full text-left px-2.5 py-2 hover:bg-zinc-800/60 transition-colors
                         border-b border-zinc-800/60 last:border-0"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-zinc-200 font-medium flex-1 truncate">{t.name}</span>
                <TraitPointsBadge trait={t} />
              </div>
              <p className="text-[10px] text-zinc-500 truncate">{t.effect}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Traits de Caractère ──────────────────────────────────────────────────────

function TraitCaractereRow({ trait }: { trait: Trait }) {
  const { removeTraitCaractere } = useCharacterStore()
  return (
    <li className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-200">{trait.title}</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{trait.effect}</p>
      </div>
      <button
        onClick={() => removeTraitCaractere(trait.id)}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded mt-0.5
                   text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
        aria-label="Supprimer"
      >
        ×
      </button>
    </li>
  )
}

function AddTraitCaractereForm() {
  const { addTraitCaractere } = useCharacterStore()
  const [open, setOpen]     = useState(false)
  const [title, setTitle]   = useState('')
  const [notes, setNotes]   = useState('')

  function submit() {
    if (!title.trim()) return
    addTraitCaractere(title.trim(), notes.trim())
    setTitle('')
    setNotes('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="mt-2 w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                 border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
    >
      + Ajouter un trait de caractère
    </button>
  )

  return (
    <div className="mt-2 space-y-2">
      <input
        autoFocus
        placeholder="Nom du trait…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        className="w-full bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-1 text-xs
                   text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
      />
      <textarea
        placeholder="Notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-1 text-xs
                   text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="flex-1 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40
                     text-black text-xs font-bold rounded transition-colors"
        >
          Ajouter
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1 text-zinc-500 hover:text-zinc-200 text-xs border
                     border-zinc-700 rounded transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── Dons ─────────────────────────────────────────────────────────────────────

function DonRow({ donId }: { donId: string }) {
  const { removeDon } = useCharacterStore()
  const don = DONS_LIST.find((d) => d.id === donId)
  if (!don) return null
  return (
    <li className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-200">{don.name}</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{don.effect}</p>
      </div>
      <button
        onClick={() => removeDon(donId)}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded mt-0.5
                   text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
        aria-label="Supprimer"
      >
        ×
      </button>
    </li>
  )
}

function AddDonForm() {
  const { character, addDon } = useCharacterStore()
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)

  const acquired = character.dons ?? []
  const suggestions = DONS_LIST
    .filter(d => !acquired.includes(d.id) && d.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  function pick(id: string) {
    addDon(id)
    setQuery('')
    setShowDrop(false)
  }

  return (
    <div className="relative mb-3">
      <div className="relative">
        <input
          placeholder="Rechercher un don…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDrop(true) }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); setShowDrop(false) } }}
          className="w-full bg-[#0f0f0f] border border-zinc-700 rounded px-2 py-1 pr-7 text-xs
                     text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
        />
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setQuery(''); setShowDrop(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >✕</button>
        )}
      </div>
      {showDrop && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111] border border-zinc-700
                        rounded-lg overflow-hidden shadow-xl max-h-56 overflow-y-auto">
          {suggestions.map(d => (
            <button
              key={d.id}
              onMouseDown={() => pick(d.id)}
              className="w-full text-left px-2.5 py-2 hover:bg-zinc-800/60 transition-colors
                         border-b border-zinc-800/60 last:border-0"
            >
              <p className="text-xs text-zinc-200 font-medium">{d.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{d.effect}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compteur d'objets (moyen / grand) ────────────────────────────────────────

function ItemSlotCounter({
  label,
  current,
  max,
  maxSources,
  inventoryItems,
  onCurrentChange,
  onMaxChange,
  readOnly = false,
}: {
  label: string
  current: number
  max: number
  maxSources: { label: string; value: number }[]
  inventoryItems: string[]
  onCurrentChange: (v: number) => void
  onMaxChange: (v: number) => void
  readOnly?: boolean
}) {
  const [editingMax, setEditingMax] = useState(false)
  const [draftMax, setDraftMax]     = useState(String(max))
  const { handlers, tooltip } = useSlotTooltip(label, maxSources, max, inventoryItems)

  function commitMax() {
    const v = parseInt(draftMax, 10)
    const clamped = isNaN(v) || v < 0 ? 0 : v
    setDraftMax(String(clamped))
    onMaxChange(clamped)
    setEditingMax(false)
  }

  const full = current >= max && max > 0

  return (
    <div
      {...handlers}
      className="relative flex items-center gap-2 py-1.5 border-b border-zinc-800/60 last:border-0"
    >
      {tooltip}
      <span className="flex-1 text-[11px] text-zinc-400 truncate">{label}</span>

      {/* Boutons +/− seulement si non readOnly */}
      {!readOnly && (
        <button
          onClick={() => onCurrentChange(Math.max(0, current - 1))}
          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                     text-xs flex items-center justify-center transition-colors shrink-0"
        >−</button>
      )}

      {/* Compteur courant / max */}
      <span className={`font-mono text-sm font-bold w-8 text-center shrink-0 ${full ? 'text-orange-400' : 'text-zinc-200'}`}>
        {current}/{max}
      </span>

      {/* Bouton + */}
      {!readOnly && (
        <button
          onClick={() => onCurrentChange(Math.min(max, current + 1))}
          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                     text-xs flex items-center justify-center transition-colors shrink-0"
        >+</button>
      )}

      {/* Max éditable */}
      {editingMax ? (
        <input
          autoFocus
          type="number"
          min={0}
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={commitMax}
          onKeyDown={(e) => { if (e.key === 'Enter') commitMax(); if (e.key === 'Escape') setEditingMax(false) }}
          className="w-8 text-center bg-[#0f0f0f] border border-orange-500 rounded
                     text-xs text-zinc-200 font-mono py-0.5 focus:outline-none
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none shrink-0"
        />
      ) : (
        <button
          onClick={() => { setDraftMax(String(max)); setEditingMax(true) }}
          title="Modifier le max"
          className="w-8 text-center text-[10px] text-zinc-600 hover:text-orange-400
                     border border-zinc-800 hover:border-orange-600 rounded py-0.5
                     font-mono transition-colors shrink-0"
        >
          /{max}
        </button>
      )}
    </div>
  )
}

// ─── Bouton Repos ─────────────────────────────────────────────────────────────

function ReposLauncher({ onOpen }: { onOpen: () => void }) {
  const { character } = useCharacterStore()
  const untreated = character.wounds.filter((w) => !w.treated).length
  const critical  = character.wounds.filter((w) => w.severity === 'critique').length

  return (
    <button
      onClick={onOpen}
      className="w-full group relative overflow-hidden rounded-xl border border-zinc-700
                 bg-[#141414] hover:border-orange-600/60 hover:bg-[#1c1c1c]
                 transition-all duration-200 px-5 py-4 text-left"
    >
      {/* Fond lumineux subtil au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/0 via-orange-900/5 to-orange-900/0
                      opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-center gap-4">
        {/* Icône */}
        <div className="w-12 h-12 rounded-xl bg-[#0f0f0f] border border-zinc-800
                        flex items-center justify-center text-2xl shrink-0
                        group-hover:border-orange-800 transition-colors">
          🌙
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
            Résoudre le Repos
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Choisir le Niveau de Repos · résoudre blessures · appliquer aggravations
          </p>
        </div>

        {/* Badges blessures */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {character.wounds.length === 0 ? (
            <span className="text-[10px] text-zinc-600 italic">Aucune blessure</span>
          ) : (
            <>
              <span className="text-[10px] text-zinc-400">
                {character.wounds.length} blessure{character.wounds.length > 1 ? 's' : ''}
              </span>
              {untreated > 0 && (
                <span className="text-[10px] text-orange-400 font-semibold">
                  {untreated} non soignée{untreated > 1 ? 's' : ''}
                </span>
              )}
              {critical > 0 && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {critical} critique{critical > 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </div>

        {/* Flèche */}
        <span className="text-zinc-600 group-hover:text-orange-500 transition-colors text-sm shrink-0">
          →
        </span>
      </div>
    </button>
  )
}

// ─── Bouton Voyage ─────────────────────────────────────────────────────────────

function TravelLauncher({ onOpen }: { onOpen: () => void }) {
  const { character } = useCharacterStore()
  const donBonuses  = computeAllBonuses(character)
  const effectiveCon = character.constitution + (donBonuses.characteristics?.constitution ?? 0)
  const halfSeuil   = Math.ceil(effectiveCon / 2)
  const isEpuise    = character.fv >= effectiveCon
  const isDemiSeuil = character.fv >= halfSeuil && !isEpuise

  return (
    <button
      onClick={onOpen}
      className="w-full group relative overflow-hidden rounded-xl border border-zinc-700
                 bg-[#141414] hover:border-orange-600/60 hover:bg-[#1c1c1c]
                 transition-all duration-200 px-5 py-4 text-left"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/0 via-orange-900/5 to-orange-900/0
                      opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0f0f0f] border border-zinc-800
                        flex items-center justify-center text-2xl shrink-0
                        group-hover:border-orange-800 transition-colors">
          🗺
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
            Résoudre le Voyage
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Choisir terrain · durée · appliquer FV, faim, soif et stress
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-zinc-400 font-mono">
            FV {character.fv} / {effectiveCon}
          </span>
          {isEpuise && (
            <span className="text-[10px] text-red-400 font-bold animate-pulse">
              🔴 Épuisé
            </span>
          )}
          {isDemiSeuil && (
            <span className="text-[10px] text-orange-400 font-semibold">
              🟡 Demi-seuil
            </span>
          )}
        </div>

        <span className="text-zinc-600 group-hover:text-orange-500 transition-colors text-sm shrink-0">
          →
        </span>
      </div>
    </button>
  )
}

// ─── Boutons jets journaliers ─────────────────────────────────────────────────

function DailyRollButton({
  label,
  icon,
  command,
  square = false,
}: {
  label:    string
  icon:     string
  command:  string
  square?:  boolean
}) {
  const [copied, setCopied] = useState(false)

  function roll() {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (square) {
    return (
      <button
        onClick={roll}
        title={command}
        className={`flex-1 flex flex-col items-center justify-center rounded-lg border gap-1
                    transition-colors ${copied
                      ? 'border-emerald-700 bg-emerald-900/20'
                      : 'border-zinc-800 bg-[#0f0f0f] hover:border-zinc-600'}`}
      >
        <span className="text-base leading-none">{copied ? '✓' : icon}</span>
        <span className={`text-[9px] leading-none ${copied ? 'text-emerald-400' : 'text-zinc-500'}`}>{label}</span>
      </button>
    )
  }

  return (
    <button
      onClick={roll}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800
                 bg-[#141414] hover:border-zinc-600 transition-colors text-left"
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span className="text-[11px] text-zinc-500 truncate flex-1">{label}</span>
      <span className={`font-mono text-[10px] shrink-0 transition-colors ${
        copied ? 'text-emerald-400' : 'text-zinc-600'
      }`}>
        {copied ? '✓' : command}
      </span>
    </button>
  )
}

// ─── HomeTab ──────────────────────────────────────────────────────────────────

export function HomeTab() {
  const { character, updateField } = useCharacterStore()
  const { items }                  = useItemsStore()
  const [showRestModal, setShowRestModal]     = useState(false)
  const [showTravelModal, setShowTravelModal] = useState(false)
  const [showDeathModal, setShowDeathModal]   = useState(false)


  const donBonuses    = computeAllBonuses(character)
  const effectiveCon  = character.constitution + (donBonuses.characteristics.constitution ?? 0)

  // Jets journaliers
  const perceptionBase      = (character.skills ?? {})['perception'] ?? 0
  const perceptionSources   = getSkillBreakdown(perceptionBase, character.dons ?? [], 'perception', 'Discrétion & Observation')
  const perceptionLvl       = perceptionSources.reduce((s, src) => s + src.value, 0)

  const hpBreakdown   = calcHpMax(character, donBonuses)
  const fvBreakdown   = calcFvMax(character, donBonuses)
  const encoBreakdown = calcEncombrementMax(character, items)

  const inventory    = character.inventory ?? []
  const equippedIds  = new Set([
    ...Object.values(character.equipped ?? {}),
    ...(character.equippedList ?? []),
  ])
  const passiveBonuses = calcInventoryPassiveBonuses(character, items)

  // Poids : items équipés → seulement 1 unité exclue (le reste de la stack compte)
  const weightSources: { label: string; value: number }[] = []
  const inventoryKg = inventory.reduce((sum, item) => {
    const def = items.find((d) => d.id === item.itemId)
    if (!def) return sum
    const countingQty = equippedIds.has(item.id) ? Math.max(0, item.quantity - 1) : item.quantity
    if (countingQty > 0 && def.weight > 0) {
      weightSources.push({
        label: countingQty > 1 ? `${def.name} ×${countingQty}` : def.name,
        value: parseFloat((def.weight * countingQty).toFixed(2)),
      })
    }
    return sum + def.weight * countingQty
  }, 0)
  const weightBreakdown = { total: parseFloat(inventoryKg.toFixed(2)), sources: weightSources }

  const effectiveMoyensMax    = (character.objetsMoyensMax ?? 1) + passiveBonuses.moyenSlots
  const effectiveGrandsMax    = (character.objetsGrandsMax ?? 1) + passiveBonuses.grandSlots
  const effectiveTresGrandsMax = character.objetsTresGrandsMax || 1

  const allItems = items.length > 0 ? items : ITEMS_LIST
  function volumeCountingQty(i: { id: string; quantity: number }) {
    return equippedIds.has(i.id) ? Math.max(0, i.quantity - 1) : i.quantity
  }
  function volumeLabel(i: { id: string; itemId: string; quantity: number }) {
    const qty = volumeCountingQty(i)
    if (qty <= 0) return null
    const def = allItems.find((d) => d.id === i.itemId)
    return def ? (qty > 1 ? `${def.name} ×${qty}` : def.name) : i.itemId
  }
  const moyensItems = inventory
    .filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'moyen')
    .map(volumeLabel).filter((n): n is string => n !== null)
  const grandsItems = inventory
    .filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'grand')
    .map(volumeLabel).filter((n): n is string => n !== null)
  const tresGrandsItems = inventory
    .filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'très grand')
    .map(volumeLabel).filter((n): n is string => n !== null)

  const nbMoyens     = inventory.filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'moyen').reduce((s, i) => s + volumeCountingQty(i), 0)
  const nbGrands     = inventory.filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'grand').reduce((s, i) => s + volumeCountingQty(i), 0)
  const nbTresGrands = inventory.filter((i) => allItems.find((d) => d.id === i.itemId)?.volume === 'très grand').reduce((s, i) => s + volumeCountingQty(i), 0)

  return (
    <>
    <div className="space-y-3">

      {/* Ligne 1 : Combat + Survie */}
      <div className="grid grid-cols-2 gap-3">

        <Card>
          <SectionTitle>Combat</SectionTitle>
          <div className="space-y-4">
            <StatBar
              label="Vie"
              current={character.hpCurrent}
              max={hpBreakdown.total}
              barColor={getBarColor('hp', character.hpCurrent, hpBreakdown.total)}
              breakdown={hpBreakdown}
              onUpdate={(v) => updateField('hpCurrent', v)}
            />
            <StatBar
              label="FV"
              current={character.fv}
              max={fvBreakdown.total}
              barColor={getBarColor('fv', character.fv, fvBreakdown.total)}
              breakdown={fvBreakdown}
              warning={getFvEffectLabel(character.fv, effectiveCon)}
              onUpdate={(v) => updateField('fv', v)}
              clampToMax={false}
              min={-1}
            />
          </div>

          {/* Séquence de mort + jets journaliers */}
          {(() => {
            const isDying = character.hpCurrent <= 0
            return (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDeathModal(true)}
                  disabled={!isDying}
                  className={`flex-[2] rounded-lg px-3 py-2 text-left transition-all duration-300
                              flex items-center gap-2 border
                              ${isDying
                                ? 'border-red-900 bg-red-950/60 hover:bg-red-900/60 animate-pulse'
                                : 'border-zinc-800 bg-[#0f0f0f] opacity-30 cursor-not-allowed'
                              }`}
                >
                  <span className={`text-lg shrink-0 ${isDying ? 'animate-pulse' : ''}`}>💀</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${isDying ? 'text-red-400' : 'text-zinc-600'}`}>
                      Séquence de mort
                    </p>
                    <p className={`text-[10px] ${isDying ? 'text-red-600' : 'text-zinc-700'}`}>
                      Agonie · Porte de la Mort
                    </p>
                  </div>
                  {isDying && (
                    <span className="text-[10px] font-mono shrink-0 text-red-500">⚠ 0 PV</span>
                  )}
                </button>

                <div className="flex-[1] flex flex-row gap-2">
                  <DailyRollButton label="Chance" icon="🎲" command="/gr 1d20 chance" square />
                  <DailyRollButton label="Perception" icon="👁" command={`/gr 1d20+${perceptionLvl} perception`} square />
                </div>
              </div>
            )
          })()}
        </Card>

        <Card>
          <SectionTitle>Survie</SectionTitle>
          <div className="space-y-4">
            <StatBar
              label="Faim"
              current={character.faim}
              max={200}
              barColor={getBarColor('hunger', character.faim, 200)}
              onUpdate={(v) => updateField('faim', v)}
            />
            <StatBar
              label="Soif"
              current={character.soif}
              max={200}
              barColor={getBarColor('thirst', character.soif, 200)}
              onUpdate={(v) => updateField('soif', v)}
            />
            <StatBar
              label="Stress"
              current={character.stress}
              max={200}
              barColor={getBarColor('stress', character.stress, 200)}
              warning={getStressThresholdLabel(character.stress)}
              onUpdate={(v) => updateField('stress', v)}
            />
          </div>
        </Card>

      </div>

      {/* Boutons Repos + Voyage */}
      <div className="grid grid-cols-2 gap-3">
        <ReposLauncher  onOpen={() => setShowRestModal(true)}  />
        <TravelLauncher onOpen={() => setShowTravelModal(true)} />
      </div>

      {/* Ligne 2 : Blessures + Équipement + Encombrement */}
      <div className="grid grid-cols-4 gap-3">

        <div className="col-span-2 flex flex-col">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-700/60 pb-1 shrink-0">
              <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Blessures
                {character.wounds.length > 0 && (
                  <span className="text-zinc-500 normal-case ml-1">
                    ({character.wounds.length})
                    {character.wounds.some((w) => w.hpCost > 0) && (
                      <span className="text-red-500 ml-1">
                        −{character.wounds.reduce((s, w) => s + w.hpCost, 0)} PV
                      </span>
                    )}
                  </span>
                )}
              </h2>
            </div>
            <div className="mb-2 shrink-0">
              <AddWoundForm />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {character.wounds.length === 0 ? (
                <p className="text-zinc-600 text-xs italic">Aucune blessure</p>
              ) : (
                <ul>
                  {character.wounds.map((w) => <WoundRow key={w.id} wound={w} />)}
                </ul>
              )}
            </div>
          </div>
        </div>

        <EquipmentPanel />

        <Card>
          <SectionTitle>Encombrement</SectionTitle>
          <StatBar
            label="Poids (kg)"
            current={parseFloat(inventoryKg.toFixed(2))}
            max={encoBreakdown.total}
            barColor={getBarColor('encombrement', inventoryKg, encoBreakdown.total)}
            breakdown={weightBreakdown}
            warning={getEncombrementEffectLabel(inventoryKg)}
            clampToMax={false}
          />
          <div className="mt-3">
            <ItemSlotCounter
              label="Objets moyens"
              readOnly
              current={nbMoyens}
              max={effectiveMoyensMax}
              maxSources={[
                { label: 'Règle de base', value: character.objetsMoyensMax ?? 1 },
                ...(passiveBonuses.moyenSlots > 0
                  ? [{ label: 'Inventaire (sac…)', value: passiveBonuses.moyenSlots }]
                  : []),
              ]}
              inventoryItems={moyensItems}
              onCurrentChange={() => {}}
              onMaxChange={(v) => updateField('objetsMoyensMax', Math.max(0, v - passiveBonuses.moyenSlots))}
            />
            <ItemSlotCounter
              label="Objets grands"
              readOnly
              current={nbGrands}
              max={effectiveGrandsMax}
              maxSources={[
                { label: 'Règle de base', value: character.objetsGrandsMax ?? 1 },
                ...(passiveBonuses.grandSlots > 0
                  ? [{ label: 'Inventaire (sac…)', value: passiveBonuses.grandSlots }]
                  : []),
              ]}
              inventoryItems={grandsItems}
              onCurrentChange={() => {}}
              onMaxChange={(v) => updateField('objetsGrandsMax', Math.max(0, v - passiveBonuses.grandSlots))}
            />
            <ItemSlotCounter
              label="Objets très grands"
              readOnly
              current={nbTresGrands}
              max={effectiveTresGrandsMax}
              maxSources={[{ label: 'Règle de base', value: character.objetsTresGrandsMax || 1 }]}
              inventoryItems={tresGrandsItems}
              onCurrentChange={() => {}}
              onMaxChange={(v) => updateField('objetsTresGrandsMax', Math.max(0, v))}
            />
          </div>
        </Card>

      </div>

      {/* Notes */}
      <NotesPanel />

      {/* Ligne 3 : Traits + Dons */}
      <div className="grid grid-cols-2 gap-3">

        <Card>
          <SectionTitle>Traits</SectionTitle>
          <AddTraitForm />
          {(character.traits ?? []).length === 0 ? (
            <p className="text-zinc-600 text-xs italic">Aucun trait</p>
          ) : (
            <ul>
              {(character.traits ?? []).map((t) => <TraitRow key={t.id} trait={t} />)}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>Dons</SectionTitle>
          <AddDonForm />
          {(character.dons ?? []).length === 0 ? (
            <p className="text-zinc-600 text-xs italic">Aucun don</p>
          ) : (
            <ul>
              {(character.dons ?? []).map((donId) => <DonRow key={donId} donId={donId} />)}
            </ul>
          )}
        </Card>

      </div>

      {/* Traits de Caractère */}
      <Card>
        <SectionTitle>Traits de Caractère</SectionTitle>
        {(character.traitsCaractere ?? []).length === 0 ? (
          <p className="text-zinc-600 text-xs italic">Aucun trait de caractère</p>
        ) : (
          <ul>
            {(character.traitsCaractere ?? []).map((t) => <TraitCaractereRow key={t.id} trait={t} />)}
          </ul>
        )}
        <AddTraitCaractereForm />
      </Card>

    </div>

    {showRestModal   && <RestModal   onClose={() => setShowRestModal(false)}   />}
    {showTravelModal && <TravelModal onClose={() => setShowTravelModal(false)} />}
    {showDeathModal  && <DeathModal  onClose={() => setShowDeathModal(false)}  />}
</>
  )
}
