/**
 * Sync items from Notion databases → src/data/items.json
 * Usage: npm run sync:items
 *
 * Script CLI Node.js — utilise @notionhq/client pour fetcher Notion
 * et src/lib/notionConvert pour convertir les données.
 */

import { Client } from '@notionhq/client'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { convertAll } from '../src/lib/notionConvert'
import type { NotionPageRow } from '../src/lib/notionTypes'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: join(__dirname, '..', '.env') })

// ─── Config ───────────────────────────────────────────────────────────────────

const TOKEN = process.env.NOTION_TOKEN
if (!TOKEN) {
  console.error('Erreur : variable d\'environnement NOTION_TOKEN manquante (voir .env.example).')
  process.exit(1)
}

const DB_OBJECTS   = '6c454823-9614-448d-b4c2-0f364acfdc28'
const DB_VETEMENTS = '103edc02-6d0d-43a3-a9f6-9ff9a154e578'
const DB_ARMES     = '87d0ab74-2176-43ef-8602-d7f4333499ec'
const DB_SACS      = '8cc862f2-8043-4f5d-ba75-52f3e286ae57'
const DB_MONNAIE   = '317abc3abb3a803fbe74f08dc135ee2b'

const notion = new Client({ auth: TOKEN })

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function queryAll(databaseId: string): Promise<NotionPageRow[]> {
  const results: NotionPageRow[] = []
  let cursor: string | undefined

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    })
    // Le SDK Notion type `results` en détail (unions discriminées par propriété) ;
    // on ne lit jamais que id/url/properties, donc on les traite via notre forme allégée.
    results.push(...(response.results as unknown as NotionPageRow[]))
    cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined
  } while (cursor)

  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Sync items from Notion\n')

  const sections = [
    { label: 'Objets',    dbId: DB_OBJECTS   },
    { label: 'Vêtements', dbId: DB_VETEMENTS },
    { label: 'Armes',     dbId: DB_ARMES     },
    { label: 'Sacs',      dbId: DB_SACS      },
    { label: 'Monnaies',  dbId: DB_MONNAIE   },
  ]

  const fetched: Record<string, NotionPageRow[]> = {}

  for (const { label, dbId } of sections) {
    console.log(`Fetching ${label}...`)
    fetched[label] = await queryAll(dbId)
    console.log(`  → ${fetched[label].length} rows`)
  }

  const { items, skipped } = convertAll({
    objects:   fetched['Objets'],
    vetements: fetched['Vêtements'],
    armes:     fetched['Armes'],
    sacs:      fetched['Sacs'],
    monnaies:  fetched['Monnaies'],
  })

  const output = {
    _generated: new Date().toISOString(),
    _count:     items.length,
    items,
  }

  const outPath = join(__dirname, '..', 'src', 'data', 'items.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`\n✓ ${items.length} items → src/data/items.json`)

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} items ignorés:`)
    for (const s of skipped) {
      console.log(`  [${s.section}] "${s.name}": ${s.reason}`)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
