import React, { createContext, useContext, useState } from "react";
import { translations } from "./languages";

const LanguageContext = createContext();

const getSavedLang = () => {
  try { return localStorage.getItem("appLang") || "as"; }
  catch (e) { return "as"; }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = (l) => {
    try { localStorage.setItem("appLang", l); } catch (e) {}
    setLangState(l);
  };

  const t = translations[lang] || translations["as"];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
