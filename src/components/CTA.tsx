import { ArrowRight, ShieldCheck } from "lucide-react";
import { MagneticButton } from "./ui/MagneticButton";
import { RevealOnScroll } from "./ui/RevealOnScroll";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="relative rounded-3xl overflow-hidden border-gradient glass-strong px-8 py-20 md:py-28 text-center">
            <motion.div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "conic-gradient(from 0deg at 50% 50%, rgba(0,229,255,0.18), rgba(168,85,247,0.18), rgba(255,43,214,0.18), rgba(0,229,255,0.18))",
                filter: "blur(60px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-grid-fine bg-grid-fine opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-black/30 text-[10px] font-mono tracking-[0.22em] text-white/70">
                <ShieldCheck className="size-3 text-neon-ice" />
                READY · NO ACCOUNT NEEDED
              </div>
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient leading-[1.05] max-w-3xl mx-auto">
                Your message,{" "}
                <span className="text-gradient-neon italic">hidden in plain sight.</span>
              </h2>
              <p className="mt-6 text-white/60 max-w-xl mx-auto leading-relaxed">
                Open the studio. Drop an image. Type your message. Share anywhere — only the right
                key brings it back.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
                <MagneticButton variant="primary">
                  Launch Studio
                  <ArrowRight className="size-4" />
                </MagneticButton>
                <MagneticButton variant="ghost">View on GitHub</MagneticButton>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
