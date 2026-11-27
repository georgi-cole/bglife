import { cities, cityIds, isCity, type City } from "./cities.ts";
import type { Language } from "./session.ts";

export function CityPicker({ id, city, language, onChange, disabled, allowRandom = false }: {
  id: string; city: City; language: Language; onChange: (city: City) => void; disabled?: boolean; allowRandom?: boolean;
}) {
  const sorted = [...cityIds].sort((a, b) => cities[a].name[language].localeCompare(cities[b].name[language], language));
  const option = (id: City) => <option value={id} key={id}>{cities[id].name[language]}</option>;
  return <select id={id} value={city} disabled={disabled} onChange={event => {
    const next = event.currentTarget.value;
    if (next === "random" && allowRandom) {
      const others = cityIds.filter(id => id !== city);
      onChange(others[Math.floor(Math.random() * others.length)]);
    } else if (isCity(next)) onChange(next);
  }}>
    {allowRandom && <option value="random">{language === "bg" ? "Случаен град" : "Random city"}</option>}
    <optgroup label={language === "bg" ? "Областни центрове" : "District centres"}>
      {sorted.filter(id => cities[id].districtCentre !== false).map(option)}
    </optgroup>
    <optgroup label={language === "bg" ? "Други градове" : "Other towns"}>
      {sorted.filter(id => cities[id].districtCentre === false).map(option)}
    </optgroup>
  </select>;
}
