import React from "react";
import type { GameState } from "./engine.ts";
import type { Language } from "./session.ts";

const paths = {
  journal:"M4 4h13a2 2 0 0 1 2 2v14H6a3 3 0 0 1-3-3V6a2 2 0 0 1 1-2Zm0 12h15M7 8h8m-8 3h6",
  people:"M15 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m14-6a4 4 0 0 1 3 4v2M13 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm3-3a3.5 3.5 0 0 1 0 7",
  places:"m3 5 6-2 6 2 6-2v15l-6 3-6-3-6 2V5Zm6-2v15m6-13v16",
  album:"M5 3h14v18H5zM8 6h8v7H8zM8 17h7",
  pin:"M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Zm-5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  right:"M4 12h15m-6-6 6 6-6 6", next:"m9 5 7 7-7 7", back:"m15 5-7 7 7 7", close:"m6 6 12 12M18 6 6 18",
  home:"m3 11 9-8 9 8M6 9v11h12V9m-8 11v-7h4v7",
  menu:"M4 6h16M4 12h16M4 18h16", more:"M5 12h.01m6.99 0h.01m6.99 0h.01", plus:"M12 5v14M5 12h14",
  help:"M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.1 9a3 3 0 1 1 5.3 2c-1.3 1-2.4 1.5-2.4 3m0 3h.01",
  wallet:"M3 7h17v13H3zM3 7V5l14-3v5m-2 5h6v4h-6z",
  clock:"M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2",
  settings:"M4 7h5m5 0h6M4 17h9m5 0h2M13 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  key:"M12 8a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0h9m-3 0v4m-3-4v2",
  check:"m4 12 5 5L20 6", leaf:"M4 20C1 6 11 4 21 3c0 8-3 18-14 15m-3 3L16 8",
  bag:"M3 7h18v13H3zM8 7V4h8v3m-13 6h18", down:"m5 9 7 7 7-7",
  heart:"M20.5 6.2a4.8 4.8 0 0 0-6.8 0L12 7.9l-1.7-1.7a4.8 4.8 0 0 0-6.8 6.8L12 21l8.5-8a4.8 4.8 0 0 0 0-6.8Z",
  phone:"M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 14h4",
  eye:"M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  shoes:"m3 10 5 2 2-4 3 3 2 4 5 1a2 2 0 0 1 0 4H5a2 2 0 0 1-2-2v-8Zm9 3 2-1m-1 4 2-1",
  bolt:"m13 2-9 12h7l-1 8 10-12h-7l1-8Z",
  flight:"M22 3 9 16m0 0-6-2 3-3 4 1 5-5-7-3 3-2 6 3 2-2c1.1-1.1 2-1 3 0Zm-6 9-1 2 1 4-3 3-2-6",
  scissors:"M20 4 8 16m12 4-8-8M8 8l2 2M8 16a3 3 0 1 0 0 4 3 3 0 0 0 0-4ZM8 4a3 3 0 1 0 0 4 3 3 0 0 0 0-4Z",
  sparkle:"M12 3c0 6-3 9-9 9 6 0 9 3 9 9 0-6 3-9 9-9-6 0-9-3-9-9ZM18 3v4m-2-2h4",
  food:"M4 3v6a3 3 0 0 0 6 0V3m-3 0v18M20 3c-3 1-4 4-4 8v2h4m0-10v18",
  music:"M9 18V6l12-3v12M9 18c0 1.4-1.6 2.5-3.5 2.5S2 19.4 2 18s1.6-2.5 3.5-2.5S9 16.6 9 18Zm12-3c0 1.4-1.6 2.5-3.5 2.5S14 16.4 14 15s1.6-2.5 3.5-2.5S21 13.6 21 15Z",
  photo:"M3 5h18v14H3zm0 12 5-5 4 4 3-3 6 5M16 9h.01",
  video:"M3 5h18v14H3zm7 4 5 3-5 3Z",
  live:"M5.5 5.5a9.2 9.2 0 0 0 0 13m13-13a9.2 9.2 0 0 1 0 13M8.5 8.5a5 5 0 0 0 0 7m7-7a5 5 0 0 1 0 7M12 12h.01",
  ring:"m8 5 2-2h4l2 2-4 4Zm4 16a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z",
  sun:"M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
};
export type IconName = keyof typeof paths;
export function Icon({ name, size=20 }: { name: IconName; size?:number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
export function NavigationButton({label,onClick,back=false}: {label:string;onClick:()=>void;back?:boolean}) {
  return <button type="button" className="navigation-button" aria-label={label} onClick={onClick}>
    <span className="navigation-button-face"><Icon name={back?"back":"close"} size={15}/></span>
  </button>;
}
export function MenuTitle({children,onClose,closeLabel,back=false}: {children:React.ReactNode;onClose:()=>void;closeLabel:string;back?:boolean}) {
  return <div className="menu-title-row">
    <NavigationButton label={closeLabel} onClick={onClose} back={back}/>
    {children}
  </div>;
}
export function PlaySymbol() {
  return <span className="play-symbol" aria-hidden="true"/>;
}
export const copy = (l:Language, bg:string, en:string) => l==="bg"?bg:en;
export const town = (s:GameState["city"],l:Language) => s==="sofia"?copy(l,"София","Sofia"):copy(l,"Трявна","Tryavna");
export const name = (l:Language) => copy(l,"Мила Николова","Mila Nikolova");
export const ageLabel=(age:number,l:Language)=>copy(l,age+" г.","Age "+age);
export const money = (cents:number,l:Language) => new Intl.NumberFormat(l==="bg"?"bg-BG":"en-IE",{style:"currency",currency:"EUR",minimumFractionDigits:cents%100===0?0:2, maximumFractionDigits:2}).format(cents/100);
export const occupation = (career:GameState["career"],l:Language) => career==="student"?copy(l,"Ученичка","Student"):career==="woodcarver"?copy(l,"Дърворезбарка","Woodcarver"):copy(l,"Софтуерно тестване","Software QA");
export const homeName=(s:GameState,l:Language)=>({home:copy(l,"Семейният дом","Family home"),rumi:copy(l,"При леля Руми","Aunt Rumi’s flat"),shared:copy(l,"Споделена квартира","Shared flat")})[s.housing];
export type Tab = "journal"|"people"|"places"|"more"|"album";
export const tabLabels=(l:Language):Record<Tab,string>=>({journal:copy(l,"Живот","Life"),people:copy(l,"Хора","People"),places:copy(l,"Места","Places"),more:copy(l,"Още","More"),album:copy(l,"Албум","Album")});
export const lifeStatLabels=(l:Language):Record<keyof GameState["stats"],string>=>({
  health:copy(l,"Здраве","Health"),
  looks:copy(l,"Визия","Looks"),
  joy:copy(l,"Радост","Joy"),
  brains:copy(l,"Ум","Brains"),
  influence:copy(l,"Влияние","Influence"),
});
