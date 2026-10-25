/**
 * Sync browser — Techniques & Familles depuis l'API Notion via le proxy Cloudflare.
 * Résultats mis en cache dans localStorage.
 */

import { NOTION_PROXY_URL, DB_TECHNIQUES, DB_FAMILLES } from '../config'
import { convertTechniqueRow, convertFamilleRow } from './notionConvertTechniques'
import type { SyncedTechniqueDef, FamilleDef } from './notionConvertTechniques'
import type { NotionPageRow, NotionQueryResponse } from './notionTypes'

const CACHE_KEY = 'notion_techniques_cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { SyncedTechniqueDef, FamilleDef }

export interface TechniquesSyncData {
  timestamp:  string
  techniques: SyncedTechniqueDef[]
  familles:   FamilleDef[]
}

export interface TechniquesSyncResult extends TechniquesSyncData {
  stats: { requests: number; durationMs: number }
}

// ─── Fetch paginé ─────────────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function syncTechniquesFromNotion(): Promise<TechniquesSyncResult> {
  const t0 = performance.now()

  const [techResult, famResult] = await Promise.all([
    fetchAll(DB_TECHNIQUES),
    fetchAll(DB_FAMILLES),
  ])

  const techniques = techResult.rows
    .map(convertTechniqueRow)
    .filter((t): t is SyncedTechniqueDef => t !== null)

  const familles = famResult.rows
    .map(convertFamilleRow)
    .filter((f): f is FamilleDef => f !== null)

  const timestamp = new Date().toISOString()
  const data: TechniquesSyncData = { timestamp, techniques, familles }
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))

  const durationMs = Math.round(performance.now() - t0)
  return { ...data, stats: { requests: techResult.requests + famResult.requests, durationMs } }
}

export function getCachedTechniquesData(): TechniquesSyncData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TechniquesSyncData
  } catch {
    return null
  }
}

export function getCachedTechniquesTimestamp(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as { timestamp: string }).timestamp ?? null
  } catch {
    return null
  }
}
