export type SkillCategory =
  | 'Combat'
  | 'Artisanat'
  | 'Survie'
  | 'Discrétion & Observation'
  | 'Médical'
  | 'Social & Intellectuel'
  | 'Spécialisé'

export interface SkillDef {
  id: string
  name: string
  description: string
  category: SkillCategory
}

export const SKILLS: SkillDef[] = [
  // ── Combat ────────────────────────────────────────────────────────────────
  { id: 'hache',              category: 'Combat', name: 'Hache',               description: 'Maîtrise des haches au combat rapproché et pour les travaux lourds.' },
  { id: 'longue-masse',       category: 'Combat', name: 'Longue Masse',         description: 'Masses longues pour infliger des coups puissants à portée allongée.' },
  { id: 'petite-masse',       category: 'Combat', name: 'Petite Masse',         description: 'Masses courtes, idéales pour le corps à corps et les frappes précises.' },
  { id: 'longue-lame',        category: 'Combat', name: 'Longue Lame',          description: 'Épées et lames longues pour le combat au contact.' },
  { id: 'petite-lame',        category: 'Combat', name: 'Petite Lame',          description: 'Couteaux et dagues pour le combat rapproché.' },
  { id: 'lance',              category: 'Combat', name: 'Lance',                description: 'Lances pour les attaques à portée et au corps à corps.' },
  { id: 'main-nue',           category: 'Combat', name: 'Main Nue',             description: 'Arts martiaux et techniques de self-défense à mains nues.' },
  { id: 'visee',              category: 'Combat', name: 'Visée',                description: 'Précision avec les armes à distance : arcs, arbalètes, armes à feu.' },
  { id: 'rechargement',       category: 'Combat', name: 'Rechargement',         description: 'Vitesse et technique de rechargement des armes à feu.' },
  { id: 'tactique-militaire', category: 'Combat', name: 'Tactique Militaire',   description: 'Stratégies militaires pour organiser attaques, défenses et manœuvres.' },

  // ── Artisanat ─────────────────────────────────────────────────────────────
  { id: 'agriculture',          category: 'Artisanat',                name: 'Agriculture & Jardinage',        description: 'Culture de plantes pour la nourriture et les médicaments.' },
  { id: 'electricite',          category: 'Artisanat',                name: 'Électricité',                    description: 'Connaissance des systèmes électriques, réparation et maintenance.' },
  { id: 'travail-metaux',       category: 'Artisanat',                name: 'Travail des métaux',              description: 'Maîtrise de la forge et de la fabrication d\'objets métalliques.' },
  { id: 'mecanique',            category: 'Artisanat',                name: 'Mécanique',                      description: 'Réparer et entretenir des machines et véhicules.' },
  { id: 'couture',              category: 'Artisanat',                name: 'Couture',                        description: 'Confection et réparation de vêtements et textiles.' },
  { id: 'menuiserie',           category: 'Artisanat',                name: 'Menuiserie',                     description: 'Travail du bois pour construire des structures et des objets.' },
  { id: 'assemblage',           category: 'Artisanat',                name: 'Assemblage',                     description: 'Assembler divers composants pour créer des objets utiles.' },
  { id: 'demantelement',        category: 'Artisanat',                name: 'Démantèlement',                  description: 'Démonter des objets pour récupérer des pièces utilisables.' },
  { id: 'entretien-armes-feu',  category: 'Artisanat',                name: 'Entretien armes à feu',          description: 'Maintenance et connaissance des armes à feu.' },
  { id: 'entretien-armes-bl',   category: 'Artisanat',                name: 'Entretien armes blanches',       description: 'Entretien et connaissance des armes tranchantes.' },

  // ── Survie ────────────────────────────────────────────────────────────────
  { id: 'orientation',          category: 'Survie',                   name: 'Orientation & Temps',            description: 'Se repérer et naviguer en terrain inconnu, avoir une notion du temps.' },
  { id: 'chasse',               category: 'Survie',                   name: 'Chasse',                         description: 'Traquer et capturer des animaux pour la nourriture.' },
  { id: 'peche',                category: 'Survie',                   name: 'Pêche',                          description: 'Attraper des poissons en rivière, lac ou mer.' },
  { id: 'recherche-nourriture', category: 'Survie',                   name: 'Recherche de nourriture',        description: 'Reconnaissance et collecte de plantes comestibles et médicinales.' },
  { id: 'camping',              category: 'Survie',                   name: 'Camping',                        description: 'Construction de refuges temporaires pour se protéger des éléments.' },
  { id: 'survie',               category: 'Survie',                   name: 'Survie',                         description: 'Faire du feu, purifier de l\'eau et autres techniques de survie.' },
  { id: 'cuisine',              category: 'Survie',                   name: 'Cuisine',                        description: 'Préparation de repas à partir de ressources disponibles.' },
  { id: 'animaux',              category: 'Survie',                   name: 'Animaux',                        description: 'Dressage et gestion des animaux.' },
  { id: 'nature',               category: 'Survie',                   name: 'Nature',                         description: 'Connaissance de l\'environnement naturel et de ses ressources.' },

  // ── Discrétion & Observation ──────────────────────────────────────────────
  { id: 'furtivite',            category: 'Discrétion & Observation', name: 'Furtivité',                      description: 'Se déplacer sans être détecté.' },
  { id: 'acrobaties',           category: 'Discrétion & Observation', name: 'Acrobaties',                     description: 'Grimper, sauter et se déplacer de manière agile.' },
  { id: 'perception',           category: 'Discrétion & Observation', name: 'Perception',                     description: 'Remarquer des détails et être attentif à l\'environnement.' },
  { id: 'pistage',              category: 'Discrétion & Observation', name: 'Surveillance & Pistage',         description: 'Suivre des traces et surveiller discrètement.' },
  { id: 'crochetage',           category: 'Discrétion & Observation', name: 'Crochetage & Sécurité',         description: 'Ouvrir des serrures et contourner des systèmes de sécurité.' },
  { id: 'investigation',        category: 'Discrétion & Observation', name: 'Investigation',                  description: 'Rechercher des informations et résoudre des mystères.' },
  { id: 'vol',                  category: 'Discrétion & Observation', name: 'Vol',                            description: 'Dérober des objets sans se faire prendre.' },

  // ── Médical ───────────────────────────────────────────────────────────────
  { id: 'premiers-secours',     category: 'Médical',                  name: 'Premiers Secours',               description: 'Techniques de base pour soigner les blessures.' },
  { id: 'medecine',             category: 'Médical',                  name: 'Médecine (générale)',             description: 'Diagnostiquer et traiter des maladies et blessures.' },
  { id: 'chirurgie',            category: 'Médical',                  name: 'Chirurgie',                      description: 'Effectuer des opérations chirurgicales pour traiter des blessures graves.' },

  // ── Social & Intellectuel ─────────────────────────────────────────────────
  { id: 'negociation',          category: 'Social & Intellectuel',    name: 'Négociation',                    description: 'Obtenir ce que l\'on veut par la discussion et le compromis.' },
  { id: 'persuasion',           category: 'Social & Intellectuel',    name: 'Persuasion',                     description: 'Convaincre les autres de ses idées ou de ses plans.' },
  { id: 'leadership',           category: 'Social & Intellectuel',    name: 'Leadership',                     description: 'Diriger et inspirer un groupe.' },
  { id: 'tromperie',            category: 'Social & Intellectuel',    name: 'Tromperie',                      description: 'Mentir ou manipuler pour obtenir un avantage.' },
  { id: 'intimidation',         category: 'Social & Intellectuel',    name: 'Intimidation',                   description: 'Utiliser la menace ou la force pour obtenir ce que l\'on veut.' },
  { id: 'representation',       category: 'Social & Intellectuel',    name: 'Représentation',                 description: 'Arts de la scène, musique, danse et autres formes d\'expression.' },

  // ── Spécialisé ────────────────────────────────────────────────────────────
  { id: 'conduite',             category: 'Spécialisé',               name: 'Conduite',                       description: 'Conduire différents types de véhicules.' },
  { id: 'pilotage',             category: 'Spécialisé',               name: 'Pilotage',                       description: 'Piloter des aéronefs ou des drones.' },
  { id: 'navigation',           category: 'Spécialisé',               name: 'Navigation Nautique',            description: 'Naviguer sur l\'eau avec des bateaux ou autres moyens de transport.' },
  { id: 'informatique',         category: 'Spécialisé',               name: 'Informatique',                   description: 'Pirater des systèmes, déverrouiller des portes électroniques.' },
  { id: 'esoterime',            category: 'Spécialisé',               name: 'Ésotérisme',                     description: 'Maîtrise et compréhension des énergies magiques et rituels associés.' },
  { id: 'flux-magiques',        category: 'Spécialisé',               name: 'Maîtrise des Flux Magiques',     description: 'Catalyse et contrôle des flux d\'énergie empyréenne pour lancer des sortilèges.' },
]

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Combat',
  'Artisanat',
  'Survie',
  'Discrétion & Observation',
  'Médical',
  'Social & Intellectuel',
  'Spécialisé',
]
