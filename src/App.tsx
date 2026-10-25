import { useState, useRef, useCallback, useEffect } from 'react'
import { useCharacterStore } from './store/characterStore'
import { HomeTab } from './components/tabs/HomeTab'
import { CharacteristicsTab } from './components/tabs/CharacteristicsTab'
import { SkillsTab } from './components/tabs/SkillsTab'
import { CombatTab } from './components/tabs/CombatTab'
import { InventoryTab } from './components/tabs/InventoryTab'
import { TechniquesTab } from './components/tabs/TechniquesTab'
import { MagicTab } from './components/tabs/MagicTab'
import { FavoritesBlock } from './components/tabs/FavoritesBlock'

type Tab = 'accueil' | 'personnage' | 'combat' | 'inventaire' | 'techniques' | 'magie'

const TABS: { id: Tab; label: string }[] = [
  { id: 'accueil',    label: 'Accueil' },
  { id: 'personnage', label: 'Perso' },
  { id: 'combat',     label: 'Combat' },
  { id: 'inventaire', label: 'Inventaire' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'magie',      label: 'Magie' },
]

// Onglets cachés tant que la manip secrète n'a pas été faite
const SECRET_TABS: Tab[] = ['magie']
const SECRET_KEY = 'fiche-perso:secret-unlocked'
const SECRET_TAPS = 5
const SECRET_WINDOW_MS = 2000

function readSecretUnlocked() {
  try { return localStorage.getItem(SECRET_KEY) === '1' } catch { return false }
}

function IdentityCard() {
  const { character, updateField } = useCharacterStore()
  const portraitInputRef = useRef<HTMLInputElement>(null)

  const [editingFirst, setEditingFirst] = useState(false)
  const [editingLast,  setEditingLast]  = useState(false)
  const [draftFirst,   setDraftFirst]   = useState(character.firstName)
  const [draftLast,    setDraftLast]    = useState(character.lastName)

  const handlePortraitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const result = evt.target?.result
      if (typeof result === 'string') updateField('portrait', result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [updateField])

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start gap-3">

        {/* Portrait cliquable */}
        <button
          onClick={() => portraitInputRef.current?.click()}
          className="w-14 h-14 rounded-lg bg-[#242424] border border-zinc-700
                     flex items-center justify-center shrink-0 overflow-hidden
                     hover:border-orange-600 transition-colors group relative"
          title="Changer la photo"
        >
          {character.portrait ? (
            <img
              src={character.portrait}
              alt="Portrait"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl text-zinc-600 group-hover:text-orange-500 transition-colors">☠</span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                          transition-opacity flex items-center justify-center text-[10px]
                          text-white font-semibold">
            {character.portrait ? '✎' : '+'}
          </div>
        </button>
        <input
          ref={portraitInputRef}
          type="file"
          accept="image/*"
          onChange={handlePortraitChange}
          className="hidden"
        />

        <div className="flex-1 min-w-0">
          {/* Prénom + Nom éditables */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {editingFirst ? (
              <input
                autoFocus
                value={draftFirst}
                onChange={(e) => setDraftFirst(e.target.value)}
                onBlur={() => { updateField('firstName', draftFirst.trim() || character.firstName); setEditingFirst(false) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { updateField('firstName', draftFirst.trim() || character.firstName); setEditingFirst(false) }
                  if (e.key === 'Escape') { setDraftFirst(character.firstName); setEditingFirst(false) }
                }}
                className="bg-[#0f0f0f] border border-orange-500 rounded px-1.5 py-0.5
                           text-base font-bold text-white focus:outline-none w-28"
              />
            ) : (
              <button
                onClick={() => { setDraftFirst(character.firstName); setEditingFirst(true) }}
                className="text-base font-bold text-white hover:text-orange-300 transition-colors"
                title="Modifier le prénom"
              >
                {character.firstName}
              </button>
            )}
            {editingLast ? (
              <input
                autoFocus
                value={draftLast}
                onChange={(e) => setDraftLast(e.target.value)}
                onBlur={() => { updateField('lastName', draftLast.trim() || character.lastName); setEditingLast(false) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { updateField('lastName', draftLast.trim() || character.lastName); setEditingLast(false) }
                  if (e.key === 'Escape') { setDraftLast(character.lastName); setEditingLast(false) }
                }}
                className="bg-[#0f0f0f] border border-orange-500 rounded px-1.5 py-0.5
                           text-base font-bold text-white focus:outline-none w-28"
              />
            ) : (
              <button
                onClick={() => { setDraftLast(character.lastName); setEditingLast(true) }}
                className="text-base font-bold text-white hover:text-orange-300 transition-colors"
                title="Modifier le nom"
              >
                {character.lastName}
              </button>
            )}
          </div>

          <textarea
            className="mt-1 w-full bg-transparent text-xs text-zinc-400 resize-none
                       focus:outline-none border-b border-transparent focus:border-zinc-600
                       transition-colors leading-relaxed"
            rows={2}
            placeholder="Note rapide…"
            value={character.quickNote}
            onChange={(e) => updateField('quickNote', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}


function ExportImportButtons() {
  const { character, setCharacter } = useCharacterStore()
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = JSON.stringify(character, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${character.firstName}-${character.lastName}-fiche.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        if (typeof data !== 'object' || !data.firstName) throw new Error('Format invalide')
        setCharacter(data)
        setImportError(null)
      } catch {
        setImportError('Fichier invalide')
        setTimeout(() => setImportError(null), 3000)
      }
    }
    reader.readAsText(file)
    // reset input pour pouvoir réimporter le même fichier
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      {importError && (
        <span className="text-[10px] text-red-400">{importError}</span>
      )}
      <button
        onClick={handleExport}
        className="text-[10px] px-2.5 py-1 rounded border border-zinc-700
                   text-zinc-400 hover:border-orange-600 hover:text-orange-400 transition-colors"
        title="Exporter la fiche en JSON"
      >
        ↓ Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-[10px] px-2.5 py-1 rounded border border-zinc-700
                   text-zinc-400 hover:border-orange-600 hover:text-orange-400 transition-colors"
        title="Importer une fiche JSON"
      >
        ↑ Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('accueil')
  const [statsLocked, setStatsLocked] = useState(false)
  const [highlightInventoryId, setHighlightInventoryId] = useState<string | null>(null)
  const [secretUnlocked, setSecretUnlocked] = useState(readSecretUnlocked)
  const secretTaps = useRef<number[]>([])

  // Manip secrète : taper 5 fois rapidement sur le titre "Fiche Perso" (bascule)
  function handleTitleTap() {
    const now = Date.now()
    secretTaps.current = [...secretTaps.current, now].filter(t => now - t < SECRET_WINDOW_MS)
    if (secretTaps.current.length < SECRET_TAPS) return
    secretTaps.current = []
    const next = !secretUnlocked
    setSecretUnlocked(next)
    try { localStorage.setItem(SECRET_KEY, next ? '1' : '0') } catch { /* ignore */ }
    if (!next && SECRET_TABS.includes(activeTab)) setActiveTab('accueil')
  }

  const visibleTabs = TABS.filter(t => secretUnlocked || !SECRET_TABS.includes(t.id))

  useEffect(() => {
    function onNavigate(e: Event) {
      const { tab, itemId } = (e as CustomEvent).detail
      setActiveTab(tab)
      if (itemId) {
        setHighlightInventoryId(itemId)
        setTimeout(() => setHighlightInventoryId(null), 2000)
      }
    }
    window.addEventListener('app:navigate', onNavigate)
    return () => window.removeEventListener('app:navigate', onNavigate)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-b border-zinc-800">
        <div className="px-4 py-2 flex items-center justify-between">
          <span
            onClick={handleTitleTap}
            className="text-orange-500 font-bold tracking-widest uppercase text-xs select-none cursor-default"
          >
            Fiche Perso
          </span>
          <ExportImportButtons />
        </div>
      </header>

      <main className="px-4 pt-5">
        <div className="space-y-3 pb-10">

          {/* Identité — toujours visible */}
          <IdentityCard />

          {/* Onglets — entre identité et contenu */}
          <nav className="flex gap-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl p-1.5">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
                            transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-black'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Contenu de l'onglet actif */}
          {activeTab === 'accueil'    && <HomeTab />}
          {activeTab === 'personnage' && (
            <div className="space-y-3">
              <FavoritesBlock />
              <div className="flex justify-end">
                <button
                  onClick={() => setStatsLocked(v => !v)}
                  title={statsLocked ? 'Déverrouiller les stats' : 'Verrouiller les stats'}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                    statsLocked
                      ? 'border-orange-700 bg-orange-950/30 text-orange-400 hover:bg-orange-900/40'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {statsLocked ? '🔒 Verrouillé' : '🔓 Modifier'}
                </button>
              </div>
              <CharacteristicsTab locked={statsLocked} />
              <SkillsTab locked={statsLocked} />
            </div>
          )}
          {activeTab === 'combat'     && <CombatTab />}
          {activeTab === 'inventaire' && <InventoryTab highlightId={highlightInventoryId} />}
          {activeTab === 'techniques' && <TechniquesTab />}
          {activeTab === 'magie'      && secretUnlocked && <MagicTab />}

        </div>
      </main>
    </div>
  )
}
