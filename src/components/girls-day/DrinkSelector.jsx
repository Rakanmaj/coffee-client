import { Check } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { girlsDayDrinks } from "../../data/girlsDayDrinks";

export default function DrinkSelector({ value, onChange, copy }) {
  return <fieldset className="gdFieldset">
    <legend>{copy.chooseDrink}</legend>
    <div className="gdDrinks">
      {girlsDayDrinks.map((drink) => <Motion.label key={drink.id} className={`gdDrinkChoice ${value === drink.id ? "isSelected" : ""}`} whileTap={{ scale: 0.98 }}>
        <input className="gdSrOnly" type="radio" name="story-drink" value={drink.id} checked={value === drink.id} onChange={() => onChange(drink.id)} />
        <img src={drink.image} alt="" width="48" height="62" />
        <span>{copy.drinkNames[drink.id]}</span>
        <span className="gdRadioMark">{value === drink.id && <Check size={12} strokeWidth={3} aria-hidden="true" />}</span>
      </Motion.label>)}
    </div>
  </fieldset>;
}
