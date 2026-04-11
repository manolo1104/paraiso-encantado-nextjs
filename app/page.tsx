import Hero from '@/components/Hero';
import SocialProofBar from '@/components/SocialProofBar';
import DestinoSection from '@/components/DestinoSection';
import WhyUs from '@/components/WhyUs';
import SuitesGrid from '@/components/SuitesGrid';
import AmenitiesGrid from '@/components/AmenitiesGrid';
import VIPQuote from '@/components/VIPQuote';
import Testimonials from '@/components/Testimonials';
import LocationSection from '@/components/LocationSection';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import StickyBar from '@/components/StickyBar';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SocialProofBar />
      <DestinoSection />
      <WhyUs />
      <SuitesGrid />
      <AmenitiesGrid />
      <VIPQuote />
      <Testimonials />
      <LocationSection />
      <FAQ />
      <FinalCTA />
      <StickyBar />
    </main>
  );
}
