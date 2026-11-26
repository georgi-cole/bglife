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
  sun:"M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
};
export type IconName = keyof typeof paths;
export function Icon({ name, size=20 }: { name: IconName; size?:number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
export function MenuTitle({children,onClose,closeLabel,back=false}: {children:React.ReactNode;onClose:()=>void;closeLabel:string;back?:boolean}) {
  return <div className="menu-title-row">
    <button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}><Icon name={back?"back":"close"} size={20}/></button>
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
