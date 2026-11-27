// Generated from generation/catalog/models/*. Do not edit.
import type { ModelEntry } from "./types"

import m0 from "./models/genjutsu"
import m1 from "./models/seedance"

const LAST = Number.MAX_SAFE_INTEGER

const installed: (ModelEntry | ModelEntry[])[] = [m0, m1]

export const MODELS: readonly ModelEntry[] = installed
  .flat()
  .sort((a, b) => (a.order ?? LAST) - (b.order ?? LAST))
