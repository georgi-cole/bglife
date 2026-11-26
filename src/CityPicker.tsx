import { cities, cityIds, isCity, type City } from "./cities.ts";
import type { Language } from "./session.ts";

export function CityPicker({ id, city, language, onChange, disabled }: {
  id: string; city: City; language: Language; onChange: (city: City) => void; disabled?: boolean;
}) {
  const option = (id: City) => <option value={id} key={id}>{cities[id].name[language]}</option>;
  return <select id={id} value={city} disabled={disabled} onChange={event => {
    const next = event.currentTarget.value;
    if (isCity(next)) onChange(next);
  }}>
    <optgroup label={language === "bg" ? "Областни центрове" : "District centres"}>
      {cityIds.filter(id => cities[id].districtCentre !== false).map(option)}
    </optgroup>
    <optgroup label={language === "bg" ? "Други градове" : "Other towns"}>
      {cityIds.filter(id => cities[id].districtCentre === false).map(option)}
    </optgroup>
  </select>;
}
