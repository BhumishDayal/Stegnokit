import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: "cyan" | "violet" | "magenta";
  alpha: number;
};

export function ParticleField({ density = 70 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h) / 18000);
      particles = Array.from({ length: Math.min(count, density) }, () => {
        const r = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.4,
          hue: r < 0.6 ? "cyan" : r < 0.9 ? "violet" : "magenta",
          alpha: Math.random() * 0.5 + 0.25,
        };
      });
    };

    const colorFor = (hue: Particle["hue"], a: number) =>
      hue === "cyan"
        ? `rgba(0, 229, 255, ${a})`
        : hue === "violet"
        ? `rgba(168, 85, 247, ${a})`
        : `rgba(255, 43, 214, ${a})`;

    const tick = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(p.hue, p.alpha);
        ctx.shadowBlur = 8;
        ctx.shadowColor = colorFor(p.hue, 0.6);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const N = particles.length;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max = 130;
          if (d2 < max * max) {
            const t = 1 - Math.sqrt(d2) / max;
            ctx.strokeStyle = `rgba(125, 249, 255, ${0.12 * t})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none opacity-70"
    />
  );
}
