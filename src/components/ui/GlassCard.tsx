import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "magenta";
  interactive?: boolean;
};

export function GlassCard({ children, className, glow = "cyan", interactive = true }: Props) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, rgba(${
    glow === "cyan" ? "0,229,255" : glow === "violet" ? "168,85,247" : "255,43,214"
  },0.18), transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      onMouseMove={interactive ? onMove : undefined}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className={cn(
        "group relative rounded-2xl glass border-gradient overflow-hidden",
        className
      )}
    >
      {interactive && (
        <motion.div
          aria-hidden
          style={{ background }}
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
