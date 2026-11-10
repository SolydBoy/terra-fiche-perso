// ─── Planificateur du prochain tour ───────────────────────────────────────────
// Logique pure : simulation des PE d'un tour selon les règles de combat.
//  - Attaque : coût de base + fatigue accumulée dans le tour
//  - Toute action avec de la fatigue l'ajoute au cumul du tour (après son propre coût)
//  - Fin de tour : PE + récupération (plafonné au max) ; si PE négatifs → récupération / 2

export type PlanActionKind = 'attaque' | 'technique' | 'speciale' | 'sort' | 'competence' | 'deplacement' | 'perso'

const KINDS: PlanActionKind[] = ['attaque', 'technique', 'speciale', 'sort', 'competence', 'deplacement', 'perso']

/** Action disponible dans la palette (et copiée dans le plan) */
export interface PlanActionTemplate {
  /** Identifiant stable de l'action (ex. "atk:<instanceId>:0", "tech:<id>") */
  key:        string
  kind:       PlanActionKind
  label:      string
  /** Coût de base en PE */
  cost:       number
  /** Fatigue générée */
  fatigue:    number
  /** Si true, la fatigue accumulée du tour s'ajoute au coût */
  isAttack:   boolean
  corruption: number
  /** Coût réglable par étiquette dans le plan (ex. déplacement : 1 PE ou plus) */
  variableCost?: boolean
  /** Jets de dés à lancer quand l'action est résolue */
  rolls?: PlanRoll[]
}

export interface PlanRoll {
  label:   string
  /** Commande à copier-coller (ex. "/gr 1d20+10 Pistolet") */
  command: string
  /** Jet conditionnel (ex. dégâts si réussite de +5) : pas inclus dans « Tout copier » */
  optional?: boolean
}

export interface PlannedAction extends PlanActionTemplate {
  /** Identifiant unique de l'étiquette dans le plan */
  uid: string
}

export interface CustomPlanAction {
  key:   string
  label: string
  cost:  number
}

export interface TurnPlanState {
  /** Actions prévues pour le prochain tour, dans l'ordre */
  actions:       PlannedAction[]
  customActions: CustomPlanAction[]
  /** PE au début du tour : null = PE actuels de la fiche */
  peStartOverride: number | null
}

export const EMPTY_PLANNER: TurnPlanState = {
  actions:         [],
  customActions:   [],
  peStartOverride: null,
}

/** Accepte aussi l'ancien format multi-tours (on garde le premier tour). */
export function normalizePlanner(raw: unknown): TurnPlanState {
  if (!raw || typeof raw !== 'object') return EMPTY_PLANNER
  const r = raw as Partial<TurnPlanState> & { turns?: PlannedAction[][] }
  return {
    // Les anciennes étiquettes « Se défendre » / « Se déplacer » sont retirées
    actions:         (r.actions ?? r.turns?.[0] ?? []).filter((a) => KINDS.includes(a.kind)),
    customActions:   r.customActions ?? [],
    peStartOverride: typeof r.peStartOverride === 'number' ? r.peStartOverride : null,
  }
}

export interface StepResult {
  /** Coût réel (base + fatigue si attaque) */
  cost:          number
  /** Part du coût due à la fatigue */
  fatigueExtra:  number
  peBefore:      number
  peAfter:       number
  /** PE insuffisants pour lancer l'action */
  unaffordable:  boolean
}

export interface TurnResult {
  peStart:    number
  peEnd:      number
  /** PE au début du tour suivant (après récupération) */
  peNext:     number
  fatigue:    number
  corruption: number
  spent:      number
  steps:      StepResult[]
}

export function nextTurnPe(peEnd: number, peMax: number, recovery: number): number {
  return peEnd < 0 ? Math.floor(recovery / 2) : Math.min(peMax, peEnd + recovery)
}

export function simulateTurn(
  actions: PlanActionTemplate[],
  peStart: number,
  peMax: number,
  recovery: number,
): TurnResult {
  let pe = peStart
  let fatigue = 0
  let corruption = 0
  const steps = actions.map((a): StepResult => {
    const fatigueExtra = a.isAttack ? fatigue : 0
    const cost   = a.cost + fatigueExtra
    const before = pe
    const unaffordable = cost > 0 && before < cost
    pe -= cost
    fatigue    += a.fatigue
    corruption += a.corruption
    return { cost, fatigueExtra, peBefore: before, peAfter: pe, unaffordable }
  })
  return {
    peStart,
    peEnd:  pe,
    peNext: nextTurnPe(pe, peMax, recovery),
    fatigue,
    corruption,
    spent:  peStart - pe,
    steps,
  }
}
