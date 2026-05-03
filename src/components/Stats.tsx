import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RevealOnScroll } from "./ui/RevealOnScroll";

type Stat = {
  label: string;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
};

const stats: Stat[] = [
  { label: "Bit accuracy under JPEG q=75", to: 99.2, suffix: "%", decimals: 1 },
  { label: "Formats supported in & out", to: 6, suffix: "+" },
  { label: "Average encode latency", to: 1.4, suffix: "s", decimals: 1 },
  { label: "Regression tests", to: 240, suffix: "+" },
];

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(decimals));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    return rounded.on("change", (v) => setDisplay(v));
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, to, motionValue]);

  return <span ref={ref}>{display}</span>;
}

export function Stats() {
  return (
    <section id="specs" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.22em] text-neon-cyan/90">
            <span className="size-1 rounded-full bg-neon-cyan" />
            SPECS
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient max-w-3xl mx-auto leading-[1.05]">
            Numbers we're <span className="text-gradient-neon italic">obsessed with.</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <RevealOnScroll key={s.label} delay={i * 0.08}>
              <div className="relative h-full p-7 rounded-2xl glass border-gradient overflow-hidden">
                <div className="absolute -top-12 -right-12 size-32 rounded-full bg-neon-violet/15 blur-2xl pointer-events-none" />
                <div className="text-[10px] font-mono tracking-[0.22em] text-white/40">
                  {String(i + 1).padStart(2, "0")} / {String(stats.length).padStart(2, "0")}
                </div>
                <div className="mt-4 font-display text-5xl md:text-6xl font-semibold tracking-tight text-gradient-neon">
                  {s.prefix}
                  <Counter to={s.to} decimals={s.decimals} />
                  {s.suffix}
                </div>
                <div className="mt-3 text-sm text-white/55 leading-relaxed">{s.label}</div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
