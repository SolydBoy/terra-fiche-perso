/**
 * Conversion Notion API → ItemDef[].
 * Module 100% browser-compatible (pas d'API Node.js).
 * Utilisé à la fois par le script CLI (scripts/sync-items.ts)
 * et par le sync browser (src/lib/syncNotion.ts).
 */

import type { ItemDef, VolumeSize, ItemCategory, EquipmentSlot, ItemEffects, PassiveEffect, AttackDef } from '../engine/items'
import type { NotionProperties, NotionPageRow } from './notionTypes'

// ─── Mappings ─────────────────────────────────────────────────────────────────

const VOLUME_MAP: Record<string, VolumeSize> = {
  'Petit':       'petit',
  'Moyen':       'moyen',
  'Grand':       'grand',
  'Très Grand':  'très grand',
  'Très grand':  'très grand',
  'Très Grand ': 'très grand',
}

const ENCOMBREMENT_MAP: Record<string, VolumeSize> = {
  '':       'petit',
  'Léger':  'moyen',
  'Moyen':  'grand',
}

const PARTIE_TO_CATEGORY: Record<string, ItemCategory> = {
  'Armure':        'Armure',
  'Couvre-chef':   'Couvre-chef',
  'Haut':          'Haut',
  'Pantalon':      'Pantalon',
  'Chaussure':     'Chaussure',
  'Survêtement':   'Survêtement',
  'Veste':         'Veste',
  'Accessoire':    'Accessoire',
}

const CLOTHING_SLOT_MAP: Partial<Record<ItemCategory, EquipmentSlot>> = {
  'Couvre-chef': 'tête',
  'Haut':        'torse',
  'Pantalon':    'jambes',
  'Chaussure':   'pieds',
  'Veste':       'veste',
}

const TYPE_ARME_TO_SKILL: Record<string, string> = {
  'Petite masse': 'petite-masse',
  'Longue masse': 'longue-masse',
  'Grande masse': 'longue-masse',
  'Petite lame':  'petite-lame',
  'Longue lame':  'longue-lame',
  'Lance':        'lance',
  'Hache':        'hache',
  'Main nue':     'main-nue',
  'Distance':     'visee',
  'Rechargement': 'rechargement',
}

const UTILITE_TO_CAT: Record<string, ItemCategory> = {
  'Monnaie':           'Monnaie',
  'Nourriture':        'Nourriture',
  'Santé':             'Santé',
  'Munition':          'Munition',
  'Object de valeur':  'Object de valeur',
  "Element d'intéret": "Element d'intéret",
  'Lumière':           'Lumière',
  'Outils':            'Outils',
  'Craft':             'Craft',
  'Autre':             'Autre',
}

const TIER_ARMOR: Record<string, number> = {
  'T0': 1, 'T1': 2, 'T2': 3, 'T3': 4, 'T4': 5,
}

const STACKABLE_CATEGORIES = new Set<ItemCategory>(['Monnaie', 'Munition', 'Nourriture', 'Craft'])

// ─── Notion property helpers ──────────────────────────────────────────────────

function getTitle(props: NotionProperties, key = 'Nom'): string {
  return (props[key]?.title ?? []).map((i) => i.plain_text ?? '').join('').trim()
}

function getRichText(props: NotionProperties, key: string): string {
  return (props[key]?.rich_text ?? []).map((i) => i.plain_text ?? '').join('').trim()
}

function getSelect(props: NotionProperties, key: string): string {
  return (props[key]?.select?.name ?? '').trim()
}

function getMultiSelect(props: NotionProperties, key: string): string[] {
  return (props[key]?.multi_select ?? []).map((s) => (s.name ?? '').trim())
}

function getNumber(props: NotionProperties, key: string): number | null {
  return props[key]?.number ?? null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function notionPageUrl(pageId: string): string {
  return `https://www.notion.so/${pageId.replace(/-/g, '')}`
}

function parsePoids(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(',', '.').toLowerCase().replace('kg', '').trim()
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : val
}

interface ParsedEffets {
  effects?:        ItemEffects
  passiveEffect?:  PassiveEffect
  consumeEffect?:  import('../engine/items').ConsumableEffect
  statModifiers?:  Record<string, number>
  description?:    string
  damage?:         string
  effect?:         string
  damage5?:        string
  effect5?:        string
  damage10?:       string
  effect10?:       string
  peUseCost?:      number
  fatigueCost?:    number
  attacks?:        AttackDef[]
}

/**
 * Parse la colonne "Effets" (JSON texte) vers les interfaces d'effets.
 * Protocole namespaced :
 *   { "armor": 3 }                                     → effects.armor
 *   { "encombrement": { "weightBonus": 20, "moyenSlots": 3, "grandSlots": 1 } } → passiveEffect
 *   { "stats": { "dexterite": -1 } }                   → statModifiers
 */
function parseEffetsJson(raw: string): ParsedEffets {
  if (!raw.trim()) return {}
  // Normalise les guillemets typographiques que Notion peut insérer automatiquement
  const normalized = raw
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
  try {
    const p = JSON.parse(normalized) as Record<string, unknown>
    const result: ParsedEffets = {}

    const armorVal   = p.armor   ?? p.armure   ?? null
    const defenseVal = p.defense ?? p.défense  ?? null
    if (armorVal != null || defenseVal != null) {
      result.effects = {
        ...(armorVal   != null ? { armor:        Number(armorVal)   } : {}),
        ...(defenseVal != null ? { defenseBonus: Number(defenseVal) } : {}),
      }
    }

    if (p.encombrement != null && typeof p.encombrement === 'object') {
      const enc = p.encombrement as Record<string, unknown>
      const passive: PassiveEffect = {}
      // Accepte grandSlot ou grandSlots, moyenSlot ou moyenSlots
      const wb = enc.weightBonus
      const ms = enc.moyenSlots ?? enc.moyenSlot
      const gs = enc.grandSlots ?? enc.grandSlot
      if (wb != null) passive.weightBonus = Number(wb)
      if (ms != null) passive.moyenSlots  = Number(ms)
      if (gs != null) passive.grandSlots  = Number(gs)
      if (Object.keys(passive).length > 0) result.passiveEffect = passive
    }

    if (p.stats != null && typeof p.stats === 'object') {
      const mods: Record<string, number> = {}
      for (const [k, v] of Object.entries(p.stats as Record<string, unknown>)) {
        if (v != null) mods[k] = Number(v)
      }
      if (Object.keys(mods).length > 0) result.statModifiers = mods
    }

    // Dégâts arme — attaque unique (degats / damage, variantes +5 et +10)
    const d   = p.degats   ?? p.damage   ?? null
    const d5  = p.degats5  ?? p.damage5  ?? null
    const d10 = p.degats10 ?? p.damage10 ?? null
    if (d   != null) result.damage   = String(d)
    if (d5  != null) result.damage5  = String(d5)
    if (d10 != null) result.damage10 = String(d10)

    // Description textuelle de l'attaque (affichée au hover)
    const desc = p.description ?? p.desc ?? null
    if (desc != null) result.description = String(desc)

    // Effets textuels associés aux dégâts (saignement, étourdissement, etc.)
    const e   = p.effet   ?? p.effect   ?? null
    const e5  = p.effet5  ?? p.effect5  ?? null
    const e10 = p.effet10 ?? p.effect10 ?? null
    if (e   != null) result.effect   = String(e)
    if (e5  != null) result.effect5  = String(e5)
    if (e10 != null) result.effect10 = String(e10)

    // Coût PE/fatigue — attaque unique
    const flatPe  = p.pe  ?? p.peUseCost  ?? null
    const flatFat = p.fatigue ?? p.fatigueCost ?? null
    if (flatPe  != null) result.peUseCost   = Number(flatPe)
    if (flatFat != null) result.fatigueCost = Number(flatFat)

    // Plusieurs attaques nommées
    // Format: { "attaques": [{ "nom": "...", "degats": "...", "pe": N, "fatigue": N }] }
    const attaquesRaw = p.attaques ?? p.attacks ?? null
    if (Array.isArray(attaquesRaw)) {
      const attacks: AttackDef[] = (attaquesRaw as unknown[])
        .map((raw) => {
          const a = raw as Record<string, unknown>
          const atk: AttackDef = {}
          const nom  = a.nom ?? a.name ?? null
          const adesc = a.description ?? a.desc ?? null
          if (nom   != null) atk.name        = String(nom)
          if (adesc != null) atk.description = String(adesc)
          const ad   = a.degats   ?? a.damage   ?? null
          const ad5  = a.degats5  ?? a.damage5  ?? null
          const ad10 = a.degats10 ?? a.damage10 ?? null
          if (ad   != null) atk.damage   = String(ad)
          if (ad5  != null) atk.damage5  = String(ad5)
          if (ad10 != null) atk.damage10 = String(ad10)
          const ae   = a.effet   ?? a.effect   ?? null
          const ae5  = a.effet5  ?? a.effect5  ?? null
          const ae10 = a.effet10 ?? a.effect10 ?? null
          if (ae   != null) atk.effect   = String(ae)
          if (ae5  != null) atk.effect5  = String(ae5)
          if (ae10 != null) atk.effect10 = String(ae10)
          const ape  = a.pe  ?? a.peUseCost  ?? null
          const afat = a.fatigue ?? a.fatigueCost ?? null
          if (ape  != null) atk.peUseCost   = Number(ape)
          if (afat != null) atk.fatigueCost = Number(afat)
          return atk
        })
      if (attacks.length > 0) result.attacks = attacks
    }

    return result
  } catch {
    return {}
  }
}

// ─── Converters ───────────────────────────────────────────────────────────────

type ConvertResult = { item: ItemDef } | { skipped: { name: string; reason: string } }

function convertObject(row: NotionPageRow): ConvertResult {
  const props    = row.properties
  const notionId = row.id
  const name     = getTitle(props)

  if (!name) return { skipped: { name: '(vide)', reason: 'Nom vide' } }

  const weight      = getNumber(props, 'Poids')
  const volumeRaw   = getSelect(props, 'Volume')
  const typeObj     = getSelect(props, 'Type')
  const tier        = getSelect(props, 'Tier')
  const utilites    = getMultiSelect(props, 'Utilité')
  const description = getRichText(props, 'Description')

  const volume: VolumeSize = VOLUME_MAP[volumeRaw] ?? 'petit'

  let category: ItemCategory = 'Autre'
  for (const u of utilites) {
    if (UTILITE_TO_CAT[u]) { category = UTILITE_TO_CAT[u]; break }
  }

  const labels = [typeObj, tier, ...utilites].filter(Boolean)

  return {
    item: {
      id:       slugify(name),
      notionId,
      name,
      weight:   weight ?? 0.1,
      volume,
      category,
      labels,
      url:      notionPageUrl(notionId),
      ...(STACKABLE_CATEGORIES.has(category) ? { stackable: true } : {}),
      ...(description ? { description } : {}),
    },
  }
}

function convertVetement(row: NotionPageRow): ConvertResult {
  const props    = row.properties
  const notionId = row.id
  const name     = getTitle(props)

  if (!name) return { skipped: { name: '(vide)', reason: 'Nom vide' } }

  const weight       = getNumber(props, 'Poids')
  const encombrement = getSelect(props, 'Encombrement')
  const parties      = getMultiSelect(props, 'Partie du corps')
  const typeVet      = getSelect(props, 'Type')
  const tier         = getSelect(props, 'Tiers')
  const fx           = parseEffetsJson(getRichText(props, 'Effets'))

  const volume: VolumeSize = ENCOMBREMENT_MAP[encombrement] ?? 'petit'

  let category: ItemCategory = 'Haut'
  for (const p of parties) {
    if (PARTIE_TO_CATEGORY[p]) { category = PARTIE_TO_CATEGORY[p]; break }
  }

  const slot: EquipmentSlot | undefined = CLOTHING_SLOT_MAP[category]

  // Armure : colonne Effets en priorité, tier T0-T4 en fallback
  const effects: ItemEffects | undefined =
    fx.effects ?? (category === 'Armure' && tier && TIER_ARMOR[tier] !== undefined
      ? { armor: TIER_ARMOR[tier] }
      : undefined)

  const labels = [typeVet, tier, ...parties].filter(Boolean)

  return {
    item: {
      id:       slugify(name),
      notionId,
      name,
      weight:   weight ?? 0.5,
      volume,
      category,
      labels,
      url:      notionPageUrl(notionId),
      ...(slot              ? { slot }                            : {}),
      ...(effects           ? { effects }                         : {}),
      ...(fx.passiveEffect  ? { passiveEffect: fx.passiveEffect } : {}),
      ...(fx.statModifiers  ? { statModifiers: fx.statModifiers } : {}),
      ...(fx.consumeEffect  ? { consumeEffect: fx.consumeEffect } : {}),
    },
  }
}

function convertArme(row: NotionPageRow): ConvertResult {
  const props    = row.properties
  const notionId = row.id
  const name     = getTitle(props)

  if (!name) return { skipped: { name: '(vide)', reason: 'Nom vide' } }

  const poidsRaw      = getRichText(props, 'Poids')
  const weight        = parsePoids(poidsRaw)
  const volumes       = getMultiSelect(props, 'Volume')
  const volume: VolumeSize = (volumes[0] && VOLUME_MAP[volumes[0]]) ? VOLUME_MAP[volumes[0]] : 'moyen'
  const typeArme      = getSelect(props, "Type d'arme")
  const typeObj       = getSelect(props, 'Type')
  const tier          = getSelect(props, 'Tier')
  const combatSkillId = TYPE_ARME_TO_SKILL[typeArme]
  const labels        = [typeObj, tier, typeArme].filter(Boolean)
  const fx            = parseEffetsJson(getRichText(props, 'Effets'))

  return {
    item: {
      id:       slugify(name),
      notionId,
      name,
      weight:   weight ?? 1.0,
      volume,
      category: 'Arme',
      labels,
      url:      notionPageUrl(notionId),
      ...(combatSkillId   ? { combatSkillId }                     : {}),
      ...(fx.description  ? { description:  fx.description      } : {}),
      ...(fx.damage       ? { damage:       fx.damage           } : {}),
      ...(fx.effect       ? { effect:       fx.effect           } : {}),
      ...(fx.damage5      ? { damage5:      fx.damage5          } : {}),
      ...(fx.effect5      ? { effect5:      fx.effect5          } : {}),
      ...(fx.damage10     ? { damage10:     fx.damage10         } : {}),
      ...(fx.effect10     ? { effect10:     fx.effect10         } : {}),
      ...(fx.peUseCost    ? { peUseCost:    fx.peUseCost        } : {}),
      ...(fx.fatigueCost  ? { fatigueCost:  fx.fatigueCost      } : {}),
      ...(fx.attacks      ? { attacks:      fx.attacks          } : {}),
    },
  }
}

function convertMonnaie(row: NotionPageRow): ConvertResult {
  const props    = row.properties
  const notionId = row.id
  const name     = getTitle(props)

  if (!name) return { skipped: { name: '(vide)', reason: 'Nom vide' } }

  const system    = getSelect(props, 'Système monétaire')
  const valeur    = getNumber(props, 'Valeur')
  const volumeRaw = getSelect(props, 'Volume')
  const weight    = getNumber(props, 'Poid') // colonne Notion sans "s"
  const volume: VolumeSize = VOLUME_MAP[volumeRaw] ?? 'petit'

  return {
    item: {
      id:       slugify(name),
      notionId,
      name,
      weight:   weight ?? 0,
      volume,
      category: 'Monnaie',
      labels:   [system].filter(Boolean),
      stackable: true,
      url:      notionPageUrl(notionId),
      ...(system            ? { monetarySystem: system } : {}),
      ...(valeur != null    ? { monetaryValue: valeur  } : {}),
    },
  }
}

function convertSac(row: NotionPageRow): ConvertResult {
  const props    = row.properties
  const notionId = row.id
  const name     = getTitle(props)

  if (!name) return { skipped: { name: '(vide)', reason: 'Nom vide' } }

  const weight = parsePoids(getRichText(props, 'Poids Max'))
  const fx     = parseEffetsJson(getRichText(props, 'Effets'))

  return {
    item: {
      id:       slugify(name),
      notionId,
      name,
      weight:   weight ?? 2.0,
      volume:   'grand',
      category: 'Accessoire',
      labels:   ['contenant', 'sac'],
      slot:     'dos',
      url:      notionPageUrl(notionId),
      ...(fx.passiveEffect ? { passiveEffect: fx.passiveEffect } : {}),
      ...(fx.statModifiers ? { statModifiers: fx.statModifiers } : {}),
    },
  }
}

// ─── Deduplicate IDs ──────────────────────────────────────────────────────────

function deduplicateIds(items: ItemDef[]): ItemDef[] {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const count = seen.get(item.id) ?? 0
    seen.set(item.id, count + 1)
    if (count > 0 && item.notionId) {
      const shortId = item.notionId.replace(/-/g, '').slice(0, 6)
      return { ...item, id: `${item.id}-${shortId}` }
    }
    return item
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ConvertSkipped {
  section: string
  name:    string
  reason:  string
}

export interface ConvertAllResult {
  items:   ItemDef[]
  skipped: ConvertSkipped[]
}

export function convertAll(sections: {
  objects:   NotionPageRow[]
  vetements: NotionPageRow[]
  armes:     NotionPageRow[]
  sacs:      NotionPageRow[]
  monnaies:  NotionPageRow[]
}): ConvertAllResult {
  const converters: { label: string; rows: NotionPageRow[]; convert: (r: NotionPageRow) => ConvertResult }[] = [
    { label: 'Objets',    rows: sections.objects,   convert: convertObject   },
    { label: 'Vêtements', rows: sections.vetements, convert: convertVetement },
    { label: 'Armes',     rows: sections.armes,     convert: convertArme     },
    { label: 'Sacs',      rows: sections.sacs,      convert: convertSac      },
    { label: 'Monnaies',  rows: sections.monnaies,  convert: convertMonnaie  },
  ]

  const allItems:   ItemDef[]        = []
  const allSkipped: ConvertSkipped[] = []

  for (const { label, rows, convert } of converters) {
    for (const row of rows) {
      const result = convert(row)
      if ('item' in result) {
        allItems.push(result.item)
      } else {
        allSkipped.push({ section: label, ...result.skipped })
      }
    }
  }

  return { items: deduplicateIds(allItems), skipped: allSkipped }
}
