import { Logo } from "./ui/Logo";

const cols = [
  {
    title: "Product",
    links: ["Studio", "Gallery", "How it works", "Specs"],
  },
  {
    title: "Resources",
    links: ["Docs", "Changelog", "Security", "Status"],
  },
  {
    title: "Project",
    links: ["GitHub", "Roadmap", "License", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-20">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-[1.4fr_repeat(3,1fr)] gap-10">
          <div>
            <Logo />
            <p className="mt-5 text-sm text-white/55 max-w-xs leading-relaxed">
              Encrypted signals, hidden inside the pixels of everyday images.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] text-white/35">
              <span className="size-1 rounded-full bg-neon-cyan animate-pulseDot" />
              ALL SYSTEMS NOMINAL
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-mono tracking-[0.22em] text-white/40 mb-4">
                {col.title.toUpperCase()}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-white/65 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono tracking-widest text-white/35">
          <span>© {new Date().getFullYear()} STEGNOKIT</span>
          <span>HIDDEN · ENCRYPTED · RECOVERABLE</span>
        </div>
      </div>
    </footer>
  );
}
