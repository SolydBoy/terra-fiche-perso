/**
 * Re-export depuis items.ts pour compatibilité des imports existants.
 * Importer depuis ce fichier ou directement depuis items.ts, au choix.
 */
export type { ItemCategory, VolumeSize, EquipmentSlot, ItemDef, ItemEffects, PassiveEffect, ConsumableEffect } from './items'
export { ITEM_CATEGORIES, ITEMS_LIST as ITEMS_ALL, CLOTHING_SLOT, MULTI_EQUIP_CATEGORIES } from './items'
