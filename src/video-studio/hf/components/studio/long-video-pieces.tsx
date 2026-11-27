import type { LongVideoPieceState } from "../../../longVideoPlanning"
import { cn } from "../../lib/utils"

const PIECE_STYLES: Record<LongVideoPieceState["status"], string> = {
  pending: "bg-white/15",
  rendering: "bg-[#D9FF00]/60 animate-pulse",
  ready: "bg-[#D9FF00]",
  failed: "bg-red-500",
}

const PIECE_LABELS: Record<LongVideoPieceState["status"], string> = {
  pending: "waiting",
  rendering: "rendering",
  ready: "ready",
  failed: "failed",
}

function formatTimecode(sec: number): string {
  const total = Math.max(0, Math.round(sec))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

/**
 * A strip with one bar per piece of a long video, sized by the piece's length,
 * so people can see which parts of their video are done while it renders.
 */
export function LongVideoPieces({
  pieces,
  className,
}: {
  pieces: LongVideoPieceState[]
  className?: string
}) {
  if (pieces.length < 2) return null
  const ready = pieces.filter((p) => p.status === "ready").length
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-3 bottom-3 z-[2] flex flex-col gap-1.5 rounded-lg bg-black/60 px-2.5 py-2 backdrop-blur-md",
        className
      )}
      role="group"
      aria-label={`${ready} of ${pieces.length} pieces ready`}
    >
      <div className="flex items-center justify-between text-[10px] font-medium text-zinc-300">
        <span>
          {ready}/{pieces.length} pieces ready
        </span>
        {pieces.some((p) => (p.attempts ?? 1) > 1 && p.status !== "ready") ? (
          <span className="text-amber-300">retrying a piece</span>
        ) : null}
      </div>
      <div className="flex h-1.5 w-full gap-0.5">
        {pieces.map((piece) => (
          <span
            key={piece.index}
            className={cn("h-full rounded-full", PIECE_STYLES[piece.status])}
            style={{ flexGrow: Math.max(1, piece.durationSec), flexBasis: 0 }}
            title={`Piece ${piece.index + 1} (${formatTimecode(piece.startSec)}–${formatTimecode(
              piece.startSec + piece.durationSec
            )}): ${PIECE_LABELS[piece.status]}`}
          />
        ))}
      </div>
    </div>
  )
}
