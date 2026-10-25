// ─── Configuration des dons disponibles ────────────────────────────────────────
// Modifier cette liste pour ajouter / retirer / changer des dons.
// Les champs `mechanics` sont optionnels : s'ils sont absents, le don n'a
// pas d'effet mécanique automatique (effet narratif uniquement).

import { SKILLS } from './skills'
import type { SkillCategory } from './skills'

// ─── Types d'effets mécaniques ─────────────────────────────────────────────────

export type CharField =
  | 'force'
  | 'dexterite'
  | 'constitution'
  | 'intelligence'
  | 'sagesse'
  | 'charisme'

export type DonEffect =
  | { type: 'hp';            value: number }                              // bonus direct au max PV
  | { type: 'pe';            value: number }                              // bonus direct au max PE
  | { type: 'armure';        value: number }                              // bonus direct à l'armure
  | { type: 'characteristic'; field: CharField; value: number }           // modifie une caract.
  | { type: 'skill';         skillId: string; value: number }             // modifie une compétence
  | { type: 'skillCategory'; category: SkillCategory; value: number }    // modifie toute une catégorie

export interface DonDef {
  id: string
  name: string
  effect: string           // description lisible par l'humain
  mechanics?: DonEffect[]  // effets mécaniques appliqués automatiquement
}

// ─── Bonus agrégés (résultat du calcul) ───────────────────────────────────────

export interface DonBonuses {
  hp: number
  pe: number
  armure: number
  characteristics: Partial<Record<CharField, number>>
  skills: Record<string, number>   // skillId → bonus total
}

// ─── Liste des dons ────────────────────────────────────────────────────────────

export const DONS_LIST: DonDef[] = [
  {
    id: 'robuste',
    name: 'Robuste',
    effect: '+3 PV maximum',
    mechanics: [{ type: 'hp', value: 3 }],
  },
  {
    id: 'endurant',
    name: 'Endurant',
    effect: '+2 PE maximum',
    mechanics: [{ type: 'pe', value: 2 }],
  },
  {
    id: 'vigilant',
    name: 'Vigilant',
    effect: '+2 en Perception',
    mechanics: [{ type: 'skill', skillId: 'perception', value: 2 }],
  },
  {
    id: 'combattant',
    name: 'Combattant',
    effect: '+1 aux jets d\'attaque au corps à corps (narratif)',
  },
  {
    id: 'tireur',
    name: 'Tireur d\'élite',
    effect: '+1 aux jets d\'attaque à distance (narratif)',
  },
  {
    id: 'discret',
    name: 'Discret',
    effect: '+2 en Furtivité',
    mechanics: [{ type: 'skill', skillId: 'furtivite', value: 2 }],
  },
  {
    id: 'premiers-soins',
    name: 'Premiers secours',
    effect: '+2 en Premiers Secours, peut stabiliser sans matériel',
    mechanics: [{ type: 'skill', skillId: 'premiers-secours', value: 2 }],
  },
  {
    id: 'survivant',
    name: 'Survivant',
    effect: '+2 en Survie',
    mechanics: [{ type: 'skill', skillId: 'survie', value: 2 }],
  },
  {
    id: 'constitution-don',
    name: 'Résistance',
    effect: '+2 Constitution',
    mechanics: [{ type: 'characteristic', field: 'constitution', value: 2 }],
  },
  {
    id: 'diplomate',
    name: 'Diplomate',
    effect: '+2 en Persuasion et Négociation',
    mechanics: [
      { type: 'skill', skillId: 'persuasion', value: 2 },
      { type: 'skill', skillId: 'negociation', value: 2 },
    ],
  },
  {
    id: 'reflexes',
    name: 'Réflexes vifs',
    effect: '+2 Dextérité',
    mechanics: [{ type: 'characteristic', field: 'dexterite', value: 2 }],
  },
  {
    id: 'macgyver',
    name: 'MacGyver',
    effect: '+1 à toutes les compétences d\'Artisanat',
    mechanics: [{ type: 'skillCategory', category: 'Artisanat', value: 1 }],
  },
  {
    id: 'memoire',
    name: 'Mémoire parfaite',
    effect: '+2 Intelligence',
    mechanics: [{ type: 'characteristic', field: 'intelligence', value: 2 }],
  },
  {
    id: 'sangfroid',
    name: 'Sang-froid',
    effect: 'Réduit de 10 pts le stress reçu par événement (narratif)',
  },
  {
    id: 'analphabete',
    name: 'Analphabète',
    effect: '-3 Intelligence',
    mechanics: [{ type: 'characteristic', field: 'intelligence', value: -3 }],
  },
  {
    id: 'force-brute',
    name: 'Force brute',
    effect: '+2 Force',
    mechanics: [{ type: 'characteristic', field: 'force', value: 2 }],
  },
  {
    id: 'medecin-de-guerre',
    name: 'Médecin de guerre',
    effect: '+2 à toutes les compétences Médicales',
    mechanics: [{ type: 'skillCategory', category: 'Médical', value: 2 }],
  },
  {
    id: 'charmeur',
    name: 'Charmeur',
    effect: '+2 Charisme',
    mechanics: [{ type: 'characteristic', field: 'charisme', value: 2 }],
  },
]

// ─── Détail source par source (pour les tooltips) ────────────────────────────

export interface BreakdownSource {
  label: string
  value: number
}

/** Retourne le détail de ce qui compose la valeur effective d'une caractéristique. */
export function getCharBreakdown(
  base: number,
  acquiredDonIds: string[],
  field: CharField
): BreakdownSource[] {
  const sources: BreakdownSource[] = [{ label: 'Points joueur', value: base }]
  for (const id of acquiredDonIds) {
    const don = DONS_LIST.find((d) => d.id === id)
    if (!don?.mechanics) continue
    for (const effect of don.mechanics) {
      if (effect.type === 'characteristic' && effect.field === field) {
        sources.push({ label: don.name, value: effect.value })
      }
    }
  }
  return sources
}

/** Retourne le détail de ce qui compose le niveau effectif d'une compétence. */
export function getSkillBreakdown(
  base: number,
  acquiredDonIds: string[],
  skillId: string,
  skillCategory: SkillCategory
): BreakdownSource[] {
  const sources: BreakdownSource[] = [{ label: 'Points joueur', value: base }]
  for (const id of acquiredDonIds) {
    const don = DONS_LIST.find((d) => d.id === id)
    if (!don?.mechanics) continue
    for (const effect of don.mechanics) {
      if (
        (effect.type === 'skill' && effect.skillId === skillId) ||
        (effect.type === 'skillCategory' && effect.category === skillCategory)
      ) {
        sources.push({ label: don.name, value: effect.value })
      }
    }
  }
  return sources
}

// ─── Calcul des bonus agrégés ─────────────────────────────────────────────────

export function computeDonBonuses(acquiredDonIds: string[]): DonBonuses {
  const bonuses: DonBonuses = { hp: 0, pe: 0, armure: 0, characteristics: {}, skills: {} }

  for (const id of acquiredDonIds) {
    const don = DONS_LIST.find((d) => d.id === id)
    if (!don?.mechanics) continue

    for (const effect of don.mechanics) {
      switch (effect.type) {
        case 'hp':
          bonuses.hp += effect.value
          break
        case 'pe':
          bonuses.pe += effect.value
          break
        case 'armure':
          bonuses.armure += effect.value
          break
        case 'characteristic':
          bonuses.characteristics[effect.field] =
            (bonuses.characteristics[effect.field] ?? 0) + effect.value
          break
        case 'skill':
          bonuses.skills[effect.skillId] =
            (bonuses.skills[effect.skillId] ?? 0) + effect.value
          break
        case 'skillCategory':
          for (const skill of SKILLS) {
            if (skill.category === effect.category) {
              bonuses.skills[skill.id] =
                (bonuses.skills[skill.id] ?? 0) + effect.value
            }
          }
          break
      }
    }
  }

  return bonuses
}

export function mergeBonuses(a: DonBonuses, b: DonBonuses): DonBonuses {
  const characteristics: Partial<Record<CharField, number>> = { ...a.characteristics }
  for (const [k, v] of Object.entries(b.characteristics) as [CharField, number][]) {
    characteristics[k] = (characteristics[k] ?? 0) + v
  }
  const skills: Record<string, number> = { ...a.skills }
  for (const [k, v] of Object.entries(b.skills)) {
    skills[k] = (skills[k] ?? 0) + v
  }
  return {
    hp:              a.hp    + b.hp,
    pe:              a.pe    + b.pe,
    armure:          a.armure + b.armure,
    characteristics,
    skills,
  }
}
