export type WoundSeverity = 'légère' | 'grave' | 'critique'

export interface Trait {
  id: string
  title: string
  effect: string
}

export interface Wound {
  id: string
  severity: WoundSeverity
  description: string
  treated: boolean
  hpCost: number   // PV retirés par cette blessure (paramétrable)
}

export interface ModifierSource {
  label: string
  value: number
  /** Affiché dans le popover mais ne compte PAS dans le total (ex: blessures sur hpCurrent) */
  info?: boolean
}

export interface StatBreakdown {
  total: number
  sources: ModifierSource[]
}

export interface NoteSection {
  id: string
  category: string
  content: string
}

export interface JournalEntry {
  id: string
  title: string    // ex: "Session 3 — 12 Fév"
  content: string
  category?: string
}

export interface QuestEntry {
  id: string
  title: string
  done: boolean
  notes: string
  pinned?: boolean
  category?: string
}

export type ContactRelation = 'allié' | 'neutre' | 'ennemi' | 'inconnu'

export interface ContactEntry {
  id: string
  name: string
  relation: ContactRelation
  notes: string
  category?: string
}

export type LocationType = 'lieu' | 'bâtiment' | 'ville' | 'région' | 'pays' | 'autre'

export interface LocationEntry {
  id: string
  name: string
  type: LocationType
  notes: string
  category?: string
}

export interface FactionEntry {
  id: string
  name: string
  notes: string
  category?: string
}

export interface InventoryItem {
  id: string        // instance unique (Date.now())
  itemId: string    // ref vers ItemDef.id
  quantity: number  // toujours >= 1
  notes?: string    // note libre
}

export interface Character {
  firstName: string
  lastName: string
  portrait?: string   // base64 data URL
  quickNote: string
  // Niveaux de caractéristiques (1–20)
  constitution: number
  force: number
  dexterite: number
  intelligence: number
  sagesse: number
  charisme: number
  // Base PE (avant les bonus de caractéristiques)
  peBase: number
  // État courant
  hpCurrent: number
  hpUserAdjust: number   // delta cumulé des ajustements manuels (affiché dans le détail)
  peCurrent: number
  faim: number        // 0–200
  soif: number        // 0–200
  stress: number      // 0–200
  fv: number          // fatigue de voyage (0 → constitution)
  corruption: number            // 0–100, cumul permanent
  corruptionWeeklyUsed: number  // points de corruption dépensés cette semaine (remis à 0 manuellement)
  armure: number      // valeur d'armure de base (sans équipement)
  equipped: Partial<Record<import('./items').EquipmentSlot, string>>  // slot exclusif → instance id
  equippedList?: string[]  // instances équipées sans slot (armure, survêtement, accessoire)
  objetsMoyens: number
  objetsMoyensMax: number
  objetsGrands: number
  objetsGrandsMax: number
  objetsTresGrands: number
  objetsTresGrandsMax: number
  wounds: Wound[]
  skills: Record<string, number>  // skillId → niveau
  traits: Trait[]
  traitsCaractere?: Trait[]
  dons: string[]                  // donId → référence vers DONS_LIST
  inventory: InventoryItem[]
  techniquesAcquises: string[]    // techniqueId → référence vers TECHNIQUES
  techniquePeCosts: Record<string, number>  // techniqueId → coût PE personnalisé
  sortilegesAcquis: string[]            // sortId → référence vers SPELLS
  sortMastery: Record<string, string>   // sortId → niveau de maîtrise du sort (MasteryLevel)
  sortTypeMastery: Record<string, string>  // SpellType → niveau de maîtrise de la catégorie (MasteryLevel)
  famillesChoisies: string[]   // familles choisies globalement : index 0 = principale, index 1 = secondaire (niv 9+)
  // Favoris (compétences et capacités épinglées) — IDs: 's:skillId' ou 'a:charKey:level'
  favorites?: string[]
  // Ordre manuel des groupes de catégories, par onglet
  categoryOrder?: Partial<Record<'journal' | 'quetes' | 'lieux' | 'factions', string[]>>
  // Notes libres
  notes: string
  notesSections?: NoteSection[]
  journal: JournalEntry[]
  quetes: QuestEntry[]
  contacts: ContactEntry[]
  lieux: LocationEntry[]
  factions: FactionEntry[]
}
