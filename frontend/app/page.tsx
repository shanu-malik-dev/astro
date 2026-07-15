import { Hero } from '@/components/home/Hero';
import { TrustBar } from '@/components/home/TrustBar';
import { AboutTeaser } from '@/components/home/AboutTeaser';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ServicesGrid, TestimonialsCarousel, BlogTeaser } from '@/components/home/DataSections';
import { FaqTeaser, CtaBand } from '@/components/home/FaqAndCta';
import { ServicesBar } from '@/components/home/ServicesBar';

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <TrustBar /> */}
      <AboutTeaser />
      {/* <ServicesGrid limit={3} /> */}
      {/* <HowItWorks /> */}
      {/* <TestimonialsCarousel /> */}
      {/* <BlogTeaser /> */}
      {/* <FaqTeaser /> */}
      <ServicesBar/>
      <CtaBand />
    </>
  );
}
