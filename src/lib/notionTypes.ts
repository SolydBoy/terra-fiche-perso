/**
 * Formes minimales des réponses de l'API Notion effectivement lues par ce projet.
 * Pas une typisation exhaustive du SDK Notion — juste assez pour remplacer `any`
 * aux frontières fetch/convert par quelque chose de vérifié par le compilateur.
 */

export interface NotionRichTextItem {
  plain_text?: string
}

export interface NotionSelectOption {
  name?: string
}

/** Une valeur de propriété Notion n'a en pratique qu'un seul de ces champs rempli,
 *  celui correspondant au type de colonne — mais on ne lit jamais le mauvais champ
 *  pour une colonne donnée, donc un type "à plat" suffit ici. */
export interface NotionPropertyValue {
  title?:        NotionRichTextItem[]
  rich_text?:    NotionRichTextItem[]
  select?:       NotionSelectOption | null
  multi_select?: NotionSelectOption[]
  number?:       number | null
}

export type NotionProperties = Record<string, NotionPropertyValue | undefined>

export interface NotionPageRow {
  id:         string
  url?:       string
  properties: NotionProperties
}

export interface NotionQueryResponse {
  results:     NotionPageRow[]
  has_more:    boolean
  next_cursor: string | null
}
