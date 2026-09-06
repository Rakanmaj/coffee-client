import { Sparkles, Heart } from "lucide-react";
import { girlsDaySettings } from "../../data/girlsDayCopy";
import StoryCanvas from "./StoryCanvas";
import TemplateSelector from "./TemplateSelector";
import DrinkSelector from "./DrinkSelector";
import PhotoControls from "./PhotoControls";

export default function StoryEditor({ copy, photo, position, onPositionChange, template, onTemplateChange, drink, onDrinkChange,
  name, onNameChange, stageRef, onReady, assetError, onAssetError, ready, onRetry, canvasKey, onUpload, onRemove, onCreate, loading, exporting }) {
  return <section className="gdEditor" aria-labelledby="gdEditorTitle" aria-busy={loading || exporting}>
    <div className="gdEditorHeading">
      <p className="gdEyebrow">{copy.campaign}</p>
      <h1 id="gdEditorTitle" tabIndex={-1}>{copy.editorTitle}</h1>
      <p>{copy.editorAccent}</p>
    </div>
    <div className="gdEditorLayout">
      <div className="gdPreviewColumn">
        <StoryCanvas key={canvasKey} stageRef={stageRef} photo={photo} position={position} onPositionChange={onPositionChange} template={template} drink={drink}
          name={name} copy={copy} onReady={onReady} onAssetError={onAssetError} onUpload={onUpload} interactionDisabled={loading || exporting} />
        <p className="gdGestureHint">{photo ? copy.positionHint : copy.upload}</p>
        <PhotoControls photo={photo} position={position} onChange={onPositionChange} onReplace={onUpload} onRemove={onRemove} copy={copy} loading={loading || exporting} />
      </div>
      <div className="gdOptionsColumn">
        <ol className="gdSteps" aria-label={copy.editorTitle}>{copy.steps.map((step, index) => <li key={step} className={index === 1 ? "isActive" : ""} aria-current={index === 1 ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol>
        <fieldset className="gdEditorFields" disabled={loading || exporting}>
          <TemplateSelector value={template.id} onChange={onTemplateChange} copy={copy} />
          <div className="gdNameField">
            <div className="gdLabelRow"><label htmlFor="gdName">{copy.nameLabel}</label><span>{copy.optional}</span></div>
            <input id="gdName" type="text" autoComplete="given-name" dir="auto" placeholder={copy.namePlaceholder} value={name} maxLength={girlsDaySettings.maxNameLength * 2}
              onChange={(event) => onNameChange(Array.from(event.target.value.replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, "")).slice(0, girlsDaySettings.maxNameLength).join(""))} />
          </div>
          <DrinkSelector value={drink.id} onChange={onDrinkChange} copy={copy} />
        </fieldset>
        {assetError && <div className="gdNotice" role="alert">{copy.assetError}<button type="button" className="gdTextButton" onClick={onRetry}>{copy.retry}</button></div>}
        <div className="gdCreateBar">
          <button type="button" className="gdButton gdButton--primary" onClick={onCreate} disabled={!ready || exporting || loading || assetError}><Sparkles size={18} aria-hidden="true" />{exporting ? copy.creating : copy.create}</button>
          <p className="gdPrivacy"><Heart size={13} aria-hidden="true" />{copy.privacy}</p>
        </div>
      </div>
    </div>
  </section>;
}
