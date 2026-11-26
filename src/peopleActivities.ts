import type {GameState,PersonId,Text} from "./engine.ts";
import {partnerIntimacy} from "./lifeReproduction.ts";
import type {ActivityBranch,LifeActivityDefinition,LifeSystems} from "./lifeActivities.ts";
import {childIndex,isChild,personAge,personRelationship,personSeed,type PeopleId} from "./peopleIdentity.ts";

const t = (bg:string, en:string):Text => ({bg,en});
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
    const childProfiles=family.childProfiles.map((child,i)=>i===index?{...child,bond:Math.max(0,Math.min(100,child.bond+amount))}:child);
    return {...s.lifeSystems,family:{...family,childProfiles}};
  }
  return {...s.lifeSystems,family:{...family,bond:Math.max(0,Math.min(100,family.bond+amount))}};
}

const contextualActivities = (contact: PeopleId): LifeActivityDefinition[] =>
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
  }));

type BranchVariant = {
  id:string;label:Text;description:Text;city?:"sofia"|"tryavna";cost?:number;request?:number;
  minAge?:number;maxAge?:number;impact?:number;reaction?:Text;
};
type BranchGroup = ActivityBranch & {variants:BranchVariant[]; minAge?:number; available?: (kind:Context)=>boolean};

const variant=(id:string,bg:string,en:string,detailBg:string,detailEn:string,extras:Omit<BranchVariant,"id"|"label"|"description">={}):BranchVariant=>
  ({id,label:t(bg,en),description:t(detailBg,detailEn),...extras});
const moneyChoice=(amount:number,request=false):BranchVariant=>variant(String(amount),amount+" €","€"+amount,
  request?"Попитай дали може да ти помогне с тази сума.":"Предложи тази сума като помощ.",
  request?"Ask whether they can help with this amount.":"Offer this amount as a little help.",
  request?{request:amount*100}:{cost:amount*100,impact:amount===10?3:5});

const groups:BranchGroup[] = [
  {id:"compliment",label:t("Комплимент","Compliment"),description:t("Кажи нещо хубаво и конкретно.","Say something kind and specific."),minAge:3,variants:[
    variant("style","За стила","Their style","Кажи, че ти харесва как се е облякъл човекът.","Say you like their outfit."),
    variant("effort","За усилието","Their effort","Кажи, че забелязваш колко се е постарал човекът.","Tell them you noticed the effort they put in."),
    variant("chat-reply","За точния отговор в чата","Their perfect chat reply","Похвали репликата, която затвори спора в групата.","Compliment the reply that ended the group chat debate.",{minAge:12,reaction:t("Още веднъж прочетохте репликата. Пак беше смешна.","You reread the reply together. It was still funny.")}),
    variant("humor","За чувството за хумор","Their sense of humour","Кажи, че с този човек винаги има за какво да се посмеете.","Tell them you always find something to laugh about together.",{minAge:7}),
  ]},
  {id:"conversation",label:t("Разговор","Conversation"),description:t("Избери за какво да си поговорите.","Pick something to talk about."),minAge:3,variants:[
    variant("week","Как мина денят","How their day went","Разменете си новини и се изслушайте.","Share what has been happening and listen to each other."),
    variant("music","Музика и сериали","Music and series","Разменете си препоръки за плейлисти и сериали.","Swap playlist and series recommendations.",{minAge:10}),
    variant("doner","Кой е правилният сос за дюнер?","Which sauce belongs in a döner?","Задай въпроса, който дели всяка компания на лагери.","Ask the question that splits every friend group into camps.",{minAge:10,reaction:t("Уговорихте се да решите спора с дегустация.","You agreed to settle the debate with a taste test.")}),
    variant("plans","Планове за уикенда","Weekend plans","Обсъдете кой какво е намислил.","See what you both have planned.",{minAge:7}),
  ]},
  {id:"gift",label:t("Подарък","Gift"),description:t("Избери нещо, което би зарадвало човека.","Pick something they might enjoy."),variants:[
    variant("book","Книга от книжарницата","A book from the bookshop","Избери книга според интересите на човека.","Choose a book that suits their interests.",{minAge:5,cost:1800,impact:6}),
    variant("chocolate","Кутия бонбони","A box of chocolates","Вземи малка кутия за подарък.","Pick up a small box as a gift.",{minAge:5,cost:900,impact:4}),
    variant("lyutenitsa","Буркан домашна лютеница","A jar of homemade lyutenitsa","Подари буркан с уговорката да ти го върнат празен.","Give a jar on condition that it comes back empty.",{minAge:8,cost:600,impact:4,reaction:t("Бурканът замина. Уговорката да се върне празен беше приета.","The jar changed hands. They agreed to return it empty.")}),
    variant("toy","Плюшена играчка","A soft toy","Избери малка играчка.","Pick a small toy.",{maxAge:9,cost:1400,impact:6}),
  ]},
  {id:"give-money",label:t("Дай пари","Give money"),description:t("Избери сума, с която да помогнеш.","Choose an amount to help out."),minAge:6,variants:[moneyChoice(10),moneyChoice(30),moneyChoice(50),
    variant("old-leva","Отърви се от старите левове","Pass on some old leva","Подари шепа монети като спомен.","Pass on a handful of coins as a keepsake.",{impact:2,reaction:t("Прие монетите за спомен и веднага започна да ги разглежда.","They kept the coins as a souvenir and started looking through them.")}),
    variant("billa-voucher","Ваучер за BILLA","BILLA voucher","Дай ваучер за следващото пазаруване.","Give a voucher for their next shop.",{minAge:10,cost:1500,impact:5,reaction:t("Прие ваучера и вече имаше план за половината покупки.","They accepted the voucher and already had plans for half the shopping.")})]},
  {id:"ask-money",label:t("Поискай пари","Ask for money"),description:t("Избери сума и попитай дали човекът може да ти помогне.","Choose an amount and ask whether they can help."),minAge:18,
    available:kind=>kind!=="former"&&kind!=="mentor",variants:[moneyChoice(10,true),moneyChoice(30,true),moneyChoice(50,true),
    variant("doner","5 € за дюнер","€5 for a döner","Попитай дали може да те почерпи, че си огладнял.","Ask whether they can spot you something to eat.",{request:500})]},
  {id:"walk",label:t("Разходка","Go for a walk"),description:t("Избери къде да се видите.","Choose where to meet."),variants:[
    variant("south-park","Южен парк","South Park","Направете обиколка по алеите.","Take a loop along the park paths.",{city:"sofia"}),
    variant("borisova","Борисовата градина","Borisova Garden","Минете по широките алеи в парка.","Follow the main paths through the park.",{city:"sofia"}),
    variant("ariana","Езерото Ариана","Lake Ariana","Разходете се покрай водата.","Take a walk by the water.",{city:"sofia"}),
    variant("popa","Попа","Popa","Срещнете се при паметника. Някой все ще пише „на две минути съм“.","Meet at the monument. Someone will still message that they’re two minutes away.",{city:"sofia"}),
    variant("vitoshka","Витошка","Vitosha Boulevard","Минете по пешеходната част към НДК.","Follow the pedestrian stretch towards the National Palace of Culture.",{city:"sofia"}),
    variant("tryavna-centre","Часовниковата кула","Tryavna Clock Tower","Срещнете се на площада и минете по старите улици.","Meet at the square and explore the old streets.",{city:"tryavna"}),
    variant("tryavna-river","Мостът в Трявна","Tryavna’s old bridge","Завършете разходката край реката.","Finish your walk by the river.",{city:"tryavna"}),
  ]},
  {id:"fitness",label:t("Фитнес","Gym"),description:t("Избери зала или тренировка навън.","Choose a gym or work out outside."),minAge:16,variants:[
    variant("pulse","Pulse Mall of Sofia","Pulse Mall of Sofia","Направете лека тренировка заедно.","Do a light workout together.",{city:"sofia",cost:1800}),
    variant("next-level","Next Level · The Mall","Next Level · The Mall","Уговорете си обща тренировка.","Meet for a workout together.",{city:"sofia",cost:1600}),
    variant("outdoor","Лостове в квартала","Outdoor workout bars","Тренирайте на лостовете и пребройте само истинските набирания.","Work out on the bars and count only the honest pull-ups."),
  ]},
  {id:"insult",label:t("Обида","Insult"),description:t("Избери какво да кажеш. Може да засегнеш човека.","Choose what to say. It might hurt their feelings."),minAge:12,
    available:kind=>kind!=="child",variants:[
    variant("filmar","„Пак влезе във филм.“","“You’re making a whole movie out of this.”","Подхвърли го с ирония.","Say it with a sarcastic tone.",{impact:-5}),
    variant("razbirach","„Голям разбирач се извъди.“","“Look who’s suddenly an expert.”","Кажи го в разгара на разговора.","Say it in the middle of the conversation.",{impact:-9}),
    variant("drama","„Стига си правил драми.“","“Enough with the drama.”","Прекъсни разговора с остра реплика.","Interrupt with a sharp remark.",{impact:-7}),
  ]},
  {id:"argue",label:t("Спор","Argument"),description:t("Повдигни въпрос, по който не сте съгласни.","Bring up something you disagree about."),minAge:8,variants:[
    variant("late","За закъснението","About being late","Кажи какво те е подразнило.","Say what annoyed you."),
    variant("decision","За общо решение","About a shared decision","Защити гледната си точка.","Explain your point of view."),
    variant("pizza","За последното парче пица","Over the last slice of pizza","Виж кой има по-добър аргумент за последното парче.","See who makes a better case for the last slice.",{minAge:10}),
    variant("messages","За тона в чата","About the tone in chat","Обсъдете как са прозвучали съобщенията.","Talk about how the messages came across.",{minAge:12}),
  ]},
  {id:"persuade",label:t("Накарай","Persuade"),description:t("Опитай се да убедиш човека да направите нещо заедно.","Try to persuade them to do something together."),minAge:5,variants:[
    variant("offline","Да оставите телефоните","Put the phones away","Предложи малко време без екрани.","Suggest spending a little time without screens.",{minAge:8}),
    variant("help","Да ти помогне","Help you with a task","Помоли за помощ с нещо конкретно.","Ask for help with something specific."),
    variant("voice-note","Да праща по-кратки войсове","Send shorter voice notes","Предложи едно съобщение под минута и виж дали ще се навие.","Ask if they’ll keep their next voice note under a minute.",{minAge:13,reaction:t("Отговорът дойде като 54-секундно гласово. Засега работи.","The reply was a 54-second voice note. So far, so good.")}),
    variant("outing","Да дойде на разходка","Come for a walk","Опитай да промениш плановете му за деня.","See if they want to change their plans for the day."),
  ]},
];

function reaction(s:GameState,contact:PeopleId,group:BranchGroup,choice:BranchVariant) {
  const seed=Array.from(group.id+"."+choice.id).reduce((hash,char)=>Math.imul(hash^char.charCodeAt(0),16777619),personSeed(s.seed,contact));
  const roll=(Math.imul(seed^s.age,0x45d9f3b)>>>0)%100;
  const bond=personRelationship(s,contact)??42;
  if(group.id==="ask-money"){
    const agreed=roll<Math.max(12,Math.min(88,bond+12-(choice.request??0)/130));
    return agreed ? {amount:choice.request??0,delta:-2,joy:3,result:t("Съгласи се да ти даде парите.","They agreed to give you the money.")}
      : {amount:0,delta:-2,joy:-2,result:t("Отказа да ти даде парите.","They turned down your request for money.")};
  }
  if(group.id==="insult")return {amount:0,delta:(choice.impact??-7)-(roll<35?3:0),joy:-3,
    result:t("Каза "+choice.label.bg+" и разговорът охладня.","You said "+choice.label.en+" and the conversation cooled off.")};
  if(group.id==="argue")return roll<bond/2?
    {amount:0,delta:1,joy:-1,result:t("Поговорихте открито и намерихте общ език.","You spoke honestly and found some common ground.")}:
    {amount:0,delta:-7,joy:-3,result:t("Никой не отстъпи и разговорът приключи напрегнато.","Neither of you backed down and the conversation ended tensely.")};
  if(group.id==="persuade"&&roll>bond+10)return {amount:0,delta:-2,joy:-1,result:t("Човекът предпочете да запази своите планове.","They preferred to stick to their own plans.")};
  if(group.id==="walk"||group.id==="fitness")return {amount:0,delta:4+(roll<bond?3:0),joy:4,
    result:group.id==="walk"?t("Разходихте се заедно. Място: "+choice.label.bg+".","You went for a walk together at "+choice.label.en+"."):
      t("Тренирахте заедно. Място: "+choice.label.bg+".","You worked out together at "+choice.label.en+".")};
  const warm=roll<bond+10;
  return {amount:0,delta:(choice.impact??3)+(warm?2:0),joy:warm?4:2,
    result:choice.reaction??(group.id==="give-money"?t("Даде "+choice.label.bg+" и получи благодарност.","You gave them "+choice.label.en+" and they thanked you."):
      warm?t("Жестът беше приет топло и разговорът потръгна.","They took it warmly and the conversation flowed."):
        t("Жестът беше приет спокойно.","They acknowledged it quietly."))};
}

const branchActivities = (contact: PeopleId): LifeActivityDefinition[] => groups.flatMap(group=>group.variants.map(choice=>{
  const knownContact:PersonId|undefined=contact==="rumi"||contact==="niki"||contact==="mentor"||contact==="friend"?contact:undefined;
  return {
    id:"people."+contact+"."+group.id+"."+choice.id, category:"family", contact, branch:{id:group.id,label:group.label,description:group.description},
    label:choice.label, description:choice.description, result:choice.description, city:choice.city, cost:choice.cost,
    walletDelta:choice.request?s=>reaction(s,contact,group,choice).amount:undefined,
    person:knownContact,
    visible:s=>{
      const age=personAge(s,contact),kind=context(s,contact);
      return age!==null&&kind!==null&&(group.available?.(kind)??true)
        &&age>=Math.max(group.minAge??0,choice.minAge??0)&&age<=(choice.maxAge??Infinity);
    },
    resolve:s=>{
      const outcome=reaction(s,contact,group,choice);
      const tracksBond=isChild(contact)||s.lifeSystems.family.partner===contact;
      return {
        result:outcome.result,
        stats:{joy:outcome.joy,...(group.id==="fitness"?{health:3}:group.id==="walk"?{health:1}:{})},
        trust:knownContact&&!tracksBond?{[knownContact]:outcome.delta}:undefined,
        lifeSystems:tracksBond?changeBond(s,contact,outcome.delta):undefined,
      };
    },
  } satisfies LifeActivityDefinition;
}));

export function getPeopleActivityDefinitions(contact: PeopleId): LifeActivityDefinition[] {
  return [...partnerIntimacy(contact), ...contextualActivities(contact), ...branchActivities(contact)];
}
