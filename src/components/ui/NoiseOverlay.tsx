export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] noise opacity-[0.06] mix-blend-overlay"
    />
  );
}
