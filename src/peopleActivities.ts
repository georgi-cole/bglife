import type {GameState,PersonId,Text} from "./engine.ts";
import type {LifeActivityDefinition,LifeSystems} from "./lifeActivities.ts";
import {childIndex,isChild,personAge,type PeopleId} from "./peopleIdentity.ts";

const t = (bg:string, en:string):Text => ({bg,en});
const contactIds = ["rumi","niki","mentor","friend","appMatch","serviceMatch","child-0","child-1"] as const;
type Context = "relative" | "cousin" | "mentor" | "friend" | "partner" | "former" | "child";

function context(s:GameState,id:PeopleId):Context|null {
  if(isChild(id))return personAge(s,id)===null?null:"child";
  const family=s.lifeSystems.family;
  if(family.partner===id)return "partner";
  if(family.formerPartners.some(entry=>entry.id===id))return "former";
  if(id==="rumi")return "relative";
  if(id==="niki")return "cousin";
  if(id==="mentor"||id==="friend")return id;
  return null;
}

type Interaction = {
  id:string;
  title:Text;
  description:Text;
  result:Text;
  bond:number;
  joy:number;
  cost?:number;
  minAge?:number;
  maxAge?:number;
};

const interaction=(id:string,title:Text,description:Text,result:Text,bond:number,joy:number,extras:Pick<Interaction,"cost"|"minAge"|"maxAge">={}):Interaction=>
  ({id,title,description,result,bond,joy,...extras});

const actions: Record<Context, Interaction[]> = {
  relative:[
    interaction("voice-note",t("Прати гласово съобщение","Send a voice note"),t("Разкажи как ти е минала седмицата.","Share how your week went."),t("Руми ти върна съобщение с новини от вкъщи.","Rumi sent back a voice note with news from home."),4,2),
    interaction("coffee",t("Кафе и баница","Coffee and banitsa"),t("Уговорете си закуска през уикенда.","Meet for breakfast over the weekend."),t("Останахте на масата, докато кафето изстина.","You stayed at the table until the coffee went cold."),7,4,{cost:800}),
  ],
  cousin:[
    interaction("game",t("Поиграйте онлайн","Play online"),t("Съберете се за един мач след училище.","Get together for a match after school."),t("Изгубихте първия мач, но с втория си върнахте резултата.","You lost the first match and evened the score in the second."),6,4,{maxAge:17}),
    interaction("gaming",t("Онлайн мач вечерта","Play an online match"),t("Уговорете се за един мач, когато и двамата сте свободни.","Find an evening when you’re both free to play."),t("След мача останахте в разговора и наваксахте с новините.","After the match you stayed on the call and caught up."),6,4,{minAge:18}),
    interaction("basketball",t("Баскетбол в квартала","Play pickup basketball"),t("Съберете се на площадката следобед.","Meet up at the local court in the afternoon."),t("Изиграхте няколко мача и уговорихте реванш.","You played a few games and agreed on a rematch."),7,5,{minAge:12}),
  ],
  friend:[
    interaction("meme",t("Прати меме","Send a meme"),t("Прати нещо, което само вие двамата бихте разбрали.","Send something only the two of you would get."),t("Отговорът беше старо меме, което си мислеше, че отдавна е забравено.","The reply was an old meme you thought had long been forgotten."),4,3),
    interaction("cinema",t("Отидете на кино","Go to the cinema"),t("Изберете филм и вземете билети.","Pick a film and get tickets."),t("На излизане спорихте за финала чак до спирката.","You argued about the ending all the way to the bus stop."),7,5,{cost:2200,minAge:15}),
  ],
  mentor:[
    interaction("feedback",t("Поискай мнение за проект","Ask for feedback on a project"),t("Прати снимка на това, по което работиш.","Send a photo of what you’re working on."),t("Стефан ти прати две конкретни идеи как да го подобриш.","Stefan sent you two specific ideas for improving it."),5,2),
    interaction("advice",t("Попитай за работа и клиенти","Ask about work and clients"),t("Чуйте се за съвет как да представиш работата си.","Have a call about how to present your work."),t("Записа си няколко неща, които да пробваш следващия път.","You wrote down a few things to try next time."),6,3),
  ],
  partner:[
    interaction("video-call",t("Видеочат вечерта","Catch up on a video call"),t("Отделете време да си поговорите на спокойствие.","Make time for a quiet conversation."),t("Поговорихте си за неща, за които през седмицата не остана време.","You found time to talk about things the week had crowded out."),7,4),
    interaction("takeaway",t("Поръчайте вечеря","Order takeaway together"),t("Изберете вечеря и си направете вечер вкъщи.","Choose something to eat and spend the evening in."),t("Пуснахте си сериал и стигнахте до следващия епизод.","You put on a series and ended up watching the next episode too."),9,6,{cost:2400,minAge:18}),
    interaction("concert",t("Вземете билети за концерт","Get concert tickets"),t("Изберете изпълнител, когото и двамата искате да чуете.","Pick an artist you both want to hear."),t("Прибрахте се с общ плейлист за следващия ден.","You went home with a playlist to share the next day."),11,8,{cost:4800,minAge:18}),
  ],
  former:[
    interaction("check-in",t("Попитай как е","Ask how they’re doing"),t("Изпрати кратко и спокойно съобщение.","Send a brief, low-pressure message."),t("Разменихте си няколко спокойни съобщения.","You exchanged a few friendly messages."),3,2),
  ],
  child:[
    interaction("park",t("Разходка в парка","Go for a park walk"),t("Излезте на въздух заедно.","Get outside for a little while together."),t("Направихте обиколка и се прибрахте спокойно.","You made a loop through the park and came home relaxed."),6,4,{maxAge:4}),
    interaction("bedtime",t("Прочети приказка","Read a bedtime story"),t("Изберете книжка преди лягане.","Pick a book to read before bedtime."),t("Четохте любимата книжка и накрая измислихте свой финал.","You read a favourite book and made up your own ending."),8,5,{maxAge:7}),
    interaction("playground",t("Отидете на площадката","Visit the playground"),t("Изберете площадка наблизо.","Pick a playground nearby."),t("Останахте да играете почти до вечеря.","You stayed out playing until nearly dinnertime."),7,5,{minAge:2,maxAge:9}),
    interaction("board-game",t("Играйте настолна игра","Play a board game"),t("Оставете телефоните и изберете игра.","Put the phones away and pick a game."),t("До последния ход никой не знаеше кой ще спечели.","Nobody knew who would win until the last turn."),8,5,{minAge:5}),
    interaction("skate",t("Излезте с колела","Go for a bike ride"),t("Изберете маршрут и се разходете заедно.","Pick a route and go for a ride together."),t("Спряхте за сладолед по пътя обратно.","You stopped for ice cream on the way back."),8,6,{cost:600,minAge:8}),
  ],
};

function changeBond(s:GameState,id:PeopleId,amount:number):LifeSystems {
  const {family}=s.lifeSystems;
  if(isChild(id)){
    const index=childIndex(id);
    const childProfiles=family.childProfiles.map((child,i)=>i===index?{...child,bond:Math.min(100,child.bond+amount)}:child);
    return {...s.lifeSystems,family:{...family,childProfiles}};
  }
  return {...s.lifeSystems,family:{...family,bond:Math.min(100,family.bond+amount)}};
}

export const peopleActivities: LifeActivityDefinition[] = contactIds.flatMap(contact=>
  (Object.entries(actions) as Array<[Context,Interaction[]]>).flatMap(([kind,options])=>options.map(row=>{
    const knownContact: PersonId|undefined=contact==="rumi"||contact==="niki"||contact==="mentor"||contact==="friend"?contact:undefined;
    const trackBond=kind==="partner"||kind==="child";
    return {
      id:"people."+contact+"."+row.id, category:"family", contact,
      label:row.title, description:row.description, result:row.result, cost:row.cost, stats:{joy:row.joy},
      visible:s=>{
        const age=personAge(s,contact);
        return context(s,contact)===kind&&age!==null&&age>=(row.minAge??0)&&age<=(row.maxAge??Infinity);
      },
      person:knownContact,
      trust:knownContact&&!trackBond?{[knownContact]:row.bond}:undefined,
      update:trackBond?s=>changeBond(s,contact,row.bond):undefined,
    } satisfies LifeActivityDefinition;
  })));
