import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useRef } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "ghost" | "outline";

type Props = {
  children: ReactNode;
  variant?: Variant;
  onClick?: () => void;
  className?: string;
  href?: string;
};

export function MagneticButton({
  children,
  variant = "primary",
  onClick,
  className,
  href,
}: Props) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.25);
    y.set((e.clientY - r.top - r.height / 2) * 0.25);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-medium tracking-wide group overflow-hidden transition-all duration-300 select-none";

  const styles: Record<Variant, string> = {
    primary:
      "text-ink-950 bg-gradient-to-r from-neon-ice via-neon-cyan to-neon-violet shadow-[0_0_40px_-8px_rgba(0,229,255,0.55)] hover:shadow-[0_0_60px_-4px_rgba(168,85,247,0.7)]",
    ghost:
      "text-white bg-white/[0.04] border border-white/15 backdrop-blur-md hover:bg-white/[0.08] hover:border-white/30",
    outline:
      "text-white border border-white/20 hover:border-neon-cyan/60 hover:text-neon-ice",
  };

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === "primary" && (
        <span
          aria-hidden
          className="absolute inset-0 z-0 bg-gradient-to-r from-neon-violet via-neon-magenta to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      )}
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s linear infinite",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        style={{ x: sx, y: sy }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(base, styles[variant], className)}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={cn(base, styles[variant], className)}
    >
      {content}
    </motion.button>
  );
}
