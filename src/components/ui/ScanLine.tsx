export function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 h-32 animate-scan"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(125, 249, 255, 0.08) 45%, rgba(125, 249, 255, 0.18) 50%, rgba(125, 249, 255, 0.08) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}
