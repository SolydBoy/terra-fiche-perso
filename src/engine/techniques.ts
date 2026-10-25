// ⚠️  FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Regénérer avec : python scripts/generate_techniques.py

export type TechniqueCategory = 'Novice' | 'Adepte' | 'Professionnel' | 'Maître'
export type TechniqueType     = 'passif' | 'technique' | 'attaque'

export const PT_COST: Record<TechniqueCategory, number> = {
  'Novice':        1,
  'Adepte':        2,
  'Professionnel': 3,
  'Maître':        5,
}

export interface TechniqueDef {
  id:          string
  skillId:     string
  name:        string
  category:    TechniqueCategory
  type:        TechniqueType
  family:      string
  /** Texte de lore / description narrative */
  description: string
  /** Effets mécaniques (bullets, bonus chiffrés…) — champ "Effet" dans Notion */
  effect?:     string
  /** Coût en PE pour déclencher la technique (absent = passif, aucun coût) */
  peCost?:     number
  /** Fatigue générée (s'ajoute à la fatigue cumulée du tour) */
  fatigueCost?: number
  /** IDs d'items requis — si absent, toute arme de la compétence convient */
  weapons?:    string[]
  prereqs?: {
    minLevel?:     number
    techniqueIds?: string[]
  }
  /** Lien vers la page Notion de référence */
  url?: string
}

/** Compétences d'arme qui donnent des PT */
export const WEAPON_SKILL_IDS = [
  'hache', 'longue-masse', 'petite-masse',
  'longue-lame', 'petite-lame', 'lance',
  'main-nue', 'visee', 'rechargement',
]

/** skillId spécial : technique utilisable avec toutes les armes */
export const GENERAL_SKILL_ID = 'général' as const

export const TECHNIQUES: TechniqueDef[] = [

  // ── GÉNÉRAL ─────────────────────────────────────────────────────

  // Famille : Barbare
  {
    id: `fureur`,
    skillId: `général`,
    name: `Fureur`,
    category: 'Novice',
    type: 'technique',
    family: `Barbare`,
    peCost: 2,
    description: `Tu cesses d’être un combattant.
Tu deviens un ouragan d’acier et de chair.`,
    effect: `Tu entres en état de Fureur:
• Gagne +1 pour toucher et +1 aux dégâts au corps à corps
• Gagne +1 PE regen et +1 PE max
• Tu es insensible à la peur, au stress, et à la douleur
• Tu ne peux pas esquiver ou utiliser des techniques de parade
• Tu dois attaquer à chaque tour si un ennemi est à portée (sinon tu avances)

Tant que tu as au moins un point de rage tu restes en fureur.`,
    url: `https://www.notion.so/207abc3abb3a80069c36f449d6b6c6e1`,
  },
  {
    id: `soif-de-combat`,
    skillId: `général`,
    name: `Soif de Combat`,
    category: 'Novice',
    type: 'technique',
    family: `Barbare`,
    description: `Plus tu frappes, plus ton cœur bat vite, plus tu tiens debout.`,
    effect: `Effet :
• Pour chaque ennemi touché ce tour, récupère 1 PV (max 3).
• Fonctionne avec toute attaque réussie (dont multi-cibles).
Bonus – Si en Fureur :
• Récupère 2 PV par cible touchée (max 3).`,
    url: `https://www.notion.so/207abc3abb3a801aab5dc5f294ddc9f0`,
  },
  {
    id: `carnage-vivifiant`,
    skillId: `général`,
    name: `Carnage Vivifiant`,
    category: 'Novice',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Chaque cadavre allège ton fardeau. Chaque mort te rappelle que tu respires encore.`,
    effect: `Frappe brutale. 
Rends 2 points de vie temporaire.
Si l’attaque tue la cible, vous récupérez 3 PV temporaire.

Bonus si en Fureur :
• La récupération passe à 5 PV
• Tu peux immédiatement faire un pas de 1m gratuit (vers un autre ennemi)`,
    url: `https://www.notion.so/207abc3abb3a801d80a3cde70c8d89c6`,
  },
  {
    id: `rugissement`,
    skillId: `général`,
    name: `Rugissement`,
    category: 'Novice',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Ta voix seule est une arme. Le sol tremble, les cœurs vacillent.`,
    effect: `Tous les ennemis dans un rayon de 3m doivent réussir un test de Moral ou subir :
• -1 à leurs jets d’attaque pendant 1 tour
• -1 au prochain test de Stress
Bonus si en Fureur :
• Les ennemis ratant leur test sont aussi poussés d’une case en arrière`,
    url: `https://www.notion.so/207abc3abb3a80a88d28e0483acdcbda`,
  },
  {
    id: `crocs-serres`,
    skillId: `général`,
    name: `Crocs Serrés`,
    category: 'Novice',
    type: 'passif',
    family: `Barbare`,
    description: `Tu encaisses. Tu frappes. Tu tiens. Parce que tu n’as pas le choix.`,
    effect: `Chaque fois que tu touches une cible au corps à corps et que tu es blessé (sous 50% PV), tu récupères 1 PV.

• Max 2 activations par tour.

Bonus si en Fureur :
• Ignore la limite : récupère 1 PV par coup sans restriction.`,
    url: `https://www.notion.so/207abc3abb3a80e1b88ddb973241a784`,
  },
  {
    id: `instinct-de-mort`,
    skillId: `général`,
    name: `Instinct de Mort`,
    category: 'Adepte',
    type: 'technique',
    family: `Barbare`,
    description: `Tu sens la fin arriver, et tu refuses de tomber.`,
    effect: `Effet :
• Peut être utilisé uniquement en réaction, quand tu tombes à 0 PV ou moins.
• Tu gagnes immédiatement un tour gratuit, puis tu chutes à 0 PV.
Limite :
• 1 fois par combat.
Bonus – Si en Fureur :
• Tu gagnes un point de vie a la fin de ton tours.`,
    url: `https://www.notion.so/207abc3abb3a802f8598f6c5c937dbe5`,
  },
  {
    id: `elan-sauvage`,
    skillId: `général`,
    name: `Élan Sauvage`,
    category: 'Adepte',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Tu ne ralentis jamais. Tu charges comme un ouragan.`,
    effect: `Tu peux te déplacer de 3 mètres.
Si l’attaque touche, gagne 1 point de Rage et l’ennemie est au sols.

Bonus – Si en Fureur :
• L’attaque inflige +1 dégât.`,
    url: `https://www.notion.so/207abc3abb3a8042a607eec709210014`,
  },
  {
    id: `second-souffle`,
    skillId: `général`,
    name: `Second Souffle`,
    category: 'Adepte',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Tu inspires un grand coup — pas pour te calmer, mais pour hurler plus fort.`,
    effect: `Effet :
• Récupère 2 PV et 1 point de Rage.
• Peut être utilisé même en Fureur, sans la quitter.
Limite :
• 1 fois par combat.

Bonus – Si en Fureur :
• Récupère 3 PV et 1 point de Rage.`,
    url: `https://www.notion.so/207abc3abb3a80a78a35f4a1109b455d`,
  },
  {
    id: `tourbillon-sanglant`,
    skillId: `général`,
    name: `Tourbillon Sanglant`,
    category: 'Professionnel',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Chaque coup te rappelle que tu es vivant — et chaque cri adverse te maintient debout.`,
    effect: `Effet :
• Effectue une attaque contre toutes les créatures à portée de mêlée.
• Tu effectues un jet séparé par cible (pas de malus de zone).
• Ne peut pas être combinée avec d'autres effets de déplacement.
Bonus – Si en Fureur :
• Tu gagnes 1 PV par ennemi touché, grâce à l’adrénaline déchaînée par l’impact.`,
    url: `https://www.notion.so/207abc3abb3a8020ab31c3b4c59f647e`,
  },
  {
    id: `execution-sauvage`,
    skillId: `général`,
    name: `Exécution Sauvage`,
    category: 'Professionnel',
    type: 'technique',
    family: `Barbare`,
    peCost: 0,
    description: `Tu paries tout sur ce coup. Et tu le portes avec la force de tout ce qu’il te reste.`,
    effect: `• Consomme toute ta Rage (minimum 3 requise).
• Effectue une attaque avec +1 pour toucher par point de Rage consommé.
• Si l’attaque touche, elle inflige un coup critique automatique.
Bonus – Si la cible meurt :
• Tu regagnes immédiatement 2 PE et 1 point de Rage, nourri par le carnage.`,
    url: `https://www.notion.so/207abc3abb3a803ca3bcde2730c1e6d7`,
  },
  {
    id: `riposte-bestiale`,
    skillId: `général`,
    name: `Riposte Bestiale`,
    category: 'Professionnel',
    type: 'technique',
    family: `Barbare`,
    description: `Chaque coup que tu reçois réveille quelque chose de plus dangereux encore.`,
    effect: `• 1 fois par tour, si tu es touché par une attaque en mêlée, tu peux riposter immédiatement avec une attaque à -2 pour toucher.
• +1 de rage si cette attaque touche
• Cette riposte n'interrompt pas l'action ennemie.
• Ne peut pas être utilisée si tu es neutralisé ou incapable d’agir.
Bonus – Si en Fureur :
• Le malus pour toucher passe à -1 seulement.`,
    url: `https://www.notion.so/207abc3abb3a80e29577f82fc1a69fe6`,
  },
  {
    id: `maree-de-violence`,
    skillId: `général`,
    name: `Marée de Violence`,
    category: 'Maître',
    type: 'technique',
    family: `Barbare`,
    peCost: 1,
    description: `Tu entres dans une transe barbare. Tout devient instinct. Tu frappes comme si ta vie en dépendait — parce que c’est le cas.`,
    effect: `Effet :
• Jusqu’à la fin de ton tour, toutes tes attaques coûtent 1 PE de moins (minimum 1).
• Ne s’applique pas aux actions de déplacement, de cri, ou de soutien.
• Tu gagnes +1 pour toucher tant que tu restes en Fureur ce tour.
Bonus – Si en Fureur :
• Tu peux relancer jusqu’à 1 attaques ratées dans ce tour.`,
    url: `https://www.notion.so/207abc3abb3a80988b0ef3e3fd832e5c`,
  },

  // Famille : Cercle de l’Étau
  {
    id: `engagement`,
    skillId: `général`,
    name: `Engagement`,
    category: 'Novice',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 1,
    description: `Tu avances d’un pas lourd, menaçant, maintenant ton arme levée sans relâche`,
    effect: `Tu gagnes +1 à la défense jusqu’à ton prochain tour.

Tu désignes un ennemie qui jusqu'à la fin du combat ou si tu en désigne un autre.
Si il recule ou se désengage 1 PE supplémentaire.`,
    url: `https://www.notion.so/207abc3abb3a8062b030c6db7eb2d966`,
  },
  {
    id: `frappe-lourde`,
    skillId: `général`,
    name: `Frappe Lourde`,
    category: 'Novice',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 0,
    description: `Une attaque lente mais pesante, qui exige une réponse énergivore.`,
    effect: `La cible doit dépenser +1 PE pour se défendre
- 2 pour toucher`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Arme 2
    url: `https://www.notion.so/207abc3abb3a80adbcfbd93860cfa6ec`,
  },
  {
    id: `frappe-contraignante`,
    skillId: `général`,
    name: `Frappe contraignante`,
    category: 'Novice',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 1,
    description: `Une frappe basse qui oblige l’adversaire à se repositionner.`,
    effect: `Si l’attaque est parée, l’adversaire doit se déplacer d’une case de recul (consomme 1 PE de déplacement).
S’il ne peut pas ou ne veut pas, il subit 1 dégât.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Arme 2
    url: `https://www.notion.so/207abc3abb3a80ef9282dd38e77ba7b1`,
  },
  {
    id: `etranglement`,
    skillId: `général`,
    name: `Étranglement`,
    category: 'Adepte',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 2,
    description: `Tu profites d’un moment de faiblesse pour resserrer l’étau, visant une faille dans la défense.`,
    effect: `Si la cible tombe à 0 PE à cause de cette attaque, elle subit +2 dégâts supplémentaires et est renversée.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Arme 6
    url: `https://www.notion.so/207abc3abb3a80128843d47fb76ab872`,
  },
  {
    id: `coup-au-corps`,
    skillId: `général`,
    name: `Coup au corps`,
    category: 'Adepte',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 1,
    description: `Une attaque précise visant un point vital : elle n’est pas faite pour tuer… mais pour vider ce qu’il reste d’énergie.`,
    effect: `Inflige la moitié des dégâts.

La cible voit sa récupération de PE réduite de 2 au prochain tour.

Une fois par cible ennemie par tours`,
    url: `https://www.notion.so/207abc3abb3a8035b8dbc0ad5b597623`,
  },
  {
    id: `cloture-du-cercle`,
    skillId: `général`,
    name: `Clôture du cercle`,
    category: 'Adepte',
    type: 'passif',
    family: `Cercle de l’Étau`,
    description: `Un mouvement lent mais maîtrisé, qui réduit les options de l’adversaire.`,
    effect: `Tant que tu restes au contact pendant plus d’un tours, l’adversaire subit +1 de coût sur toutes ses esquives et retraites.`,
    prereqs: { minLevel: 7 },
    // Prérequis Notion : Arme 7
    url: `https://www.notion.so/207abc3abb3a80ac91ffe6b710f67817`,
  },
  {
    id: `lecture-impitoyable`,
    skillId: `général`,
    name: `Lecture impitoyable`,
    category: 'Professionnel',
    type: 'technique',
    family: `Cercle de l’Étau`,
    description: `Tu observes, tu anticipes, tu punis.`,
    effect: `(activation 1x/tour) : après qu’un ennemi a esquivé ou reculé de ta zone de menace, tu peux immédiatement effectuer une attaque gratuite de base contre lui`,
    prereqs: { minLevel: 11 },
    // Prérequis Notion : Arme 11
    url: `https://www.notion.so/207abc3abb3a80088593f4298fda66b6`,
  },
  {
    id: `pression`,
    skillId: `général`,
    name: `Pression`,
    category: 'Professionnel',
    type: 'passif',
    family: `Cercle de l’Étau`,
    description: `Chaque mouvement adverse devient plus lourd sous ta pression.`,
    effect: `Tant que tu attaques un ennemi à chaque tour sans interruption, il subit:
• –1 PE récupéré par cumul (max –2).
• Ce malus est réinitialisé si tu manques ou si tu changes de cible.`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Arme 9
    url: `https://www.notion.so/207abc3abb3a8048bbbbddcc279e7afe`,
  },
  {
    id: `emprise-totale`,
    skillId: `général`,
    name: `Emprise Totale`,
    category: 'Maître',
    type: 'technique',
    family: `Cercle de l’Étau`,
    peCost: 3,
    description: `Tu verrouilles un adversaire dans un duel épuisant, coupant ses issues, étouffant son rythme.`,
    effect: `-2 dégats

La cible subit un état spécial : Harcelé
• Tant qu’elle reste à portée de toi, toute action offensive ou de déplacement coûte +1 PE.
Durée : 2 tours ou jusqu’à ce qu’elle réussisse un test de Constitution à son tour.
Bonus : Si elle tente de te frapper pendant Harcelé, tu gagnes +1 parade.`,
    prereqs: { minLevel: 15 },
    // Prérequis Notion : Arme 15
    url: `https://www.notion.so/207abc3abb3a8078bdcdeccd2ea674b2`,
  },
  {
    id: `a-bout-de-souffle`,
    skillId: `général`,
    name: `A  bout de souffle`,
    category: 'Maître',
    type: 'passif',
    family: `Cercle de l’Étau`,
    description: `Il ne peut plus respirer c’est le moment`,
    effect: `Si votre cible a 0 PE toutes vos attaques gagnent +2, +4, +6 max +8`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Arme 13
    url: `https://www.notion.so/207abc3abb3a80e796e8c10e11a8117a`,
  },

  // Famille : GEN-0S
  {
    id: `evaluation-de-menace`,
    skillId: `général`,
    name: `Évaluation de Menace`,
    category: 'Novice',
    type: 'passif',
    family: `GEN-0S`,
    description: `XER-0S analyse automatiquement les ennemis visibles.`,
    effect: `signaler instinctivement l’ennemi le plus menaçant sur le champ de bataille.`,
    url: `https://www.notion.so/2d3abc3abb3a8014a131fc717b16c054`,
  },
  {
    id: `module-darme-canon`,
    skillId: `général`,
    name: `Module d’Arme Canon`,
    category: 'Novice',
    type: 'technique',
    family: `GEN-0S`,
    description: ``,
    effect: `Donne accès a l’arme Module arme Canon`,
    url: `https://www.notion.so/2d3abc3abb3a8052abddd001975b9d71`,
  },
  {
    id: `module-darme-micro-roquettes`,
    skillId: `général`,
    name: `Module d’Arme Micro-Roquettes`,
    category: 'Novice',
    type: 'technique',
    family: `GEN-0S`,
    description: ``,
    effect: `Donne accès a l’arme Module d’Arme Micro-Roquettes`,
    url: `https://www.notion.so/2d3abc3abb3a80e9b204f6840ffbb008`,
  },
  {
    id: `module-daction-choque-sonique`,
    skillId: `général`,
    name: `Module d’Action Choque Sonique`,
    category: 'Novice',
    type: 'technique',
    family: `GEN-0S`,
    peCost: 2,
    description: `Le bras émet une impulsion brutale, invisible mais écrasante, qui modifie instantanément la disposition du champ de bataille.`,
    effect: `En activant ce module, le porteur peut :
• se repositionner immédiatement à courte 4m sans subir les malus habituels liés au déplacement en combat mais terminé allongé
ou
• repousser violemment un adversaire à son corps a corps a 4m si celui échoue un DC 15 en constitution.`,
    url: `https://www.notion.so/2d3abc3abb3a80fa95f3cfffbdae22be`,
  },
  {
    id: `module-daction-ciblage`,
    skillId: `général`,
    name: `Module d’Action Ciblage`,
    category: 'Novice',
    type: 'technique',
    family: `GEN-0S`,
    peCost: 1,
    description: `Les capteurs du bras s’activent, superposant des trajectoires, des points faibles et des probabilités de survie.
XER-0S observe, calcule et impose une priorité absolue.`,
    effect: `Le porteur désigne une cible visible.
• la prochaine attaque gagne +1 pour toucher.
La cible est Marqué pour 2 tours.`,
    url: `https://www.notion.so/2d5abc3abb3a808f8d8ef3e5c3d5b92f`,
  },
  {
    id: `module-passif-puissance-physique`,
    skillId: `général`,
    name: `Module Passif Puissance Physique`,
    category: 'Novice',
    type: 'passif',
    family: `GEN-0S`,
    description: `Le bras de GEN-0S n’obéit pas aux limites de la biomécanique humaine.
Ses structures internes sont capables d’exercer une pression et une traction bien supérieur`,
    effect: `+ 2 en force`,
    url: `https://www.notion.so/2d5abc3abb3a80d1a6dcf0551d9b1f3d`,
  },

  // Famille : Le Commandant
  {
    id: `cible-prioritaire`,
    skillId: `général`,
    name: `Cible prioritaire`,
    category: 'Novice',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Vous désignez la cible d’un simple geste — et tous comprennent où frapper.`,
    effect: `Choisissez une cible visible. Jusqu’à votre prochain tour, tous les alliés gagnent +2 aux jets d’attaque contre elle et la cible est Marqué`,
    url: `https://www.notion.so/206abc3abb3a80199b94e85073610b94`,
  },
  {
    id: `en-avant`,
    skillId: `général`,
    name: `En avant !`,
    category: 'Novice',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Votre voix porte l’énergie du mouvement — l’équipe avance dans le sillage de votre volonté.`,
    effect: `Un allié dans votre zone immédiate peut avancer de 3m supplémentaire ou effectuer une défense gratuite.`,
    url: `https://www.notion.so/206abc3abb3a801b950edfb21b0c3f4e`,
  },
  {
    id: `regard-du-stratege`,
    skillId: `général`,
    name: `Regard du Stratège`,
    category: 'Novice',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Votre regard dissèque les failles. Là où les autres voient un adversaire, vous voyez une ouverture. Vous guidez vos armes avec la précision d’un scalpel.`,
    effect: `Tant qu’au moins un ennemi se trouve dans votre zone de commandement, vous pouvez analyser sa posture et en déterminer sa stratégies de combat et ses intention.
- Vous donne personnellement +1 contre tous les ennemie de se type.

Non cumulable`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Tactique militaire 2
    url: `https://www.notion.so/206abc3abb3a806b9635d210ce86ea1a`,
  },
  {
    id: `ralliement`,
    skillId: `général`,
    name: `Ralliement`,
    category: 'Novice',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Votre voix perce le chaos. En un mot, un geste, vous ranimez la volonté d’un camarade. Ce n’est pas de la magie — c’est de la présence.`,
    effect: `Tous les alliés dans la zone de commandement peuvent immédiatement :
• Réduire leur stress de 5 niveau
• Ignorer un effet négatif mineur (ex. : désorientation, peur, affaiblissement temporaire).
• Ce n’est pas une guérison, mais un réajustement mental via la voix du commandant.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Leadership 2
    url: `https://www.notion.so/206abc3abb3a80dbae9ef4d193b89325`,
  },
  {
    id: `ordre-de-percee`,
    skillId: `général`,
    name: `Ordre de Percée`,
    category: 'Adepte',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Votre voix coupe net le tumulte du champ de bataille. Une impulsion traverse vos troupes — comme un seul être, elles avancent, brisant le chaos et forgeant leur propre espace.`,
    effect: `Tous les alliés dans votre zone de commandement peuvent immédiatement se déplacer de 2 mètres.

- Ce déplacement n’interrompt pas leur tour.
- Il ne déclenche pas d’attaques d’opportunité.
- Les personnages entravés ou immobilisés n’en bénéficient pas.`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Leadership 4
    url: `https://www.notion.so/206abc3abb3a8023ad3ff415f736b1d9`,
  },
  {
    id: `au-tours-du-chef`,
    skillId: `général`,
    name: `Au tours du chef`,
    category: 'Adepte',
    type: 'passif',
    family: `Le Commandant`,
    description: `Votre autorité rassure et stabilise l’équipe. Tant qu’un allié vous voit ou vous entend, vous rechargez plus vite.`,
    effect: `Tant qu’au moins un allié est dans votre zone de commandement, vous gagnez +1 PE de régénération par tour.`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Leadership 4
    url: `https://www.notion.so/206abc3abb3a802992c3f339c65cccfe`,
  },
  {
    id: `appel-a-lheroisme`,
    skillId: `général`,
    name: `Appel à l’Héroïsme`,
    category: 'Adepte',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Votre voix arrache une dernière étincelle de volonté. Le soldat ne se relève pas par espoir — mais parce qu’il doit accomplir quelque chose avant la fin. Ce n’est pas du courage. C’est de l’obéissance. Et ça suffit.`,
    effect: `Un allié dans votre zone tombe à 0 PV à cause d'une attaque ou d’un effet.

Avant de s'effondrer, l'allié peut immédiatement jouer un dernier tour gratuit, comme s’il agissait normalement :
• Il peut se déplacer, attaquer, utiliser une compétence ou une technique.
• À la fin de ce tour, il s’écroule à 0 PV (ou conserve son état si une capacité de soin l’a empêché d’y tomber).
Limite : 1 fois par combat.`,
    prereqs: { minLevel: 7 },
    // Prérequis Notion : Leadership 7
    url: `https://www.notion.so/206abc3abb3a8099939ad0d681e9a01a`,
  },
  {
    id: `restez-groupes`,
    skillId: `général`,
    name: `Restez groupés !`,
    category: 'Adepte',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 1,
    description: `Vous formez une tortue humaine, unie contre la tempête.`,
    effect: `Tous les alliés dans votre zone de commandement, reçoivent +1 en défense jusqu’au début de votre prochain tour.
Ne se cumule pas, mais peut être relancé chaque tour.`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Tactique militaire 4
    url: `https://www.notion.so/206abc3abb3a809fb866d3b9d10e0711`,
  },
  {
    id: `maitre-de-linitiative`,
    skillId: `général`,
    name: `Maître de l’Initiative`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Un geste. Un regard. Vos troupes bougent avant même que l’ennemi ne comprenne. Ce n’est pas la vitesse — c’est le rythme.`,
    effect: `Vous pouvez échanger l’initiative de deux alliés dans votre zone de commandement.
• Le premier à agir gagne +2 à son jet d’attaque ce tour.
• Le second peut récupérer 1 PE.`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Tactique militaire 12
    url: `https://www.notion.so/206abc3abb3a8004a4a8ec5c8586f3ee`,
  },
  {
    id: `frappe-coordonnee`,
    skillId: `général`,
    name: `Frappe Coordonnée`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Rend tes alliés plus dangereux à plusieurs. Met en valeur la coordination et la supériorité numérique.`,
    effect: `- Un allié dans ta Zone de Commandement réussit une attaque.

Tu choisis un autre allié dans ta zone : celui-ci peut effectuer une attaque gratuite contre la même cible, avec -2 aux dégâts.

1 fois par tour.`,
    prereqs: { minLevel: 7 },
    // Prérequis Notion : Tactique militaire 7
    url: `https://www.notion.so/206abc3abb3a8075a156f348e42492b0`,
  },
  {
    id: `recentrage-durgence`,
    skillId: `général`,
    name: `Recentrage d’Urgence`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Un simple regard, une voix calme au milieu de la tempête, et le chaos recule. Le retour dans l’ordre est palpable.`,
    effect: `Un allié hors de la zone entre dans votre zone de commandement pendant 2 tours`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Leadership 12
    url: `https://www.notion.so/206abc3abb3a80d1b89de4407e271e8c`,
  },
  {
    id: `domination-tactique`,
    skillId: `général`,
    name: `Domination Tactique`,
    category: 'Professionnel',
    type: 'passif',
    family: `Le Commandant`,
    description: `Ce n’est plus vous qui vous adaptez au champ de bataille. C’est le champ de bataille qui s’adapte à vous.`,
    effect: `Tant que vous êtes immobile et conscient, vous imposez une Domination Tactique :
• Tous les ennemis dans votre zone subissent –1 à leurs jets d’attaque et d’esquive.
• Tous les alliés dans votre zone gagnent +1  à leurs jets d’attaque`,
    prereqs: { minLevel: 14 },
    // Prérequis Notion : Tactique militaire 14
    url: `https://www.notion.so/206abc3abb3a80d698bcf70858847f0b`,
  },
  {
    id: `encore-une-fois`,
    skillId: `général`,
    name: `Encore une fois !`,
    category: 'Maître',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Ce n’est pas la chance. Ce n’est pas le destin. C’est votre voix, votre regard, votre présence, qui transforme un raté en coup décisif.`,
    effect: `Déclencheur : Un allié dans votre zone de commandement rate un jet d’attaque, de défense ou de compétence.

Il relance le dé gratuitement, sans consommer de PE.
• Peut être utilisé même pour un échec critique.
• Ne peut pas être utilisé plus d’une fois par round.`,
    prereqs: { minLevel: 16 },
    // Prérequis Notion : Leadership 16
    url: `https://www.notion.so/206abc3abb3a802aba8bd6a6b2beeeea`,
  },
  {
    id: `commandement-absolu`,
    skillId: `général`,
    name: `Commandement Absolu`,
    category: 'Maître',
    type: 'passif',
    family: `Le Commandant`,
    description: `Vous n’avez plus besoin de parler. Votre simple présence déforme la réalité tactique. Dans votre ombre, vos alliés deviennent meilleurs — vos ennemis, plus vulnérables.`,
    effect: `Tant que vous êtes conscient et actif, votre Zone de Commandement devient une zone d’effet continue :
• Tous les alliés dans la zone :
    ◦ Gagnent +2 à tous leurs jets (attaque, défense, initiative, compétence)
    ◦ Récupèrent +1 PE à la fin de leur tour
    ◦ Stresse divisé par 2.
• Tous les ennemis dans la zone :
    ◦ Ont –2 à tous leurs jets de volonté, discipline et perception
    ◦ Tous les ennemis dans votre zone subissent –2 à leurs jets d’attaque et d’esquive.`,
    prereqs: { minLevel: 18 },
    // Prérequis Notion : Leadership 18
    url: `https://www.notion.so/206abc3abb3a80a3ac09c9f103dbdfb0`,
  },
  {
    id: `loyaute`,
    skillId: `général`,
    name: `Loyauté`,
    category: 'Maître',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 2,
    description: `Ce n’est pas un ordre. Ce n’est même plus de la tactique. C’est ce que vous incarnez. Dans ce moment de rupture, il vous regarde — et il se souvient pourquoi il se bat.`,
    effect: `Lorsqu’un allié situé dans votre zone de commandement effectue un test de stress, vous pouvez changer le résultat et remplacer l’effet par une réussite.`,
    prereqs: { minLevel: 15 },
    // Prérequis Notion : Leadership 15
    url: `https://www.notion.so/206abc3abb3a80abb3a9d7d8237d119f`,
  },
  {
    id: `manuvre`,
    skillId: `général`,
    name: `Manœuvre`,
    category: 'Maître',
    type: 'technique',
    family: `Le Commandant`,
    peCost: 3,
    description: `Vous déclenchez une manœuvre coordonnée d’envergure, comme si chaque mouvement était un rouage d’une machine parfaitement huilée.`,
    effect: `Choisissez 3 alliés dans votre zone de commandement. Chacun peut immédiatement effectuer une action simple gratuite (attaque, déplacement, interaction, etc.).
• Si au moins deux réussissent (jet d’attaque ou objectif atteint), vous pouvez rejouer immédiatement après eux,`,
    prereqs: { minLevel: 16 },
    // Prérequis Notion : Tactique militaire 16
    url: `https://www.notion.so/206abc3abb3a80fe9532e04f11958718`,
  },

  // Famille : Le protecteur
  {
    id: `provocation-mesuree`,
    skillId: `général`,
    name: `Provocation Mesurée`,
    category: 'Novice',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 1,
    description: `Tu tapes ton bouclier, lances une insulte, ou assumes une posture menaçante.`,
    effect: `Choisis un ennemi à portée de vue. Il doit réussir un test de Sang-Froid ou être forcé de t’attaquer à son prochain tour s’il en a la possibilité.

Bonus : Si la cible échoue critique, elle attaque immédiatement avec –2 (hors de son tour).

Cette attaque ne peut pas être évitée par esquive ou désengagement si elle est déclenchée.`,
    url: `https://www.notion.so/207abc3abb3a80408679ce0edad2b479`,
  },
  {
    id: `fente-de-riposte`,
    skillId: `général`,
    name: `Fente de Riposte`,
    category: 'Novice',
    type: 'technique',
    family: `Le protecteur`,
    description: `Tu bloques une attaque et profites de l’ouverture pour contre-attaquer.`,
    effect: `Condition : Utilisable juste après avoir réussi une parade.


Effectue une contre-attaque immédiate contre la cible ayant raté son attaque.

Si tu es adjacent à un deuxième ennemi, tu peux choisir de frapper celui-ci à la place avec –1 à l’attaque.

Bonus : Si l’attaque touche, l’ennemi ciblé est repoussé d’une case.`,
    url: `https://www.notion.so/207abc3abb3a80aea3f9d3ed3ebcfb06`,
  },
  {
    id: `mur-implacable`,
    skillId: `général`,
    name: `Mur Implacable`,
    category: 'Novice',
    type: 'passif',
    family: `Le protecteur`,
    description: `Tu refuses de reculer. Tu bloques la voie, mentalement et physiquement.`,
    effect: `Tant que tu ne te déplaces pas durant ton tour, tu gagnes +1 en défense contre toutes les attaques jusqu’à ton prochain tour.

Si un ennemi tente de passer à travers toi (désengagement ou contournement), il doit réussir un test de Force ou rester bloqué.

Bonus : Les alliés derrière toi gagnent +1 en défense contre les attaques à distance.`,
    url: `https://www.notion.so/207abc3abb3a80f4852bfb1c79f50033`,
  },
  {
    id: `ligne-infranchissable`,
    skillId: `général`,
    name: `Ligne Infranchissable`,
    category: 'Adepte',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 2,
    description: `Tu étires ton bouclier et ta lame pour barrer la route.`,
    effect: `Choisis une ligne de 3 cases devant toi. Jusqu’à ton prochain tour, tout ennemi qui tente d’entrer ou de traverser cette ligne doit réussir un test de Force ou s’arrêter immédiatement.

Bonus : Les alliés dans cette ligne ou derrière toi gagnent +1 en défense contre les attaques de mêlée.`,
    url: `https://www.notion.so/207abc3abb3a809ea4fafb9d47c3dac6`,
  },
  {
    id: `poste-de-garde`,
    skillId: `général`,
    name: `Poste de Garde`,
    category: 'Adepte',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 2,
    description: `Tu assumes une posture d’attente, prêt à intercepter tout ce qui bouge.`,
    effect: `Choisis une zone de 2 cases autour de toi. Jusqu’à ton prochain tour, si un ennemi entre dans cette zone, tu peux faire une attaque gratuite avec –2 (une fois par ennemi).`,
    url: `https://www.notion.so/207abc3abb3a80d4a5fddbf227c8869b`,
  },
  {
    id: `interposition`,
    skillId: `général`,
    name: `Interposition`,
    category: 'Adepte',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 1,
    description: `Tu bondis pour t’interposer entre un allié et une attaque.`,
    effect: `Lorsque un allié adjacent est visé par une attaque, tu peux utiliser cette technique pour devenir la cible à sa place.


• Tu reçois un +2 en défense contre cette attaque.
• Bonus : Si tu bloques complètement l’attaque (aucun dégât reçu), tu récupères 1 PE à ton prochain tour.

Une fois par allier`,
    url: `https://www.notion.so/207abc3abb3a80f4a7c9c1fbc18fa680`,
  },
  {
    id: `bastion-immuable`,
    skillId: `général`,
    name: `Bastion Immuable`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 2,
    description: `Tu plantes les pieds, abaisse ton centre de gravité, et deviens un mur vivant.`,
    effect: `Jusqu’à ton prochain tour :
• Tu gagnes +2 en défense,
• Tu ignores tous les effets de recul, de renversement ou de poussée.

Si tu ne te déplaces pas pendant 2 tours consécutifs, tu gagnes +2 PE supplémentaire à la fin du second tour.

Bonus : Les ennemis qui te ratent une attaque de mêlée subissent 1 dégât brut (contre-impact).`,
    url: `https://www.notion.so/207abc3abb3a801e8071f4df3ff976b8`,
  },
  {
    id: `choc-de-rempart`,
    skillId: `général`,
    name: `Choc de Rempart`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 1,
    description: `Tu charges avec ton bouclier ou le bord de ta lame en travers, frappant de tout ton poids pour faire voler l’adversaire.`,
    effect: `Effet :
• Frappe une cible en mêlée (test d’attaque normal).
• En cas de succès :
    ◦ Inflige 2 dégâts.
    ◦ La cible est repoussée de 5m en ligne droite (contre un mur ou un obstacle : +1 dégât).
    ◦ Si elle percute un autre ennemi : les deux sont déséquilibrés.`,
    url: `https://www.notion.so/207abc3abb3a8066b7c8e035e9e06fa6`,
  },
  {
    id: `frappe-dinterception`,
    skillId: `général`,
    name: `Frappe d’Interception`,
    category: 'Professionnel',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 1,
    description: `Tu observes une ouverture dans l'élan ennemi et frappes au moment même où il tente de blesser ton allié.`,
    effect: `Condition : Un allié à 5m cases ou moins est ciblé par une attaque de mêlée.

Tu déclenches une attaque immédiate contre l’assaillant avant que son attaque ne se résolve.`,
    url: `https://www.notion.so/207abc3abb3a808c9978f6d9e8faf293`,
  },
  {
    id: `substitution`,
    skillId: `général`,
    name: `Substitution`,
    category: 'Maître',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 2,
    description: `En un instant, tu échanges ta place avec un allié en danger — bouclier levé, prêt à encaisser.`,
    effect: `Condition : Un allié est à 6m ou moins de toi, visible, et sur le point d’être attaqué (ou ciblé par une menace).


Intervertis immédiatement ta position avec celle de l’allié ciblé (même si ce n’est pas ton tour).

Tu prends sa place dans l’initiative pour cette attaque (ou menace).Tu gagnes +3 à la défense contre l’attaque à venir.

L’allié interverti gagne +1 à sa prochaine attaque ou esquive.

Ca ne compte pas comme un deplacement

Une fois par tours`,
    url: `https://www.notion.so/207abc3abb3a807b98efebdad3c79fa5`,
  },
  {
    id: `fente-controlee`,
    skillId: `général`,
    name: `Fente Contrôlée`,
    category: 'Maître',
    type: 'technique',
    family: `Le protecteur`,
    peCost: 4,
    description: `Un coup en arc de cercle qui contrôle l’espace et punit ceux qui s'approchent trop.`,
    effect: `Frappe jusqu’à 3 ennemis en demi-cercle autour de toi (avant, avant-gauche, avant-droit)

.Chaque touche impose un test de vigueur : échec → –1 à l’attaque jusqu’à leur prochain tour.

Toute cible ayant attaqué un allié ce tour subit +1 dégât.`,
    url: `https://www.notion.so/207abc3abb3a80f6b2aaed98847258d7`,
  },
  {
    id: `mur-inebranlable`,
    skillId: `général`,
    name: `Mur Inébranlable`,
    category: 'Maître',
    type: 'passif',
    family: `Le protecteur`,
    description: `Tant que tu ne bouges pas pendant ton tour, tu entres dans un état d’immobilité parfaite.`,
    effect: `Tu gagnes +2 en défense.Tu ignores les effets de recul ou de repoussement (même magiques ou puissants).Si un ennemi te frappe en mêlée et échoue, il est automatiquement déséquilibré.`,
    url: `https://www.notion.so/207abc3abb3a80fc9f4aeea697cd7933`,
  },

  // Famille : L’Anticipation
  {
    id: `posture-de-laiguillon`,
    skillId: `général`,
    name: `Posture de l’Aiguillon`,
    category: 'Novice',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu prépares un coup terrible… mais seulement si l’ennemi te laisse le temps de le porter.`,
    effect: `Tu n’attaques pas ce tour-ci.

Pour chaque attaque que tu subis ce tours, ta prochaine attaque +1 et +2 si elle est défendu.`,
    url: `https://www.notion.so/207abc3abb3a8095ae1fca83d9842711`,
  },
  {
    id: `posture-de-la-muraille`,
    skillId: `général`,
    name: `Posture de la Muraille`,
    category: 'Novice',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu n’avances pas. Tu attends que l’ennemi vienne s’écraser sur ta garde parfaite.`,
    effect: `Jusqu’au début de ton prochain tour, tu gagnes +2 en défense passive.


Tant que cette posture est active, tu ne peux pas te déplacer volontairement.`,
    url: `https://www.notion.so/207abc3abb3a80d4aab2c453a88dd302`,
  },
  {
    id: `gardien`,
    skillId: `général`,
    name: `Gardien`,
    category: 'Adepte',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tes pas tracent un cercle invisible.`,
    effect: `Les ennemis qui entrent ou sortent de ta zone de contrôle subissent 1 PE de perte.

Les allier a 3m de toi on +1 a la défense.`,
    url: `https://www.notion.so/207abc3abb3a804ba519e4b75484dbbe`,
  },
  {
    id: `il-du-duel`,
    skillId: `général`,
    name: `Œil du Duel`,
    category: 'Adepte',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu entres dans un face-à-face absolu.`,
    effect: `Choisis un ennemie qui serait provoqué.

+2 à toutes tes attaques et défenses contre elle

+1 dégâts

-3 dans toutes les actions qui ne la concerne pas`,
    url: `https://www.notion.so/207abc3abb3a806cbaafd33298889c82`,
  },
  {
    id: `posture-du-serpent`,
    skillId: `général`,
    name: `Posture du Serpent`,
    category: 'Adepte',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu observes. Tu t’enroules autour de l’intention adverse. Ta lame attend le moment exact.`,
    effect: `Si un ennemi se déplace à portée de ta mêlée durant ce tour, tu peux immédiatement effectuer une attaque d’opportunité gratuite, avec +2 dégâts.

Les attaques que tu défends font perdre 1 PE supplémentaire.`,
    url: `https://www.notion.so/207abc3abb3a808ead58e1a0d09659c4`,
  },
  {
    id: `lame-dechainee`,
    skillId: `général`,
    name: `Lame Déchaînée`,
    category: 'Professionnel',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu ouvres ta garde, prêt à frapper sans retenue.`,
    effect: `Tu ne peux pas de te défendre.

Chaque attaque réussite annule son coup en PE (max 3)`,
    url: `https://www.notion.so/207abc3abb3a8013bd2ff32c087f873e`,
  },
  {
    id: `transition-fluide`,
    skillId: `général`,
    name: `Transition fluide`,
    category: 'Professionnel',
    type: 'technique',
    family: `L’Anticipation`,
    peCost: 2,
    description: `Tu modifies ton centre de gravité et passes à une autre posture immédiatement.`,
    effect: `change de posture en cours de tour.`,
    url: `https://www.notion.so/207abc3abb3a8096a74ff2a0e89324cd`,
  },
  {
    id: `souffle-tournant`,
    skillId: `général`,
    name: `Souffle Tournant`,
    category: 'Maître',
    type: 'technique',
    family: `L’Anticipation`,
    description: `Tu entres dans une danse fluide, chaque geste nourrissant le suivant.`,
    effect: `Pour chaque action réussie ce tour (attaque ou parade), ta prochaine action gagne +2 (cumulable 3x max dégât compris)

Malus : si une action rate, perds tous les bonus accumulés et subis -1 PE de pénalité`,
    url: `https://www.notion.so/207abc3abb3a807a8e50d03874c1e7df`,
  },

  // Famille : Raazhkor
  {
    id: `premier-qui-frappe`,
    skillId: `général`,
    name: `Premier Qui Frappe`,
    category: 'Novice',
    type: 'passif',
    family: `Raazhkor`,
    description: `Raazhkor valorise ceux qui frappent les premiers. L’initiative agressive est un acte sacré qui affirme naturellement la place du dominant.`,
    effect: `Si l’adeptes déclenche le combat il gagne 1d6 a de dégât a dépenser.`,
    url: `https://www.notion.so/2c4abc3abb3a800896f9e5e285b0079d`,
  },
  {
    id: `marque-du-plus-fort`,
    skillId: `général`,
    name: `Marque du Plus Fort`,
    category: 'Novice',
    type: 'passif',
    family: `Raazhkor`,
    description: `Une victoire nette porte un message silencieux : “Tu es en dessous”. Raazhkor bénit cette humiliation en affaiblissant l’adversaire soumis.`,
    effect: `En gagnant un duel d’attaque avec une différence d’au moins 5, la cible reçoit la Marque.
La cible marquée subit –1 à ses attaques contre l’utilisateur jusqu’à la fin de son prochain tour.`,
    url: `https://www.notion.so/2c4abc3abb3a80339712f59530fcf0b3`,
  },
  {
    id: `frisson-du-predateur`,
    skillId: `général`,
    name: `Frisson du Prédateur`,
    category: 'Novice',
    type: 'passif',
    family: `Raazhkor`,
    description: `La présence de l’élu impose une hiérarchie invisible. Les êtres plus faibles sentent instinctivement qu’ils sont en dessous. Une tension animale les traverse : muscles crispés, respiration hachée, le cœur bat trop vite. Ils savent qu’ils pourraient être écrasés s’il le décide. Raazhkor marque ainsi ceux qui n’oseraient jamais le défier.`,
    effect: `Toute créature considérée comme plus faible que l’utilisateur
(niveau inférieur ou statut narratif moindre) subit –1 à tous ses jets opposés contre lui hors combats`,
    url: `https://www.notion.so/2c4abc3abb3a80e484f8e010e478f05c`,
  },
  {
    id: `domination`,
    skillId: `général`,
    name: `Domination`,
    category: 'Adepte',
    type: 'technique',
    family: `Raazhkor`,
    peCost: 1,
    description: `Chaque coup réussi se renforce du précédent. Raazhkor favorise ceux qui écrasent sans relâche.`,
    effect: `Si l’utilisateur touche un ennemi lors de son tour, il gagne un bonus cumulatif de +1 aux dégâts contre cette cible (max +3).
Le bonus disparaît dès que l’utilisateur manque son attaque ou change de cible.`,
    url: `https://www.notion.so/2c4abc3abb3a800e9a5cd1d0a3781bf6`,
  },
  {
    id: `a-genoux`,
    skillId: `général`,
    name: `A Genoux`,
    category: 'Adepte',
    type: 'technique',
    family: `Raazhkor`,
    peCost: 2,
    description: `L’attaque n’a rien de noble. Elle ne vise ni le cœur, ni la gorge : elle vise à briser l’équilibre, plier un genou, couper le souffle, forcer la posture de soumission.
Ce coup n’est pas fait pour tuer, mais pour rappeler à l’adversaire sa place dans la chaîne alimentaire.
Raazhkor exulte lorsqu’un ennemi tombe ainsi devant son élu.`,
    effect: `L’utilisateur porte une attaque “À Genoux”.

Elle inflige la moitié des dégâts normaux (arrondis à l’inférieur).
• Si l’attaque réussit, et si la différence au duel est d’au moins 3, la cible tombe à terre (ou perd son équilibre, selon la créature).
• Une cible à terre subit désavantage à son prochain duel d’attaque et –1 à son prochain duel de défense contre l’utilisateur.
Punition (bonus à la prochaine attaque)
Si l’utilisateur attaque la même cible dans ce tour, il gagne :
• +2 à son jet d’attaque,
• +2 aux dégâts.`,
    url: `https://www.notion.so/2c4abc3abb3a80189166fb28633f596b`,
  },
  {
    id: `faim-de-domination`,
    skillId: `général`,
    name: `Faim de Domination`,
    category: 'Professionnel',
    type: 'passif',
    family: `Raazhkor`,
    description: `Chaque acte de domination nourrit Raazhkor.
Chaque victoire renforce l’élu.
La violence devient une boucle ascendante.`,
    effect: `À chaque fois que l’utilisateur remporte un duel d’attaque avec une différence de 5 ou plus, il gagne un bonus cumulatif de +1 dégâts pour la suite du combat.

Maximum : +3.
(Redescend à 0 à la fin du combat.)`,
    url: `https://www.notion.so/2c4abc3abb3a808b9268f5da1835bf24`,
  },
  {
    id: `brise-ame`,
    skillId: `général`,
    name: `Brise Âme`,
    category: 'Professionnel',
    type: 'technique',
    family: `Raazhkor`,
    peCost: 3,
    description: `Lorsque la volonté d’un adversaire commence à faiblir, Raazhkor souffle à son élu l’instinct exact du moment où “la bête se couche”.

Un regard, un mot, une posture, un pas en avant :

tout ce qui reste à faire est d’écraser la dernière braise de résistance.
L’utilisateur n’a pas besoin d’être barbare :

il impose la reddition par la hiérarchie pure.

Le faible reconnaît le fort.

La chaîne alimentaire s’accomplit.`,
    effect: `L’utilisateur cible un adversaire affaibli au sens suivant :
• blessé en dessous de 20% PV,
L’utilisateur déclenche alors Brise-Genoux de l’Âme :
Il effectue un jet Intimidation, avec +1 au jet.

La cible oppose un jet de Volonté / Moral.
✔ Si l’utilisateur gagne
La cible se rend immédiatement :

elle cesse de combattre, jette son arme ou adopte une posture de soumission.
Elle n’attaque plus, ne se défend plus et accepte les ordres simples.
✔ Si l’utilisateur gagne avec 5+ de différence
La cible devient totalement brisée :
elle peut :
• supplier,
• révéler des informations,
• accepter une capture,
• ou renoncer à toute velléité combative.
✔ Si la cible gagne
Elle se ressaisit et devient temporairement immunisée à cette technique jusqu’à la fin du combat.`,
    url: `https://www.notion.so/2c4abc3abb3a80a582bfc96ef6223df6`,
  },
  {
    id: `ecrasement`,
    skillId: `général`,
    name: `Écrasement`,
    category: 'Professionnel',
    type: 'technique',
    family: `Raazhkor`,
    peCost: 2,
    description: `L’utilisateur impose sa présence comme une masse écrasante. Les faibles s’affaissent, les égaux doutent, les forts ressentent un bref vertige. C’est une réorganisation brutale de la chaîne alimentaire — et il en est le sommet.`,
    effect: `Deux fois par combat, l’utilisateur peut déclarer un Écrasement.

Tous les ennemis à portée de regard doivent faire un jet de Volonté (difficulté fixée par le MJ).
• Échec : La créature subit –2 à tous ses duels opposés contre l’utilisateur pendant trois tours.
• Échec critique : La créature perd immédiatement son action d’attaque ce tour-ci (elle hésite, recule, se fige).`,
    url: `https://www.notion.so/2c4abc3abb3a80c496d1c468ca995f6f`,
  },
  {
    id: `voix-du-dominant`,
    skillId: `général`,
    name: `Voix du Dominant`,
    category: 'Professionnel',
    type: 'technique',
    family: `Raazhkor`,
    description: `Lorsque quelqu’un tente de convaincre, manipuler ou influencer l’élu de Raazhkor, ce dernier ressent immédiatement la faiblesse dans les arguments adverses. S’il ne cède pas, la tentative devient une faute, une brèche hiérarchique.
Raazhkor souffle alors à son champion une contre-attaque verbale cinglante, instinctive, faite pour écraser l’autre et reprendre le dessus.
Ce n’est plus une réponse : c’est une domination.`,
    effect: `Lorsqu’une créature tente une action de persuasion, manipulation, intimidation ou influence contre l’utilisateur, et que celui-ci résiste ou remporte le jet opposé, il peut immédiatement déclencher une contre-attaque sociale.
L’utilisateur fait alors un jet d’Autorité / Intimidation / Domination contre la même cible, avec +2 au jet.
• En cas de réussite avec 5+ de différence cela devient automatiquement une réussite critique`,
    url: `https://www.notion.so/2c4abc3abb3a80c599f7d0f84a0819b8`,
  },
  {
    id: `couronne-du-predateur`,
    skillId: `général`,
    name: `Couronne du Prédateur`,
    category: 'Maître',
    type: 'passif',
    family: `Raazhkor`,
    description: `La présence du champion de Raazhkor impose une hiérarchie évidente :
tous savent instinctivement qu’il est au sommet.

Les faibles tremblent, les forts doutent, les égaux vacillent.`,
    effect: `L’aura de l’utilisateur est sans pareil, les créatures plus faible subissent -5 a tous les jets hors combats.
Les plus fortes ou de rangs équivalent -2.`,
    url: `https://www.notion.so/2c4abc3abb3a800d9e1ed9284e80b9cb`,
  },
  {
    id: `desertion-hereditaire`,
    skillId: `général`,
    name: `Désertion Héréditaire`,
    category: 'Maître',
    type: 'technique',
    family: `Raazhkor`,
    peCost: 3,
    description: `Le Champion de Raazhkor incarne la loi ancienne qui précède toute morale :un faible ne se bat jamais contre un prédateur.
Son simple regard, sa posture, son aura brise les réflexes de loyauté et réécrit les hiérarchies anciennes.
Les faibles cessent de voir leur chef ; ils voient le prédateur.
Et ils réagissent comme le veut la nature :fuite, prosternation… ou ralliement au plus fort.`,
    effect: `L’utilisateur cible une créature considérée comme faible, au sens suivant :
• niveau inférieur,
• ou moral bas,
• ou blessée en dessous de 25% PV,
• ou déjà intimidée/affectée par une technique de Raazhkor,
• ou simple soldat / subalterne dans un groupe (statut narratif faible).
Il déclenche Désertion Héréditaire.
L’utilisateur effectue un jet de Domination / Autorité avec +2.

La cible oppose un jet de Volonté/Moral.
✔ Si l’utilisateur gagne
La cible fuit immédiatement, prenant la fuite ou se mettant hors de combat.

Elle ne peut plus ré-entrer volontairement dans le combat.
✔ Si l’utilisateur gagne avec 7+ de différence
La cible change d’allégeance pour la scène :
• elle refuse d’obéir à son ancien chef,
• elle peut donner des informations,
• elle peut rester immobile, reculer, ou adopter une posture “neutre”,
• dans des cas exceptionnels, elle peut même se joindre au groupe de l’utilisateur (MJ décide selon la créature).
✔ Si réussite avec 10+ de différence
La domination est absolue :

la créature devient trop terrifiée pour jamais lever la main contre l’utilisateur.

Elle peut développer une crainte durable.
✔ Si la cible gagne
Elle résiste mais subit désavantage à toute future tentative d’influence contre l’utilisateur.`,
    url: `https://www.notion.so/2c4abc3abb3a8041ae59c0fcb41489e5`,
  },

  // Famille : Œil Absolu
  {
    id: `lecture-douverture`,
    skillId: `général`,
    name: `Lecture d’Ouverture`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Absolu`,
    description: `Vous ne réagissez pas. Vous lisez le moment où il a cru prendre une décision.`,
    effect: `Choisissez un ennemi à vue et annoncez une intention probable de sa part pour le prochain tour :
• Attaquer, se déplacer, se défendre, ou interagir.Si votre prédiction est correcte :
• Vous gagnez +2 pour le toucher contre lui jusqu’à la fin de votre prochain tour.
• Et il subit –1 à son action prédite.

Si elle est incorrecte : rien ne se passe.

Vous ajoutez un token “Lu”`,
    url: `https://www.notion.so/206abc3abb3a800d8b16e2318d7f174c`,
  },
  {
    id: `experience`,
    skillId: `général`,
    name: `Expérience`,
    category: 'Novice',
    type: 'passif',
    family: `Œil Absolu`,
    description: `Vous n’avez besoin que d’un échange. Une esquive, un mouvement d’épaule, un tic nerveux. Ensuite… tout devient prévisible.`,
    effect: `Si vous attaquez la même cible que lors de votre tour précédent, vous gagnez +1 pour toucher cette cible.
• Ce bonus est cumulable avec d'autres effets, y compris les prédictions réussies.
• Il se réinitialise si vous changez de cible ou perdez de vue l’ennemi.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Sagesse 2
    url: `https://www.notion.so/206abc3abb3a80199249def301d031d2`,
  },
  {
    id: `posture-prevue`,
    skillId: `général`,
    name: `Posture Prévue`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Absolu`,
    description: `Ce n’est pas que vous parez. Vous êtes déjà là où son arme ne va pas.`,
    effect: `Effet :
Avant de lancer son attaque, annoncez : "Il va frapper haut", "il tente une feinte", "il mise tout sur la puissance"...Si vous avez raison sur son type d’attaque (MJ valide selon l'intention), vous :
• Vous avez +2 en défense,
• Et vous pouvez effectuer une contre-attaque immédiate avec –1 au jet.

1 fois par tours

Vous ajoutez un token “Lu”`,
    url: `https://www.notion.so/206abc3abb3a8028bbd6f62fd606085c`,
  },
  {
    id: `exploitation-du-schema`,
    skillId: `général`,
    name: `Exploitation du Schéma`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Absolu`,
    description: `Vous ne frappez pas au hasard. Vous terminez un puzzle que vous aviez déjà presque résolu.`,
    effect: `Choisissez une cible que vous avez déjà observée via une technique comme Lecture d’Ouverture ou que vous avez attaquée au moins deux fois consécutivement.
Vous effectuez une attaque contre elle avec +1 pour toucher.Si vous touchez, vous appliquez un effet tactique au choix :
• Déséquilibre (–2 à sa prochaine action offensive)
• Recul de 1 case`,
    prereqs: { minLevel: 5 },
    // Prérequis Notion : Sagesse 5
    url: `https://www.notion.so/206abc3abb3a804087a6ce8f34fb4d30`,
  },
  {
    id: `contre-sequence`,
    skillId: `général`,
    name: `Contre-séquence`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 2,
    description: `Il lève son arme, commence à prononcer les mots… et c’est trop tard. Tu es déjà dans l'interstice de son mouvement, et ton attaque le précède.`,
    effect: `Si tu as réussi une Lecture (Lecture d’Ouverture) contre une cible ce tour, tu peux interrompre son action par une attaque immédiate (–1 au jet).

Cette attaque a lieu avant la résolution de son action.Si l’attaque touche, l’action de la cible est entièrement annulée (attaque perdue, sort interrompu, mouvement stoppé…).Ne peut être utilisée qu’une fois par tour.`,
    prereqs: { minLevel: 5 },
    // Prérequis Notion : Sagesse 5
    url: `https://www.notion.so/206abc3abb3a8041adf8fe0b2b957f47`,
  },
  {
    id: `point-de-rupture`,
    skillId: `général`,
    name: `Point de Rupture`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 1,
    description: `Vous n’avez pas lu son esprit. Vous avez repéré la faille dans sa séquence mentale. Et vous l’avez frappé exactement là.`,
    effect: `Choisissez une cible que vous avez prédite correctement deux fois ou plus durant ce combat.

Vous déclenchez une attaque ou action spéciale qui inflige +2 dégâts ou inflige automatiquement un état mental léger (panique, doute, hésitation).
Si la cible est un commandant, mage ou autre unité de contrôle, elle perd sa capacité à donner des ordres ou maintenir des effets pour un tour.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Sagesse 6
    url: `https://www.notion.so/206abc3abb3a807dad6fcd134296da78`,
  },
  {
    id: `premonition-verbale`,
    skillId: `général`,
    name: `Prémonition Verbale`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 1,
    description: `Il voulait agir. Mais vous l’avez déjà annoncé. Et soudain, il ne sait plus s’il agit de lui-même… ou selon votre plan.`,
    effect: `Au début du tour d’un ennemi visible, vous prononcez à voix haute ce que vous prévoyez qu’il va faire (attaque précise, action de fuite, utilisation d’un objet, etc.).
• Si le MJ juge que votre annonce est pertinente et ciblée, la cible doit faire un test de volonté (DD fixe ou opposé à votre score de sagesse).
• En cas d’échec, l’ennemi est déstabilisé :
    ◦ teste de courage,
    ◦ –4 à son prochain jet,
    ◦ Ne peut pas changer d’action sans perdre son tour,
Limite : 1 fois par combat par cible.`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Sagesse 4 | Intimidation 3
    url: `https://www.notion.so/206abc3abb3a80c4982bf692fc1e34a6`,
  },
  {
    id: `piege-mental`,
    skillId: `général`,
    name: `Piège Mental`,
    category: 'Professionnel',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 1,
    description: `Vous ne tendez pas un piège avec des cordes. Vous le posez dans sa tête. Et maintenant, il marche au bord d’un fil.`,
    effect: `Choisissez une cible que vous avez déjà lue ce combat. Vous annoncez une action spécifique qu’elle ne doit pas faire (ex. : attaquer, fuir, recharger…).
• Si la cible réalise cette action, elle déclenche le Piège :
    ◦ Subit 1D6 dégâts
• Si elle évite l’action, elle subit –1 à toutes ses actions ce tour à cause de la contrainte mentale.`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Sagesse 9 | Intimidation 6
    url: `https://www.notion.so/206abc3abb3a80578e76c24a36465525`,
  },
  {
    id: `lecture-parfaite`,
    skillId: `général`,
    name: `Lecture Parfaite`,
    category: 'Professionnel',
    type: 'passif',
    family: `Œil Absolu`,
    description: `Il n’est plus un adversaire. Il est un problème résolu. À ce stade, vous n’avez plus besoin de réfléchir : vous l’avez déjà battu dans votre esprit.`,
    effect: `Si vous avez réussi au moins deux Lectures (Lecture d’Ouverture) contre un même ennemi durant ce combat, vous entrez dans un état de maîtrise totale face à cette cible :
• Vous gagnez +2 à tous vos jets offensifs et défensifs contre elle,
• Vous êtes immunisé à ses tentatives de feinte ou d’intimidation,
• Elle subit –1 à ses tests mentaux face à vous,`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Sagesse 9
    url: `https://www.notion.so/206abc3abb3a80799f38d62ac8a5f310`,
  },
  {
    id: `coup-parfait`,
    skillId: `général`,
    name: `Coup Parfait`,
    category: 'Professionnel',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 3,
    description: `Ce n’est pas de la précision. C’est l’alignement total entre vous, le moment, et le point exact qu’il ne fallait pas laisser ouvert.`,
    effect: `Pré-requis : La cible a été lue avec succès ce tour ou le précédent.
Effet :

Vous effectuez une attaque avec +2 pour toucher.
• Si vous touchez, vous pouvez choisir la conséquence :
    ◦ Infliger dégâts maximum
    ◦ Ignorer l’armure/couvert
    ◦ Appliquer un effet tactique (renversement, silence, désarmement léger…)`,
    prereqs: { minLevel: 11 },
    // Prérequis Notion : Sagesse 11
    url: `https://www.notion.so/206abc3abb3a80d78d7dd5b7de340f2a`,
  },
  {
    id: `annonce-du-destin`,
    skillId: `général`,
    name: `Annonce du Destin`,
    category: 'Professionnel',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 2,
    description: `Vous ne cherchez pas à éviter le coup. Vous l’avez déjà vu. Et votre mot est une sentence :ou il échoue, ou il vous touche — et paie pour cela.`,
    effect: `Avant que le MJ (ou l’adversaire) ne lance son jet d’attaque, vous annoncez à haute voix si vous pensez que l’attaque va toucher ou échouer.
• Si votre prédiction est correcte :
    ◦ Et que l’attaque échoue → vous pouvez immédiatement effectuer une contre-attaque gratuite (arme ou sort).
    ◦ Et que l’attaque touche → vous ne subissez que la moitié des dégâts.
• Si votre prédiction est incorrecte :
    ◦ Et que l’attaque touche → vous subissez les dégâts normalement.
    ◦ Et que l’attaque échoue → il ne se passe rien.
Limite : 1 fois par combat par cible.

Vous ajoutez un token “Lu”`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Sagesse 9
    url: `https://www.notion.so/206abc3abb3a80fc91f2d5e2a6b46277`,
  },
  {
    id: `fracture-de-tempo`,
    skillId: `général`,
    name: `Fracture de Tempo`,
    category: 'Maître',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 2,
    description: `Un quart de seconde d’avance suffit. Et tout son enchaînement explose de l’intérieur.`,
    effect: `Vous choisissez un ennemi actif dont vous avez anticipé une action au moins une fois.
• Vous perturbez sa séquence. Il doit réussir un sagesse :
    ◦ Il perd son prochain tour,
    ◦ Et tous vos alliés gagnent +2 pour le toucher.`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Sagesse 13
    url: `https://www.notion.so/206abc3abb3a80298028caf1f10fc8ab`,
  },
  {
    id: `cartographie-du-mouvement`,
    skillId: `général`,
    name: `Cartographie du Mouvement`,
    category: 'Maître',
    type: 'passif',
    family: `Œil Absolu`,
    description: `Elle n’est plus un adversaire. C’est une équation résolue. Ses mouvements sont du passé – vous êtes dans l’après.`,
    effect: `À chaque fois que vous observez une cible avec succès deux fois dans un combat, vous pouvez :
• Visualiser son plan d’action global : déplacements, cibles prioritaires, comportements.
• Vous gagnez contre elle :
    ◦ +1 à tous vos jets
    ◦ +4 en initiative en début de chaque round tant qu’elle est active
    ◦ Immunité à ses attaques surprises ou détournées`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Sagesse 13
    url: `https://www.notion.so/206abc3abb3a8038beffce03e68f6cb7`,
  },
  {
    id: `breche-totale`,
    skillId: `général`,
    name: `Brèche Totale`,
    category: 'Maître',
    type: 'technique',
    family: `Œil Absolu`,
    peCost: 2,
    description: `Vous avez vu chaque hésitation, chaque souffle, chaque habitude. Et maintenant, vous placez le coup qui arrête tout.
Pas fort. Juste… inévitable.`,
    effect: `Pré-requis : La cible doit avoir été analysée au moins trois fois (Lecture d’Ouverture, Contre-séquence, Observation répétée…)
Effet :

Vous effectuez une attaque décisive contre une cible dont tous les schémas vous sont désormais familiers.
• L’attaque est faite avec +2 pour toucher, ignore le couvert et annule tout bonus défensif passif (posture, terrain…).
• Si elle touche :
    ◦ Elle inflige des dégâts critiques.
    ◦ La cible subit en plus un effet tactique irréversible : désarmement, chute, perte de capacité, silence, etc.`,
    prereqs: { minLevel: 16 },
    // Prérequis Notion : Sagesse 16
    url: `https://www.notion.so/206abc3abb3a80a0b2ccd71a1ffc8736`,
  },

  // ── LONGUE-LAME ─────────────────────────────────────────────────

  // Famille : Danse du Fil
  {
    id: `fente`,
    skillId: `longue-lame`,
    name: `Fente`,
    category: 'Novice',
    type: 'technique',
    family: `Danse du Fil`,
    description: `Une frappe rapide, presque insaisissable.`,
    effect: `Effet : +1 à l’attaque si vous avez bougé d’au moins 3m avant de frapper.

Bonus : si vous touchez, vous pouvez reculer immédiatement 3m case sans coût.`,
    url: `https://www.notion.so/207abc3abb3a8012b904ff95c5e7bd83`,
  },
  {
    id: `pas-de-lame`,
    skillId: `longue-lame`,
    name: `Pas de Lame`,
    category: 'Novice',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 1,
    description: `Une frappe en mouvement, où le pas est aussi important que la lame.`,
    effect: `Frappe l’ennemi avec -2 dégât (attaque légère).


Après l’attaque, tu peux te déplacer de 3m gratuitement (sans provoquer d’attaque d’opportunité).

Si ce déplacement te fait sortir de la zone de menace, l’ennemi subit -1 à sa prochaine attaque contre toi (il perd son rythme).`,
    url: `https://www.notion.so/207abc3abb3a802aae5bcece3ca093e4`,
  },
  {
    id: `feinte-tournoyante`,
    skillId: `longue-lame`,
    name: `Feinte tournoyante`,
    category: 'Novice',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 0,
    description: `Tu donnes l’illusion d’une attaque franche, mais tu retires ta lame juste avant le contact.`,
    effect: `Ne fait aucun dégât, mais force l’ennemi à réagir (test de sagesse).

En cas d’échec, il perd 1 PE et -1 à sa prochaine parade ou attaque.

Tu gagnes +1 en défense jusqu’à ton prochain tour.`,
    url: `https://www.notion.so/207abc3abb3a8082ae06f76b6dfe54e9`,
  },
  {
    id: `danse-initiale`,
    skillId: `longue-lame`,
    name: `Danse initiale`,
    category: 'Novice',
    type: 'passif',
    family: `Danse du Fil`,
    description: `Tu as appris à t’insérer dans le rythme, même sans y penser.`,
    effect: `Tant que tu frappes un ennemi qui n’a pas réussis a te toucher, tu gagnes +1 à l’attaque.`,
    url: `https://www.notion.so/207abc3abb3a80d992ebed215c6f7c2f`,
  },
  {
    id: `lecture-douverture`,
    skillId: `longue-lame`,
    name: `Lecture d’Ouverture`,
    category: 'Adepte',
    type: 'passif',
    family: `Danse du Fil`,
    description: `Tu sais lire l’instant où la garde s’ouvre.`,
    effect: `Si un ennemi rate une attaque contre toi, ta prochaine attaque contre lui gagne +1 à l’attaque et +1 dégât.`,
    url: `https://www.notion.so/207abc3abb3a80589c61f3fc216e9a2b`,
  },
  {
    id: `estoc-fuyant`,
    skillId: `longue-lame`,
    name: `Estoc Fuyant`,
    category: 'Adepte',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 1,
    description: `Tu pénètres brièvement dans la garde adverse, pour un coup ciblé au moment parfait.`,
    effect: `Frappe infligeant +1 dégât par case parcourue ce tour (max +3).

Après l’attaque, tu dois reculer de 2 cases
Si tu ne peux pas reculer, tu perds 1 PE supplémentaire`,
    url: `https://www.notion.so/207abc3abb3a805aa658d130e91a5edd`,
  },
  {
    id: `pas-dechappee`,
    skillId: `longue-lame`,
    name: `Pas d’Échappée`,
    category: 'Professionnel',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 2,
    description: `Tu transformes un retrait défensif en une sortie gracieuse.`,
    effect: `• Te permet de quitter une zone de menace sans subir d’attaque d’opportunité.
• Tu peux te déplacer de 5m dans une direction libre.
• Si tu ne termines pas au contact d’un ennemi : gagne +1 PE.`,
    url: `https://www.notion.so/207abc3abb3a8035b5cad38630f77792`,
  },
  {
    id: `punition-du-rythme`,
    skillId: `longue-lame`,
    name: `Punition du Rythme`,
    category: 'Professionnel',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 2,
    description: `Tu frappes avec toute la force de ton tempo, là où ton adversaire s’est trop engagé.`,
    effect: `Utilisable uniquement si la cible a raté une attaque contre toi ce tour ou si elle s’engage.

Inflige +3 dégâts et applique saignement.Si la cible est déjà affectée par un malus d’Initiative : inflige +1 dégât supplémentaire.`,
    url: `https://www.notion.so/207abc3abb3a8043ace1ef636229e2d2`,
  },
  {
    id: `ronde-du-predateur`,
    skillId: `longue-lame`,
    name: `Ronde du prédateur`,
    category: 'Professionnel',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 1,
    description: `Tu danses autour de lui, le harcèles, et frappes quand il vacille.`,
    effect: `Pour chaque case différente autour de la cible d’où tu as attaqué depuis le début du combat, gagne +1 à la prochaine attaque (max +3).

réinitialise si tu restes immobile deux tours de suite ou si la cible bouge`,
    url: `https://www.notion.so/207abc3abb3a8052b8d9dbadfb8bdfa4`,
  },
  {
    id: `double-temps`,
    skillId: `longue-lame`,
    name: `Double Temps`,
    category: 'Maître',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 2,
    description: `Tu enchaînes deux actions dans une même impulsion, créant une ouverture impossible à suivre.`,
    effect: `• Permet d’enchaîner deux attaques simples sur deux cibles différentes à portée.
• Si les deux attaques touchent : tu peux immédiatement te déplacer de 2 cases sans provoquer.
• Ce mouvement ne peut pas être interrompu (aucune réaction ne peut l'arrêter).`,
    url: `https://www.notion.so/207abc3abb3a800e9aa9c43c38e2a914`,
  },
  {
    id: `fenetre-invisible`,
    skillId: `longue-lame`,
    name: `Fenêtre Invisible`,
    category: 'Maître',
    type: 'technique',
    family: `Danse du Fil`,
    peCost: 1,
    description: `Tu frappes dans l’instant où l’adversaire s’apprête à réagir`,
    effect: `Peut être utilisée hors de ton tour, en réaction à une attaque adverse qui rate.Tu effectues une attaque gratuite immédiate contre cette cible avec +2 à l’attaque.

• Si elle touche, l’adversaire subit –2 à son action et tu peux te deplacer de 2m`,
    url: `https://www.notion.so/207abc3abb3a8023a742d16faf1814a5`,
  },

  // Famille : L’Ecorcheur
  {
    id: `entaille-superficielle`,
    skillId: `longue-lame`,
    name: `Entaille Superficielle`,
    category: 'Novice',
    type: 'technique',
    family: `L’Ecorcheur`,
    description: `Une frappe rapide, peu profonde, mais bien placée. Elle ne cherche pas à tuer — juste à faire couler le sang.`,
    effect: `Inflige -3 dégât et applique 1 charge de Saignement.

Si la cible a déjà du Saignement, gagne +1 à ton attaque sur cette frappe.`,
    url: `https://www.notion.so/207abc3abb3a802d94f5cb30669cecfd`,
  },
  {
    id: `frappe-dagonie`,
    skillId: `longue-lame`,
    name: `Frappe d’Agonie`,
    category: 'Novice',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 1,
    description: `Tu vises une blessure déjà ouverte et l’élargis violemment.`,
    effect: `Si la cible est déjà en Saignement, inflige 1 dégât par charge de Saignement active (max 3), sans les consommer.

Bonus : La cible doit réussir un test de Constitution (10) ou subir –1 à sa prochaine attaque`,
    url: `https://www.notion.so/207abc3abb3a80dd8e79e56f27e680e0`,
  },
  {
    id: `coupe-nerfs`,
    skillId: `longue-lame`,
    name: `Coupe-nerfs`,
    category: 'Novice',
    type: 'technique',
    family: `L’Ecorcheur`,
    description: `Tu vises les muscles et tendons exposés, limitant les mouvements sans toucher d’organe vital.`,
    effect: `Inflige -3 dégât et 2 charges de Saignement.

La cible perd 1 case de Mouvement jusqu’à la fin de son prochain tour.`,
    url: `https://www.notion.so/207abc3abb3a80e389c1d99b5b35cf33`,
  },
  {
    id: `incision-profonde`,
    skillId: `longue-lame`,
    name: `Incision Profonde`,
    category: 'Adepte',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 1,
    description: `Tu enfonces ta lame dans une blessure existante, creusant jusqu’à la chair vive.`,
    effect: `Inflige -1 dégâts.
Si la cible a ≥ 3 charges de Saignement, elle en perd 1 et subit +2 dégâts supplémentaires.

Bonus : Si la cible tombe à 0 PE à cause de cette attaque, elle hurle, infligeant –1 au Moral de tous ses alliés dans un rayon de 3 cases.`,
    url: `https://www.notion.so/207abc3abb3a80b496d2f1fb766df7e7`,
  },
  {
    id: `danse-rouge`,
    skillId: `longue-lame`,
    name: `Danse Rouge`,
    category: 'Adepte',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 2,
    description: `Une série de frappes tourbillonnantes qui visent à ouvrir des lignes de sang partout sur le corps.`,
    effect: `Attaque jusqu’à 2 cibles différentes à portée (ou 2 fois la même).

Chaque frappe inflige -3 dégât et 2 charges de Saignement.


Bonus : Si au moins une des cibles atteint 5 charges de Saignement, gagne +1 PE.`,
    url: `https://www.notion.so/207abc3abb3a80ebb55de100dc730ac0`,
  },
  {
    id: `execution`,
    skillId: `longue-lame`,
    name: `Exécution`,
    category: 'Professionnel',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 2,
    description: `Tu arrêtes de jouer. Tu tues.`,
    effect: `Inflige des dégâts égaux à 2 + le nombre de marques sur la cible, puis retire toutes les marques.

Bonus : Si les dégâts dépassent la moitié de la vie max de la cible, elle doit réussir un test de moral ou fuir/panique.`,
    url: `https://www.notion.so/207abc3abb3a80538821cac9aca72204`,
  },
  {
    id: `marques-de-la-boucherie`,
    skillId: `longue-lame`,
    name: `Marques de la Boucherie`,
    category: 'Professionnel',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 1,
    description: `Chaque entaille est laissée volontairement ouverte, chaque blessure marquée d’un symbole de ta cruauté méthodique`,
    effect: `Inflige -1 dégât et applique 2 charges de Saignement.`,
    url: `https://www.notion.so/207abc3abb3a80d2b387f4863d885daf`,
  },
  {
    id: `hemorragie-active`,
    skillId: `longue-lame`,
    name: `Hémorragie Active`,
    category: 'Maître',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 2,
    description: `Tu tranches une veine apparente pour tout faire couler d’un coup.`,
    effect: `Consomme tous les saignements
Tous les saignements de la cible sont convertis en dégâts immédiats.`,
    url: `https://www.notion.so/207abc3abb3a80038980de0ed795c175`,
  },
  {
    id: `vapeur-sanglante`,
    skillId: `longue-lame`,
    name: `Vapeur Sanglante`,
    category: 'Maître',
    type: 'technique',
    family: `L’Ecorcheur`,
    peCost: 1,
    description: `Une lame qui coupe si fort que le sang gicle, aveugle et désoriente.`,
    effect: `Inflige 1 dégâts à toutes les cibles adjacentes à une cible avec 4+ marques, qui explosent en une brume sanglante.`,
    url: `https://www.notion.so/207abc3abb3a803ea6c5e0458c9c7dd9`,
  },

  // Famille : Onde de Choc
  {
    id: `coup-depaule-brutal`,
    skillId: `longue-lame`,
    name: `Coup d’Épaule Brutal`,
    category: 'Novice',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Une charge courte, brutale, pour briser une ligne ou ouvrir un passage.`,
    effect: `Effet :
• Choisis un ennemi à 1m. Fait un test de Force contre sa Consititution.
• En cas de succès : il recule de 3m et est au sols (prochain test de mouvement ou parade à -2).
• Ne provoque pas d’attaque d’opportunité.

1 par tours`,
    url: `https://www.notion.so/207abc3abb3a8000b282dac8c12139c7`,
  },
  {
    id: `onde-de-disruption`,
    skillId: `longue-lame`,
    name: `Onde de Disruption`,
    category: 'Novice',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Tu frappes le sol ou l’air d’un geste large et puissant pour briser la concentration ennemie.`,
    effect: `• Tous les ennemis dans un cône de 3 cases devant toi doivent faire un test de Constitution.
• En cas d’échec : leurs actions coûtent +1 PE jusqu’à leur prochain tour.

Une fois par tours`,
    url: `https://www.notion.so/207abc3abb3a80108d63e36f78e1b3ff`,
  },
  {
    id: `balayage-circulaire`,
    skillId: `longue-lame`,
    name: `Balayage Circulaire`,
    category: 'Novice',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Tu fais tournoyer ton arme avec force autour de toi, frappant tous ceux qui t’entourent.`,
    effect: `Effet :
• Attaque tous les ennemis en cercle de 2m case autour de toi.
• Chaque attaque se fait à -1 pour toucher.
• -3 de dégats.
Bonus – Si au moins 2 ennemis sont touchés :
• L’un d’eux est repoussé de 2 mètres au choix.`,
    url: `https://www.notion.so/207abc3abb3a8022ac4bf167ee32ecb6`,
  },
  {
    id: `cri-de-defi`,
    skillId: `longue-lame`,
    name: `Cri de Défi`,
    category: 'Novice',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Tu fais vibrer l’air d’un cri si brutal qu’il attire l’attention — ou la peur — de tous autour de toi.`,
    effect: `• Tous les ennemis dans un rayon de 6m doivent faire un test de Sagesse.
• En cas d’échec, ils sont forcés de te cibler s’ils effectuent une attaque ou un déplacement offensif ce tour.
Bonus – Si 2 ennemis ou plus échouent :
• Tu gagnes +1 en Parade jusqu’à ton prochain tour.`,
    url: `https://www.notion.so/207abc3abb3a8055a451ce9dd2f1ddef`,
  },
  {
    id: `impact-destabilisant`,
    skillId: `longue-lame`,
    name: `Impact Déstabilisant`,
    category: 'Adepte',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Tu frappes avec une telle force que l’onde de choc s’étend bien au-delà de ta cible.`,
    effect: `Si ta prochaine attaque touche, tous les ennemis dans un rayon de 2m autour de la cible principale subissent :
• -1 à leurs attaques jusqu’à la fin de leur prochain tour.
• -1 à tous les tests de coordination (y compris parade, esquive, etc.)Effet uniquement déclenché si l’attaque réussit.`,
    url: `https://www.notion.so/207abc3abb3a8014a33fcca432bac5e5`,
  },
  {
    id: `pietinement-brutal`,
    skillId: `longue-lame`,
    name: `Piétinement Brutal`,
    category: 'Adepte',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 2,
    description: `Tu abats ton arme avec une telle puissance que l’onde de choc fige tous les corps autour de toi.`,
    effect: `Tous les ennemis dans un rayon de 2m font un test de Résistance.En cas d’échec : ils sont immobilisés jusqu’à la fin de leur prochain tour.Même en cas de réussite : ils subissent -3m en déplacement pendant 1 tour.

Bonus :
• Si au moins 2 ennemis sont immobilisés, tu gagnes +1 PE au début de ton prochain tour.`,
    url: `https://www.notion.so/207abc3abb3a801b8f58e1baa6a1853c`,
  },
  {
    id: `zone-cadenassee`,
    skillId: `longue-lame`,
    name: `Zone Cadenassée`,
    category: 'Adepte',
    type: 'passif',
    family: `Onde de Choc`,
    description: ``,
    effect: `Tout ennemi dans ta zone d’allonge qui tente de se désengager (fuite, repli, repositionnement) doit réussir un test de Dextérité

.En cas d’échec : il reste sur place et perd son action de déplacement.`,
    url: `https://www.notion.so/207abc3abb3a80879774d9d8fd580d49`,
  },
  {
    id: `pression-infernale`,
    skillId: `longue-lame`,
    name: `Pression Infernale`,
    category: 'Professionnel',
    type: 'passif',
    family: `Onde de Choc`,
    description: `Sous ta pression, les lignes ennemies s’effondrent.`,
    effect: `Effet passif :
• Tant que 2 ennemis ou plus sont à portée de mêlée, tu gagnes +1 en défense.
• Tout ennemi qui commence son tour dans ta zone subit -1 à ses tests d’attaque.
• Si tu as touché au moins 2 ennemis ce tour, ta prochaine attaque coûte 1 PE de moins.`,
    url: `https://www.notion.so/207abc3abb3a808b8dd1fb4cdb13ca01`,
  },
  {
    id: `onde-percussive`,
    skillId: `longue-lame`,
    name: `Onde Percussive`,
    category: 'Professionnel',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 2,
    description: `Ta frappe disperse l’avant-garde comme un coup de canon.`,
    effect: `Frappe en cône de 5m devant toi.Tous les ennemis doivent faire un test de Constitution.
• Échec : repoussés de 2 cases, désarmés si armes non attachées.
• Réussite : restent sur place, mais subissent -2 en attaque pendant un tour.`,
    url: `https://www.notion.so/207abc3abb3a80c5bc68e308b640e07c`,
  },
  {
    id: `coup-de-rupture`,
    skillId: `longue-lame`,
    name: `Coup de Rupture`,
    category: 'Professionnel',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 1,
    description: `Un seul coup bien placé… et la machine s’arrête.`,
    effect: `• Frappe un ennemi unique au corps-à-corps.
• Si l’attaque touche, l’ennemi doit réussir un test de Constitution (DD 14)  ou être paralysé jusqu’à la fin de son prochain tour (il perd toutes ses actions pendant ce temps).
• Même en cas de sauvegarde réussie, l’ennemi est ralenti et subit -2 en attaque jusqu’à la fin de son prochain tour.
Bonus : inflige +2 dégâts si l’ennemi est isolé (aucun allié à 3m de lui).`,
    url: `https://www.notion.so/207abc3abb3a80d39d01edb530b64edc`,
  },
  {
    id: `choc-final`,
    skillId: `longue-lame`,
    name: `Choc Final`,
    category: 'Maître',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 4,
    description: `Tu concentres toute ton énergie dans une onde finale qui brise l’élan de toute l’armée ennemie.`,
    effect: `• Cercle de 4m centré sur toi. Tous les ennemis subissent les dégâts et doivent faire un test de Constitution ou être projetés à 3m et renversés.
Bonus : si 5 ennemis ou plus sont touchés, tu deviens Immuable jusqu’à ton prochain tour (aucun effet ne peut te déplacer).`,
    url: `https://www.notion.so/207abc3abb3a801785f2ec07cfd965cc`,
  },
  {
    id: `epicentre`,
    skillId: `longue-lame`,
    name: `Épicentre`,
    category: 'Maître',
    type: 'technique',
    family: `Onde de Choc`,
    peCost: 2,
    description: `Tu deviens le noyau du chaos : quiconque t’approche est projeté.`,
    effect: `• Crée une zone de 2m autour de toi qui dure jusqu’au début de ton prochain tour.
• Tout ennemi entrant ou débutant son tour dans cette zone doit réussir un test de Résistance ou être repoussé de 2m et subir 1 dégât brut.
• Les ennemis repoussés interrompent leurs actions en cours.
Bonus : les ennemis repoussés tombent à terre s’ils échouent leur test de Résistance de 5 points ou plus.`,
    url: `https://www.notion.so/207abc3abb3a805c8702ce5b70f2084e`,
  },

  // Famille : Parade-Riposte
  {
    id: `riposte-simple`,
    skillId: `longue-lame`,
    name: `Riposte Simple`,
    category: 'Novice',
    type: 'technique',
    family: `Parade-Riposte`,
    description: `Tu frappes dans l’ouverture laissée par l’adversaire après son assaut.`,
    effect: `• Utilisable immédiatement après avoir réussi une parade ou si l’adversaire rate son attaque contre toi.
• Frappe avec une attaque normale +1 dégât.

Donne 1 PE`,
    url: `https://www.notion.so/207abc3abb3a800185cfc78979db3a58`,
  },
  {
    id: `parade-precise`,
    skillId: `longue-lame`,
    name: `Parade Précise`,
    category: 'Novice',
    type: 'technique',
    family: `Parade-Riposte`,
    description: `Tu lèves ta garde juste au bon moment, bloquant l’élan sans effort.`,
    effect: `Utilisable en réaction à une attaque de mêlée.

Réduit les dégâts de l’attaque de 2 points.

Si l’attaque est complètement annulée, tu gagnes +1 à l’attaque jusqu’à la fin de ton prochain tour.`,
    url: `https://www.notion.so/207abc3abb3a80039f17c36b38019cc1`,
  },
  {
    id: `temps-davance`,
    skillId: `longue-lame`,
    name: `Temps d’Avance`,
    category: 'Novice',
    type: 'passif',
    family: `Parade-Riposte`,
    description: `Tu ne bouges pas plus vite. Tu bouges avant.`,
    effect: `• Lors du premier round de chaque combat, si tu n’as pas agi avant d’être attaqué, tu gagnes +2 à ta première parade ou contre-attaque.`,
    url: `https://www.notion.so/207abc3abb3a802885d8c8b946f65512`,
  },
  {
    id: `fenetre-ouverte`,
    skillId: `longue-lame`,
    name: `Fenêtre Ouverte`,
    category: 'Adepte',
    type: 'technique',
    family: `Parade-Riposte`,
    description: `Tu feintes une faiblesse pour provoquer l’erreur.`,
    effect: `Ton score de défense diminue de 1 ce tour, mais si l’adversaire attaque, ta contre-attaque gagne +2 dégats.

Bonus : si tu touches, l’adversaire est mit au sols.`,
    url: `https://www.notion.so/207abc3abb3a801ca5c3d4d3be4ca84b`,
  },
  {
    id: `breche-revelee`,
    skillId: `longue-lame`,
    name: `Brèche Révélée`,
    category: 'Adepte',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 1,
    description: `Tu vois l’ouverture. Et cette fois, tu ne la laisses pas passer.`,
    effect: `À utiliser après avoir paré une attaque ou après qu’un ennemi t’ait attaqué sans succès.

Ton prochain jet d’attaque contre lui a +3
Si l’attaque touche, elle inflige +2 dégâts.`,
    url: `https://www.notion.so/207abc3abb3a80d89c44ded2d9b5980e`,
  },
  {
    id: `reflexe-conditionne`,
    skillId: `longue-lame`,
    name: `Réflexe Conditionné`,
    category: 'Professionnel',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 3,
    description: `Tu n’as plus besoin de penser pour frapper : ton corps sait quand réagir.`,
    effect: `La première fois par tour qu’un ennemi t’attaque et te rate, tu peux automatiquement effectuer une contre-attaque gratuite, sans dépenser d’action.

Ne peut pas être utilisée deux fois sur le même adversaire par tour.`,
    url: `https://www.notion.so/207abc3abb3a805fa6f9de06e629d808`,
  },
  {
    id: `accroche-defensive`,
    skillId: `longue-lame`,
    name: `Accroche Défensive`,
    category: 'Professionnel',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 1,
    description: `Tu bloques et gardes le contrôle.`,
    effect: `Lorsque tu pares une attaque, tu peux immobiliser l’arme adverse.
L’ennemi ne peut pas attaquer pour la suite du tours.`,
    url: `https://www.notion.so/207abc3abb3a8062a8b4d4360b5713c7`,
  },
  {
    id: `contre-rythme`,
    skillId: `longue-lame`,
    name: `Contre-Rythme`,
    category: 'Professionnel',
    type: 'passif',
    family: `Parade-Riposte`,
    description: `Tu brises le rythme ennemi.`,
    effect: `Lorsque tu es attaqué si tu réussis une défense l’ennemi perd 1 PE.`,
    url: `https://www.notion.so/207abc3abb3a80e2ac94d38862499333`,
  },
  {
    id: `frappe-dintercession`,
    skillId: `longue-lame`,
    name: `Frappe d’Intercession`,
    category: 'Maître',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 2,
    description: `Lame surgissante, tu interceptes le mal… au prix du tien.`,
    effect: `Une fois par tour, si un allié à 2 mètres ou moins subit une attaque qui touche, tu peux :
• Déclencher une contre-attaque immédiate contre l’agresseur.
• L’attaque n’annule pas celle sur ton allié, mais inflige +2 dégâts si celui-ci est blessé.
• Si l’attaque de l’ennemi met ton allié à 0 PV, ta riposte est critique automatiquement.`,
    url: `https://www.notion.so/207abc3abb3a80278c2cd3e54444d9d8`,
  },
  {
    id: `main-vide`,
    skillId: `longue-lame`,
    name: `Main Vide`,
    category: 'Maître',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 1,
    description: `Ta parade se prolonge dans la garde ennemie — un geste précis, chirurgical… et l’arme vole.`,
    effect: `Lorsque tu réussis une parade, tu peux tenter de désarmer la cible :
• Test opposé : Dexterité (toi) vs Force (ennemi).

En cas de réussite, l’arme est projetée à 1d3 mètres, ou reste accrochée à ton bouclier/arme (au choix).`,
    url: `https://www.notion.so/207abc3abb3a803eb84aee715c857365`,
  },
  {
    id: `riposte-mortelle`,
    skillId: `longue-lame`,
    name: `Riposte Mortelle`,
    category: 'Maître',
    type: 'technique',
    family: `Parade-Riposte`,
    peCost: 2,
    description: `Tu attends. Tu frappes. Tu conclus.`,
    effect: `Si tu réussis une défense contre une attaque de mêlée lourde, tu effectues une riposte avec +4 dégâts et +2 à l’attaque.

Condition : ne pas avoir attaqué durant ton tour précédent.

Bonus : si la cible est tuée, tu récupères 2 PE.`,
    url: `https://www.notion.so/207abc3abb3a80909e47e6a806022971`,
  },

  // ── LONGUE-MASSE ────────────────────────────────────────────────

  // Famille : Briseur
  {
    id: `fissure-controlee`,
    skillId: `longue-masse`,
    name: `Fissure Contrôlée`,
    category: 'Novice',
    type: 'technique',
    family: `Briseur`,
    peCost: 1,
    description: `Tu ne vises pas la force brute, mais la jonction vulnérable entre deux pièces d’armure.`,
    effect: `inflige -1 dégât, mais ajoute +1 dégât par points de Rupture d’Armure.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Arme 2
    url: `https://www.notion.so/207abc3abb3a80768059d9a264a1fc8e`,
  },
  {
    id: `frappe-ecrasante`,
    skillId: `longue-masse`,
    name: `Frappe Écrasante`,
    category: 'Novice',
    type: 'technique',
    family: `Briseur`,
    peCost: 0,
    description: `Tu frappes avec toute la masse de ton arme, cherchant à enfoncer plus qu’à percer.`,
    effect: `Si la cible porte une armure métallique, elle subit un point de Rupture d’Armure.
Si elle a déjà au moins 1 Rupture d’Armure, elle est ralentie de 1m jusqu’à son prochain tour.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Arme 2
    url: `https://www.notion.so/207abc3abb3a80c4a3b7ef4f4c5d9f21`,
  },
  {
    id: `frappe-fragmentaire`,
    skillId: `longue-masse`,
    name: `Frappe Fragmentaire`,
    category: 'Novice',
    type: 'technique',
    family: `Briseur`,
    peCost: 1,
    description: `Tu vises là où l’armure s’est déjà ouverte, enfonçant le métal dans la chair.`,
    effect: `Condition : la cible doit être en état de Brisure d’Armure.
Effet :
• Inflige +2 dégâts.
• La cible reçoit un malus de -1 à ses jets de Défense jusqu’à la fin du tours (les éclats gênent ses mouvements).`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Arme 2
    url: `https://www.notion.so/207abc3abb3a80e582fde1c962ff6747`,
  },
  {
    id: `onde-de-choc`,
    skillId: `longue-masse`,
    name: `Onde de Choc`,
    category: 'Adepte',
    type: 'technique',
    family: `Briseur`,
    peCost: 2,
    description: `Tu frappes violemment le rebord d’un bouclier ou d’une plaque, envoyant une onde à travers le métal.`,
    effect: `• Inflige 2 Fractures à l’armure ou au bouclier visé.
• Si l’attaque crée une brisure, elle est étourdie 1 tour


Bonus d’équipe :
• Tous les alliés à 1 case de la cible gagnent +1 pour toucher cette même cible au prochain tour.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Arme 6
    url: `https://www.notion.so/207abc3abb3a8001bacbdaf8c3fd8345`,
  },
  {
    id: `eclat-dirige`,
    skillId: `longue-masse`,
    name: `Éclat Dirigé`,
    category: 'Adepte',
    type: 'technique',
    family: `Briseur`,
    peCost: 1,
    description: `Tu arraches un fragment de l’armure ennemie avec ta frappe, et l’utilises contre lui.`,
    effect: `Condition : la cible a un  token Brisure d’Armure.

Choisis un effet supplémentaire :
• Saignement : la cible perd 1 PV à chaque tour pendant 3 tours.
• Fracture : la cible subit un malus de -2 à tous ses tests de Force ou de Constitution.
• Fragment Volant : inflige 1 dégât à un ennemi adjacent (portée 1m).`,
    prereqs: { minLevel: 8 },
    // Prérequis Notion : Arme 8
    url: `https://www.notion.so/207abc3abb3a80099332fe82f60e1e6f`,
  },
  {
    id: `poids-de-la-cuirasse`,
    skillId: `longue-masse`,
    name: `Poids de la Cuirasse`,
    category: 'Adepte',
    type: 'passif',
    family: `Briseur`,
    description: `Tu sais exploiter le poids de la protection adverse à ton avantage.`,
    effect: `Tant qu’un ennemi possède au moins 1 Rupture d’Armure, il subit -1 m de déplacement par tour.

Si un ennemi tente de désengager de toi avec 3 Ruptures ou une Brisure, il doit réussir un test de Force ou rester bloqué.`,
    prereqs: { minLevel: 5 },
    // Prérequis Notion : Arme 5
    url: `https://www.notion.so/207abc3abb3a804786f1e7faf8280c2c`,
  },
  {
    id: `frappe-daccroche`,
    skillId: `longue-masse`,
    name: `Frappe d’Accroche`,
    category: 'Adepte',
    type: 'technique',
    family: `Briseur`,
    peCost: 1,
    description: `Tu vises une articulation ou une pièce saillante pour coincer ton arme dedans.`,
    effect: `Si l’attaque touche, la cible gagne 1 Rupture d’Armure.
Si tu choisis de maintenir la pression au prochain tour (même cible), tu gagnes +1 pour toucher.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Arme 6
    url: `https://www.notion.so/207abc3abb3a80b5bf9bfdb9cf1efd97`,
  },
  {
    id: `fracture-d-arme`,
    skillId: `longue-masse`,
    name: `Fracture d'Arme`,
    category: 'Professionnel',
    type: 'technique',
    family: `Briseur`,
    peCost: 0,
    description: `Tu ne brises pas que la défense. Tu casses ce qui blesse.`,
    effect: `N’inflige pas les dégats.

• L’adversaire doit faire un test de Force ou Dextérité (au choix).


Échec :
→ L’arme est endommagée :
• L’ennemie est désarmé.
• Si déjà endommagée, elle est brisée : inutilisable pour le reste du combat.`,
    prereqs: { minLevel: 11 },
    // Prérequis Notion : Arme 11
    url: `https://www.notion.so/207abc3abb3a8008a8bbde9f5c23d308`,
  },
  {
    id: `marteau-de-ruine`,
    skillId: `longue-masse`,
    name: `Marteau de Ruine`,
    category: 'Professionnel',
    type: 'technique',
    family: `Briseur`,
    peCost: 2,
    description: `Tu ne vises plus la chair. Tu vises la structure.`,
    effect: `• Inflige 1 Fracture à l’armure .
• Inflige 2 dégâts bruts.
💥 Si la cible a une brisure :
• Inflige +2 dégât supplémentaire.
• Si la cible porte une armure lourde, elle est étourdie 1 tour.
💡 Bonus :
• Si tu atteins 2 brisures ou plus, récupère +2 PE (le métal cède, tu forces le rythme).`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Arme 12
    url: `https://www.notion.so/207abc3abb3a8076ac6ac66f4ca9f4ff`,
  },
  {
    id: `morsure-dacier`,
    skillId: `longue-masse`,
    name: `Morsure d’Acier`,
    category: 'Professionnel',
    type: 'technique',
    family: `Briseur`,
    peCost: 2,
    description: `Tu ne frappes pas à nouveau — tu fais céder ce qui tient encore.`,
    effect: `Consomme toutes les Fractures de la cible.
Inflige 3 dégâts +2  dégât par Fracture consommée.

La cible subit –1 case de Mouvement et –1 à sa Défense jusqu’à son prochain tour.`,
    prereqs: { minLevel: 10 },
    // Prérequis Notion : Arme 10
    url: `https://www.notion.so/207abc3abb3a80a6b705e4f90f592561`,
  },
  {
    id: `ruine-retournee`,
    skillId: `longue-masse`,
    name: `Ruine Retournée`,
    category: 'Maître',
    type: 'technique',
    family: `Briseur`,
    peCost: 2,
    description: `Tu arraches un éclat de métal d’une armure déjà craquelée, et le retournes contre son porteur dans un jet précis et vicieux.`,
    effect: `La cible doit porter une armure avec au moins 2 brisures.

Inflige 4 dégâts pure
Ajoute +3 Fractures à l’armure (même si déjà brisée).

La cible doit réussir un test de Vigueur (DD : 10 + ton Mod. de Force).

La cible est aveuglée pour 1 tour.
Elle perd 1 PE immédiatement.`,
    prereqs: { minLevel: 14 },
    // Prérequis Notion : Arme 14
    url: `https://www.notion.so/207abc3abb3a8030aca2cf2b77158508`,
  },
  {
    id: `jugement-du-metal`,
    skillId: `longue-masse`,
    name: `Jugement du Métal`,
    category: 'Maître',
    type: 'technique',
    family: `Briseur`,
    peCost: 3,
    description: `Ton armure est ta tombe. Je vais en sceller la dernière plaque.`,
    effect: `La cible doit avoir au moins 2 Brisure sur son armure.

Consomme toutes les Brisure sur l’équipement de la cible

Inflige 3 dégâts brute par Brisure consommée.

Inflige 2 dégâts brute par fracture.

Si 5 élément sont consommé l’attaque est critique.`,
    prereqs: { minLevel: 17 },
    // Prérequis Notion : Arme 17
    url: `https://www.notion.so/207abc3abb3a808d8f20ec6eb8b7ef2f`,
  },

  // Famille : Répercussions
  {
    id: `frappe-marquante`,
    skillId: `longue-masse`,
    name: `Frappe Marquante`,
    category: 'Novice',
    type: 'technique',
    family: `Répercussions`,
    description: `Tu vises une articulation ou une surface vulnérable sans chercher à blesser : tu prépares la structure à céder.`,
    effect: `Inflige -4 dégât et ajoute 1 marqueur de Fracture sur la zone ciblée :
• Tête (désorientation),
• Bras (désarmement),
• Jambes (ralentissement),
• Torse (perte de souffle).Max 1 marqueur par zone (jusqu'à 4 zones).`,
    url: `https://www.notion.so/207abc3abb3a80258487f961bee71873`,
  },
  {
    id: `point-de-rupture`,
    skillId: `longue-masse`,
    name: `Point de Rupture`,
    category: 'Novice',
    type: 'technique',
    family: `Répercussions`,
    description: `Tu enchaînes sur une zone déjà fragilisée, forçant la fracture à se manifester brutalement.`,
    effect: `Condition : La cible doit avoir au moins 1 marqueur actif.


Effet : Inflige 2 dégâts.
• Si la zone visée a un marqueur, applique en plus l’effet suivant :
    ◦ Tête → -1 à toutes ses actions au prochain tour.
    ◦ Bras → Désarmement (test de Force pour garder son arme).
    ◦ Jambes → Tombe à terre (s’il échoue un test d’Équilibre).
    ◦ Torse → Perd 1 PE.`,
    url: `https://www.notion.so/207abc3abb3a8067bb33e0b38701a719`,
  },
  {
    id: `scanner-de-failles`,
    skillId: `longue-masse`,
    name: `Scanner de Failles`,
    category: 'Novice',
    type: 'technique',
    family: `Répercussions`,
    peCost: 1,
    description: `Tu observes attentivement ton adversaire, identifiant les points de tension, les déséquilibres ou les failles dans son équipement. Cette lecture te permet d’anticiper ton prochain impact, quelle que soit la zone touchée.`,
    effect: `Choisis une zone du corps de la cible (Tête, Bras, Jambes, Torse).
Jusqu’à la fin de ton prochain tour, ta première attaque réussie contre cette cible ajoute un marqueur de Fracture sur cette zone`,
    url: `https://www.notion.so/207abc3abb3a8083b54df962f5cd8aa1`,
  },
  {
    id: `compression-ciblee`,
    skillId: `longue-masse`,
    name: `Compression Ciblée`,
    category: 'Adepte',
    type: 'technique',
    family: `Répercussions`,
    peCost: 1,
    description: `Tu appuies exactement là où il ne fallait pas.`,
    effect: `Effet :
• -2 Dégâts
• Consomme 1 marqueur de Fracture sur la cible (n’importe quelle zone).
• La cible perd 1 PE immédiatement.
Bonus :
• Si la cible a 0 PE les dégâts sont normaux`,
    url: `https://www.notion.so/207abc3abb3a801b9606c0c65f383997`,
  },
  {
    id: `frappe-rythmee`,
    skillId: `longue-masse`,
    name: `Frappe Rythmée`,
    category: 'Adepte',
    type: 'technique',
    family: `Répercussions`,
    peCost: 1,
    description: `Un enchaînement constant qui rend fou.`,
    effect: `Ajoute 1 marqueur sur le torse.
Si le torse contient au moins 2 marqueurs, la cible subit –1 à l’attaque pendant 1 tour.
-3 dégats`,
    url: `https://www.notion.so/207abc3abb3a8058b9ffc32aef9d446b`,
  },
  {
    id: `desequilibrage-progressif`,
    skillId: `longue-masse`,
    name: `Déséquilibrage Progressif`,
    category: 'Adepte',
    type: 'technique',
    family: `Répercussions`,
    peCost: 1,
    description: `Tes frappes désaxent lentement la posture ennemie.`,
    effect: `• Ajoute 1 marqueur de Fracture sur les jambes.
• Si les jambes ont déjà un marqueur, l’adversaire doit faire un test d’Athlétisme. En cas d’échec, il est renversé.
Bonus :
• Si l’ennemi tombe, gagne +1 PE immédiatement.`,
    url: `https://www.notion.so/207abc3abb3a806a9993e5480a2fa6da`,
  },
  {
    id: `martelement-methodique`,
    skillId: `longue-masse`,
    name: `Martèlement Méthodique`,
    category: 'Professionnel',
    type: 'technique',
    family: `Répercussions`,
    peCost: 2,
    description: `Tu frappes deux zones différentes en rythme.`,
    effect: `• Tu effectues deux attaques sur deux zones distinctes (ex. bras + jambes).
• Chaque touche pose 1 marqueur ⚠️ sur la zone concernée.
Bonus :
• Si la cible possède déjà au moins un marqueur actif, l’attaque coûte –1 PE.`,
    url: `https://www.notion.so/207abc3abb3a801681cbda436d2559b4`,
  },
  {
    id: `fracture-totale`,
    skillId: `longue-masse`,
    name: `Fracture Totale`,
    category: 'Professionnel',
    type: 'technique',
    family: `Répercussions`,
    peCost: 1,
    description: `Tu concentres toute ta force sur une seule zone déjà fragilisée pour provoquer une rupture brutale.`,
    effect: `• Choisis une zone du corps sur laquelle la cible a au moins 1 marqueur ⚠️.
• Consomme tous les marqueurs de cette zone.
• Inflige 2 dégâts + 2 dégât par marqueur consommé.
Bonus par zone (appliqué si 3 marqueurs ou plus ont été consommés) :
• Bras : la cible lâche son arme et subit –1 Attaque pendant 2 tours.
• Jambes : la cible est renversée et subit –2 Mouvement pendant 1 tour.
• Torse : la cible perd 1 PE et subit –1 Défense pendant 2 tours.
• Tête : la cible est étourdie 1 tour.`,
    url: `https://www.notion.so/207abc3abb3a80ac80c9ee4b58d40894`,
  },
  {
    id: `choc-resonant`,
    skillId: `longue-masse`,
    name: `Choc Résonant`,
    category: 'Maître',
    type: 'passif',
    family: `Répercussions`,
    description: `Chaque coup résonne avec la précision d’un forgeron. Aucun impact n’est anodin.`,
    effect: `• Toutes tes attaques infligent automatiquement 1 marqueur ⚠️ sur une zone aléatoire (ou choisie si l’attaque cible une zone spécifique).
• Cela s’applique même si l’attaque rate, tant que l’ennemi est touché par l’impact ou la zone d’effet.
• Ne s’applique pas aux attaques infligeant déjà des marqueurs supplémentaires.`,
    url: `https://www.notion.so/207abc3abb3a8023af16ef49a446e448`,
  },
  {
    id: `symphonie-des-ruptures`,
    skillId: `longue-masse`,
    name: `Symphonie des Ruptures`,
    category: 'Maître',
    type: 'technique',
    family: `Répercussions`,
    peCost: 2,
    description: `Tu actives simultanément toutes les zones fragilisées, provoquant une rupture globale du corps.`,
    effect: `Consomme tous les marqueurs ⚠️ sur toutes les zones du corps de la cible.
Pour chaque zone ayant au moins 1 marqueur, applique tous les effets de Fracture Totale correspondants (bras, jambes, torse, tête).

Inflige 2 dégât par marqueur consommé (total cumulé)

Si au moins 3 zones différentes sont affectées, la cible est stun 1 tours`,
    url: `https://www.notion.so/207abc3abb3a80d59427db784f13d2cf`,
  },

  // ── PETITE-LAME ─────────────────────────────────────────────────

  // Famille : Assassin
  {
    id: `roulade-de-lombre`,
    skillId: `petite-lame`,
    name: `Roulade de l’Ombre`,
    category: 'Novice',
    type: 'technique',
    family: `Assassin`,
    peCost: 2,
    description: `Une roulade rapide vers un couvert ou dans l’ombre.`,
    effect: `Effet : Tu te déplaces de 3m + discrétion.

Si tu passes dans la vue pendant ta roulade tu n’es pas découvert.
Si tu finis hors de vue directe, tu entres immédiatement en état Dissimulé.


• Bonus : +1 à la Défense ce tour.`,
    url: `https://www.notion.so/207abc3abb3a80c58062d832484118da`,
  },
  {
    id: `lame-du-silence`,
    skillId: `petite-lame`,
    name: `Lame du Silence`,
    category: 'Novice',
    type: 'technique',
    family: `Assassin`,
    description: `Une frappe rapide et silencieuse, sans crier gare.`,
    effect: `Condition: Dissimulé


Si tu es Dissimulé, la cible subit +2 dégâts brute

Si la cible meure tu restes dissimuler`,
    url: `https://www.notion.so/207abc3abb3a80e595adf1d9c048494b`,
  },
  {
    id: `posture-figee`,
    skillId: `petite-lame`,
    name: `Posture Figée`,
    category: 'Adepte',
    type: 'technique',
    family: `Assassin`,
    peCost: 1,
    description: `Tu t’immobilises dans l’ombre, comme une statue.`,
    effect: `Tant que tu ne bouges pas et ne fais aucune action offensive au tour suivant, tu entres automatiquement en état Dissimulé.


Si quelqu’un passe à 3m sans te repérer, tu gagnes +1 à ta prochaine attaque`,
    url: `https://www.notion.so/207abc3abb3a804d9426f8480f33005e`,
  },
  {
    id: `danse-dans-les-ombres`,
    skillId: `petite-lame`,
    name: `Danse dans les Ombres`,
    category: 'Adepte',
    type: 'technique',
    family: `Assassin`,
    peCost: 1,
    description: `Tu frappes puis glisses immédiatement dans l’ombre.`,
    effect: `Effet : Effectue une attaque de mêlée normale.

Si elle touche, tu peux te déplacer de 1 case après l’attaque.
Si ce déplacement te place hors de vue directe, tu redeviens Dissimulé.`,
    url: `https://www.notion.so/207abc3abb3a80648845db708541a91b`,
  },
  {
    id: `deguisement-impeccable`,
    skillId: `petite-lame`,
    name: `Déguisement Impeccable`,
    category: 'Professionnel',
    type: 'technique',
    family: `Assassin`,
    peCost: 1,
    description: `Tu endosses une tenue, un manteau, un masque ou adoptes une posture anodine pour tromper l’ennemi.`,
    effect: `Si tu n’es pas dans le champ de vision immédiat d’un ennemi (hors ligne directe), tu peux effectuer un test de Dextérité.

En cas de réussite : tu entres en état Dissimulé pendant 2 tours ou jusqu’à ce que tu attaques.`,
    url: `https://www.notion.so/207abc3abb3a804d9e28f892acb235b9`,
  },
  {
    id: `cachette-naturelle`,
    skillId: `petite-lame`,
    name: `Cachette Naturelle`,
    category: 'Professionnel',
    type: 'technique',
    family: `Assassin`,
    peCost: 1,
    description: `Dans un mouvement fluide, tu disparais derrière un meuble, sous une table, ou dans l’ombre d’un décor.`,
    effect: `Effectue immédiatement un déplacement de 1 case vers un élément de décor adjacent (caisse, meuble, colonne, recoin…).
Si ce décor permet une cache suffisante, tu deviens Dissimulé.`,
    url: `https://www.notion.so/207abc3abb3a80bfae3cf9d1f44a89d0`,
  },
  {
    id: `main-spectrale`,
    skillId: `petite-lame`,
    name: `Main Spectrale`,
    category: 'Professionnel',
    type: 'technique',
    family: `Assassin`,
    peCost: 1,
    description: `Tu profites de la confusion pour frapper deux ennemis côte à côte dans un même élan meurtrier.`,
    effect: `Condition : Tu dois être en état Dissimulé et deux ennemis doivent être adjacents (l’un à côté de l’autre ou autour de toi).

+2 dégâts sur la première attaque si elle brise la Dissimulation.Effet de Terreur possible sur échec de test de Sang-Froid.`,
    url: `https://www.notion.so/207abc3abb3a80daa560d8d82ebb7b05`,
  },
  {
    id: `silence-meurtrier`,
    skillId: `petite-lame`,
    name: `Silence Meurtrier`,
    category: 'Maître',
    type: 'passif',
    family: `Assassin`,
    description: `Ton geste est si rapide, si chirurgical, que tu restes invisible même après avoir frappé.`,
    effect: `Une fois par tour, si tu effectues une attaque alors que tu es Dissimulé, tu ne perds pas cet état.


Bonus : si la cible meurt, tu peux immédiatement te déplacer de3 m sans déclencher d’opportunité.`,
    url: `https://www.notion.so/207abc3abb3a80228b45fe6de12544da`,
  },
  {
    id: `effroi`,
    skillId: `petite-lame`,
    name: `Effroi`,
    category: 'Maître',
    type: 'passif',
    family: `Assassin`,
    description: `Tu frappes non pour tuer, mais pour faire perdre l’esprit.`,
    effect: `Chaque fois que tu effectue une attaque furtive. Si elle réussit, la cible subit un test de Sang-Froid :
• Échec : la cible fuit de 2 cases (doit se mettre à couvert ou s’éloigner de toi).
• Échec critique : elle tombe au sol et perd 1 action.Si elle réussit, elle prend quand même –1 à l’attaque`,
    url: `https://www.notion.so/207abc3abb3a805eb0a6df734e77b85d`,
  },

  // Famille : Cercle de l’Étau
  {
    id: `second-souffle`,
    skillId: `petite-lame`,
    name: `Second souffle`,
    category: 'Novice',
    type: 'technique',
    family: `Cercle de l’Étau`,
    description: `Tu resserres ta garde, ralentis ton souffle et canalises ta force pour encaisser la suite.`,
    effect: `Au prochain tour, tu récupères +2 PE supplémentaires

1 tours de CC`,
    url: `https://www.notion.so/207abc3abb3a80fd9302e3a5c349d96c`,
  },

  // ── VISEE ───────────────────────────────────────────────────────

  // Famille : Déluge
  {
    id: `suppression-legere`,
    skillId: `visee`,
    name: `Suppression Légère`,
    category: 'Novice',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Ce n’est pas pour le toucher. C’est pour qu’il se baisse. Et s’il se relève… vous l’aurez.`,
    effect: `Vous faites feux avec insistance sur un ennemie.
- L’ennemie visé doit faire une jet de défense (CAP votre visé) ou subir dégâts de l’arme.
- L’ennemie est immobilisé.`,
    url: `https://www.notion.so/206abc3abb3a8089a47ee77df6c21476`,
  },
  {
    id: `tir-de-saturation`,
    skillId: `visee`,
    name: `Tir de Saturation`,
    category: 'Novice',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Ce n’est pas une attaque. C’est une pluie nerveuse de métal et de bruit. Personne ne traverse un couloir comme ça sans plonger au sol.`,
    effect: `Vous tirez sur une zone (5 tires) en conne de devant vous.
- Tous les ennemis dans la zone doivent faire un jet de défense (CAP votre visé) ou subir dégâts de l’arme.
- Aucune visée précise requise`,
    url: `https://www.notion.so/206abc3abb3a80a2a26fe7abaa38e0eb`,
  },
  {
    id: `recharge-instinctive`,
    skillId: `visee`,
    name: `Recharge Instinctive`,
    category: 'Novice',
    type: 'passif',
    family: `Déluge`,
    description: `Vous rechargez sans y penser. Parce que vous savez que dans une seconde, vous allez continuer à tirer.`,
    effect: `Recharger ne coute plus de PE`,
    url: `https://www.notion.so/206abc3abb3a80bab072ecabb5b537ad`,
  },
  {
    id: `double-rafale`,
    skillId: `visee`,
    name: `Double Rafale`,
    category: 'Novice',
    type: 'technique',
    family: `Déluge`,
    description: `Vous ne contrôlez pas le recul — vous le chevauchez. Le bruit vous couvre. L’ennemi n’a pas le temps de comprendre ce qui vient de commencer.`,
    effect: `Vous effectuez deux attaques à distance sur une ou deux cibles proches (moins de 6 mètres).
• Chaque attaque a –2 au jet de toucher.
• Si les deux attaques touchent, gagne +1 PE au prochain tour.`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Visé 2
    url: `https://www.notion.so/206abc3abb3a80cb9b99cb2dadbea612`,
  },
  {
    id: `cadence-maintenue`,
    skillId: `visee`,
    name: `Cadence Maintenue`,
    category: 'Adepte',
    type: 'passif',
    family: `Déluge`,
    description: `Tant que votre arme continue à hurler, vous dominez le rythme. L’ennemi cherche un trou dans le bruit — il n’y en a pas.`,
    effect: `Pendant 2 tours, tant que vous tirez à chaque tour sans interruption :
• Vos attaques infligent +1 dégât si vous avez tiré au tour précédent.
• Après 2 tours a faire feux, toutes les cibles que vous visé ont -1 a tous les jets pendant 1 tours`,
    prereqs: { minLevel: 5 },
    // Prérequis Notion : Visé 5
    url: `https://www.notion.so/206abc3abb3a800eb13cf294b58921fb`,
  },
  {
    id: `salve-de-terreur`,
    skillId: `visee`,
    name: `Salve de Terreur`,
    category: 'Adepte',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Ce n’est pas la précision qui fait peur. C’est l’absence de répit. Le vacarme. L’impact. L’idée que ça ne s’arrêtera pas.`,
    effect: `Vous faites feux avec insistance dans un conne en face de vous.
- Tous les ennemis dans la zone doivent faire un jet de défense (CAP votre visé) ou subir dégâts de l’arme.
- L’ennemie est forcé de rejoindre le couvert le plus proche ou de s’allonger.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a8035b2efe3cecf3fed07`,
  },
  {
    id: `barrage`,
    skillId: `visee`,
    name: `Barrage`,
    category: 'Adepte',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Vous n’arrêtez pas de tirer. La ligne n’est pas tenue par des murs, mais par votre feu. Et personne ne veut la franchir.`,
    effect: `Vous déclenchez un tir nourri sur une ligne
• Vous consommez un demi-chargeur (ou un nombre important de projectiles).
• Tant que le barrage est actif (jusqu’à votre prochain tour), aucun ennemi ne peut traverser cette ligne sans subir une attaque automatique.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a8036b08aef8d0eba02e8`,
  },
  {
    id: `tir-etouffant`,
    skillId: `visee`,
    name: `Tir Étouffant`,
    category: 'Adepte',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Vous ne tirez pas pour blesser — vous tirez pour étouffer ses options. Il reste là, il tombe. Il bouge, il est exposé.`,
    effect: `Vous tirez une rafale puissante.
- Si vous touchez les dégâts de l’arme classique sont appliqué
- L’ennemie est forcé de se déplacé de 3m dans une direction que vous indiquez.`,
    prereqs: { minLevel: 7 },
    // Prérequis Notion : Visé 7
    url: `https://www.notion.so/206abc3abb3a809da32dfb49042aecca`,
  },
  {
    id: `deluge-ininterrompu`,
    skillId: `visee`,
    name: `Déluge Ininterrompu`,
    category: 'Professionnel',
    type: 'technique',
    family: `Déluge`,
    description: `Vous ne laissez pas de souffle. Vos balles n’ont pas besoin d’un plan. Elles ont besoin d’un rythme.`,
    effect: `Vous enchaînez jusqu’à trois attaques à distance contre une ou plusieurs cibles visibles.
• Chaque tir subit –1 cumulé (0, –1, –2).
• Si au moins deux tirs touchent, vous pouvez recharger gratuitement ou gagner +1 PE.
• Si les trois tirs touchent, la dernière cible est étourdie (perd sa prochaine réaction).`,
    prereqs: { minLevel: 8 },
    // Prérequis Notion : Visé 8
    url: `https://www.notion.so/206abc3abb3a800aa9a3fa1fb725ab58`,
  },
  {
    id: `pulverisation`,
    skillId: `visee`,
    name: `Pulvérisation`,
    category: 'Professionnel',
    type: 'technique',
    family: `Déluge`,
    peCost: 2,
    description: `Le mur ne vous arrête pas. Vous le rasez. Vous ne contestez pas une position défensive — vous la supprimez.`,
    effect: `Vous tirez une salve brutale contre un élément de décor utilisé comme couvert (barrière, muret, caisse, porte...).
• Si le couvert est léger, il est entièrement détruit.
• Si le couvert est moyen, il est fracturé (devient partiellement inutilisable, offre moitié protection).
• Si le couvert est lourd, il est ébranlé : offre toujours une protection, mais inflige des éclats.
Tous les ennemis protégés par ce couvert subissent :
• 1D de dégâts réduits (au choix du MJ : moitié, ou 2.5 selon la solidité),
• Un test de volonté ou d’esquive sous peine d’être stupéfiés 1 tour (désorientés).`,
    prereqs: { minLevel: 11 },
    // Prérequis Notion : Visé 11
    url: `https://www.notion.so/206abc3abb3a805f92abf6698f0f3c6b`,
  },
  {
    id: `feu-integre`,
    skillId: `visee`,
    name: `Feu Intégré`,
    category: 'Professionnel',
    type: 'technique',
    family: `Déluge`,
    peCost: 1,
    description: `Chez vous, il n’y a pas de temps mort. Tirer, c’est comme respirer : vous le faites pendant tout le reste.`,
    effect: `Vous réalisez une action standard (exemples : rechargement, interaction, soin rapide, ordre tactique, placement d’objet…) tout en tirant avec votre arme à distance.

Exemples courants :
• Tirer en repliant un camarade blessé
• Arroser une porte tout en la défonçant
• Changer de chargeur tout en couvrant la zone
• Tirer tout en plantant un détonateur ou une charge`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Visé 12
    url: `https://www.notion.so/206abc3abb3a80e086cfe8d197a89aad`,
  },
  {
    id: `machine-de-guerre`,
    skillId: `visee`,
    name: `Machine de Guerre`,
    category: 'Maître',
    type: 'technique',
    family: `Déluge`,
    peCost: 1,
    description: `Vos tirs n’infligent pas seulement des dégâts. Ils brisent les réflexes, la posture, le courage. L’ennemi ne s’effondre pas : il fond.`,
    effect: `Pendant 2 tours, vous passez en mode suppression active :
• Tous vos tirs réussis infligent –2 à la Défense de la cible jusqu’à son prochain tour.
• Vous pouvez effectuer 1 attaque a la fin du tour d’un ennemi à vue s’il ne se met pas à couvert.`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Visé 13
    url: `https://www.notion.so/206abc3abb3a804eb118d64b1a04196b`,
  },
  {
    id: `furie-balistique`,
    skillId: `visee`,
    name: `Furie Balistique`,
    category: 'Maître',
    type: 'passif',
    family: `Déluge`,
    description: `Vous ne tirez plus en rafale. Vous êtes la rafale. Vous n’êtes pas un soldat. Vous êtes la fin de la ligne de vue.`,
    effect: `Tant que vous êtes en combat actif avec une arme à distance non vide, vous pouvez effectuer autant d’attaques que vous le souhaitez par tour, sans limite.`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Visé 13
    url: `https://www.notion.so/206abc3abb3a807f80b3e456fb30d40f`,
  },
  {
    id: `tempete-dechainee`,
    skillId: `visee`,
    name: `Tempête Déchaînée`,
    category: 'Maître',
    type: 'technique',
    family: `Déluge`,
    peCost: 0,
    description: `Vous ne balayez pas la zone. Vous la dissoudez. Votre tir ne sélectionne pas : il engloutit.`,
    effect: `Vous ciblez jusqu’à 5 ennemis dans un cône frontal de 6 mètres.
• Vous effectuez une attaque individuelle contre chacun.
• Chaque ennemi touché subit les dégâts normaux et un test de panique ou recul de 1 case.
Bonus :
• Si 3 cibles ou plus sont touchées, vous récupérez 2 PE immédiatement.`,
    prereqs: { minLevel: 13 },
    // Prérequis Notion : Visé 13
    url: `https://www.notion.so/206abc3abb3a80e2857ef534f1b81b75`,
  },

  // Famille : Tir Réflexe
  {
    id: `interception-reflexe`,
    skillId: `visee`,
    name: `Interception Réflexe`,
    category: 'Novice',
    type: 'technique',
    family: `Tir Réflexe`,
    description: `Vous ne protégez pas avec un bouclier. Vous protégez en forçant l’ennemi à se tordre sous la menace.`,
    effect: `Un ennemi attaque un allié ou se déplace pour attaquer un allier dans votre ligne de vue.

Vous pouvez tirer immédiatement sur cet ennemi.
• Si vous touchez, il subit –1 à son jet d’attaque contre votre allié.
• Si vous infligez des dégâts, il subit –2 à ce jet.
Une fois par tours`,
    url: `https://www.notion.so/206abc3abb3a80098543d6f68f9d8ffd`,
  },
  {
    id: `vigilance`,
    skillId: `visee`,
    name: `Vigilance`,
    category: 'Novice',
    type: 'technique',
    family: `Tir Réflexe`,
    description: `Votre arme n’est pas levée — mais votre esprit l’est déjà. Celui qui franchit la ligne le regrette avant de comprendre.`,
    effect: `Vous désignez un couloir, une porte, un angle dans votre champ de vision.
• Jusqu’à votre prochain tour, si un ennemi entre dans cette zone, vous pouvez immédiatement tirer une fois gratuitement (-2 au jet d’attaque).
Une fois par tours`,
    url: `https://www.notion.so/206abc3abb3a802d9042df31fc47234f`,
  },
  {
    id: `insurprenable`,
    skillId: `visee`,
    name: `Insurprenable`,
    category: 'Novice',
    type: 'passif',
    family: `Tir Réflexe`,
    description: `Vous ne parlez jamais tout à fait. Vous écoutez. Vous évaluez. Vous visez déjà. Les sourires forcés, les tics nerveux, les doigts qui se crispent : vous les voyez.`,
    effect: `Vous ne pouvez pas être pris en embuscade si une scène de combat démarre pendant un dialogue, une négociation, ou une approche sociale.`,
    url: `https://www.notion.so/206abc3abb3a80559210c2b61f82ef63`,
  },
  {
    id: `coup-dil`,
    skillId: `visee`,
    name: `Coup d’Œil`,
    category: 'Novice',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 2,
    description: `Vous le fixez, vous respirez. Il bouge ? Vous tirez avant même d’avoir conscience d’avoir visé.`,
    effect: `Choisissez un ennemi visible. Jusqu’au début de votre prochain tour, si cette cible se déplace d’au 3m, vous pouvez effectuer une attaque gratuite à distance contre elle (avec –1 au jet d’attaque).
Vous ne pouvez avoir qu’un Coup d’Œil actif à la fois.`,
    url: `https://www.notion.so/206abc3abb3a8074b031ff680b90e2c4`,
  },
  {
    id: `tir-de-rupture`,
    skillId: `visee`,
    name: `Tir de Rupture`,
    category: 'Adepte',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 2,
    description: `Tu croyais me tenir ? Mauvais calcul. Mon canon touche presque ta gorge.`,
    effect: `Si vous êtes au corps-à-corps, vous pouvez :
• Effectuer un tir à bout portant contre un ennemi adjacent (avec –4 au jet).
• Puis vous replier immédiatement de 5m sans perdre de PE`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Visé 4
    url: `https://www.notion.so/206abc3abb3a807da2e8dabbb102cc15`,
  },
  {
    id: `lien-de-ciblage`,
    skillId: `visee`,
    name: `Lien de Ciblage`,
    category: 'Adepte',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 1,
    description: `Vous ne couvrez pas vos alliés. Vous frappez avec eux. Deux tirs, une intention — et un adversaire désorienté.`,
    effect: `Vous désignez un allié visible 
• Lorsqu’il attaque une cible que vous pouvez voir, vous pouvez tirer en même temps (1 fois par tour, avec –1 au jet).
• Si vous touchez tous les deux, la cible est secouée (–1 à tous ses jets jusqu’à son prochain tour).
Une fois par tours`,
    prereqs: { minLevel: 3 },
    // Prérequis Notion : Visé 3 | Perception 2
    url: `https://www.notion.so/206abc3abb3a80838266cf3c8d9b8a62`,
  },
  {
    id: `tir-fantome`,
    skillId: `visee`,
    name: `Tir Fantôme`,
    category: 'Adepte',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 1,
    description: `Le coup est parti. Il ne vous a pas vu. Mais maintenant, il sait que vous êtes quelque part. Et ça suffit pour paralyser sa main.`,
    effect: `Vous effectuez une attaque à distance contre un ennemi, sans révéler votre position exacte, votre cible ne peut pas vous cibler au prochain tours.

Cumulable avec d’autre techniques`,
    prereqs: { minLevel: 7 },
    // Prérequis Notion : Visé 7
    url: `https://www.notion.so/206abc3abb3a8092ba4af5814a2fc692`,
  },
  {
    id: `zone-piegee`,
    skillId: `visee`,
    name: `Zone Piégée`,
    category: 'Adepte',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 1,
    description: `Ce n’est pas le tir qui bloque les ennemis. C’est l’idée qu’un autre pourrait suivre. La zone devient un piège psychologique : ils savent que vous les regardez encore.`,
    effect: `Chaque fois que vous effectuez un tir à distance dans une zone spécifique (ex : une salle, un couloir, une portion de champ de bataille visible), vous y laissez une trace mentale.
Pendant 1 tour :
• Tout ennemi qui tente une action dans cette zone (attaque, déplacement, interaction...) subit –1 à son jet principal (attaque, esquive, compétence...)
• De plus, s’il échoue, vous pouvez immédiatement réagir avec une attaque gratuite (1 fois par tour uniquement).
Conditions :
• La zone doit être visible et accessible par votre arme.
• Le malus s’applique même si vous ne visez plus activement la zone, tant que le tour n’est pas passé.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a80979e7cf38fd9505f01`,
  },
  {
    id: `contre-attaque`,
    skillId: `visee`,
    name: `Contre-Attaque`,
    category: 'Adepte',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 2,
    description: `Vous n’esquivez pas. Vous ripostez. Votre tir fuse comme un réflexe nerveux, avant même que la douleur n’arrive.`,
    effect: `Déclencheur : Un ennemi vous cible avec une attaque (réussie ou non), à distance.

Vous pouvez immédiatement tirer sur l’assaillant, même si ce n’est pas votre tour.
• Si votre tir touche, il inflige des dégâts normaux et le prochain jet d’attaque de cette cible subit –1.
• Si vous êtes sous couvert, vous gagnez également +1 en défense jusqu’à la fin du tour.
Limite : 1 fois par tour.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a80c8937ad741bce5f6d1`,
  },
  {
    id: `frappe-de-preemption`,
    skillId: `visee`,
    name: `Frappe de Préemption`,
    category: 'Professionnel',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 3,
    description: `Il n’aura pas le temps. Vous le savez. Et il comprend ça juste au moment où la balle l’atteint.`,
    effect: `Un ennemi commence une action dangereuse (attaque lourde, incantation, lancement de grenade, fuite...).
Vous interrompez son action par un tir effectué avant qu’il ne la réalise (sans malus).
• Si le tir touche, la cible subit l'effet normal et son action est entièrement annulée.
• Si le tir échoue, l'action se fait normalement, mais avec –2 à son jet.`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Visé 12
    url: `https://www.notion.so/206abc3abb3a80298262f9421d68f902`,
  },
  {
    id: `decrochement-reflexe`,
    skillId: `visee`,
    name: `Décrochement Réflexe`,
    category: 'Professionnel',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 2,
    description: `Il pensait vous coincer. Mais quand il lève les yeux, vous n’êtes déjà plus là. Et la balle part avant qu’il ne comprenne.`,
    effect: `Déclencheur : Un ennemi entre dans un rayon de 3 mètres autour de vous (approche frontale ou contournement) et vous n’êtes pas engagé.

Effet :
Avant qu’il ne vous atteigne :
• Vous vous déplacez immédiatement de 3 mètres dans une direction libre.`,
    prereqs: { minLevel: 10 },
    // Prérequis Notion : Dextérité 10
    url: `https://www.notion.so/206abc3abb3a807f9412f5b2f15bcf34`,
  },
  {
    id: `reseau-de-tir`,
    skillId: `visee`,
    name: `Réseau de Tir`,
    category: 'Professionnel',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 2,
    description: `Votre esprit devient un système de défense automatisé. Vous ne tirez plus — vous exécutez des protocoles de destruction conditionnelle.`,
    effect: `Vous désignez un couloir, une porte, un angle dans votre champ de vision.

Pendant 1 tour, vous entrez en mode réseau :
• Vous pouvez effectuer jusqu’à 2 réactions par tour (au lieu d’1)
• Si vous réussissez deux réactions dans le même tour : la troisième est gratuite (même hors de votre tour)`,
    prereqs: { minLevel: 10 },
    // Prérequis Notion : Visé 10
    url: `https://www.notion.so/206abc3abb3a80809365f60f853c0a82`,
  },
  {
    id: `neutralisation-psychologique`,
    skillId: `visee`,
    name: `Neutralisation Psychologique`,
    category: 'Professionnel',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 1,
    description: `Ce n’est pas votre arme qui le retient. C’est la certitude qu’elle va parler avant lui.`,
    effect: `Vous ciblez un ennemi agité (qui s’est déplacé, a crié, ou attaqué ce tour-ci). Vous le visez sans tirer.
• Il doit réussir un jet de discipline ou mental.
• En cas d’échec, il est "contenu" jusqu’à la fin de son tour suivant :
    ◦ –2 en attaque
    ◦ ne peut pas effectuer d’actions risquées (charge, ruée, magie instable...)
    ◦ ne peut pas vous viser`,
    prereqs: { minLevel: 11 },
    // Prérequis Notion : Visé 11
    url: `https://www.notion.so/206abc3abb3a80e7b406fb21bec32671`,
  },
  {
    id: `miroir-mortel`,
    skillId: `visee`,
    name: `Miroir Mortel`,
    category: 'Maître',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 5,
    description: `Il n’est plus seul. Vous êtes l’ombre armée de ses gestes, le bruit qui suit le choc, la balle qui arrive juste après l’épée.`,
    effect: `Effet :

Choisissez un allié visible. Jusqu’à la fin du combat (ou jusqu’à ce que vous rompiez le lien) :
• Si cet allié est attaqué, vous pouvez effectuer une attaque réflexe immédiate contre l’assaillant.
• Si cet allié attaque une cible, vous pouvez attaquer la même cible immédiatement après, gratuitement (1 fois par tour).
• Ces attaques sont réactions gratuites tant que vous avez la ligne de tir.
Limite : 1 allié lié à la fois.`,
    prereqs: { minLevel: 15 },
    // Prérequis Notion : Visé 15
    url: `https://www.notion.so/206abc3abb3a80378ce3d5aea0373cc2`,
  },
  {
    id: `tir-parfait`,
    skillId: `visee`,
    name: `Tir Parfait`,
    category: 'Maître',
    type: 'technique',
    family: `Tir Réflexe`,
    peCost: 4,
    description: `Ce n’est pas juste un tir. C’est le bon tir, au bon moment, sur la cible qui ne devait pas vivre une seconde de plus.`,
    effect: `Vous réalisez un tir d’exception, au moment le plus critique.
• Cette attaque ignore les couverts et touche automatiquement si la cible vient d’agir contre un allié.
• Elle inflige des dégâts critiques (maximum de l’arme) et inflige un état de panique ou de stupeur.
• Une fois par combat.`,
    prereqs: { minLevel: 16 },
    // Prérequis Notion : Visé 16
    url: `https://www.notion.so/206abc3abb3a80cda107f6300254a629`,
  },
  {
    id: `commandement-balistique`,
    skillId: `visee`,
    name: `Commandement Balistique`,
    category: 'Maître',
    type: 'passif',
    family: `Tir Réflexe`,
    description: `Vos balles ouvrent les cibles. Vos alliés les referment. C’est une chorégraphie de mort, fluide et sans parole.`,
    effect: `Tant que vous êtes en combat actif avec une arme à distance :
• Tous vos alliés dans un rayon de 8 mètres peuvent ajouter +1 à leur attaque contre une cible que vous avez déjà touchée ce tour.
• Si un allié tue une cible que vous avez touchée dans le même tour, vous gagnez 1 PE et pouvez changer de cible gratuitement pour votre prochain tir (même hors tour).`,
    prereqs: { minLevel: 17 },
    // Prérequis Notion : Visé  17
    url: `https://www.notion.so/206abc3abb3a80ddb27bf0e98333b72e`,
  },

  // Famille : Œil Fixe
  {
    id: `tenir-la-position`,
    skillId: `visee`,
    name: `Tenir la Position`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 1,
    description: `Le silence, le souffle lent, la stabilité. Tu n’es pas prêt à tirer. Tu es prêt à frapper.`,
    effect: `Vous entrez en état d'attente parfaite.
• Tant que vous ne vous déplacez pas et ne tirez pas, vous gagnez +1 Concentration à la fin du tour.
• Ce bonus passe à +2 Concentration si vous êtes en couverture complète ou sur un point élevé.`,
    url: `https://www.notion.so/206abc3abb3a801e90a2dd92321f9463`,
  },
  {
    id: `point-faible`,
    skillId: `visee`,
    name: `Point faible`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 2,
    description: `Vous ne l’avez pas encore touché. Mais il est déjà dans votre ligne de mire, dans votre souffle, dans votre temps.`,
    effect: `Vous tirez sur une cible en exploitant une faille dans sa protection.
• L’attaque ignore 3 point d’armures`,
    prereqs: { minLevel: 2 },
    // Prérequis Notion : Visé 2
    url: `https://www.notion.so/206abc3abb3a805884d5e3920f3d478d`,
  },
  {
    id: `tir-mesure`,
    skillId: `visee`,
    name: `Tir Mesuré`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 1,
    description: `Ce n’est pas un réflexe. C’est le tir pensé depuis trois secondes. Et c’est souvent le seul qui compte.`,
    effect: `Vous effectuez une attaque à distance avec +1 pour toucher, mais :
• Vous ne pouvez pas vous déplacer avant ou après ce tir,
• Et vous ne pouvez pas faire d’autres attaques ce tour.
Bonus :
• Si vous aviez au moins 1 point de Concentration, vous infligez +2 dégât par point de Concentration.`,
    prereqs: { minLevel: 4 },
    // Prérequis Notion : Visé 4
    url: `https://www.notion.so/206abc3abb3a808aaa70ff17f5d92a2b`,
  },
  {
    id: `alignement-parfait`,
    skillId: `visee`,
    name: `Alignement parfait`,
    category: 'Novice',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 1,
    description: `Tu inspires. Tu ajustes. Tu cales.`,
    effect: `Gagne immédiatement 1 point de Concentration.

Une fois par tours`,
    url: `https://www.notion.so/206abc3abb3a80a08a12ddcc189fc18f`,
  },
  {
    id: `perforation-totale`,
    skillId: `visee`,
    name: `Perforation Totale`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Fixe`,
    description: `Une flèche. Trois cris. Et la lumière derrière.`,
    effect: `Coût : 1 Concentration

Vous réalisez une attaque spéciale visant à percer une ligne d’ennemis ou de matériaux légers.
• Le tir traverse jusqu’à 2 cibles alignées, ou 1 cible + un obstacle (type planche, vitrail, tissu tendu…).
• Chaque cible est touchée séparément (jet d’attaque par cible), mais les dégâts sont réduits de 1 après la première.

-4 au tire`,
    prereqs: { minLevel: 8 },
    // Prérequis Notion : Visé 8
    url: `https://www.notion.so/206abc3abb3a80728189d9588e6eb15d`,
  },
  {
    id: `precision-implacable`,
    skillId: `visee`,
    name: `Précision Implacable`,
    category: 'Adepte',
    type: 'passif',
    family: `Œil Fixe`,
    description: `Un souffle maîtrisé. Un doigt ferme. Vous n’êtes pas plus fort…Vous êtes plus certain.`,
    effect: `Vous pouvez dépenser 1 point de Concentration juste avant une attaque à distance pour gagner +2 pour toucher.
• Peut être activé autant de fois que souhaité, tant que vous avez des points de Concentration.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a808fa0fcf3d62b14d947`,
  },
  {
    id: `changement-de-vent`,
    skillId: `visee`,
    name: `Changement de Vent`,
    category: 'Adepte',
    type: 'passif',
    family: `Œil Fixe`,
    description: `Une poussière, un battement de cœur trop tôt… mais vous l’avez corrigé.`,
    effect: `Vous pouvez relancer une attaque ratée si vous avez au moins 3 point de Concentration, que vous dépensez immédiatement.
• Si la seconde attaque touche, elle inflige –3 dégât, mais applique quand même tous les effets de la technique utilisée.

Une fois par tours`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a80e9afd0f25c9c378b34`,
  },
  {
    id: `transfert-de-mire`,
    skillId: `visee`,
    name: `Transfert de Mire`,
    category: 'Adepte',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 1,
    description: `Deux battements de cœur. Deux corps au sol. Vous ne tirez pas vite. Vous tirez sans hésiter.`,
    effect: `Pour 2 points de concentration vous pouvez tirer sur une deuxième cible.
Si cette seconde attaque touche, vous récupérez 1 PE.`,
    prereqs: { minLevel: 6 },
    // Prérequis Notion : Visé 6
    url: `https://www.notion.so/206abc3abb3a80f79804cc0a38115dcc`,
  },
  {
    id: `visee-totale`,
    skillId: `visee`,
    name: `Visée Totale`,
    category: 'Professionnel',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 1,
    description: `Même le temps vous obéit.`,
    effect: `Vous préparez un tir pendant 1 tour complet sans bouger.

Au tour suivant, vous tirez avec :
• +2 pour toucher
• +4 dégâts
• +2 par concentration dépensé`,
    prereqs: { minLevel: 12 },
    // Prérequis Notion : Sagesse 8 | Visé 12
    url: `https://www.notion.so/206abc3abb3a8005b784d89da20effa6`,
  },
  {
    id: `marche-mesuree`,
    skillId: `visee`,
    name: `Marche Mesurée`,
    category: 'Professionnel',
    type: 'technique',
    family: `Œil Fixe`,
    peCost: 2,
    description: `Vos bottes ne font pas de bruit.
Votre œil ne quitte jamais la cible.`,
    effect: `Vous pouvez vous déplacer de jusqu’à 3 mètres sans perdre vos points de Concentration.
• Ce déplacement ne déclenche pas d’attaque d’opportunité si vous avez au moins 1 point de Concentration.
• Ce pouvoir peut être utilisé une tous les 2 tour.`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Sagesse 9
    url: `https://www.notion.so/206abc3abb3a801cbfb6c80ce9ed5119`,
  },
  {
    id: `focalisation-absolue`,
    skillId: `visee`,
    name: `Focalisation Absolue`,
    category: 'Professionnel',
    type: 'passif',
    family: `Œil Fixe`,
    description: `Même quand le vent tourne, votre œil reste fixe.`,
    effect: `Votre maximum de Concentration passe à 5 (au lieu de 3).`,
    prereqs: { minLevel: 9 },
    // Prérequis Notion : Sagesse 4 | Visé 9
    url: `https://www.notion.so/206abc3abb3a8025a91af4ab8c993076`,
  },
  {
    id: `jugement`,
    skillId: `visee`,
    name: `Jugement`,
    category: 'Maître',
    type: 'technique',
    family: `Œil Fixe`,
    description: `Un tir pur, net, sans trace. L’équivalent d’un jugement divin — mais fait de poudre et d’acier.`,
    effect: `Coût : 3 Concentration

Effectuez une attaque contre une cible visible et connue.
• Ignore toute couverture et armure.
• Dégât dé critique
• Jet de constitution (DD 12) sinon projeté au sols a 3m`,
    prereqs: { minLevel: 15 },
    // Prérequis Notion : Visé 15
    url: `https://www.notion.so/206abc3abb3a80479363f2fdd50894cc`,
  },
  {
    id: `il-omniscient`,
    skillId: `visee`,
    name: `Œil Omniscient`,
    category: 'Maître',
    type: 'passif',
    family: `Œil Fixe`,
    description: `Votre œil n’est plus simplement une lentille de chair ou de verre : c’est un capteur d’intention.

Vous percevez les fissures dans la stratégie, les mouvements inconscients, le tremblement d’un souffle derrière un mur.

Le monde ne vous cache rien.

Plus rien.`,
    effect: `Tant que vous avez au moins 1 point de Concentration, vous bénéficiez des effets suivants :
• Vous ignorez les malus de visibilité (pluie, brouillard, lumière, etc.).
• Vous pouvez voir les ennemis camouflés ou semi-invisibles dans une zone de 15 mètres.
• Vos attaques à distance ignorent la pénalité de portée.

Vous gagnez +1 pour toucher contre toute cible déjà blessée par vous ce combat.`,
    prereqs: { minLevel: 10 },
    // Prérequis Notion : Sagesse 10
    url: `https://www.notion.so/206abc3abb3a80a891d1d1aa3aee97b2`,
  },
  {
    id: `tir-fantome`,
    skillId: `visee`,
    name: `Tir Fantôme`,
    category: 'Maître',
    type: 'technique',
    family: `Œil Fixe`,
    description: `C’est une frappe invisible, un avertissement silencieux que nul ne peut se cacher.
Tirer à travers un mur n’est pas un miracle — c’est de la géométrie, de la psychologie, et une confiance absolue dans le tir.`,
    effect: `Coût : 4 Concentration

Vous pouvez tirer sur un ennemi que vous ne voyez pas directement, à condition de connaître approximativement sa position (derrière un mur, une caisse, dans un bâtiment…).
• L’attaque ignore les pénalités de ligne de vue ou de visibilité totale
• Ignore la moitié de la couverture (pleine ou partielle)
• Si l’ennemi est camouflé, il perd son camouflage contre cette attaque
• Si l’attaque touche, elle inflige +4 dégâts
• Si elle tue la cible, vous ne perdez pas vos points de Concentration`,
    prereqs: { minLevel: 16 },
    // Prérequis Notion : Visé 16 | Sagesse 10
    url: `https://www.notion.so/206abc3abb3a80e9992adc22d9352e7f`,
  },
]

/** PT gagnés pour une compétence = niveau actuel de la compétence */
export function calcPtEarned(skillLevel: number): number {
  return skillLevel
}

/** PT dépensés pour une compétence, calculé à partir des techniques acquises */
export function calcPtSpent(skillId: string, acquiredIds: string[]): number {
  return TECHNIQUES.filter(
    (t) => t.skillId === skillId && acquiredIds.includes(t.id),
  ).reduce((sum, t) => sum + PT_COST[t.category], 0)
}

/** Vérifie si une technique est débloquable (prérequis satisfaits, PT suffisants) */
export function canAcquire(
  technique: TechniqueDef,
  skillLevel: number,
  acquiredIds: string[],
  ptAvailable: number,
): { ok: boolean; reason?: string } {
  if (acquiredIds.includes(technique.id)) return { ok: false, reason: 'Déjà acquise' }

  const cost = PT_COST[technique.category]
  if (ptAvailable < cost)
    return { ok: false, reason: `Pas assez de PT (coût : ${cost}, disponible : ${ptAvailable})` }

  if (technique.prereqs?.minLevel && skillLevel < technique.prereqs.minLevel)
    return { ok: false, reason: `Niveau ${technique.prereqs.minLevel} requis dans la compétence` }

  const missing = (technique.prereqs?.techniqueIds ?? []).filter((id) => !acquiredIds.includes(id))
  if (missing.length > 0) {
    const names = missing.map((id) => TECHNIQUES.find((t) => t.id === id)?.name ?? id).join(', ')
    return { ok: false, reason: `Requiert : ${names}` }
  }

  return { ok: true }
}
