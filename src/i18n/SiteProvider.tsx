import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { subscribeSettings } from "../services/settings";
import {
  defaultLanguageRecords,
  subscribeLanguages,
  subscribeTranslations,
  translationStorageKey,
} from "../services/languages";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type LanguageRecord,
  type TranslationValues,
} from "../types";
import { CONTENT_BY_KEY, contentDefault } from "./content";
import { UI_BY_SOURCE } from "./uiCatalog";
import { translateDynamic } from "./dynamic";

const LANGUAGE_STORAGE_KEY = "blasting-number.language";
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title"] as const;

interface SiteContextValue {
  settings: AppSettings;
  settingsReady: boolean;
  settingsError: string | null;
  languages: LanguageRecord[];
  activeLanguages: LanguageRecord[];
  languagesReady: boolean;
  languagesError: string | null;
  translations: TranslationValues;
  translationsReady: boolean;
  translationsError: string | null;
  language: LanguageRecord;
  languageCode: string;
  direction: "ltr" | "rtl";
  setLanguage: (code: string) => void;
  content: (key: string, vars?: Record<string, string | number>) => string;
  contentFor: (key: string, languageCode: string) => string;
  ui: (source: string) => string;
  uiFor: (source: string, languageCode: string) => string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function cloneDefaults(): AppSettings {
  return { ...DEFAULT_SETTINGS, features: { ...DEFAULT_SETTINGS.features } };
}

function applyVars(value: string, vars?: Record<string, string | number>): string {
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

function translateWhitespacePreserving(source: string, translate: (core: string) => string): string {
  const core = source.trim();
  if (!core) return source;
  const start = source.indexOf(core);
  const end = start + core.length;
  return `${source.slice(0, start)}${translate(core)}${source.slice(end)}`;
}

interface TextState {
  source: string;
  applied: string;
}

interface AttributeState {
  source: string;
  applied: string;
}

const textStates = new WeakMap<Text, TextState>();
const attributeStates = new WeakMap<Element, Map<string, AttributeState>>();

export function SiteProvider({ children }: { children: ReactNode }): ReactNode {
  const [settings, setSettings] = useState<AppSettings>(cloneDefaults);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageRecord[]>(defaultLanguageRecords);
  const [languagesReady, setLanguagesReady] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationValues>({});
  const [translationsReady, setTranslationsReady] = useState(false);
  const [translationsError, setTranslationsError] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState(() => readStoredLanguage());

  useEffect(() => {
    const unsubscribe = subscribeSettings(
      (next) => {
        setSettings(next);
        setSettingsError(null);
        setSettingsReady(true);
      },
      (error) => {
        setSettingsError(error instanceof Error ? error.message : "settings-unavailable");
        setSettingsReady(true);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeLanguages(
      (next) => {
        setLanguages(next);
        setLanguagesError(null);
        setLanguagesReady(true);
      },
      (error) => {
        setLanguagesError(error instanceof Error ? error.message : "languages-unavailable");
        setLanguagesReady(true);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeTranslations(
      (next) => {
        setTranslations(next);
        setTranslationsError(null);
        setTranslationsReady(true);
      },
      (error) => {
        setTranslationsError(error instanceof Error ? error.message : "translations-unavailable");
        setTranslationsReady(true);
      },
    );
    return unsubscribe;
  }, []);

  const activeLanguages = useMemo(
    () => languages.filter((entry) => entry.status === "active"),
    [languages],
  );

  const language = useMemo(() => {
    return (
      activeLanguages.find((entry) => entry.code === languageCode) ??
      activeLanguages.find((entry) => entry.isDefault) ??
      activeLanguages.find((entry) => entry.code === "en") ??
      activeLanguages[0] ??
      defaultLanguageRecords()[0]
    );
  }, [activeLanguages, languageCode]);

  useEffect(() => {
    if (!languagesReady || activeLanguages.length === 0) return;
    if (!languageCode) return;
    if (activeLanguages.some((entry) => entry.code === languageCode)) return;
    setLanguageCode("");
    try {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private mode.
    }
  }, [activeLanguages, languageCode, languagesReady]);

  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.direction;
  }, [language.code, language.direction]);

  const setLanguage = useCallback(
    (code: string) => {
      if (!activeLanguages.some((entry) => entry.code === code)) return;
      setLanguageCode(code);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      } catch {
        // Storage can be unavailable in private mode.
      }
    },
    [activeLanguages],
  );

  const contentFor = useCallback(
    (key: string, code: string): string => {
      const stored = translations[translationStorageKey(key)]?.[code];
      if (typeof stored === "string" && stored.trim()) return stored;
      const english = translations[translationStorageKey(key)]?.en;
      if (typeof english === "string" && english.trim()) return english;
      return contentDefault(key, code);
    },
    [translations],
  );

  const content = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const field = CONTENT_BY_KEY.get(key);
      const stored = translations[translationStorageKey(key)]?.[language.code];
      const english = translations[translationStorageKey(key)]?.en;
      const fallback =
        (typeof stored === "string" && stored.trim() ? stored : "") ||
        (typeof english === "string" && english.trim() ? english : "") ||
        (field ? contentDefault(key, language.code) : "");
      return applyVars(fallback, vars);
    },
    [language.code, translations],
  );

  const uiFor = useCallback(
    (source: string, code: string): string => {
      const entry = UI_BY_SOURCE.get(source);
      if (!entry) return translateDynamic(source, code) ?? source;
      const stored = translations[translationStorageKey(entry.key)]?.[code];
      if (typeof stored === "string" && stored.trim()) return stored;
      return code === "bn" ? entry.bn : entry.en;
    },
    [translations],
  );

  const ui = useCallback(
    (source: string): string => uiFor(source, language.code),
    [language.code, uiFor],
  );

  useEffect(() => {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content("site.description"));
  }, [content]);

  useEffect(() => {
    const translateText = (node: Text) => {
      if (!node.nodeValue) return;
      const existing = textStates.get(node);
      const source = existing && node.nodeValue === existing.applied ? existing.source : node.nodeValue;
      const value = translateWhitespacePreserving(source, (core) => {
        const entry = UI_BY_SOURCE.get(core);
        if (entry) {
          const stored = translations[translationStorageKey(entry.key)]?.[language.code];
          if (typeof stored === "string" && stored.trim()) return stored;
          return language.code === "bn" ? entry.bn : entry.en;
        }
        return translateDynamic(core, language.code) ?? core;
      });
      textStates.set(node, { source, applied: value });
      if (node.nodeValue !== value) node.nodeValue = value;
    };

    const translateElement = (element: Element) => {
      if (
        element.closest("[data-no-translate]") ||
        element.getAttribute("contenteditable") === "true"
      ) {
        return;
      }
      let states = attributeStates.get(element);
      if (!states) {
        states = new Map();
        attributeStates.set(element, states);
      }
      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const raw = element.getAttribute(attribute);
        if (!raw) continue;
        const existing = states.get(attribute);
        const source = existing && raw === existing.applied ? existing.source : raw;
        const value = translateWhitespacePreserving(source, (core) => {
          const entry = UI_BY_SOURCE.get(core);
          if (entry) {
            const stored = translations[translationStorageKey(entry.key)]?.[language.code];
            if (typeof stored === "string" && stored.trim()) return stored;
            return language.code === "bn" ? entry.bn : entry.en;
          }
          return translateDynamic(core, language.code) ?? core;
        });
        states.set(attribute, { source, applied: value });
        if (raw !== value) element.setAttribute(attribute, value);
      }
    };

    const applyAll = () => {
      const root = document.body;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        const text = node as Text;
        if (!(text.parentElement?.closest("script,style,[data-no-translate]"))) {
          translateText(text);
        }
        node = walker.nextNode();
      }
      root.querySelectorAll("*").forEach(translateElement);
    };

    applyAll();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const parent = mutation.target.parentElement;
          if (!parent?.closest("script,style,[data-no-translate]")) {
            translateText(mutation.target as Text);
          }
        } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateElement(mutation.target);
        } else if (mutation.type === "childList") {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) {
              translateText(added as Text);
            } else if (added instanceof Element) {
              if (added.matches("script,style,[data-no-translate]")) continue;
              translateElement(added);
              const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
              let child: Node | null = walker.nextNode();
              while (child) {
                translateText(child as Text);
                child = walker.nextNode();
              }
              added.querySelectorAll("*").forEach(translateElement);
            }
          }
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });
    return () => observer.disconnect();
  }, [language.code, translations]);

  const value = useMemo<SiteContextValue>(
    () => ({
      settings,
      settingsReady,
      settingsError,
      languages,
      activeLanguages,
      languagesReady,
      languagesError,
      translations,
      translationsReady,
      translationsError,
      language,
      languageCode: language.code,
      direction: language.direction,
      setLanguage,
      content,
      contentFor,
      ui,
      uiFor,
    }),
    [
      settings,
      settingsReady,
      settingsError,
      languages,
      activeLanguages,
      languagesReady,
      languagesError,
      translations,
      translationsReady,
      translationsError,
      language,
      setLanguage,
      content,
      contentFor,
      ui,
      uiFor,
    ],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used inside <SiteProvider>");
  return context;
}
