import { useState, useEffect, useRef } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { SKILLS } from '../../engine/skills'
import { ITEMS_ALL as ITEMS_LIST } from '../../engine/items-merged'
import { getSkillBreakdown } from '../../engine/dons'
import {
  TECHNIQUES,
  WEAPON_SKILL_IDS,
  GENERAL_SKILL_ID,
  PT_COST,
  calcPtEarned,
  canAcquire,
} from '../../engine/techniques'
import type { TechniqueCategory, TechniqueType, TechniqueDef } from '../../engine/techniques'
import {
  syncTechniquesFromNotion,
  getCachedTechniquesData,
} from '../../lib/syncTechniquesNotion'
import type { TechniquesSyncData, FamilleDef, SyncedTechniqueDef } from '../../lib/syncTechniquesNotion'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** PT dépensés pour une compétence, basé sur la liste de techniques utilisée */
function calcPtSpentFrom(
  skillId:    string,
  acquiredIds: string[],
  techniques: TechniqueDef[],
): number {
  return techniques
    .filter((t) => t.skillId === skillId && acquiredIds.includes(t.id))
    .reduce((sum, t) => sum + PT_COST[t.category], 0)
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

// ─── Config des 3 types ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TechniqueType, {
  label:  string
  icon:   string
  accent: string
  bg:     string
  border: string
  badge:  string
}> = {
  passif: {
    label: 'Passif', icon: '◈',
    accent: 'text-emerald-400', bg: 'bg-emerald-950/20',
    border: 'border-emerald-900/40', badge: 'bg-emerald-900/50 text-emerald-300',
  },
  technique: {
    label: 'Technique', icon: '◆',
    accent: 'text-blue-400', bg: 'bg-blue-950/20',
    border: 'border-blue-900/40', badge: 'bg-blue-900/50 text-blue-300',
  },
  attaque: {
    label: 'Attaque', icon: '⚔',
    accent: 'text-red-400', bg: 'bg-red-950/20',
    border: 'border-red-900/40', badge: 'bg-red-900/50 text-red-300',
  },
}

// ─── Couleurs par palier ───────────────────────────────────────────────────────

const TIER_STYLE: Record<TechniqueCategory, { badge: string }> = {
  'Novice':        { badge: 'bg-zinc-700 text-zinc-300' },
  'Adepte':        { badge: 'bg-blue-900/70 text-blue-300' },
  'Professionnel': { badge: 'bg-purple-900/70 text-purple-300' },
  'Maître':        { badge: 'bg-orange-900/70 text-orange-300' },
}

const TIER_ORDER: TechniqueCategory[] = ['Novice', 'Adepte', 'Professionnel', 'Maître']

// ─── Carte de technique ────────────────────────────────────────────────────────

function TechniqueCard({
  technique,
  skillLevel,
  acquiredIds,
  ptAvailable,
  familyChosen,
  familyRestriction,
  allTechniques,
}: {
  technique:          SyncedTechniqueDef
  skillLevel:         number
  acquiredIds:        string[]
  ptAvailable:        number
  familyChosen:       boolean
  familyRestriction?: string
  allTechniques:      TechniqueDef[]
}) {
  const { character, acquireTechnique, removeTechnique, updateTechniquePeCost } = useCharacterStore()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [editingPe, setEditingPe]         = useState(false)

  const storedCost  = (character.techniquePeCosts ?? {})[technique.id]
  const effectivePe = storedCost ?? technique.peCost
  const [draftPe, setDraftPe] = useState('')

  function openPeEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setDraftPe(String(effectivePe ?? 0))
    setEditingPe(true)
  }
  function commitPe() {
    const v = parseInt(draftPe, 10)
    updateTechniquePeCost(technique.id, isNaN(v) || v < 0 ? 0 : v)
    setEditingPe(false)
  }

  const isAcquired = acquiredIds.includes(technique.id)
  const { ok, reason } = canAcquire(technique, skillLevel, acquiredIds, ptAvailable)
  const tier    = TIER_STYLE[technique.category]
  const typeCfg = TYPE_CONFIG[technique.type]

  const minLvl        = technique.prereqs?.minLevel ?? 0
  const lvlOk         = skillLevel >= minLvl
  const requiredTechs = (technique.prereqs?.techniqueIds ?? []).map(
    (id) => ({ id, name: allTechniques.find((t) => t.id === id)?.name ?? id, met: acquiredIds.includes(id) }),
  )

  // Champs présents uniquement quand la technique vient du sync Notion
  const prereqText      = technique.prereqText
  const weaponTypeNames = technique.weaponTypeNames

  return (
    <div className={`flex flex-col rounded-lg border overflow-hidden transition-colors ${
      isAcquired ? `${typeCfg.border}` : 'border-zinc-800'
    }`}>

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 ${isAcquired ? typeCfg.bg : 'bg-[#141414]'}`}>
        <span className={`text-[10px] font-bold shrink-0 ${typeCfg.accent}`}>{typeCfg.icon}</span>
        <p className={`flex-1 text-xs font-bold leading-tight ${isAcquired ? typeCfg.accent : 'text-zinc-300'}`}>
          {technique.name}
        </p>

        {effectivePe !== undefined && (
          editingPe ? (
            <input
              autoFocus
              type="number"
              min={0}
              value={draftPe}
              onChange={(e) => setDraftPe(e.target.value)}
              onBlur={commitPe}
              onKeyDown={(e) => { if (e.key === 'Enter') commitPe(); if (e.key === 'Escape') setEditingPe(false) }}
              onClick={(e) => e.stopPropagation()}
              className="w-10 text-center bg-[#0f0f0f] border border-sky-600 rounded
                         text-[10px] text-sky-400 font-bold font-mono focus:outline-none
                         [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <button
              onClick={openPeEdit}
              title="Modifier le coût PE"
              className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border transition-colors
                          hover:border-sky-700 ${
                effectivePe === 0
                  ? 'text-zinc-500 border-zinc-700'
                  : storedCost !== undefined
                    ? 'text-sky-300 border-sky-800/60 bg-sky-950/40'
                    : 'text-sky-400 border-sky-900/60'
              }`}
            >
              {effectivePe === 0 ? '0 PE' : `${effectivePe} PE`}
            </button>
          )
        )}

        {technique.fatigueCost && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border
                           text-orange-300 border-orange-800/50 bg-orange-950/40">
            +{technique.fatigueCost}f
          </span>
        )}

        {technique.url && (
          <a
            href={technique.url}
            target="_blank"
            rel="noreferrer"
            title="Fiche Notion"
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700
                       text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors shrink-0"
          >↗</a>
        )}

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${tier.badge}`}>
          {technique.category} · {PT_COST[technique.category]} PT
        </span>
      </div>

      {/* Effets */}
      <div className="px-3 py-2 bg-[#111]">
        {technique.effect ? (
          <p className="text-[10px] text-zinc-200 leading-relaxed whitespace-pre-line">{technique.effect}</p>
        ) : (
          <p className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-line">{technique.description}</p>
        )}
      </div>

      {/* Lore */}
      {technique.effect && technique.description && (
        <div className="px-3 py-2 bg-[#0d0d0d] border-t border-zinc-800/60">
          <p className="text-[10px] text-zinc-500 italic leading-relaxed">{technique.description}</p>
        </div>
      )}

      {/* Armes + Prérequis */}
      <div className="px-3 pb-2 space-y-1.5 bg-[#111]">

        {/* Types d'arme (Notion) */}
        {weaponTypeNames && weaponTypeNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {weaponTypeNames.map((w) => (
              <span key={w} className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Armes requises (données statiques) */}
        {technique.weapons && technique.weapons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {technique.weapons.map((wId) => {
              const wName = ITEMS_LIST.find((i) => i.id === wId)?.name ?? wId
              return (
                <span key={wId} className="text-[9px] px-1.5 py-0.5 rounded border
                                           border-zinc-600 text-zinc-400 bg-zinc-800/60">
                  {wName}
                </span>
              )
            })}
          </div>
        )}

        {/* Prérequis structurés (données statiques) */}
        {(minLvl > 0 || requiredTechs.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {minLvl > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                lvlOk ? 'border-emerald-800/60 text-emerald-500' : 'border-red-900/60 text-red-500'
              }`}>
                Niv. {minLvl}
              </span>
            )}
            {requiredTechs.map((r) => (
              <span key={r.id} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                r.met ? 'border-emerald-800/60 text-emerald-500' : 'border-red-900/60 text-red-500'
              }`}>
                {r.name}
              </span>
            ))}
          </div>
        )}

        {/* Prérequis texte (Notion) */}
        {prereqText && (
          <p className="text-[9px] text-amber-700/80 italic">{prereqText}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 bg-[#141414] border-t border-zinc-800/60">
        {isAcquired ? (
          confirmRemove ? (
            <div className="flex gap-1">
              <button
                onClick={() => { removeTechnique(technique.id); setConfirmRemove(false) }}
                className="flex-1 py-1 text-[10px] font-bold rounded border border-red-800
                           text-red-400 hover:bg-red-900/30 transition-colors"
              >
                Confirmer le retrait
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-2 py-1 text-[10px] rounded border border-zinc-700
                           text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`flex-1 text-[10px] font-semibold ${typeCfg.accent}`}>✓ Acquise</span>
              <button
                onClick={() => navigator.clipboard.writeText(
                  [technique.name, technique.effect ?? '', technique.description].filter(Boolean).join('\n').trim()
                )}
                className="text-[10px] px-2 py-0.5 rounded border border-zinc-800
                           text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                Copier
              </button>
              <button
                onClick={() => setConfirmRemove(true)}
                className="text-[10px] px-2 py-0.5 rounded border border-zinc-800
                           text-zinc-600 hover:text-red-400 hover:border-red-900 transition-colors"
              >
                Retirer
              </button>
            </div>
          )
        ) : !familyChosen ? (
          <p className="text-[10px] text-zinc-700 text-center py-0.5 italic">Famille non choisie</p>
        ) : familyRestriction ? (
          <p className="text-[10px] text-amber-700 text-center py-0.5 italic">{familyRestriction}</p>
        ) : (
          <button
            onClick={() => ok && acquireTechnique(technique.id)}
            disabled={!ok}
            title={reason}
            className={`w-full py-1 text-[10px] font-bold rounded border transition-colors ${
              ok
                ? `${typeCfg.border} ${typeCfg.accent} hover:${typeCfg.bg}`
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
          >
            {ok ? `Acquérir (${PT_COST[technique.category]} PT)` : (reason ?? 'Non disponible')}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Liste des techniques des familles choisies ───────────────────────────────

function TechniquesList({
  allTechniques,
  chosenFamilies,
  acquiredIds,
  bestWeaponLevel,
}: {
  allTechniques:   TechniqueDef[]
  chosenFamilies:  string[]
  acquiredIds:     string[]
  bestWeaponLevel: number
}) {
  const { character } = useCharacterStore()

  function getSkillLevel(skillId: string): number {
    const base    = (character.skills ?? {})[skillId] ?? 0
    const sources = getSkillBreakdown(base, character.dons ?? [], skillId, 'Combat')
    return sources.reduce((s, src) => s + src.value, 0)
  }

  function getPtAvail(skillId: string): number {
    if (skillId === GENERAL_SKILL_ID) {
      // Techniques 'général' : puisent dans le pool total de PT armes
      const totalEarned = WEAPON_SKILL_IDS.reduce((sum, id) => sum + calcPtEarned(getSkillLevel(id)), 0)
      const totalSpent  = [...WEAPON_SKILL_IDS, GENERAL_SKILL_ID].reduce(
        (sum, id) => sum + calcPtSpentFrom(id, acquiredIds, allTechniques), 0,
      )
      return totalEarned - totalSpent
    }
    const earned = calcPtEarned(getSkillLevel(skillId))
    const spent  = calcPtSpentFrom(skillId, acquiredIds, allTechniques)
    return earned - spent
  }

  function getFamilyRestriction(cat: TechniqueCategory, isSecond: boolean): string | undefined {
    if (!isSecond) return undefined
    if (cat === 'Maître') return '2e famille : Maître inaccessible'
    if (cat === 'Professionnel' && bestWeaponLevel < 12)
      return `2e famille : Professionnel requis niv. 12 (actuel : ${bestWeaponLevel})`
    return undefined
  }

  if (chosenFamilies.length === 0) return null

  return (
    <div className="space-y-3">
      {chosenFamilies.map((family, idx) => {
        const isSecond   = idx === 1
        const techniques = allTechniques
          .filter((t) => t.family === family)
          .sort((a, b) => TIER_ORDER.indexOf(a.category) - TIER_ORDER.indexOf(b.category))

        if (techniques.length === 0) return null

        const acquiredCount = techniques.filter((t) => acquiredIds.includes(t.id)).length

        return (
          <div key={family} className={`bg-[#1a1a1a] border rounded-xl overflow-hidden ${
            isSecond ? 'border-blue-900/50' : 'border-orange-900/40'
          }`}>
            {/* En-tête famille */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <span className={`text-[9px] font-black w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                isSecond ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'
              }`}>{idx + 1}</span>
              <span className={`flex-1 text-sm font-bold ${isSecond ? 'text-blue-300' : 'text-orange-300'}`}>
                {family}
              </span>
              {isSecond && (
                <span className="text-[9px] text-amber-600 font-semibold">
                  {bestWeaponLevel >= 12 ? 'Professionnel max' : 'Adepte max'}
                </span>
              )}
              {acquiredCount > 0 && (
                <span className="text-[10px] text-emerald-500 font-bold">
                  ✓ {acquiredCount}/{techniques.length}
                </span>
              )}
            </div>

            {/* Techniques */}
            <div className="p-3 space-y-1.5">
              {techniques.map((t, i) => (
                <div key={t.id}>
                  <TechniqueCard
                    technique={t}
                    skillLevel={getSkillLevel(t.skillId)}
                    acquiredIds={acquiredIds}
                    ptAvailable={getPtAvail(t.skillId)}
                    familyChosen={true}
                    familyRestriction={getFamilyRestriction(t.category, isSecond)}
                    allTechniques={allTechniques}
                  />
                  {i < techniques.length - 1 && (
                    <div className="flex justify-center my-1.5">
                      <div className="w-px h-3 bg-zinc-700/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Couleurs des styles de famille ───────────────────────────────────────────

const STYLE_COLORS: Record<string, string> = {
  'Duel':     'bg-red-900/40 text-red-300',
  'Support':  'bg-blue-900/40 text-blue-300',
  'Controle': 'bg-purple-900/40 text-purple-300',
  'Défense':  'bg-teal-900/40 text-teal-300',
  'Mobilité': 'bg-green-900/40 text-green-300',
}

// ─── Menu déroulant avec recherche ────────────────────────────────────────────

function FamilySearchSelect({
  familles,
  exclude,
  placeholder,
  accent,
  onChoose,
}: {
  familles:    FamilleDef[]
  exclude:     string[]
  placeholder: string
  accent:      'orange' | 'blue'
  onChoose:    (name: string) => void
}) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = familles
    .filter((f) => !exclude.includes(f.name))
    .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) ||
                   f.styles.some((s) => s.toLowerCase().includes(query.toLowerCase())))

  const borderAccent = accent === 'orange'
    ? 'border-zinc-700 hover:border-orange-700 focus:border-orange-600'
    : 'border-zinc-700 hover:border-blue-700 focus:border-blue-600'

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5
                    bg-[#0f0f0f] text-zinc-500 hover:text-zinc-300 transition-colors ${borderAccent}`}
      >
        <span className="flex-1 italic">{placeholder}</span>
        <span className="text-zinc-700 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#1e1e1e] border border-zinc-700
                        rounded-xl shadow-2xl overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-2 border-b border-zinc-800">
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-lg px-2.5 py-1 pr-7
                           text-[11px] text-zinc-200 placeholder-zinc-600
                           focus:outline-none focus:border-orange-600"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[11px] transition-colors"
                >✕</button>
              )}
            </div>
          </div>

          {/* Liste filtrée */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[10px] text-zinc-600 text-center py-4 italic">Aucune famille trouvée</p>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { onChoose(f.name); setOpen(false); setQuery('') }}
                  className="w-full text-left px-3 py-2.5 hover:bg-zinc-800/60 transition-colors
                             border-b border-zinc-800/40 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-200 flex-1 leading-tight">
                      {f.name}
                    </span>
                    {f.divinite && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-purple-900/50 text-purple-400 shrink-0">
                        ✦ {f.divinite}
                      </span>
                    )}
                  </div>
                  {(f.styles.length > 0 || f.weaponTypes.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {f.styles.map((s) => (
                        <span key={s} className={`text-[8px] px-1 py-0.5 rounded font-medium ${
                          STYLE_COLORS[s] ?? 'bg-zinc-800 text-zinc-400'
                        }`}>{s}</span>
                      ))}
                      {f.weaponTypes.slice(0, 4).map((w) => (
                        <span key={w} className="text-[8px] px-1 py-0.5 rounded border border-zinc-700/60 text-zinc-500">{w}</span>
                      ))}
                      {f.weaponTypes.length > 4 && (
                        <span className="text-[8px] text-zinc-600">+{f.weaponTypes.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Onglet Familles ──────────────────────────────────────────────────────────

function FamillesSubTab({
  familles,
  chosenFamilies,
  maxFamilies,
  bestWeaponLevel,
  onChoose,
  onUnchoose,
}: {
  familles:        FamilleDef[]
  chosenFamilies:  string[]
  maxFamilies:     number
  bestWeaponLevel: number
  onChoose:        (name: string, slot: 1 | 2) => void
  onUnchoose:      (index: number) => void
}) {
  const slot2Available = maxFamilies >= 2

  // Métadonnées de la famille choisie (si synced depuis Notion)
  function getFamilleInfo(name: string): FamilleDef | undefined {
    return familles.find((f) => f.name === name)
  }

  function renderChosenFamily(name: string, slot: 1 | 2) {
    const info = getFamilleInfo(name)
    const isSecond = slot === 2
    return (
      <div className={`flex items-start gap-2 p-2 rounded-lg border ${
        isSecond ? 'border-blue-900/40 bg-blue-950/10' : 'border-orange-900/40 bg-orange-950/10'
      }`}>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`text-xs font-bold ${isSecond ? 'text-blue-300' : 'text-orange-300'}`}>{name}</p>
          {isSecond && (
            <p className="text-[9px] text-amber-600 font-semibold">
              {bestWeaponLevel >= 12 ? 'Professionnel max' : 'Adepte max'}
            </p>
          )}
          {info && (info.styles.length > 0 || info.weaponTypes.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {info.styles.map((s) => (
                <span key={s} className={`text-[8px] px-1 py-0.5 rounded font-medium ${
                  STYLE_COLORS[s] ?? 'bg-zinc-800 text-zinc-400'
                }`}>{s}</span>
              ))}
              {info.weaponTypes.slice(0, 4).map((w) => (
                <span key={w} className="text-[8px] px-1 py-0.5 rounded border border-zinc-700/60 text-zinc-500">{w}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onUnchoose(slot - 1)}
          className="text-zinc-600 hover:text-red-400 transition-colors text-sm leading-none shrink-0 px-1"
          title="Retirer"
        >×</button>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-4">

      {/* Titre + niveau */}
      <div className="flex items-center justify-between border-b border-zinc-700/60 pb-2">
        <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          Famille{maxFamilies > 1 ? 's' : ''} choisie{maxFamilies > 1 ? 's' : ''}
        </h2>
        <span className={`text-[10px] font-mono font-bold ${bestWeaponLevel >= 9 ? 'text-orange-400' : 'text-zinc-500'}`}>
          Niv. arme max : {bestWeaponLevel}
        </span>
      </div>

      {/* Slot 1 — Principale */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black w-4 h-4 rounded bg-orange-900/50 text-orange-400
                           flex items-center justify-center shrink-0">1</span>
          <span className="text-[10px] text-zinc-500 font-semibold">Principale</span>
        </div>
        {chosenFamilies[0]
          ? renderChosenFamily(chosenFamilies[0], 1)
          : <FamilySearchSelect
              familles={familles}
              exclude={chosenFamilies.filter(Boolean)}
              placeholder="Choisir une famille principale…"
              accent="orange"
              onChoose={(name) => onChoose(name, 1)}
            />
        }
      </div>

      {/* Slot 2 — Secondaire */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-black w-4 h-4 rounded flex items-center justify-center shrink-0 ${
            slot2Available ? 'bg-blue-900/50 text-blue-400' : 'bg-zinc-800/50 text-zinc-600'
          }`}>2</span>
          <span className={`text-[10px] font-semibold ${slot2Available ? 'text-zinc-500' : 'text-zinc-700'}`}>
            Secondaire
          </span>
          {!slot2Available && (
            <span className="text-[9px] text-zinc-700 italic">
              — niv. 9 requis (actuel : {bestWeaponLevel})
            </span>
          )}
        </div>
        {!slot2Available ? null
          : chosenFamilies[1]
            ? renderChosenFamily(chosenFamilies[1], 2)
            : <FamilySearchSelect
                familles={familles}
                exclude={chosenFamilies.filter(Boolean)}
                placeholder="Choisir une famille secondaire…"
                accent="blue"
                onChoose={(name) => onChoose(name, 2)}
              />
        }
      </div>

    </div>
  )
}

// ─── Onglet Techniques ────────────────────────────────────────────────────────

// ─── Onglet principal ──────────────────────────────────────────────────────────

export function TechniquesTab() {
  const { character, setFamillesChoisies, updateField } = useCharacterStore()
  const acquiredIds    = character.techniquesAcquises ?? []
  const chosenFamilies: string[] = Array.isArray(character.famillesChoisies)
    ? character.famillesChoisies
    : []

  const [syncing,          setSyncing]          = useState(false)
  const [syncError,        setSyncError]        = useState<string | null>(null)
  const [syncData,         setSyncData]         = useState<TechniquesSyncData | null>(null)
  const [orphanDismissed,  setOrphanDismissed]  = useState(false)

  useEffect(() => {
    const cached = getCachedTechniquesData()
    if (cached) setSyncData(cached)
  }, [])

  const bestWeaponLevel = WEAPON_SKILL_IDS.reduce((max, id) => {
    const base    = (character.skills ?? {})[id] ?? 0
    const sources = getSkillBreakdown(base, character.dons ?? [], id, 'Combat')
    return Math.max(max, sources.reduce((s, src) => s + src.value, 0))
  }, 0)

  const maxFamilies = bestWeaponLevel >= 9 ? 2 : 1

  const allTechniques: SyncedTechniqueDef[] = syncData?.techniques ?? TECHNIQUES

  const chosenFamiliesSet = new Set(chosenFamilies.filter(Boolean))
  const orphanedTechs = acquiredIds
    .map(id => allTechniques.find(t => t.id === id))
    .filter((t): t is SyncedTechniqueDef => !!t && !chosenFamiliesSet.has(t.family))

  function cleanOrphans() {
    const orphanIds = new Set(orphanedTechs.map(t => t.id))
    updateField('techniquesAcquises', acquiredIds.filter(id => !orphanIds.has(id)))
    setOrphanDismissed(true)
  }

  const ptBreakdown = WEAPON_SKILL_IDS.map((id) => {
    const base    = (character.skills ?? {})[id] ?? 0
    const sources = getSkillBreakdown(base, character.dons ?? [], id, 'Combat')
    const level   = sources.reduce((s, src) => s + src.value, 0)
    const name    = SKILLS.find((s) => s.id === id)?.name ?? id
    return { id, name, level, pt: calcPtEarned(level) }
  })
    .filter((s) => s.level > 0)
    .sort((a, b) => b.level - a.level)
    .slice(0, 2)

  const totalPtEarned = ptBreakdown.reduce((sum, s) => sum + s.pt, 0)
  const totalPtSpent  = [...WEAPON_SKILL_IDS, GENERAL_SKILL_ID].reduce((sum, id) =>
    sum + calcPtSpentFrom(id, acquiredIds, allTechniques), 0)
  const totalPtAvail  = totalPtEarned - totalPtSpent

  const familles: FamilleDef[] = syncData?.familles ?? (
    [...new Set(TECHNIQUES.map((t) => t.family))].sort().map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      notionId: '', name, styles: [], weaponTypes: [], naturelle: true, url: '',
    }))
  )

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await syncTechniquesFromNotion()
      setSyncData(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSyncing(false)
    }
  }

  function choose(name: string, slot: 1 | 2) {
    if (slot === 2 && maxFamilies < 2) return
    if (slot === 1) {
      setFamillesChoisies([name, ...(chosenFamilies[1] ? [chosenFamilies[1]] : [])])
    } else {
      setFamillesChoisies([chosenFamilies[0] ?? '', name])
    }
  }

  function unchoose(index: number) {
    const removedName = chosenFamilies[index]
    setFamillesChoisies(chosenFamilies.filter((_, i) => i !== index))
    if (removedName) {
      const familyTechIds = new Set(allTechniques.filter(t => t.family === removedName).map(t => t.id))
      updateField('techniquesAcquises', (character.techniquesAcquises ?? []).filter(id => !familyTechIds.has(id)))
    }
  }

  return (
    <div className="space-y-3">

      {/* Alerte techniques orphelines */}
      {orphanedTechs.length > 0 && !orphanDismissed && (
        <div className="bg-amber-950/40 border border-amber-700/60 rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-sm shrink-0">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-300 leading-tight">
                {orphanedTechs.length} technique{orphanedTechs.length > 1 ? 's' : ''} sans famille associée
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                Ces techniques sont dans ton historique mais leur famille n'est plus sélectionnée.
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {orphanedTechs.map(t => (
                  <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded border border-amber-800/60 text-amber-500">
                    {t.name} <span className="text-amber-700">({t.family})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cleanOrphans}
              className="flex-1 py-1 text-[10px] font-bold rounded border border-amber-700/60
                         text-amber-300 hover:bg-amber-900/30 transition-colors"
            >
              Supprimer ces techniques
            </button>
            <button
              onClick={() => setOrphanDismissed(true)}
              className="px-3 py-1 text-[10px] rounded border border-zinc-700
                         text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {/* Sync Notion */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Synchroniser depuis Notion"
          className={`text-[10px] px-2.5 py-1 rounded border font-bold transition-colors ${
            syncing
              ? 'border-zinc-700 text-zinc-600 cursor-wait'
              : syncError
              ? 'border-red-800/60 text-red-400 hover:border-red-600'
              : 'border-zinc-700 text-zinc-500 hover:border-orange-600 hover:text-orange-400'
          }`}
        >
          {syncing ? 'Sync…' : syncError ? '✗ Réessayer' : '⟳ Sync Notion'}
        </button>
        {syncData?.timestamp && !syncError && (
          <span className="text-[9px] text-zinc-600">
            {formatRelativeTime(syncData.timestamp)}
          </span>
        )}
        {syncError && (
          <span className="text-[9px] text-red-500 italic" title={syncError}>Erreur</span>
        )}
      </div>

      {/* Barre PT */}
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-zinc-800 rounded-xl px-3 py-2">
        <span className={`text-base font-black font-mono shrink-0 ${totalPtAvail > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
          {totalPtAvail}
        </span>
        <div className="flex flex-col leading-tight flex-1 min-w-0 gap-0.5">
          <span className="text-[10px] font-bold text-zinc-400">
            PT disponibles
            <span className="text-zinc-600 font-normal ml-1.5">({totalPtSpent} dépensés / {totalPtEarned} gagnés)</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {ptBreakdown.length === 0 ? (
              <span className="text-[9px] text-zinc-700 italic">aucune compétence arme</span>
            ) : ptBreakdown.map(({ id, name, level }) => (
              <span key={id} className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700/60
                                        text-zinc-500 bg-zinc-800/40">
                {name} {level}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Familles choisies */}
      <FamillesSubTab
        familles={familles}
        chosenFamilies={chosenFamilies}
        maxFamilies={maxFamilies}
        bestWeaponLevel={bestWeaponLevel}
        onChoose={choose}
        onUnchoose={unchoose}
      />

      {/* Liste des techniques */}
      <TechniquesList
        allTechniques={allTechniques}
        chosenFamilies={chosenFamilies}
        acquiredIds={acquiredIds}
        bestWeaponLevel={bestWeaponLevel}
      />

    </div>
  )
}
