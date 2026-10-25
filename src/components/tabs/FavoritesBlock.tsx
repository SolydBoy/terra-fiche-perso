import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { SKILLS } from '../../engine/skills'
import { CATEGORY_STYLE } from './SkillsTab'
import {
  FORCE_ABILITIES,
  DEXTERITE_ABILITIES,
  CONSTITUTION_ABILITIES,
  INTELLIGENCE_ABILITIES,
  SAGESSE_ABILITIES,
  CHARISME_ABILITIES,
} from '../../engine/characteristicAbilities'
import type { CharAbility } from '../../engine/characteristicAbilities'
import { computeAllBonuses } from '../../engine/traits'
import type { Character } from '../../engine/types'

// ── Map des caractéristiques ───────────────────────────────────────────────────

const CHAR_MAP: Record<string, {
  label: string
  abilities: CharAbility[]
  accent: string
  key: keyof Character
}> = {
  force:        { label: 'Force',        abilities: FORCE_ABILITIES,        accent: 'text-red-400',     key: 'force' },
  dexterite:    { label: 'Dextérité',    abilities: DEXTERITE_ABILITIES,    accent: 'text-yellow-400',  key: 'dexterite' },
  constitution: { label: 'Constitution', abilities: CONSTITUTION_ABILITIES,  accent: 'text-emerald-400', key: 'constitution' },
  intelligence: { label: 'Intelligence', abilities: INTELLIGENCE_ABILITIES,  accent: 'text-blue-400',    key: 'intelligence' },
  sagesse:      { label: 'Sagesse',      abilities: SAGESSE_ABILITIES,       accent: 'text-purple-400',  key: 'sagesse' },
  charisme:     { label: 'Charisme',     abilities: CHARISME_ABILITIES,      accent: 'text-orange-400',  key: 'charisme' },
}

// ── Ligne compétence ───────────────────────────────────────────────────────────

function FavSkillRow({ name, lvl, accent, onUnfav }: {
  name: string
  lvl: number
  accent: string
  onUnfav: () => void
}) {
  const [copied, setCopied] = useState(false)

  function roll() {
    navigator.clipboard.writeText(`/gr 1d20+${lvl} ${name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] border border-zinc-800/60">
      <button onClick={roll} className="flex-1 flex items-center gap-2 text-left min-w-0">
        <span className="text-[11px] text-zinc-300 truncate flex-1">{name}</span>
        <span className={`font-mono font-bold text-sm shrink-0 ${lvl !== 0 ? accent : 'text-zinc-600'}`}>
          {lvl}
        </span>
        <span className={`text-[10px] shrink-0 transition-colors ${copied ? 'text-emerald-400' : 'text-zinc-700'}`}>
          {copied ? 'copié ✓' : '⚄ 1D20'}
        </span>
      </button>
      <button
        onClick={onUnfav}
        className="text-orange-400 hover:text-orange-200 text-base shrink-0 transition-colors leading-none p-1"
        title="Retirer des favoris"
      >
        ★
      </button>
    </div>
  )
}

// ── Ligne capacité ─────────────────────────────────────────────────────────────

function FavAbilityRow({ charLabel, level, ability, accent, unlocked, onUnfav }: {
  charLabel: string
  level: number
  ability: CharAbility
  accent: string
  unlocked: boolean
  onUnfav: () => void
}) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800/60
                     ${unlocked ? 'bg-[#111]' : 'bg-[#111] opacity-40'}`}>
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
        <span className={`text-[10px] font-bold shrink-0 ${accent}`}>{charLabel}</span>
        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{level}</span>
        {ability.name && (
          <span className={`text-[11px] font-semibold shrink-0 ${accent}`}>{ability.name} —</span>
        )}
        <span className="text-[11px] text-zinc-400 truncate">{ability.description}</span>
      </div>
      <button
        onClick={onUnfav}
        className="text-orange-400 hover:text-orange-200 text-base shrink-0 transition-colors leading-none p-1"
        title="Retirer des favoris"
      >
        ★
      </button>
    </div>
  )
}

// ── Bloc principal ─────────────────────────────────────────────────────────────

export function FavoritesBlock() {
  const { character, toggleFavorite } = useCharacterStore()
  const favorites = character.favorites ?? []

  if (favorites.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-dashed border-zinc-800 rounded-xl px-4 py-4
                      text-center text-[11px] text-zinc-600">
        ☆ Aucun favori — marquez des compétences ou capacités avec ★ pour les épingler ici
      </div>
    )
  }

  const skillBonuses = computeAllBonuses(character).skills

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3 space-y-1.5">
      <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-0.5 pb-0.5">
        ★ Favoris
      </h3>

      {favorites.map(favId => {
        // ── Compétence ─────────────────────────────────────────────────────────
        if (favId.startsWith('s:')) {
          const skillId = favId.slice(2)
          const skill = SKILLS.find(s => s.id === skillId)
          if (!skill) return null
          const base = (character.skills ?? {})[skillId] ?? 0
          const lvl  = base + (skillBonuses[skillId] ?? 0)
          const style = CATEGORY_STYLE[skill.category]
          return (
            <FavSkillRow
              key={favId}
              name={skill.name}
              lvl={lvl}
              accent={style.lvl}
              onUnfav={() => toggleFavorite(favId)}
            />
          )
        }

        // ── Capacité ───────────────────────────────────────────────────────────
        if (favId.startsWith('a:')) {
          const parts   = favId.split(':')
          const charKey = parts[1]
          const level   = parseInt(parts[2], 10)
          const charDef = CHAR_MAP[charKey]
          if (!charDef) return null
          const ability = charDef.abilities.find(a => a.level === level)
          if (!ability) return null
          const charLvl  = (character[charDef.key] as number) ?? 0
          const unlocked = charLvl >= level
          return (
            <FavAbilityRow
              key={favId}
              charLabel={charDef.label}
              level={level}
              ability={ability}
              accent={charDef.accent}
              unlocked={unlocked}
              onUnfav={() => toggleFavorite(favId)}
            />
          )
        }

        return null
      })}
    </div>
  )
}
