const ANNOUNCEMENT_URL = "/studio";

export function Announcement() {
  return (
    <div className="from-fy-accent-400 to-fy-rose text-white bg-linear-to-r relative flex w-full items-center justify-center gap-3 p-2.5 text-center font-semibold text-xs sm:text-sm">
      <a
        href={ANNOUNCEMENT_URL}
        className="cursor-pointer transition-opacity hover:opacity-90 hover:drop-shadow-sm flex items-center gap-2"
      >
        <span>🔥 <strong>New:</strong> FAYAA Templates & FAYAA Motion Control are live.</span>
        <span className="bg-black/25 hover:bg-black/40 rounded-full px-2.5 py-0.5 text-xs font-mono tracking-wide transition-colors">
          Try Now →
        </span>
      </a>
    </div>
  );
}
