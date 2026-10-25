import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, Wound, WoundSeverity, Trait, InventoryItem, ContactRelation, LocationEntry, LocationType, FactionEntry, NoteSection } from '../engine/types'
import type { EquipmentSlot } from '../engine/items-merged'
import { useItemsStore } from './itemsStore'
import { calcHpBase, calcPeMax, calcPeRecovery } from '../engine/stats'
import { computeAllBonuses } from '../engine/traits'
import { calcCorruptionCapacity } from '../engine/magic'

const DEFAULT_CHARACTER: Character = {
  firstName: 'John',
  lastName: 'Miller',
  quickNote: 'Ancien policier reconverti en survivant.',
  constitution: 3,
  force: 4,
  dexterite: 2,
  intelligence: 3,
  sagesse: 2,
  charisme: 5,
  peBase: 6,
  hpCurrent: 11,
  hpUserAdjust: 0,
  peCurrent: 7,
  faim: 145,
  soif: 80,
  stress: 65,
  fv: 2,
  corruption: 0,
  corruptionWeeklyUsed: 0,
  armure: 0,
  equipped: {},
  objetsMoyens: 0,
  objetsMoyensMax: 1,
  objetsGrands: 0,
  objetsGrandsMax: 1,
  objetsTresGrands: 0,
  objetsTresGrandsMax: 1,
  wounds: [
    { id: 'w1', severity: 'légère', description: 'Entaille bras gauche', treated: true,  hpCost: 2 },
    { id: 'w2', severity: 'grave',  description: 'Fracture côtes droites', treated: false, hpCost: 5 },
  ],
  skills: {},
  traits: [],
  dons: [],
  inventory: [],
  techniquesAcquises: [],
  techniquePeCosts: {},
  sortilegesAcquis: [],
  sortMastery: {},
  sortTypeMastery: {},
  famillesChoisies: [],
  favorites: [],
  notes: '',
  journal: [],
  quetes: [],
  contacts: [],
  lieux: [],
  factions: [],
}

/** Cap hpCurrent entre 0 et le max brut (15 + con). Les blessures ne changent plus le max. */
function clampHp(character: Character): number {
  return Math.max(0, Math.min(character.hpCurrent, calcHpBase(character)))
}

export interface CombatLogEntry { label: string; cost: number }

interface CharacterStore {
  character:     Character
  combatMode:    boolean
  combatLog:     CombatLogEntry[]
  combatFatigue: number
  setCharacter:   (character: Character) => void
  setCombatMode:  (active: boolean) => void
  spendPE:        (amount: number) => void
  logAction:      (label: string, cost: number) => void
  addFatigue:     (amount: number) => void
  endTurn:        () => void
  updateField: <K extends keyof Character>(key: K, value: Character[K]) => void
  updateSkill: (id: string, level: number) => void
  addWound: (severity: WoundSeverity, description: string, hpCost: number) => void
  removeWound: (id: string) => void
  toggleWoundTreated: (id: string) => void
  updateWoundDescription: (id: string, description: string) => void
  updateWoundHpCost: (id: string, hpCost: number) => void
  updateWoundSeverity: (id: string, severity: WoundSeverity) => void
  addTrait: (title: string, effect: string) => void
  removeTrait: (id: string) => void
  updateTrait: (id: string, title: string, effect: string) => void
  addTraitCaractere: (title: string, effect: string) => void
  removeTraitCaractere: (id: string) => void
  updateTraitCaractere: (id: string, title: string, effect: string) => void
  addDon: (donId: string) => void
  removeDon: (donId: string) => void
  acquireTechnique: (techniqueId: string) => void
  removeTechnique: (techniqueId: string) => void
  updateTechniquePeCost: (techniqueId: string, cost: number) => void
  acquireSpell: (spellId: string) => void
  removeSpell: (spellId: string) => void
  setSpellMastery: (spellId: string, level: string) => void
  setSpellTypeMastery: (spellType: string, level: string) => void
  addCorruption: (amount: number) => void
  resetWeeklyCorruption: () => void
  toggleFavorite: (id: string) => void
  setFamillesChoisies: (families: string[]) => void
  addInventoryItem: (itemId: string) => void
  moveInventoryItem: (id: string, direction: 'up' | 'down') => void
  removeInventoryItem: (id: string) => void
  updateInventoryQty: (id: string, qty: number) => void
  updateInventoryNotes: (id: string, notes: string) => void
  equipItem:       (instanceId: string) => void
  unequipItem:     (slot: EquipmentSlot) => void
  equipListItem:   (instanceId: string) => void
  unequipListItem: (instanceId: string) => void
  useInventoryItem: (instanceId: string) => void
  // Journal
  addJournalEntry: () => string
  updateJournalEntry: (id: string, title: string, content: string) => void
  removeJournalEntry: (id: string) => void
  // Quêtes
  addQuest: (title: string) => void
  toggleQuestDone: (id: string) => void
  toggleQuestPin: (id: string) => void
  updateQuestTitle: (id: string, title: string) => void
  updateQuestNotes: (id: string, notes: string) => void
  updateQuestCategory: (id: string, category: string) => void
  removeQuest: (id: string) => void
  // Contacts
  addContact: () => void
  updateContact: (id: string, name: string, relation: ContactRelation, notes: string) => void
  updateContactCategory: (id: string, category: string) => void
  removeContact: (id: string) => void
  // Lieux
  addLieu: () => void
  updateLieu: (id: string, name: string, type: LocationType, notes: string) => void
  updateLieuCategory: (id: string, category: string) => void
  removeLieu: (id: string) => void
  // Factions
  addFaction: () => void
  updateFaction: (id: string, name: string, notes: string) => void
  updateFactionCategory: (id: string, category: string) => void
  removeFaction: (id: string) => void
  // Journal
  updateJournalCategory: (id: string, category: string) => void
  // Note sections
  addNoteSection: () => string
  updateNoteSection: (id: string, category: string, content: string) => void
  removeNoteSection: (id: string) => void
  reorderCategories: (tab: 'journal' | 'quetes' | 'lieux' | 'factions', order: string[]) => void
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      character:     DEFAULT_CHARACTER,
      combatMode:    false,
      combatLog:     [],
      combatFatigue: 0,

      setCharacter: (character) => set({ character }),

      // Entrer en combat → PE au max + log vide / Quitter → log vide
      setCombatMode: (active) =>
        set((s) => {
          if (!active) return { combatMode: false, combatLog: [], combatFatigue: 0 }
          const donBonuses = computeAllBonuses(s.character)
          const peMax = calcPeMax(s.character, donBonuses).total
          return {
            combatMode:    true,
            combatLog:     [],
            combatFatigue: 0,
            character: { ...s.character, peCurrent: peMax },
          }
        }),

      spendPE: (amount) =>
        set((s) => ({
          character: {
            ...s.character,
            peCurrent: (s.character.peCurrent ?? 0) - amount,
          },
        })),

      logAction: (label, cost) =>
        set((s) => ({ combatLog: [...s.combatLog, { label, cost }] })),

      addFatigue: (amount) =>
        set((s) => ({ combatFatigue: Math.max(0, s.combatFatigue + amount) })),

      // Fin de tour : récupération selon Constitution, log vidé, fatigue remise à 0
      // Si PE négatifs → récupération divisée par 2 (règle)
      endTurn: () =>
        set((s) => {
          const donBonuses = computeAllBonuses(s.character)
          const recovery   = calcPeRecovery(s.character, donBonuses)
          const peMax      = calcPeMax(s.character, donBonuses).total
          const current    = s.character.peCurrent ?? 0
          const newPe      = current < 0
            ? Math.floor(recovery / 2)
            : Math.min(peMax, current + recovery)
          return {
            character:     { ...s.character, peCurrent: newPe },
            combatLog:     [],
            combatFatigue: 0,
          }
        }),

      updateField: (key, value) =>
        set((s) => ({ character: { ...s.character, [key]: value } })),

      updateSkill: (id, level) =>
        set((s) => ({
          character: {
            ...s.character,
            skills: { ...(s.character.skills ?? {}), [id]: Math.min(20, level) },
          },
        })),

      addWound: (severity, description, hpCost) =>
        set((s) => {
          const newWound: Wound = {
            id: `w-${Date.now()}`,
            severity,
            description,
            treated: false,
            hpCost,
          }
          const updated: Character = {
            ...s.character,
            wounds: [...s.character.wounds, newWound],
          }
          // Réduire hpCurrent du coût de la nouvelle blessure
          updated.hpCurrent = Math.max(0, s.character.hpCurrent - hpCost)
          return { character: updated }
        }),

      removeWound: (id) =>
        set((s) => {
          const wound = s.character.wounds.find((w) => w.id === id)
          const updated: Character = {
            ...s.character,
            wounds: s.character.wounds.filter((w) => w.id !== id),
          }
          // Rendre les PV de la blessure supprimée (cap au max sans cette blessure)
          if (wound && wound.hpCost > 0) {
            const newMax = calcHpBase(updated)
            updated.hpCurrent = Math.min(s.character.hpCurrent + wound.hpCost, newMax)
          }
          return { character: updated }
        }),

      toggleWoundTreated: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            wounds: s.character.wounds.map((w) =>
              w.id === id ? { ...w, treated: !w.treated } : w
            ),
          },
        })),

      updateWoundDescription: (id, description) =>
        set((s) => ({
          character: {
            ...s.character,
            wounds: s.character.wounds.map((w) =>
              w.id === id ? { ...w, description } : w
            ),
          },
        })),

      updateWoundSeverity: (id, severity) =>
        set((s) => ({
          character: {
            ...s.character,
            wounds: s.character.wounds.map((w) =>
              w.id === id ? { ...w, severity, treated: false } : w
            ),
          },
        })),

      updateWoundHpCost: (id, newCost) =>
        set((s) => {
          const old = s.character.wounds.find((w) => w.id === id)
          if (!old) return s
          const delta = newCost - old.hpCost  // positif = plus de coût = moins de PV
          const updatedWounds = s.character.wounds.map((w) =>
            w.id === id ? { ...w, hpCost: newCost } : w
          )
          const updated: Character = { ...s.character, wounds: updatedWounds }
          updated.hpCurrent = Math.max(0, clampHp({ ...updated, hpCurrent: s.character.hpCurrent - delta }))
          return { character: updated }
        }),

      addTrait: (title, effect) =>
        set((s) => {
          const newTrait: Trait = { id: `t-${Date.now()}`, title, effect }
          return { character: { ...s.character, traits: [...(s.character.traits ?? []), newTrait] } }
        }),

      removeTrait: (id) =>
        set((s) => ({
          character: { ...s.character, traits: (s.character.traits ?? []).filter((t) => t.id !== id) },
        })),

      updateTrait: (id, title, effect) =>
        set((s) => ({
          character: {
            ...s.character,
            traits: (s.character.traits ?? []).map((t) => t.id === id ? { ...t, title, effect } : t),
          },
        })),

      addTraitCaractere: (title, effect) =>
        set((s) => {
          const newTrait: Trait = { id: `tc-${Date.now()}`, title, effect }
          return { character: { ...s.character, traitsCaractere: [...(s.character.traitsCaractere ?? []), newTrait] } }
        }),

      removeTraitCaractere: (id) =>
        set((s) => ({
          character: { ...s.character, traitsCaractere: (s.character.traitsCaractere ?? []).filter((t) => t.id !== id) },
        })),

      updateTraitCaractere: (id, title, effect) =>
        set((s) => ({
          character: {
            ...s.character,
            traitsCaractere: (s.character.traitsCaractere ?? []).map((t) => t.id === id ? { ...t, title, effect } : t),
          },
        })),

      addDon: (donId) =>
        set((s) => ({
          character: { ...s.character, dons: [...(s.character.dons ?? []), donId] },
        })),

      removeDon: (donId) =>
        set((s) => ({
          character: { ...s.character, dons: (s.character.dons ?? []).filter((d) => d !== donId) },
        })),

      acquireTechnique: (techniqueId) =>
        set((s) => ({
          character: {
            ...s.character,
            techniquesAcquises: [...(s.character.techniquesAcquises ?? []), techniqueId],
          },
        })),

      removeTechnique: (techniqueId) =>
        set((s) => ({
          character: {
            ...s.character,
            techniquesAcquises: (s.character.techniquesAcquises ?? []).filter((id) => id !== techniqueId),
          },
        })),

      updateTechniquePeCost: (techniqueId, cost) =>
        set((s) => ({
          character: {
            ...s.character,
            techniquePeCosts: { ...(s.character.techniquePeCosts ?? {}), [techniqueId]: cost },
          },
        })),

      acquireSpell: (spellId) =>
        set((s) => ({
          character: {
            ...s.character,
            sortilegesAcquis: [...(s.character.sortilegesAcquis ?? []), spellId],
          },
        })),

      removeSpell: (spellId) =>
        set((s) => ({
          character: {
            ...s.character,
            sortilegesAcquis: (s.character.sortilegesAcquis ?? []).filter((id) => id !== spellId),
          },
        })),

      setSpellMastery: (spellId, level) =>
        set((s) => ({
          character: {
            ...s.character,
            sortMastery: { ...(s.character.sortMastery ?? {}), [spellId]: level },
          },
        })),

      setSpellTypeMastery: (spellType, level) =>
        set((s) => ({
          character: {
            ...s.character,
            sortTypeMastery: { ...(s.character.sortTypeMastery ?? {}), [spellType]: level },
          },
        })),

      // Dépense (amount > 0) : remplit d'abord la capacité hebdomadaire sans conséquence ;
      // seul le dépassement de cette capacité s'ajoute à la corruption permanente (règle : La Corruption).
      // Réduction manuelle (amount < 0, récupération naturelle/rituel) : agit directement sur le cumul permanent.
      addCorruption: (amount) =>
        set((s) => {
          if (amount < 0) {
            return {
              character: {
                ...s.character,
                corruption: Math.max(0, Math.min(100, (s.character.corruption ?? 0) + amount)),
              },
            }
          }
          const capacity      = calcCorruptionCapacity(s.character.sagesse ?? 0)
          const weeklyBefore  = s.character.corruptionWeeklyUsed ?? 0
          const weeklyAfter   = weeklyBefore + amount
          const overflowBefore = Math.max(0, weeklyBefore - capacity)
          const overflowAfter  = Math.max(0, weeklyAfter - capacity)
          const permanentDelta = overflowAfter - overflowBefore
          return {
            character: {
              ...s.character,
              corruption: Math.max(0, Math.min(100, (s.character.corruption ?? 0) + permanentDelta)),
              corruptionWeeklyUsed: weeklyAfter,
            },
          }
        }),

      resetWeeklyCorruption: () =>
        set((s) => ({
          character: { ...s.character, corruptionWeeklyUsed: 0 },
        })),

      toggleFavorite: (id) =>
        set((s) => {
          const favs = s.character.favorites ?? []
          const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
          return { character: { ...s.character, favorites: next } }
        }),

      setFamillesChoisies: (families) =>
        set((s) => ({
          character: { ...s.character, famillesChoisies: families },
        })),

      addInventoryItem: (itemId) =>
        set((s) => {
          const def = useItemsStore.getState().items.find((i) => i.id === itemId)
          if (!def) return s
          const inventory = s.character.inventory ?? []
          if (def.stackable) {
            const existing = inventory.find((i) => i.itemId === itemId)
            if (existing) {
              return {
                character: {
                  ...s.character,
                  inventory: inventory.map((i) =>
                    i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
                  ),
                },
              }
            }
          }
          const newItem: InventoryItem = {
            id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            itemId,
            quantity: 1,
          }
          return { character: { ...s.character, inventory: [...inventory, newItem] } }
        }),

      moveInventoryItem: (id, direction) =>
        set((s) => {
          const inventory = s.character.inventory ?? []
          const index = inventory.findIndex((i) => i.id === id)
          if (index === -1) return s
          const next = direction === 'up' ? index - 1 : index + 1
          if (next < 0 || next >= inventory.length) return s
          const reordered = [...inventory]
          ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
          return { character: { ...s.character, inventory: reordered } }
        }),

      removeInventoryItem: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            inventory: (s.character.inventory ?? []).filter((i) => i.id !== id),
          },
        })),

      updateInventoryQty: (id, qty) =>
        set((s) => ({
          character: {
            ...s.character,
            inventory: (s.character.inventory ?? []).map((i) =>
              i.id === id ? { ...i, quantity: Math.max(1, qty) } : i
            ),
          },
        })),

      updateInventoryNotes: (id, notes) =>
        set((s) => ({
          character: {
            ...s.character,
            inventory: (s.character.inventory ?? []).map((i) =>
              i.id === id ? { ...i, notes } : i
            ),
          },
        })),

      equipItem: (instanceId) =>
        set((s) => {
          const inst = (s.character.inventory ?? []).find((i) => i.id === instanceId)
          if (!inst) return s
          const def = useItemsStore.getState().items.find((d) => d.id === inst.itemId)
          if (!def?.slot) return s
          return {
            character: {
              ...s.character,
              equipped: { ...(s.character.equipped ?? {}), [def.slot]: instanceId },
            },
          }
        }),

      unequipItem: (slot) =>
        set((s) => {
          const equipped = { ...(s.character.equipped ?? {}) }
          delete equipped[slot]
          return { character: { ...s.character, equipped } }
        }),

      equipListItem: (instanceId) =>
        set((s) => ({
          character: {
            ...s.character,
            equippedList: [...new Set([...(s.character.equippedList ?? []), instanceId])],
          },
        })),

      unequipListItem: (instanceId) =>
        set((s) => ({
          character: {
            ...s.character,
            equippedList: (s.character.equippedList ?? []).filter((id) => id !== instanceId),
          },
        })),

      addJournalEntry: () => {
        const id = `j-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        set((s) => ({
          character: {
            ...s.character,
            journal: [{ id, title: '', content: '' }, ...(s.character.journal ?? [])],
          },
        }))
        return id
      },

      updateJournalEntry: (id, title, content) =>
        set((s) => ({
          character: {
            ...s.character,
            journal: (s.character.journal ?? []).map((e) =>
              e.id === id ? { ...e, title, content } : e
            ),
          },
        })),

      removeJournalEntry: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            journal: (s.character.journal ?? []).filter((e) => e.id !== id),
          },
        })),

      addQuest: (title) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: [
              ...(s.character.quetes ?? []),
              { id: `q-${Date.now()}`, title, done: false, notes: '' },
            ],
          },
        })),

      toggleQuestDone: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).map((q) =>
              q.id === id ? { ...q, done: !q.done } : q
            ),
          },
        })),

      toggleQuestPin: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).map((q) =>
              q.id === id ? { ...q, pinned: !q.pinned } : q
            ),
          },
        })),

      updateQuestTitle: (id, title) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).map((q) =>
              q.id === id ? { ...q, title } : q
            ),
          },
        })),

      updateQuestNotes: (id, notes) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).map((q) =>
              q.id === id ? { ...q, notes } : q
            ),
          },
        })),

      updateQuestCategory: (id, category) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).map((q) =>
              q.id === id ? { ...q, category } : q
            ),
          },
        })),

      removeQuest: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            quetes: (s.character.quetes ?? []).filter((q) => q.id !== id),
          },
        })),

      addContact: () =>
        set((s) => ({
          character: {
            ...s.character,
            contacts: [
              ...(s.character.contacts ?? []),
              { id: `c-${Date.now()}`, name: '', relation: 'inconnu' as ContactRelation, notes: '' },
            ],
          },
        })),

      updateContact: (id, name, relation, notes) =>
        set((s) => ({
          character: {
            ...s.character,
            contacts: (s.character.contacts ?? []).map((c) =>
              c.id === id ? { ...c, name, relation, notes } : c
            ),
          },
        })),

      updateContactCategory: (id, category) =>
        set((s) => ({
          character: {
            ...s.character,
            contacts: (s.character.contacts ?? []).map((c) =>
              c.id === id ? { ...c, category } : c
            ),
          },
        })),

      removeContact: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            contacts: (s.character.contacts ?? []).filter((c) => c.id !== id),
          },
        })),

      addLieu: () =>
        set((s) => ({
          character: {
            ...s.character,
            lieux: [...(s.character.lieux ?? []), { id: `l-${Date.now()}`, name: '', type: 'lieu', notes: '' } as LocationEntry],
          },
        })),

      updateLieu: (id, name, type, notes) =>
        set((s) => ({
          character: {
            ...s.character,
            lieux: (s.character.lieux ?? []).map((l) => l.id === id ? { ...l, name, type, notes } : l),
          },
        })),

      updateLieuCategory: (id, category) =>
        set((s) => ({
          character: {
            ...s.character,
            lieux: (s.character.lieux ?? []).map((l) =>
              l.id === id ? { ...l, category } : l
            ),
          },
        })),

      removeLieu: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            lieux: (s.character.lieux ?? []).filter((l) => l.id !== id),
          },
        })),

      addFaction: () =>
        set((s) => ({
          character: {
            ...s.character,
            factions: [...(s.character.factions ?? []), { id: `f-${Date.now()}`, name: '', notes: '' } as FactionEntry],
          },
        })),

      updateFaction: (id, name, notes) =>
        set((s) => ({
          character: {
            ...s.character,
            factions: (s.character.factions ?? []).map((f) => f.id === id ? { ...f, name, notes } : f),
          },
        })),

      updateFactionCategory: (id, category) =>
        set((s) => ({
          character: {
            ...s.character,
            factions: (s.character.factions ?? []).map((f) =>
              f.id === id ? { ...f, category } : f
            ),
          },
        })),

      removeFaction: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            factions: (s.character.factions ?? []).filter((f) => f.id !== id),
          },
        })),

      updateJournalCategory: (id, category) =>
        set((s) => ({
          character: {
            ...s.character,
            journal: (s.character.journal ?? []).map((e) =>
              e.id === id ? { ...e, category } : e
            ),
          },
        })),

      addNoteSection: () => {
        const id = `ns-${Date.now()}`
        set((s) => {
          const existing = s.character.notesSections ?? []
          // First section: auto-migrate old notes if present
          const newSection: NoteSection = {
            id,
            category: 'Notes',
            content: existing.length === 0 && s.character.notes ? s.character.notes : '',
          }
          return {
            character: { ...s.character, notesSections: [...existing, newSection] },
          }
        })
        return id
      },

      updateNoteSection: (id, category, content) =>
        set((s) => ({
          character: {
            ...s.character,
            notesSections: (s.character.notesSections ?? []).map((ns) =>
              ns.id === id ? { ...ns, category, content } : ns
            ),
          },
        })),

      removeNoteSection: (id) =>
        set((s) => ({
          character: {
            ...s.character,
            notesSections: (s.character.notesSections ?? []).filter((ns) => ns.id !== id),
          },
        })),

      reorderCategories: (tab, order) =>
        set((s) => ({
          character: {
            ...s.character,
            categoryOrder: { ...(s.character.categoryOrder ?? {}), [tab]: order },
          },
        })),

      useInventoryItem: (instanceId) =>
        set((s) => {
          const inventory = s.character.inventory ?? []
          const inst = inventory.find((i) => i.id === instanceId)
          if (!inst) return s
          const def = useItemsStore.getState().items.find((d) => d.id === inst.itemId)
          if (!def?.consumeEffect) return s

          const fx = def.consumeEffect
          const c  = s.character
          const hpMax = calcHpBase(c)

          const updated: Character = {
            ...c,
            hpCurrent: fx.hp    != null ? Math.min(hpMax,  Math.max(0, c.hpCurrent + fx.hp))   : c.hpCurrent,
            faim:      fx.faim  != null ? Math.min(200,    Math.max(0, c.faim      + fx.faim))  : c.faim,
            soif:      fx.soif  != null ? Math.min(200,    Math.max(0, c.soif      + fx.soif))  : c.soif,
            stress:    fx.stress != null ? Math.min(200,   Math.max(0, c.stress    + fx.stress)) : c.stress,
            inventory:
              inst.quantity <= 1
                ? inventory.filter((i) => i.id !== instanceId)
                : inventory.map((i) => i.id === instanceId ? { ...i, quantity: i.quantity - 1 } : i),
          }
          return { character: updated }
        }),
    }),
    { name: 'fiche-personnage-v4', partialize: (s) => ({ character: s.character }) }
  )
)
