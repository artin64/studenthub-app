import { NavBar } from '../components/NavBar';
import { Hero } from '../components/Hero';
import { AcademicCycle } from '../components/AcademicCycle';
import { Features } from '../components/Features';
import { AudienceSection } from '../components/AudienceSection';
import { IntelligenceSpotlight } from '../components/IntelligenceSpotlight';
import { Plans } from '../components/Plans';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-neutral-50 font-sans text-gray-900">
      <NavBar />
      <main>
        <Hero />
        <AcademicCycle />
        <Features />
        <AudienceSection />
        <IntelligenceSpotlight />
        <Plans />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
