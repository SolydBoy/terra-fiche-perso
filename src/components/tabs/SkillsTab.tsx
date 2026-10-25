import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { SKILLS, SKILL_CATEGORIES } from '../../engine/skills'
import type { SkillCategory, SkillDef } from '../../engine/skills'
import { getSkillBreakdown } from '../../engine/dons'
import { computeAllBonuses } from '../../engine/traits'
import { useBreakdownTooltip } from '../ui/BreakdownPopover'

// ─── Couleurs par catégorie ────────────────────────────────────────────────────

export const CATEGORY_STYLE: Record<SkillCategory, {
  bar: string        // couleur de la barre de progression
  lvl: string        // couleur du chiffre quand > 0
  border: string     // bordure active
  bg: string         // fond léger de la barre
  header: string     // couleur du titre de catégorie
}> = {
  'Combat':                  { bar: 'bg-red-600',     lvl: 'text-red-400',    border: 'border-red-800',    bg: 'bg-red-950/40',     header: 'text-red-500' },
  'Artisanat':               { bar: 'bg-amber-500',   lvl: 'text-amber-400',  border: 'border-amber-700',  bg: 'bg-amber-950/40',  header: 'text-amber-500' },
  'Survie':                  { bar: 'bg-emerald-500', lvl: 'text-emerald-400',border: 'border-emerald-700',bg: 'bg-emerald-950/40',header: 'text-emerald-500' },
  'Discrétion & Observation':{ bar: 'bg-purple-500',  lvl: 'text-purple-400', border: 'border-purple-700', bg: 'bg-purple-950/40',  header: 'text-purple-500' },
  'Médical':                 { bar: 'bg-rose-500',    lvl: 'text-rose-400',   border: 'border-rose-700',   bg: 'bg-rose-950/40',    header: 'text-rose-500' },
  'Social & Intellectuel':   { bar: 'bg-blue-500',    lvl: 'text-blue-400',   border: 'border-blue-700',   bg: 'bg-blue-950/40',    header: 'text-blue-500' },
  'Spécialisé':              { bar: 'bg-cyan-500',    lvl: 'text-cyan-400',   border: 'border-cyan-700',   bg: 'bg-cyan-950/40',    header: 'text-cyan-500' },
}

// ─── Card compétence ───────────────────────────────────────────────────────────

function SkillCard({ skill, donBonus = 0, locked = false }: { skill: SkillDef; donBonus?: number; locked?: boolean }) {
  const { character, updateSkill, toggleFavorite } = useCharacterStore()
  const [copied, setCopied] = useState(false)

  const favId = `s:${skill.id}`
  const isFav = (character.favorites ?? []).includes(favId)

  const style        = CATEGORY_STYLE[skill.category]
  const base         = (character.skills ?? {})[skill.id] ?? 0
  const lvl          = base + donBonus
  const pct          = Math.round((lvl / 20) * 100)

  const breakdown = getSkillBreakdown(base, character.dons ?? [], skill.id, skill.category)
  const { handlers: tooltipHandlers, tooltip } = useBreakdownTooltip(breakdown, lvl)

  function set(e: React.MouseEvent, n: number) {
    e.stopPropagation()
    updateSkill(skill.id, n)
  }

  function rollDice() {
    navigator.clipboard.writeText(`/gr 1d20+${lvl} ${skill.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={rollDice}
      {...tooltipHandlers}
      className={`relative flex flex-col items-center bg-[#1a1a1a] border rounded-lg
                  pt-2.5 pb-1.5 px-1.5 w-full overflow-hidden transition-all active:scale-95
                  ${copied ? `${style.border} ${style.bg}` : 'border-zinc-800 hover:border-zinc-700'}`}
    >
      {tooltip}

      {/* Bouton favori */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(favId) }}
        className={`absolute top-0 right-0 p-1.5 text-sm leading-none transition-colors
                    ${isFav ? 'text-orange-400 hover:text-orange-300' : 'text-zinc-600 hover:text-zinc-400'}`}
        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {isFav ? '★' : '☆'}
      </button>

      {/* Barre de progression en fond */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-800">
        <div
          className={`h-full transition-all duration-300 ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Nom */}
      <span className="text-[10px] text-zinc-500 font-medium leading-tight text-center
                       line-clamp-2 min-h-[26px] flex items-center justify-center w-full">
        {skill.name}
      </span>

      {/* Valeur */}
      <span className={`font-mono font-bold text-2xl leading-none my-1 transition-colors
                        ${copied ? 'text-emerald-400' : lvl > 0 ? style.lvl : 'text-zinc-600'}`}>
        {lvl}
      </span>

      {/* Feedback copié ou badge don */}
      {copied ? (
        <span className="text-[9px] font-semibold h-3 text-emerald-400">copié ✓</span>
      ) : donBonus !== 0 ? (
        <span className={`text-[9px] font-bold h-3 ${donBonus > 0 ? 'text-orange-400' : 'text-red-400'}`}>
          {donBonus > 0 ? `+${donBonus}` : donBonus} don
        </span>
      ) : (
        <span className="h-3" />
      )}

      {/* Boutons +/− (agissent sur la valeur de base) */}
      {!locked && (
        <div className="flex gap-1.5 mt-1.5 mb-1">
          <span
            role="button"
            onClick={(e) => set(e, base - 1)}
            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                       text-xs flex items-center justify-center transition-colors select-none"
          >
            −
          </span>
          <span
            role="button"
            onClick={(e) => set(e, base + 1)}
            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                       text-xs flex items-center justify-center transition-colors select-none"
          >
            +
          </span>
        </div>
      )}
    </button>
  )
}

// ─── Onglet principal ──────────────────────────────────────────────────────────

export function SkillsTab({ locked = false }: { locked?: boolean }) {
  const { character } = useCharacterStore()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  const skillBonuses = computeAllBonuses(character).skills

  const filtered = query
    ? SKILLS.filter((s) => s.name.toLowerCase().includes(query))
    : null

  return (
    <div className="space-y-5">

      {/* Barre de recherche */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une compétence…"
          className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl
                     pl-8 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-600 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500
                       hover:text-zinc-300 text-sm transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Résultats filtrés */}
      {filtered && (
        filtered.length === 0
          ? <p className="text-center text-zinc-600 text-sm py-8">Aucune compétence trouvée.</p>
          : <div className="grid grid-cols-3 gap-2">
              {filtered.map((skill) => <SkillCard key={skill.id} skill={skill} donBonus={skillBonuses[skill.id] ?? 0} locked={locked} />)}
            </div>
      )}

      {/* Grille groupée par catégorie — 3 catégories côte à côte */}
      {!filtered && (
        <div className="grid grid-cols-3 gap-3">
          {SKILL_CATEGORIES.map((cat) => {
            const style  = CATEGORY_STYLE[cat]
            const skills = SKILLS.filter((s) => s.category === cat)
            return (
              <div key={cat} className={`rounded-xl border p-3 ${style.border} ${style.bg}`}>
                <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-2.5 ${style.header}`}>
                  {cat}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {skills.map((skill) => <SkillCard key={skill.id} skill={skill} donBonus={skillBonuses[skill.id] ?? 0} locked={locked} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
