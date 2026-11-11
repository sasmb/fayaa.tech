import { create } from "zustand"
import { persist } from "zustand/middleware"

import { browserStorage } from "../../generation/stores/browser-storage"
import { uploadMedia } from "../../generation/upload"
import { mediaKindFromMime } from "../../generation/upload-contract"
import type { MediaKind } from "../../generation/catalog/types"

export type AssetKind = MediaKind

/** A durable, submit-ready media reference: `src` is a public URL the platform can fetch. */
export interface AssetSelection {
  id: string
  src: string
  kind: AssetKind
  name?: string
}

export interface AssetLibraryItem extends AssetSelection {
  source: "upload" | "generation"
  createdAt: number
  userId?: string
}

type UploadsState = {
  activeUserId: string | null
  items: AssetLibraryItem[]
  setActiveUserId: (userId: string | null) => void
  add: (item: AssetLibraryItem) => void
  remove: (id: string) => void
  clear: () => void
}

/** Remember uploaded reference URLs in this browser, scoped per authenticated user. */
export const useUploads = create<UploadsState>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      items: [],
      setActiveUserId: (userId) => set({ activeUserId: userId }),
      add: (item) => {
        const scopedItem: AssetLibraryItem = {
          ...item,
          userId: item.userId ?? get().activeUserId ?? undefined,
        }
        set((s) => ({
          items: [
            scopedItem,
            ...s.items.filter((i) => i.id !== scopedItem.id),
          ].slice(0, 200),
        }))
      },
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "hf.uploads.v2",
      storage: browserStorage(),
      partialize: (state) => ({
        activeUserId: state.activeUserId,
        items: state.items,
      }),
    }
  )
)

export function kindOf(file: File): AssetKind {
  return mediaKindFromMime(file.type)
}

/** Record a reference only after the Higgsfield storage upload succeeds. */
export async function uploadAsset(file: File): Promise<AssetLibraryItem> {
  const { url } = await uploadMedia(file)
  const item: AssetLibraryItem = {
    id: url,
    src: url,
    kind: kindOf(file),
    name: file.name,
    source: "upload",
    createdAt: Date.now(),
  }
  useUploads.getState().add(item)
  return item
}
