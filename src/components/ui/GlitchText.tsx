import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function GlitchText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative inline-block", className)}
    >
      <span className="relative z-10 text-gradient">{text}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 translate-x-[2px] translate-y-[1px] text-neon-cyan/40 mix-blend-screen blur-[0.4px] animate-flicker"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 -translate-x-[1px] -translate-y-[1px] text-neon-violet/40 mix-blend-screen blur-[0.4px] animate-flicker"
        style={{ animationDelay: "0.6s" }}
      >
        {text}
      </span>
    </motion.h1>
  );
}
