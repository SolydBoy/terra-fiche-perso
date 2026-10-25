import { useState, useContext, createContext, useRef } from 'react'
import ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCharacterStore } from '../../store/characterStore'
import type { JournalEntry, QuestEntry, ContactEntry, ContactRelation, LocationEntry, LocationType, FactionEntry, NoteSection } from '../../engine/types'
import { ITEMS_LIST } from '../../engine/items'

// ── Shared utilities ──────────────────────────────────────────────────────────

function copyStyleProp<K extends keyof CSSStyleDeclaration>(
  target: CSSStyleDeclaration,
  source: CSSStyleDeclaration,
  prop: K,
): void {
  target[prop] = source[prop]
}

function groupByCategory<T extends { category?: string }>(
  items: T[],
  savedOrder?: string[]
): Array<{ category: string; items: T[] }> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.category?.trim() || ''
    const arr = map.get(key) ?? []
    arr.push(item)
    map.set(key, arr)
  }
  const named: Array<{ category: string; items: T[] }> = []
  for (const [cat, its] of map) {
    if (cat) named.push({ category: cat, items: its })
  }
  if (savedOrder && savedOrder.length > 0) {
    named.sort((a, b) => {
      const ai = savedOrder.indexOf(a.category)
      const bi = savedOrder.indexOf(b.category)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.category.localeCompare(b.category)
    })
  } else {
    named.sort((a, b) => a.category.localeCompare(b.category))
  }
  const uncategorized = map.get('') ?? []
  if (uncategorized.length > 0) named.push({ category: '', items: uncategorized })
  return named
}

function useCategoryDrag(
  liveOrder: string[],
  onReorder: (newOrder: string[]) => void
) {
  const draggedRef = useRef<string | null>(null)
  const [dragOverCat, setDragOverCat] = useState<string | null>(null)

  function handleDragStart(cat: string) {
    draggedRef.current = cat
  }

  function handleDragOver(e: React.DragEvent, cat: string) {
    e.preventDefault()
    if (cat !== draggedRef.current) setDragOverCat(cat)
  }

  function handleDrop(targetCat: string) {
    const from = draggedRef.current
    if (!from || from === targetCat) { draggedRef.current = null; setDragOverCat(null); return }
    const order = [...liveOrder]
    const fromIdx = order.indexOf(from)
    const toIdx   = order.indexOf(targetCat)
    if (fromIdx !== -1) order.splice(fromIdx, 1)
    order.splice(toIdx !== -1 ? toIdx : order.length, 0, from)
    draggedRef.current = null
    setDragOverCat(null)
    onReorder(order)
  }

  function handleDragEnd() {
    draggedRef.current = null
    setDragOverCat(null)
  }

  return { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverCat }
}

function CategoryBadge({
  value,
  onCommit,
  suggestions: propSuggestions,
}: {
  value: string
  onCommit: (v: string) => void
  suggestions?: string[]
}) {
  const ctxSuggestions = useContext(CategorySuggestionsCtx)
  const suggestions = propSuggestions ?? ctxSuggestions
  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(value)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [dropPos, setDropPos]     = useState<{ top: number; left: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = draft.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(draft.toLowerCase()) && s !== draft)
    : suggestions.filter(s => s !== value)
  const showDropdown = editing && matches.length > 0 && dropPos !== null

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setDraft(value)
    setActiveIdx(-1)
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      const rect = inputRef.current?.getBoundingClientRect()
      if (rect) setDropPos({ top: rect.bottom + 2, left: rect.left })
    }, 0)
  }

  function pick(s: string) {
    setEditing(false)
    setDropPos(null)
    onCommit(s)
  }

  function commit() {
    setEditing(false)
    setDropPos(null)
    onCommit(draft.trim())
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && matches[activeIdx]) pick(matches[activeIdx])
      else commit()
    } else if (e.key === 'Escape') {
      setEditing(false)
      setDropPos(null)
      setDraft(value)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
    setActiveIdx(-1)
    const rect = inputRef.current?.getBoundingClientRect()
    if (rect) setDropPos({ top: rect.bottom + 2, left: rect.left })
  }

  if (editing) {
    return (
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={draft}
          onChange={handleChange}
          onBlur={() => setTimeout(commit, 120)}
          onKeyDown={handleKey}
          placeholder="catégorie…"
          className="bg-zinc-700 text-[9px] text-zinc-200 rounded px-1.5 py-0.5 w-24
                     focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        {showDropdown && ReactDOM.createPortal(
          <ul
            style={{ top: dropPos!.top, left: dropPos!.left }}
            className="fixed z-[9999] bg-[#1c1c1c] border border-zinc-700
                       rounded-lg shadow-xl min-w-[120px] overflow-hidden"
          >
            {matches.map((s, i) => (
              <li key={s}>
                <button
                  onMouseDown={e => { e.preventDefault(); pick(s) }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-2.5 py-1.5 text-[10px] transition-colors ${
                    i === activeIdx
                      ? 'bg-orange-900/50 text-orange-300'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
    )
  }

  if (value) {
    return (
      <button
        onClick={startEdit}
        title="Modifier la catégorie"
        className="text-[9px] bg-orange-900/30 text-orange-400 border border-orange-700/40
                   rounded px-1.5 py-0.5 shrink-0 hover:bg-orange-900/50 transition-colors
                   max-w-[80px] truncate"
      >
        {value}
      </button>
    )
  }

  return (
    <button
      onClick={startEdit}
      title="Ajouter une catégorie"
      className="text-[10px] text-zinc-700 hover:text-zinc-400 shrink-0 transition-colors leading-none"
    >
      ⊕
    </button>
  )
}

const CategorySuggestionsCtx = createContext<string[]>([])

// ── Lookup helper ─────────────────────────────────────────────────────────────

function findRefPreview(character: import('../../engine/types').Character, name: string): string | null {
  const lower = name.toLowerCase()
  const j = (character.journal   ?? []).find(e => e.title.toLowerCase() === lower)
  if (j) return j.content || null
  const q = (character.quetes    ?? []).find(e => e.title.toLowerCase() === lower)
  if (q) return q.notes   || null
  const c = (character.contacts  ?? []).find(e => e.name.toLowerCase()  === lower)
  if (c) return c.notes   || null
  const l = (character.lieux     ?? []).find(e => e.name.toLowerCase()  === lower)
  if (l) return l.notes   || null
  const f = (character.factions  ?? []).find(e => e.name.toLowerCase()  === lower)
  if (f) return f.notes   || null
  return null
}

// ── Context panel ─────────────────────────────────────────────────────────────

interface NotesPanelCtx {
  navigateToRef: (name: string) => void
  highlightId: string | null
}

const NotesPanelContext = createContext<NotesPanelCtx | null>(null)

// ── Lien de référence avec bulle de survol ────────────────────────────────────

function RefLink({ name, ctx }: { name: string; ctx: NotesPanelCtx }) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const { character } = useCharacterStore()
  const preview = mousePos ? findRefPreview(character, name) : null
  const snippet = preview ? preview.replace(/[#*_`[\]]/g, '').slice(0, 140).trimEnd() : null

  return (
    <>
      <button
        onClick={() => ctx.navigateToRef(name)}
        onMouseEnter={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e)  => setMousePos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setMousePos(null)}
        className="text-orange-400 hover:text-orange-300 underline cursor-pointer font-medium"
      >
        {name}
      </button>
      {mousePos && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] w-56 bg-[#1c1c1c] border border-zinc-700 rounded-lg p-2.5 shadow-xl pointer-events-none"
          style={{ left: mousePos.x + 12, top: mousePos.y - 8, transform: 'translateY(-100%)' }}
        >
          <p className="text-[10px] font-semibold text-orange-400 mb-1">{name}</p>
          {snippet ? (
            <p className="text-[10px] text-zinc-400 leading-relaxed">{snippet}{preview!.length > 140 ? '…' : ''}</p>
          ) : (
            <p className="text-[10px] text-zinc-600 italic">Aucune note</p>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Éditeur markdown réutilisable ─────────────────────────────────────────────

function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}) {
  const [preview, setPreview] = useState(false)
  const [acOpen, setAcOpen]   = useState(false)
  const [acSearch, setAcSearch] = useState('')
  const [acStart, setAcStart]   = useState(0)
  const [acIndex, setAcIndex]   = useState(0)
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historyRef  = useRef<Array<{ value: string; start: number; end: number }>>([])

  function pushHistory(start: number, end: number) {
    historyRef.current.push({ value, start, end })
    if (historyRef.current.length > 100) historyRef.current.shift()
  }
  const ctx = useContext(NotesPanelContext)
  const { character } = useCharacterStore()

  const allEntries = [
    ...(character.journal  ?? []).filter(e => e.title.trim()).map(e => ({ id: e.id, name: e.title, icon: '📖' })),
    ...(character.quetes   ?? []).filter(e => e.title.trim()).map(e => ({ id: e.id, name: e.title, icon: '⚔'  })),
    ...(character.contacts ?? []).filter(e => e.name.trim()) .map(e => ({ id: e.id, name: e.name,  icon: '👤' })),
    ...(character.lieux    ?? []).filter(e => e.name.trim()) .map(e => ({ id: e.id, name: e.name,  icon: '📍' })),
    ...(character.factions ?? []).filter(e => e.name.trim()) .map(e => ({ id: e.id, name: e.name,  icon: '⚑'  })),
    ...(character.inventory ?? []).flatMap(item => {
      const def = ITEMS_LIST.find(d => d.id === item.itemId)
      if (!def) return []
      return [{ id: item.id, name: def.name, icon: '🎒' }]
    }),
  ]

  const acFiltered = acSearch
    ? allEntries.filter(e => e.name.toLowerCase().includes(acSearch.toLowerCase()))
    : allEntries

  function computeDropdownPos(ta: HTMLTextAreaElement, cursorPos: number) {
    const mirror = document.createElement('div')
    const cs = window.getComputedStyle(ta)
    ;([
      'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'paddingTop','paddingRight','paddingBottom','paddingLeft',
      'fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing',
      'whiteSpace','wordBreak','overflowWrap','width','boxSizing',
    ] as const).forEach(p => copyStyleProp(mirror.style, cs, p))
    mirror.style.position  = 'absolute'
    mirror.style.top       = '-9999px'
    mirror.style.left      = '-9999px'
    mirror.style.height    = 'auto'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordBreak  = 'break-word'
    mirror.textContent = ta.value.slice(0, cursorPos)
    const caret = document.createElement('span')
    caret.textContent = '\u200b'
    mirror.appendChild(caret)
    document.body.appendChild(mirror)
    const relTop  = caret.offsetTop  - ta.scrollTop
    const relLeft = caret.offsetLeft
    document.body.removeChild(mirror)
    const rect = ta.getBoundingClientRect()
    const lh   = parseFloat(cs.lineHeight)    || parseFloat(cs.fontSize) * 1.5
    const pt   = parseFloat(cs.paddingTop)    || 0
    const pl   = parseFloat(cs.paddingLeft)   || 0
    const bt   = parseFloat(cs.borderTopWidth) || 0
    const bl   = parseFloat(cs.borderLeftWidth) || 0
    setDropdownPos({ x: rect.left + bl + pl + relLeft, y: rect.top + bt + pt + relTop + lh })
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newVal = e.target.value
    onChange(newVal)
    const cursor = e.target.selectionStart
    const before = newVal.slice(0, cursor)
    const triggerIdx = before.lastIndexOf('[[')
    if (triggerIdx !== -1) {
      const between = before.slice(triggerIdx + 2)
      if (!between.includes(']]') && !between.includes('\n')) {
        setAcStart(triggerIdx)
        setAcSearch(between)
        setAcOpen(true)
        setAcIndex(0)
        computeDropdownPos(e.target, cursor)
        return
      }
    }
    setAcOpen(false)
  }

  function selectEntry(name: string) {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart
    const newVal = value.slice(0, acStart) + `[[${name}]]` + value.slice(cursor)
    onChange(newVal)
    setAcOpen(false)
    const newCursor = acStart + name.length + 4
    setTimeout(() => { ta.focus(); ta.setSelectionRange(newCursor, newCursor) }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const entry = historyRef.current.pop()
      if (entry) {
        e.preventDefault()
        onChange(entry.value)
        setTimeout(() => {
          const ta = textareaRef.current
          if (ta) ta.setSelectionRange(entry.start, entry.end)
        }, 0)
        return
      }
    }
    if (!acOpen) return
    if (e.key === 'Escape')    { e.preventDefault(); setAcOpen(false) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => Math.min(i + 1, acFiltered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setAcIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && acFiltered[acIndex]) { e.preventDefault(); selectEntry(acFiltered[acIndex].name) }
  }

  const processedContent = ctx
    ? value.replace(/\[\[([^\]]+)\]\]/g, (_, n) => `\`@ref:${n}\``)
    : value

  function applyFormat(syntax: 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'strike' | 'ul' | 'ol' | 'quote' | 'code' | 'hr') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = value.slice(start, end)

    pushHistory(start, end)

    let newVal   = value
    let newStart = start
    let newEnd   = end

    if (syntax === 'h1' || syntax === 'h2' || syntax === 'h3') {
      const prefix    = syntax === 'h1' ? '# ' : syntax === 'h2' ? '## ' : '### '
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newVal   = value.slice(0, lineStart) + prefix + value.slice(lineStart)
      newStart = start + prefix.length
      newEnd   = end   + prefix.length
    } else if (syntax === 'bold') {
      const inner = sel || 'texte'
      newVal   = value.slice(0, start) + `**${inner}**` + value.slice(end)
      newStart = start + 2
      newEnd   = start + 2 + inner.length
    } else if (syntax === 'italic') {
      const inner = sel || 'texte'
      newVal   = value.slice(0, start) + `*${inner}*` + value.slice(end)
      newStart = start + 1
      newEnd   = start + 1 + inner.length
    } else if (syntax === 'strike') {
      const inner = sel || 'texte'
      newVal   = value.slice(0, start) + `~~${inner}~~` + value.slice(end)
      newStart = start + 2
      newEnd   = start + 2 + inner.length
    } else if (syntax === 'code') {
      const inner = sel || 'code'
      newVal   = value.slice(0, start) + `\`${inner}\`` + value.slice(end)
      newStart = start + 1
      newEnd   = start + 1 + inner.length
    } else if (syntax === 'ul') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newVal   = value.slice(0, lineStart) + '- ' + value.slice(lineStart)
      newStart = start + 2
      newEnd   = end   + 2
    } else if (syntax === 'ol') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newVal   = value.slice(0, lineStart) + '1. ' + value.slice(lineStart)
      newStart = start + 3
      newEnd   = end   + 3
    } else if (syntax === 'quote') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newVal   = value.slice(0, lineStart) + '> ' + value.slice(lineStart)
      newStart = start + 2
      newEnd   = end   + 2
    } else if (syntax === 'hr') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newVal   = value.slice(0, lineStart) + '\n---\n' + value.slice(lineStart)
      newStart = lineStart + 5
      newEnd   = lineStart + 5
    }

    onChange(newVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  const fmtBtn = (label: string, s: Parameters<typeof applyFormat>[0], title: string) => (
    <button
      key={s}
      onMouseDown={(e) => { e.preventDefault(); applyFormat(s) }}
      title={title}
      className="px-1.5 py-0.5 text-zinc-500 hover:text-orange-400 hover:bg-zinc-800 rounded text-[10px] font-mono leading-none transition-colors"
    >
      {label}
    </button>
  )

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-0.5 flex-wrap">
          {fmtBtn('H1', 'h1', 'Titre 1')}
          {fmtBtn('H2', 'h2', 'Titre 2')}
          {fmtBtn('H3', 'h3', 'Titre 3')}
          <span className="w-px h-3 bg-zinc-700 mx-0.5" />
          {fmtBtn('B', 'bold', 'Gras')}
          {fmtBtn('I', 'italic', 'Italique')}
          {fmtBtn('S̶', 'strike', 'Barré')}
          <span className="w-px h-3 bg-zinc-700 mx-0.5" />
          {fmtBtn('—', 'ul', 'Liste à puces')}
          {fmtBtn('1.', 'ol', 'Liste numérotée')}
          {fmtBtn('❝', 'quote', 'Citation')}
          {fmtBtn('`', 'code', 'Code')}
          {fmtBtn('─', 'hr', 'Séparateur')}
        </div>
        <button
          onClick={() => setPreview(v => !v)}
          className="text-[10px] text-zinc-600 hover:text-orange-400 transition-colors
                     px-1.5 py-0.5 rounded border border-zinc-700 hover:border-orange-600 shrink-0"
        >
          {preview ? '✏ éditer' : '👁 aperçu'}
        </button>
      </div>

      {preview ? (
        <div className="prose prose-invert prose-xs max-w-none text-xs text-zinc-300 leading-relaxed min-h-[3rem]
                        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-zinc-100 [&_h1]:mb-2
                        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-200 [&_h2]:mb-1.5
                        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-300 [&_h3]:mb-1
                        [&_strong]:text-zinc-100 [&_em]:text-zinc-400
                        [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5
                        [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-0.5
                        [&_li]:text-zinc-300
                        [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-2 [&_blockquote]:text-zinc-500 [&_blockquote]:italic
                        [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-orange-300 [&_code]:text-[11px]
                        [&_hr]:border-zinc-700">
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ children }) => {
                  const text = String(children)
                  if (text.startsWith('@ref:') && ctx) {
                    return <RefLink name={text.slice(5)} ctx={ctx} />
                  }
                  return <code className="bg-zinc-800 px-1 rounded text-orange-300 text-[11px]">{children}</code>
                },
              }}
            >
              {processedContent}
            </ReactMarkdown>
          ) : (
            <span className="text-zinc-600 italic">{placeholder}</span>
          )}
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setAcOpen(false), 150)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-600
                       resize-none focus:outline-none leading-relaxed font-mono"
          />
          {acOpen && acFiltered.length > 0 && dropdownPos && ReactDOM.createPortal(
            <div
              className="fixed z-[9999] w-64 bg-[#1c1c1c] border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
              style={{ left: dropdownPos.x, top: dropdownPos.y }}
            >
              <div className="max-h-44 overflow-y-auto">
                {acFiltered.map((e, i) => (
                  <button
                    key={e.id}
                    onMouseDown={(ev) => { ev.preventDefault(); selectEntry(e.name) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                      i === acIndex ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xs shrink-0">{e.icon}</span>
                    <span className="text-[11px] text-zinc-300 truncate">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  )
}

type NoteTab = 'notes' | 'journal' | 'quetes' | 'contacts' | 'lieux' | 'factions'

const TABS: { id: NoteTab; label: string }[] = [
  { id: 'notes',    label: 'Notes'    },
  { id: 'journal',  label: 'Journal'  },
  { id: 'quetes',   label: 'Quêtes'   },
  { id: 'contacts', label: 'Contacts' },
  { id: 'lieux',    label: 'Lieux'    },
  { id: 'factions', label: 'Factions' },
]

// ── Notes libres ──────────────────────────────────────────────────────────────

function NoteSectionCard({ section }: { section: NoteSection }) {
  const { updateNoteSection, removeNoteSection } = useCharacterStore()
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414]">
        <CategoryBadge
          value={section.category}
          onCommit={v => updateNoteSection(section.id, v, section.content)}
        />
        <div className="flex-1" />
        <button
          onClick={() => removeNoteSection(section.id)}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      <div className="px-3 py-2 border-t border-zinc-800">
        <MarkdownEditor
          value={section.content}
          onChange={v => updateNoteSection(section.id, section.category, v)}
          placeholder="Contenu de la section…"
          rows={5}
        />
      </div>
    </div>
  )
}

function NotesTab() {
  const { character, updateField, addNoteSection } = useCharacterStore()
  const sections = character.notesSections ?? []
  const categorySuggestions = [...new Set(sections.map(s => s.category).filter(Boolean))]

  if (sections.length === 0) {
    return (
      <div className="space-y-3">
        <MarkdownEditor
          value={character.notes ?? ''}
          onChange={v => updateField('notes', v)}
          placeholder="Notes libres — événements, observations, idées…"
          rows={8}
        />
        <button
          onClick={addNoteSection}
          className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                     border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
        >
          + Ajouter une section catégorisée
        </button>
      </div>
    )
  }

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-2">
      {sections.map(s => <NoteSectionCard key={s.id} section={s} />)}
      <button
        onClick={addNoteSection}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter une section
      </button>
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Journal ───────────────────────────────────────────────────────────────────

function JournalCard({
  entry,
  open,
  highlighted,
  onToggle,
  onRemove,
}: {
  entry: JournalEntry
  open: boolean
  highlighted: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  const { updateJournalEntry, updateJournalCategory } = useCharacterStore()
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors duration-500
                     ${highlighted ? 'border-orange-500 bg-orange-950/20' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#141414]">
        <button
          onClick={onToggle}
          className="text-zinc-600 hover:text-zinc-400 text-[10px] transition-colors shrink-0 w-3"
        >
          {open ? '▼' : '▶'}
        </button>
        <input
          value={entry.title}
          onChange={e => updateJournalEntry(entry.id, e.target.value, entry.content)}
          placeholder="Titre de session…"
          className="flex-1 bg-transparent text-xs font-semibold text-zinc-200
                     placeholder-zinc-600 focus:outline-none"
        />
        <CategoryBadge
          value={entry.category ?? ''}
          onCommit={v => updateJournalCategory(entry.id, v)}
        />
        <button
          onClick={onRemove}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      {open && (
        <div className="px-3 py-2 border-t border-zinc-800">
          <MarkdownEditor
            value={entry.content}
            onChange={v => updateJournalEntry(entry.id, entry.title, v)}
            placeholder="Récit de la session…"
            rows={6}
          />
        </div>
      )}
    </div>
  )
}

function JournalTab({ highlightId }: { highlightId: string | null }) {
  const { character, addJournalEntry, removeJournalEntry, reorderCategories } = useCharacterStore()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const entries = character.journal ?? []

  // Auto-open highlighted entry
  if (highlightId && !openIds.has(highlightId)) {
    setOpenIds(prev => new Set(prev).add(highlightId))
  }

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAdd() {
    const id = addJournalEntry()
    setOpenIds(prev => new Set(prev).add(id))
  }

  const groups = groupByCategory(entries, character.categoryOrder?.journal)
  const categorySuggestions = [...new Set(entries.map(e => e.category ?? '').filter(Boolean))]
  const liveOrder = groups.map(g => g.category).filter(Boolean)
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverCat } =
    useCategoryDrag(liveOrder, order => reorderCategories('journal', order))

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-3">
      <button
        onClick={handleAdd}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Nouvelle entrée
      </button>
      {entries.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-4">Aucune entrée de journal</p>
      )}
      {groups.map(group => (
        <div key={group.category || '__none__'}>
          {group.category && (
            <div
              draggable
              onDragStart={() => handleDragStart(group.category)}
              onDragOver={e => handleDragOver(e, group.category)}
              onDrop={() => handleDrop(group.category)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 mb-1.5 px-1 cursor-grab active:cursor-grabbing select-none
                          ${dragOverCat === group.category ? 'opacity-40' : ''}`}
            >
              <span className="text-zinc-600 text-[8px]">⠿</span>
              <p className="text-[9px] uppercase tracking-widest text-orange-500/70 font-bold">
                {group.category}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            {group.items.map(e => (
              <JournalCard
                key={e.id}
                entry={e}
                open={openIds.has(e.id)}
                highlighted={highlightId === e.id}
                onToggle={() => toggle(e.id)}
                onRemove={() => removeJournalEntry(e.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Quêtes ────────────────────────────────────────────────────────────────────

function QuestRow({ quest, highlighted }: { quest: QuestEntry; highlighted: boolean }) {
  const { toggleQuestDone, toggleQuestPin, updateQuestTitle, updateQuestNotes, updateQuestCategory, removeQuest } = useCharacterStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <li className={`border rounded-lg overflow-hidden transition-colors duration-500
                    ${highlighted ? 'border-orange-500 bg-orange-950/20' : quest.pinned ? 'border-yellow-600/60 bg-yellow-950/10' : 'border-zinc-800'}
                    ${quest.done ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => toggleQuestDone(quest.id)}
          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
            quest.done ? 'border-emerald-600 bg-emerald-700' : 'border-zinc-600 hover:border-zinc-400'
          }`}
        >
          {quest.done && <span className="text-black text-[9px] font-bold leading-none">✓</span>}
        </button>
        <button
          onClick={() => toggleQuestPin(quest.id)}
          title={quest.pinned ? 'Désépingler' : 'Épingler'}
          className={`text-[11px] shrink-0 transition-colors ${
            quest.pinned ? 'text-yellow-400 hover:text-yellow-300' : 'text-zinc-700 hover:text-zinc-500'
          }`}
        >📌</button>
        <input
          value={quest.title}
          onChange={e => updateQuestTitle(quest.id, e.target.value)}
          placeholder="Titre de la quête…"
          className={`flex-1 bg-transparent text-xs focus:outline-none ${
            quest.done ? 'line-through text-zinc-500' : 'text-zinc-200'
          }`}
        />
        <CategoryBadge
          value={quest.category ?? ''}
          onCommit={v => updateQuestCategory(quest.id, v)}
        />
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-[10px] transition-colors shrink-0 ${
            quest.notes ? 'text-orange-500 hover:text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <button
          onClick={() => removeQuest(quest.id)}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      {expanded && (
        <div className="px-3 py-2 bg-[#111] border-t border-zinc-800">
          <MarkdownEditor
            value={quest.notes}
            onChange={v => updateQuestNotes(quest.id, v)}
            placeholder="Notes sur cette quête…"
            rows={3}
          />
        </div>
      )}
    </li>
  )
}

function QuestesTab({ highlightId }: { highlightId: string | null }) {
  const { character, addQuest, reorderCategories } = useCharacterStore()
  const quetes    = character.quetes ?? []
  const pinned    = quetes.filter(q => q.pinned && !q.done)
  const active    = quetes.filter(q => !q.done && !q.pinned)
  const completed = quetes.filter(q => q.done)
  const groups    = groupByCategory(active, character.categoryOrder?.quetes)
  const categorySuggestions = [...new Set(quetes.map(q => q.category ?? '').filter(Boolean))]
  const liveOrder = groups.map(g => g.category).filter(Boolean)
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverCat } =
    useCategoryDrag(liveOrder, order => reorderCategories('quetes', order))

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-3">
      <button
        onClick={() => addQuest('')}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter une quête
      </button>

      {/* Épinglées */}
      {pinned.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-yellow-500/80 font-bold mb-1.5 px-1">
            📌 Quête(s) en cours
          </p>
          <ul className="space-y-1.5">
            {pinned.map(q => <QuestRow key={q.id} quest={q} highlighted={highlightId === q.id} />)}
          </ul>
        </div>
      )}

      {/* Actives groupées par catégorie */}
      {groups.map(group => (
        <div key={group.category || '__none__'}>
          {group.category && (
            <div
              draggable
              onDragStart={() => handleDragStart(group.category)}
              onDragOver={e => handleDragOver(e, group.category)}
              onDrop={() => handleDrop(group.category)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 mb-1.5 px-1 cursor-grab active:cursor-grabbing select-none
                          ${dragOverCat === group.category ? 'opacity-40' : ''}`}
            >
              <span className="text-zinc-600 text-[8px]">⠿</span>
              <p className="text-[9px] uppercase tracking-widest text-orange-500/70 font-bold">
                {group.category}
              </p>
            </div>
          )}
          <ul className="space-y-1.5">
            {group.items.map(q => <QuestRow key={q.id} quest={q} highlighted={highlightId === q.id} />)}
          </ul>
        </div>
      ))}

      {completed.length > 0 && (
        <div className="pt-1 space-y-1.5">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
            Terminées ({completed.length})
          </p>
          <ul className="space-y-1.5">
            {completed.map(q => <QuestRow key={q.id} quest={q} highlighted={highlightId === q.id} />)}
          </ul>
        </div>
      )}
      {quetes.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-4">Aucune quête enregistrée</p>
      )}
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Contacts ──────────────────────────────────────────────────────────────────

const RELATION_CFG: Record<ContactRelation, { label: string; color: string; border: string }> = {
  allié:   { label: 'Allié',   color: 'text-emerald-400', border: 'border-emerald-700' },
  neutre:  { label: 'Neutre',  color: 'text-zinc-400',    border: 'border-zinc-600'    },
  ennemi:  { label: 'Ennemi',  color: 'text-red-400',     border: 'border-red-800'     },
  inconnu: { label: 'Inconnu', color: 'text-zinc-500',    border: 'border-zinc-700'    },
}

const RELATIONS: ContactRelation[] = ['allié', 'neutre', 'ennemi', 'inconnu']

function ContactRow({ contact, highlighted }: { contact: ContactEntry; highlighted: boolean }) {
  const { updateContact, updateContactCategory, removeContact } = useCharacterStore()
  const [expanded, setExpanded] = useState(false)
  const cfg = RELATION_CFG[contact.relation]

  return (
    <li className={`border rounded-lg overflow-hidden transition-colors duration-500
                    ${highlighted ? 'border-orange-500 bg-orange-950/20' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <select
          value={contact.relation}
          onChange={e => updateContact(contact.id, contact.name, e.target.value as ContactRelation, contact.notes)}
          className={`text-[10px] border rounded px-1.5 py-0.5 bg-transparent
                      focus:outline-none shrink-0 ${cfg.color} ${cfg.border}`}
        >
          {RELATIONS.map(r => (
            <option key={r} value={r} className="bg-[#1a1a1a] text-zinc-200">
              {RELATION_CFG[r].label}
            </option>
          ))}
        </select>
        <input
          value={contact.name}
          onChange={e => updateContact(contact.id, e.target.value, contact.relation, contact.notes)}
          placeholder="Nom…"
          className="flex-1 bg-transparent text-xs font-semibold text-zinc-200
                     placeholder-zinc-600 focus:outline-none"
        />
        <CategoryBadge
          value={contact.category ?? ''}
          onCommit={v => updateContactCategory(contact.id, v)}
        />
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-[10px] transition-colors shrink-0 ${
            contact.notes ? 'text-orange-500 hover:text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <button
          onClick={() => removeContact(contact.id)}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      {expanded && (
        <div className="px-3 py-2 bg-[#111] border-t border-zinc-800">
          <MarkdownEditor
            value={contact.notes}
            onChange={v => updateContact(contact.id, contact.name, contact.relation, v)}
            placeholder="Notes sur ce contact…"
            rows={3}
          />
        </div>
      )}
    </li>
  )
}

function ContactsTab({ highlightId }: { highlightId: string | null }) {
  const { character, addContact } = useCharacterStore()
  const contacts = character.contacts ?? []

  const groups = RELATIONS.map(r => ({
    relation: r,
    items: contacts.filter(c => c.relation === r),
  })).filter(g => g.items.length > 0)
  const categorySuggestions = [...new Set(contacts.map(c => c.category ?? '').filter(Boolean))]

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-3">
      <button
        onClick={addContact}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter un contact
      </button>
      {contacts.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-4">Aucun contact enregistré</p>
      )}
      {groups.map(group => (
        <div key={group.relation}>
          <p className={`text-[9px] uppercase tracking-widest font-bold mb-1.5 ${RELATION_CFG[group.relation].color}`}>
            {RELATION_CFG[group.relation].label}
          </p>
          <ul className="space-y-1.5">
            {group.items.map(c => <ContactRow key={c.id} contact={c} highlighted={highlightId === c.id} />)}
          </ul>
        </div>
      ))}
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Lieux ─────────────────────────────────────────────────────────────────────

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'lieu',      label: 'Lieu'      },
  { value: 'bâtiment',  label: 'Bâtiment'  },
  { value: 'ville',     label: 'Ville'     },
  { value: 'région',    label: 'Région'    },
  { value: 'pays',      label: 'Pays'      },
  { value: 'autre',     label: 'Autre'     },
]

function LieuRow({ lieu, highlighted }: { lieu: LocationEntry; highlighted: boolean }) {
  const { updateLieu, updateLieuCategory, removeLieu } = useCharacterStore()
  const [expanded, setExpanded] = useState(false)
  const locType = lieu.type ?? 'lieu'

  return (
    <li className={`border rounded-lg overflow-hidden transition-colors duration-500
                    ${highlighted ? 'border-orange-500 bg-orange-950/20' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-zinc-600 text-xs shrink-0">📍</span>
        <input
          value={lieu.name}
          onChange={e => updateLieu(lieu.id, e.target.value, locType, lieu.notes)}
          placeholder="Nom du lieu…"
          className="flex-1 bg-transparent text-xs font-semibold text-zinc-200
                     placeholder-zinc-600 focus:outline-none"
        />
        <select
          value={locType}
          onChange={e => updateLieu(lieu.id, lieu.name, e.target.value as LocationType, lieu.notes)}
          className="bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 rounded px-1 py-0.5
                     focus:outline-none focus:border-orange-600 shrink-0"
        >
          {LOCATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <CategoryBadge
          value={lieu.category ?? ''}
          onCommit={v => updateLieuCategory(lieu.id, v)}
        />
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-[10px] transition-colors shrink-0 ${
            lieu.notes ? 'text-orange-500 hover:text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <button
          onClick={() => removeLieu(lieu.id)}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      {expanded && (
        <div className="px-3 py-2 bg-[#111] border-t border-zinc-800">
          <MarkdownEditor
            value={lieu.notes}
            onChange={v => updateLieu(lieu.id, lieu.name, locType, v)}
            placeholder="Description, notes sur ce lieu…"
            rows={3}
          />
        </div>
      )}
    </li>
  )
}

function LieuxTab({ highlightId }: { highlightId: string | null }) {
  const { character, addLieu, reorderCategories } = useCharacterStore()
  const lieux = character.lieux ?? []
  const groups = groupByCategory(lieux, character.categoryOrder?.lieux)
  const categorySuggestions = [...new Set(lieux.map(l => l.category ?? '').filter(Boolean))]
  const liveOrder = groups.map(g => g.category).filter(Boolean)
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverCat } =
    useCategoryDrag(liveOrder, order => reorderCategories('lieux', order))

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-3">
      <button
        onClick={addLieu}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter un lieu
      </button>
      {lieux.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-4">Aucun lieu enregistré</p>
      )}
      {groups.map(group => (
        <div key={group.category || '__none__'}>
          {group.category && (
            <div
              draggable
              onDragStart={() => handleDragStart(group.category)}
              onDragOver={e => handleDragOver(e, group.category)}
              onDrop={() => handleDrop(group.category)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 mb-1.5 px-1 cursor-grab active:cursor-grabbing select-none
                          ${dragOverCat === group.category ? 'opacity-40' : ''}`}
            >
              <span className="text-zinc-600 text-[8px]">⠿</span>
              <p className="text-[9px] uppercase tracking-widest text-orange-500/70 font-bold">
                {group.category}
              </p>
            </div>
          )}
          <ul className="space-y-1.5">
            {group.items.map(l => <LieuRow key={l.id} lieu={l} highlighted={highlightId === l.id} />)}
          </ul>
        </div>
      ))}
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Factions ──────────────────────────────────────────────────────────────────

function FactionRow({ faction, highlighted }: { faction: FactionEntry; highlighted: boolean }) {
  const { updateFaction, updateFactionCategory, removeFaction } = useCharacterStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <li className={`border rounded-lg overflow-hidden transition-colors duration-500
                    ${highlighted ? 'border-orange-500 bg-orange-950/20' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-zinc-600 text-xs shrink-0">⚑</span>
        <input
          value={faction.name}
          onChange={e => updateFaction(faction.id, e.target.value, faction.notes)}
          placeholder="Nom de la faction…"
          className="flex-1 bg-transparent text-xs font-semibold text-zinc-200
                     placeholder-zinc-600 focus:outline-none"
        />
        <CategoryBadge
          value={faction.category ?? ''}
          onCommit={v => updateFactionCategory(faction.id, v)}
        />
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-[10px] transition-colors shrink-0 ${
            faction.notes ? 'text-orange-500 hover:text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <button
          onClick={() => removeFaction(faction.id)}
          className="w-4 h-4 flex items-center justify-center text-zinc-600
                     hover:text-red-400 transition-colors text-xs shrink-0"
        >×</button>
      </div>
      {expanded && (
        <div className="px-3 py-2 bg-[#111] border-t border-zinc-800">
          <MarkdownEditor
            value={faction.notes}
            onChange={v => updateFaction(faction.id, faction.name, v)}
            placeholder="Description, relations, notes sur cette faction…"
            rows={3}
          />
        </div>
      )}
    </li>
  )
}

function FactionsTab({ highlightId }: { highlightId: string | null }) {
  const { character, addFaction, reorderCategories } = useCharacterStore()
  const factions = character.factions ?? []
  const groups = groupByCategory(factions, character.categoryOrder?.factions)
  const categorySuggestions = [...new Set(factions.map(f => f.category ?? '').filter(Boolean))]
  const liveOrder = groups.map(g => g.category).filter(Boolean)
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverCat } =
    useCategoryDrag(liveOrder, order => reorderCategories('factions', order))

  return (
    <CategorySuggestionsCtx.Provider value={categorySuggestions}>
    <div className="space-y-3">
      <button
        onClick={addFaction}
        className="w-full text-xs text-zinc-500 hover:text-orange-400 border border-dashed
                   border-zinc-700 hover:border-orange-600 rounded-lg py-1.5 transition-colors"
      >
        + Ajouter une faction
      </button>
      {factions.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-4">Aucune faction enregistrée</p>
      )}
      {groups.map(group => (
        <div key={group.category || '__none__'}>
          {group.category && (
            <div
              draggable
              onDragStart={() => handleDragStart(group.category)}
              onDragOver={e => handleDragOver(e, group.category)}
              onDrop={() => handleDrop(group.category)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 mb-1.5 px-1 cursor-grab active:cursor-grabbing select-none
                          ${dragOverCat === group.category ? 'opacity-40' : ''}`}
            >
              <span className="text-zinc-600 text-[8px]">⠿</span>
              <p className="text-[9px] uppercase tracking-widest text-orange-500/70 font-bold">
                {group.category}
              </p>
            </div>
          )}
          <ul className="space-y-1.5">
            {group.items.map(f => <FactionRow key={f.id} faction={f} highlighted={highlightId === f.id} />)}
          </ul>
        </div>
      ))}
    </div>
    </CategorySuggestionsCtx.Provider>
  )
}

// ── Recherche ─────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<NoteTab, string> = {
  notes: 'Notes', journal: 'Journal', quetes: 'Quêtes',
  contacts: 'Contacts', lieux: 'Lieux', factions: 'Factions',
}

function extractSnippet(text: string, query: string): string {
  const clean = text.replace(/[#*_`[\]]/g, '').replace(/\n+/g, ' ').trim()
  const idx = clean.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return clean.slice(0, 90)
  const start = Math.max(0, idx - 30)
  const end   = Math.min(clean.length, idx + query.length + 60)
  return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '')
}

interface SearchResult { id: string; tab: NoteTab; icon: string; title: string; snippet: string }

function SearchResults({
  query,
  character,
  onNavigate,
}: {
  query: string
  character: import('../../engine/types').Character
  onNavigate: (tab: NoteTab, id: string | null) => void
}) {
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  if (character.notes?.toLowerCase().includes(q))
    results.push({ id: 'notes', tab: 'notes', icon: '📝', title: 'Notes libres', snippet: extractSnippet(character.notes ?? '', q) })

  for (const e of character.journal ?? [])
    if (e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q))
      results.push({ id: e.id, tab: 'journal', icon: '📖', title: e.title || '(sans titre)', snippet: extractSnippet(e.title.toLowerCase().includes(q) ? e.title : e.content, q) })

  for (const e of character.quetes ?? [])
    if (e.title.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q))
      results.push({ id: e.id, tab: 'quetes', icon: '⚔', title: e.title || '(sans titre)', snippet: extractSnippet(e.title.toLowerCase().includes(q) ? e.title : e.notes, q) })

  for (const e of character.contacts ?? [])
    if (e.name.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q))
      results.push({ id: e.id, tab: 'contacts', icon: '👤', title: e.name || '(sans nom)', snippet: extractSnippet(e.name.toLowerCase().includes(q) ? e.name : e.notes, q) })

  for (const e of character.lieux ?? [])
    if (e.name.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q))
      results.push({ id: e.id, tab: 'lieux', icon: '📍', title: e.name || '(sans nom)', snippet: extractSnippet(e.name.toLowerCase().includes(q) ? e.name : e.notes, q) })

  for (const e of character.factions ?? [])
    if (e.name.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q))
      results.push({ id: e.id, tab: 'factions', icon: '⚑', title: e.name || '(sans nom)', snippet: extractSnippet(e.name.toLowerCase().includes(q) ? e.name : e.notes, q) })

  if (results.length === 0)
    return <p className="text-xs text-zinc-600 italic text-center py-8">Aucun résultat pour « {query} »</p>

  return (
    <ul className="space-y-1.5">
      {results.map(r => (
        <li key={`${r.tab}-${r.id}`}>
          <button
            onClick={() => onNavigate(r.tab, r.tab === 'notes' ? null : r.id)}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#111]
                       border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
          >
            <span className="text-sm mt-0.5 shrink-0">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors truncate">
                {r.title}
              </p>
              {r.snippet && (
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5 line-clamp-2">{r.snippet}</p>
              )}
            </div>
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest shrink-0 mt-0.5">
              {TAB_LABELS[r.tab]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

export function NotesPanel() {
  const [tab, setTab]                 = useState<NoteTab>('notes')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const { character } = useCharacterStore()

  function highlight(id: string) {
    setHighlightId(id)
    setTimeout(() => setHighlightId(null), 2000)
  }

  function navigateToRef(name: string) {
    const lower = name.toLowerCase()
    const journal = (character.journal ?? []).find(e => e.title.toLowerCase() === lower)
    if (journal) { setTab('journal'); highlight(journal.id); return }
    const quest = (character.quetes ?? []).find(q => q.title.toLowerCase() === lower)
    if (quest) { setTab('quetes'); highlight(quest.id); return }
    const contact = (character.contacts ?? []).find(c => c.name.toLowerCase() === lower)
    if (contact) { setTab('contacts'); highlight(contact.id); return }
    const lieu = (character.lieux ?? []).find(l => l.name.toLowerCase() === lower)
    if (lieu) { setTab('lieux'); highlight(lieu.id); return }
    const faction = (character.factions ?? []).find(f => f.name.toLowerCase() === lower)
    if (faction) { setTab('factions'); highlight(faction.id); return }
    const invItem = (character.inventory ?? []).find(item => {
      const def = ITEMS_LIST.find(d => d.id === item.itemId)
      return def?.name.toLowerCase() === lower
    })
    if (invItem) {
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'inventaire', itemId: invItem.id } }))
      return
    }
  }

  function handleSearchNavigate(t: NoteTab, id: string | null) {
    setSearch('')
    setTab(t)
    if (id) highlight(id)
  }

  const isSearching = search.trim().length > 0

  return (
    <NotesPanelContext.Provider value={{ navigateToRef, highlightId }}>
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden">

        {/* Barre de recherche */}
        <div className="px-3 pt-2.5 pb-2 border-b border-zinc-800">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">⌕</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans les notes…"
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg
                         pl-7 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-600
                         focus:outline-none focus:border-orange-600 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >✕</button>
            )}
          </div>
        </div>

        {/* Barre d'onglets — masquée pendant la recherche */}
        {!isSearching && (
          <div className="flex border-b border-zinc-800 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 min-h-[200px]">
          {isSearching ? (
            <SearchResults query={search.trim()} character={character} onNavigate={handleSearchNavigate} />
          ) : (
            <>
              {tab === 'notes'    && <NotesTab />}
              {tab === 'journal'  && <JournalTab   highlightId={highlightId} />}
              {tab === 'quetes'   && <QuestesTab   highlightId={highlightId} />}
              {tab === 'contacts' && <ContactsTab  highlightId={highlightId} />}
              {tab === 'lieux'    && <LieuxTab     highlightId={highlightId} />}
              {tab === 'factions' && <FactionsTab  highlightId={highlightId} />}
            </>
          )}
        </div>
      </div>
    </NotesPanelContext.Provider>
  )
}
