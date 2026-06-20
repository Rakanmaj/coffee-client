import React, { useEffect, useMemo, useState } from "react";
import { driveThroughTranslations } from "../i18n/driveThroughTranslations";
import { DriveThroughLanguageContext } from "./driveThroughLanguage";

function initial_language() {
  return localStorage.getItem("momentDriveLanguage") === "ar" ? "ar" : "en";
}

export function DriveThroughLanguageProvider({ children }) {
  const [language, setLanguage] = useState(initial_language);
  const direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("momentDriveLanguage", language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  useEffect(() => () => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  const value = useMemo(() => {
    const translate = (key, replacements = {}) => {
      const template = driveThroughTranslations[language][key]
        || driveThroughTranslations.en[key]
        || key;

      return Object.entries(replacements).reduce(
        (text, [name, replacement]) => text.replace(`{${name}}`, replacement),
        template
      );
    };

    return {
      language,
      direction,
      t: translate,
      toggleLanguage: () => setLanguage((current) => current === "en" ? "ar" : "en"),
    };
  }, [direction, language]);

  return (
    <DriveThroughLanguageContext.Provider value={value}>
      {children}
    </DriveThroughLanguageContext.Provider>
  );
}
