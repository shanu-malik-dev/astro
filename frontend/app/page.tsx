import { Hero } from '@/components/home/Hero';
import { TrustBar } from '@/components/home/TrustBar';
import { AboutTeaser } from '@/components/home/AboutTeaser';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ServicesGrid, TestimonialsCarousel, BlogTeaser } from '@/components/home/DataSections';
import { FaqTeaser, CtaBand } from '@/components/home/FaqAndCta';
import { ServicesBar } from '@/components/home/ServicesBar';
import { HOME_SECTION_FLAGS, WEBSITE_MODULE_FLAGS } from '@/lib/visibility-flags';

export default function HomePage() {
  return (
    <>
      {HOME_SECTION_FLAGS.hero && <Hero />}
      {HOME_SECTION_FLAGS.trustBar && <TrustBar />}
      {WEBSITE_MODULE_FLAGS.about && HOME_SECTION_FLAGS.about && <AboutTeaser />}
      {WEBSITE_MODULE_FLAGS.services && HOME_SECTION_FLAGS.servicesGrid && <ServicesGrid limit={3} />}
      {HOME_SECTION_FLAGS.howItWorks && <HowItWorks />}
      {HOME_SECTION_FLAGS.testimonials && <TestimonialsCarousel />}
      {HOME_SECTION_FLAGS.blog && <BlogTeaser />}
      {HOME_SECTION_FLAGS.faq && <FaqTeaser />}
      {WEBSITE_MODULE_FLAGS.services && HOME_SECTION_FLAGS.servicesBar && <ServicesBar />}
      {HOME_SECTION_FLAGS.cta && <CtaBand />}
    </>
  );
}
