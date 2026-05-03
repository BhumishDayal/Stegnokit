import { cn } from "../../lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          className="drop-shadow-[0_0_8px_rgba(0,229,255,0.55)]"
        >
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7df9ff" />
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ff2bd6" />
            </linearGradient>
          </defs>
          <path
            d="M16 2 L28 8 L28 20 C28 24 22 28 16 30 C10 28 4 24 4 20 L4 8 Z"
            stroke="url(#lg)"
            strokeWidth="1.5"
            fill="rgba(125,249,255,0.05)"
          />
          <path
            d="M11 14 L15 18 L21 12"
            stroke="url(#lg)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <span className="font-display text-[1.05rem] font-semibold tracking-tight">
        Stegno<span className="text-gradient-neon">kit</span>
      </span>
    </div>
  );
}
