import type { GameState, Text } from "./engine.ts";
import type { LifeActivityDefinition, Platform } from "./lifeActivities.ts";

type Content = {
  id: string;
  label: Text;
  description: Text;
  result: Text;
  reach: number;
  stats: NonNullable<LifeActivityDefinition["stats"]>;
  minimumPosts?: number;
  minimumFollowers?: number;
};

type Channel = {
  id: Platform;
  label: string;
  minAge?: number;
  description: Text;
  formats: Content[];
};

const text = (bg: string, en: string): Text => ({ bg, en });

const channels: Channel[] = [
  {
    id: "instagram", label: "Instagram",
    description: text("Споделяй снимки, Reels и предавания на живо.", "Share photos, Reels and live broadcasts."),
    formats: [
      {
        id: "photo", label: text("Качи снимки", "Post photos"),
        description: text("Подбери няколко кадъра от ежедневието си.", "Share a few photos from everyday life."),
        result: text("Кадрите ти от разходката стигнаха и до хора извън твоя кръг.", "Your photos from a walk reached people outside your circle."),
        reach: 5, stats: { joy: 2, influence: 2 },
      },
      {
        id: "reel", label: text("Направи Reel", "Make a Reel"),
        description: text("Подбери кадри, монтирай ги и добави надписи.", "Pick your shots, edit them and add captions."),
        result: text("Краткото видео се споделя и хората питат как си го заснела.", "People pass around your short video and ask how you filmed it."),
        reach: 11, minimumPosts: 1, stats: { brains: 1, influence: 3 },
      },
      {
        id: "live", label: text("Включи се на живо", "Go live"),
        description: text("Отговори на въпросите на хората, които вече те следят.", "Take questions from the people who already follow you."),
        result: text("Въпросите валят, а някои зрители остават до самия край.", "Questions keep coming, and some viewers stay to the very end."),
        reach: 13, minimumPosts: 2, minimumFollowers: 20, stats: { joy: 1, influence: 4 },
      },
    ],
  },
  {
    id: "facebook", label: "Facebook",
    description: text("Поддържай връзка с познати и с местната общност.", "Stay in touch with friends and the local community."),
    formats: [
      {
        id: "post", label: text("Сподели новина", "Share an update"),
        description: text("Разкажи на познатите си какво ново при теб.", "Tell the people you know what you have been up to."),
        result: text("Един от коментарите е от стар познат, за когото отдавна се чудеше как е.", "An old acquaintance you have been wondering about leaves a comment."),
        reach: 4, stats: { joy: 3, influence: 1 },
      },
      {
        id: "event", label: text("Сподели местно събитие", "Share a local event"),
        description: text("Помогни на съседите да научат за събитие в града.", "Help neighbours hear about an event in town."),
        result: text("Хора от града започнаха да препращат поканата.", "People around town started passing the invitation along."),
        reach: 7, minimumPosts: 1, stats: { joy: 2, influence: 3 },
      },
      {
        id: "live", label: text("Предавай на живо", "Broadcast live"),
        description: text("Организирай разговор за нещо, което засяга местната общност.", "Host a conversation about something that matters to your community."),
        result: text("В разговора се включиха и хора, които обикновено само четат публикациите.", "People who usually just read your posts joined the discussion."),
        reach: 9, minimumPosts: 2, minimumFollowers: 15, stats: { brains: 1, influence: 3 },
      },
    ],
  },
  {
    id: "tiktok", label: "TikTok",
    description: text("Снимай кратки видеа, прави дуети и предавай на живо.", "Make short videos, duets and live broadcasts."),
    formats: [
      {
        id: "video", label: text("Качи кратко видео", "Post a short video"),
        description: text("Разкажи една малка история за няколко секунди.", "Tell a small story in a few seconds."),
        result: text("Клипът събра реакции от хора, които досега не бяха чували за теб.", "The clip drew reactions from people who had never heard of you."),
        reach: 10, stats: { joy: 1, influence: 3 },
      },
      {
        id: "duet", label: text("Заснеми дует", "Film a duet"),
        description: text("Направи творчески отговор на видео, което харесваш.", "Make a creative response to a video you like."),
        result: text("Твоят отговор стигна и до част от аудиторията на оригиналния клип.", "Your response reached some of the original video's audience."),
        reach: 14, minimumPosts: 1, stats: { joy: 2, influence: 3 },
      },
      {
        id: "live", label: text("Пусни предаване на живо", "Start a live broadcast"),
        description: text("Импровизирай и говори директно с аудиторията си.", "Improvise and talk directly to your audience."),
        result: text("Няколко редовни зрители доведоха приятели. В края вече имаше истински разговор.", "A few regulars brought friends. By the end, there was a real conversation going."),
        reach: 18, minimumPosts: 2, minimumFollowers: 30, stats: { joy: 1, influence: 5 },
      },
    ],
  },
  {
    id: "youtube", label: "YouTube",
    description: text("Развивай канал с видеа, Shorts и предавания на живо.", "Build a channel with videos, Shorts and live broadcasts."),
    formats: [
      {
        id: "video", label: text("Качи видео", "Upload a video"),
        description: text("Подготви, заснеми и монтирай видео по тема, която познаваш.", "Plan, film and edit a video about a subject you know."),
        result: text("Зрителите запазиха видеото, а един предложи тема за следващото.", "Viewers saved the video, and one suggested what to cover next."),
        reach: 7, stats: { brains: 3, influence: 2 },
      },
      {
        id: "short", label: text("Публикувай Short", "Publish a Short"),
        description: text("Превърни една добра идея в стегнат кратък клип.", "Turn one good idea into a concise short video."),
        result: text("Краткият клип привлече нови хора към канала ти.", "The short clip brought new people to your channel."),
        reach: 11, minimumPosts: 1, stats: { brains: 1, influence: 3 },
      },
      {
        id: "live", label: text("Пусни стрийм", "Start a stream"),
        description: text("Отдели време да покажеш процеса си и да отговаряш на въпроси.", "Set aside time to show your process and answer questions."),
        result: text("Зрителите останаха да гледат как работиш и поискаха второ предаване.", "Viewers stayed to watch you work and asked for another stream."),
        reach: 12, minimumPosts: 2, minimumFollowers: 22, stats: { brains: 2, influence: 4 },
      },
    ],
  },
  {
    id: "vbox7", label: "Vbox7",
    description: text("Споделяй български видеа и намери местна публика.", "Share Bulgarian videos and find a local audience."),
    formats: [
      {
        id: "clip", label: text("Качи клип", "Upload a clip"),
        description: text("Заснеми история от града си.", "Film a story from your hometown."),
        result: text("В коментарите зрители разпознаха мястото и добавиха свои спомени.", "Viewers recognised the setting and added memories of their own."),
        reach: 5, stats: { joy: 2, influence: 2 },
      },
      {
        id: "series", label: text("Пусни епизод от поредица", "Release a series episode"),
        description: text("Върни се към тема от предишния клип и я развий в епизоди.", "Return to a topic from your last clip and develop it into a series."),
        result: text("Няколко зрители изгледаха предишния клип и поискаха следващ епизод.", "Several viewers watched the earlier clip and asked for the next episode."),
        reach: 8, minimumPosts: 1, stats: { brains: 2, influence: 3 },
      },
      {
        id: "collab", label: text("Заснеми общ клип", "Film a collaboration"),
        description: text("Направи видео с друг местен автор.", "Make a video with another local creator."),
        result: text("Двете публики се срещнаха и разговорът продължи в коментарите.", "The two audiences met and kept the conversation going in the comments."),
        reach: 10, minimumPosts: 2, minimumFollowers: 18, stats: { joy: 2, influence: 3 },
      },
    ],
  },
  {
    id: "onlyfans", label: "OnlyFans", minAge: 18,
    description: text("Споделяй авторско съдържание с хора, които подкрепят работата ти.", "Share original creator content with people who support your work."),
    formats: [
      {
        id: "post", label: text("Сподели какво подготвяш", "Share a project update"),
        description: text("Покажи как върви работата по твой творчески проект.", "Show how work on your creative project is coming along."),
        result: text("Първите последователи оцениха възможността да видят как работиш.", "Your first followers appreciated seeing how you work."),
        reach: 4, stats: { joy: 2, influence: 2 },
      },
      {
        id: "video", label: text("Качи видео за последователите", "Post a video for followers"),
        description: text("Заснеми кратък урок или покажи как се прави нещо от проекта.", "Record a quick tutorial or demonstrate part of your project."),
        result: text("Зрителите запазиха видеото и предложиха идеи за следващото.", "Viewers saved the video and suggested ideas for the next one."),
        reach: 7, minimumPosts: 1, stats: { brains: 2, influence: 2 },
      },
      {
        id: "live", label: text("Отговаряй на въпроси на живо", "Host a live Q&A"),
        description: text("Покани хората, които следят проекта, на разговор.", "Invite the people following your project to a conversation."),
        result: text("Редовните последователи се върнаха за разговора и попитаха какво предстои.", "Your regular followers came back for the Q&A and asked what was next."),
        reach: 10, minimumPosts: 2, minimumFollowers: 15, stats: { joy: 2, influence: 3 },
      },
    ],
  },
];

function updateProfile(s: GameState, id: Platform, followers: number, posts: number): GameState["lifeSystems"] {
  return { ...s.lifeSystems, social: { ...s.lifeSystems.social, [id]: { followers, posts } } };
}

function contentGate(s: GameState, channel: Channel, format: Content): Text | null {
  const profile = s.lifeSystems.social[channel.id];
  if (!profile) return text(`Първо създай профил в ${channel.label}.`, `Create a ${channel.label} profile first.`);
  const minimumPosts = format.minimumPosts ?? 0;
  if (profile.posts < minimumPosts) {
    return text(`Нужни са поне ${minimumPosts} публикации в ${channel.label}.`, `Make at least ${minimumPosts} post${minimumPosts === 1 ? "" : "s"} on ${channel.label} first.`);
  }
  const minimumFollowers = format.minimumFollowers ?? 0;
  if (profile.followers < minimumFollowers) {
    return text(`Нужни са ${minimumFollowers} последователи в ${channel.label}.`, `Reach ${minimumFollowers} followers on ${channel.label} first.`);
  }
  return null;
}

function contentActivity(channel: Channel, format: Content): LifeActivityDefinition {
  return {
    id: `social.${channel.id}.${format.id}`, category: "social", minAge: channel.minAge,
    label: text(`${format.label.bg} · ${channel.label}`, `${format.label.en} · ${channel.label}`),
    description: format.description, result: format.result, stats: format.stats,
    requires: s => contentGate(s, channel, format),
    update: s => {
      const profile = s.lifeSystems.social[channel.id];
      if (!profile) return s.lifeSystems;
      const influence = Math.floor(s.stats.influence / 8);
      const repeatViewers = Math.min(10, profile.posts * 2);
      const followers = profile.followers + format.reach + influence + repeatViewers;
      return updateProfile(s, channel.id, followers, profile.posts + 1);
    },
  };
}

export const lifeSocial: LifeActivityDefinition[] = channels.flatMap(channel => [
  {
    id: `social.${channel.id}.register`, category: "social", minAge: channel.minAge,
    label: text(`Създай профил · ${channel.label}`, `Create a profile · ${channel.label}`),
    description: channel.description,
    result: text(`Профилът ти в ${channel.label} е готов за първата публикация.`, `Your ${channel.label} profile is ready for its first post.`),
    stats: { brains: 1 },
    requires: (s: GameState) => s.lifeSystems.social[channel.id]
      ? text("Вече имаш профил тук.", "You already have a profile here.")
      : null,
    update: (s: GameState) => updateProfile(s, channel.id, 0, 0),
  } satisfies LifeActivityDefinition,
  ...channel.formats.map(format => contentActivity(channel, format)),
]);
