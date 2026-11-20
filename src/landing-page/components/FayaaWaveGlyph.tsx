export function FayaaWaveGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4.5 9.5C4.5 6.5 7.5 5 10 6.5C12.5 8 11.5 16 14 17.5C16.5 19 19.5 17.5 19.5 14.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4.5 15.5C4.5 12.5 7.5 11 10 12.5C12.5 14 11.5 6 14 7.5C16.5 9 19.5 7.5 19.5 5.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
