import Hero from '@/components/Hero';
import SocialProofBar from '@/components/SocialProofBar';
import WhyUs from '@/components/WhyUs';
import SuitesGrid from '@/components/SuitesGrid';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SocialProofBar />
      <WhyUs />
      <SuitesGrid />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
