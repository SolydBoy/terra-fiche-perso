import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'
import { getSkillBreakdown } from '../../engine/dons'
import { getBarColor } from '../../engine/stats'
import { StatBar } from '../ui/StatBar'
import {
  SPELLS,
  SPELL_TYPES,
  POWER_LEVELS,
  MASTERY_LEVELS,
  POWER_LABELS,
  MASTERY_LABELS,
  SPELL_MASTERY_MOD,
  TYPE_MASTERY_MOD,
  calcCorruptionCapacity,
  getCorruptionTier,
} from '../../engine/magic'
import type { SpellDef, SpellType, PowerLevel, MasteryLevel } from '../../engine/magic'

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

const TYPE_BADGE: Record<SpellType, string> = {
  'Basique':  'bg-zinc-700 text-zinc-300',
  'Tonnerre': 'bg-yellow-900/70 text-yellow-300',
  'Vent':     'bg-teal-900/70 text-teal-300',
  'Terre':    'bg-amber-900/70 text-amber-300',
  'Eau':      'bg-sky-900/70 text-sky-300',
  'Feu':      'bg-red-900/70 text-red-300',
  'Realité':  'bg-purple-900/70 text-purple-300',
  'Soins':    'bg-emerald-900/70 text-emerald-300',
}

/** Sélecteur 3 états (débutant/maîtrisé/expert) + "aucune" */
function MasterySelect({ value, onChange }: { value?: string; onChange: (level: MasteryLevel | undefined) => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange(undefined)}
        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
          !value ? 'border-zinc-500 text-zinc-300 bg-zinc-800' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
        }`}
      >Aucune</button>
      {MASTERY_LEVELS.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
            value === lvl
              ? 'border-indigo-600 text-indigo-300 bg-indigo-950/50'
              : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
          }`}
        >{MASTERY_LABELS[lvl]}</button>
      ))}
    </div>
  )
}

function CorruptionCard() {
  const { character, updateField, addCorruption, resetWeeklyCorruption } = useCharacterStore()
  const corruption = character.corruption ?? 0
  const weeklyUsed = character.corruptionWeeklyUsed ?? 0
  const capacity   = calcCorruptionCapacity(character.sagesse ?? 0)
  const tier       = getCorruptionTier(corruption)
  const overCap    = weeklyUsed > capacity

  return (
    <Card>
      <SectionTitle>Corruption</SectionTitle>
      <div className="space-y-3">
        <StatBar
          label="Corruption"
          current={corruption}
          max={100}
          barColor={getBarColor('corruption', corruption, 100)}
          warning={tier.mechanical ? `${tier.label} — ${tier.mechanical}` : tier.label}
          onUpdate={(v) => updateField('corruption', v)}
        />

        <div className="flex items-center justify-between gap-2 bg-[#141414] border border-zinc-800 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Capacité hebdomadaire</p>
            <p className={`text-xs font-mono ${overCap ? 'text-red-400' : 'text-zinc-300'}`}>
              {weeklyUsed} / {capacity} {overCap && <span className="text-red-500 font-bold">· dépassée (effets permanents)</span>}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => addCorruption(-1)}
              title="Réduire la corruption de 1 (récupération naturelle, rituel…)"
              className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400
                         hover:border-emerald-600 hover:text-emerald-400 transition-colors"
            >−1</button>
            <button
              onClick={resetWeeklyCorruption}
              title="Nouvelle semaine : remet la capacité hebdomadaire à 0"
              className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400
                         hover:border-sky-600 hover:text-sky-400 transition-colors"
            >Nouvelle semaine</button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function TypeMasteryRow() {
  const { character, setSpellTypeMastery } = useCharacterStore()
  const typesUsed = Array.from(new Set(SPELLS.map((s) => s.type)))
    .sort((a, b) => SPELL_TYPES.indexOf(a) - SPELL_TYPES.indexOf(b))

  return (
    <Card>
      <SectionTitle>Maîtrise par type de sort</SectionTitle>
      <div className="space-y-2">
        {typesUsed.map((type) => (
          <div key={type} className="flex items-center justify-between gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_BADGE[type]}`}>{type}</span>
            <MasterySelect
              value={(character.sortTypeMastery ?? {})[type]}
              onChange={(lvl) => setSpellTypeMastery(type, lvl ?? '')}
            />
          </div>
        ))}
      </div>
    </Card>
  )
}

function SpellPowerRow({ power, def }: { power: PowerLevel; def: SpellDef['powers'][PowerLevel] }) {
  return (
    <div className="px-2.5 py-2 bg-[#111] rounded-lg border border-zinc-800/80">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold text-zinc-300">{POWER_LABELS[power]}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border
                           border-sky-900/60 text-sky-300 bg-sky-950/40">{def.peCost} PE</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border
                           border-purple-900/60 text-purple-300 bg-purple-950/40">{def.corruptionCost} corr.</span>
          {def.difficultyMod !== undefined && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border
                             border-zinc-700 text-zinc-400">
              DC {def.difficultyMod > 0 ? '+' : ''}{def.difficultyMod}
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] text-zinc-400 leading-relaxed">{def.effect}</p>
    </div>
  )
}

function SpellCard({ spell }: { spell: SpellDef }) {
  const { character, acquireSpell, removeSpell, setSpellMastery } = useCharacterStore()
  const [expanded, setExpanded] = useState(false)
  const isAcquired = (character.sortilegesAcquis ?? []).includes(spell.id)
  const mastery    = (character.sortMastery ?? {})[spell.id]

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          isAcquired ? 'bg-indigo-950/30' : 'bg-[#141414]'
        }`}
      >
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_BADGE[spell.type]}`}>
          {spell.type}
        </span>
        <p className={`flex-1 text-xs font-bold leading-tight truncate ${isAcquired ? 'text-indigo-300' : 'text-zinc-300'}`}>
          {spell.name}
        </p>
        <span className="text-[9px] text-zinc-500 shrink-0">{spell.difficulty}</span>
        <span className="text-zinc-600 text-[10px] shrink-0">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="px-3 py-2.5 space-y-2.5 bg-[#111]">
          <p className="text-[10px] text-zinc-500 italic leading-relaxed">{spell.description}</p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Réussite</span>
            <div className="flex items-center gap-2">
              {spell.url && (
                <a
                  href={spell.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700
                             text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                >↗ Notion</a>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-400">{spell.success}</p>

          <div className="space-y-1.5">
            {POWER_LEVELS.map((power) => (
              <SpellPowerRow key={power} power={power} def={spell.powers[power]} />
            ))}
          </div>

          {Object.keys(spell.mastery).length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Niveaux de maîtrise</span>
              {MASTERY_LEVELS.map((lvl) => spell.mastery[lvl] && (
                <p key={lvl} className="text-[10px] text-zinc-400">
                  <span className="font-bold text-zinc-300">{MASTERY_LABELS[lvl]} : </span>{spell.mastery[lvl]}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
            {isAcquired ? (
              <>
                <MasterySelect
                  value={mastery}
                  onChange={(lvl) => setSpellMastery(spell.id, lvl ?? '')}
                />
                <button
                  onClick={() => removeSpell(spell.id)}
                  className="text-[10px] px-2 py-0.5 rounded border border-zinc-800
                             text-zinc-600 hover:text-red-400 hover:border-red-900 transition-colors shrink-0"
                >Retirer</button>
              </>
            ) : (
              <button
                onClick={() => acquireSpell(spell.id)}
                className="w-full py-1 text-[10px] font-bold rounded border
                           border-indigo-800 text-indigo-400 hover:bg-indigo-950/40 transition-colors"
              >Apprendre</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function MagicTab() {
  const { character } = useCharacterStore()

  const fluxBase    = (character.skills ?? {})['flux-magiques'] ?? 0
  const fluxSources = getSkillBreakdown(fluxBase, character.dons ?? [], 'flux-magiques', 'Spécialisé')
  const fluxLvl     = fluxSources.reduce((s, src) => s + src.value, 0)

  const acquiredCount = (character.sortilegesAcquis ?? []).length

  return (
    <div className="space-y-3">
      <CorruptionCard />

      <Card>
        <SectionTitle>Lancer de sort</SectionTitle>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Chaque sortilège se lance par un jet de <span className="text-zinc-200 font-semibold">Maîtrise des Flux Magiques</span> (actuellement <span className="font-mono text-indigo-300">+{fluxLvl}</span>),
          modifié par la maîtrise du sort précis ({MASTERY_LEVELS.map((l) => `${MASTERY_LABELS[l]} ${SPELL_MASTERY_MOD[l] >= 0 ? '+' : ''}${SPELL_MASTERY_MOD[l]}`).join(' · ')})
          et la maîtrise de sa catégorie ({MASTERY_LEVELS.map((l) => `${MASTERY_LABELS[l]} +${TYPE_MASTERY_MOD[l]}`).join(' · ')}).
          Le résultat doit dépasser le seuil de réussite du sort. Les boutons de lancer rapide (coût PE + corruption appliqué automatiquement) sont dans l'onglet Combat.
        </p>
      </Card>

      <TypeMasteryRow />

      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Sortilèges connus</SectionTitle>
        </div>
        <p className="text-[10px] text-zinc-500 -mt-2 mb-2">{acquiredCount} / {SPELLS.length} appris</p>
        <div className="space-y-2">
          {SPELLS.map((spell) => <SpellCard key={spell.id} spell={spell} />)}
        </div>
      </Card>
    </div>
  )
}
