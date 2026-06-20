import React from "react";
import DriveLanguageSwitch from "./DriveLanguageSwitch";
import { useDriveThroughLanguage } from "../context/driveThroughLanguage";

export default function DriveThroughAvailabilityState({ state, onRetry }) {
  const { language, direction, t } = useDriveThroughLanguage();
  const is_loading = state === "loading";
  const is_disabled = state === "disabled";

  return (
    <main className="drivePage momentServicePage" lang={language} dir={direction}>
      <div className="momentServiceTopbar">
        <div className="momentMenuEyebrow">
          <span aria-hidden="true" />
          {t("brand")}
        </div>
        <DriveLanguageSwitch />
      </div>

      <section className={`momentServiceState ${is_loading ? "is-loading" : ""}`}>
        <svg className="momentServiceDrawing" viewBox="0 0 180 130" aria-hidden="true">
          <path d="M54 54h58v36c0 13-10 23-23 23H77c-13 0-23-10-23-23V54Z" />
          <path d="M112 64h9c18 0 18 27 0 27h-9" />
          <path d="M69 43c-8-9 8-13 1-25M91 43c-8-9 8-13 1-25" />
          <path className="accent" d="M45 114h93" />
          {!is_loading ? <path className="accent" d="M138 25a19 19 0 1 0 17 28 21 21 0 0 1-17-28Z" /> : null}
        </svg>

        {is_loading ? (
          <>
            <div className="momentServicePulse" aria-hidden="true" />
            <p>{t("availabilityLoading")}</p>
          </>
        ) : (
          <>
            <h1>{t(is_disabled ? "unavailableTitle" : "availabilityFailedTitle")}</h1>
            <p>{t(is_disabled ? "unavailableBody" : "availabilityFailedBody")}</p>
            {is_disabled ? <small>{t("unavailableLine")}</small> : null}
            <button className="drivePrimary momentServiceRetry" onClick={onRetry} type="button">
              {t("retry")}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
