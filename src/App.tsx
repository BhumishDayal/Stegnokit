import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Studio } from "./components/Studio";
import { MemeGallery } from "./components/MemeGallery";
import { Stats } from "./components/Stats";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { GridBackground } from "./components/ui/GridBackground";
import { NoiseOverlay } from "./components/ui/NoiseOverlay";
import { ScrollProgress } from "./components/ui/ScrollProgress";

export default function App() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-white antialiased overflow-x-hidden">
      <GridBackground />
      <NoiseOverlay />
      <ScrollProgress />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Studio />
        <MemeGallery />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
