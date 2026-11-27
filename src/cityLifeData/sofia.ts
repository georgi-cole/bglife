import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 1213134,
  climate: "basin",
  places: [t("квартал „Младост“", "Mladost district"), t("алеите край Панчаревското езеро", "the paths around Lake Pancharevo")],
  childhood: {
    body: t("В „Младост“ още не помниш номера на блока, но можеш да покажеш на другите по коя алея да стигнат.", "In Mladost you still don’t know the block number, but you can tell everyone which path gets them there."),
    line: t("„Айде на метрото. Ще те чакам откъм квартала.“", "“Let’s meet at the Metro. I’ll wait at the neighbourhood entrance.”"),
  },
  occasion: {
    months: [9], day: 17,
    body: t("За Деня на София се правят маршрути между градските събития. Група приятели предлага да се придвижите заедно между два квартала.", "Routes are being planned between events for Sofia City Day. Friends suggest travelling between two neighbourhoods together."),
    source: "https://www.sofia.bg/en/w/7865143",
  },
  story: {
    through: 16,
    opening: {
      title: t("Две гимназии, два маршрута", "Two schools, two routes"),
      body: t("След VII клас сравняваш две гимназии и държиш в ръка две разписания. Едното оставя време за клуб, другото за среща с приятел.", "You’re comparing two secondary schools with two timetables in hand. One leaves time for a club, the other for a friend."),
      task: t("Сравни маршрутите с метрото", "Compare the Metro routes"),
      outcome: t("Мина и по двата пътя. Намери прекачване, което ти оставя време и за клуба, и за срещата.", "You tried both routes and found a connection that left time for the club and the meet-up."),
    },
    continuation: {
      title: t("Карта за новите в квартала", "A map for newcomers"),
      body: t("В клуба запомниха как си сравнил маршрутите. Молят те да направиш карта за хора, които още не познават района.", "The club remembers how you compared the routes. They ask you to make a map for people new to the area."),
      task: t("Направи карта от спирката", "Map the route from the stop"),
      outcome: t("Провери я с човек, който идва за първи път. Когато се обърка на изхода, добави и знака, който се вижда оттам.", "You tested it with someone visiting for the first time. When they got lost at the exit, you added the sign visible from there."),
    },
  },
  community: {
    title: t("Между блока и метрото", "Between the block and the Metro"),
    body: t("Съседи сравняват два пешеходни маршрута до станцията в „Младост“. Единият има по-малко пресичания, другият е осветен вечер.", "Neighbours compare two walks to a Metro station in Mladost. One has fewer crossings; the other stays lit at night."),
  },
} satisfies CityLifeProfile;
