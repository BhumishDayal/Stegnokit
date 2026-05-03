export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-grid-fine bg-grid-fine [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-[0.55]" />
      <div className="absolute inset-0 bg-grid-coarse bg-grid-coarse [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] opacity-30" />
      <div className="absolute inset-0 bg-radial-fade" />
    </div>
  );
}
