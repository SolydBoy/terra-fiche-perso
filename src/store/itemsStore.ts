import { create } from 'zustand'
import { loadItems } from '../engine/items'
import type { ItemDef } from '../engine/items'

interface ItemsStore {
  items: ItemDef[]
  refresh: () => void
}

export const useItemsStore = create<ItemsStore>((set) => ({
  items:   loadItems(),
  refresh: () => set({ items: loadItems() }),
}))
