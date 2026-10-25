/**
 * Sortilèges et corruption — transcrit depuis la page Notion "La Magie et les Pouvoirs".
 * Catalogue réduit (5 sorts) : pas de sync Notion pour l'instant, données saisies à la main.
 */

export type SpellType = 'Basique' | 'Tonnerre' | 'Vent' | 'Terre' | 'Eau' | 'Feu' | 'Realité' | 'Soins'
export type SpellDifficulty = 'Très simple' | 'Simple' | 'Normal' | 'Complèxe' | 'Très complèxe'
export type PowerLevel = 'faible' | 'normal' | 'fort'
export type MasteryLevel = 'débutant' | 'maîtrisé' | 'expert'

export interface SpellPowerDef {
  effect: string
  peCost: number
  corruptionCost: number
  /** Modificateur du seuil de réussite (Niveau de difficulté), pas du jet lui-même */
  difficultyMod?: number
}

export interface SpellDef {
  id: string
  name: string
  type: SpellType
  difficulty: SpellDifficulty
  description: string
  /** Seuil(s) de réussite — texte brut car parfois conditionnel (ex: selon la cible) */
  success: string
  powers: Record<PowerLevel, SpellPowerDef>
  mastery: Partial<Record<MasteryLevel, string>>
  url?: string
}

export const SPELL_TYPES: SpellType[] = ['Basique', 'Tonnerre', 'Vent', 'Terre', 'Eau', 'Feu', 'Realité', 'Soins']
export const SPELL_DIFFICULTIES: SpellDifficulty[] = ['Très simple', 'Simple', 'Normal', 'Complèxe', 'Très complèxe']
export const POWER_LEVELS: PowerLevel[] = ['faible', 'normal', 'fort']
export const MASTERY_LEVELS: MasteryLevel[] = ['débutant', 'maîtrisé', 'expert']

export const POWER_LABELS: Record<PowerLevel, string> = {
  faible: 'Faible',
  normal: 'Normal',
  fort:   'Fort',
}

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  'débutant': 'Débutant',
  'maîtrisé': 'Maîtrisé',
  'expert':   'Expert',
}

/** Malus/bonus au jet selon la maîtrise du sort précis : débutant -5, maîtrisé -2, expert +1 */
export const SPELL_MASTERY_MOD: Record<MasteryLevel, number> = {
  'débutant': -5,
  'maîtrisé': -2,
  'expert':    1,
}

/** Bonus au jet selon la maîtrise du type de sort (catégorie) : débutant 0, maîtrisé +1, expert +2 */
export const TYPE_MASTERY_MOD: Record<MasteryLevel, number> = {
  'débutant': 0,
  'maîtrisé': 1,
  'expert':   2,
}

/** Capacité de corruption hebdomadaire = 5 + Sagesse */
export function calcCorruptionCapacity(sagesse: number): number {
  return 5 + sagesse
}

export interface CorruptionTier {
  min: number
  max: number
  label: string
  mechanical: string | null
}

export const CORRUPTION_TIERS: CorruptionTier[] = [
  { min: 0,  max: 10,  label: 'Imperceptible', mechanical: null },
  { min: 11, max: 20,  label: 'Légère',        mechanical: null },
  { min: 21, max: 40,  label: 'Modérée',       mechanical: '+10% de puissance aux sortilèges faibles' },
  { min: 41, max: 60,  label: 'Élevée',        mechanical: '+20% de puissance aux sortilèges puissants · 10% de risque de blessure modérée' },
  { min: 61, max: 80,  label: 'Sévère',        mechanical: '+25% de puissance · 20% de risque de blessure grave' },
  { min: 81, max: 100, label: 'Extrême',       mechanical: '+30% de puissance · 30% de risque de blessure/malédiction catastrophique' },
]

export function getCorruptionTier(value: number): CorruptionTier {
  return CORRUPTION_TIERS.find((t) => value >= t.min && value <= t.max) ?? CORRUPTION_TIERS[CORRUPTION_TIERS.length - 1]
}

export const SPELLS: SpellDef[] = [
  {
    id: 'detection-magique',
    name: 'Détection Magique',
    type: 'Basique',
    difficulty: 'Très simple',
    description: `Ce sortilège permet au sorcier de percevoir les traces de magie autour de lui, révélant les objets, personnes ou lieux imprégnés d'énergie magique. Utilisé pour repérer des enchantements, des maléfices ou des sources d'énergie magique cachées, ce sort est particulièrement utile pour les enquêteurs magiques ou pour déceler des pièges ensorcelés. Pour lancer ce sort, le sorcier doit fermer les yeux et se concentrer sur son environnement immédiat.`,
    success: 'Présence magique faible : 8 · moyenne : 10 · forte : 12 · cachée ou masquée : 14',
    powers: {
      faible: { effect: 'Détecte les sources magiques dans un rayon de 5 mètres pour une durée de 10 secondes.', peCost: 1, corruptionCost: 1 },
      normal: { effect: 'Détecte les sources magiques dans un rayon de 15 mètres pour une durée de 1 minute.', peCost: 2, corruptionCost: 2 },
      fort:   { effect: 'Détecte les sources magiques dans un rayon de 30 mètres pour une durée de 10 minutes. Permet de distinguer la nature de la magie détectée (maléfique, bénéfique, élémentaire, etc.).', peCost: 4, corruptionCost: 3, difficultyMod: -1 },
    },
    mastery: {
      'débutant': 'Peut détecter des sources magiques évidentes, comme des objets fortement enchantés ou des sorts actifs.',
      'maîtrisé': 'Peut identifier des enchantements subtils et détecter des sources magiques dissimulées. Gagne le trait Détection Magique passive.',
      'expert':   'Peut distinguer des types de magie complexes et identifier des signatures magiques spécifiques. Gagne le trait Détection Magique passive supérieur.',
    },
    url: 'https://www.notion.so/990d4a2602834f7d8fcdc9276e16b4ec',
  },
  {
    id: 'le-pas-en-arriere',
    name: 'Le pas en arrière',
    type: 'Realité',
    difficulty: 'Simple',
    description: `En manipulant simplement les fils du temps, ce sort permet au sorcier de redonner de l'énergie à un allié, en ramenant son cœur une fraction de seconde dans le passé. Particulièrement utile lors de combats prolongés ou d'activités exténuantes. Pour le lancer, tendre la main vers la cible et pouvoir la voir derrière sa main.`,
    success: '10',
    powers: {
      faible: { effect: 'Restaure 2 PE.', peCost: 1, corruptionCost: 1 },
      normal: { effect: "Annule une des dernières actions du joueur.", peCost: 2, corruptionCost: 2 },
      fort:   { effect: "Restaure 1 PE et annule une des dernières actions du joueur.", peCost: 2, corruptionCost: 3, difficultyMod: -1 },
    },
    mastery: {
      'expert': '+1 PE restauré.',
    },
    url: 'https://www.notion.so/7e74c57b763344ef967013e20d22412f',
  },
  {
    id: 'stase',
    name: 'Stase',
    type: 'Realité',
    difficulty: 'Normal',
    description: `Ce sortilège permet au sorcier de figer un objet dans le temps, le rendant immobile et insensible aux effets du vieillissement ou de la détérioration. Souvent utilisé pour préserver des objets de grande valeur ou stabiliser des structures en danger. Une force touchant l'objet figé annule le sort, sauf si le sorcier lance un sort sur cet objet également.`,
    success: 'Quantité de mouvement faible : 9 · moyenne : 11 · grande : 13 · énorme : 15',
    powers: {
      faible: { effect: "Fige l'objet pour une durée de 10 secondes.", peCost: 2, corruptionCost: 1 },
      normal: { effect: "Fige l'objet dans un rayon de 10 mètres.", peCost: 2, corruptionCost: 2 },
      fort:   { effect: "Fige l'objet pour une durée d'1 heure.", peCost: 2, corruptionCost: 4, difficultyMod: -1 },
    },
    mastery: {
      'débutant': "Peut uniquement figer des objets de taille très réduite ou des parties d'objets.",
      'maîtrisé': 'Peut figer des objets de taille moyenne.',
      'expert':   'Peut figer des structures de grande taille.',
    },
    url: 'https://www.notion.so/207bf947020d41dca8e1ce288b42b73a',
  },
  {
    id: 'fracture-de-la-realite',
    name: 'Fracture de la réalité',
    type: 'Realité',
    difficulty: 'Normal',
    description: `Fracture de la réalité déchire la trame même de la réalité immédiate de la cible, l'exposant momentanément aux forces brutes et chaotiques de l'Empyréen, qui lui infligent des dégâts et peuvent la désorienter. La faille peut être ouverte au maximum à 5 mètres.`,
    success: '11',
    powers: {
      faible: { effect: "Déchirure fugace et localisée sur une cible unique, infligeant 1d6 dégâts. La cible doit réussir un jet de Sagesse supérieur au lancé du mage pour éviter d'être étourdie jusqu'à son prochain tour.", peCost: 2, corruptionCost: 3 },
      normal: { effect: "Faille plus intense qui bloque la cible et le mage pendant un tour (si le mage n'est pas touché pendant cette durée), infligeant 1d7 puis 1d7 supplémentaires si le sort va jusqu'au bout. La cible doit réussir un jet de Sagesse supérieur au lancé du mage pour éviter d'être étourdie jusqu'à son prochain tour.", peCost: 3, corruptionCost: 4, difficultyMod: 1 },
      fort:   { effect: "Rupture grave de la réalité sur 5m² : les personnages dans la zone sont bloqués 2 tours, infligeant 1d8 initial puis 1d8 par tour bloqué. La cible doit réussir un jet de Sagesse supérieur au lancé du mage pour éviter d'être étourdie ; un écart de 5 fait tomber la cible au sol.", peCost: 4, corruptionCost: 5, difficultyMod: 3 },
    },
    mastery: {
      'débutant': "+1 au coût d'endurance.",
      'maîtrisé': '+1 à la réussite.',
      'expert':   'Peut engloutir une personne de plus en puissance forte.',
    },
    url: 'https://www.notion.so/135abc3abb3a800f9710d1506e6677f5',
  },
  {
    id: 'sortilege-de-soins',
    name: 'Sortilège de Soins',
    type: 'Soins',
    difficulty: 'Simple',
    description: `Ce sortilège canalise les énergies curatives de l'Empyréen pour restaurer la santé physique et mentale. Il permet d'accélérer la récupération naturelle et même de refermer les blessures. Pour le lancer, le sorcier a simplement besoin de poser la main sur la cible et de se concentrer un instant.`,
    success: '10',
    powers: {
      faible: { effect: 'Lors du prochain repos : +1 blessure légère soignée, +1 blessure moyenne soignée.', peCost: 1, corruptionCost: 1 },
      normal: { effect: 'Lors du prochain repos : +2 blessures légères, +2 blessures moyennes, +1 blessure grave.', peCost: 2, corruptionCost: 2 },
      fort:   { effect: 'Lors du prochain repos : +2 blessures légères, +1 blessure moyenne, +1 blessure grave, et 1d2 de soins directement.', peCost: 2, corruptionCost: 3, difficultyMod: -1 },
    },
    mastery: {
      'expert': 'Fort et normal : +1d2 de soins supplémentaires.',
    },
    url: 'https://www.notion.so/ffb3cddbf0d549e48660513b68e56ffa',
  },
]
