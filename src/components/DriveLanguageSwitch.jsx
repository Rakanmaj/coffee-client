import React from "react";
import { useDriveThroughLanguage } from "../context/driveThroughLanguage";

export default function DriveLanguageSwitch() {
  const { language, t, toggleLanguage } = useDriveThroughLanguage();

  return (
    <button
      className="momentLanguageSwitch"
      aria-label={t("switchLanguage")}
      onClick={toggleLanguage}
      type="button"
    >
      <span>{language === "en" ? "AR" : "EN"}</span>
    </button>
  );
}
