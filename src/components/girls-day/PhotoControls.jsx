import { Minus, Plus, RotateCcw, ImagePlus, Trash2 } from "lucide-react";
import { boundPosition, INITIAL_POSITION, MIN_ZOOM, MAX_ZOOM } from "../../utils/girlsDay/photoGeometry";
import { PHOTO_FRAME } from "../../data/girlsDayTemplates";

export default function PhotoControls({ photo, position, onChange, onReplace, onRemove, copy, loading }) {
  const zoom = (value) => { if (photo) onChange(boundPosition({ ...position, zoom: value }, photo, PHOTO_FRAME)); };
  return <div className="gdPhotoControls">
    <div className="gdPhotoActions">
      <button type="button" className="gdTextButton" onClick={onReplace} disabled={loading}><ImagePlus size={16} aria-hidden="true" />{photo ? copy.replace : copy.upload}</button>
      <div className="gdIconActions">
        <button type="button" className="gdIconButton" title={copy.reset} aria-label={copy.reset} disabled={!photo || loading} onClick={() => onChange({ ...INITIAL_POSITION })}><RotateCcw size={17} aria-hidden="true" /></button>
        <button type="button" className="gdIconButton" title={copy.remove} aria-label={copy.remove} disabled={!photo || loading} onClick={onRemove}><Trash2 size={17} aria-hidden="true" /></button>
      </div>
    </div>
    <div className="gdZoom">
      <button type="button" className="gdIconButton" title={copy.zoomOut} aria-label={copy.zoomOut} disabled={!photo || position.zoom <= MIN_ZOOM || loading} onClick={() => zoom(position.zoom - 0.1)}><Minus size={16} aria-hidden="true" /></button>
      <input type="range" aria-label={copy.photoZoom} min={MIN_ZOOM} max={MAX_ZOOM} step="0.01" value={position.zoom} disabled={!photo || loading} onChange={(event) => zoom(Number(event.target.value))} />
      <button type="button" className="gdIconButton" title={copy.zoomIn} aria-label={copy.zoomIn} disabled={!photo || position.zoom >= MAX_ZOOM || loading} onClick={() => zoom(position.zoom + 0.1)}><Plus size={16} aria-hidden="true" /></button>
      <output>{Math.round(position.zoom * 100)}%</output>
    </div>
  </div>;
}
