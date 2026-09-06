import { Check } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { girlsDayTemplates } from "../../data/girlsDayTemplates";

export default function TemplateSelector({ value, onChange, copy }) {
  return <fieldset className="gdFieldset">
    <legend>{copy.chooseStyle}</legend>
    <div className="gdTemplates">
      {girlsDayTemplates.map((template) => <label key={template.id} className={`gdTemplate ${value === template.id ? "isSelected" : ""}`}>
        <input className="gdSrOnly" type="radio" name="story-template" value={template.id} checked={value === template.id} onChange={() => onChange(template.id)} />
        <Motion.div className="gdTemplateArt" style={{ backgroundColor: template.background }} whileTap={{ scale: 0.97 }}>
          <img src={template.thumbnail} alt="" width="90" height="124" />
          {value === template.id && <span className="gdSelectionCheck"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>}
        </Motion.div>
        <span>{copy.templateNames[template.id]}</span>
      </label>)}
    </div>
  </fieldset>;
}
