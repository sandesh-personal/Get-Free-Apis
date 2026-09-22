/**
 * Decorative by design: every call site pairs this with the wordmark, so the link
 * already has an accessible name.
 *
 * Inlined rather than served from /logo.svg, per the blueprint's "inline SVG symbols
 * exclusively" rule — it costs no request and scales without a raster step.
 *
 * Static white plate in both themes, matching the supplied logo.svg — the mark does
 * not react to the theme at all.
 *
 * The hairline border is what makes that work: a pure white plate on the #FAFAFA
 * light canvas would otherwise have almost no edge. It is carried over from the
 * source file, where it exists for the same reason.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect
        width="48"
        height="48"
        rx="10"
        fill="#ffffff"
        stroke="#e4e4e7"
        strokeWidth="1.5"
      />
      <g
        stroke="#059669"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 18 16 L 9 24 L 18 32" />
        <path d="M 30 16 L 39 24 L 30 32" />
      </g>
    </svg>
  );
}
