export interface CharAbility {
  level: number
  name?: string
  description: string
}

export const FORCE_ABILITIES: CharAbility[] = [
  { level: 1,  description: '+5 kg de transport' },
  { level: 2,  description: 'Annulation des malus pour les armes légères' },
  { level: 3,  description: '+1 dégât mains nues et masses' },
  { level: 4,  description: '+5 kg de transport' },
  { level: 5,  description: 'Annulation des malus pour les armures moyennes' },
  { level: 6,  description: '+1 point d\'endurance — +1 dégât mains nues et masses' },
  { level: 7,  description: 'Peut briser des objets de moyenne résistance (cordes, lances…)' },
  { level: 8,  description: 'Coups critiques : +4 dégâts — annulation des malus pour les armes lourdes' },
  { level: 9,  description: '+10 kg de transport' },
  { level: 10, description: 'Peut soulever de gros objets ou créatures — +1 dégât corps à corps' },
  { level: 11, description: 'Peut briser objets résistants (portes, armures légères, boucliers) avec des attaques puissantes' },
  { level: 12, description: '+1 dégât mains nues et masses' },
  { level: 13, description: '+2 en intimidation — annulation des malus pour les armures lourdes' },
  { level: 14, description: 'Actions de force exceptionnelles (briser des chaînes…) — +10 kg de transport' },
  { level: 15, description: '+1 dégât mains nues et masses' },
  { level: 16, description: '+20 kg de transport' },
  { level: 17, description: 'Les attaques peuvent désarmer les adversaires ou briser leurs armes' },
  { level: 18, description: '+20 kg de transport' },
  { level: 19, description: 'Immunité contre la paralysie et effets restreignant le mouvement en combat' },
  { level: 20, description: 'Prouesses mythiques : soulever des voitures, briser des murs de pierre' },
]

export const DEXTERITE_ABILITIES: CharAbility[] = [
  { level: 1,  description: 'Déplacement : 3 m = 1 PE' },
  { level: 2,  description: '+1 au jet de défense' },
  { level: 3,  description: '+2 aux jets de Dextérité contre pièges et effets nécessitant un mouvement rapide' },
  { level: 4,  description: 'Se relever ne coûte que 1 PE' },
  { level: 5,  description: 'Plus de malus de position' },
  { level: 6,  description: '+1 point d\'endurance' },
  { level: 7,  description: '+1 en défense' },
  { level: 8,  description: 'Peut réaliser des sauts et roulades complexes pour éviter obstacles ou attaques' },
  { level: 9,  description: '19 au dé est maintenant considéré comme un coup critique' },
  { level: 10, description: 'Les attaques ignorent partiellement couverture (−2) et armure (−1) des ennemis' },
  { level: 11, description: 'Exécution d\'actions acrobatiques sans test préalable' },
  { level: 12, description: 'La vitesse n\'est plus réduite pendant un déplacement discret' },
  { level: 13, description: '+2 aux jets pour se libérer de liens ou d\'une étreinte' },
  { level: 14, name: 'Frappe Sournoise', description: 'Les attaques discrètes neutralisent forcément les ennemis' },
  { level: 15, description: '+2 en défense' },
  { level: 16, description: 'Performances physiques défiant la gravité (courir sur les murs…)' },
  { level: 17, description: 'Les attaques peuvent désarmer les adversaires' },
  { level: 18, description: 'Ne subit pas les malus de la première attaque reçue' },
  { level: 19, name: 'Défense Insaisissable', description: 'Une fois par combat, nier complètement une attaque physique' },
  { level: 20, description: 'Les attaques d\'un ennemi avec moins de 7 en Dextérité ne coûtent pas de PE si réussies ; si échouées, un second jet est effectué' },
]

export const CONSTITUTION_ABILITIES: CharAbility[] = [
  { level: 1,  description: '+1 PV de récupération sur les blessures légères' },
  { level: 2,  description: '+1 point d\'endurance' },
  { level: 3,  description: 'Légère résistance aux maladies courantes' },
  { level: 4,  description: '+1 point d\'endurance' },
  { level: 5,  description: 'Récupération normale de 5 PE par tour' },
  { level: 7,  description: '+1 point d\'endurance' },
  { level: 9,  description: '+1 PV de récupération sur les blessures' },
  { level: 10, description: '6 PE par tour — endurance supérieure' },
  { level: 11, description: '−10 en consommation d\'eau et de nourriture' },
  { level: 12, description: 'Rester conscient à 0 PV pour 1 tour supplémentaire' },
  { level: 13, description: '+1 point d\'endurance' },
  { level: 14, description: '+1 PV de récupération sur toutes les blessures' },
  { level: 15, description: 'Récupération normale de 7 PE par tour' },
  { level: 17, description: 'Régénérer 5 PV une fois par jour (sous 50% PV)' },
  { level: 18, description: '+1 point d\'endurance' },
  { level: 20, description: '+7 PE par tour. Régénérer 1 PV par tour en combat' },
]

export const INTELLIGENCE_ABILITIES: CharAbility[] = [
  { level: 1,  name: 'Exploiter les faibles',      description: '+1 à la chance de toucher contre les ennemis très affaiblis (≤10% PV)' },
  { level: 2,  name: 'Planification',               description: 'Plan en 3 étapes — pour chaque étape réussie, +1 au jet correspondant' },
  { level: 3,  name: 'Connaissance dans les livres', description: 'Lire un livre : jet d\'Intelligence réussi → +1 au prochain jet lié au livre' },
  { level: 4,  description: 'Peut apprendre une langue supplémentaire' },
  { level: 6,  name: 'Compréhension générale',      description: 'Avec quelques informations fragmentaires, comprendre la situation d\'ensemble' },
  { level: 7,  description: 'Parfaitement bilingue' },
  { level: 10, description: 'Réduction sur la perte de compétences' },
  { level: 13, description: 'Bonus pour anticiper les mouvements adverses' },
  { level: 14, description: 'Polyglotte' },
  { level: 15, description: 'Bonus pour comprendre les plans et objectifs d\'autres personnages' },
  { level: 19, description: 'Peut déchiffrer des langages anciens ou des codes' },
]

export const SAGESSE_ABILITIES: CharAbility[] = [
  { level: 3,  description: '+1 Capacité de corruption' },
  { level: 6,  description: 'Bonus pour lire les émotions simples' },
  { level: 7,  description: 'Parfaitement bilingue' },
  { level: 9,  description: '+1 Capacité de corruption' },
  { level: 10, description: 'Bonus pour lire et utiliser les émotions simples' },
  { level: 11, name: 'Autocontrôle',        description: '−10 de stress' },
  { level: 13, name: 'Intuition du Danger', description: 'Sensation instinctive de danger — peut éviter embuscades et surprises' },
  { level: 15, description: '+1 Capacité de corruption' },
  { level: 18, name: 'Influence Apaisante', description: '−5 de stress chez les alliés' },
  { level: 19, name: 'Sagesse Profonde',    description: 'Compréhension quasi-prophétique des événements futurs' },
  { level: 20, name: 'Divinations',         description: 'Une fois par mois, possibilité de prédire des futurs possibles' },
]

export const CHARISME_ABILITIES: CharAbility[] = [
  { level: 1,  name: 'Provocation',            description: '1 PE — diriger la prochaine attaque d\'une cible vers soi (1×/tour)' },
  { level: 3,  name: 'Petit blagueur',          description: 'Si stress < 50, une blague détend l\'équipe (stress − jet de Charisme)' },
  { level: 4,  name: 'Premières Impressions',  description: '1 chance sur 3 d\'impression positive lors d\'une nouvelle rencontre (1×/jour)' },
  { level: 7,  description: '+1 en jets de marchandage ou d\'intimidation' },
  { level: 10, description: 'Attirer l\'attention et susciter l\'intérêt dans des situations sociales' },
  { level: 11, name: 'Autocontrôle',           description: '−10 de stress' },
  { level: 13, name: 'Aura de Confiance',      description: 'Projette une confiance naturelle qui pousse les autres à suivre instinctivement' },
  { level: 17, description: '+1 en jets de marchandage ou d\'intimidation' },
  { level: 20, name: 'Influence Monumentale',  description: 'Peut redéfinir des relations, alliances ou structures de pouvoir par la seule force de sa personnalité' },
]
