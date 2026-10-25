/**
 * Configuration — ces valeurs sont embarquées dans le bundle.
 *
 * NOTION_PROXY_URL : URL du Cloudflare Worker déployé.
 * Après "npx wrangler deploy", remplace la valeur ci-dessous par l'URL affichée.
 * Exemple : https://notion-proxy.ton-compte.workers.dev
 */

export const NOTION_PROXY_URL = 'https://notion-proxy.basile-lamarque.workers.dev'

export const DB_OBJECTS    = '6c454823-9614-448d-b4c2-0f364acfdc28'
export const DB_VETEMENTS  = '103edc02-6d0d-43a3-a9f6-9ff9a154e578'
export const DB_ARMES      = '87d0ab74-2176-43ef-8602-d7f4333499ec'
export const DB_SACS       = '8cc862f2-8043-4f5d-ba75-52f3e286ae57'
export const DB_MONNAIE    = '317abc3abb3a803fbe74f08dc135ee2b'

export const DB_TECHNIQUES = '203abc3abb3a8032ae39c2d02adc3764'
export const DB_FAMILLES   = '203abc3abb3a8098b8a0c741ea6d7ffa'
