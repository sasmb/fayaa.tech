import { create } from "zustand"
import { persist } from "zustand/middleware"

import { browserStorage } from "../../generation/stores/browser-storage"

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  userId?: string
}

type ProjectsState = {
  activeUserId: string | null
  projects: Project[]
  setActiveUserId: (userId: string | null) => void
  create: (name: string) => Project
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  touch: (id: string) => void
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Local-first projects, scoped per authenticated user. */
export const useProjects = create<ProjectsState>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      projects: [],
      setActiveUserId: (userId) => set({ activeUserId: userId }),
      create: (name) => {
        const now = Date.now()
        const project: Project = {
          id: newId(),
          name: name.trim() || "Untitled",
          createdAt: now,
          updatedAt: now,
          userId: get().activeUserId ?? undefined,
        }
        set({ projects: [project, ...get().projects] })
        return project
      },
      rename: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() }
              : p
          ),
        })),
      remove: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      touch: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, updatedAt: Date.now() } : p
          ),
        })),
    }),
    {
      name: "hf.projects.v2",
      storage: browserStorage(),
      partialize: (state) => ({
        activeUserId: state.activeUserId,
        projects: state.projects,
      }),
    }
  )
)
