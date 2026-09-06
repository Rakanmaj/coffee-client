import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { AnimatePresence, MotionConfig, motion as Motion, useReducedMotion } from "framer-motion";
import { girlsDayCopy, girlsDaySettings } from "../../data/girlsDayCopy";
import { girlsDayTemplates, GIRLS_DAY_LOGO } from "../../data/girlsDayTemplates";
import { girlsDayDrinks } from "../../data/girlsDayDrinks";
import { INITIAL_POSITION } from "../../utils/girlsDay/photoGeometry";
import { useLocalPhoto } from "../../hooks/useLocalPhoto";
import { useStoryExport } from "../../hooks/useStoryExport";
import LandingScreen from "../../components/girls-day/LandingScreen";
import StoryResult from "../../components/girls-day/StoryResult";
import "./GirlsDayStory.css";

const StoryEditor = lazy(() => import("../../components/girls-day/StoryEditor"));

export default function GirlsDayStory() {
  const copy = girlsDayCopy[girlsDaySettings.language] || girlsDayCopy.en;
  const reducedMotion = useReducedMotion();
  const [screen, setScreen] = useState("landing");
  const [templateId, setTemplateId] = useState("pink");
  const [drinkId, setDrinkId] = useState("latte");
  const [name, setName] = useState("");
  const [position, setPosition] = useState({ ...INITIAL_POSITION });
  const [ready, setReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const uploader = useRef(null);
  const main = useRef(null);
  const stageRef = useRef(null);
  const localPhoto = useLocalPhoto();
  const exporter = useStoryExport(stageRef);
  const template = girlsDayTemplates.find((item) => item.id === templateId) || girlsDayTemplates[0];
  const drink = girlsDayDrinks.find((item) => item.id === drinkId) || girlsDayDrinks[0];

  useEffect(() => {
    const previousTitle = document.title;
    const previousLanguage = document.documentElement.lang;
    const previousDirection = document.documentElement.dir;
    document.title = copy.pageTitle;
    document.documentElement.lang = copy.locale;
    document.documentElement.dir = copy.direction;
    document.body.classList.add("girlsDayBody");
    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLanguage;
      document.documentElement.dir = previousDirection;
      document.body.classList.remove("girlsDayBody");
    };
  }, [copy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    main.current?.focus({ preventScroll: true });
  }, [screen]);

  const upload = () => uploader.current?.click();
  const receivePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (await localPhoto.select(file)) {
      setPosition({ ...INITIAL_POSITION });
      setReady(false);
      setScreen("editor");
    }
  };
  const create = async () => {
    if (!ready || !localPhoto.photo || assetError || localPhoto.loading) return;
    if (await exporter.generate(name, drinkId)) setScreen("result");
  };
  const changeTemplate = useCallback((id) => { setReady(false); setTemplateId(id); }, []);
  const changeDrink = useCallback((id) => { setReady(false); setDrinkId(id); }, []);
  const error = localPhoto.error || (screen === "editor" && exporter.error);

  return <MotionConfig reducedMotion="user"><div className="gdPage" dir={copy.direction}>
    <header className="gdHeader">
      <Link className="gdBrand" to="/moment" aria-label={copy.backToCafe}><img src={GIRLS_DAY_LOGO} width="42" height="42" alt={copy.logoAlt} /><span>{copy.brand}</span></Link>
      <span className="gdHeaderCampaign">{copy.campaign}<Heart size={13} aria-hidden="true" /></span>
      {screen !== "landing" && <button type="button" className="gdIconButton" title={copy.back} aria-label={copy.back} disabled={exporter.exporting} onClick={() => setScreen(screen === "result" ? "editor" : "landing")}><ArrowLeft size={19} aria-hidden="true" /></button>}
    </header>
    <input ref={uploader} className="gdSrOnly" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,image/bmp" aria-label={copy.upload} tabIndex={-1} onChange={receivePhoto} />
    <main ref={main} tabIndex={-1}>
      {error && <div className="gdNotice gdPageNotice" role="alert">{copy[error] || copy.imageDecodeError}</div>}
      {localPhoto.loading && <p className="gdProcessing" role="status">{copy.photoBusy}</p>}
      <AnimatePresence mode="wait" initial={false}>
        <Motion.div key={screen} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.08 : 0.18 }}>
          {screen === "landing" && <LandingScreen copy={copy} onStart={localPhoto.photo ? () => setScreen("editor") : upload} loading={localPhoto.loading} />}
          {screen === "editor" && <Suspense fallback={<p className="gdProcessing" role="status">{copy.fontLoading}</p>}><StoryEditor copy={copy} photo={localPhoto.photo} position={position} onPositionChange={setPosition} template={template} onTemplateChange={changeTemplate}
            drink={drink} onDrinkChange={changeDrink} name={name} onNameChange={setName} stageRef={stageRef} onReady={setReady} ready={ready} assetError={assetError} onAssetError={setAssetError}
            onRetry={() => setCanvasKey((key) => key + 1)} canvasKey={canvasKey} onUpload={upload} onRemove={() => { localPhoto.remove(); setReady(false); setPosition({ ...INITIAL_POSITION }); }}
            onCreate={create} loading={localPhoto.loading} exporting={exporter.exporting} /></Suspense>}
          {screen === "result" && exporter.story && <StoryResult copy={copy} story={exporter.story} onAgain={() => setScreen("editor")} />}
        </Motion.div>
      </AnimatePresence>
    </main>
  </div></MotionConfig>;
}
