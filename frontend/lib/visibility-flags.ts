import { ADMIN_MODULE_FLAGS } from "@/lib/feature-flags";

export const WEBSITE_MODULE_FLAGS = {
  about: true,
  services: ADMIN_MODULE_FLAGS.services,
  shop: ADMIN_MODULE_FLAGS.shop,
  astrologers: ADMIN_MODULE_FLAGS.astrologers,
};

export const HOME_SECTION_FLAGS = {
  hero: true,
  trustBar: false,
  about: true,
  servicesGrid: false,
  howItWorks: false,
  testimonials: false,
  blog: false,
  faq: false,
  servicesBar: true,
  cta: true,
};

export const DISABLED_WEBSITE_ROUTES = [
  { paths: ["/about"], enabled: WEBSITE_MODULE_FLAGS.about },
  { paths: ["/services"], enabled: WEBSITE_MODULE_FLAGS.services },
  { paths: ["/shop"], enabled: WEBSITE_MODULE_FLAGS.shop },
  { paths: ["/astrologers"], enabled: WEBSITE_MODULE_FLAGS.astrologers },
  { paths: ["/login", "/register"], enabled: ADMIN_MODULE_FLAGS.login },
];
