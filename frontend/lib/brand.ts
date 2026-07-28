export const BRAND = {
  name: "Shree Samriddhi Atro",
  nameHi: "श्री समृद्धि एस्ट्रो",
  logoPath: "/images/logo.png",
};

export function getBrandName(language: "en" | "hi") {
  return language === "hi" ? BRAND.nameHi : BRAND.name;
}
