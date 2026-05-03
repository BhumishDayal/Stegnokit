import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./ui/Logo";
import { MagneticButton } from "./ui/MagneticButton";

const links = [
  { label: "Studio", href: "#studio" },
  { label: "How it works", href: "#how" },
  { label: "Gallery", href: "#gallery" },
  { label: "Specs", href: "#specs" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const backdropFilter = useTransform(scrollY, [0, 200], ["blur(0px)", "blur(18px)"]);
  const backgroundColor = useTransform(scrollY, [0, 200], ["rgba(5,6,15,0)", "rgba(5,6,15,0.7)"]);
  const borderBottomColor = useTransform(
    scrollY,
    [0, 200],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]
  );

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{ backdropFilter, WebkitBackdropFilter: backdropFilter, backgroundColor, borderBottomColor }}
      className="fixed top-0 inset-x-0 z-50 border-b will-change-transform"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.025] px-2 py-1.5 backdrop-blur-md">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-4 py-1.5 text-sm text-white/70 hover:text-white transition-colors group"
            >
              <span className="relative z-10">{l.label}</span>
              <span className="absolute inset-0 rounded-full bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-white/50 hover:text-white/90 transition-colors"
          >
            v0.1.0
            <ArrowUpRight className="size-3.5" />
          </a>
          <MagneticButton variant="primary" className="!px-5 !py-2 text-sm">
            Launch Studio
          </MagneticButton>
        </div>
      </div>
    </motion.header>
  );
}
