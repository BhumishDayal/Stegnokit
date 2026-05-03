import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { randomCipherChar, cn } from "../../lib/utils";

type Props = {
  text: string;
  duration?: number;
  className?: string;
  delay?: number;
};

export function EncryptedText({ text, duration = 1400, className, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(() =>
    text.split("").map((c) => (c === " " ? " " : randomCipherChar())).join("")
  );

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now() + delay;
    const total = text.length;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(1, elapsed / duration);
      const revealed = Math.floor(progress * total);
      let out = "";
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (i < revealed) out += ch;
        else if (ch === " ") out += " ";
        else out += randomCipherChar();
      }
      setDisplay(out);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, duration, delay]);

  return (
    <span ref={ref} className={cn("font-mono", className)}>
      {display}
    </span>
  );
}
