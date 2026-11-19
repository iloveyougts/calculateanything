/* ============================================================
   USAGI WANDERING DESKTOP PET & KAWAII MINI-GAMES ARCADE ENGINE
   Dedicated to 颜芷萱 (GAN TZI SHUAN)
   ============================================================ */

/* ============================================================
   0. USAGI KAWAII VOICE ENGINE (Web Speech API 智能可爱语音播报)
   ============================================================ */
const UsagiVoice = (function () {
  let isVoiceEnabled = localStorage.getItem('usagi_voice_enabled') !== 'false'; // 默认开启
  let voices = [];
  let isSpeaking = false;

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function getBestVoice() {
    if (!voices || voices.length === 0) loadVoices();
    const preferred = ['Xiaoxiao', 'Yaoyao', 'Tingting', 'Mei-Jia', 'Sin-ji', 'Huihui', 'Lily', 'Google 普通话', 'Microsoft', 'Chinese'];
    for (const name of preferred) {
      const match = voices.find(v => v.name && v.name.includes(name) && (v.lang.startsWith('zh') || v.lang.startsWith('cmn')));
      if (match) return match;
    }
    const zh = voices.find(v => v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('cmn')));
    return zh || null;
  }

  function speak(text, options = {}) {
    if (!isVoiceEnabled) return;
    if (!('speechSynthesis' in window)) return;
    if (!text || !text.trim()) return;

    try {
      window.speechSynthesis.cancel();

      // 过滤表情符号与特殊标点，获得最自然清脆的萌系朗读
      const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[【】「」『』~！!？?·_—]/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.pitch = options.pitch || 1.48; // 可爱软萌的高音调
      utterance.rate = options.rate || 1.12;   // 活泼轻快语速
      utterance.volume = options.volume || 1.0;

      const v = getBestVoice();
      if (v) utterance.voice = v;

      utterance.onstart = () => {
        isSpeaking = true;
        updateUI(true);
      };
      utterance.onend = () => {
        isSpeaking = false;
        updateUI(false);
      };
      utterance.onerror = () => {
        isSpeaking = false;
        updateUI(false);
      };

      if (window.UsagiSound && !options.silent) {
        UsagiSound.pop();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  function stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      updateUI(false);
    }
  }

  function toggleVoice() {
    isVoiceEnabled = !isVoiceEnabled;
    localStorage.setItem('usagi_voice_enabled', isVoiceEnabled ? 'true' : 'false');
    if (!isVoiceEnabled) stop();
    updateButtonUI();
    if (isVoiceEnabled) {
      speak('乌萨奇可爱语音已开启！我会准时提醒芷萱哦~ 呀哈！');
    }
    return isVoiceEnabled;
  }

  function updateUI(speaking) {
    const bubble = document.getElementById('usagi-speech-bubble');
    const wave = document.getElementById('usagi-voice-wave');
    if (wave) wave.classList.toggle('hidden', !speaking);
    if (bubble) bubble.classList.toggle('speaking-active', speaking);
  }

  function updateButtonUI() {
    const btn = document.getElementById('btn-speech-voice-toggle');
    if (btn) {
      btn.innerHTML = isVoiceEnabled ? '🔊 语音开启' : '🔇 语音静音';
      btn.title = isVoiceEnabled ? '点击关闭乌萨奇语音播报' : '点击开启乌萨奇可爱语音播报';
      btn.classList.toggle('text-pink-600', isVoiceEnabled);
      btn.classList.toggle('text-stone-400', !isVoiceEnabled);
    }
  }

  return {
    speak,
    stop,
    toggleVoice,
    isEnabled: () => isVoiceEnabled,
    updateButtonUI
  };
})();
window.UsagiVoice = UsagiVoice;

/* ============================================================
   1. USAGI PET MANAGER (底部漫步桌面萌宠 & 贴心生活助手)
   ============================================================ */
const UsagiPetManager = (function () {
  let isRoaming = true;
  let isMinimized = false;
  let posX = Math.max(40, (window.innerWidth || 1024) - 240);
  let direction = -1; // -1 = moving left, 1 = moving right
  let speed = 1.35; // gentle waddle speed
  let isPaused = false;
  let pauseTimeout = null;
  let lastReminderTime = Date.now();
  let animFrameId = null;

  // Active Companion State
  let currentState = 'idle'; // 'idle', 'sleep', 'water', 'period', 'comfort', 'game_cheer', 'happy', 'expense', 'countdown', 'highlight'
  let stateTimeout = null;
  let zzzInterval = null;

  // 专属定制分类情话与生活提醒 (专为 颜芷萱 打造)
  const STATE_CONFIGS = {
    sleep: {
      propIcon: '🌙',
      propSub: 'zzz 困困',
      imgClass: 'usagi-sleeping',
      sound: 'sparkle',
      tag: '🌙 乌萨奇陪你睡觉觉',
      quotes: [
        "呼噜噜... 乌萨奇也困困啦~ 芷萱宝宝快躺进软乎乎的被窝，和乌萨奇一起做美梦吧！晚安吻送达 😴💤",
        "夜深啦，小月亮挂在天上守着芷萱~ 男朋友在梦里捧着一整片星空等着你呢，乖乖闭眼睡觉觉吧 🌙🛌",
        "深呼吸，把手机放远一点点~ 闭上眼睛数小兔子：一只乌萨奇、两只乌萨奇... 祝芷萱做个超级甜的梦！😴✨",
        "熬夜会变小熊猫哒！乌萨奇已经先钻进被窝帮芷萱把被角压好啦，快闭上眼睛睡觉觉~ 🛌💖"
      ]
    },
    water: {
      propIcon: '🥛',
      propSub: '💦 咕噜~',
      imgClass: 'usagi-drinking',
      sound: 'water',
      tag: '💧 咕噜咕噜喝水时间',
      quotes: [
        "咕噜咕噜~ 乌萨奇正在陪芷萱大口大口喝温水哦！多喝水皮肤像剥壳鸡蛋一样水灵灵！干杯~ 🥛💦",
        "好甜的水！芷萱今天喝了几杯啦？快去倒一杯温热的，和乌萨奇一起干杯！🍼✨",
        "水份补充完毕，元气值充能 100%！芷萱喝完水也要保持甜甜的微笑哦~ 💧🐰",
        "男朋友千里迢迢嘱咐我：一定要盯紧芷萱喝水！乌萨奇捧着小水杯看着你喝光光哦！👀🥛"
      ]
    },
    period: {
      propIcon: '♨️',
      propSub: '🌸 贴贴',
      imgClass: 'usagi-period-care',
      sound: 'sparkle',
      tag: '🌸 经期暖暖守护',
      quotes: [
        "芷萱肚肚还痛不痛呀？乌萨奇拿着暖暖水袋来给你贴贴肚肚啦！多喝温热红糖水，不准碰冰的哦！🧸♨️",
        "特殊时期芷萱是全宇宙第一被宠爱的宝贝！有任何不舒服都跟男友和乌萨奇撒娇，我们永远心疼你！🌸🥺",
        "揉揉肚肚、揉揉腰~ 难受的时候只管好好躺着休息，什么都别操心，男友隔空给你买暖宝宝啦！🍵💖",
        "今天芷萱什么家务和烦心事都不准碰！乌萨奇和男朋友全天候当你的贴身小保镖，好好暖和身体！🧸🌸"
      ]
    },
    comfort: {
      propIcon: '🧸',
      propSub: '💖 抱紧',
      imgClass: 'usagi-comforting',
      sound: 'yaha',
      tag: '🤗 男友隔空抱抱',
      quotes: [
        "两座城市的风都在替他紧紧拥抱你~ 男朋友今天超想超想芷萱！快把头埋在乌萨奇怀里蹭蹭，不委屈哦！💖🧸",
        "无论遇到什么烦心事，芷萱只要记住：男朋友是你的头号粉丝与坚强后盾，全世界他最偏心你！🔒❤️",
        "不开心统统交给乌萨奇敲飞！芷萱吃块小蛋糕、看会儿动画，你笑起来的样子全世界最甜啦！🍰✨",
        "想念是彼此相爱的证明~ 倒数清单里的下一次相聚正在一天天靠近，很快就能扑进男友怀里啦！✈️🥰",
        "不管别人怎么说，在男朋友和乌萨奇眼里，芷萱永远是最好、最值得被疼爱的小女孩！👑🌸"
      ]
    },
    love_hug: {
      propIcon: '💖',
      propSub: '抱紧紧',
      imgClass: 'usagi-comforting',
      sound: 'yaha',
      tag: '💖 隔空超大拥抱',
      quotes: [
        "收到芷萱的超强思念电波！两座城市的风把男朋友最紧最暖的拥抱送来啦！抱紧紧不撒手~ 💖🧸",
        "两座城市的风都在替他紧紧拥抱你~ 男朋友今天超想超想芷萱！快把头埋在乌萨奇怀里蹭蹭，不委屈哦！💖💌",
        "隔空抱抱已送达！男朋友的爱意像热可可一样把你包裹得严严实实，芷萱今天也是被全力偏爱的小仙女！✨🥰",
        "叮！隔空拥抱已光速送达！男朋友正在千里之外紧紧抱住芷萱 10 秒钟~ 永远心疼你！🤗💕"
      ]
    },
    calm: {
      propIcon: '🍃',
      propSub: '🍵 惬意',
      imgClass: 'usagi-calm',
      sound: 'sparkle',
      tag: '🍃 惬意放空时光',
      quotes: [
        "享受安静也是一种浪漫~ 乌萨奇泡了一杯茉莉绿茶，和芷萱一起静静享受美好的午后 🍵🍃",
        "平淡安静的小日子最让人安心啦！芷萱靠在窗边吹吹微风，乌萨奇在脚边乖乖陪着你~ ☁️🌸",
        "世界太喧闹，乌萨奇只想陪着芷萱安安静静发呆~ 无论今天做了什么，你都是最棒的小仙女！✨🌿",
        "静下心来听听微风的声音~ 乌萨奇陪在芷萱身边，感受属于此刻的温柔与放松 🍃☕"
      ]
    },
    tired: {
      propIcon: '☕',
      propSub: '💆 捏肩',
      imgClass: 'usagi-tired',
      sound: 'sparkle',
      tag: '💆 乌萨奇捏肩小铺',
      quotes: [
        "芷萱辛苦啦！乌萨奇的小肉爪正在给你揉揉肩膀、按按太阳穴~ 赶紧靠在男友和乌萨奇怀里歇一会儿吧！💆☕",
        "累了就彻底放空，今天芷萱已经超额完成全部努力啦！不准再给自己压力，闭上眼深呼吸~ 呼~ 🍃💤",
        "乌萨奇端来一杯暖暖的热可可，芷萱喝一口，把疲惫统统融化掉！今晚不准加班，早点窝进被窝！☕🛌",
        "无论工作还是生活，身体最重要！男朋友嘱咐过：芷萱累了随时可以撒娇偷懒，我们宠着你！🌸🥰"
      ]
    },
    emo: {
      propIcon: '🧻',
      propSub: '💖 抱抱',
      imgClass: 'usagi-emo',
      sound: 'sparkle',
      tag: '🥺 乌萨奇擦泪抱抱',
      quotes: [
        "芷萱不哭不哭~ 乌萨奇拿着软软的小手帕帮你擦眼泪！把委屈都哭出来，有男朋友和乌萨奇在，永远偏心你！🧻🧸",
        "难过的时候不要憋在心里，乌萨奇的小肚肚借芷萱靠着蹭眼泪！全世界最心疼你的男孩子正在飞奔来抱你！💖🥺",
        "就算全世界下雨，男朋友也会为你撑起一整片晴空！芷萱吃块糖，乌萨奇给你变出小彩虹！🍬🌈",
        "抱紧紧！任何坏情绪都是暂时的，芷萱依然是宇宙第一可爱的小仙女！乌萨奇寸步不离守着你！🌸💖"
      ]
    },
    angry: {
      propIcon: '🪭',
      propSub: '🍰 消气',
      imgClass: 'usagi-angry',
      sound: 'yaha',
      tag: '🪭 乌萨奇灭火扇风队',
      quotes: [
        "是谁惹我们芷萱大宝贝生气啦？！乌萨奇呼哧呼哧拿小扇子把火气统统扇飞！扇走所有大坏蛋！🪭💨",
        "不气不气，气坏身体不划算！乌萨奇给你一拳把烦恼打到外太空！来，咬一口超甜的草莓小蛋糕！🍰🥊",
        "芷萱不气哦！男朋友说谁惹芷萱不开心，他就去给芷萱出气！小兔子给你顺顺毛，呼噜噜呼噜噜~ 🐰💖",
        "深呼吸~ 吸气~ 呼气~ 坏情绪全被吹跑啦！芷萱笑起来的样子比蜜糖还甜呢！呀哈！💨🍓"
      ]
    },
    calendar: {
      propIcon: '📅',
      propSub: '💮 盖章',
      imgClass: 'usagi-calendar',
      sound: 'sparkle',
      tag: '📅 乌萨奇生活日历小管家',
      quotes: [
        "翻翻日历~ 每一天都是和芷萱共同走过的闪亮印记！乌萨奇在今天盖上一朵小红花！💮📅",
        "日程安排得井井有条，芷萱是最棒的生活记录家！乌萨奇帮你把好日子统统圈起来！✨🗓️",
        "日历翻过每一页，都在见证芷萱的成长与幸福！未来还有好多好多甜甜的约会等着我们！💖✈️"
      ]
    },
    habit: {
      propIcon: '📋',
      propSub: '🏅 优秀',
      imgClass: 'usagi-habit',
      sound: 'coin',
      tag: '🌸 自律小达人打卡站',
      quotes: [
        "叮！自律小达人芷萱又打卡成功啦！乌萨奇拿着小印章盖上『优秀』！自律的花朵在盛开哦！🌸✅",
        "哇！热力图又添了一颗粉粉的小樱花！坚持的芷萱最闪闪发光，乌萨奇给你颁发特大金牌！🏅💖",
        "每天进步一点点，芷萱自律的样子特别迷人！乌萨奇双手给你比大大的赞！👍🌟"
      ]
    },
    note: {
      propIcon: '💡',
      propSub: '📜 灵感',
      imgClass: 'usagi-note',
      sound: 'sparkle',
      tag: '💡 乌萨奇灵感收集屋',
      quotes: [
        "叮！灵感小灯泡亮起来啦！芷萱的脑瓜里总装着天马行空的奇思妙想，乌萨奇用羽毛笔赶紧记下！💡📜",
        "灵感就像小流星，咻的一下被芷萱抓在手心里啦！好聪明的芷萱，记录下来永远不忘！🪶✨",
        "随手记录的小灵感，都是生活送给芷萱的礼物！乌萨奇帮芷萱把秘密花园打理得漂漂亮亮！🌱💎"
      ]
    },
    watchlist: {
      propIcon: '🍿',
      propSub: '🎬 放映',
      imgClass: 'usagi-watchlist',
      sound: 'sparkle',
      tag: '🎬 乌萨奇放映室与种草官',
      quotes: [
        "咔哒！乌萨奇戴上3D眼镜捧好大桶爆米花啦！芷萱今天想看什么甜甜的电影呀？乌萨奇陪你一起看！🍿🎬",
        "冷静期清单帮你守住小钱包~ 好书好剧慢慢品味，和芷萱一起享受悠闲的时光！🕶️📚",
        "探店吃美食、打卡好电影，把每一个心愿都列上清单，等男朋友带芷萱一个个去实现！🎟️🍰"
      ]
    },
    music: {
      propIcon: '🎧',
      propSub: '🎶 摇摆',
      imgClass: 'usagi-music',
      sound: 'yaha',
      tag: '🎧 乌萨奇甜甜点歌台',
      quotes: [
        "哇！乌萨奇戴上粉色猫耳耳机啦！身体跟着节拍摇摆~ 每一首歌都是男朋友送给芷萱的心动旋律！🎧🎶",
        "戴上耳机，把全世界的喧嚣隔绝在外，只留下动听的旋律和甜甜的心情陪着芷萱！🎵🐰",
        "音乐一响，烦恼全忘！呀哈！乌萨奇和芷萱一起当音乐电台的超级大明星！📻✨"
      ]
    },
    social: {
      propIcon: '📱',
      propSub: '💬 刷手机',
      imgClass: 'usagi-social-chat',
      sound: 'pop',
      tag: '📱 乌萨奇狂刷手机中',
      quotes: [
        "乌萨奇两只小短手捧着手机在狂刷呢！给男朋友发了好多句悄悄话~ 💬💖",
        "叮咚！消息响个不停！乌萨奇在偷偷看芷萱今天种草了什么好吃的和漂亮美甲~ 📱✨",
        "手指飞快敲屏幕中！乌萨奇也在跟芷萱一起享受甜蜜互动好时光呢！🐰🌸",
        "好忙好忙~ 乌萨奇一边刷手机一边摇耳朵，今天也是社交小达人！💬🥰"
      ]
    },
    game_cheer: {
      propIcon: '🎉',
      propSub: '👑 棒!',
      imgClass: 'usagi-game-cheering',
      sound: 'coin',
      tag: '🎉 芷萱专属啦啦队',
      quotes: [
        "哇！芷萱太厉害啦！这手速和反应简直是游戏天才小仙女！乌萨奇在旁边为你摇旗呐喊！呀哈！🌟👑",
        "连击连击！芷萱冲呀！乌萨奇看得眼睛都直啦，给你献上一大朵向日葵！🌻🎮",
        "太帅了！所有高分通通拿下！今天游乐园最璀璨的超级大明星就是我们芷萱！🎉🍓",
        "打得太漂亮啦！坏情绪全都被敲碎了，芷萱笑起来的样子最可爱啦！呀哈！🔨💖"
      ]
    },
    dashboard: {
      propIcon: '🌟',
      propSub: '✨ 欢迎',
      imgClass: 'usagi-dashboard-welcome',
      sound: 'fanfare',
      tag: '🌟 欢迎回到手账总览',
      quotes: [
        "呀哈！欢迎颜芷萱大宝贝回到生活手账总览！今天也是充满奇迹和美好的一天！🌟💖",
        "叮咚！生活手账核心仪表盘已就绪！乌萨奇挥舞小魔杖，把今天满满的幸运全送给芷萱！✨🪄",
        "回到温馨小家啦！芷萱今天喝了几杯水、心情怎么样？乌萨奇全都帮你盯得好好的哦！🏠🌸",
        "芷萱一打开手账，整个世界都变得粉嫩又闪亮！乌萨奇在总览台给你比个大大的小心心！🥰🌟"
      ]
    },
    yaha: {
      propIcon: '🥳',
      propSub: '🎉 呀哈狂欢',
      imgClass: 'usagi-yaha-party',
      sound: 'yaha',
      tag: '🥳 狂欢派对！呀哈！',
      quotes: [
        "呀哈！呀哈！狂欢派对开启！芷萱今天能量大爆发，乌萨奇疯狂摇旗放彩带！🥳🎉",
        "呀哈！世界第一元气美少女颜芷萱闪亮登场！好运直接翻倍翻倍再翻倍！呀哈！🐰💥",
        "呀哈！今天芷萱开心得像踩着棉花糖！乌萨奇原地托马斯回旋大欢呼！呀哈！🌈✨",
        "开心就放声欢呼！乌萨奇陪芷萱一起大喊：呀哈——！今天我们是最幸运的人！🎉🐰"
      ]
    },
    ura: {
      propIcon: '🤩',
      propSub: '⚡️ 活力充能',
      imgClass: 'usagi-ura-energy',
      sound: 'fanfare',
      tag: '🤩 超能充能站 · 乌拉！',
      quotes: [
        "乌拉！芷萱今天电量 1000%！星星眼闪耀全场，整个人都在发光发亮！🤩⚡️",
        "好强的元气能量波！芷萱今天做什么都顺风顺水，乌萨奇也被充满电啦！✨🚀",
        "动力拉满！冲冲冲！今天的芷萱无所不能，乌萨奇为你高举胜利小旗帜！🚩🌟",
        "眼神里闪着星星的小仙女来啦！乌拉乌拉！今天的所有困难统统退散！💫🤩"
      ]
    },
    happy: {
      propIcon: '🥰',
      propSub: '💖 甜美心动',
      imgClass: 'usagi-happy-dancing',
      sound: 'sparkle',
      tag: '🥰 乌萨奇甜甜爱心波',
      quotes: [
        "看到芷萱甜甜的笑脸，乌萨奇整只兔子都被融化啦！好甜好甜的心情，抱抱~ 🥰💖",
        "芷萱一开心，全宇宙的小花都开好啦！男朋友也隔空收到了你甜甜的爱意~ 🌸✨",
        "今天也是被蜜糖包裹的一天！芷萱笑起来的样子全世界最好看，多笑一笑哦！🍓💕",
        "生活中的每一个小确幸，都因为芷萱的笑容变得闪闪发光！耶！💖✨"
      ]
    },
    mood: {
      propIcon: '🎭',
      propSub: '心情晴雨表',
      imgClass: 'usagi-mood-station',
      sound: 'sparkle',
      tag: '🎭 乌萨奇心情晴雨表',
      quotes: [
        "今天芷萱的心情是晴天、多云还是微风呀？快选一个心情告诉乌萨奇，乌萨奇随时做你的贴心树洞！🎭💖",
        "不管是开心的呀哈、还是小小的委屈，乌萨奇都在这里认真倾听芷萱的每一个心声哦！🌸✨",
        "记录情绪和身体规律，是为了更好地宠爱自己！芷萱只管做最真实的自己，我们永远爱你！🐰💕"
      ]
    },
    expense: {
      propIcon: '💰',
      propSub: '👓 算账中',
      imgClass: 'usagi-bookkeeping',
      sound: 'coin',
      tag: '💰 乌萨奇理财小账房',
      quotes: [
        "乌萨奇扶了扶小眼镜：芷萱今天又认真记账啦！每一笔都清清楚楚，是会过日子又聪明的小富婆！👓💰",
        "叮咚！又省下一笔！小金库正在悄悄膨胀呢~ 芷萱记账的样子特别认真又迷人！🥕📈",
        "小账本记得明明白白，理财小能手非芷萱莫属！乌萨奇帮你把关，每一分钱都花得开开心心！✨💰",
        "记账是为了心中有数，生活是为了自己开心，芷萱只管快快乐乐做自己！💎💸"
      ]
    },
    countdown: {
      propIcon: '⏳',
      propSub: '✈️ 倒数',
      imgClass: 'usagi-counting',
      sound: 'sparkle',
      tag: '⏳ 倒数心动小助手',
      quotes: [
        "滴答滴答~ 乌萨奇每天都在帮芷萱倒数和男朋友见面的日子！又靠近幸福一大步啦！✈️💖",
        "每一个倒数的心愿都超级值得期待！旅行、生日、纪念日，乌萨奇陪着你们一起见证！📅✨",
        "今天距离相聚又少了一天！每一天的等待，都是为了见面那一刻更用力的拥抱！💑⏳",
        "倒数清单里装满了我们未来的回忆！每一天都充满盼头，芷萱冲呀！🎒🌟"
      ]
    },
    highlight: {
      propIcon: '⭐',
      propSub: '🫙 存瓶',
      imgClass: 'usagi-highlighting',
      sound: 'sparkle',
      tag: '🪄 乌萨奇每日高光瓶',
      quotes: [
        "哇！芷萱今天又收集到了一颗闪闪发光的高光小星星！乌萨奇挥起魔法棒帮你装进许愿瓶存好！⭐🫙",
        "生活中的每一个小确幸都值得被感恩珍藏！芷萱眼里的光芒，比天上的星星还要耀眼呢！🪄🌸",
        "睡前记下一件好事，今晚的梦境就会全是甜甜的草莓味！乌萨奇最喜欢听芷萱讲开心事啦！🍓✨",
        "手账里的点点滴滴，都是芷萱认真爱生活的证明，超级珍贵，乌萨奇好喜欢！📖💖"
      ]
    }
  };

  const IDLE_REMINDERS = [
    { tag: '✨ 专属陪伴', text: '芷萱今天也要开开心心，元气满满！呀哈！💖' },
    { tag: '👀 护眼提醒', text: '芷萱，抬头看看窗外或者远处的绿色吧！眨眨眼睛转一转，放松一下眼部肌肉~ 🌿👀' },
    { tag: '🍱 吃饭关怀', text: '生活很忙，但一定要好好吃饭！多吃好吃的，把心情和胃都填得满满当当~ 🍰🍓' },
    { tag: '💖 男友传情', text: '两座城市的风都在替他拥抱你~ 男友今天也在非常用力地想念芷萱哦！💌✈️' },
    { tag: '🌟 元气鼓励', text: '做你想做的事，成为你想成为的人，芷萱闪闪发光的样子最有魅力啦！🌟✨' }
  ];

  function init() {
    const savedRoam = localStorage.getItem('usagi_pet_roam');
    if (savedRoam !== null) {
      isRoaming = savedRoam === 'true';
    }

    const container = document.getElementById('usagi-mascot-container');
    if (container) {
      if (isRoaming) {
        container.classList.add('roaming');
        updatePositionStyle();
      } else {
        container.classList.remove('roaming');
      }
      updateDockUI();
    }

    // Window resize handler
    window.addEventListener('resize', () => {
      const maxX = Math.max(30, (window.innerWidth || 1024) - 240);
      if (posX > maxX) posX = maxX;
      updatePositionStyle();
    });

    // Start movement loop
    startLoop();

    // Check saved minimize state
    try {
      const savedMin = localStorage.getItem('usagi_pet_minimized');
      if (savedMin === 'true') {
        toggleMinimize(true);
      }
    } catch (e) {}

    // Welcome speech or URL-triggered state test
    const urlParams = new URLSearchParams(window.location.search);
    const testMin = urlParams.get('test_min');
    if (testMin === '1') {
      setTimeout(() => {
        toggleMinimize(true);
      }, 400);
    }
    const testAct = urlParams.get('test_act');
    if (testAct) {
      setTimeout(() => {
        setState(testAct);
      }, 500);
    } else {
      setTimeout(() => {
        // 开屏默认进入今日总览，立即挥舞金光魔杖热情迎接！
        reactTo('dashboard');
      }, 500);
    }

    // 初始化桌面物理拖拽抛掷引擎与语音状态
    setTimeout(() => {
      initPhysicsToss();
      if (window.UsagiVoice) UsagiVoice.updateButtonUI();
      checkDailyReminders();
    }, 1500);
  }

  function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function tick() {
      if (isRoaming && !isMinimized && !isPaused && currentState !== 'sleep') {
        const container = document.getElementById('usagi-mascot-container');
        const mascotImg = document.getElementById('usagi-mascot-img');

        if (container) {
          const minX = 20;
          const maxX = Math.max(minX + 40, (window.innerWidth || 1024) - 240);

          posX += direction * speed;

          // Hit Right Boundary -> Turn Left
          if (posX >= maxX) {
            posX = maxX;
            direction = -1;
            if (mascotImg) mascotImg.style.transform = 'scaleX(-1)';
            pauseWaddle(2600);
            if (Math.random() < 0.4) speakRandomSweet();
          }
          // Hit Left Boundary -> Turn Right
          else if (posX <= minX) {
            posX = minX;
            direction = 1;
            if (mascotImg) mascotImg.style.transform = 'scaleX(1)';
            pauseWaddle(2600);
            if (Math.random() < 0.4) speakRandomSweet();
          }

          updatePositionStyle();
        }
      }

      // Check periodic automatic reminder (every 32s)
      const now = Date.now();
      if (now - lastReminderTime > 32000 && !isMinimized) {
        lastReminderTime = now;
        speakRandomSweet();
      }

      animFrameId = requestAnimationFrame(tick);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function pauseWaddle(ms) {
    isPaused = true;
    if (pauseTimeout) clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(() => {
      isPaused = false;
    }, ms);
  }

  function updatePositionStyle() {
    const container = document.getElementById('usagi-mascot-container');
    const bubble = document.getElementById('usagi-speech-bubble');
    if (!container) return;

    const isMobile = (window.innerWidth < 768);
    container.style.bottom = isMobile ? 'calc(76px + env(safe-area-inset-bottom, 12px))' : '24px';

    if (isMinimized) {
      container.style.left = 'auto';
      container.style.right = isMobile ? '12px' : '24px';
      return;
    }

    const screenW = window.innerWidth || 1024;
    const minX = 16;
    const maxX = Math.max(minX + 30, screenW - (isMobile ? 180 : 240));

    if (isRoaming) {
      if (posX > maxX) posX = maxX;
      if (posX < minX) posX = minX;
      container.style.left = posX + 'px';
      container.style.right = 'auto';

      if (bubble) {
        if (posX < 160) {
          bubble.style.left = '0px';
          bubble.style.right = 'auto';
          bubble.style.transform = 'none';
          bubble.classList.add('bubble-align-left');
          bubble.classList.remove('bubble-align-right');
        } else if (posX > screenW - 260) {
          bubble.style.left = 'auto';
          bubble.style.right = '0px';
          bubble.style.transform = 'none';
          bubble.classList.add('bubble-align-right');
          bubble.classList.remove('bubble-align-left');
        } else {
          bubble.style.left = '50%';
          bubble.style.right = 'auto';
          bubble.style.transform = 'translateX(-50%)';
          bubble.classList.remove('bubble-align-left', 'bubble-align-right');
        }
      }
    } else {
      container.style.left = 'auto';
      container.style.right = window.innerWidth < 768 ? '12px' : '24px';
      if (bubble) {
        bubble.style.left = 'auto';
        bubble.style.right = '0px';
        bubble.style.transform = 'none';
        bubble.classList.add('bubble-align-right');
        bubble.classList.remove('bubble-align-left');
      }
    }
  }

  function toggleRoam() {
    isRoaming = !isRoaming;
    localStorage.setItem('usagi_pet_roam', isRoaming);

    const container = document.getElementById('usagi-mascot-container');
    if (container) {
      if (isRoaming) {
        container.classList.add('roaming');
        posX = container.offsetLeft || (window.innerWidth - 150);
        updatePositionStyle();
        speak('🚶 漫步模式', '乌萨奇开始在屏幕底部走来走去巡逻啦~ 陪伴芷萱！🐰');
      } else {
        container.classList.remove('roaming');
        updatePositionStyle();
        speak('📍 驻守模式', '乌萨奇乖乖坐在右下角陪着芷萱哦~ 💖');
      }
    }
    updateDockUI();
    if (window.UsagiSound) UsagiSound.pop();
  }

  function toggleMinimize(forceState = null) {
    const container = document.getElementById('usagi-mascot-container');
    if (!container) return;

    if (forceState !== null) {
      isMinimized = !!forceState;
    } else {
      isMinimized = !isMinimized;
    }

    container.classList.toggle('minimized', isMinimized);
    if (isMinimized) {
      container.style.left = 'auto';
      container.style.right = window.innerWidth < 768 ? '12px' : '24px';
    } else {
      updatePositionStyle();
    }
    try {
      localStorage.setItem('usagi_pet_minimized', isMinimized ? 'true' : 'false');
    } catch (e) {}

    // Update Header Button UI
    const headerBtn = document.getElementById('btn-pet-toggle-header');
    const headerText = document.getElementById('header-pet-toggle-text');
    if (headerText) {
      headerText.innerText = isMinimized ? '召唤乌萨奇' : '收起乌萨奇';
    }
    if (headerBtn) {
      if (isMinimized) {
        headerBtn.classList.add('bg-pink-100', 'border-pink-300', 'text-pink-700');
        headerBtn.classList.remove('bg-amber-50', 'border-amber-300', 'text-amber-800');
        headerBtn.setAttribute('title', '点击召唤乌萨奇陪伴助手 ✨');
      } else {
        headerBtn.classList.remove('bg-pink-100', 'border-pink-300', 'text-pink-700');
        headerBtn.classList.add('bg-amber-50', 'border-amber-300', 'text-amber-800');
        headerBtn.setAttribute('title', '点击收起乌萨奇助手');
      }
    }

    // Update Dock Close Icon
    const minIcon = document.getElementById('pet-min-icon');
    if (minIcon) {
      minIcon.innerText = isMinimized ? '🐰' : '✕';
    }

    if (isMinimized) {
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      // Waking up / expanding
      if (window.UsagiSound) UsagiSound.yaha();
      if (typeof confettiRain === 'function') confettiRain(20);
      speak('✨ 乌萨奇来啦', '呀哈！芷萱召唤乌萨奇啦~ 我会一直乖乖陪着你哦！💖🐰');
    }
  }

  function updateDockUI() {
    const btn = document.getElementById('btn-pet-roam');
    const icon = document.getElementById('pet-roam-icon');
    const text = document.getElementById('pet-roam-text');

    if (btn) {
      if (isRoaming) {
        btn.classList.add('active');
        if (icon) icon.innerText = '🚶';
        if (text) text.innerText = '漫步';
      } else {
        btn.classList.remove('active');
        if (icon) icon.innerText = '📍';
        if (text) text.innerText = '停下';
      }
    }
  }

  function speak(tag, message, autoVoice = false) {
    const tagEl = document.getElementById('usagi-speech-tag');
    const textEl = document.getElementById('usagi-speech-text');
    const bubble = document.getElementById('usagi-speech-bubble');

    if (tagEl) tagEl.innerText = tag;
    if (textEl) textEl.innerText = message;
    else if (bubble) bubble.innerText = message;

    if (bubble) {
      bubble.classList.remove('bubble-pop');
      void bubble.offsetWidth;
      bubble.classList.add('bubble-pop');
    }

    if (autoVoice && window.UsagiVoice) {
      UsagiVoice.speak(message);
    }
  }

  function startZzzEffect() {
    stopZzzEffect();
    const zzzContainer = document.getElementById('usagi-zzz-container');
    if (!zzzContainer) return;
    zzzContainer.classList.remove('hidden');

    zzzInterval = setInterval(() => {
      if (currentState !== 'sleep') {
        stopZzzEffect();
        return;
      }
      const el = document.createElement('div');
      el.className = 'floating-zzz-item';
      const items = ['z', 'Z', '💤'];
      el.innerText = items[Math.floor(Math.random() * items.length)];
      el.style.fontSize = `${11 + Math.random() * 8}px`;
      el.style.right = `${10 + Math.random() * 20}px`;
      zzzContainer.appendChild(el);

      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2200);
    }, 750);
  }

  function stopZzzEffect() {
    if (zzzInterval) {
      clearInterval(zzzInterval);
      zzzInterval = null;
    }
    const zzzContainer = document.getElementById('usagi-zzz-container');
    if (zzzContainer) {
      zzzContainer.innerHTML = '';
      zzzContainer.classList.add('hidden');
    }
  }

  function setState(stateName, customMessage = null, durationMs = 20000) {
    const config = STATE_CONFIGS[stateName];
    if (!config) return;

    currentState = stateName;

    if (stateTimeout) clearTimeout(stateTimeout);

    // 1. Hide all action layers and show active action layer
    const allLayers = document.querySelectorAll('.usagi-action-layer');
    allLayers.forEach(el => el.classList.add('hidden'));
    const activeLayer = document.getElementById(`action-layer-${stateName}`);
    if (activeLayer) activeLayer.classList.remove('hidden');

    // 2. Update body animation state class on #usagi-bouncer
    const bouncer = document.getElementById('usagi-bouncer');
    if (bouncer) {
      const allBouncerStates = [
        'state-sleep', 'state-water', 'state-period',
        'state-comfort', 'state-tired', 'state-emo', 'state-angry',
        'state-calendar', 'state-habit', 'state-note', 'state-highlight',
        'state-watchlist', 'state-music', 'state-social',
        'state-game_cheer', 'state-happy', 'state-yaha', 'state-ura', 'state-mood',
        'state-expense', 'state-countdown',
        'state-love_hug', 'state-calm', 'state-dashboard'
      ];
      allBouncerStates.forEach(cls => bouncer.classList.remove(cls));
      bouncer.classList.add(`state-${stateName}`);
    }

    const mascotImg = document.getElementById('usagi-mascot-img');
    const propBox = document.getElementById('usagi-state-prop');
    const propIcon = document.getElementById('usagi-prop-icon');
    const propSub = document.getElementById('usagi-prop-sub');

    // Update Prop Badge
    if (propBox && propIcon && propSub) {
      propIcon.innerText = config.propIcon;
      propSub.innerText = config.propSub;
      propBox.classList.remove('hidden');
      propBox.style.animation = 'none';
      void propBox.offsetWidth;
      propBox.style.animation = 'propPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    // Update Mascot Image Halo / Filter
    if (mascotImg) {
      const allStateClasses = [
        'usagi-sleeping', 'usagi-drinking', 'usagi-period-care',
        'usagi-comforting', 'usagi-tired', 'usagi-emo', 'usagi-angry',
        'usagi-calendar', 'usagi-habit', 'usagi-note', 'usagi-highlighting',
        'usagi-watchlist', 'usagi-music',
        'usagi-game-cheering', 'usagi-happy-dancing',
        'usagi-yaha-party', 'usagi-ura-energy', 'usagi-mood-station',
        'usagi-bookkeeping', 'usagi-counting', 'usagi-calm', 'usagi-dashboard-welcome'
      ];
      allStateClasses.forEach(cls => mascotImg.classList.remove(cls));
      if (config.imgClass) mascotImg.classList.add(config.imgClass);
    }

    // Sleeping ZZZ effect
    if (stateName === 'sleep') {
      startZzzEffect();
    } else {
      stopZzzEffect();
    }

    // Sound effect
    if (window.UsagiSound && config.sound) {
      if (typeof UsagiSound[config.sound] === 'function') {
        UsagiSound[config.sound]();
      }
    }

    // Dialogue
    const quote = customMessage || config.quotes[Math.floor(Math.random() * config.quotes.length)];
    speak(config.tag, quote);

    pauseWaddle(4000);

    // Visual particles
    if (['happy', 'yaha', 'ura', 'mood', 'game_cheer', 'comfort', 'period', 'habit', 'calendar', 'music', 'highlight'].includes(stateName)) {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 30, spread: 65, origin: { y: 0.82 } });
      }
    }

    lastReminderTime = Date.now();

    // Auto clear after duration
    stateTimeout = setTimeout(() => {
      clearState();
    }, durationMs);
  }

  function clearState() {
    currentState = 'idle';
    stopZzzEffect();

    // 1. Hide all action layers
    const allLayers = document.querySelectorAll('.usagi-action-layer');
    allLayers.forEach(el => el.classList.add('hidden'));

    // 2. Remove all state classes from #usagi-bouncer
    const bouncer = document.getElementById('usagi-bouncer');
    if (bouncer) {
      const allBouncerStates = [
        'state-sleep', 'state-water', 'state-period',
        'state-comfort', 'state-tired', 'state-emo', 'state-angry',
        'state-calendar', 'state-habit', 'state-note', 'state-highlight',
        'state-watchlist', 'state-music', 'state-social',
        'state-game_cheer', 'state-happy', 'state-yaha', 'state-ura', 'state-mood',
        'state-expense', 'state-countdown',
        'state-love_hug', 'state-calm', 'state-dashboard'
      ];
      allBouncerStates.forEach(cls => bouncer.classList.remove(cls));
    }

    const propBox = document.getElementById('usagi-state-prop');
    if (propBox) propBox.classList.add('hidden');

    const mascotImg = document.getElementById('usagi-mascot-img');
    if (mascotImg) {
      const allStateClasses = [
        'usagi-sleeping', 'usagi-drinking', 'usagi-period-care',
        'usagi-comforting', 'usagi-tired', 'usagi-emo', 'usagi-angry',
        'usagi-calendar', 'usagi-habit', 'usagi-note', 'usagi-highlighting',
        'usagi-watchlist', 'usagi-music',
        'usagi-game-cheering', 'usagi-happy-dancing',
        'usagi-yaha-party', 'usagi-ura-energy', 'usagi-mood-station',
        'usagi-bookkeeping', 'usagi-counting', 'usagi-calm', 'usagi-dashboard-welcome'
      ];
      allStateClasses.forEach(cls => mascotImg.classList.remove(cls));
    }

    speak('✨ 专属陪伴', '芷萱今天也要开开心心，元气满满！呀哈！💖');
  }

  function triggerCategory(category) {
    if (category === 'water') setState('water');
    else if (category === 'sleep') setState('sleep');
    else if (category === 'love') setState('comfort');
    else setState(category);
  }

  function reactTo(event, data = null) {
    if (['dashboard', 'overview'].includes(event)) {
      setState('dashboard', data);
    } else if (event === 'sleep') {
      setState('sleep', data);
    } else if (event === 'water') {
      setState('water', data);
    } else if (event === 'period') {
      setState('period', data);
    } else if (event === 'love_hug') {
      setState('love_hug', data);
    } else if (['calm', 'peaceful'].includes(event)) {
      setState('calm', data);
    } else if (['tired', 'exhausted'].includes(event)) {
      setState('tired', data);
    } else if (['emo', 'sad', 'cry'].includes(event)) {
      setState('emo', data);
    } else if (['angry', 'stress', 'furious'].includes(event)) {
      setState('angry', data);
    } else if (event === 'comfort') {
      setState('comfort', data);
    } else if (event === 'calendar') {
      setState('calendar', data);
    } else if (['habit', 'habits'].includes(event)) {
      setState('habit', data);
    } else if (['note', 'notes'].includes(event)) {
      setState('note', data);
    } else if (['highlight', 'highlights'].includes(event)) {
      setState('highlight', data);
    } else if (['watchlist', 'movie', 'shop'].includes(event)) {
      setState('watchlist', data);
    } else if (['music', 'song'].includes(event)) {
      setState('music', data);
    } else if (event === 'yaha') {
      setState('yaha', data);
    } else if (event === 'ura') {
      setState('ura', data);
    } else if (event === 'happy') {
      setState('happy', data);
    } else if (['mood', 'moods'].includes(event)) {
      setState('mood', data);
    } else if (['game', 'game_cheer'].includes(event)) {
      setState('game_cheer', data);
    } else if (event === 'expense') {
      setState('expense', data);
    } else if (event === 'countdown') {
      setState('countdown', data);
    } else {
      if (STATE_CONFIGS[event]) setState(event, data);
    }
  }

  function speakRandomSweet() {
    if (currentState !== 'idle' && STATE_CONFIGS[currentState]) {
      const cfg = STATE_CONFIGS[currentState];
      const q = cfg.quotes[Math.floor(Math.random() * cfg.quotes.length)];
      speak(cfg.tag, q, true);
      return;
    }

    const item = IDLE_REMINDERS[Math.floor(Math.random() * IDLE_REMINDERS.length)];
    speak(item.tag, item.text, true);
  }

  let isTossing = false;
  let tossAnimId = null;

  function initPhysicsToss() {
    const container = document.getElementById('usagi-mascot-container');
    const bouncer = document.getElementById('usagi-bouncer');
    const mascotImg = document.getElementById('usagi-mascot-img');
    if (!container || !bouncer) return;

    let isPointerDown = false;
    let hasDragged = false;
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;
    let grabOffsetX = 0, grabOffsetY = 0;
    let trackHistory = [];
    let startTime = 0;

    function getPt(e) {
      return (e.touches && e.touches.length > 0) ? e.touches[0] : e;
    }

    function onStart(e) {
      if (e.target.closest('#usagi-assistant-dock') || e.target.closest('#btn-speech-voice-toggle') || e.target.closest('#usagi-minimized-pill')) {
        return;
      }

      const pt = getPt(e);
      if (!pt) return;

      isPointerDown = true;
      hasDragged = false;
      startTime = performance.now();
      startX = pt.clientX;
      startY = pt.clientY;

      const rect = container.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      grabOffsetX = pt.clientX - rect.left;
      grabOffsetY = pt.clientY - rect.top;

      trackHistory = [{ x: pt.clientX, y: pt.clientY, t: startTime }];

      if (tossAnimId) {
        cancelAnimationFrame(tossAnimId);
        tossAnimId = null;
      }
      isTossing = false;

      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    }

    function onMove(e) {
      if (!isPointerDown) return;
      const pt = getPt(e);
      if (!pt) return;

      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;

      if (!hasDragged && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        hasDragged = true;
        isPaused = true;
        container.classList.add('is-dragging');
        container.style.transition = 'none';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        if (window.UsagiSound) UsagiSound.pop();
        speak('🐰 抓起来啦！', '咦？抓我起来啦！芷萱要把我丢到哪里去呀~ 呀哈！✈️', true);
      }

      if (hasDragged) {
        if (e.cancelable) e.preventDefault();

        const curX = pt.clientX - grabOffsetX;
        const curY = pt.clientY - grabOffsetY;

        container.style.left = curX + 'px';
        container.style.top = curY + 'px';
        posX = curX;

        const now = performance.now();
        trackHistory.push({ x: pt.clientX, y: pt.clientY, t: now });
        if (trackHistory.length > 6) trackHistory.shift();
      }
    }

    function onEnd(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      container.classList.remove('is-dragging');

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);

      if (!hasDragged) {
        if (typeof handleUsagiClick === 'function') handleUsagiClick();
        return;
      }

      let vx = 0, vy = 0;
      if (trackHistory.length >= 2) {
        const last = trackHistory[trackHistory.length - 1];
        const first = trackHistory[0];
        const dt = Math.max(16, last.t - first.t);
        vx = ((last.x - first.x) / dt) * 18;
        vy = ((last.y - first.y) / dt) * 18;
      }

      const maxSpd = 36;
      vx = Math.max(-maxSpd, Math.min(maxSpd, vx));
      vy = Math.max(-maxSpd, Math.min(maxSpd, vy));

      if (Math.abs(vx) < 2 && Math.abs(vy) < 2) {
        finishToss(posX, container.offsetTop);
        return;
      }

      startFlingFlight(posX, container.offsetTop, vx, vy);
    }

    function startFlingFlight(startX, startY, initVx, initVy) {
      isTossing = true;
      container.classList.add('is-flying');
      container.style.transition = 'none';

      let x = startX;
      let y = startY;
      let vx = initVx;
      let vy = initVy;
      const gravity = 0.88;
      const friction = 0.988;
      const bounceCoeff = 0.72;
      let angle = 0;

      if (window.UsagiSound) UsagiSound.whoosh();
      speak('🚀 起飞啦！', '呀哈——！起飞啦！芷萱丢得好远呀！💫💨', true);

      function physicsStep() {
        if (!isTossing) return;

        x += vx;
        y += vy;
        vy += gravity;
        vx *= friction;
        vy *= friction;

        const screenW = window.innerWidth || 1024;
        const screenH = window.innerHeight || 800;
        const isMobile = screenW < 768;

        const w = container.offsetWidth || 110;
        const h = container.offsetHeight || 140;

        const minX = 8;
        const maxX = screenW - w - 8;
        const minY = 8;
        const maxY = screenH - h - (isMobile ? 86 : 28);

        let hitBoundary = false;

        if (x <= minX) {
          x = minX;
          vx = -vx * bounceCoeff;
          hitBoundary = true;
        } else if (x >= maxX) {
          x = maxX;
          vx = -vx * bounceCoeff;
          hitBoundary = true;
        }

        if (y <= minY) {
          y = minY;
          vy = -vy * bounceCoeff;
          hitBoundary = true;
        } else if (y >= maxY) {
          y = maxY;
          vy = -vy * 0.65;
          vx *= 0.82;
          hitBoundary = true;
        }

        if (hitBoundary && (Math.abs(vx) > 3 || Math.abs(vy) > 3)) {
          if (window.UsagiSound) UsagiSound.boing();
          if (mascotImg) {
            mascotImg.classList.add('usagi-bounce-squish');
            setTimeout(() => mascotImg.classList.remove('usagi-bounce-squish'), 320);
          }
        }

        angle += vx * 1.6;
        if (mascotImg) mascotImg.style.transform = `rotate(${Math.min(45, Math.max(-45, angle))}deg)`;

        container.style.left = x + 'px';
        container.style.top = y + 'px';

        if (y >= maxY - 2 && Math.abs(vy) < 1.2 && Math.abs(vx) < 0.8) {
          finishToss(x, y);
          return;
        }

        tossAnimId = requestAnimationFrame(physicsStep);
      }

      tossAnimId = requestAnimationFrame(physicsStep);
    }

    function finishToss(finalX, finalY) {
      isTossing = false;
      if (tossAnimId) cancelAnimationFrame(tossAnimId);
      container.classList.remove('is-flying');
      container.style.transition = '';

      if (mascotImg) mascotImg.style.transform = 'none';

      posX = finalX;
      isPaused = false;

      if (window.UsagiSound) UsagiSound.pop();
      if (typeof confettiRain === 'function') confettiRain(15);
      speak('✨ 稳稳落地', '呼~ 稳稳着陆啦！芷萱丢得真好玩，还想再飞一次！嘿嘿~ 🥰🐰', true);

      setTimeout(() => {
        updatePositionStyle();
      }, 500);
    }

    bouncer.addEventListener('mousedown', onStart);
    bouncer.addEventListener('touchstart', onStart, { passive: false });
  }

  function remindEvent(type, title, extraDate) {
    if (type === 'calendar') {
      const text = `乌萨奇收到啦！已将【${title}】记在日历${extraDate ? ' ' + extraDate : ''}上啦！到时准时提醒芷萱哦~ 📅🌸`;
      speak('📅 日历日程已记录', text, true);
    } else if (type === 'countdown') {
      const text = `哇！心动倒数【${title}】记录好啦！乌萨奇每天都陪着芷萱一起数着日子，好期待呀~ ⏳💖`;
      speak('⏳ 倒数心动中', text, true);
    } else if (type === 'todo') {
      const text = `待办小任务【${title}】添加成功！芷萱冲鸭，乌萨奇陪你一起搞定它！🥕✨`;
      speak('📝 待办任务已记下', text, true);
    }
  }

  function checkDailyReminders() {
    if (!window.USAGI_APP || !USAGI_APP.data) return;
    const data = USAGI_APP.data;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Countdown check
    if (data.countdowns && data.countdowns.length > 0) {
      for (const c of data.countdowns) {
        if (!c.targetDate) continue;
        const target = new Date(c.targetDate);
        const today = new Date(todayStr);
        const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          const msg = `芷萱快看！今天是期待已久的【${c.title}】啦！乌萨奇为你放彩花庆祝~ 呀哈！🎉💖`;
          speak('🎉 今天是大日子！', msg, true);
          if (typeof confettiRain === 'function') confettiRain(35);
          return;
        } else if (diffDays > 0 && diffDays <= 3) {
          const msg = `还有 ${diffDays} 天就是【${c.title}】啦！乌萨奇每天都在替芷萱数着日子，好期待呀~ ⏳✈️`;
          speak('⏳ 倒数提醒', msg, true);
          return;
        }
      }
    }

    // 2. Calendar check
    if (data.calendarEvents && data.calendarEvents.length > 0) {
      const todayEvents = data.calendarEvents.filter(e => e.date === todayStr && !e.completed);
      if (todayEvents.length > 0) {
        const firstEv = todayEvents[0];
        const msg = `芷萱，今天在日历上有特别日程【${firstEv.title}】哦！要记得注意时间，乌萨奇爱你！📅🌸`;
        speak('📅 今日特别日程', msg, true);
        return;
      }
    }

    // 3. Todo check
    if (data.todos && data.todos.length > 0) {
      const pendingTodos = data.todos.filter(t => !t.completed);
      if (pendingTodos.length > 0) {
        const firstTodo = pendingTodos[0];
        const msg = `芷萱小仙女，今天有待办事项【${firstTodo.text}】还没有打勾勾哦，乌萨奇陪你一起冲鸭！🥕💪`;
        speak('📝 今日待办提醒', msg, true);
        return;
      }
    }
  }

  return {
    init,
    toggleRoam,
    toggleMinimize,
    expand: () => toggleMinimize(false),
    minimize: () => toggleMinimize(true),
    isMinimized: () => isMinimized,
    triggerCategory,
    setState,
    clearState,
    reactTo,
    speak,
    speakRandomSweet,
    initPhysicsToss,
    remindEvent,
    checkDailyReminders,
    getState: () => currentState,
    isRoaming: () => isRoaming
  };
})();
window.UsagiPetManager = UsagiPetManager;


/* ============================================================
   2. GAME 1: 🍓 乌萨奇接水果大作战 (Fruit Catcher Game)
   ============================================================ */
const FruitGame = (function () {
  let canvas, ctx;
  let isRunning = false;
  let score = 0;
  let combo = 0;
  let timeLeft = 60;
  let timerInterval = null;
  let animId = null;
  let lastSpawn = 0;
  let items = [];
  let floatingTexts = [];

  // Player state
  const player = {
    x: 250,
    y: 310,
    width: 60,
    height: 60,
    speed: 8,
    moveLeft: false,
    moveRight: false
  };

  const ITEM_TYPES = [
    { emoji: '🍓', name: '草莓', pts: 10, speed: 2.2, weight: 35 },
    { emoji: '🥕', name: '胡萝卜', pts: 15, speed: 2.6, weight: 30 },
    { emoji: '💖', name: '专属爱心', pts: 30, speed: 3.0, weight: 15 },
    { emoji: '⭐', name: '幸运星', pts: 50, speed: 3.5, weight: 8 },
    { emoji: '⚡', name: '乌云闪电', pts: -15, speed: 2.8, weight: 12, isBad: true }
  ];

  function init() {
    canvas = document.getElementById('fruit-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const savedHigh = localStorage.getItem('usagi_fruit_high') || 0;
    const highEl = document.getElementById('fruit-high-score');
    if (highEl) highEl.innerText = savedHigh;

    setupEvents();
    drawIdleScreen();
  }

  function setupEvents() {
    if (!canvas) return;

    // Mouse movement
    canvas.addEventListener('mousemove', (e) => {
      if (!isRunning) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, mouseX));
    });

    // Touch movement
    canvas.addEventListener('touchmove', (e) => {
      if (!isRunning) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, touchX));
    }, { passive: false });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!isRunning) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = false;
    });
  }

  function start() {
    if (!canvas) init();
    isRunning = true;
    score = 0;
    combo = 0;
    timeLeft = 60;
    items = [];
    floatingTexts = [];
    lastSpawn = Date.now();
    player.x = canvas.width / 2;

    updateUI();

    const overlay = document.getElementById('fruit-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('fruit-timer');
      if (timerEl) timerEl.innerText = `${timeLeft}s`;

      if (timeLeft <= 0) {
        gameOver();
      }
    }, 1000);

    if (window.UsagiSound) UsagiSound.pop();
    gameLoop();
  }

  function spawnItem() {
    const totalWeight = ITEM_TYPES.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = ITEM_TYPES[0];

    for (const item of ITEM_TYPES) {
      if (rand < item.weight) {
        chosen = item;
        break;
      }
      rand -= item.weight;
    }

    items.push({
      ...chosen,
      x: 30 + Math.random() * (canvas.width - 60),
      y: -25,
      vy: chosen.speed + Math.random() * 0.8
    });
  }

  function gameLoop() {
    if (!isRunning) return;

    // Update keyboard player move
    if (player.moveLeft) {
      player.x = Math.max(player.width / 2, player.x - player.speed);
    }
    if (player.moveRight) {
      player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);
    }

    // Spawn items
    const now = Date.now();
    if (now - lastSpawn > 650) {
      spawnItem();
      lastSpawn = now;
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;

      // Check collision with player
      const hitY = it.y >= player.y - 10 && it.y <= player.y + 40;
      const hitX = Math.abs(it.x - player.x) < player.width / 2 + 16;

      if (hitY && hitX) {
        // Caught!
        if (it.isBad) {
          score = Math.max(0, score + it.pts);
          combo = 0;
          if (window.UsagiSound) UsagiSound.hit();
          addFloatingText(it.x, it.y, '-15 ⚡', '#EF4444');
        } else {
          combo++;
          const comboBonus = Math.floor(combo / 3) * 5;
          const ptsEarned = it.pts + comboBonus;
          score += ptsEarned;

          if (window.UsagiSound) {
            if (it.emoji === '💖' || it.emoji === '⭐') UsagiSound.sparkle();
            else UsagiSound.coin();
          }
          addFloatingText(it.x, it.y, `+${ptsEarned} ${it.emoji}`, '#10B981');

          if (combo === 4 || combo === 8 || combo === 12) {
            if (window.UsagiPetManager) {
              UsagiPetManager.reactTo('game', `连击 ${combo} Combo！芷萱太神啦！身手好敏捷！呀哈！🌟🍓`);
            }
          }
        }
        items.splice(i, 1);
        updateUI();
        continue;
      }

      // Out of bounds
      if (it.y > canvas.height + 30) {
        items.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    // Render Canvas
    render();

    animId = requestAnimationFrame(gameLoop);
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, alpha: 1 });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gentle clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(80, 50, 30, 0, Math.PI * 2);
    ctx.arc(110, 45, 36, 0, Math.PI * 2);
    ctx.arc(140, 50, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(420, 70, 26, 0, Math.PI * 2);
    ctx.arc(445, 65, 32, 0, Math.PI * 2);
    ctx.arc(470, 70, 26, 0, Math.PI * 2);
    ctx.fill();

    // Draw Falling Items
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of items) {
      ctx.fillText(it.emoji, it.x, it.y);
    }

    // Draw Usagi Basket Player
    drawUsagiPlayer(player.x, player.y);

    // Draw Floating Score Texts
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  function drawUsagiPlayer(x, y) {
    ctx.save();
    // Cute Kawaii Usagi Face & Basket
    ctx.translate(x, y);

    // Basket base
    ctx.fillStyle = '#FED7AA';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-28, 10, 56, 26, 12);
    ctx.fill();
    ctx.stroke();

    // Basket ribbon
    ctx.fillStyle = '#FB7185';
    ctx.fillRect(-26, 18, 52, 4);

    // Usagi Head
    ctx.fillStyle = '#FFFBEB';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;

    // Left Ear
    ctx.beginPath();
    ctx.ellipse(-14, -22, 6, 16, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Inner ear pink
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.ellipse(-14, -22, 3, 11, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.ellipse(14, -22, 6, 16, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Inner ear pink
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.ellipse(14, -22, 3, 11, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Face Circle
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(0, -2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(-7, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(-13, 2, 4, 0, Math.PI * 2);
    ctx.arc(13, 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (Cute Yaha Smile)
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 3, 4, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.restore();
  }

  function drawIdleScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUsagiPlayer(canvas.width / 2, 240);
  }

  function updateUI() {
    const scoreEl = document.getElementById('fruit-current-score');
    const comboEl = document.getElementById('fruit-combo');
    if (scoreEl) scoreEl.innerText = score;
    if (comboEl) comboEl.innerText = combo;
  }

  function gameOver() {
    isRunning = false;
    clearInterval(timerInterval);
    if (animId) cancelAnimationFrame(animId);

    const savedHigh = parseInt(localStorage.getItem('usagi_fruit_high') || '0', 10);
    let isNewRecord = false;
    if (score > savedHigh) {
      localStorage.setItem('usagi_fruit_high', score);
      isNewRecord = true;
      const highEl = document.getElementById('fruit-high-score');
      if (highEl) highEl.innerText = score;
    }

    if (window.UsagiSound) UsagiSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    }

    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('game', isNewRecord ? `哇！芷萱刷新了最高纪录！${score}分！太神啦！👑💖` : `挑战结束！芷萱狂揽 ${score} 分！乌萨奇把大奖章颁给你！🏆🍓`);
    }

    const overlay = document.getElementById('fruit-overlay');
    const titleEl = document.getElementById('fruit-overlay-title');
    const descEl = document.getElementById('fruit-overlay-desc');

    if (overlay && titleEl && descEl) {
      overlay.classList.remove('hidden');
      titleEl.innerText = isNewRecord ? '🎉 哇！芷萱刷新了最高纪录！🏆' : '🍓 挑战结束啦！芷萱太棒啦！✨';
      descEl.innerHTML = `本次得分：<span class="text-amber-300 font-black text-base">${score} 分</span><br>最高连击：<span class="text-rose-300 font-bold">${combo} Combo</span><br><span class="text-xs text-stone-200 mt-2 block">乌萨奇把装满的水果篮和满满的爱意送给芷萱~ 💖</span>`;
    }
  }

  return { init, start };
})();
window.FruitGame = FruitGame;


/* ============================================================
   3. GAME 2: 💖 异地恋心有灵犀 · 翻翻乐 (Love Memory Match)
   ============================================================ */
const MemoryGame = (function () {
  const PAIRS = [
    { id: 1, icon: '💌', name: '异地情书' },
    { id: 2, icon: '✈️', name: '机票见面' },
    { id: 3, icon: '🧋', name: '喝奶茶' },
    { id: 4, icon: '🎬', name: '看电影' },
    { id: 5, icon: '🧸', name: '深情熊抱' },
    { id: 6, icon: '🌸', name: '手牵手' },
    { id: 7, icon: '🍲', name: '吃海底捞' },
    { id: 8, icon: '💍', name: '永远爱你' }
  ];

  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let seconds = 0;
  let timerInterval = null;
  let isLocked = false;

  function init() {
    const grid = document.getElementById('memory-game-grid');
    if (!grid) return;

    // Reset state
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    flippedCards = [];
    isLocked = false;

    if (timerInterval) clearInterval(timerInterval);
    updateStats();

    const winBox = document.getElementById('memory-win-box');
    if (winBox) winBox.classList.add('hidden');

    // Create 16 cards (8 pairs) & shuffle
    const deck = [...PAIRS, ...PAIRS].map((item, idx) => ({
      ...item,
      uid: `${item.id}-${idx}`
    }));

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    cards = deck;

    // Render Grid
    grid.innerHTML = cards.map(c => `
      <div class="memory-card" data-id="${c.id}" data-uid="${c.uid}" onclick="MemoryGame.flipCard(this)">
        <div class="memory-card-inner">
          <div class="memory-card-front">
            <span class="text-2xl animate-pulse">🐰</span>
            <span class="text-[9px] font-black text-rose-400 mt-1">USAGI</span>
          </div>
          <div class="memory-card-back">
            <span class="text-2xl">${c.icon}</span>
            <span class="text-[10px] font-black text-stone-700 mt-0.5">${c.name}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Start timer on first move
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      seconds++;
      updateTimerUI();
    }, 1000);
  }

  function updateTimerUI() {
    const timerEl = document.getElementById('memory-timer');
    if (!timerEl) return;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timerEl.innerText = `${m}:${s}`;
  }

  function updateStats() {
    const movesEl = document.getElementById('memory-moves');
    if (movesEl) movesEl.innerText = moves;
    updateTimerUI();
  }

  function flipCard(cardEl) {
    if (isLocked) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    startTimer();

    cardEl.classList.add('flipped');
    flippedCards.push(cardEl);

    if (window.UsagiSound) UsagiSound.pop();

    if (flippedCards.length === 2) {
      moves++;
      updateStats();
      checkMatch();
    }
  }

  function checkMatch() {
    isLocked = true;
    const [card1, card2] = flippedCards;
    const id1 = card1.getAttribute('data-id');
    const id2 = card2.getAttribute('data-id');

    if (id1 === id2) {
      // Matched!
      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];
        isLocked = false;

        if (window.UsagiSound) UsagiSound.coin();
        if (window.UsagiPetManager) {
          UsagiPetManager.reactTo('game', '哇！芷萱一下子就找到了！心有灵犀大满分！💖👑');
        }

        if (matchedPairs === PAIRS.length) {
          gameWin();
        }
      }, 350);
    } else {
      // Mismatch
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
      }, 750);
    }
  }

  function gameWin() {
    clearInterval(timerInterval);
    timerInterval = null;

    if (window.UsagiSound) UsagiSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }

    const winBox = document.getElementById('memory-win-box');
    const msgEl = document.getElementById('memory-win-msg');

    if (winBox && msgEl) {
      winBox.classList.remove('hidden');
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      msgEl.innerText = `恭喜芷萱！仅用 ${moves} 步、${m > 0 ? `${m}分` : ''}${s}秒 就找齐了全部 8 对恋爱回忆！默契值 100% 满分~ 💖`;
    }
  }

  return { init, flipCard };
})();
window.MemoryGame = MemoryGame;


/* ============================================================
   4. GAME 3: 🪵 敲木鱼乌萨奇 · 烦恼功德解压机 (Zen Wooden Fish)
   ============================================================ */
const WoodenFishGame = (function () {
  let count = parseInt(localStorage.getItem('usagi_merit_count') || '0', 10);
  let autoInterval = null;
  let isAuto = false;

  const BLESSINGS = [
    '芷萱快乐值 +1 🌸',
    '所有烦恼 -9999 💨',
    '男友爱意 +10000 💖',
    '今天开开心心 ✨',
    '运气爆棚 +888 🍀',
    '经期痛痛彻底飞走 🌸',
    '怎么吃都不胖 🍰',
    '今晚睡得超香超甜 🌙',
    '皮肤白里透红 🍼',
    '好运连连 呀哈！🐰',
    '考试/工作顺风顺水 💯',
    '心愿通通实现 🌟'
  ];

  function init() {
    updateCountUI();

    // Space key listener for wooden fish
    window.addEventListener('keydown', (e) => {
      const tabGames = document.getElementById('tab-games');
      const fishPanel = document.getElementById('game-view-fish');
      if (tabGames && !tabGames.classList.contains('hidden') && fishPanel && !fishPanel.classList.contains('hidden')) {
        if (e.code === 'Space') {
          e.preventDefault();
          knock();
        }
      }
    });
  }

  function knock(e) {
    count++;
    localStorage.setItem('usagi_merit_count', count);
    updateCountUI();

    if (window.UsagiSound) UsagiSound.woodenFish();

    // Button animation
    const btn = document.getElementById('wooden-fish-btn');
    if (btn) {
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 100);
    }

    // Spawn floating text
    spawnFloatingText();

    if (count % 7 === 0) {
      if (window.UsagiPetManager) {
        UsagiPetManager.reactTo('happy', '咚咚咚~ 烦恼全敲跑！芷萱的功德和快乐值一直在涨呢！🌸✨');
      }
    }

    // Update combo label
    const label = document.getElementById('fish-combo-label');
    if (label) {
      const msg = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
      label.innerText = `✨ ${msg}`;
    }
  }

  function spawnFloatingText() {
    const container = document.getElementById('merit-floating-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'floating-merit-text';
    const text = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
    el.innerText = text;

    // Randomize colors
    const colors = ['#E11D48', '#D97706', '#059669', '#7C3AED', '#DB2777'];
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.top = '40%';
    el.style.left = `${45 + (Math.random() * 20 - 10)}%`;

    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }

  function toggleAuto() {
    isAuto = !isAuto;
    const btnText = document.getElementById('auto-fish-text');
    const icon = document.getElementById('auto-fish-icon');

    if (isAuto) {
      if (btnText) btnText.innerText = '停止敲击';
      if (icon) icon.innerText = '⏸️';
      autoInterval = setInterval(() => {
        knock();
      }, 1000);
    } else {
      if (btnText) btnText.innerText = '自动敲击';
      if (icon) icon.innerText = '🧘';
      if (autoInterval) clearInterval(autoInterval);
    }
    if (window.UsagiSound) UsagiSound.pop();
  }

  function reset() {
    if (confirm('确定要将今日积攒的功德快乐值清零重新开始吗？')) {
      count = 0;
      localStorage.setItem('usagi_merit_count', '0');
      updateCountUI();
      if (window.UsagiSound) UsagiSound.pop();
    }
  }

  function updateCountUI() {
    const countEl = document.getElementById('fish-total-count');
    if (countEl) countEl.innerText = count;
  }

  return { init, knock, toggleAuto, reset };
})();
window.WoodenFishGame = WoodenFishGame;


/* ============================================================
   5. GAME 4: 🎁 心动盲盒扭蛋机 · 男友专属特权兑换券 (Boyfriend Vouchers)
   ============================================================ */
const GachaGame = (function () {
  const VOUCHERS = [
    {
      id: 1,
      code: 'LOVE-2026-001',
      tag: '🔥 绝对优先',
      title: '💌 【秒回哄聊特权卡】',
      desc: '凭此卡，男友承诺无论多忙，收到芷萱消息必须秒回！芷萱不开心时全程温柔讲笑话、当专属出气筒，直到把芷萱逗笑为止！',
      icon: '💌'
    },
    {
      id: 2,
      code: 'LOVE-2026-002',
      tag: '✈️ 异地专属',
      title: '✈️ 【千里奔赴见面卡】',
      desc: '只要芷萱想见男友，男友立刻买最近一班机票或高铁飞奔到芷萱身边，给芷萱一个超级用力的拥抱！',
      icon: '✈️'
    },
    {
      id: 3,
      code: 'LOVE-2026-003',
      tag: '🍲 美食任选',
      title: '🍲 【豪华大餐任选卡】',
      desc: '海底捞、日料、韩式烤肉、甜品奶茶全凭芷萱钦点！男友全程剥虾、烤肉、倒饮料并无条件买单~',
      icon: '🍲'
    },
    {
      id: 4,
      code: 'LOVE-2026-004',
      tag: '🧸 充电抱抱',
      title: '🧸 【深情熊抱充电卡】',
      desc: '见面时随时随地兑现 30 分钟无间隙超长熊抱，把异地恋所有的思念统统补回来，给足满满安全感！',
      icon: '🧸'
    },
    {
      id: 5,
      code: 'LOVE-2026-005',
      tag: '🎵 温暖治愈',
      title: '🎵 【专属哄睡唱歌卡】',
      desc: '失眠或睡不着时，连麦给芷萱唱她最喜欢的《城外》《小白》《有我呢》或周杰伦歌曲，哄芷萱香香入睡~',
      icon: '🎵'
    },
    {
      id: 6,
      code: 'LOVE-2026-006',
      tag: '🥺 认错免罚',
      title: '🥺 【撒娇无条件认错券】',
      desc: '任何小别扭或小摩擦，出示此券男友必须立刻端正态度真诚撒娇认错，芷萱宝宝永远是对的！',
      icon: '🥺'
    },
    {
      id: 7,
      code: 'LOVE-2026-007',
      tag: '🛒 宠溺惊喜',
      title: '🛒 【清空心愿购物车卡】',
      desc: '芷萱看中并犹豫很久的小裙子、香水、化妆品或盲盒手办，男友一键全款买下包邮到家！',
      icon: '🛒'
    },
    {
      id: 8,
      code: 'LOVE-2026-008',
      tag: '🧋 甜蜜空投',
      title: '🧋 【奶茶外卖空投卡】',
      desc: '芷萱想喝奶茶但懒得出门？男友立刻跨省外卖空投一杯热乎乎的珍珠果茶到芷萱楼下！',
      icon: '🧋'
    }
  ];

  let unlockedIds = JSON.parse(localStorage.getItem('usagi_unlocked_vouchers') || '[]');
  let isSpinning = false;
  let currentCard = null;

  function init() {
    updateUnlockedCountUI();
    renderWallet();
  }

  function spin() {
    if (isSpinning) return;
    isSpinning = true;

    if (window.UsagiSound) UsagiSound.gacha();

    const machineBody = document.getElementById('gacha-machine-body');
    const spinBtn = document.getElementById('btn-spin-gacha');

    if (machineBody) {
      machineBody.style.transform = 'scale(1.06) rotate(3deg)';
      setTimeout(() => { machineBody.style.transform = 'scale(1.06) rotate(-3deg)'; }, 150);
      setTimeout(() => { machineBody.style.transform = 'scale(1) rotate(0deg)'; }, 350);
    }
    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.innerText = '🌀 扭蛋转动中...';
    }

    setTimeout(() => {
      // Pick random voucher
      const chosen = VOUCHERS[Math.floor(Math.random() * VOUCHERS.length)];
      currentCard = chosen;

      if (!unlockedIds.includes(chosen.id)) {
        unlockedIds.push(chosen.id);
        localStorage.setItem('usagi_unlocked_vouchers', JSON.stringify(unlockedIds));
      }

      displayVoucher(chosen);
      updateUnlockedCountUI();
      renderWallet();

      if (window.UsagiPetManager) {
        UsagiPetManager.reactTo('game', `扭出【${chosen.title}】啦！快截图发给男友让他兑现！🎁💖`);
      }

      if (window.UsagiSound) UsagiSound.sparkle();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 } });
      }

      isSpinning = false;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.innerText = '🪙 投入心动币 · 扭一扭！';
      }
    }, 600);
  }

  function displayVoucher(v) {
    const codeEl = document.getElementById('voucher-code');
    const tagEl = document.getElementById('voucher-tag');
    const titleEl = document.getElementById('voucher-title');
    const descEl = document.getElementById('voucher-desc');

    if (codeEl) codeEl.innerText = `NO. ${v.code}`;
    if (tagEl) tagEl.innerText = v.tag;
    if (titleEl) titleEl.innerText = v.title;
    if (descEl) descEl.innerText = v.desc;
  }

  function updateUnlockedCountUI() {
    const countEl = document.getElementById('gacha-total-unlocked');
    if (countEl) {
      countEl.innerText = `已解锁 ${unlockedIds.length} / ${VOUCHERS.length} 张`;
    }
  }

  function toggleWallet() {
    const wallet = document.getElementById('gacha-wallet-list');
    if (!wallet) return;
    wallet.classList.toggle('hidden');
    renderWallet();
    if (window.UsagiSound) UsagiSound.pop();
  }

  function renderWallet() {
    const wallet = document.getElementById('gacha-wallet-list');
    if (!wallet) return;

    if (unlockedIds.length === 0) {
      wallet.innerHTML = '<p class="text-xs text-stone-400 py-3 text-center">暂无已解锁特权，快投入心动币扭一扭吧！🎁</p>';
      return;
    }

    const items = VOUCHERS.filter(v => unlockedIds.includes(v.id));
    wallet.innerHTML = items.map(v => `
      <div class="p-3 bg-pink-50/80 rounded-xl border border-pink-200 flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-lg">${v.icon}</span>
          <div>
            <p class="font-bold text-stone-800">${v.title}</p>
            <p class="text-[10px] text-stone-500 font-mono">${v.code}</p>
          </div>
        </div>
        <button onclick="GachaGame.claimSpecificVoucher('${v.title}')" class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] shadow-xs whitespace-nowrap cursor-pointer">
          兑现 💌
        </button>
      </div>
    `).join('');
  }

  function claimVoucher() {
    if (!currentCard) {
      alert('请先扭出一张特权兑换券再向男友兑现哦！✨');
      return;
    }
    claimSpecificVoucher(currentCard.title);
  }

  function claimSpecificVoucher(title) {
    const textToCopy = `【颜芷萱专属恋爱特权兑现】💖\n亲爱的男朋友！我刚刚在乌萨奇手账游乐园扭出了【${title}】！\n承诺 100% 兑现，快来找我兑现特权吧~ 🐰✨`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert(`兑现情话已复制到剪贴板！📋💖\n\n「${title}」\n快去微信发送给男朋友兑现吧！`);
    }).catch(() => {
      alert(`已向男朋友出示特权卡：【${title}】！💖 截图发给他立刻兑现哦！`);
    });

    if (window.UsagiSound) UsagiSound.sparkle();
  }

  return { init, spin, toggleWallet, claimVoucher, claimSpecificVoucher };
})();
window.GachaGame = GachaGame;


/* ============================================================
   6. GAME 5: 🔨 乌萨奇打地鼠 · 把不开心统统敲飞 (Whack Game)
   ============================================================ */
const WhackGame = (function () {
  let score = 0;
  let timeLeft = 30;
  let timerInterval = null;
  let moleTimer = null;
  let isRunning = false;
  let activeHole = -1;

  const TARGETS = [
    { type: 'bad', emoji: '👾', name: '焦虑怪', pts: 10 },
    { type: 'bad', emoji: '😴', name: '疲劳怪', pts: 10 },
    { type: 'bad', emoji: '🌧️', name: 'Emo怪', pts: 10 },
    { type: 'bad', emoji: '🤕', name: '肚肚痛', pts: 10 },
    { type: 'bad', emoji: '💢', name: '小烦躁', pts: 10 },
    { type: 'usagi', emoji: '🐰', name: '乌萨奇', pts: -5 }
  ];

  function init() {
    const grid = document.getElementById('whack-grid');
    if (!grid) return;

    // Render 9 holes
    grid.innerHTML = Array.from({ length: 9 }).map((_, i) => `
      <div class="mole-hole" id="mole-hole-${i}" onclick="WhackGame.whack(${i})">
        <div class="mole-inner-shadow"></div>
        <div class="mole-target" id="mole-target-${i}">
          <span class="text-3xl sm:text-4xl select-none" id="mole-emoji-${i}">👾</span>
          <span class="text-[10px] font-black text-amber-900 bg-white/80 px-2 py-0.5 rounded-full mt-1 select-none" id="mole-name-${i}">焦虑怪</span>
        </div>
      </div>
    `).join('');
  }

  function start() {
    if (!document.getElementById('mole-hole-0')) init();

    isRunning = true;
    score = 0;
    timeLeft = 30;
    updateUI();

    const startBtn = document.getElementById('btn-whack-start');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> 进行中...';
    }

    if (window.UsagiSound) UsagiSound.pop();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateUI();
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    popUpLoop();
  }

  function popUpLoop() {
    if (!isRunning) return;

    // Hide previous
    if (activeHole !== -1) {
      const prev = document.getElementById(`mole-target-${activeHole}`);
      if (prev) prev.classList.remove('up');
    }

    // Pick new random hole
    const holeIdx = Math.floor(Math.random() * 9);
    activeHole = holeIdx;

    // Pick target
    const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const targetEl = document.getElementById(`mole-target-${holeIdx}`);
    const emojiEl = document.getElementById(`mole-emoji-${holeIdx}`);
    const nameEl = document.getElementById(`mole-name-${holeIdx}`);

    if (targetEl && emojiEl && nameEl) {
      targetEl.setAttribute('data-type', target.type);
      targetEl.setAttribute('data-pts', target.pts);
      emojiEl.innerText = target.emoji;
      nameEl.innerText = target.name;
      targetEl.classList.add('up');
    }

    // Dynamic pop speed
    const duration = Math.max(500, 1100 - (30 - timeLeft) * 20);
    moleTimer = setTimeout(popUpLoop, duration);
  }

  function whack(idx) {
    if (!isRunning) return;
    if (idx !== activeHole) return;

    const targetEl = document.getElementById(`mole-target-${idx}`);
    if (!targetEl || !targetEl.classList.contains('up')) return;

    const type = targetEl.getAttribute('data-type');
    const pts = parseInt(targetEl.getAttribute('data-pts') || '10', 10);

    targetEl.classList.remove('up');
    activeHole = -1;

    if (type === 'usagi') {
      // Whacked Usagi!
      score = Math.max(0, score + pts);
      if (window.UsagiSound) UsagiSound.hit();
      const emojiEl = document.getElementById(`mole-emoji-${idx}`);
      if (emojiEl) emojiEl.innerText = '🥺';
    } else {
      // Whacked bad monster!
      score += pts;
      if (window.UsagiSound) UsagiSound.hit();
      const emojiEl = document.getElementById(`mole-emoji-${idx}`);
      if (emojiEl) emojiEl.innerText = '💥';

      if (score === 30 || score === 60 || score === 90) {
        if (window.UsagiPetManager) {
          UsagiPetManager.reactTo('game', '敲得好！坏情绪通通碎成渣渣！芷萱太棒啦！🔨💥');
        }
      }
    }

    updateUI();
  }

  function updateUI() {
    const scoreEl = document.getElementById('whack-score');
    const timerEl = document.getElementById('whack-timer');
    if (scoreEl) scoreEl.innerText = score;
    if (timerEl) timerEl.innerText = `${timeLeft}s`;
  }

  function endGame() {
    isRunning = false;
    clearInterval(timerInterval);
    if (moleTimer) clearTimeout(moleTimer);

    if (activeHole !== -1) {
      const targetEl = document.getElementById(`mole-target-${activeHole}`);
      if (targetEl) targetEl.classList.remove('up');
    }

    const startBtn = document.getElementById('btn-whack-start');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> 再来一局';
    }

    if (window.UsagiSound) UsagiSound.fanfare();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
    }

    alert(`🔨 时间到！芷萱总共击碎了 ${score} 点不开心与负能量！\n所有烦恼统统被敲飞啦，芷萱今天最棒最开心！✨💖`);
  }

  return { init, start, whack };
})();
window.WhackGame = WhackGame;


/* ============================================================
   6.1. GAME 6: 🍉 乌萨奇合成大西瓜 (Suika Game Physics Engine)
   ============================================================ */
const SuikaGame = (function () {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('usagi_suika_high') || '0', 10);
  let isGameOver = false;

  const FRUITS = [
    { name: '樱桃', emoji: '🍒', r: 18, pts: 2, color: '#f43f5e' },
    { name: '草莓', emoji: '🍓', r: 24, pts: 4, color: '#fb7185' },
    { name: '葡萄', emoji: '🍇', r: 30, pts: 8, color: '#c084fc' },
    { name: '橘子', emoji: '🍊', r: 36, pts: 16, color: '#fb923c' },
    { name: '苹果', emoji: '🍎', r: 44, pts: 32, color: '#ef4444' },
    { name: '水蜜桃', emoji: '🍑', r: 52, pts: 64, color: '#fda4af' },
    { name: '菠萝', emoji: '🍍', r: 60, pts: 128, color: '#eab308' },
    { name: '大西瓜', emoji: '🍉', r: 72, pts: 256, color: '#22c55e' },
    { name: '乌萨奇大爱心', emoji: '💖', r: 84, pts: 512, color: '#ec4899', isMax: true }
  ];

  let droppedFruits = [];
  let currentTier = 0;
  let nextTier = 1;
  let aimX = 170;
  let canDrop = true;
  let dangerTimer = 0;
  const DANGER_Y = 68;

  function init() {
    canvas = document.getElementById('suika-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    updateScores();
    setupEvents();
    if (!droppedFruits.length && !animId) {
      reset();
    }
  }

  function reset() {
    score = 0;
    isGameOver = false;
    droppedFruits = [];
    currentTier = Math.floor(Math.random() * 3);
    nextTier = Math.floor(Math.random() * 3);
    canDrop = true;
    dangerTimer = 0;
    updateScores();
    updateNextFruitPreview();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function setupEvents() {
    if (!canvas || canvas._hasEvents) return;
    canvas._hasEvents = true;

    const getX = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const scaleX = canvas.width / rect.width;
      const x = (clientX - rect.left) * scaleX;
      return Math.max(28, Math.min(canvas.width - 28, x));
    };

    const onMove = (e) => {
      if (isGameOver) return;
      aimX = getX(e);
    };

    const onRelease = (e) => {
      if (isGameOver || !canDrop) return;
      dropFruit();
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', (e) => { onMove(e); }, { passive: true });
    canvas.addEventListener('click', onRelease);
    canvas.addEventListener('touchend', (e) => { onRelease(e); }, { passive: true });
  }

  function dropFruit() {
    canDrop = false;
    const fConfig = FRUITS[currentTier];
    droppedFruits.push({
      x: aimX,
      y: 40,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 2.2,
      r: fConfig.r,
      tier: currentTier,
      id: Date.now() + Math.random()
    });

    if (window.UsagiSound) UsagiSound.pop();

    currentTier = nextTier;
    nextTier = Math.floor(Math.random() * 3);
    updateNextFruitPreview();

    setTimeout(() => {
      canDrop = true;
    }, 450);
  }

  function updateScores() {
    const sEl = document.getElementById('suika-score');
    const hEl = document.getElementById('suika-high-score');
    if (sEl) sEl.innerText = score;
    if (hEl) hEl.innerText = highScore;
  }

  function updateNextFruitPreview() {
    const nextEl = document.getElementById('suika-next-fruit');
    if (nextEl) nextEl.innerText = FRUITS[nextTier].emoji;
  }

  function loop() {
    updatePhysics();
    draw();
    if (!isGameOver) {
      animId = requestAnimationFrame(loop);
    }
  }

  function updatePhysics() {
    const gravity = 0.28;
    const bounce = 0.22;
    const friction = 0.985;
    const floorY = canvas.height - 10;

    for (let i = 0; i < droppedFruits.length; i++) {
      const f = droppedFruits[i];
      f.vy += gravity;
      f.vx *= friction;
      f.vy *= friction;

      f.x += f.vx;
      f.y += f.vy;

      // Walls
      if (f.x - f.r < 10) {
        f.x = 10 + f.r;
        f.vx = -f.vx * bounce;
      } else if (f.x + f.r > canvas.width - 10) {
        f.x = canvas.width - 10 - f.r;
        f.vx = -f.vx * bounce;
      }

      // Floor
      if (f.y + f.r > floorY) {
        f.y = floorY - f.r;
        f.vy = -f.vy * bounce;
        f.vx *= 0.92;
      }
    }

    // Collisions between fruits & Merging
    let toRemove = new Set();
    let toAdd = [];

    for (let i = 0; i < droppedFruits.length; i++) {
      for (let j = i + 1; j < droppedFruits.length; j++) {
        const f1 = droppedFruits[i];
        const f2 = droppedFruits[j];
        if (toRemove.has(f1) || toRemove.has(f2)) continue;

        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = f1.r + f2.r;

        if (dist < minDist && dist > 0.001) {
          // Check Merge
          if (f1.tier === f2.tier && f1.tier < FRUITS.length - 1) {
            toRemove.add(f1);
            toRemove.add(f2);
            const newTier = f1.tier + 1;
            const newConfig = FRUITS[newTier];
            toAdd.push({
              x: (f1.x + f2.x) / 2,
              y: (f1.y + f2.y) / 2,
              vx: (f1.vx + f2.vx) * 0.4,
              vy: Math.min(f1.vy, f2.vy) * 0.5 - 1.2,
              r: newConfig.r,
              tier: newTier,
              id: Date.now() + Math.random(),
              popScale: 1.35
            });

            score += newConfig.pts;
            if (score > highScore) {
              highScore = score;
              localStorage.setItem('usagi_suika_high', highScore);
            }
            updateScores();

            if (window.UsagiSound) UsagiSound.sparkle();
            if (newConfig.name === '大西瓜' || newConfig.isMax) {
              if (typeof confettiRain === 'function') confettiRain(40);
              if (window.UsagiPetManager) {
                UsagiPetManager.reactTo('game', `太厉害啦！芷萱合成了【${newConfig.name}】！大吉大利！🍉✨`);
              }
            }
          } else {
            // Elastic push
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            f1.x -= nx * overlap;
            f1.y -= ny * overlap;
            f2.x += nx * overlap;
            f2.y += ny * overlap;

            const kx = f1.vx - f2.vx;
            const ky = f1.vy - f2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;
            f1.vx -= p * 0.5 * nx * 0.8;
            f1.vy -= p * 0.5 * ny * 0.8;
            f2.vx += p * 0.5 * nx * 0.8;
            f2.vy += p * 0.5 * ny * 0.8;
          }
        }
      }
    }

    if (toRemove.size > 0) {
      droppedFruits = droppedFruits.filter(f => !toRemove.has(f));
      droppedFruits.push(...toAdd);
    }

    // Danger line check
    let overDanger = false;
    for (const f of droppedFruits) {
      if (f.y - f.r < DANGER_Y && Math.abs(f.vy) < 0.3) {
        overDanger = true;
        break;
      }
    }
    if (overDanger) {
      dangerTimer++;
      if (dangerTimer > 180) {
        isGameOver = true;
        if (window.UsagiSound) UsagiSound.yaha();
        alert(`🍉 游戏结束啦！芷萱本次获得了 ${score} 分！快点击重新开始再战西瓜吧~ 🐰✨`);
      }
    } else {
      dangerTimer = Math.max(0, dangerTimer - 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Danger line
    ctx.save();
    ctx.strokeStyle = dangerTimer > 60 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(10, DANGER_Y);
    ctx.lineTo(canvas.width - 10, DANGER_Y);
    ctx.stroke();
    ctx.restore();

    // Aim guide & ready fruit
    if (canDrop && !isGameOver) {
      const curConfig = FRUITS[currentTier];
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(aimX, 40);
      ctx.lineTo(aimX, canvas.height - 10);
      ctx.stroke();
      ctx.restore();

      drawFruitCircle(ctx, aimX, 36, curConfig.r * 0.85, curConfig.color, curConfig.emoji);
    }

    // Dropped fruits
    for (const f of droppedFruits) {
      const config = FRUITS[f.tier];
      let r = f.r;
      if (f.popScale && f.popScale > 1) {
        r *= f.popScale;
        f.popScale -= 0.05;
      }
      drawFruitCircle(ctx, f.x, f.y, r, config.color, config.emoji);
    }
  }

  function drawFruitCircle(c, x, y, r, color, emoji) {
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.shadowColor = 'rgba(0, 0, 0, 0.15)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 3;
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = '#ffffff';
    c.stroke();

    c.font = `${Math.floor(r * 1.15)}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(emoji, x, y + 2);
    c.restore();
  }

  return { init, reset };
})();
window.SuikaGame = SuikaGame;


/* ============================================================
   6.2. GAME 7: 🎡 乌萨奇心愿幸运大转盘 (Love Lucky Wheel)
   ============================================================ */
const WheelGame = (function () {
  let canvas = null;
  let ctx = null;
  let isSpinning = false;
  let currentAngle = 0;
  let spinVelocity = 0;
  let animId = null;

  const SLICES = [
    { title: '全糖奶茶外卖 🧋', desc: '男友立即给芷萱点一杯心仪的全糖去冰奶茶外卖！', color: '#fbcfe8', textColor: '#9d174d' },
    { title: '专属吹头捏肩 💆', desc: '享受男朋友专属半小时贴心吹头、揉肩与头部解压SPA！', color: '#fed7aa', textColor: '#9a3412' },
    { title: '无条件听话 🥺', desc: '获得一次男友绝对顺从特权，芷萱说什么就是什么！', color: '#fef08a', textColor: '#854d0e' },
    { title: '今晚包场看戏 🎬', desc: '今晚由芷萱全权挑选想看的电影或电视剧，男友全程备好零食！', color: '#bbf7d0', textColor: '#166534' },
    { title: '剥虾投喂大餐 🦐', desc: '一顿想吃的浪漫大餐，男友全程负责剥虾投喂+餐后洗碗！', color: '#bae6fd', textColor: '#075985' },
    { title: '专属深情情书 💖', desc: '听男朋友现场真诚念一封专属定制情书与暖心睡前故事！', color: '#e9d5ff', textColor: '#6b21a8' },
    { title: '神秘心愿礼物 🎁', desc: '获得一份男友精心准备的惊喜小礼物或心愿单清空！', color: '#fecdd3', textColor: '#9f1239' },
    { title: '超大隔空拥抱 ✈️', desc: '男友立即发来隔空超紧深情大拥抱，并加速相聚倒数！', color: '#fde68a', textColor: '#78350f' }
  ];

  function init() {
    canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    drawWheel();
    renderWallet();
  }

  function drawWheel() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 8;
    const numSlices = SLICES.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < numSlices; i++) {
      const start = currentAngle + i * sliceAngle;
      const end = start + sliceAngle;
      const slice = SLICES[i];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.textColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(slice.title, r - 16, 4);
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.restore();
  }

  function spin() {
    if (isSpinning) return;
    isSpinning = true;

    const btn = document.getElementById('btn-spin-wheel');
    if (btn) btn.disabled = true;

    spinVelocity = Math.random() * 0.15 + 0.35;
    if (window.UsagiSound) UsagiSound.pop();

    const spinStep = () => {
      currentAngle += spinVelocity;
      spinVelocity *= 0.982;

      drawWheel();

      if (spinVelocity > 0.002) {
        animId = requestAnimationFrame(spinStep);
      } else {
        isSpinning = false;
        if (btn) btn.disabled = false;
        finishSpin();
      }
    };

    animId = requestAnimationFrame(spinStep);
  }

  function finishSpin() {
    const numSlices = SLICES.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    const normalized = (currentAngle % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2);
    const pointerAngle = (Math.PI * 1.5 - normalized + Math.PI * 4) % (Math.PI * 2);
    const winIdx = Math.floor(pointerAngle / sliceAngle) % numSlices;
    const winPrize = SLICES[winIdx];

    if (window.UsagiSound) UsagiSound.fanfare();
    if (typeof confettiRain === 'function') confettiRain(45);

    saveVoucher(winPrize);

    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('game', `哇塞！恭喜芷萱抽中【${winPrize.title}】！快存入背包找男朋友兑现吧！💖🎁`);
    }

    setTimeout(() => {
      alert(`🎉 恭喜芷萱抽取到恋爱特权！\n\n【${winPrize.title}】\n${winPrize.desc}\n\n该特权已自动存入你的「心愿特权背包」，随时向男朋友出示兑现！✨🥰`);
    }, 200);
  }

  function saveVoucher(prize) {
    try {
      const list = JSON.parse(localStorage.getItem('usagi_wheel_vouchers') || '[]');
      list.unshift({
        id: 'v_' + Date.now(),
        title: prize.title,
        desc: prize.desc,
        time: new Date().toLocaleDateString()
      });
      localStorage.setItem('usagi_wheel_vouchers', JSON.stringify(list));
      renderWallet();
    } catch (e) {}
  }

  function renderWallet() {
    const list = JSON.parse(localStorage.getItem('usagi_wheel_vouchers') || '[]');
    const countEl = document.getElementById('wheel-voucher-count');
    if (countEl) countEl.innerText = list.length;

    const container = document.getElementById('wheel-wallet-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<p class="text-stone-400 text-center py-3">还没有抽到特权券哦，快点击转动转盘碰碰运气吧！🎁</p>';
      return;
    }

    container.innerHTML = list.map((item) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-pink-200 shadow-2xs">
        <div>
          <p class="font-black text-rose-700 text-xs">${item.title}</p>
          <p class="text-[10px] text-stone-500">${item.desc}</p>
          <span class="text-[9px] text-stone-400">抽中时间: ${item.time}</span>
        </div>
        <button onclick="WheelGame.copyVoucher('${item.title} - ${item.desc}')" class="px-2 py-1 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 text-[10px] font-bold whitespace-nowrap">
          复制兑现 💌
        </button>
      </div>
    `).join('');
  }

  function toggleWallet() {
    const box = document.getElementById('wheel-wallet-box');
    if (box) box.classList.toggle('hidden');
  }

  function copyVoucher(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`【乌萨奇恋爱特权兑现申请】\n亲爱的男朋友！我在手账里抽中了：${text}，请尽快为芷萱兑现哦！💖`);
      alert("✨ 兑现文本已复制到剪贴板！快去微信/WhatsApp发给男朋友吧~ 💌");
    }
  }

  return { init, spin, toggleWallet, copyVoucher };
})();
window.WheelGame = WheelGame;


/* ============================================================
   6.3. GAME 8: 🐰 乌萨奇贪吃萝卜大冒险 (Kawaii Snake Engine)
   ============================================================ */
const SnakeGame = (function () {
  let canvas = null;
  let ctx = null;
  let gameInterval = null;
  let isRunning = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('usagi_snake_high') || '0', 10);

  const GRID_SIZE = 17;
  let tileSize = 20;
  let snake = [];
  let dir = 'RIGHT';
  let nextDir = 'RIGHT';
  let food = { x: 8, y: 8, type: 'carrot', emoji: '🥕', pts: 10 };

  const FOOD_TYPES = [
    { type: 'carrot', emoji: '🥕', pts: 10 },
    { type: 'strawberry', emoji: '🍓', pts: 20 },
    { type: 'heart', emoji: '💖', pts: 30 }
  ];

  function init() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    tileSize = canvas.width / GRID_SIZE;
    updateScores();
    setupControls();
    if (!snake.length) reset();
  }

  function reset() {
    snake = [
      { x: 5, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 8 }
    ];
    dir = 'RIGHT';
    nextDir = 'RIGHT';
    score = 0;
    spawnFood();
    updateScores();
    draw();
  }

  function setupControls() {
    if (window._snakeEvents) return;
    window._snakeEvents = true;

    window.addEventListener('keydown', (e) => {
      const activeTab = document.getElementById('tab-games');
      const snakeView = document.getElementById('game-view-snake');
      if (!activeTab || activeTab.classList.contains('hidden') || !snakeView || snakeView.classList.contains('hidden')) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setDir('UP');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDir('DOWN');
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDir('LEFT');
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDir('RIGHT');
      else if (e.key === ' ') togglePlay();
    });
  }

  function setDir(d) {
    if (d === 'UP' && dir !== 'DOWN') nextDir = 'UP';
    if (d === 'DOWN' && dir !== 'UP') nextDir = 'DOWN';
    if (d === 'LEFT' && dir !== 'RIGHT') nextDir = 'LEFT';
    if (d === 'RIGHT' && dir !== 'LEFT') nextDir = 'RIGHT';
    if (!isRunning) togglePlay();
  }

  function togglePlay() {
    const btn = document.getElementById('btn-snake-start');
    if (isRunning) {
      clearInterval(gameInterval);
      isRunning = false;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> 继续冒险';
    } else {
      isRunning = true;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-pause mr-1"></i> 暂停游戏';
      gameInterval = setInterval(step, 140);
    }
  }

  function spawnFood() {
    let valid = false;
    let newX, newY;
    while (!valid) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      valid = !snake.some(segment => segment.x === newX && segment.y === newY);
    }
    const ft = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    food = { x: newX, y: newY, ...ft };
  }

  function step() {
    dir = nextDir;
    const head = { ...snake[0] };

    if (dir === 'UP') head.y--;
    if (dir === 'DOWN') head.y++;
    if (dir === 'LEFT') head.x--;
    if (dir === 'RIGHT') head.x++;

    // Wrap around boundaries
    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;

    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += food.pts;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('usagi_snake_high', highScore);
      }
      updateScores();
      if (window.UsagiSound) UsagiSound.pop();
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    clearInterval(gameInterval);
    isRunning = false;
    const btn = document.getElementById('btn-snake-start');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate-right mr-1"></i> 重新开始';
    if (window.UsagiSound) UsagiSound.yaha();
    alert(`🐰 哎呀！乌萨奇撞到自己的小尾巴啦！\n本次冒险得分：${score} 分！芷萱超棒，再接再厉~ ✨🥕`);
    reset();
  }

  function updateScores() {
    const sEl = document.getElementById('snake-score');
    const hEl = document.getElementById('snake-high-score');
    if (sEl) sEl.innerText = score;
    if (hEl) hEl.innerText = highScore;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#FCF9F2' : '#F7F3E8';
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }
    ctx.restore();

    // Food
    ctx.save();
    ctx.font = `${Math.floor(tileSize * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.emoji, food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2 + 1);
    ctx.restore();

    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const cx = seg.x * tileSize + tileSize / 2;
      const cy = seg.y * tileSize + tileSize / 2;

      if (i === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2 - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        ctx.font = `${Math.floor(tileSize * 0.85)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐰', cx, cy + 1);
        ctx.restore();
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2 - 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#fbcfe8' : '#fed7aa';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  return { init, togglePlay, setDir };
})();
window.SnakeGame = SnakeGame;


/* ============================================================
   6.4. GAME 9: ✊ 乌萨奇心有灵犀猜拳擂台 (RPS Game)
   ============================================================ */
const RPSGame = (function () {
  let streak = 0;
  let highStreak = parseInt(localStorage.getItem('usagi_rps_high') || '0', 10);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let isPlaying = false;

  const CHOICES = {
    rock: { name: '石头', emoji: '✊', beats: 'scissors' },
    scissors: { name: '剪刀', emoji: '✌️', beats: 'paper' },
    paper: { name: '布', emoji: '✋', beats: 'rock' }
  };

  function init() {
    updateUI();
  }

  function play(playerChoice) {
    if (isPlaying) return;
    isPlaying = true;

    const pHand = document.getElementById('rps-player-hand');
    const bHand = document.getElementById('rps-bot-hand');
    const resText = document.getElementById('rps-result-text');
    const pName = document.getElementById('rps-player-choice-name');
    const bName = document.getElementById('rps-bot-choice-name');

    if (pHand) pHand.innerText = CHOICES[playerChoice].emoji;
    if (pName) pName.innerText = `出拳: ${CHOICES[playerChoice].name}`;
    if (bHand) bHand.innerText = '✊';
    if (bName) bName.innerText = '出拳中...';
    if (resText) resText.innerText = '石头剪刀... 乌萨奇蓄力！';

    let shakes = 0;
    const shakeInterval = setInterval(() => {
      shakes++;
      if (bHand) bHand.style.transform = shakes % 2 === 0 ? 'translateY(-8px) scale(1.1)' : 'translateY(0) scale(1)';
      if (window.UsagiSound) UsagiSound.pop();

      if (shakes >= 4) {
        clearInterval(shakeInterval);
        resolveMatch(playerChoice);
      }
    }, 180);
  }

  function resolveMatch(playerChoice) {
    const keys = Object.keys(CHOICES);
    const botChoice = keys[Math.floor(Math.random() * keys.length)];

    const bHand = document.getElementById('rps-bot-hand');
    const bName = document.getElementById('rps-bot-choice-name');
    const resText = document.getElementById('rps-result-text');

    if (bHand) {
      bHand.innerText = CHOICES[botChoice].emoji;
      bHand.style.transform = 'scale(1.2)';
      setTimeout(() => { if (bHand) bHand.style.transform = 'scale(1)'; }, 200);
    }
    if (bName) bName.innerText = `出拳: ${CHOICES[botChoice].name}`;

    if (playerChoice === botChoice) {
      draws++;
      if (resText) resText.innerHTML = '<span class="text-amber-600">打平啦！心有灵犀贴贴~ 🤝</span>';
      if (window.UsagiSound) UsagiSound.pop();
    } else if (CHOICES[playerChoice].beats === botChoice) {
      wins++;
      streak++;
      if (streak > highStreak) {
        highStreak = streak;
        localStorage.setItem('usagi_rps_high', highStreak);
      }
      if (resText) resText.innerHTML = `<span class="text-rose-600 font-black">芷萱大获全胜！${streak} 连胜！🎉</span>`;
      if (window.UsagiSound) UsagiSound.fanfare();

      if (streak === 3) {
        if (typeof confettiRain === 'function') confettiRain(30);
        if (window.UsagiPetManager) {
          UsagiPetManager.reactTo('game', '3连胜！芷萱解锁【今日锦鲤拳王】称号！太棒啦！👑🌸');
        }
      } else if (streak === 5) {
        if (typeof confettiRain === 'function') confettiRain(50);
        if (window.UsagiPetManager) {
          UsagiPetManager.reactTo('game', '5连胜！乌萨奇甘拜下风！快向男朋友索要大奖励！🏆💖');
        }
      }
    } else {
      losses++;
      streak = 0;
      if (resText) resText.innerHTML = '<span class="text-stone-500">乌萨奇险胜一局！芷萱再接再厉~ 🐰</span>';
      if (window.UsagiSound) UsagiSound.yaha();
    }

    updateUI();
    isPlaying = false;
  }

  function updateUI() {
    const sEl = document.getElementById('rps-streak');
    const hEl = document.getElementById('rps-high-streak');
    const sumEl = document.getElementById('rps-record-summary');
    if (sEl) sEl.innerText = streak;
    if (hEl) hEl.innerText = highStreak;
    if (sumEl) sumEl.innerText = `战绩: ${wins}胜 ${draws}平 ${losses}负`;
  }

  return { init, play };
})();
window.RPSGame = RPSGame;


/* ============================================================
   6.5. GAME 10: 🚀 乌萨奇蹦蹦跳跃 · 跃向星空 (Sky Hop)
   ============================================================ */
const SkyHopGame = (function () {
  let canvas = null, ctx = null;
  let animId = null;
  let isPlaying = false;
  let score = 0, highScore = parseInt(localStorage.getItem('usagi_hop_high') || '0', 10);
  let player = { x: 172, y: 380, vx: 0, vy: -10, w: 36, h: 36, facing: 1 };
  let platforms = [];
  let cameraY = 0;
  let keys = { left: false, right: false };

  function init() {
    canvas = document.getElementById('hop-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const highEl = document.getElementById('hop-high');
    if (highEl) highEl.innerText = highScore + 'm';

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const btnL = document.getElementById('hop-btn-left');
    const btnR = document.getElementById('hop-btn-right');
    if (btnL) {
      btnL.onmousedown = btnL.ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
      btnL.onmouseup = btnL.ontouchend = (e) => { e.preventDefault(); keys.left = false; };
    }
    if (btnR) {
      btnR.onmousedown = btnR.ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
      btnR.onmouseup = btnR.ontouchend = (e) => { e.preventDefault(); keys.right = false; };
    }

    canvas.onmousemove = (e) => {
      if (!isPlaying) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      if (mouseX < player.x) { player.vx = -4.5; player.facing = -1; }
      else if (mouseX > player.x + player.w) { player.vx = 4.5; player.facing = 1; }
    };

    reset();
  }

  function reset() {
    isPlaying = true;
    score = 0;
    cameraY = 0;
    player = { x: canvas ? canvas.width / 2 - 18 : 172, y: 380, vx: 0, vy: -10, w: 36, h: 36, facing: 1 };
    platforms = [
      { x: 140, y: 440, w: 100, h: 14, type: 'normal' },
      { x: 60, y: 360, w: 80, h: 14, type: 'normal' },
      { x: 230, y: 280, w: 80, h: 14, type: 'spring' },
      { x: 120, y: 200, w: 75, h: 14, type: 'moving', vx: 1.5 },
      { x: 250, y: 120, w: 80, h: 14, type: 'normal' },
      { x: 80, y: 40, w: 75, h: 14, type: 'normal' }
    ];
    for (let i = platforms.length; i < 9; i++) {
      spawnPlatform(-i * 70);
    }
    updateScoreUI();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function spawnPlatform(y) {
    const types = ['normal', 'normal', 'moving', 'spring', 'fragile'];
    const type = types[Math.floor(Math.random() * types.length)];
    const w = type === 'spring' ? 65 : 75;
    const x = 20 + Math.random() * (canvas.width - w - 40);
    platforms.push({
      x, y, w, h: 14, type,
      vx: type === 'moving' ? (Math.random() > 0.5 ? 1.4 : -1.4) : 0,
      hasStar: Math.random() < 0.28
    });
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }

  function loop() {
    if (!isPlaying) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    if (keys.left) { player.vx = -4.5; player.facing = -1; }
    else if (keys.right) { player.vx = 4.5; player.facing = 1; }
    else { player.vx *= 0.82; }

    player.x += player.vx;
    player.y += player.vy;
    player.vy += 0.32;

    if (player.x < -player.w) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.w;

    if (player.vy > 0) {
      for (const p of platforms) {
        if (
          player.x + player.w > p.x &&
          player.x < p.x + p.w &&
          player.y + player.h >= p.y &&
          player.y + player.h <= p.y + p.h + player.vy + 2
        ) {
          if (p.type === 'spring') {
            player.vy = -15;
            if (window.UsagiSound) UsagiSound.yaha();
            if (window.UsagiPetManager) UsagiPetManager.reactTo('yaha', '呀哈！大弹簧弹起！冲上云霄！🚀✨');
          } else if (p.type === 'fragile') {
            player.vy = -9;
            p.broken = true;
            if (window.UsagiSound) UsagiSound.hit();
          } else {
            player.vy = -10;
            if (window.UsagiSound) UsagiSound.boing();
          }
          break;
        }
      }
    }

    for (const p of platforms) {
      if (p.hasStar && !p.starCollected) {
        if (
          player.x + player.w > p.x + p.w / 2 - 12 &&
          player.x < p.x + p.w / 2 + 12 &&
          player.y + player.h > p.y - 25 &&
          player.y < p.y
        ) {
          p.starCollected = true;
          score += 50;
          if (window.UsagiSound) UsagiSound.coin();
        }
      }
    }

    for (const p of platforms) {
      if (p.type === 'moving') {
        p.x += p.vx;
        if (p.x <= 10 || p.x + p.w >= canvas.width - 10) p.vx = -p.vx;
      }
    }

    if (player.y < canvas.height * 0.45) {
      const diff = canvas.height * 0.45 - player.y;
      player.y = canvas.height * 0.45;
      cameraY += diff;
      score += Math.floor(diff);
      updateScoreUI();

      for (const p of platforms) {
        p.y += diff;
      }

      platforms = platforms.filter(p => p.y < canvas.height + 40 && !p.broken);
      while (platforms.length < 8) {
        const topY = Math.min(...platforms.map(p => p.y));
        spawnPlatform(topY - (55 + Math.random() * 35));
      }
    }

    if (player.y > canvas.height + 50) {
      gameOver();
    }
  }

  function gameOver() {
    isPlaying = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('usagi_hop_high', highScore);
      const highEl = document.getElementById('hop-high');
      if (highEl) highEl.innerText = highScore + 'm';
    }
    if (window.UsagiSound) UsagiSound.hit();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('comfort', `呀呀掉下来啦！不过芷萱跳到了 ${score}m 的高空呢，超级厉害！抱抱亲一口~ 🐰💖`);
    }
  }

  function updateScoreUI() {
    const sEl = document.getElementById('hop-score');
    if (sEl) sEl.innerText = score + 'm';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#bae6fd');
    grad.addColorStop(0.5, '#fce7f3');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const p of platforms) {
      if (p.type === 'spring') {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 7);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px sans-serif';
        ctx.fillText('🌀', p.x + p.w / 2 - 7, p.y - 3);
      } else if (p.type === 'moving') {
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 7);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText('🌈', p.x + p.w / 2 - 6, p.y + 11);
      } else if (p.type === 'fragile') {
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 7);
        ctx.fill();
      } else {
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 7);
        ctx.fill();
      }

      if (p.hasStar && !p.starCollected) {
        ctx.font = '16px sans-serif';
        ctx.fillText('⭐', p.x + p.w / 2 - 8, p.y - 6);
      }
    }

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    if (player.facing < 0) ctx.scale(-1, 1);
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐰', 0, 0);
    ctx.restore();

    if (!isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 挑战结束啦！', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`本次高度: ${score}m`, canvas.width / 2, canvas.height / 2 + 5);
      ctx.font = '13px sans-serif';
      ctx.fillText('点击上方【🔄 重新开始】再来一局！', canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  return { init, reset };
})();
window.SkyHopGame = SkyHopGame;


/* ============================================================
   6.6. GAME 11: 🥕 乌萨奇农场拔胡萝卜大作战 (Carrot Harvest)
   ============================================================ */
const HarvestGame = (function () {
  let score = 0;
  let timeLeft = 30;
  let timerInterval = null;
  let spawnInterval = null;
  let isPlaying = false;
  let holes = new Array(9).fill(null);
  let combo = 0;
  let highScore = parseInt(localStorage.getItem('usagi_harvest_high') || '0', 10);

  const ITEMS = [
    { type: 'carrot', icon: '🥕', pts: 10, prob: 0.45, name: '脆胡萝卜' },
    { type: 'berry', icon: '🍓', pts: 20, prob: 0.25, name: '大草莓' },
    { type: 'gold', icon: '🌟', pts: 50, prob: 0.12, name: '黄金萝卜' },
    { type: 'usagi', icon: '🐰', pts: 30, prob: 0.10, name: '乌萨奇' },
    { type: 'bomb', icon: '💣', pts: -20, prob: 0.08, name: '捣蛋炸弹' }
  ];

  function init() {
    const highEl = document.getElementById('harvest-high');
    if (highEl) highEl.innerText = highScore;
    renderHoles();
  }

  function start() {
    if (isPlaying) stop();
    isPlaying = true;
    score = 0;
    combo = 0;
    timeLeft = 30;
    updateUI();

    const btn = document.getElementById('btn-harvest-start');
    if (btn) btn.innerText = '⏸️ 进行中...';

    if (window.UsagiSound) UsagiSound.fanfare();
    if (window.UsagiPetManager) UsagiPetManager.speak('🥕 农场开拔！', '农场丰收啦！30秒内快快把胡萝卜拔光光~ 冲呀芷萱！🌾🐰', true);

    timerInterval = setInterval(() => {
      timeLeft--;
      const timeEl = document.getElementById('harvest-time');
      if (timeEl) timeEl.innerText = timeLeft;
      if (timeLeft <= 0) {
        finish();
      }
    }, 1000);

    spawnInterval = setInterval(popItem, 650);
  }

  function stop() {
    isPlaying = false;
    if (timerInterval) clearInterval(timerInterval);
    if (spawnInterval) clearInterval(spawnInterval);
    holes.fill(null);
    renderHoles();
    const btn = document.getElementById('btn-harvest-start');
    if (btn) btn.innerText = '▶️ 开始挑战';
  }

  function popItem() {
    if (!isPlaying) return;
    const emptyIndices = [];
    holes.forEach((h, idx) => { if (!h) emptyIndices.push(idx); });
    if (emptyIndices.length === 0) return;

    const holeIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const rand = Math.random();
    let cumulative = 0;
    let chosen = ITEMS[0];
    for (const it of ITEMS) {
      cumulative += it.prob;
      if (rand <= cumulative) { chosen = it; break; }
    }

    holes[holeIdx] = chosen;
    renderHole(holeIdx);

    setTimeout(() => {
      if (holes[holeIdx] === chosen) {
        holes[holeIdx] = null;
        renderHole(holeIdx);
      }
    }, 1200 + Math.random() * 500);
  }

  function whack(idx) {
    if (!isPlaying) return;
    const it = holes[idx];
    if (!it) return;

    holes[idx] = null;
    renderHole(idx);

    if (it.type === 'bomb') {
      combo = 0;
      score = Math.max(0, score + it.pts);
      if (window.UsagiSound) UsagiSound.hit();
    } else {
      combo++;
      const multiplier = combo >= 5 ? 2.0 : (combo >= 3 ? 1.5 : 1.0);
      const earned = Math.round(it.pts * multiplier);
      score += earned;

      if (it.type === 'gold' || it.type === 'usagi') {
        if (window.UsagiSound) UsagiSound.coin();
        if (typeof confettiRain === 'function') confettiRain(10);
      } else {
        if (window.UsagiSound) UsagiSound.pop();
      }
    }
    updateUI();
  }

  function finish() {
    stop();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('usagi_harvest_high', highScore);
    }
    updateUI();

    let title = '🥕 农场见习小农夫 🌸';
    if (score >= 400) title = '👑 农场特级拔萝卜神童芷萱！';
    else if (score >= 250) title = '🌟 超级胡萝卜小富婆！';
    else if (score >= 150) title = '🍓 甜心草莓丰收达人！';

    if (typeof confettiRain === 'function') confettiRain(30);
    if (window.UsagiPetManager) {
      UsagiPetManager.speak('🎉 丰收大结算', `30秒时间到！芷萱总共收获了 ${score} 分！荣获【${title}】！快向男朋友领胡萝卜大餐吧~ 🥕💖`, true);
    }
  }

  function updateUI() {
    const sEl = document.getElementById('harvest-score');
    const hEl = document.getElementById('harvest-high');
    const cEl = document.getElementById('harvest-combo-text');
    if (sEl) sEl.innerText = score;
    if (hEl) hEl.innerText = highScore;
    if (cEl) cEl.innerText = `连击: ${combo} 🔥 ${combo >= 3 ? '(加成x' + (combo >= 5 ? 2 : 1.5) + ')' : ''}`;
  }

  function renderHole(idx) {
    const holeEl = document.getElementById(`harvest-hole-${idx}`);
    if (!holeEl) return;
    const itemSpan = holeEl.querySelector('.harvest-item');
    if (!itemSpan) return;
    const it = holes[idx];
    if (it) {
      itemSpan.innerText = it.icon;
      itemSpan.className = 'harvest-item text-4xl sm:text-5xl select-none pointer-events-none animate-bounce';
    } else {
      itemSpan.innerText = '';
      itemSpan.className = 'harvest-item text-4xl sm:text-5xl select-none pointer-events-none';
    }
  }

  function renderHoles() {
    for (let i = 0; i < 9; i++) renderHole(i);
  }

  return { init, start, whack };
})();
window.HarvestGame = HarvestGame;


/* ============================================================
   6.7. GAME 12: 🎹 乌萨奇心动节奏大师 (Kawaii Rhythm)
   ============================================================ */
const RhythmGame = (function () {
  let canvas = null, ctx = null;
  let isPlaying = false;
  let animId = null;
  let score = 0, combo = 0, highScore = parseInt(localStorage.getItem('usagi_rhythm_high') || '0', 10);
  let notes = [];
  let spawnTimer = 0;
  const LANES = [
    { key: 'd', freq: 523.25, icon: '💖', color: '#f43f5e' },
    { key: 'f', freq: 659.25, icon: '🍓', color: '#fb7185' },
    { key: 'j', freq: 783.99, icon: '⭐', color: '#f59e0b' },
    { key: 'k', freq: 1046.50, icon: '🥕', color: '#10b981' }
  ];

  function init() {
    canvas = document.getElementById('rhythm-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const highEl = document.getElementById('rhythm-high');
    if (highEl) highEl.innerText = highScore;

    window.addEventListener('keydown', (e) => {
      if (!isPlaying) return;
      const k = e.key.toLowerCase();
      if (k === 'd') hitLane(0);
      else if (k === 'f') hitLane(1);
      else if (k === 'j') hitLane(2);
      else if (k === 'k') hitLane(3);
    });

    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`rhythm-key-${i}`);
      if (btn) {
        btn.onmousedown = btn.ontouchstart = (e) => {
          e.preventDefault();
          hitLane(i);
        };
      }
    }
  }

  function togglePlay() {
    if (isPlaying) {
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      const btn = document.getElementById('btn-rhythm-play');
      if (btn) btn.innerText = '▶️ 开始弹奏';
    } else {
      isPlaying = true;
      score = 0;
      combo = 0;
      notes = [];
      updateUI();
      const btn = document.getElementById('btn-rhythm-play');
      if (btn) btn.innerText = '⏸️ 暂停演奏';
      if (window.UsagiSound) UsagiSound.fanfare();
      loop();
    }
  }

  function hitLane(laneIdx) {
    if (!isPlaying) return;
    const laneData = LANES[laneIdx];
    if (window.UsagiSound && UsagiSound.pianoTone) {
      UsagiSound.pianoTone(laneData.freq);
    }

    const hitLineY = canvas.height - 70;
    let closest = null;
    let minDist = 999;
    for (const n of notes) {
      if (n.lane === laneIdx && !n.hit) {
        const dist = Math.abs(n.y - hitLineY);
        if (dist < minDist) {
          minDist = dist;
          closest = n;
        }
      }
    }

    if (closest && minDist < 65) {
      closest.hit = true;
      let earned = 50;
      if (minDist < 25) {
        earned = 100;
        showFloatingText('PERFECT!', closest.lane, '#ec4899');
      } else {
        showFloatingText('GREAT!', closest.lane, '#f59e0b');
      }
      combo++;
      score += Math.round(earned * (1 + combo * 0.05));
    } else {
      combo = 0;
      showFloatingText('MISS', laneIdx, '#9ca3af');
    }
    updateUI();
  }

  let floatingTexts = [];
  function showFloatingText(text, lane, color) {
    const laneW = canvas.width / 4;
    floatingTexts.push({
      text,
      x: lane * laneW + laneW / 2,
      y: canvas.height - 80,
      color,
      alpha: 1.0
    });
  }

  function loop() {
    if (!isPlaying) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    spawnTimer++;
    if (spawnTimer % 35 === 0) {
      const lane = Math.floor(Math.random() * 4);
      notes.push({ lane, y: -20, speed: 4.2 + Math.random() * 1.5, hit: false });
    }

    for (const n of notes) {
      n.y += n.speed;
    }

    const hitLineY = canvas.height - 70;
    for (const n of notes) {
      if (!n.hit && n.y > hitLineY + 50) {
        n.hit = true;
        combo = 0;
        updateUI();
      }
    }

    notes = notes.filter(n => n.y < canvas.height + 40 && (!n.hit || n.y < hitLineY + 30));

    for (const ft of floatingTexts) {
      ft.y -= 1.2;
      ft.alpha -= 0.035;
    }
    floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
  }

  function updateUI() {
    const sEl = document.getElementById('rhythm-score');
    const cEl = document.getElementById('rhythm-combo');
    const hEl = document.getElementById('rhythm-high');
    if (sEl) sEl.innerText = score;
    if (cEl) cEl.innerText = combo;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('usagi_rhythm_high', highScore);
    }
    if (hEl) hEl.innerText = highScore;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const laneW = canvas.width / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#18181b' : '#27272a';
      ctx.fillRect(i * laneW, 0, laneW, canvas.height);

      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1;
      ctx.strokeRect(i * laneW, 0, laneW, canvas.height);
    }

    const hitLineY = canvas.height - 70;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(canvas.width, hitLineY);
    ctx.stroke();

    for (const n of notes) {
      if (n.hit) continue;
      const x = n.lane * laneW + laneW / 2;
      ctx.fillStyle = LANES[n.lane].color;
      ctx.beginPath();
      ctx.arc(x, n.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LANES[n.lane].icon, x, n.y);
    }

    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  return { init, togglePlay };
})();
window.RhythmGame = RhythmGame;


/* ============================================================
   7. MINI-GAMES SUBTAB SWITCHER (游乐园子页面切换 - 12大萌趣游戏)
   ============================================================ */
function switchGameSubtab(subtab) {
  const tabs = ['fruit', 'suika', 'wheel', 'snake', 'rps', 'memory', 'fish', 'gacha', 'whack', 'hop', 'harvest', 'rhythm'];

  // Switch views
  tabs.forEach(t => {
    const view = document.getElementById(`game-view-${t}`);
    const btn = document.getElementById(`game-btn-${t}`);

    if (view) {
      if (t === subtab) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }

    if (btn) {
      if (t === subtab) {
        btn.className = 'game-subtab-btn active px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap bg-rose-500 text-white shadow-xs';
      } else {
        btn.className = 'game-subtab-btn px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap bg-pink-50 hover:bg-pink-100 text-stone-700 border border-pink-200';
      }
    }
  });

  // Init corresponding game
  if (subtab === 'fruit') FruitGame.init();
  if (subtab === 'suika') SuikaGame.init();
  if (subtab === 'wheel') WheelGame.init();
  if (subtab === 'snake') SnakeGame.init();
  if (subtab === 'rps') RPSGame.init();
  if (subtab === 'memory') MemoryGame.init();
  if (subtab === 'fish') WoodenFishGame.init();
  if (subtab === 'gacha') GachaGame.init();
  if (subtab === 'whack') WhackGame.init();
  if (subtab === 'hop') SkyHopGame.init();
  if (subtab === 'harvest') HarvestGame.init();
  if (subtab === 'rhythm') RhythmGame.init();

  if (window.UsagiSound) UsagiSound.pop();
}
window.switchGameSubtab = switchGameSubtab;


/* ============================================================
   8. AUTO INITIALIZER ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  UsagiPetManager.init();
  FruitGame.init();
  SuikaGame.init();
  WheelGame.init();
  SnakeGame.init();
  RPSGame.init();
  MemoryGame.init();
  WoodenFishGame.init();
  GachaGame.init();
  WhackGame.init();
  SkyHopGame.init();
  HarvestGame.init();
  RhythmGame.init();

  // URL support for test/direct mascot state triggering
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const petAction = urlParams.get('pet_action');
    if (petAction) {
      setTimeout(() => {
        UsagiPetManager.reactTo(petAction);
      }, 500);
    }
    if (urlParams.get('test_min') === '1') {
      setTimeout(() => {
        UsagiPetManager.minimize();
      }, 400);
    }
  } catch (e) {}
});
