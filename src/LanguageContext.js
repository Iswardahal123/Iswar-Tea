import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./languages";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem("appLang") || null);

  const setLang = (l) => {
    localStorage.setItem("appLang", l);
    setLangState(l);
  };

  const t = lang ? translations[lang] : null;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
