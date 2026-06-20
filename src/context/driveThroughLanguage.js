import { createContext, useContext } from "react";

export const DriveThroughLanguageContext = createContext(null);

export function useDriveThroughLanguage() {
  const context = useContext(DriveThroughLanguageContext);
  if (!context) {
    throw new Error("useDriveThroughLanguage must be used inside DriveThroughLanguageProvider");
  }
  return context;
}
