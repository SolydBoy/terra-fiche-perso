/**
 * Cloudflare Worker — proxy CORS pour l'API Notion.
 *
 * Le token n'est PAS dans ce fichier : il est injecté comme secret Cloudflare
 * (jamais commité, jamais présent dans le bundle client).
 *   npx wrangler secret put NOTION_TOKEN --config scripts/notion-proxy/wrangler.toml
 *
 * Pour limiter les dégâts si l'URL du worker fuite (elle est publique, embarquée
 * dans le bundle client via src/config.ts), le proxy n'autorise QUE des requêtes
 * en lecture seule (`POST /v1/databases/<id>/query`) sur la liste fermée de
 * bases de données que l'app utilise réellement — jamais un relais ouvert vers
 * n'importe quel endpoint Notion.
 *
 * Déploiement : npx wrangler deploy --config scripts/notion-proxy/wrangler.toml
 * L'URL obtenue est à renseigner dans src/config.ts (NOTION_PROXY_URL).
 */

export interface Env {
  NOTION_TOKEN: string
}

const NOTION_BASE = 'https://api.notion.com'

const ALLOWED_ORIGINS = ['*']

/** Seules bases interrogeables par le proxy — tenu synchro avec src/config.ts */
const ALLOWED_DB_IDS = new Set([
  '6c454823-9614-448d-b4c2-0f364acfdc28', // DB_OBJECTS
  '103edc02-6d0d-43a3-a9f6-9ff9a154e578', // DB_VETEMENTS
  '87d0ab74-2176-43ef-8602-d7f4333499ec', // DB_ARMES
  '8cc862f2-8043-4f5d-ba75-52f3e286ae57', // DB_SACS
  '317abc3abb3a803fbe74f08dc135ee2b',     // DB_MONNAIE
  '203abc3abb3a8032ae39c2d02adc3764',     // DB_TECHNIQUES
  '203abc3abb3a8098b8a0c741ea6d7ffa',     // DB_FAMILLES
])

const QUERY_PATH = /^\/v1\/databases\/([a-f0-9-]+)\/query$/

function corsHeaders(origin: string): Record<string, string> {
  const allow = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ''
  return {
    'Access-Control-Allow-Origin':  allow || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(origin) })
    }

    const url   = new URL(request.url)
    const match = url.pathname.match(QUERY_PATH)

    if (!match || !ALLOWED_DB_IDS.has(match[1])) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders(origin) })
    }

    const notionRes = await fetch(`${NOTION_BASE}${url.pathname}${url.search}`, {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type':   'application/json',
      },
      body: await request.text(),
    })

    return new Response(await notionRes.text(), {
      status:  notionRes.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })
  },
}
