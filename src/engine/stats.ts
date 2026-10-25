import type { Character, StatBreakdown } from './types'
import type { DonBonuses } from './dons'
import { ITEMS_LIST } from './items'
import type { ItemDef } from './items'

/** PV maximum brut = 15 + constitution (les blessures ne changent PAS le max) */
export function calcHpBase(character: Character): number {
  return 15 + character.constitution
}

/**
 * Breakdown du max HP.
 * Intègre les bonus de dons (PV direct + bonus Constitution).
 */
export function calcHpMax(character: Character, donBonuses?: DonBonuses): StatBreakdown {
  const base   = 15
  const con    = character.constitution
  const conBonus = donBonuses?.characteristics?.constitution ?? 0
  const hpBonus  = donBonuses?.hp ?? 0

  const sources: StatBreakdown['sources'] = [
    { label: 'Base', value: base },
    { label: `Constitution (${con})`, value: con },
  ]

  if (conBonus !== 0) {
    sources.push({ label: `Constitution — dons (${conBonus > 0 ? '+' : ''}${conBonus})`, value: conBonus })
  }
  if (hpBonus !== 0) {
    sources.push({ label: `Dons — PV direct (${hpBonus > 0 ? '+' : ''}${hpBonus})`, value: hpBonus })
  }

  const total = base + con + conBonus + hpBonus
  const woundDeduction = character.wounds.reduce((s, w) => s + w.hpCost, 0)

  for (const w of character.wounds) {
    if (w.hpCost > 0) {
      sources.push({
        label: `${w.severity[0].toUpperCase() + w.severity.slice(1)} — ${w.description || '…'}`,
        value: -w.hpCost,
        info: true,
      })
    }
  }

  // Ajustement = écart entre les PV actuels et ce que les règles prévoient (max − blessures)
  const effectiveAdj = character.hpCurrent - (total - woundDeduction)
  if (effectiveAdj !== 0) {
    sources.push({ label: 'Ajustement manuel', value: effectiveAdj, info: true })
  }

  return { total, sources }
}

/** PE maximum = base + bonus Constitution (niv 2,4,7,13,18) + Dextérité (niv 6) + Force (niv 6) */
export function calcPeMax(character: Character, donBonuses?: DonBonuses): StatBreakdown {
  const peBase = 6

  const effectiveCon = character.constitution + (donBonuses?.characteristics?.constitution ?? 0)
  const effectiveDex = character.dexterite    + (donBonuses?.characteristics?.dexterite    ?? 0)
  const effectiveFor = character.force        + (donBonuses?.characteristics?.force        ?? 0)

  const sources: StatBreakdown['sources'] = [
    { label: 'Base', value: peBase },
  ]

  for (const lvl of [2, 4, 7, 13, 18]) {
    if (effectiveCon >= lvl) {
      sources.push({ label: `Constitution (niveau ${lvl})`, value: 1 })
    }
  }

  if (effectiveDex >= 6) {
    sources.push({ label: 'Dextérité (niveau 6)', value: 1 })
  }

  if (effectiveFor >= 6) {
    sources.push({ label: 'Force (niveau 6)', value: 1 })
  }

  const peBonus = donBonuses?.pe ?? 0
  if (peBonus !== 0) {
    sources.push({ label: `Dons — PE direct (${peBonus > 0 ? '+' : ''}${peBonus})`, value: peBonus })
  }

  return {
    total: sources.reduce((sum, s) => sum + s.value, 0),
    sources,
  }
}

/**
 * PE récupérés par tour (règle : 4 de base, +1 par palier de Constitution).
 * Constitution ≥ 5  → 5 PE/tour
 * Constitution ≥ 10 → 6 PE/tour
 * Constitution ≥ 15 → 7 PE/tour (+ 1 PV/tour à con ≥ 20, géré séparément)
 * Si PE négatifs au début du tour : la récupération est divisée par 2.
 */
export function calcPeRecovery(character: Character, donBonuses?: DonBonuses): number {
  const effectiveCon = character.constitution + (donBonuses?.characteristics?.constitution ?? 0)
  if (effectiveCon >= 15) return 7
  if (effectiveCon >= 10) return 6
  if (effectiveCon >= 5)  return 5
  return 4
}

export function calcFvMax(character: Character, donBonuses?: DonBonuses): StatBreakdown {
  const con      = character.constitution
  const conBonus = donBonuses?.characteristics?.constitution ?? 0
  const sources: StatBreakdown['sources'] = [
    { label: `Constitution (${con})`, value: con },
  ]
  if (conBonus !== 0) {
    sources.push({ label: `Constitution — dons (${conBonus > 0 ? '+' : ''}${conBonus})`, value: conBonus })
  }
  return { total: con + conBonus, sources }
}

export function calcInventoryPassiveBonuses(character: Character, items: ItemDef[] = ITEMS_LIST): {
  weightBonus: number
  moyenSlots: number
  grandSlots: number
} {
  const equippedIds = new Set([
    ...Object.values(character.equipped ?? {}),
    ...(character.equippedList ?? []),
  ])
  return (character.inventory ?? [])
    .filter((item) => equippedIds.has(item.id))
    .reduce(
      (acc, item) => {
        const def = items.find((d) => d.id === item.itemId)
        if (!def?.passiveEffect) return acc
        return {
          weightBonus: acc.weightBonus + (def.passiveEffect.weightBonus ?? 0) * item.quantity,
          moyenSlots:  acc.moyenSlots  + (def.passiveEffect.moyenSlots  ?? 0) * item.quantity,
          grandSlots:  acc.grandSlots  + (def.passiveEffect.grandSlots  ?? 0) * item.quantity,
        }
      },
      { weightBonus: 0, moyenSlots: 0, grandSlots: 0 }
    )
}

export function calcEncombrementMax(character: Character, items: ItemDef[] = ITEMS_LIST): StatBreakdown {
  const base = 15
  const sources: StatBreakdown['sources'] = [{ label: 'Base humain', value: base }]
  let total = base

  const equippedIds = new Set([
    ...Object.values(character.equipped ?? {}),
    ...(character.equippedList ?? []),
  ])

  for (const item of character.inventory ?? []) {
    if (!equippedIds.has(item.id)) continue
    const def = items.find((d) => d.id === item.itemId)
    if (!def?.passiveEffect?.weightBonus) continue
    const bonus = def.passiveEffect.weightBonus * item.quantity
    total += bonus
    sources.push({
      label: `${def.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`,
      value: bonus,
    })
  }

  return { total, sources }
}

/**
 * Bonus de Maîtrise (BM) = floor(niveau / 4), plafonné à 5.
 * S'ajoute aux dégâts de base de chaque attaque avec l'arme correspondante.
 *
 * | Niveau | BM |
 * | 0–3    |  0 |
 * | 4–7    |  1 |
 * | 8–11   |  2 |
 * | 12–15  |  3 |
 * | 16–19  |  4 |
 * | 20     |  5 |
 */
export function calcBM(skillLevel: number): number {
  return Math.floor(Math.min(skillLevel, 20) / 4)
}

export type BarColorScheme = 'hp' | 'pe' | 'hunger' | 'thirst' | 'stress' | 'fv' | 'encombrement' | 'corruption'

export function getBarColor(scheme: BarColorScheme, current: number, max: number): string {
  const ratio = max > 0 ? current / max : 0

  switch (scheme) {
    case 'hp':
      if (ratio > 0.6) return 'bg-red-600'
      if (ratio > 0.3) return 'bg-orange-500'
      return 'bg-red-900'

    case 'pe':
      if (ratio > 0.5) return 'bg-blue-500'
      if (ratio > 0.25) return 'bg-blue-400'
      return 'bg-blue-800'

    case 'hunger':
    case 'thirst':
      if (current >= 150) return 'bg-emerald-500'
      if (current >= 100) return 'bg-yellow-400'
      if (current >= 25)  return 'bg-orange-500'
      return 'bg-red-600'

    case 'stress':
      if (current <= 50)  return 'bg-emerald-500'
      if (current <= 100) return 'bg-yellow-400'
      if (current <= 150) return 'bg-orange-500'
      return 'bg-red-600'

    case 'fv':
      if (ratio <= 0.5)  return 'bg-emerald-500'
      if (ratio <= 0.75) return 'bg-yellow-400'
      if (ratio <= 1)    return 'bg-orange-500'
      return 'bg-red-600'

    case 'encombrement':
      if (current <= 10) return 'bg-emerald-500'
      if (current <= 15) return 'bg-yellow-400'
      if (current <= 20) return 'bg-orange-500'
      return 'bg-red-600'

    case 'corruption':
      if (current <= 10) return 'bg-emerald-500'
      if (current <= 20) return 'bg-yellow-400'
      if (current <= 40) return 'bg-orange-500'
      if (current <= 60) return 'bg-orange-700'
      if (current <= 80) return 'bg-red-600'
      return 'bg-purple-700'
  }
}

export function getStressThresholdLabel(stress: number): string | null {
  if (stress >= 200) return "CRITIQUE — risque d'arrêt cardiaque"
  if (stress >= 100) return 'Jet d\'effet de stress requis'
  return null
}

export function getFvEffectLabel(fv: number, effectiveConstitution: number): string | null {
  const half = Math.ceil(effectiveConstitution / 2)
  if (fv >= effectiveConstitution) return 'Épuisé — jet Constitution DC 14 / heure'
  if (fv >= half)                  return '-1 à tous les jets physiques'
  return null
}

export function getEncombrementEffectLabel(kg: number): string | null {
  if (kg > 20) return 'Immobilisé'
  if (kg > 15) return '-3 à tous les jets'
  if (kg > 10) return '-2 à tous les jets'
  if (kg > 5)  return '-1 Dextérité'
  return null
}
