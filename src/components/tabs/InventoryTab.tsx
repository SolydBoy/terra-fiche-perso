import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { syncFromNotion, getCachedTimestamp, DB_LABELS } from '../../lib/syncNotion'
import type { DbKey, SyncStats } from '../../lib/syncNotion'
import { useCharacterStore } from '../../store/characterStore'
import { useItemsStore } from '../../store/itemsStore'
import { ITEM_CATEGORIES, CLOTHING_SLOT, MULTI_EQUIP_CATEGORIES } from '../../engine/items-merged'
import type { ItemCategory, VolumeSize, EquipmentSlot, ItemDef } from '../../engine/items-merged'
import { calcEncombrementMax, calcInventoryPassiveBonuses } from '../../engine/stats'

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string }
let toastListeners: Array<(t: Toast) => void> = []
let toastCounter = 0

function emitToast(message: string) {
  const toast: Toast = { id: ++toastCounter, message }
  toastListeners.forEach((fn) => fn(toast))
}

function useToastEmitter() {
  return emitToast
}

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 2500)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler) }
  }, [])

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs px-4 py-2 rounded-lg shadow-xl
                     animate-[fadeInUp_0.2s_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  )
}

// ─── Tooltip description ──────────────────────────────────────────────────────

function ItemTooltip({ def, children }: { def: ItemDef; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <span
      className="flex-1 min-w-0 truncate cursor-default"
      onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e)  => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div
          className="fixed z-[9999] max-w-xs bg-[#242424] border border-zinc-600
                     rounded-lg shadow-2xl p-3 pointer-events-none space-y-1.5"
          style={{
            top:  Math.min(pos.y + 14, window.innerHeight - 160),
            left: Math.min(pos.x + 14, window.innerWidth  - 260),
          }}
        >
          <p className="text-xs font-semibold text-zinc-100">{def.name}</p>
          {def.description && (
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {def.description.slice(0, 200)}{def.description.length > 200 ? '…' : ''}
            </p>
          )}
          {def.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {def.labels.map((l) => (
                <span key={l} className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{l}</span>
              ))}
            </div>
          )}
          {/* Effets */}
          {(def.effects?.armor != null ||
            def.effects?.defenseBonus != null ||
            def.passiveEffect?.weightBonus != null ||
            def.passiveEffect?.moyenSlots  != null ||
            def.passiveEffect?.grandSlots  != null ||
            (def.statModifiers && Object.keys(def.statModifiers).length > 0)
          ) && (
            <div className="border-t border-zinc-700/60 pt-1.5 space-y-0.5">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Effets</p>
              {def.effects?.armor != null && (
                <p className="text-[10px] text-blue-300">Armure +{def.effects.armor}</p>
              )}
              {def.effects?.defenseBonus != null && (
                <p className={`text-[10px] ${def.effects.defenseBonus >= 0 ? 'text-cyan-300' : 'text-red-400'}`}>
                  Défense {def.effects.defenseBonus > 0 ? '+' : ''}{def.effects.defenseBonus} jets de défense
                </p>
              )}
              {def.passiveEffect?.weightBonus != null && (
                <p className="text-[10px] text-violet-300">Encombrement max +{def.passiveEffect.weightBonus} kg</p>
              )}
              {def.passiveEffect?.moyenSlots != null && (
                <p className="text-[10px] text-violet-300">+{def.passiveEffect.moyenSlots} slot(s) moyen</p>
              )}
              {def.passiveEffect?.grandSlots != null && (
                <p className="text-[10px] text-violet-300">+{def.passiveEffect.grandSlots} slot(s) grand</p>
              )}
              {def.statModifiers && Object.entries(def.statModifiers).map(([stat, val]) => (
                <p key={stat} className={`text-[10px] ${val > 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                  {val > 0 ? '+' : ''}{val} {stat}
                </p>
              ))}
            </div>
          )}
          <p className="text-[9px] text-zinc-600">{def.weight} kg · {def.volume}</p>
        </div>,
        document.body
      )}
    </span>
  )
}

/** Toutes les catégories vêtements (slots exclusifs + multi-équip) */
const CLOTHING_CATS = new Set<ItemCategory>([
  ...Object.keys(CLOTHING_SLOT) as ItemCategory[],
  ...MULTI_EQUIP_CATEGORIES,
])

// ─── Couleurs volume ──────────────────────────────────────────────────────────

const VOLUME_BADGE: Record<VolumeSize, string> = {
  'petit':      'bg-zinc-700 text-zinc-300',
  'moyen':      'bg-yellow-900/60 text-yellow-300',
  'grand':      'bg-orange-900/60 text-orange-300',
  'très grand': 'bg-red-900/60 text-red-300',
}

const VOLUME_LABEL: Record<VolumeSize, string> = {
  'petit':      'PETIT',
  'moyen':      'MOYEN',
  'grand':      'GRAND',
  'très grand': 'T. GRAND',
}

// ─── Couleurs catégorie ───────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<ItemCategory, string> = {
  'Monnaie':            'text-yellow-300 border-yellow-900/50',
  'Arme':               'text-red-400 border-red-900/60',
  'Couvre-chef':        'text-blue-300 border-blue-900/50',
  'Haut':               'text-blue-400 border-blue-900/60',
  'Pantalon':           'text-blue-400 border-blue-900/60',
  'Chaussure':          'text-blue-300 border-blue-900/50',
  'Veste':              'text-sky-400 border-sky-900/60',
  'Survêtement':        'text-sky-300 border-sky-900/50',
  'Armure':             'text-slate-300 border-slate-700/60',
  'Accessoire':         'text-indigo-400 border-indigo-900/60',
  'Nourriture':         'text-emerald-400 border-emerald-900/60',
  'Santé':              'text-rose-400 border-rose-900/60',
  'Munition':           'text-orange-400 border-orange-900/60',
  'Object de valeur':   'text-yellow-400 border-yellow-900/60',
  'Outils':             'text-amber-400 border-amber-900/60',
  'Craft':              'text-violet-400 border-violet-900/60',
  'Lumière':            'text-amber-300 border-amber-900/40',
  "Element d'intéret":  'text-purple-400 border-purple-900/60',
  'Autre':              'text-zinc-400 border-zinc-700',
}

// ─── Badges d'effets ──────────────────────────────────────────────────────────

function EffectsBadges({ def }: { def: ItemDef }) {
  const parts: { text: string; cls: string }[] = []

  if (def.consumeEffect) {
    const fx = def.consumeEffect
    if (fx.hp    != null && fx.hp    > 0) parts.push({ text: `+${fx.hp} PV`,       cls: 'bg-rose-900/60 text-rose-300' })
    if (fx.faim  != null && fx.faim  > 0) parts.push({ text: `+${fx.faim} Faim`,   cls: 'bg-amber-900/60 text-amber-300' })
    if (fx.soif  != null && fx.soif  > 0) parts.push({ text: `+${fx.soif} Soif`,   cls: 'bg-sky-900/60 text-sky-300' })
    if (fx.stress != null && fx.stress < 0) parts.push({ text: `${fx.stress} Stress`, cls: 'bg-emerald-900/60 text-emerald-300' })
    if (fx.stress != null && fx.stress > 0) parts.push({ text: `+${fx.stress} Stress`, cls: 'bg-zinc-700 text-zinc-400' })
  }
  if (def.effects?.armor != null && def.effects.armor > 0) {
    parts.push({ text: `Armure +${def.effects.armor}`, cls: 'bg-blue-900/60 text-blue-300' })
  }
  if (def.effects?.defenseBonus != null && def.effects.defenseBonus !== 0) {
    const v = def.effects.defenseBonus
    parts.push({ text: `Défense ${v > 0 ? '+' : ''}${v}`, cls: v > 0 ? 'bg-cyan-900/60 text-cyan-300' : 'bg-red-900/60 text-red-300' })
  }
  if (def.passiveEffect?.weightBonus) {
    parts.push({ text: `+${def.passiveEffect.weightBonus} kg max`, cls: 'bg-violet-900/60 text-violet-300' })
  }
  if (def.passiveEffect?.moyenSlots) {
    parts.push({ text: `+${def.passiveEffect.moyenSlots} moyen`, cls: 'bg-violet-900/60 text-violet-300' })
  }
  if (def.passiveEffect?.grandSlots) {
    parts.push({ text: `+${def.passiveEffect.grandSlots} grand`, cls: 'bg-violet-900/60 text-violet-300' })
  }
  if (def.statModifiers) {
    for (const [stat, val] of Object.entries(def.statModifiers)) {
      const sign = val > 0 ? '+' : ''
      parts.push({ text: `${sign}${val} ${stat}`, cls: val > 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300' })
    }
  }

  if (parts.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap">
      {parts.map(({ text, cls }) => (
        <span key={text} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>
          {text}
        </span>
      ))}
    </div>
  )
}

// ─── Bouton sync Notion ───────────────────────────────────────────────────────

type SyncState = 'idle' | 'loading' | 'success' | 'error'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
       + ' '
       + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const ALL_DB_KEYS = Object.keys(DB_LABELS) as DbKey[]

function SyncButton() {
  const { refresh }               = useItemsStore()
  const [state, setState]           = useState<SyncState>('idle')
  const [loadingKey, setLoadingKey] = useState<DbKey | 'all' | null>(null)
  const [detail, setDetail]         = useState('')
  const [lastSync, setLastSync]     = useState<string | null>(null)
  const [expanded, setExpanded]     = useState(false)
  const [stats, setStats]           = useState<SyncStats | null>(null)

  useEffect(() => { setLastSync(getCachedTimestamp()) }, [])

  const handleSync = useCallback(async (keys?: DbKey[]) => {
    const key = keys?.length === 1 ? keys[0] : 'all'
    setState('loading')
    setLoadingKey(key)
    setDetail('')
    try {
      const result = await syncFromNotion(keys)
      refresh()
      setState('success')
      setLastSync(result.timestamp)
      setStats(result.stats)
      const skippedMsg = result.skipped.length > 0
        ? `${result.skipped.length} items ignorés:\n` +
          result.skipped.map(s => `[${s.section}] ${s.name}: ${s.reason}`).join('\n')
        : ''
      setDetail(skippedMsg)
      setTimeout(() => { setState('idle'); setLoadingKey(null) }, 3000)
    } catch (err) {
      setState('error')
      setLoadingKey(null)
      setDetail(String(err))
    }
  }, [refresh])

  const busy = state === 'loading' || state === 'success'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">

        {/* Bouton sync tout */}
        <button
          onClick={() => handleSync()}
          disabled={busy}
          className={`text-[10px] px-2.5 py-1 rounded border font-bold transition-colors ${
            state === 'loading' && loadingKey === 'all' ? 'border-zinc-700 text-zinc-600 cursor-wait' :
            state === 'success' && loadingKey === 'all' ? 'border-emerald-800 text-emerald-400 cursor-default' :
            state === 'error'   ? 'border-red-800/60 text-red-400 hover:border-red-600' :
            'border-zinc-700 text-zinc-500 hover:border-orange-600 hover:text-orange-400'
          }`}
        >
          {state === 'loading' && loadingKey === 'all' ? 'Sync…'       :
           state === 'success' && loadingKey === 'all' ? '✓ Synced'    :
           state === 'error'                           ? '✗ Réessayer' :
           '⟳ Sync Notion'}
        </button>

        {/* Toggle sync partiel */}
        <button
          onClick={() => setExpanded((v) => !v)}
          disabled={busy}
          className="text-[10px] px-1.5 py-1 rounded border border-zinc-800
                     text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors"
          title="Sync partiel par BDD"
        >{expanded ? '▴' : '▾'}</button>

        {lastSync && (state === 'idle' || (state === 'success' && loadingKey !== 'all')) && (
          <span className="text-[9px] text-zinc-600">
            {formatTimestamp(lastSync)}
          </span>
        )}
        {state === 'error' && (
          <span className="text-[9px] text-red-500 italic">Erreur</span>
        )}
      </div>

      {/* Boutons individuels par BDD */}
      {expanded && (
        <div className="flex flex-wrap gap-1 pl-1">
          {ALL_DB_KEYS.map((key) => {
            const isThis = loadingKey === key
            return (
              <button
                key={key}
                onClick={() => handleSync([key])}
                disabled={busy}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                  state === 'loading' && isThis ? 'border-zinc-700 text-zinc-600 cursor-wait' :
                  state === 'success' && isThis ? 'border-emerald-800 text-emerald-400'       :
                  'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {state === 'loading' && isThis ? '…' :
                 state === 'success' && isThis ? '✓' : '⟳'} {DB_LABELS[key]}
              </button>
            )
          })}
        </div>
      )}

      {/* Stats debug */}
      {stats && (state === 'success' || state === 'idle') && (
        <div className="text-[9px] text-zinc-600 font-mono flex gap-x-3 pl-1">
          <span>⏱ {(stats.durationMs / 1000).toFixed(1)}s</span>
          <span>📡 {stats.requests} requêtes</span>
        </div>
      )}

      {detail && (
        <pre className={`text-[8px] rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap ${
          state === 'error'
            ? 'text-red-400/70 bg-red-950/20 border border-red-900/30'
            : 'text-zinc-500 bg-zinc-900/40 border border-zinc-800'
        }`}>
          {detail}
        </pre>
      )}
    </div>
  )
}

// ─── Résumé encombrement ──────────────────────────────────────────────────────

function InventorySummary() {
  const { character } = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()
  const inventory   = character.inventory ?? []
  const equippedIds = new Set([
    ...Object.values(character.equipped ?? {}),
    ...(character.equippedList ?? []),
  ])

  // Poids : items équipés → seulement 1 unité exclue (le reste de la stack compte)
  const weightSources: { label: string; value: number }[] = []
  const totalKg = inventory.reduce((sum, item) => {
    const def = ITEMS_LIST.find((d) => d.id === item.itemId)
    if (!def) return sum
    const countingQty = equippedIds.has(item.id) ? Math.max(0, item.quantity - 1) : item.quantity
    if (countingQty > 0 && def.weight > 0) {
      weightSources.push({
        label: countingQty > 1 ? `${def.name} ×${countingQty}` : def.name,
        value: parseFloat((def.weight * countingQty).toFixed(2)),
      })
    }
    return sum + def.weight * countingQty
  }, 0)
  const [showWeightTooltip,     setShowWeightTooltip]     = useState(false)
  const [showMoyensTooltip,     setShowMoyensTooltip]     = useState(false)
  const [showGrandsTooltip,     setShowGrandsTooltip]     = useState(false)
  const [showTresGrandsTooltip, setShowTresGrandsTooltip] = useState(false)

  const moyensEntries    = inventory.filter(i => ITEMS_LIST.find(d => d.id === i.itemId)?.volume === 'moyen')
  const grandsEntries    = inventory.filter(i => ITEMS_LIST.find(d => d.id === i.itemId)?.volume === 'grand')
  const tresGrandsEntries= inventory.filter(i => ITEMS_LIST.find(d => d.id === i.itemId)?.volume === 'très grand')

  const nbMoyens    = moyensEntries.reduce((s, i) => s + (equippedIds.has(i.id) ? Math.max(0, i.quantity - 1) : i.quantity), 0)
  const nbGrands    = grandsEntries.reduce((s, i) => s + (equippedIds.has(i.id) ? Math.max(0, i.quantity - 1) : i.quantity), 0)
  const nbTresGrands= tresGrandsEntries.reduce((s, i) => s + (equippedIds.has(i.id) ? Math.max(0, i.quantity - 1) : i.quantity), 0)

  function volumeItemNames(entries: typeof inventory) {
    return entries.flatMap(i => {
      const qty = equippedIds.has(i.id) ? Math.max(0, i.quantity - 1) : i.quantity
      if (qty <= 0) return []
      const def = ITEMS_LIST.find(d => d.id === i.itemId)
      return [def ? (qty > 1 ? `${def.name} ×${qty}` : def.name) : i.itemId]
    })
  }

  const passiveBonuses       = calcInventoryPassiveBonuses(character, ITEMS_LIST)
  const effectiveMoyensMax   = (character.objetsMoyensMax   ?? 1) + passiveBonuses.moyenSlots
  const effectiveGrandsMax   = (character.objetsGrandsMax   ?? 1) + passiveBonuses.grandSlots
  const effectiveTresGrandsMax = character.objetsTresGrandsMax || 1

  const weightMax  = calcEncombrementMax(character, ITEMS_LIST).total
  const weightPct  = Math.min(100, (totalKg / weightMax) * 100)
  const overWeight = totalKg > weightMax

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 shrink-0 w-16">Poids</span>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overWeight ? 'bg-red-500' : 'bg-orange-500'}`}
            style={{ width: `${weightPct}%` }}
          />
        </div>
        <div
          className="relative"
          onMouseEnter={() => setShowWeightTooltip(true)}
          onMouseLeave={() => setShowWeightTooltip(false)}
        >
          <span className={`text-xs font-mono font-bold shrink-0 cursor-default ${overWeight ? 'text-red-400' : 'text-zinc-200'}`}>
            {totalKg.toFixed(2)} / {weightMax} kg
          </span>
          {showWeightTooltip && weightSources.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 z-50 w-56
                            bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-xl p-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">Détail du poids</p>
              {weightSources
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((s) => (
                  <div key={s.label} className="flex justify-between gap-2 text-[10px]">
                    <span className="text-zinc-400 truncate">{s.label}</span>
                    <span className="text-zinc-200 font-mono shrink-0">{s.value} kg</span>
                  </div>
                ))}
              <div className="border-t border-zinc-700 mt-1 pt-1 flex justify-between text-[10px] font-bold">
                <span className="text-zinc-400">Total</span>
                <span className="text-zinc-100 font-mono">{totalKg.toFixed(2)} kg</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 text-[11px]">
        {/* Objets moyens */}
        <div className="relative"
          onMouseEnter={() => setShowMoyensTooltip(true)}
          onMouseLeave={() => setShowMoyensTooltip(false)}
        >
          <span className="flex items-center gap-1 text-yellow-300 cursor-default">
            <span className="text-yellow-500">▪</span>
            <span className="font-mono font-bold">{nbMoyens}</span>
            <span className="text-zinc-500">moyens</span>
            <span className="text-zinc-600">/{effectiveMoyensMax}</span>
          </span>
          {showMoyensTooltip && nbMoyens > 0 && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-52
                            bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-xl p-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">Objets moyens</p>
              {volumeItemNames(moyensEntries).map((name, idx) => (
                <div key={idx} className="text-[10px] text-zinc-300">{name}</div>
              ))}
            </div>
          )}
        </div>

        {/* Objets grands */}
        <div className="relative"
          onMouseEnter={() => setShowGrandsTooltip(true)}
          onMouseLeave={() => setShowGrandsTooltip(false)}
        >
          <span className="flex items-center gap-1 text-orange-300 cursor-default">
            <span className="text-orange-500">◆</span>
            <span className="font-mono font-bold">{nbGrands}</span>
            <span className="text-zinc-500">grands</span>
            <span className="text-zinc-600">/{effectiveGrandsMax}</span>
          </span>
          {showGrandsTooltip && nbGrands > 0 && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-52
                            bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-xl p-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">Objets grands</p>
              {volumeItemNames(grandsEntries).map((name, idx) => (
                <div key={idx} className="text-[10px] text-zinc-300">{name}</div>
              ))}
            </div>
          )}
        </div>

        {/* Objets très grands */}
        <div className="relative"
          onMouseEnter={() => setShowTresGrandsTooltip(true)}
          onMouseLeave={() => setShowTresGrandsTooltip(false)}
        >
          <span className="flex items-center gap-1 text-red-300 cursor-default">
            <span className="text-red-500">◈</span>
            <span className="font-mono font-bold">{nbTresGrands}</span>
            <span className="text-zinc-500">très grands</span>
            <span className="text-zinc-600">/{effectiveTresGrandsMax}</span>
          </span>
          {showTresGrandsTooltip && nbTresGrands > 0 && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-52
                            bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-xl p-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">Objets très grands</p>
              {volumeItemNames(tresGrandsEntries).map((name, idx) => (
                <div key={idx} className="text-[10px] text-zinc-300">{name}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Panneau d'équipement ─────────────────────────────────────────────────────

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  'tête':   'Couvre-chef',
  'torse':  'Haut',
  'jambes': 'Pantalon',
  'pieds':  'Chaussure',
  'mains':  'Mains',
  'veste':  'Veste',
  'dos':    'Dos',
}

const EXCLUSIVE_SLOTS: EquipmentSlot[] = ['tête', 'torse', 'jambes', 'pieds', 'veste', 'dos']
const MULTI_LABELS: Partial<Record<ItemCategory, string>> = {
  'Armure':      'Armures',
  'Survêtement': 'Survêtements',
  'Accessoire':  'Accessoires',
}

function QtyInput({ value, onChange, onRemove, small = false }: {
  value:    number
  onChange: (n: number) => void
  onRemove: () => void
  small?:   boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')
  const btnCls = small
    ? 'w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 text-[10px] flex items-center justify-center transition-colors'
    : 'w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs flex items-center justify-center transition-colors'

  function commit() {
    const n = parseInt(draft, 10)
    if (!isNaN(n) && n >= 1) onChange(n)
    else if (!isNaN(n) && n <= 0) onRemove()
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') setEditing(false)
        }}
        onClick={(e) => e.stopPropagation()}
        className={`font-mono text-xs text-zinc-200 text-center bg-zinc-800 border border-orange-600 rounded focus:outline-none
                    [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                    ${small ? 'w-8' : 'w-8'}`}
      />
    )
  }

  return (
    <>
      <button onClick={() => { if (value <= 1) onRemove(); else onChange(value - 1) }} className={btnCls}>−</button>
      <span
        className={`font-mono text-xs text-zinc-200 text-center cursor-text hover:text-orange-300 transition-colors ${small ? 'w-6' : 'w-5'}`}
        onClick={(e) => { e.stopPropagation(); setDraft(String(value)); setEditing(true) }}
        title="Cliquer pour saisir"
      >{value}</span>
      <button onClick={() => onChange(value + 1)} className={btnCls}>+</button>
    </>
  )
}

export function EquipmentPanel() {
  const { character, unequipItem, unequipListItem, updateInventoryQty, removeInventoryItem } = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()
  const equipped     = character.equipped ?? {}
  const equippedList = character.equippedList ?? []
  const [activeSystem, setActiveSystem] = useState<string | null>(null)

  const allMonnaieItems = (character.inventory ?? [])
    .filter((i) => ITEMS_LIST.find((d) => d.id === i.itemId)?.category === 'Monnaie')

  const systems = [...new Set(
    allMonnaieItems
      .map((i) => ITEMS_LIST.find((d) => d.id === i.itemId)?.monetarySystem)
      .filter((s): s is string => !!s)
  )].sort((a, b) => a.localeCompare(b, 'fr'))

  const currentSystem = systems.length > 0
    ? (activeSystem && systems.includes(activeSystem) ? activeSystem : systems[0])
    : null

  const monnaieItems = (currentSystem
    ? allMonnaieItems.filter((i) => ITEMS_LIST.find((d) => d.id === i.itemId)?.monetarySystem === currentSystem)
    : allMonnaieItems
  ).sort((a, b) => {
    const valA = ITEMS_LIST.find((d) => d.id === a.itemId)?.monetaryValue ?? 0
    const valB = ITEMS_LIST.find((d) => d.id === b.itemId)?.monetaryValue ?? 0
    return valB - valA
  })

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3 space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold
                     border-b border-zinc-700/60 pb-1">
        Équipement
      </h3>

      {/* Slots exclusifs */}
      <div className="space-y-0.5">
        {EXCLUSIVE_SLOTS.map((slot) => {
          const instanceId = equipped[slot]
          const inst = instanceId ? (character.inventory ?? []).find((i) => i.id === instanceId) : null
          const def  = inst ? ITEMS_LIST.find((d) => d.id === inst.itemId) : null

          return (
            <div key={slot} className="flex items-center gap-2 py-1 border-b border-zinc-800/40 last:border-0">
              <span className="text-[10px] text-zinc-600 w-20 shrink-0">{SLOT_LABELS[slot]}</span>
              {def ? (
                <>
                  <ItemTooltip def={def}>
                    <span className="text-xs text-zinc-200">{def.name}</span>
                  </ItemTooltip>
                  {def.effects?.armor != null && def.effects.armor > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                      +{def.effects.armor}
                    </span>
                  )}
                  {def.url && (
                    <a
                      href={def.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700
                                 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                      title="Fiche de l'objet"
                    >↗</a>
                  )}
                  <button
                    onClick={() => unequipItem(slot)}
                    className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-zinc-700
                               text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                  >Retirer</button>
                </>
              ) : (
                <span className="flex-1 text-xs text-zinc-800">—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Sections multi-équip */}
      {(Object.keys(MULTI_LABELS) as ItemCategory[]).map((cat) => {
        const catItems = equippedList
          .map((id) => (character.inventory ?? []).find((i) => i.id === id))
          .filter((inst): inst is NonNullable<typeof inst> => !!inst)
          .filter((inst) => ITEMS_LIST.find((d) => d.id === inst.itemId)?.category === cat)

        return (
          <div key={cat} className="border-t border-zinc-800/60 pt-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              {MULTI_LABELS[cat]}
            </span>
            {catItems.length === 0 ? (
              <p className="text-[10px] text-zinc-800 mt-0.5">—</p>
            ) : (
              <div className="mt-0.5 space-y-0.5">
                {catItems.map((inst) => {
                  const def = ITEMS_LIST.find((d) => d.id === inst.itemId)
                  if (!def) return null
                  return (
                    <div key={inst.id} className="flex items-center gap-2">
                      <ItemTooltip def={def}>
                        <span className="text-xs text-zinc-200">{def.name}</span>
                      </ItemTooltip>
                      {def.effects?.armor != null && def.effects.armor > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                          +{def.effects.armor}
                        </span>
                      )}
                      {def.url && (
                        <a
                          href={def.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700
                                     text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                          title="Fiche de l'objet"
                        >↗</a>
                      )}
                      <button
                        onClick={() => unequipListItem(inst.id)}
                        className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-zinc-700
                                   text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                      >Retirer</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Monnaie */}
      <div className="border-t border-zinc-800/60 pt-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-300/70">Monnaie</span>
          <div className="flex items-center gap-1.5">
            {monnaieItems.length > 0 && (
              <span className="font-mono text-xs font-bold text-yellow-300">
                {monnaieItems.reduce((s, i) => {
                  const val = ITEMS_LIST.find((d) => d.id === i.itemId)?.monetaryValue ?? 1
                  return s + i.quantity * val
                }, 0)}
              </span>
            )}
            {systems.length > 1 && currentSystem && (
              <button
                onClick={() => {
                  const idx = systems.indexOf(currentSystem)
                  setActiveSystem(systems[(idx + 1) % systems.length])
                }}
                className="text-[9px] px-1.5 py-0.5 rounded border border-yellow-900/50
                           text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-700
                           transition-colors font-mono"
              >{currentSystem} ▸</button>
            )}
            {systems.length === 1 && currentSystem && (
              <span className="text-[9px] text-yellow-900/80 font-mono">{currentSystem}</span>
            )}
          </div>
        </div>
        {allMonnaieItems.length === 0 ? (
          <span className="text-[10px] text-zinc-700 italic">Aucune</span>
        ) : (
          <div className="space-y-0.5">
            {monnaieItems.map((item) => {
              const def = ITEMS_LIST.find((d) => d.id === item.itemId)
              if (!def) return null
              return (
                <div key={item.id} className="flex items-center gap-1.5">
                  <span className="flex-1 text-[10px] text-zinc-400 truncate">{def.name}</span>
                  {def.monetaryValue != null && (
                    <span className="text-[9px] font-mono text-yellow-900/80 shrink-0">×{def.monetaryValue}</span>
                  )}
                  <QtyInput
                    small
                    value={item.quantity}
                    onChange={(n) => updateInventoryQty(item.id, n)}
                    onRemove={() => removeInventoryItem(item.id)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Ligne d'inventaire ───────────────────────────────────────────────────────

function InventoryRow({ instanceId, highlighted }: { instanceId: string; highlighted?: boolean }) {
  const { character, removeInventoryItem, updateInventoryQty, updateInventoryNotes,
          equipItem, unequipItem, equipListItem, unequipListItem, useInventoryItem } = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()

  const item = (character.inventory ?? []).find((i) => i.id === instanceId)
  if (!item) return null

  const def = ITEMS_LIST.find((d) => d.id === item.itemId)
  if (!def) return null

  const rowRef = useRef<HTMLLIElement>(null)
  const [editNotes, setEditNotes] = useState(false)
  const [draftNotes, setDraftNotes] = useState(item.notes ?? '')

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  function commitNotes() {
    updateInventoryNotes(item!.id, draftNotes.trim())
    setEditNotes(false)
  }

  const equipped     = character.equipped ?? {}
  const equippedList = character.equippedList ?? []
  const slot         = CLOTHING_SLOT[def.category] ?? def.slot
  // Si l'item a un slot explicite (ex: sac → 'dos'), on force le mode exclusif
  const isMulti      = MULTI_EQUIP_CATEGORIES.has(def.category) && !def.slot
  const isEquipped   = isMulti
    ? equippedList.includes(instanceId)
    : (slot ? equipped[slot] === instanceId : false)
  const slotOccupied = !isMulti && slot ? !!equipped[slot] && !isEquipped : false

  return (
    <li ref={rowRef} className={`flex flex-col py-2 border-b border-zinc-800/60 last:border-0 rounded transition-colors duration-300 ${highlighted ? 'bg-orange-500/10 ring-1 ring-orange-500/40' : ''}`}>
      <div className="flex items-center gap-2">
        {/* Badge volume */}
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${VOLUME_BADGE[def.volume]}`}>
          {VOLUME_LABEL[def.volume]}
        </span>

        {/* Nom */}
        <ItemTooltip def={def}>
          <span className="text-xs text-zinc-200">{def.name}</span>
        </ItemTooltip>

        {/* Poids */}
        <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
          {(def.weight * item.quantity).toFixed(2)} kg
        </span>

        {/* Bouton équiper */}
        {(isMulti || slot) && (
          isEquipped ? (
            <>
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-900/60 text-orange-300">
                ÉQUIPÉ
              </span>
              <button
                onClick={() => isMulti ? unequipListItem(instanceId) : unequipItem(slot!)}
                className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-zinc-600
                           text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
              >
                Retirer
              </button>
            </>
          ) : (
            <button
              onClick={() => isMulti ? equipListItem(instanceId) : equipItem(instanceId)}
              title={slotOccupied ? "Remplace l'équipement actuel" : undefined}
              className={`shrink-0 text-[10px] px-2 py-0.5 rounded border transition-colors ${
                slotOccupied
                  ? 'border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600'
                  : 'border-blue-800 text-blue-400 hover:bg-blue-900/30'
              }`}
            >
              Équiper
            </button>
          )
        )}

        {/* Bouton Utiliser */}
        {def.consumeEffect && (
          <button
            onClick={() => useInventoryItem(item.id)}
            className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-emerald-800
                       text-emerald-400 hover:bg-emerald-900/30 transition-colors font-bold"
          >
            Utiliser
          </button>
        )}

        {/* Lien notes */}
        {def.url && (
          <a
            href={def.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700
                       text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
            title="Fiche de l'objet"
          >
            ↗
          </a>
        )}

        {/* Qty */}
        <div className="flex items-center gap-1 shrink-0">
          <QtyInput
            value={item.quantity}
            onChange={(n) => updateInventoryQty(item.id, n)}
            onRemove={() => removeInventoryItem(item.id)}
          />
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => { setDraftNotes(item.notes ?? ''); setEditNotes((v) => !v) }}
          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            item.notes
              ? 'border-zinc-600 text-zinc-400 hover:text-zinc-200'
              : 'border-zinc-800 text-zinc-700 hover:text-zinc-500'
          }`}
          title="Notes"
        >✎</button>

        {/* Supprimer */}
        <button
          onClick={() => removeInventoryItem(item.id)}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded
                     text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
          aria-label="Supprimer"
        >×</button>
      </div>

      {/* Ligne 2 : labels + effets */}
      {(def.labels.length > 0 || def.consumeEffect || def.effects?.armor || def.passiveEffect) && (
        <div className="flex gap-1 mt-1 ml-16 flex-wrap">
          {def.labels.map((l) => (
            <span key={l} className="text-[9px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              {l}
            </span>
          ))}
          <EffectsBadges def={def} />
        </div>
      )}

      {/* Notes inline */}
      {editNotes && (
        <div className="mt-1.5">
          <input
            autoFocus
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            onBlur={commitNotes}
            onKeyDown={(e) => { if (e.key === 'Enter') commitNotes(); if (e.key === 'Escape') setEditNotes(false) }}
            placeholder="Note…"
            className="w-full bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-0.5
                       text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-orange-500"
          />
        </div>
      )}
      {!editNotes && item.notes && (
        <p className="mt-0.5 text-[10px] text-zinc-500 italic">{item.notes}</p>
      )}
    </li>
  )
}

// ─── Bouton +N pour le picker ─────────────────────────────────────────────────

function AddNButton({ defId, disabled, itemName }: { defId: string; disabled: boolean; itemName: string }) {
  const { addInventoryItem } = useCharacterStore()
  const toast = useToastEmitter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('2')

  function applyAndClose(e: React.SyntheticEvent) {
    e.stopPropagation()
    const n = Math.max(1, parseInt(draft, 10) || 1)
    for (let i = 0; i < n; i++) addInventoryItem(defId)
    toast(`${itemName} ×${n} ajouté${n > 1 ? 's' : ''} à l'inventaire`)
    setOpen(false)
    setDraft('2')
  }

  if (disabled) return null

  if (open) {
    return (
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type="number"
          min={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyAndClose(e)
            if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
          }}
          className="w-10 text-center bg-[#0a0a0a] border border-orange-600 rounded
                     text-xs text-zinc-200 font-mono py-0.5 focus:outline-none
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={applyAndClose}
          className="w-5 h-5 rounded bg-orange-600 hover:bg-orange-500 text-black
                     text-xs font-bold flex items-center justify-center transition-colors"
        >✓</button>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(false) }}
          className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300
                     text-xs flex items-center justify-center transition-colors"
        >✕</button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setOpen(true) }}
      className="shrink-0 h-6 px-2 rounded border border-zinc-700 text-zinc-500
                 hover:border-orange-600 hover:text-orange-400 text-[10px] font-bold
                 transition-colors"
    >
      +N
    </button>
  )
}

// ─── Picker — ajout d'objet ───────────────────────────────────────────────────

function ItemPicker() {
  const { character, addInventoryItem } = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()
  const toast = useToastEmitter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<ItemCategory | 'Tous'>('Tous')

  const ownedIds = new Set((character.inventory ?? []).map((i) => i.itemId))

  const filtered = ITEMS_LIST
    .filter((def) => {
      if (filterCat !== 'Tous' && def.category !== filterCat) return false
      if (search) {
        const q = normalize(search)
        return (
          normalize(def.name).includes(q) ||
          def.labels.some((l) => normalize(l).includes(q))
        )
      }
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter un objet
      </button>
    )
  }

  return (
    <div className="bg-[#141414] border border-zinc-700 rounded-xl p-3 space-y-2">
      {/* Pills catégorie */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilterCat('Tous')}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
            filterCat === 'Tous'
              ? 'bg-orange-600 border-orange-600 text-black font-bold'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tous
        </button>
        {ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat === filterCat ? 'Tous' : cat)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              filterCat === cat
                ? 'bg-orange-600 border-orange-600 text-black font-bold'
                : `border-zinc-700 ${CATEGORY_COLOR[cat].split(' ')[0]} hover:border-zinc-500`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            autoFocus
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-zinc-600 rounded px-2 py-1 pr-7 text-xs
                       text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >✕</button>
          )}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1 text-zinc-500 hover:text-zinc-200 text-xs border
                     border-zinc-700 rounded transition-colors shrink-0"
        >
          Fermer
        </button>
      </div>

      {/* Liste — clic sur la ligne = +1, bouton +N pour quantité */}
      <div className="max-h-64 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 italic py-2 text-center">Aucun objet trouvé</p>
        ) : (
          filtered.map((def) => {
            const alreadyOwned = ownedIds.has(def.id) && !def.stackable
            return (
              <div
                key={def.id}
                onClick={() => { if (!alreadyOwned) { addInventoryItem(def.id); toast(`${def.name} ajouté à l'inventaire`) } }}
                className={`flex flex-col gap-0.5 py-1.5 px-2 rounded-lg transition-colors ${
                  alreadyOwned
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-800/60 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${VOLUME_BADGE[def.volume]}`}>
                    {VOLUME_LABEL[def.volume]}
                  </span>
                  <span className="flex-1 text-xs text-zinc-200 min-w-0 truncate">{def.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">{def.weight} kg</span>
                  {def.url && (
                    <a
                      href={def.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700
                                 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                      title="Ouvrir dans Notion"
                    >↗</a>
                  )}
                  <AddNButton defId={def.id} disabled={alreadyOwned} itemName={def.name} />
                </div>
                {/* Labels + effets */}
                {(def.labels.length > 0 || def.consumeEffect || def.effects?.armor || def.passiveEffect) && (
                  <div className="flex gap-1 flex-wrap ml-10">
                    {def.labels.map((l) => (
                      <span key={l} className="text-[9px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                        {l}
                      </span>
                    ))}
                    <EffectsBadges def={def} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── InventoryTab ─────────────────────────────────────────────────────────────

export function InventoryTab({ highlightId }: { highlightId?: string | null }) {
  const { character } = useCharacterStore()
  const { items: ITEMS_LIST } = useItemsStore()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<ItemCategory | 'Tous'>('Tous')

  const inventory = character.inventory ?? []

  const searchQ = search.trim() ? normalize(search.trim()) : ''

  // Catégories qui ont au moins un objet (indépendamment de la recherche)
  const catsWithItems = new Set(
    inventory.map((item) => ITEMS_LIST.find((d) => d.id === item.itemId)?.category).filter(Boolean)
  )

  // Grouper par catégorie en appliquant les filtres
  const grouped: Record<string, string[]> = {}
  for (const cat of ITEM_CATEGORIES) grouped[cat] = []

  for (const item of inventory) {
    const def = ITEMS_LIST.find((d) => d.id === item.itemId)
    if (!def) continue
    if (filterCat !== 'Tous' && def.category !== filterCat) continue
    if (searchQ) {
      const match =
        normalize(def.name).includes(searchQ) ||
        def.labels.some((l) => normalize(l).includes(searchQ)) ||
        normalize(item.notes ?? '').includes(searchQ)
      if (!match) continue
    }
    grouped[def.category].push(item.id)
  }

  // Trier chaque groupe par nom alphabétique
  for (const cat of ITEM_CATEGORIES) {
    grouped[cat].sort((a, b) => {
      const nameA = ITEMS_LIST.find((d) => d.id === inventory.find((i) => i.id === a)?.itemId)?.name ?? ''
      const nameB = ITEMS_LIST.find((d) => d.id === inventory.find((i) => i.id === b)?.itemId)?.name ?? ''
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' })
    })
  }

  // Catégories à afficher
  const categoriesToShow = ITEM_CATEGORIES.filter((cat) => {
    if (filterCat !== 'Tous') return cat === filterCat
    return true
  })
  const hasAnyResult = categoriesToShow.some((cat) => grouped[cat].length > 0)

  return (
    <div className="space-y-3">

      <ToastContainer />

      {/* Sync Notion */}
      <SyncButton />

      {/* Résumé */}
      <InventorySummary />

      {/* Équipement — toujours visible */}
      <EquipmentPanel />

      {/* Picker d'ajout */}
      <ItemPicker />

      {/* Barre recherche */}
      <div className="relative">
        <input
          placeholder="Rechercher dans l'inventaire…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg px-3 py-1.5 pr-8 text-xs
                     text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >✕</button>
        )}
      </div>

      {/* Filtre par catégorie */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilterCat('Tous')}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
            filterCat === 'Tous'
              ? 'bg-orange-600/20 border-orange-600/60 text-orange-300'
              : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tous
        </button>
        {ITEM_CATEGORIES.map((cat) => {
          const hasItems = catsWithItems.has(cat)
          const active   = filterCat === cat
          return (
            <button
              key={cat}
              onClick={() => hasItems && setFilterCat(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                !hasItems
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed line-through'
                  : active
                    ? 'bg-orange-600/20 border-orange-600/60 text-orange-300'
                    : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Liste groupée — catégories toujours présentes */}
      {searchQ && !hasAnyResult ? (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-zinc-600 text-xs italic">Aucun objet ne correspond à la recherche</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-4">
          {categoriesToShow.map((cat, idx) => {
            // When searching, skip categories with no results
            if (searchQ && grouped[cat].length === 0) return null

            const isClothing = CLOTHING_CATS.has(cat)
            const prevCat    = idx > 0 ? categoriesToShow[idx - 1] : null
            const isFirstClothing = isClothing && (prevCat === null || !CLOTHING_CATS.has(prevCat))

            return (
              <div key={cat}>
                {/* Titre parent "Vêtement" avant la première sous-catégorie */}
                {isFirstClothing && (
                  <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2
                                 border-b border-zinc-700/60 pb-1 text-zinc-400">
                    Vêtement
                  </h3>
                )}

                <div className={isClothing ? 'pl-3 mb-2' : ''}>
                  <h3 className={`font-bold mb-1.5 ${
                    isClothing
                      ? `text-[9px] uppercase tracking-wider ${CATEGORY_COLOR[cat]}`
                      : `text-[10px] uppercase tracking-widest border-b pb-1 mb-2 ${CATEGORY_COLOR[cat]}`
                  }`}>
                    {cat}
                    {grouped[cat].length > 0 && (
                      <span className="ml-1 normal-case font-normal text-zinc-600">({grouped[cat].length})</span>
                    )}
                  </h3>
                  {grouped[cat].length === 0 ? (
                    <p className="text-zinc-700 text-xs italic">—</p>
                  ) : (
                    <ul>
                      {grouped[cat].map((instanceId) => (
                        <InventoryRow key={instanceId} instanceId={instanceId} highlighted={highlightId === instanceId} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}

        </div>
      )}

    </div>
  )
}
