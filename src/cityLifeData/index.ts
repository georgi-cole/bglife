import type { City } from "../cities.ts";
import type { CityLifeProfile } from "../cityLifeModel.ts";
import blagoevgrad from "./blagoevgrad.ts";
import burgas from "./burgas.ts";
import dobrich from "./dobrich.ts";
import gabrovo from "./gabrovo.ts";
import haskovo from "./haskovo.ts";
import kardzhali from "./kardzhali.ts";
import kyustendil from "./kyustendil.ts";
import lovech from "./lovech.ts";
import montana from "./montana.ts";
import pazardzhik from "./pazardzhik.ts";
import pernik from "./pernik.ts";
import pleven from "./pleven.ts";
import plovdiv from "./plovdiv.ts";
import razgrad from "./razgrad.ts";
import ruse from "./ruse.ts";
import samokov from "./samokov.ts";
import shumen from "./shumen.ts";
import silistra from "./silistra.ts";
import sliven from "./sliven.ts";
import smolyan from "./smolyan.ts";
import sofia from "./sofia.ts";
import staraZagora from "./stara-zagora.ts";
import targovishte from "./targovishte.ts";
import tryavna from "./tryavna.ts";
import varna from "./varna.ts";
import velikoTarnovo from "./veliko-tarnovo.ts";
import vidin from "./vidin.ts";
import vratsa from "./vratsa.ts";
import yambol from "./yambol.ts";

export const cityLifeData: Record<City, CityLifeProfile> = {
  blagoevgrad,
  burgas,
  dobrich,
  gabrovo,
  haskovo,
  kardzhali,
  kyustendil,
  lovech,
  montana,
  pazardzhik,
  pernik,
  pleven,
  plovdiv,
  razgrad,
  ruse,
  samokov,
  shumen,
  silistra,
  sliven,
  smolyan,
  sofia,
  "stara-zagora": staraZagora,
  targovishte,
  tryavna,
  varna,
  "veliko-tarnovo": velikoTarnovo,
  vidin,
  vratsa,
  yambol,
};
