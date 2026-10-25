/**
 * Sync browser — appelle le proxy Cloudflare Worker qui forward vers l'API Notion.
 * Fonctionne depuis n'importe quel index.html sans serveur.
 */

import { convertAll } from './notionConvert'
import type { ConvertAllResult } from './notionConvert'
import type { NotionPageRow, NotionQueryResponse } from './notionTypes'
import { NOTION_PROXY_URL, DB_OBJECTS, DB_VETEMENTS, DB_ARMES, DB_SACS, DB_MONNAIE } from '../config'

const CACHE_KEY = 'notion_items_cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DbKey = 'objects' | 'vetements' | 'armes' | 'sacs' | 'monnaies'

export const DB_LABELS: Record<DbKey, string> = {
  objects:   'Objets',
  vetements: 'Vêtements',
  armes:     'Armes',
  sacs:      'Sacs',
  monnaies:  'Monnaies',
}

const DB_IDS: Record<DbKey, string> = {
  objects:   DB_OBJECTS,
  vetements: DB_VETEMENTS,
  armes:     DB_ARMES,
  sacs:      DB_SACS,
  monnaies:  DB_MONNAIE,
}

type RawSources = Record<DbKey, NotionPageRow[]>

export interface SyncStats {
  requests:  number
  durationMs: number
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAll(dbId: string): Promise<{ rows: NotionPageRow[]; requests: number }> {
  const results: NotionPageRow[] = []
  let cursor: string | null = null
  let requests = 0

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_PROXY_URL}/v1/databases/${dbId}/query`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Notion ${res.status}: ${text}`)
    }
    const data = await res.json() as NotionQueryResponse
    results.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : null
    requests++
  } while (cursor)

  return { rows: results, requests }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function loadSources(): RawSources {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { objects: [], vetements: [], armes: [], sacs: [], monnaies: [] }
    const cached = JSON.parse(raw) as { sources?: RawSources }
    return cached.sources ?? { objects: [], vetements: [], armes: [], sacs: [], monnaies: [] }
  } catch {
    return { objects: [], vetements: [], armes: [], sacs: [], monnaies: [] }
  }
}

function saveSources(sources: RawSources): void {
  const result    = convertAll(sources)
  const timestamp = new Date().toISOString()
  localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp, sources, items: result.items }))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SyncResult extends ConvertAllResult {
  timestamp: string
  stats:     SyncStats
}

/** Sync une ou plusieurs BDDs (sans argument = sync complet). */
export async function syncFromNotion(keys?: DbKey[]): Promise<SyncResult> {
  const t0      = performance.now()
  const toSync  = keys ?? (Object.keys(DB_IDS) as DbKey[])
  const sources = loadSources()

  let totalRequests = 0

  const fetched = await Promise.all(
    toSync.map((key) =>
      fetchAll(DB_IDS[key]).then(({ rows, requests }) => {
        totalRequests += requests
        return { key, rows }
      })
    )
  )
  for (const { key, rows } of fetched) {
    sources[key] = rows
  }

  saveSources(sources)

  const result     = convertAll(sources)
  const timestamp  = new Date().toISOString()
  const durationMs = Math.round(performance.now() - t0)

  return { ...result, timestamp, stats: { requests: totalRequests, durationMs } }
}

export function getCachedTimestamp(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as { timestamp: string }).timestamp ?? null
  } catch {
    return null
  }
}
