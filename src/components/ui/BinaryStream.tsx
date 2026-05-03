import { useEffect, useState } from "react";

function generateColumn(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) s += Math.random() < 0.5 ? "0" : "1";
  return s;
}

export function BinaryStream({ columns = 14 }: { columns?: number }) {
  const [streams, setStreams] = useState<string[]>(() =>
    Array.from({ length: columns }, () => generateColumn(40))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setStreams((prev) =>
        prev.map((s) => (Math.random() < 0.5 ? generateColumn(40) : s))
      );
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex justify-between overflow-hidden font-mono text-[10px] leading-[1.2] tracking-widest text-neon-cyan/40 [mask-image:linear-gradient(180deg,transparent,black_25%,black_75%,transparent)]"
    >
      {streams.map((stream, i) => (
        <div
          key={i}
          className="flex flex-col"
          style={{
            animation: `scan ${8 + (i % 5) * 1.5}s linear ${i * 0.2}s infinite`,
            opacity: 0.4 + (i % 3) * 0.15,
          }}
        >
          {stream.split("").map((ch, j) => (
            <span key={j}>{ch}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
