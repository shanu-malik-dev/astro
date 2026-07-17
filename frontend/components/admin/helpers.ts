import { PROBLEM_LANGUAGES } from "./constants";
import type { AstrologerRow, Problem, ServiceRow, Translation } from "./types";

export function createEmptyTranslations() {
  return PROBLEM_LANGUAGES.map((language) => ({
    lang: language.lang,
    label: language.label,
    name: "",
  }));
}

export function createEmptyServiceTranslations() {
  return PROBLEM_LANGUAGES.map((language) => ({
    lang: language.lang,
    label: language.label,
    name: "",
    description: "",
  }));
}

export function syncTranslations(problem: Problem): Problem {
  const existing = new Map(
    problem.translations.map((translation) => [translation.lang, translation])
  );

  return {
    ...problem,
    translations: PROBLEM_LANGUAGES.map((language) => {
      const current = existing.get(language.lang);

      return {
        lang: language.lang,
        label: language.label,
        name: current?.name || "",
      };
    }),
  };
}

export function syncServiceTranslations(service: ServiceRow): ServiceRow {
  const oldService = service as ServiceRow & {
    name?: string;
    description?: string;
  };
  const existing = new Map(
    (service.translations || []).map((translation) => [
      translation.lang,
      translation,
    ])
  );

  return {
    ...service,
    translations: PROBLEM_LANGUAGES.map((language) => {
      const current = existing.get(language.lang);

      return {
        lang: language.lang,
        label: language.label,
        name:
          current?.name ||
          (language.lang === "en" ? oldService.name || "" : ""),
        description:
          current?.description ||
          (language.lang === "en" ? oldService.description || "" : ""),
      };
    }),
  };
}

export function syncAstrologerTranslations(
  astrologer: AstrologerRow
): AstrologerRow {
  const oldAstrologer = astrologer as AstrologerRow & {
    name?: string;
    expertise?: string;
    description?: string;
  };
  const existing = new Map(
    (astrologer.translations || []).map((translation) => [
      translation.lang,
      translation,
    ])
  );

  return {
    ...astrologer,
    translations: PROBLEM_LANGUAGES.map((language) => {
      const current = existing.get(language.lang);

      return {
        lang: language.lang,
        label: language.label,
        name:
          current?.name ||
          (language.lang === "en" ? oldAstrologer.name || "" : ""),
        expertise:
          current?.expertise ||
          (language.lang === "en" ? oldAstrologer.expertise || "" : ""),
        description:
          current?.description ||
          (language.lang === "en" ? oldAstrologer.description || "" : ""),
      };
    }),
  };
}

export function getEnglishTranslation<T extends Translation>(translations: T[]) {
  return translations.find((item) => item.lang === "en") || translations[0];
}
