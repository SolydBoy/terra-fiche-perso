import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import type { Character } from '../../engine/types'
import type { CharAbility } from '../../engine/characteristicAbilities'
import {
  FORCE_ABILITIES,
  DEXTERITE_ABILITIES,
  CONSTITUTION_ABILITIES,
  INTELLIGENCE_ABILITIES,
  SAGESSE_ABILITIES,
  CHARISME_ABILITIES,
} from '../../engine/characteristicAbilities'
import { getCharBreakdown } from '../../engine/dons'
import { computeAllBonuses } from '../../engine/traits'
import type { CharField } from '../../engine/dons'
import { useBreakdownTooltip } from '../ui/BreakdownPopover'

// ─── Ligne caractéristique ─────────────────────────────────────────────────────

interface CharRowProps {
  label: string
  field: keyof Character
  value: number
  accent: string
  abilities?: CharAbility[]
  donBonus?: number
  locked?: boolean
}

function CharRow({ label, field, value, accent, abilities, donBonus = 0, locked = false }: CharRowProps) {
  const { updateField, character, toggleFavorite } = useCharacterStore()
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)

  const lvl          = value ?? 0
  const effectiveLvl = lvl + donBonus
  const hasAbilities = abilities && abilities.length > 0

  const breakdown = getCharBreakdown(lvl, character.dons ?? [], field as CharField)
  const { handlers: tooltipHandlers, tooltip } = useBreakdownTooltip(breakdown, effectiveLvl)

  function set(n: number) {
    updateField(field, Math.min(20, n) as Character[typeof field])
  }

  function rollDice() {
    navigator.clipboard.writeText(`/gr 1d20+${effectiveLvl} ${label}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div {...tooltipHandlers}>
      {tooltip}
      {/* En-tête : nom + niveau (secondaire) */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        {hasAbilities ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 flex-1 text-left min-w-0"
          >
            <span className={`text-[10px] uppercase tracking-widest font-bold ${accent}`}>
              {label}
            </span>
            <span className="text-zinc-700 text-[9px]">{open ? '▲' : '▼'}</span>
          </button>
        ) : (
          <span className={`text-[10px] uppercase tracking-widest font-bold flex-1 ${accent}`}>
            {label}
          </span>
        )}

        {/* Contrôles niveau — discrets, à droite */}
        <div className="flex items-center gap-1 shrink-0">
          {!locked && (
            <button
              onClick={() => set(lvl - 1)}
              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                         text-xs flex items-center justify-center transition-colors"
            >
              −
            </button>
          )}
          <span className={`font-mono font-bold text-sm w-6 text-center ${accent}`}>
            {effectiveLvl}
          </span>
          {!locked && (
            <button
              onClick={() => set(lvl + 1)}
              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                         text-xs flex items-center justify-center transition-colors"
            >
              +
            </button>
          )}
          {donBonus !== 0 && (
            <span className={`text-[9px] font-bold px-1 rounded ${donBonus > 0 ? 'text-orange-400' : 'text-red-400'}`}>
              {donBonus > 0 ? `+${donBonus}` : donBonus}
            </span>
          )}
        </div>
      </div>

      {/* Bouton jet de dé — principal */}
      <div className="px-3 pb-2.5">
        <button
          onClick={rollDice}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                     bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <span className="text-zinc-400 text-xs">⚄ &nbsp;1D20 + {effectiveLvl}</span>
          <span className={`text-xs font-semibold transition-all duration-300
                            ${copied ? 'text-emerald-400 opacity-100' : 'opacity-0'}`}>
            copié ✓
          </span>
        </button>
      </div>

      {/* Capacités dépliables */}
      {hasAbilities && open && (
        <ul className="px-3 pb-3 pt-1 space-y-0.5 border-t border-zinc-800/60">
          {abilities.map((a) => {
            const unlocked = a.level <= lvl
            const abilityFavId = `a:${field}:${a.level}`
            const isAbilityFav = (character.favorites ?? []).includes(abilityFavId)
            return (
              <li
                key={a.level}
                className={`flex items-baseline gap-1.5 text-[11px] ${unlocked ? 'opacity-100' : 'opacity-25'}`}
              >
                <span className="shrink-0 font-mono text-[10px] w-4 text-right text-zinc-500">
                  {a.level}
                </span>
                <span className="flex-1">
                  {a.name && (
                    <span className={`font-semibold mr-1 ${unlocked ? accent : 'text-zinc-500'}`}>
                      {a.name} —{' '}
                    </span>
                  )}
                  <span className={unlocked ? 'text-zinc-300' : 'text-zinc-500'}>
                    {a.description}
                  </span>
                </span>
                <button
                  onClick={() => toggleFavorite(abilityFavId)}
                  className={`shrink-0 p-1 text-sm leading-none transition-colors
                              ${isAbilityFav ? 'text-orange-400 hover:text-orange-300' : 'text-zinc-600 hover:text-zinc-400'}`}
                  title={isAbilityFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {isAbilityFav ? '★' : '☆'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Onglet principal ─────────────────────────────────────────────────────────

export function CharacteristicsTab({ locked = false }: { locked?: boolean }) {
  const { character } = useCharacterStore()
  const bonuses = computeAllBonuses(character).characteristics

  return (
    <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <CharRow label="Force"        field="force"        value={character.force}        accent="text-red-400"     abilities={FORCE_ABILITIES}         donBonus={bonuses.force        ?? 0} locked={locked} />
          <CharRow label="Dextérité"    field="dexterite"    value={character.dexterite}    accent="text-yellow-400"  abilities={DEXTERITE_ABILITIES}     donBonus={bonuses.dexterite    ?? 0} locked={locked} />
          <CharRow label="Constitution" field="constitution" value={character.constitution} accent="text-emerald-400" abilities={CONSTITUTION_ABILITIES}   donBonus={bonuses.constitution ?? 0} locked={locked} />
        </div>
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <CharRow label="Intelligence" field="intelligence" value={character.intelligence} accent="text-blue-400"    abilities={INTELLIGENCE_ABILITIES}   donBonus={bonuses.intelligence ?? 0} locked={locked} />
          <CharRow label="Sagesse"      field="sagesse"      value={character.sagesse}      accent="text-purple-400" abilities={SAGESSE_ABILITIES}        donBonus={bonuses.sagesse      ?? 0} locked={locked} />
          <CharRow label="Charisme"     field="charisme"     value={character.charisme}     accent="text-orange-400" abilities={CHARISME_ABILITIES}       donBonus={bonuses.charisme     ?? 0} locked={locked} />
        </div>
    </div>
  )
}
