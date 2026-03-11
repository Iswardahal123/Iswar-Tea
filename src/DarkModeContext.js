import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("darkMode") === "1"; }
    catch { return false; }
  });

  const toggleDark = () => {
    setDark(prev => {
      const next = !prev;
      try { localStorage.setItem("darkMode", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  useEffect(() => {
    document.body.style.background = dark ? "#0f172a" : "";
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDark = () => useContext(DarkModeContext);
