/**
 * Conversion des bases Notion Techniques & Familles → types internes.
 * 100% browser-compatible.
 */

import { slugify } from './notionConvert'
import type { TechniqueDef, TechniqueCategory } from '../engine/techniques'
import type { NotionProperties, NotionPageRow } from './notionTypes'

// ─── Types publics ─────────────────────────────────────────────────────────────

export interface FamilleDef {
  id:         string
  notionId:   string
  name:       string
  styles:     string[]      // Style multi-select (Duel, Support, Controle…)
  weaponTypes: string[]     // Type multi-select (Longue Lame, Hache…)
  naturelle:  boolean       // Déblocable naturellement = "Oui"
  divinite?:  string        // Divinité (select) — familles divines uniquement
  url:        string
}

/** TechniqueDef enrichie des champs spécifiques au fetch Notion */
export interface SyncedTechniqueDef extends TechniqueDef {
  notionId?:       string
  prereqText?:     string    // Prérequis en texte brut
  weaponTypeNames?: string[] // Type d'arme (noms Notion d'origine)
}

// ─── Mappings ──────────────────────────────────────────────────────────────────

const WEAPON_TYPE_TO_SKILL: Record<string, string> = {
  'Visé':         'visee',
  'Lance':        'lance',
  'Lanche':       'lance',      // typo dans Notion
  'Petite Masse': 'petite-masse',
  'Grande Masse': 'longue-masse',
  'Longue Masse': 'longue-masse',
  'Hache':        'hache',
  'Petite Lame':  'petite-lame',
  'Longue Lame':  'longue-lame',
  'Main Nue':     'main-nue',
  'Rechargement': 'rechargement',
}

const RANK_TO_CATEGORY: Record<string, TechniqueCategory> = {
  'Novice':        'Novice',
  'Adepte':        'Adepte',
  'Professionnel': 'Professionnel',
  'Maitre':        'Maître', // l'option Notion "Rang" est sans accent circonflexe
}

// ─── Helpers Notion ────────────────────────────────────────────────────────────

function getTitle(props: NotionProperties): string {
  return (props['Nom']?.title ?? []).map((i) => i.plain_text ?? '').join('').trim()
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

function notionPageUrl(pageId: string): string {
  return `https://www.notion.so/${pageId.replace(/-/g, '')}`
}

function parsePeCost(coutFatigue: string): number | undefined {
  const match = coutFatigue.match(/(\d+)\s*PE/i)
  return match ? parseInt(match[1], 10) : undefined
}

function parseFatigueCost(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:fatigue|f\b)/i)
  return match ? parseInt(match[1], 10) : undefined
}

// ─── Convertisseurs ────────────────────────────────────────────────────────────

export function convertFamilleRow(row: NotionPageRow): FamilleDef | null {
  const props   = row.properties
  const name    = getTitle(props)
  if (!name) return null

  const styles      = getMultiSelect(props, 'Style')
  const weaponTypes = getMultiSelect(props, 'Type')
  const debloquable = getSelect(props, 'Déblocable naturellement')
  const divinite    = getSelect(props, 'Divinité')

  return {
    id:          slugify(name),
    notionId:    row.id,
    name,
    styles,
    weaponTypes,
    naturelle:   debloquable === 'Oui',
    divinite:    divinite || undefined,
    url:         notionPageUrl(row.id),
  }
}

export function convertTechniqueRow(row: NotionPageRow): SyncedTechniqueDef | null {
  const props = row.properties
  const name  = getTitle(props)
  if (!name) return null

  const rang     = getSelect(props, 'Rang')
  const category: TechniqueCategory = RANK_TO_CATEGORY[rang] ?? 'Novice'

  const family = getRichText(props, 'Famille').trim()
  if (!family) return null

  const weaponTypeNames = getMultiSelect(props, "Type d'arme")

  // skillId : un seul type → skill précis ; plusieurs → général
  let skillId = 'général'
  if (weaponTypeNames.length === 1) {
    skillId = WEAPON_TYPE_TO_SKILL[weaponTypeNames[0]] ?? 'général'
  }

  const coutFatigue = getRichText(props, 'Coût et Fatigue')
  const peCost      = parsePeCost(coutFatigue)
  const fatigueCost = parseFatigueCost(coutFatigue)

  const type: TechniqueDef['type'] = peCost !== undefined ? 'technique' : 'passif'

  const description  = getRichText(props, 'Description')
  const effect       = getRichText(props, 'Effet')
  const prereqText   = getRichText(props, 'Prérequis')

  return {
    id:              slugify(name),
    notionId:        row.id,
    skillId,
    name,
    category,
    type,
    family,
    description,
    effect:          effect     || undefined,
    peCost,
    fatigueCost,
    prereqText:      prereqText || undefined,
    weaponTypeNames: weaponTypeNames.length > 0 ? weaponTypeNames : undefined,
    url:             notionPageUrl(row.id),
  }
}
