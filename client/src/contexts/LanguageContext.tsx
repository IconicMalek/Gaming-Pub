import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "ar";

type LanguageContextValue = {
  language: Language;
  direction: "ltr" | "rtl";
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.en) => string;
};

const translations = {
  en: {
    games: "GAMES",
    movies: "MOVIES",
    series: "SERIES",
    hardware: "HARDWARE",
    request: "REQUEST",
    account: "ACCOUNT",
    adminAccount: "ADMIN ACCOUNT",
    exploreCatalog: "Explore the catalog",
    requestTitle: "Request a title",
    search: "Search",
    cart: "Cart",
    shareOnWhatsApp: "Share on WhatsApp",
    language: "العربية",
  },
  ar: {
    games: "الألعاب",
    movies: "الأفلام",
    series: "المسلسلات",
    hardware: "الأجهزة",
    request: "طلب",
    account: "الحساب",
    adminAccount: "حساب الإدارة",
    exploreCatalog: "استكشف الكتالوج",
    requestTitle: "اطلب عنواناً",
    search: "بحث",
    cart: "السلة",
    shareOnWhatsApp: "مشاركة عبر واتساب",
    language: "English",
  },
} as const;

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("gaming-pub-language") as Language) || "en");
  const direction: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    localStorage.setItem("gaming-pub-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);
  const value = useMemo(() => ({ language, direction, toggleLanguage: () => setLanguage((current) => current === "en" ? "ar" : "en"), setLanguage, t: (key: keyof typeof translations.en) => translations[language][key] }), [direction, language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
