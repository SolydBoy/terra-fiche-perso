/**
 * Source de vérité des items.
 * Priorité : localStorage (dernier sync browser) > items.json (bundlé au build).
 */

import rawData from '../data/items.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VolumeSize = 'petit' | 'moyen' | 'grand' | 'très grand'

export type ItemCategory =
  | 'Monnaie'
  | 'Arme'
  | 'Couvre-chef' | 'Haut' | 'Pantalon' | 'Chaussure' | 'Veste'
  | 'Survêtement' | 'Armure' | 'Accessoire'
  | 'Nourriture' | 'Santé' | 'Munition'
  | 'Object de valeur' | 'Outils' | 'Craft'
  | 'Lumière' | "Element d'intéret" | 'Autre'

export type EquipmentSlot = 'tête' | 'torse' | 'jambes' | 'pieds' | 'mains' | 'veste' | 'dos'

/** Catégories avec slot exclusif (un seul item équipé à la fois) */
export const CLOTHING_SLOT: Partial<Record<ItemCategory, EquipmentSlot>> = {
  'Couvre-chef': 'tête',
  'Haut':        'torse',
  'Pantalon':    'jambes',
  'Chaussure':   'pieds',
  'Veste':       'veste',
}

/** Catégories pouvant avoir plusieurs items équipés simultanément */
export const MULTI_EQUIP_CATEGORIES = new Set<ItemCategory>(['Armure', 'Survêtement', 'Accessoire'])

export interface ItemEffects {
  armor?:        number
  defenseBonus?: number
}

export interface PassiveEffect {
  weightBonus?: number
  moyenSlots?:  number
  grandSlots?:  number
}

export interface ConsumableEffect {
  hp?:     number
  faim?:   number
  soif?:   number
  stress?: number
}

/** Une attaque nommée avec ses propres coûts PE/fatigue */
export interface AttackDef {
  name?:        string
  description?: string
  damage?:      string
  effect?:      string
  damage5?:     string
  effect5?:     string
  damage10?:    string
  effect10?:    string
  peUseCost?:   number
  fatigueCost?: number
}

export interface ItemDef {
  id:             string
  notionId?:      string
  name:           string
  weight:         number
  volume:         VolumeSize
  category:       ItemCategory
  labels:         string[]
  description?:   string
  stackable?:     boolean
  slot?:          EquipmentSlot
  effects?:       ItemEffects
  combatSkillId?: string
  damage?:        string
  effect?:        string
  damage5?:       string
  effect5?:       string
  damage10?:      string
  effect10?:      string
  /** PE dépensés pour déclencher l'attaque (attaque unique) */
  peUseCost?:     number
  /** Fatigue générée par l'attaque (attaque unique) */
  fatigueCost?:   number
  /** Plusieurs attaques nommées — prend le dessus sur damage/peUseCost/fatigueCost */
  attacks?:       AttackDef[]
  consumeEffect?:   ConsumableEffect
  passiveEffect?:   PassiveEffect
  statModifiers?:   Record<string, number>
  monetarySystem?:  string
  monetaryValue?:  number
  url?:            string
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Arme',
  'Couvre-chef', 'Haut', 'Pantalon', 'Chaussure', 'Veste',
  'Survêtement', 'Armure', 'Accessoire',
  'Nourriture', 'Santé', 'Munition',
  'Object de valeur', 'Outils', 'Craft',
  'Lumière', "Element d'intéret", 'Autre',
  'Monnaie',
]

// ─── Data — localStorage > items.json bundlé ─────────────────────────────────

export function loadItems(): ItemDef[] {
  try {
    const raw = localStorage.getItem('notion_items_cache')
    if (raw) {
      const { items } = JSON.parse(raw) as { items: ItemDef[] }
      if (Array.isArray(items) && items.length > 0) return items
    }
  } catch { /* ignore */ }
  return (rawData as unknown as { items: ItemDef[] }).items
}

export const ITEMS_LIST: ItemDef[] = loadItems()
