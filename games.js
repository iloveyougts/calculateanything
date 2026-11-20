/* ============================================================
   USAGI WANDERING DESKTOP PET & KAWAII MINI-GAMES ARCADE ENGINE
   Dedicated to 颜芷萱 (GAN TZI SHUAN)
   ============================================================ */

/* ============================================================
   0. USAGI KAWAII VOICE ENGINE (真人自然甜美女声 & 防截断守护引擎)
   ============================================================ */
/* ============================================================
   0. USAGI KAWAII VOICE ENGINE (纯净原声语录 · 自然甜美声优引擎 · 100%免费零试听)
   ============================================================ */
const UsagiVoice = (function () {
  let isVoiceEnabled = localStorage.getItem('usagi_voice_enabled') !== 'false'; // 默认开启
  let isSpeaking = false;
  let voices = [];
  let currentUtterance = null;

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (e) { }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // 严选自然、甜美、无机械感的真人与声优级女声 (优先微软与谷歌神经网络女声，坚决过滤古早人机机械音)
  function getBestVoice() {
    if (!voices || voices.length === 0) loadVoices();

    // 1. 优先匹配现代高质量神经网络声优女声 (Edge/Chrome/Android/iOS 顶级声线)
    const seiyuuKeywords = [
      'Xiaoxiao', 'Xiaoyi', 'Yunxi', 'Xiaochen', 'HsiaoChen',
      'Google 普通话', 'Google 汉语', 'zh-CN-x-ccc',
      'Ting-Ting', 'Sin-ji', 'Mei-Jia', 'Natural', 'Online'
    ];
    for (const kw of seiyuuKeywords) {
      const match = voices.find(v => {
        if (!v.name) return false;
        const matchesLang = !v.lang || v.lang.startsWith('zh') || v.lang.startsWith('cmn');
        return matchesLang && v.name.toLowerCase().includes(kw.toLowerCase());
      });
      if (match) return match;
    }

    // 2. 备选：任意非古早机械音的中文声音 (坚决屏蔽老旧 Huihui/Kangkang/Hanhan 机械声)
    const naturalZh = voices.find(v => {
      if (!v.lang || (!v.lang.startsWith('zh') && !v.lang.startsWith('cmn'))) return false;
      const n = (v.name || '').toLowerCase();
      return !n.includes('huihui') && !n.includes('kangkang') && !n.includes('hanhan');
    });
    if (naturalZh) return naturalZh;

    // 3. 保底中文
    const anyZh = voices.find(v => v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('cmn')));
    return anyZh || null;
  }

  // 核心：精准动态跟随乌萨奇当下的每一句温馨语录播报，绝不播放无关广告试听音频
  function speak(text, options = {}) {
    if (!isVoiceEnabled) return;
    if (!('speechSynthesis' in window)) return;
    if (!text || !text.trim()) return;

    try {
      // 停止上一句播报，保证随时切换动作时立即更新，绝不死锁或卡顿
      window.speechSynthesis.cancel();

      // 智能净化台词文本：剔除Emoji与复杂标点符号，让发音自然灵动、字正腔圆
      const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[【】「」『』·_—★☆✦✧]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      // 少女日漫声优声线参数调谐：音调 1.25（轻快清甜），语速 1.04（活泼自然）
      utterance.pitch = options.pitch || 1.25;
      utterance.rate = options.rate || 1.04;
      utterance.volume = options.volume || 1.0;

      const v = getBestVoice();
      if (v) utterance.voice = v;

      utterance.onstart = () => {
        isSpeaking = true;
        updateUI(true);
      };
      utterance.onend = () => {
        isSpeaking = false;
        currentUtterance = null;
        updateUI(false);
      };
      utterance.onerror = () => {
        isSpeaking = false;
        currentUtterance = null;
        updateUI(false);
      };

      currentUtterance = utterance;
      if (window.UsagiSound && !options.silent) UsagiSound.pop();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      isSpeaking = false;
      updateUI(false);
    }
  }

  function stop() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { }
    }
    isSpeaking = false;
    currentUtterance = null;
    updateUI(false);
  }

  function toggleVoice() {
    isVoiceEnabled = !isVoiceEnabled;
    localStorage.setItem('usagi_voice_enabled', isVoiceEnabled ? 'true' : 'false');
    if (!isVoiceEnabled) {
      stop();
    }
    updateButtonUI();
    if (isVoiceEnabled) {
      speak('乌萨奇在呢！芷萱今天也要超级开心哦！✨', { force: true });
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
      btn.title = isVoiceEnabled ? '点击关闭语录语音' : '点击开启乌萨奇甜美语录伴读';
      btn.classList.toggle('text-pink-600', isVoiceEnabled);
      btn.classList.toggle('text-stone-400', !isVoiceEnabled);
    }
  }

  function testCurrentVoice() {
    speak('芷萱！乌萨奇在呢，今天也要超级开心哦！🌸', { force: true });
  }

  return {
    speak,
    stop,
    toggleVoice,
    testCurrentVoice,
    isSpeakingNow: () => isSpeaking,
    isEnabled: () => isVoiceEnabled,
    updateButtonUI,
    getBestVoice,
    openConsole: () => {},
    closeConsole: () => {},
    renderTrackList: () => {},
    selectTrack: () => {},
    previewTrack: () => {},
    applyCustomUrl: () => {},
    handleFileUpload: () => {},
    REAL_TRACKS: []
  };
})();
window.UsagiVoice = UsagiVoice;

/* ============================================================
   1. USAGI PET MANAGER (底部漫步桌面萌宠 & 贴心生活助手)
   ============================================================ */
const UsagiPetManager = (function () {
  let isRoaming = false;
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

  // 萌态姿势系统 (站立 / 软萌趴趴 / 乖巧小坐 / 滚滚毛球)
  let currentPose = 'standing';
  const POSES = [
    { id: 'standing', name: '元气站立', icon: '🐰', desc: '站得笔直，精神抖擞！' },
    { id: 'prone', name: '萌宠趴趴', icon: '🐾', desc: '趴在地上贴地爬行，像软萌小海豹~' },
    { id: 'sitting', name: '乖巧小坐', icon: '🍵', desc: '乖乖坐好喝下午茶~' },
    { id: 'rolling', name: '滚滚毛球', icon: '🌪️', desc: '圆滚滚像麻薯球一样翻滚巡逻！' }
  ];

  function setPose(poseId, speakNotice = true) {
    if (currentState === 'sleep') {
      clearState();
    }
    const valid = POSES.find(p => p.id === poseId) ? poseId : 'standing';
    currentPose = valid;
    localStorage.setItem('usagi_pet_pose', valid);

    const container = document.getElementById('usagi-mascot-container');
    const mascotImg = document.getElementById('usagi-mascot-img');
    if (container) {
      POSES.forEach(p => container.classList.remove(`usagi-pose-${p.id}`));
      container.classList.add(`usagi-pose-${valid}`);
    }
    if (mascotImg) {
      mascotImg.style.transform = '';
    }

    const poseIconEl = document.getElementById('pet-pose-icon');
    const poseTextEl = document.getElementById('pet-pose-text');
    const curObj = POSES.find(p => p.id === valid);
    if (poseIconEl && curObj) poseIconEl.innerText = curObj.icon;
    if (poseTextEl && curObj) poseTextEl.innerText = curObj.name.replace('萌宠', '').replace('元气', '').replace('乖巧', '').replace('滚滚', '');

    if (speakNotice) {
      if (window.UsagiSound) UsagiSound.pop();
      speak(`🐾 姿势切换：${curObj.name}`, curObj.desc, true);
    }
  }

  function cyclePose() {
    const idx = POSES.findIndex(p => p.id === currentPose);
    const nextIdx = (idx + 1) % POSES.length;
    setPose(POSES[nextIdx].id, true);
  }

  // ------------------------------------------------------------
  // High-Performance Cached Dimensions & Smooth Layout Engine
  // ------------------------------------------------------------
  let cachedWindowWidth = typeof window !== 'undefined' ? (window.innerWidth || 1024) : 1024;
  let cachedIsMobile = cachedWindowWidth < 768;
  let lastMobileState = null;
  let lastBubbleAlign = null;

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      cachedWindowWidth = window.innerWidth || 1024;
      cachedIsMobile = cachedWindowWidth < 768;
      updatePositionStyle();
    }, { passive: true });
  }

  function init() {
    const minX = 16;
    const maxX = Math.max(minX + 30, cachedWindowWidth - (cachedIsMobile ? 180 : 240));
    posX = maxX; // 保证开屏与刷新绝对处于右下角！

    const savedRoam = localStorage.getItem('usagi_pet_roam');
    if (savedRoam !== null) {
      isRoaming = savedRoam === 'true';
    } else {
      isRoaming = false;
    }

    const container = document.getElementById('usagi-mascot-container');
    if (container) {
      if (isRoaming) {
        container.classList.add('roaming');
      } else {
        container.classList.remove('roaming');
      }
      updatePositionStyle();
      updateDockUI();
    }

    // 初始化姿势系统
    const savedPose = localStorage.getItem('usagi_pet_pose') || 'standing';
    setPose(savedPose, false);

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
    } catch (e) { }

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
      if (isRoaming && !isMinimized && !isPaused && !isTossing && currentState !== 'sleep') {
        const container = document.getElementById('usagi-mascot-container');
        if (container) {
          const minX = 20;
          const maxX = Math.max(minX + 40, cachedWindowWidth - 240);

          posX += direction * speed;

          // Hit Right Boundary -> Turn Left (安静转身，绝不在撞墙时频繁插嘴截断正在说的话)
          if (posX >= maxX) {
            posX = maxX;
            direction = -1;
            const mascotImg = document.getElementById('usagi-mascot-img');
            if (mascotImg) mascotImg.style.transform = 'scaleX(-1)';
            pauseWaddle(800);
          }
          // Hit Left Boundary -> Turn Right
          else if (posX <= minX) {
            posX = minX;
            direction = 1;
            const mascotImg = document.getElementById('usagi-mascot-img');
            if (mascotImg) mascotImg.style.transform = 'scaleX(1)';
            pauseWaddle(800);
          }

          updatePositionStyle();
        }
      }

      // Check periodic automatic reminder (every 50s，当前没在说话时提醒)
      const now = Date.now();
      if (now - lastReminderTime > 50000 && !isMinimized && !isTossing && (!window.UsagiVoice || !UsagiVoice.isSpeakingNow())) {
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
    if (!container) return;

    if (lastMobileState !== cachedIsMobile) {
      lastMobileState = cachedIsMobile;
      container.style.bottom = cachedIsMobile ? 'calc(76px + env(safe-area-inset-bottom, 12px))' : '24px';
    }

    if (isMinimized) {
      container.style.left = 'auto';
      container.style.right = cachedIsMobile ? '12px' : '24px';
      return;
    }

    const minX = 16;
    const maxX = Math.max(minX + 30, cachedWindowWidth - (cachedIsMobile ? 180 : 240));

    if (posX > maxX) posX = maxX;
    if (posX < minX) posX = minX;
    container.style.left = posX + 'px';
    container.style.right = 'auto';

    const bubble = document.getElementById('usagi-speech-bubble');
    if (bubble) {
      let desiredAlign = 'center';
      if (posX < 160) desiredAlign = 'left';
      else if (posX > cachedWindowWidth - 260) desiredAlign = 'right';

      if (lastBubbleAlign !== desiredAlign) {
        lastBubbleAlign = desiredAlign;
        if (desiredAlign === 'left') {
          bubble.style.alignSelf = 'flex-start';
          bubble.classList.add('bubble-align-left');
          bubble.classList.remove('bubble-align-right');
        } else if (desiredAlign === 'right') {
          bubble.style.alignSelf = 'flex-end';
          bubble.classList.add('bubble-align-right');
          bubble.classList.remove('bubble-align-left');
        } else {
          bubble.style.alignSelf = 'center';
          bubble.classList.remove('bubble-align-left', 'bubble-align-right');
        }
      }
    }
  }

  function toggleRoam() {
    if (currentState === 'sleep') {
      clearState();
    }
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
    } catch (e) { }

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

  function speak(tag, message, autoVoice = false, options = {}) {
    const tagEl = document.getElementById('usagi-speech-tag');
    const textEl = document.getElementById('usagi-speech-text');
    const bubble = document.getElementById('usagi-speech-bubble');

    // 始终完整显示整句台词，让芷萱随时一眼看完完整温暖文字
    if (tagEl) tagEl.innerText = tag;
    if (textEl) textEl.innerText = message;
    else if (bubble) bubble.innerText = message;

    if (bubble) {
      bubble.classList.remove('bubble-pop');
      void bubble.offsetWidth;
      bubble.classList.add('bubble-pop');
    }

    // 语音灵动播报（不强制死锁，交互流畅无阻碍）
    if (autoVoice && window.UsagiVoice) {
      UsagiVoice.speak(message, options);
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
    if (isTossing && ['dashboard', 'overview'].includes(stateName)) return;
    const config = STATE_CONFIGS[stateName];
    if (!config) return;

    currentState = stateName;

    if (stateTimeout) clearTimeout(stateTimeout);

    // 1. Hide all action layers and show active action layer
    const allLayers = document.querySelectorAll('.usagi-action-layer');
    allLayers.forEach(el => el.classList.add('hidden'));
    const activeLayer = document.getElementById(`action-layer-${stateName}`);
    if (activeLayer) activeLayer.classList.remove('hidden');

    const container = document.getElementById('usagi-mascot-container');
    if (container) {
      container.classList.toggle('usagi-is-sleeping', stateName === 'sleep');
    }

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
    speak(config.tag, quote, true);

    // 仅在明确进入睡觉状态时停下休息；其余切页或互动状态一律保持欢快漫步与跳跃，绝不停滞！
    if (stateName === 'sleep') {
      isPaused = true;
    } else {
      isPaused = false;
    }

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

    const container = document.getElementById('usagi-mascot-container');
    if (container) {
      container.classList.remove('usagi-is-sleeping');
    }
    isPaused = false;

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

  // ============================================================
  // 乌萨奇可爱头顶金星 + 眼睛经典日漫蓝色大蚊香旋涡眼 (🌀 🌀)
  // ============================================================
  function spawnDizzyEffects() {
    const actorBox = document.getElementById('usagi-actor-box');
    if (!actorBox) return;
    clearDizzyEffects();

    // 1. 头顶紧贴兔耳端小金星
    const starsWrapper = document.createElement('div');
    starsWrapper.className = 'usagi-dizzy-stars';
    ['✨', '⭐', '✨'].forEach(emoji => {
      const s = document.createElement('span');
      s.className = 'usagi-dizzy-star';
      s.textContent = emoji;
      starsWrapper.appendChild(s);
    });
    actorBox.appendChild(starsWrapper);

    // 2. 眼睛经典日漫萌系蓝色大蚊香旋涡眼 (🌀 🌀)
    const eyesWrapper = document.createElement('div');
    eyesWrapper.className = 'usagi-spiral-eyes';
    const eye1 = document.createElement('span');
    eye1.className = 'usagi-spiral-eye';
    eye1.textContent = '🌀';
    const eye2 = document.createElement('span');
    eye2.className = 'usagi-spiral-eye';
    eye2.textContent = '🌀';
    eyesWrapper.appendChild(eye1);
    eyesWrapper.appendChild(eye2);
    actorBox.appendChild(eyesWrapper);

    if (window.UsagiSound && UsagiSound.dizzyStarsWarble) {
      UsagiSound.dizzyStarsWarble();
    }
  }

  function clearDizzyEffects() {
    const actorBox = document.getElementById('usagi-actor-box');
    if (!actorBox) return;
    const stars = actorBox.querySelector('.usagi-dizzy-stars');
    if (stars) stars.remove();
    const eyes = actorBox.querySelector('.usagi-spiral-eyes');
    if (eyes) eyes.remove();
    const sweat = actorBox.querySelector('.usagi-dizzy-sweat');
    if (sweat) sweat.remove();
  }

  let isTossing = false;
  let tossAnimId = null;
  let wasRoamingBeforeDrag = false;

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

      wasRoamingBeforeDrag = isRoaming;

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
        speak('🐰 抓起来啦！', '咦？抓我起来啦！芷萱要把我丢到哪里去呀~ 呀哈！✈️', false);
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
        const now = performance.now();
        const recent = trackHistory.filter(p => now - p.t <= 120);
        if (recent.length >= 2) {
          const last = recent[recent.length - 1];
          const first = recent[0];
          const dt = Math.max(16, last.t - first.t);
          vx = ((last.x - first.x) / dt) * 16;
          vy = ((last.y - first.y) / dt) * 16;
        }
      }

      const maxSpd = 26;
      vx = Math.max(-maxSpd, Math.min(maxSpd, vx));
      // 如果只是轻微拖动松手，清零水平初速度，垂直轻盈飘落
      if (Math.abs(vx) < 3.2) vx = 0;

      const isMobile = (window.innerWidth < 768);
      const screenH = window.innerHeight || 800;
      const h = container.offsetHeight || 140;
      const maxY = screenH - h - (isMobile ? 86 : 28);
      const currentY = container.offsetTop;

      // 如果乌萨奇在半空中（上面丢下来），即使轻轻松手，也要像小降落伞一样软萌慢慢飘下来！
      if (currentY < maxY - 40) {
        startFlingFlight(posX, currentY, vx, Math.max(vy, 0.8));
        return;
      }

      if (Math.abs(vx) < 2 && Math.abs(vy) < 2) {
        finishToss(posX, maxY);
        return;
      }

      startFlingFlight(posX, currentY, vx, vy);
    }

    // ============================================================
    // 拖尾粒子系统 (飞行中散落可爱星星)
    // ============================================================
    let trailCounter = 0;
    function spawnTrailParticle(cx, cy) {
      trailCounter++;
      if (trailCounter % 3 !== 0) return; // 每3帧生成1个，避免过多
      const emojis = ['✨', '⭐', '💫', '🌟', '💖', '🩷', '✦'];
      const el = document.createElement('div');
      el.className = 'usagi-trail-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (cx + (Math.random() - 0.5) * 40) + 'px';
      el.style.top = (cy + (Math.random() - 0.5) * 30) + 'px';
      el.style.fontSize = (10 + Math.random() * 10) + 'px';
      document.body.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
    }

    // ============================================================
    // 着陆冲击粒子爆发 (星星/爱心/尘埃四散)
    // ============================================================
    function spawnImpactBurst(cx, cy, intensity) {
      const count = Math.min(14, Math.floor(5 + intensity * 8));
      const emojis = ['⭐', '✨', '💫', '🌟', '💖', '🩷', '💕', '✦', '🎀'];
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'usagi-impact-particle';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const dist = 25 + Math.random() * 50 * intensity;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        el.style.setProperty('--tx', tx + 'px');
        el.style.setProperty('--ty', ty + 'px');
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';
        el.style.fontSize = (14 + Math.random() * 12 * intensity) + 'px';
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
      }

      // 尘烟特效 (左右各一朵)
      for (let side = -1; side <= 1; side += 2) {
        const dust = document.createElement('div');
        dust.className = 'usagi-dust-cloud';
        dust.style.left = (cx + side * 25) + 'px';
        dust.style.top = (cy + 5) + 'px';
        document.body.appendChild(dust);
        setTimeout(() => { if (dust.parentNode) dust.parentNode.removeChild(dust); }, 550);
      }
    }

    // ============================================================
    // 屏幕震动 (着陆冲击)
    // ============================================================
    function tossScreenShake(intensity) {
      if (intensity < 0.3) return;
      const body = document.body;
      body.classList.remove('usagi-screen-shake');
      void body.offsetWidth; // force reflow
      body.classList.add('usagi-screen-shake');
      setTimeout(() => body.classList.remove('usagi-screen-shake'), 420);
    }

    function startFlingFlight(startX, startY, initVx, initVy) {
      isTossing = true;
      container.classList.add('is-flying');
      container.style.transition = 'none';

      let x = startX;
      let y = startY;
      let vx = initVx;
      let vy = initVy;

      // 软萌趣味物理：空气轻盈降落伞物理，悠闲飘落 (从上方丢下时约 1.2~1.5 秒轻柔飘落，兼具观赏性与迅速恢复站立)
      const screenHeight = window.innerHeight || 800;
      const isDroppedFromHigh = startY < screenHeight * 0.72;
      const gravity = isDroppedFromHigh ? 0.38 : 0.62;
      const maxFallSpeed = isDroppedFromHigh ? 6.2 : 9.5;
      const friction = 0.985;
      const bounceCoeff = 0.35;
      const startTime = performance.now();
      let lastFrameTime = performance.now();
      let lastTrailTime = 0;

      // 计算初始速度大小以决定翻滚等级
      const initSpeed = Math.sqrt(initVx * initVx + initVy * initVy);
      const isFastToss = initSpeed > 10 || isDroppedFromHigh;

      if (window.UsagiSound) {
        if (isDroppedFromHigh && UsagiSound.fallSlideWhistle) {
          UsagiSound.fallSlideWhistle(); // 经典滑稽卡通下滑音口哨！
        } else {
          UsagiSound.whoosh();
        }
      }

      // 静默更新气泡文字提示（绝不在空中发起语音，彻底避免话讲一半就被着陆打断！）
      const bubbleTag = document.getElementById('usagi-speech-tag');
      const bubbleText = document.getElementById('usagi-speech-text');
      if (bubbleTag) bubbleTag.textContent = isDroppedFromHigh ? '🎈 轻盈飘落' : '🚀 起飞啦！';
      if (bubbleText) bubbleText.textContent = isDroppedFromHigh ? '像小降落伞一样晃晃悠悠飘落中~ 💫' : '起飞啦~ 好高好高！💨';

      // 添加翻滚动画类
      if (isFastToss) {
        container.classList.add(initSpeed > 16 ? 'usagi-tumbling-fast' : 'usagi-tumbling');
      }

      function physicsStep() {
        if (!isTossing) return;

        const now = performance.now();
        // 基于真实时间的物理增量计算 (保证高刷屏与低刷屏下落时间一致，约1.2~1.5秒稳稳着陆)
        const dtScale = Math.min(3.0, Math.max(0.3, (now - lastFrameTime) / 16.67));
        lastFrameTime = now;

        const screenW = window.innerWidth || 1024;
        const screenH = window.innerHeight || 800;
        const isMobile = screenW < 768;

        const w = container.offsetWidth || 110;
        const h = container.offsetHeight || 140;

        const minX = 16;
        const maxX = screenW - w - 16;
        const minY = 8;
        const maxY = screenH - h - (isMobile ? 86 : 28);

        // 软性安全保护：8秒充足时间让慢速飘落平稳触地，绝不在空中提前硬刹车
        if (now - startTime > 8000) {
          finishToss(x, maxY, isFastToss ? 1.0 : 0.3, isDroppedFromHigh);
          return;
        }

        x += vx * dtScale;
        y += vy * dtScale;
        vy += gravity * dtScale;
        if (vy > maxFallSpeed) vy = maxFallSpeed;
        vx *= Math.pow(friction, dtScale);

        // 趣味随风左右轻微摆动 (像降落伞轻悠摇曳)
        const timeInAir = now - startTime;
        if (isDroppedFromHigh) {
          const sway = Math.sin(timeInAir / 150) * 1.6;
          x += sway * dtScale;
        }

        // 碰左右墙 -> 软萌玩偶吸收撞击，微弱贴边缓冲，绝不大幅弹回屏幕中间
        if (x <= minX) {
          x = minX;
          vx = Math.abs(vx) * 0.12;
          if (window.UsagiSound) UsagiSound.boing();
        } else if (x >= maxX) {
          x = maxX;
          vx = -Math.abs(vx) * 0.12;
          if (window.UsagiSound) UsagiSound.boing();
        }

        // 碰天花板
        if (y <= minY) {
          y = minY;
          vy = Math.abs(vy) * 0.5;
          if (window.UsagiSound) UsagiSound.boing();
        }
        // 碰地面 -> 触地即刻稳稳着陆站立，迅速恢复直立！
        else if (y >= maxY) {
          y = maxY;
          // 着陆冲击力度 (基于最终垂直速度)
          const impactForce = Math.min(1.5, Math.abs(vy) / maxFallSpeed);
          finishToss(x, maxY, impactForce, isDroppedFromHigh);
          return;
        }

        // 空中随微风软萌摇摆倾斜
        if (!isFastToss) {
          const wobble = Math.sin(timeInAir / 125) * (isDroppedFromHigh ? 13 : Math.min(20, 6 + Math.abs(vx) * 1.5));
          if (mascotImg) mascotImg.style.transform = `rotate(${wobble}deg) scale(0.96, 1.05)`;
        }

        // 飞行中拖尾粒子
        if (isFastToss && now - lastTrailTime > 80) {
          lastTrailTime = now;
          const rect = container.getBoundingClientRect();
          spawnTrailParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        container.style.left = x + 'px';
        container.style.top = y + 'px';

        tossAnimId = requestAnimationFrame(physicsStep);
      }

      tossAnimId = requestAnimationFrame(physicsStep);
    }

    function finishToss(finalX, finalY, impactForce, fromHigh) {
      impactForce = impactForce || 0.3;
      fromHigh = fromHigh || false;

      isTossing = false;
      if (tossAnimId) {
        cancelAnimationFrame(tossAnimId);
        tossAnimId = null;
      }
      container.classList.remove('is-flying', 'is-dragging', 'usagi-tumbling', 'usagi-tumbling-fast');

      // 1. 核心关键：立刻彻底清除 top，严禁与 bottom 同时存在导致容器拉伸分离！
      container.style.top = '';
      const isMobile = (window.innerWidth < 768);
      container.style.bottom = isMobile ? 'calc(76px + env(safe-area-inset-bottom, 12px))' : '24px';

      const screenW = window.innerWidth || 1024;
      const minX = 16;
      const maxX = Math.max(minX + 30, screenW - (isMobile ? 180 : 240));
      posX = Math.max(minX, Math.min(maxX, finalX));
      container.style.left = posX + 'px';
      container.style.right = 'auto';
      container.style.transition = 'left 0.2s ease';

      // 2. 彻底重置对话框与操作栏的相对位置，确保永远紧紧贴合在乌萨奇头顶
      const bubble = document.getElementById('usagi-speech-bubble');
      if (bubble) {
        bubble.style.top = '';
        bubble.style.bottom = '';
        bubble.style.left = '';
        bubble.style.right = '';
        bubble.style.transform = '';
      }
      const dock = document.getElementById('usagi-assistant-dock');
      if (dock) {
        dock.style.top = '';
        dock.style.bottom = '';
      }

      // 3. 拖拽丢下后：若之前处于漫步巡逻，着陆后立刻从新位置继续漫步巡逻，绝不擅自停止！
      if (wasRoamingBeforeDrag) {
        isRoaming = true;
        localStorage.setItem('usagi_pet_roam', 'true');
        container.classList.add('roaming');
        isPaused = false;
      } else {
        isRoaming = false;
        container.classList.remove('roaming');
        isPaused = false;
      }
      updateDockUI();

      // ============================================================
      // 4. 专业着陆特效系统：深度弹性缓冲 + 稳稳直立 + 一整句完整温润语音
      // ============================================================
      const actorBox = document.getElementById('usagi-actor-box');
      if (actorBox) {
        actorBox.style.transform = '';
      }

      const isHardLanding = impactForce > 0.5;
      const isEpicLanding = impactForce > 0.75 || fromHigh;

      if (mascotImg) {
        mascotImg.style.transition = 'transform 0.15s ease-out';
        mascotImg.style.transform = '';

        if (isEpicLanding) {
          // 深度弹性缓冲动画 (触地扁压 -> 弹起缓冲 -> 100% 笔直站立)
          mascotImg.classList.add('usagi-stumble-fall');

          // 着陆冲击粒子爆发
          const rect = container.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.bottom - 10;
          spawnImpactBurst(cx, cy, impactForce);

          // 屏幕微震
          tossScreenShake(impactForce);

          // 卡通触地搞笑音效
          if (window.UsagiSound && UsagiSound.cartoonSplatBoink) {
            UsagiSound.cartoonSplatBoink(impactForce);
          } else if (window.UsagiSound) {
            UsagiSound.tossLand(impactForce);
          }

          // 触发兔耳顶端精致小金星光环
          spawnDizzyEffects();

          // 950ms后自动收起晕眩光环与旋涡眼，彻底站稳，恢复直立姿态
          setTimeout(() => {
            clearDizzyEffects();
            if (mascotImg) {
              mascotImg.classList.remove('usagi-stumble-fall');
              mascotImg.style.transition = '';
              mascotImg.style.transform = '';
            }
            if (actorBox) actorBox.style.transform = '';
            if (container) container.style.transition = '';
            setPose(currentPose || 'standing', false);
          }, 950);

          // 【核心关键】：只完整讲一整句完整的真人温馨陪伴语，绝不打断！
          const landingWarmQuotes = [
            '呼~ 稳稳着陆啦！芷萱丢得真好玩，乌萨奇就在这里乖乖陪着你哦！🥰🐰',
            '安全降落！刚才从高高的地方落下来，有芷萱在身边乌萨奇一点都不怕！💖✨',
            '呼~ 稳稳站好啦！芷萱今天也要开开心心、元气满满哦！🌸🐰'
          ];
          speak('✨ 稳稳着陆', landingWarmQuotes[Math.floor(Math.random() * landingWarmQuotes.length)], true, { force: true });

        } else if (isHardLanding) {
          // 中等着陆：加强版弹跳
          mascotImg.classList.add('usagi-bounce-squish');
          if (window.UsagiSound) UsagiSound.cartoonSplatBoink(impactForce);

          const rect = container.getBoundingClientRect();
          spawnImpactBurst(rect.left + rect.width / 2, rect.bottom - 10, 0.4);

          setTimeout(() => {
            if (mascotImg) {
              mascotImg.classList.remove('usagi-bounce-squish');
              mascotImg.style.transition = '';
              mascotImg.style.transform = '';
            }
            if (actorBox) actorBox.style.transform = '';
            if (container) container.style.transition = '';
            setPose(currentPose || 'standing', false);
          }, 350);

          speak('✨ 稳稳落地', wasRoamingBeforeDrag ? '呼~ 稳稳着陆啦！乌萨奇从这里继续欢快漫步巡逻陪芷萱啦~ 🐾🐰' : '呼~ 稳稳着陆啦！芷萱丢得真好玩，乌萨奇就在这里乖乖陪着你哦！🥰🐰', true, { force: true });

        } else {
          // 轻柔着陆：简单弹跳
          mascotImg.classList.add('usagi-bounce-squish');
          setTimeout(() => {
            if (mascotImg) {
              mascotImg.classList.remove('usagi-bounce-squish');
              mascotImg.style.transition = '';
              mascotImg.style.transform = '';
            }
            if (actorBox) actorBox.style.transform = '';
            if (container) container.style.transition = '';
            setPose(currentPose || 'standing', false);
          }, 180);

          speak('✨ 稳稳落地', wasRoamingBeforeDrag ? '呼~ 稳稳着陆啦！乌萨奇从这里继续欢快漫步巡逻陪芷萱啦~ 🐾🐰' : '呼~ 稳稳着陆啦！芷萱丢得真好玩，乌萨奇就在这里乖乖陪着你哦！🥰🐰', true, { force: true });
        }
      } else {
        setPose(currentPose || 'standing', false);
      }

      if (typeof confettiRain === 'function') confettiRain(isEpicLanding ? 25 : 15);

      // 同步最新布局
      updatePositionStyle();
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
    setPose,
    cyclePose,
    spawnDizzyEffects,
    clearDizzyEffects,
    getPose: () => currentPose,
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
  let isPaused = false;
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
      if (!isRunning || isPaused) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, mouseX));
    });

    // Touch movement
    canvas.addEventListener('touchmove', (e) => {
      if (!isRunning || isPaused) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, touchX));
    }, { passive: false });

    // Click canvas to resume or restart
    canvas.addEventListener('click', () => {
      if (isPaused) {
        togglePause();
      } else if (!isRunning) {
        start();
      }
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!isRunning) return;
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      if (isPaused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = false;
    });
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('fruit-pause-overlay');
    const icon = document.getElementById('fruit-pause-icon');
    const text = document.getElementById('fruit-pause-text');

    if (isPaused) {
      if (timerInterval) clearInterval(timerInterval);
      if (animId) cancelAnimationFrame(animId);
      if (overlay) overlay.classList.remove('hidden');
      if (icon) icon.innerText = '▶️';
      if (text) text.innerText = '继续';
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      if (overlay) overlay.classList.add('hidden');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
      lastSpawn = Date.now();
      timerInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('fruit-timer');
        if (timerEl) timerEl.innerText = `${timeLeft}s`;
        if (timeLeft <= 0) gameOver();
      }, 1000);
      if (window.UsagiSound) UsagiSound.pop();
      gameLoop();
    }
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
   4. GAME 3: 🪵 沉浸解压木鱼 · 烦恼功德解压机 (Zen Wooden Fish)
   ============================================================ */
const WoodenFishGame = (function () {
  let count = parseInt(localStorage.getItem('usagi_merit_count') || '0', 10);
  let autoInterval = null;
  let isAuto = false;
  let currentBpm = 100; // 默认舒缓 100 BPM

  const BLESSINGS = [
    '功德 +1 🪷 诸事顺遂',
    '烦恼 -9999 💨 压力全消',
    '芷萱快乐值 +100 🌸',
    '男友爱意 +10000 💖',
    '今天开开心心 ✨',
    '运气爆棚 +888 🍀',
    '经期肚肚痛彻底飞走 🌸',
    '怎么吃都不胖 🍓🍰',
    '今晚睡得超香超甜 🌙',
    '皮肤白里透红水灵灵 🍼',
    '好运连连 呀哈！🐰',
    '工作考试全部超常发挥 💯',
    '心愿通通光速实现 🌟',
    '平安喜乐 💮 万事无忧'
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

    // 播放真实木鱼空腔共鸣音效
    if (window.UsagiSound && UsagiSound.woodenFish) {
      UsagiSound.woodenFish();
    }

    // 1. 物理木鱼下压弹性回弹动画
    const core = document.getElementById('wooden-fish-core');
    if (core) {
      core.classList.remove('is-struck');
      void core.offsetWidth;
      core.classList.add('is-struck');
    }

    // 2. 物理木槌下击敲击动画
    const mallet = document.getElementById('wooden-fish-mallet');
    if (mallet) {
      mallet.classList.remove('is-striking');
      void mallet.offsetWidth;
      mallet.classList.add('is-striking');
    }

    // 3. 莲花蒲团受力缓冲
    const cushion = document.getElementById('wooden-fish-cushion');
    if (cushion) {
      cushion.style.transform = 'scale(1.02, 0.94)';
      setTimeout(() => { if (cushion) cushion.style.transform = ''; }, 160);
    }

    // 4. 金色声学光环冲击波
    const shockBox = document.getElementById('fish-shockwave-box');
    if (shockBox) {
      const ring = document.createElement('div');
      ring.className = 'fish-shockwave-ring';
      shockBox.appendChild(ring);
      setTimeout(() => { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 520);
    }

    // 5. 祥云功德飞升大字
    spawnFloatingText();

    if (count % 7 === 0) {
      if (window.UsagiPetManager) {
        UsagiPetManager.reactTo('happy', '咚~ 烦恼全敲跑！芷萱的功德和快乐值一直在猛涨呢！🌸✨');
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
    el.className = 'floating-merit-zen';
    const text = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
    el.innerText = text;

    // 传统典雅红金色系
    const colors = ['#D97706', '#E11D48', '#B45309', '#059669', '#7C3AED', '#DB2777', '#F59E0B'];
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.top = '38%';
    el.style.left = `${50 + (Math.random() * 24 - 12)}%`;

    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1400);
  }

  function setBpm(bpm) {
    currentBpm = bpm;
    [60, 100, 180].forEach(b => {
      const btn = document.getElementById(`fish-bpm-${b}`);
      if (btn) {
        if (b === bpm) {
          btn.className = 'px-2 py-0.5 rounded-lg text-[11px] font-black bg-white text-amber-900 shadow-xs cursor-pointer';
        } else {
          btn.className = 'px-2 py-0.5 rounded-lg text-[11px] font-bold text-stone-600 hover:text-amber-800 cursor-pointer';
        }
      }
    });

    if (isAuto) {
      if (autoInterval) clearInterval(autoInterval);
      const intervalMs = Math.round(60000 / currentBpm);
      autoInterval = setInterval(() => { knock(); }, intervalMs);
    }
    if (window.UsagiSound) UsagiSound.pop();
  }

  function toggleAuto() {
    isAuto = !isAuto;
    const btnText = document.getElementById('auto-fish-text');
    const icon = document.getElementById('auto-fish-icon');

    if (isAuto) {
      if (btnText) btnText.innerText = '停止敲击';
      if (icon) icon.innerText = '⏸️';
      const intervalMs = Math.round(60000 / currentBpm);
      knock();
      autoInterval = setInterval(() => {
        knock();
      }, intervalMs);
    } else {
      if (btnText) btnText.innerText = '自动敲击';
      if (icon) icon.innerText = '🧘';
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
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

  return { init, knock, toggleAuto, setBpm, reset };
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

    initHammer();
  }

  let isPaused = false;
  let hammerInited = false;

  function initHammer() {
    const arena = document.getElementById('whack-arena');
    const hammer = document.getElementById('whack-hammer');
    if (!arena || !hammer || hammerInited) return;
    hammerInited = true;

    arena.addEventListener('mouseenter', () => {
      if (isRunning && !isPaused) {
        hammer.classList.remove('hidden');
        arena.classList.add('hammer-active');
      }
    });

    arena.addEventListener('mouseleave', () => {
      hammer.classList.add('hidden');
      arena.classList.remove('hammer-active');
    });

    arena.addEventListener('mousemove', (e) => {
      if (!isRunning || isPaused) return;
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (e.clientX - rect.left) + 'px';
      hammer.style.top = (e.clientY - rect.top) + 'px';
    });

    arena.addEventListener('touchmove', (e) => {
      if (!isRunning || isPaused || !e.touches[0]) return;
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (e.touches[0].clientX - rect.left) + 'px';
      hammer.style.top = (e.touches[0].clientY - rect.top) + 'px';
    }, { passive: true });

    arena.addEventListener('click', (e) => {
      if (isPaused) {
        togglePause();
        return;
      }
      if (!isRunning) {
        start();
        return;
      }
      swingHammer(e.clientX, e.clientY, true);
    });
  }

  function swingHammer(clientX, clientY, isHitMonster = true) {
    const arena = document.getElementById('whack-arena');
    const hammer = document.getElementById('whack-hammer');
    if (!arena || !hammer) return;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (clientX - rect.left) + 'px';
      hammer.style.top = (clientY - rect.top) + 'px';
    }

    hammer.classList.remove('is-smashing');
    void hammer.offsetWidth;
    hammer.classList.add('is-smashing');

    // Impact Sound
    if (window.UsagiSound && UsagiSound.hammerSmash) {
      UsagiSound.hammerSmash(isHitMonster);
    } else if (window.UsagiSound && UsagiSound.hit) {
      UsagiSound.hit();
    }

    // Impact burst visual
    if (clientX !== undefined && clientY !== undefined) {
      const rect = arena.getBoundingClientRect();
      const burst = document.createElement('div');
      burst.className = 'whack-impact-burst text-2xl font-black select-none pointer-events-none';
      burst.innerText = isHitMonster ? '💥 POW!' : '💫 哎呀';
      burst.style.color = isHitMonster ? '#F43F5E' : '#A855F7';
      burst.style.left = (clientX - rect.left) + 'px';
      burst.style.top = (clientY - rect.top) + 'px';
      arena.appendChild(burst);
      setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 450);
    }
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('whack-pause-overlay');
    const icon = document.getElementById('whack-pause-icon');
    const text = document.getElementById('whack-pause-text');
    const hammer = document.getElementById('whack-hammer');
    const arena = document.getElementById('whack-arena');

    if (isPaused) {
      if (timerInterval) clearInterval(timerInterval);
      if (moleTimer) clearTimeout(moleTimer);
      if (overlay) overlay.classList.remove('hidden');
      if (hammer) hammer.classList.add('hidden');
      if (arena) arena.classList.remove('hammer-active');
      if (icon) icon.innerText = '▶️';
      if (text) text.innerText = '继续';
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      if (overlay) overlay.classList.add('hidden');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
      if (arena) arena.classList.add('hammer-active');

      timerInterval = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) endGame();
      }, 1000);
      popUpLoop();
      if (window.UsagiSound) UsagiSound.pop();
    }
  }

  function start() {
    if (!document.getElementById('mole-hole-0')) init();

    isRunning = true;
    isPaused = false;
    score = 0;
    timeLeft = 30;
    updateUI();

    initHammer();
    const arena = document.getElementById('whack-arena');
    if (arena) arena.classList.add('hammer-active');
    const hammer = document.getElementById('whack-hammer');
    if (hammer) hammer.classList.remove('hidden');

    const pauseOverlay = document.getElementById('whack-pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');

    const pauseBtn = document.getElementById('btn-whack-pause');
    if (pauseBtn) {
      pauseBtn.classList.remove('hidden');
      const icon = document.getElementById('whack-pause-icon');
      const text = document.getElementById('whack-pause-text');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
    }

    const startBtn = document.getElementById('btn-whack-start');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> 敲击中...';
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
    if (!isRunning || isPaused) return;

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

  function whack(idx, e) {
    if (!isRunning || isPaused) return;

    // Trigger visual hammer strike at hole position
    const hole = document.getElementById(`mole-hole-${idx}`);
    if (hole) {
      const rect = hole.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      swingHammer(cx, cy, true);
    }

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
      const emojiEl = document.getElementById(`mole-emoji-${idx}`);
      if (emojiEl) emojiEl.innerText = '🥺';
    } else {
      // Whacked bad monster!
      score += pts;
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
    isPaused = false;
    clearInterval(timerInterval);
    if (moleTimer) clearTimeout(moleTimer);

    if (activeHole !== -1) {
      const targetEl = document.getElementById(`mole-target-${activeHole}`);
      if (targetEl) targetEl.classList.remove('up');
    }

    const arena = document.getElementById('whack-arena');
    if (arena) arena.classList.remove('hammer-active');
    const hammer = document.getElementById('whack-hammer');
    if (hammer) hammer.classList.add('hidden');

    const pauseBtn = document.getElementById('btn-whack-pause');
    if (pauseBtn) pauseBtn.classList.add('hidden');

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

  return { init, start, whack, togglePause };
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
  let isPaused = false;

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

  function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('suika-pause-overlay');
    const icon = document.getElementById('suika-pause-icon');
    const text = document.getElementById('suika-pause-text');

    if (isPaused) {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      if (overlay) overlay.classList.remove('hidden');
      if (icon) icon.innerText = '▶️';
      if (text) text.innerText = '继续';
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      if (overlay) overlay.classList.add('hidden');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
      if (window.UsagiSound) UsagiSound.pop();
      loop();
    }
  }

  function reset() {
    score = 0;
    isGameOver = false;
    isPaused = false;
    const overlay = document.getElementById('suika-pause-overlay');
    if (overlay) overlay.classList.add('hidden');
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
      if (isGameOver || isPaused) return;
      aimX = getX(e);
    };

    const onRelease = (e) => {
      if (isPaused) {
        togglePause();
        return;
      }
      if (isGameOver) {
        reset();
        return;
      }
      if (!canDrop) return;
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

  return { init, reset, togglePause };
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
    } catch (e) { }
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
    if (canvas && !canvas._snakeClick) {
      canvas._snakeClick = true;
      canvas.addEventListener('click', () => {
        if (!isRunning) {
          togglePlay();
        }
      });
    }

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
      else if (e.key === ' ' || e.key === 'p' || e.key === 'P') togglePlay();
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
    const overlay = document.getElementById('snake-pause-overlay');
    if (isRunning) {
      clearInterval(gameInterval);
      isRunning = false;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> 继续冒险';
      if (overlay) overlay.classList.remove('hidden');
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      isRunning = true;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-pause mr-1"></i> 暂停游戏';
      if (overlay) overlay.classList.add('hidden');
      if (window.UsagiSound) UsagiSound.pop();
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
  let isPaused = false;
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
      if (!isPlaying || isPaused) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      if (mouseX < player.x) { player.vx = -4.5; player.facing = -1; }
      else if (mouseX > player.x + player.w) { player.vx = 4.5; player.facing = 1; }
    };

    canvas.onclick = () => {
      if (isPaused) {
        togglePause();
      } else if (!isPlaying) {
        reset();
      }
    };

    reset();
  }

  function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('hop-pause-overlay');
    const icon = document.getElementById('hop-pause-icon');
    const text = document.getElementById('hop-pause-text');

    if (isPaused) {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      if (overlay) overlay.classList.remove('hidden');
      if (icon) icon.innerText = '▶️';
      if (text) text.innerText = '继续';
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      if (overlay) overlay.classList.add('hidden');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
      if (window.UsagiSound) UsagiSound.pop();
      loop();
    }
  }

  function reset() {
    isPlaying = true;
    isPaused = false;
    const overlay = document.getElementById('hop-pause-overlay');
    if (overlay) overlay.classList.add('hidden');
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
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') togglePause();
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

  return { init, reset, togglePause };
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
  let isPaused = false;
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
    initHammer();
  }

  function initHammer() {
    const arena = document.getElementById('harvest-arena');
    const hammer = document.getElementById('harvest-hammer');
    if (!arena || !hammer || arena._hammerInited) return;
    arena._hammerInited = true;

    arena.addEventListener('mouseenter', () => {
      if (isPlaying && !isPaused) hammer.classList.remove('hidden');
    });

    arena.addEventListener('mouseleave', () => {
      hammer.classList.add('hidden');
    });

    arena.addEventListener('mousemove', (e) => {
      if (!isPlaying || isPaused) return;
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (e.clientX - rect.left) + 'px';
      hammer.style.top = (e.clientY - rect.top) + 'px';
    });

    arena.addEventListener('touchmove', (e) => {
      if (!isPlaying || isPaused || !e.touches[0]) return;
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (e.touches[0].clientX - rect.left) + 'px';
      hammer.style.top = (e.touches[0].clientY - rect.top) + 'px';
    }, { passive: true });

    arena.addEventListener('click', (e) => {
      if (isPaused) {
        togglePause();
        return;
      }
      if (!isPlaying) {
        start();
        return;
      }
      swingHammer(e.clientX, e.clientY, true);
    });
  }

  function swingHammer(clientX, clientY, isHit = true) {
    const arena = document.getElementById('harvest-arena');
    const hammer = document.getElementById('harvest-hammer');
    if (!arena || !hammer) return;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = arena.getBoundingClientRect();
      hammer.classList.remove('hidden');
      hammer.style.left = (clientX - rect.left) + 'px';
      hammer.style.top = (clientY - rect.top) + 'px';
    }

    hammer.classList.remove('is-smashing');
    void hammer.offsetWidth;
    hammer.classList.add('is-smashing');

    // Impact Sound
    if (window.UsagiSound && UsagiSound.hammerSmash) {
      UsagiSound.hammerSmash(isHit);
    } else if (window.UsagiSound && UsagiSound.pop) {
      UsagiSound.pop();
    }

    // Impact burst visual
    if (clientX !== undefined && clientY !== undefined) {
      const rect = arena.getBoundingClientRect();
      const burst = document.createElement('div');
      burst.className = 'whack-impact-burst text-2xl font-black select-none pointer-events-none';
      burst.innerText = isHit ? '💥 拔出!' : '💨 慢了一步';
      burst.style.color = isHit ? '#F59E0B' : '#A855F7';
      burst.style.left = (clientX - rect.left) + 'px';
      burst.style.top = (clientY - rect.top) + 'px';
      arena.appendChild(burst);
      setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 450);
    }
  }

  function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('harvest-pause-overlay');
    const icon = document.getElementById('harvest-pause-icon');
    const text = document.getElementById('harvest-pause-text');
    const hammer = document.getElementById('harvest-hammer');
    const arena = document.getElementById('harvest-arena');

    if (isPaused) {
      if (timerInterval) clearInterval(timerInterval);
      if (spawnInterval) clearInterval(spawnInterval);
      if (overlay) overlay.classList.remove('hidden');
      if (hammer) hammer.classList.add('hidden');
      if (arena) arena.classList.remove('hammer-active');
      if (icon) icon.innerText = '▶️';
      if (text) text.innerText = '继续';
      if (window.UsagiSound) UsagiSound.pop();
    } else {
      if (overlay) overlay.classList.add('hidden');
      if (icon) icon.innerText = '⏸️';
      if (text) text.innerText = '暂停';
      if (arena) arena.classList.add('hammer-active');

      timerInterval = setInterval(() => {
        timeLeft--;
        const timeEl = document.getElementById('harvest-time');
        if (timeEl) timeEl.innerText = timeLeft;
        if (timeLeft <= 0) finish();
      }, 1000);
      spawnInterval = setInterval(popItem, 650);
      if (window.UsagiSound) UsagiSound.pop();
    }
  }

  function start() {
    initHammer();
    if (isPlaying) stop();
    isPlaying = true;
    isPaused = false;
    score = 0;
    combo = 0;
    timeLeft = 30;
    updateUI();

    const btn = document.getElementById('btn-harvest-start');
    if (btn) btn.innerText = '⏸️ 进行中...';
    const pauseBtn = document.getElementById('btn-harvest-pause');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    const overlay = document.getElementById('harvest-pause-overlay');
    if (overlay) overlay.classList.add('hidden');
    const arena = document.getElementById('harvest-arena');
    if (arena) arena.classList.add('hammer-active');

    if (window.UsagiSound) UsagiSound.fanfare();
    if (window.UsagiPetManager) UsagiPetManager.speak('🥕 农场开拔！', '农场丰收啦！用小锤子把胡萝卜拔光光~ 冲呀芷萱！🌾🐰', true);

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
    isPaused = false;
    if (timerInterval) clearInterval(timerInterval);
    if (spawnInterval) clearInterval(spawnInterval);
    holes.fill(null);
    renderHoles();
    const btn = document.getElementById('btn-harvest-start');
    if (btn) btn.innerText = '▶️ 开始挑战';
    const pauseBtn = document.getElementById('btn-harvest-pause');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    const overlay = document.getElementById('harvest-pause-overlay');
    if (overlay) overlay.classList.add('hidden');
    const hammer = document.getElementById('harvest-hammer');
    if (hammer) hammer.classList.add('hidden');
    const arena = document.getElementById('harvest-arena');
    if (arena) arena.classList.remove('hammer-active');
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

  return { init, start, stop, whack, togglePause, swingHammer };
})();
window.HarvestGame = HarvestGame;


/* ============================================================
   6.7. GAME 12: 🎹 乌萨奇心动音游狂欢节 (Kawaii Rhythm Festival)
   支持 40+ 首全量本地 MP3 原曲自选 · 5-PERFECT 炸裂燃火 FEVER 模式 · 4轨落键 & 太鼓达人双模
   ============================================================ */
const RhythmGame = (function () {
  let canvas = null, ctx = null;
  let isPlaying = false;
  let isPaused = false;
  let animId = null;
  let gameMode = 'keys'; // 'keys' (4轨落键), 'taiko' (太鼓达人), 'catch' (接音符), 'circle' (光环节拍)
  let difficulty = 'normal'; // 'easy', 'normal', 'master'
  let speedMultiplier = parseFloat(localStorage.getItem('usagi_rhythm_speed') || '2'); // 支持 0.2x ~ 20x 任意自由自选倍速
  if (isNaN(speedMultiplier) || speedMultiplier <= 0) speedMultiplier = 2;
  let basketX = 190;
  let basketTargetX = 190;
  let circles = [];

  let score = 0, combo = 0, maxCombo = 0, highScore = parseInt(localStorage.getItem('usagi_rhythm_high') || '0', 10);
  let perfectCount = 0, greatCount = 0, missCount = 0;
  let consecutivePerfects = 0;
  let isFever = false;
  let feverTimer = 0;
  let screenShake = 0;
  let drumPulse = 0;

  let notes = [];
  let spawnTimer = 0;
  let particles = [];
  let floatingTexts = [];
  let laneFlashes = [0, 0, 0, 0];
  let bgmAudio = null;
  let isAudioMuted = false;

  // 40+ 首全集曲库备用列表 (与 ZHENG_RUNZE_CATALOG 完全镜像)
  const FALLBACK_SONGS = [
    { id: 'when_it_snows', title: 'When It Snows ❄️', artist: 'Sarah Kang & Sam Ock', audio: 'song_when_it_snows.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/73/dc/f9/73dcf919-fbd9-8e92-3f8a-6e4411ed4d39/artwork.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'jiangguo_tiny7', title: '浆果 (Berry) 🍓', artist: 'TINY7', audio: 'song_jiangguo.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7c/9a/a8/7c9aa865-56c0-b99b-55ff-5ec30c9877d5/957925.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'time_machine', title: 'Time Machine (feat. Aren Park)', artist: 'mj apanay', audio: 'song_time_machine.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b9/49/84/b9498437-c58e-e6e3-0e71-73090a850e4f/231512.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'boli_gareth', title: '玻璃 (Glass)', artist: 'Gareth.T (汤令山)', audio: 'song_boli.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/1c/1a/be/1c1abe3a-2eb6-216c-9040-797bb98464d1/827568024145.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'youwone_guoyifan', title: '有我呢', artist: '郭一凡', audio: 'song_youwone.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/1b/2f/131b2f43-a50b-a98e-978d-7a907ace14fb/4894944221401.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'chengwai_zrz', title: '城外 🏰', artist: '郑润泽', audio: 'song_chengwai.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b7/e8/1b/b7e81b59-e9ae-e47b-a30e-58b595dae7e3/165314330-.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'xiaobai_zrz', title: '小白 🤍', artist: '郑润泽 / 罗言', audio: 'song_xiaobai.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b7/e8/1b/b7e81b59-e9ae-e47b-a30e-58b595dae7e3/165314330-.jpg/100x100bb.jpg', category: 'gf' },
    { id: 'shun_zrz', title: '瞬', artist: '郑润泽', audio: 'song_shun.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'ruguo_ne_zrz', title: '如果呢', artist: '郑润泽', audio: 'song_ruguo_ne.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6d/84/ea/6d84ea0b-44e5-61c1-55b0-db49ac5c81a5/ruguone.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'xiaxiang_zrz', title: '遐想', artist: '郑润泽', audio: 'song_xiaxiang.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'yuwen_zrz', title: '余温', artist: '郑润泽', audio: 'song_yuwen.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/02/f4/ad/02f4adfc-c8b4-6cdb-ef3b-385ed7860c49/139482556-.png/100x100bb.jpg', category: 'zrz' },
    { id: 'date1231_zrz', title: '12.31', artist: '郑润泽', audio: 'song_date1231.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/a4/81/8aa48155-4a68-5492-633f-b7011812bee2/cover.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'cheye_zrz', title: '彻夜 (All Night)', artist: '郑润泽', audio: 'song_cheye.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d6/de/fa/d6defa17-ced7-128b-76b4-541b88b70633/cover.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'zhanfang_zrz', title: '绽放', artist: '郑润泽', audio: 'song_zhanfang.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'guanyuni_zrz', title: '关于你', artist: '郑润泽', audio: 'song_guanyuni.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6f/6d/74/6f6d74ed-3fd2-9a31-a978-dded76f26afc/1701167582289223.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'xiaoweiguang_zrz', title: '小微光', artist: '郑润泽', audio: 'song_xiaoweiguang.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/88/a2/ab/88a2ab4d-b196-a003-b462-8418520da8ce/cover.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'bujian_zrz', title: '不见不离开 (feat. 队长)', artist: '郑润泽 / 队长', audio: 'song_bujian.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'shikong_zrz', title: '时空街区', artist: '郑润泽', audio: 'song_shikong.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/81/b0/8d81b004-2e4f-32ff-64e2-e012b6861ebc/IMG_2702.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'jinhuzhou_zrz', title: '紧箍咒', artist: '郑润泽', audio: 'song_jinhuzhou.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'lantianqi_zrz', title: '烂天气', artist: '郑润泽', audio: 'song_lantianqi.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d6/de/fa/d6defa17-ced7-128b-76b4-541b88b70633/cover.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'xuanlihuohuo_zrz', title: '绚丽花火', artist: '郑润泽', audio: 'song_xuanlihuohuo.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b7/e8/1b/b7e81b59-e9ae-e47b-a30e-58b595dae7e3/165314330-.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'guisu_zrz', title: '归宿', artist: '郑润泽', audio: 'song_guisu.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4b/ec/40/4bec40d6-499c-3742-2212-4e655e4cf68b/cover.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'pingxingxian_zrz', title: '平行线', artist: '郑润泽', audio: 'song_pingxingxian.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/81/b0/8d81b004-2e4f-32ff-64e2-e012b6861ebc/IMG_2702.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'xuanwo_zrz', title: '旋涡', artist: '郑润泽', audio: 'song_xuanwo.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/f0/88/cff08844-349c-a15f-e168-3eaa6ad2f8f6/1681206971144350.jpg/100x100bb.jpg', category: 'zrz' },
    { id: 'gaobai_jay', title: '告白气球 🎈', artist: '周杰伦', audio: 'song_gaobai.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/58/8d/6d/588d6d61-fbac-148a-86bd-0030ce076ac1/23UM1IM57281.rgb.jpg/100x100bb.jpg', category: 'jay' },
    { id: 'qingtian_jay', title: '晴天 ☀️', artist: '周杰伦', audio: 'song_qingtian.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/58/8d/6d/588d6d61-fbac-148a-86bd-0030ce076ac1/23UM1IM57281.rgb.jpg/100x100bb.jpg', category: 'jay' },
    { id: 'cortis_go', title: 'GO! 🚀', artist: 'CORTIS (코르티스)', audio: 'song_cortis_go.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_what_you_want', title: 'What You Want ⚡', artist: 'CORTIS (코르티스)', audio: 'song_cortis_what_you_want.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_fashion', title: 'FaSHioN 🕶️', artist: 'CORTIS (코르티스)', audio: 'song_cortis_fashion.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_joyride', title: 'JoyRide 🏎️', artist: 'CORTIS (코르티스)', audio: 'song_cortis_joyride.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_lullaby', title: 'Lullaby 🌙', artist: 'CORTIS (코르티스)', audio: 'song_cortis_lullaby.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_what_you_want_teezo', title: 'What You Want (feat. Teezo Touchdown) 🔥', artist: 'CORTIS (코르티스)', audio: 'song_cortis_what_you_want_teezo.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/b1/d0/07b1d01f-eada-50a5-bdf5-f3f86b1de566/198704622366_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_mention_me', title: 'Mention Me 🎬', artist: 'CORTIS (코르티스)', audio: 'song_cortis_mention_me.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7c/7c/34/7c7c348d-5ee9-367a-5dfd-0c6f580f9a40/ticket.pgpnygba.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_tnt', title: 'TNT 💣', artist: 'CORTIS (코르티스)', audio: 'song_cortis_tnt.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_redred', title: 'REDRED 🔴', artist: 'CORTIS (코르티스)', audio: 'song_cortis_redred.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_acai', title: 'ACAI 🫐', artist: 'CORTIS (코르티스)', audio: 'song_cortis_acai.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_youngcreatorcrew', title: 'YOUNGCREATORCREW 🎨', artist: 'CORTIS (코르티스)', audio: 'song_cortis_youngcreatorcrew.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_wassup', title: 'Wassup 🤙', artist: 'CORTIS (코르티스)', audio: 'song_cortis_wassup.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_blue_lips', title: 'Blue Lips 💙', artist: 'CORTIS (코르티스)', audio: 'song_cortis_blue_lips.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5f/47/9b5f4711-dc78-2dea-6721-d06709ea5121/198704992810_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_motion', title: 'MOTION (feat. Juicy J) 🌊', artist: 'CORTIS (코르티스)', audio: 'song_cortis_motion.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/f9/a9/82f9a9b8-db69-6fec-3816-54a403297436/823375327356_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_pack_it_up', title: 'PACK IT UP 🎒', artist: 'CORTIS (코르티스)', audio: 'song_cortis_pack_it_up.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/99/db/df/99dbdf86-b7f8-86ce-e8da-4ddd845f1bdc/823375359456_Cover.jpg/300x300bb.jpg', category: 'cortis' },
    { id: 'cortis_moneymoneymoney', title: 'MONEYMONEYMONEY 💸', artist: 'CORTIS (코르티스)', audio: 'song_cortis_moneymoneymoney.mp3', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/99/db/df/99dbdf86-b7f8-86ce-e8da-4ddd845f1bdc/823375359456_Cover.jpg/300x300bb.jpg', category: 'cortis' }
  ];

  let currentSong = FALLBACK_SONGS[0];
  let currentCategory = 'all';

  const LANES = [
    { key: 'd', freq: 523.25, icon: '💖', color: '#f43f5e', name: 'Lane 1' },
    { key: 'f', freq: 659.25, icon: '🍓', color: '#fb7185', name: 'Lane 2' },
    { key: 'j', freq: 783.99, icon: '⭐', color: '#f59e0b', name: 'Lane 3' },
    { key: 'k', freq: 1046.50, icon: '🥕', color: '#10b981', name: 'Lane 4' }
  ];

  function getAllSongs() {
    if (window.ZHENG_RUNZE_CATALOG && Array.isArray(window.ZHENG_RUNZE_CATALOG) && window.ZHENG_RUNZE_CATALOG.length > 0) {
      return window.ZHENG_RUNZE_CATALOG.map(s => {
        let cat = 'all';
        const id = s.id || '';
        if (id.includes('cortis')) cat = 'cortis';
        else if (id.includes('jay') || id.includes('gaobai') || id.includes('qingtian')) cat = 'jay';
        else if (['when_it_snows', 'jiangguo_tiny7', 'time_machine', 'boli_gareth', 'youwone_guoyifan', 'chengwai_zrz', 'xiaobai_zrz'].includes(id)) cat = 'gf';
        else cat = 'zrz';
        return Object.assign({}, s, { category: cat });
      });
    }
    return FALLBACK_SONGS;
  }

  function init() {
    canvas = document.getElementById('rhythm-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    bgmAudio = document.getElementById('rhythm-bgm-audio');
    if (bgmAudio) {
      bgmAudio.addEventListener('ended', onSongEnded);
      bgmAudio.volume = 0.75;
    }

    const highEl = document.getElementById('rhythm-high');
    if (highEl) highEl.innerText = highScore;

    // Load initial song
    const all = getAllSongs();
    if (all.length > 0) {
      currentSong = all[0];
      updateSongCard();
    }

    // Keydown listeners
    window.removeEventListener('keydown', handleKeyInput);
    window.addEventListener('keydown', handleKeyInput);

    // Touch / Button listeners for 4-Key
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`rhythm-key-${i}`);
      if (btn) {
        btn.onmousedown = btn.ontouchstart = (e) => {
          e.preventDefault();
          hitLane(i);
        };
      }
    }

    // Taiko touch buttons
    const btnDon = document.getElementById('taiko-btn-don');
    if (btnDon) {
      btnDon.onmousedown = btnDon.ontouchstart = (e) => { e.preventDefault(); hitTaiko('don'); };
    }
    const btnKa = document.getElementById('taiko-btn-ka-left');
    if (btnKa) {
      btnKa.onmousedown = btnKa.ontouchstart = (e) => { e.preventDefault(); hitTaiko('ka'); };
    }
    const btnRoll = document.getElementById('taiko-btn-roll');
    if (btnRoll) {
      btnRoll.onmousedown = btnRoll.ontouchstart = (e) => { e.preventDefault(); hitTaiko('roll'); };
    }

    // Touch & Pointer listeners on rhythm canvas for Catch & Circle
    function handleCanvasPointer(e) {
      if (isPaused) {
        resumeGame();
        return;
      }
      if (!canvas || !isPlaying) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
      const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      if (gameMode === 'catch') {
        basketTargetX = Math.max(45, Math.min(canvas.width - 45, x));
      } else if (gameMode === 'circle') {
        hitCircle(x, y);
      }
    }

    canvas.onmousedown = (e) => {
      handleCanvasPointer(e);
    };
    canvas.ontouchstart = (e) => {
      e.preventDefault();
      handleCanvasPointer(e);
    };
    canvas.ontouchmove = (e) => {
      if (gameMode === 'catch') {
        e.preventDefault();
        handleCanvasPointer(e);
      }
    };
    canvas.onmousemove = (e) => {
      if (gameMode === 'catch' && e.buttons === 1) {
        handleCanvasPointer(e);
      }
    };

    const btnCatchLeft = document.getElementById('catch-btn-left');
    if (btnCatchLeft) {
      btnCatchLeft.onmousedown = btnCatchLeft.ontouchstart = (e) => {
        e.preventDefault();
        moveBasket(-55);
      };
    }
    const btnCatchRight = document.getElementById('catch-btn-right');
    if (btnCatchRight) {
      btnCatchRight.onmousedown = btnCatchRight.ontouchstart = (e) => {
        e.preventDefault();
        moveBasket(55);
      };
    }

    updateUI();
    setSpeed(speedMultiplier, true);
  }

  // ------------------------------------------------------------
  // Multiplier Speed Control (自由自选倍速，支持预设/微调/任意自定)
  // ------------------------------------------------------------
  function setSpeed(mult, silent) {
    let num = parseFloat(mult);
    if (isNaN(num) || num <= 0) num = 2;
    // 保留最多1位小数，限制在 0.2x ~ 20.0x 合理极速范围内
    num = Math.round(Math.max(0.2, Math.min(20, num)) * 10) / 10;
    speedMultiplier = num;
    try {
      localStorage.setItem('usagi_rhythm_speed', String(num));
    } catch (e) {}

    // 更新当前倍速指示徽章
    const curValEl = document.getElementById('rhythm-speed-current-val');
    if (curValEl) curValEl.innerText = `${num}x`;

    // 预设快捷按钮高亮匹配
    const presets = [0.5, 1, 1.5, 2, 3, 4, 6, 8];
    let matchedPreset = false;
    presets.forEach(p => {
      const idKey = String(p).replace('.', '');
      const btn = document.getElementById(`rhythm-speed-btn-${idKey}`) || document.getElementById(`rhythm-speed-btn-${p}`);
      if (btn) {
        const isMatch = Math.abs(p - num) < 0.05;
        btn.classList.toggle('active', isMatch);
        if (isMatch) matchedPreset = true;
      }
    });

    // 自定义自选按钮高亮与文案
    const customBtn = document.getElementById('rhythm-speed-btn-custom');
    const customLabel = document.getElementById('rhythm-speed-custom-label');
    if (customBtn) {
      customBtn.classList.toggle('active', !matchedPreset);
    }
    if (customLabel) {
      customLabel.innerText = matchedPreset ? '⚙️ 自选' : `✨ ${num}x`;
    }

    // 同步弹窗内的输入与滑块状态
    syncModalInputs(num);

    if (!silent) {
      if (window.UsagiSound) UsagiSound.pop();
      if (window.UsagiPetManager && typeof UsagiPetManager.speak === 'function') {
        UsagiPetManager.speak('⚡ 节奏倍速已切换', `音游倍速已设置为 ${num}x！音符下落与接近流速已全面更新，芷萱加油冲呀~ 🔥🐰`, true);
      }
    }
  }

  function stepSpeed(delta) {
    let next = Math.round((speedMultiplier + delta) * 10) / 10;
    if (next < 0.5) next = 0.5;
    if (next > 15) next = 15;
    setSpeed(next);
  }

  function syncModalInputs(val) {
    const preview = document.getElementById('rhythm-modal-speed-preview');
    const desc = document.getElementById('rhythm-modal-speed-desc');
    const slider = document.getElementById('rhythm-modal-speed-slider');
    const input = document.getElementById('rhythm-modal-speed-input');

    if (preview) preview.innerText = `${val}x`;
    if (slider) slider.value = Math.min(15, Math.max(0.2, val));
    if (input) input.value = val;

    if (desc) {
      if (val <= 0.8) desc.innerText = '🌸 慢速休闲';
      else if (val <= 1.5) desc.innerText = '🎵 舒缓节拍';
      else if (val <= 2.5) desc.innerText = '✨ 经典律动 (推荐)';
      else if (val <= 4.0) desc.innerText = '⚡ 疾风高手';
      else if (val <= 6.0) desc.innerText = '🔥 极限狂暴';
      else desc.innerText = '🏆 超神暴走';
    }
  }

  function openCustomSpeedModal() {
    const modal = document.getElementById('modal-rhythm-custom-speed');
    if (!modal) return;
    syncModalInputs(speedMultiplier);
    modal.classList.remove('hidden');
    if (window.UsagiSound) UsagiSound.pop();
  }

  function closeCustomSpeedModal() {
    const modal = document.getElementById('modal-rhythm-custom-speed');
    if (modal) modal.classList.add('hidden');
    if (window.UsagiSound) UsagiSound.pop();
  }

  function onSliderInput(val) {
    const num = Math.round(parseFloat(val) * 10) / 10;
    syncModalInputs(num);
  }

  function onNumberInput(val) {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      syncModalInputs(Math.round(num * 10) / 10);
    }
  }

  function pickModalPreset(val) {
    syncModalInputs(val);
    if (window.UsagiSound) UsagiSound.pop();
  }

  function applyCustomSpeedFromModal() {
    const input = document.getElementById('rhythm-modal-speed-input');
    const val = input ? parseFloat(input.value) : speedMultiplier;
    setSpeed(val);
    closeCustomSpeedModal();
  }

  function moveBasket(delta) {
    if (!canvas) return;
    basketTargetX = Math.max(45, Math.min(canvas.width - 45, basketTargetX + delta));
  }

  function handleKeyInput(e) {
    const k = e.key.toLowerCase();
    if (k === 'p') {
      togglePlay();
      return;
    }
    if (isPaused && (k === ' ' || k === 'enter')) {
      resumeGame();
      return;
    }
    if (!isPlaying) return;
    if (gameMode === 'keys') {
      if (k === 'd') hitLane(0);
      else if (k === 'f') hitLane(1);
      else if (k === 'j') hitLane(2);
      else if (k === 'k') hitLane(3);
    } else if (gameMode === 'taiko') {
      if (k === 'f' || k === 'j') hitTaiko('don');
      else if (k === 'd' || k === 'k') hitTaiko('ka');
      else if (k === ' ') hitTaiko('roll');
    } else if (gameMode === 'catch') {
      if (k === 'a' || k === 'arrowleft') moveBasket(-55);
      else if (k === 'd' || k === 'arrowright') moveBasket(55);
    } else if (gameMode === 'circle') {
      if (circles.length > 0) {
        const closest = circles.reduce((prev, curr) => (Math.abs(curr.approach - curr.radius) < Math.abs(prev.approach - prev.radius) ? curr : prev), circles[0]);
        if (closest) hitCircle(closest.x, closest.y);
      }
    }
  }

  function switchMode(mode) {
    gameMode = mode;
    const btnKeys = document.getElementById('rhythm-mode-btn-keys');
    const btnTaiko = document.getElementById('rhythm-mode-btn-taiko');
    const btnCatch = document.getElementById('rhythm-mode-btn-catch');
    const btnCircle = document.getElementById('rhythm-mode-btn-circle');

    const cKeys = document.getElementById('rhythm-controls-keys');
    const cTaiko = document.getElementById('rhythm-controls-taiko');
    const cCatch = document.getElementById('rhythm-controls-catch');
    const cCircle = document.getElementById('rhythm-controls-circle');

    const modeList = [
      { id: 'keys', btn: btnKeys, ctrl: cKeys },
      { id: 'taiko', btn: btnTaiko, ctrl: cTaiko },
      { id: 'catch', btn: btnCatch, ctrl: cCatch },
      { id: 'circle', btn: btnCircle, ctrl: cCircle }
    ];

    modeList.forEach(item => {
      if (item.btn) {
        if (item.id === mode) {
          item.btn.className = 'px-2.5 py-1 text-xs font-black rounded-lg transition-all bg-white text-rose-600 shadow-xs cursor-pointer';
        } else {
          item.btn.className = 'px-2.5 py-1 text-xs font-bold rounded-lg transition-all text-stone-600 hover:text-rose-500 cursor-pointer';
        }
      }
      if (item.ctrl) {
        item.ctrl.classList.toggle('hidden', item.id !== mode);
      }
    });

    notes = [];
    circles = [];
    basketX = canvas ? canvas.width / 2 : 190;
    basketTargetX = basketX;
    if (window.UsagiSound) UsagiSound.pop();
  }

  function setDifficulty(diff) {
    difficulty = diff;
    ['easy', 'normal', 'master'].forEach(d => {
      const btn = document.getElementById(`rhythm-diff-btn-${d}`);
      if (!btn) return;
      if (d === diff) {
        btn.className = `px-2.5 py-1 text-xs font-black rounded-lg transition-all bg-white shadow-xs cursor-pointer ${d === 'master' ? 'text-red-600' : 'text-pink-600'}`;
      } else {
        btn.className = 'px-2.5 py-1 text-xs font-bold rounded-lg transition-all text-stone-600 hover:text-pink-600 cursor-pointer';
      }
    });
    if (window.UsagiSound) UsagiSound.pop();
  }

  function togglePlay() {
    if (isPlaying) {
      pauseGame();
    } else if (isPaused) {
      resumeGame();
    } else {
      startGame();
    }
  }

  function startGame() {
    isPlaying = true;
    isPaused = false;
    score = 0;
    combo = 0;
    maxCombo = 0;
    consecutivePerfects = 0;
    perfectCount = 0;
    greatCount = 0;
    missCount = 0;
    isFever = false;
    feverTimer = 0;
    notes = [];
    particles = [];
    floatingTexts = [];
    updateUI();

    const overlay = document.getElementById('rhythm-pause-overlay');
    if (overlay) overlay.classList.add('hidden');

    const btn = document.getElementById('btn-rhythm-play');
    if (btn) btn.innerText = '⏸️ 暂停演奏';

    // Start background music
    if (bgmAudio && currentSong && currentSong.audio) {
      if (!bgmAudio.src.includes(currentSong.audio)) {
        bgmAudio.src = currentSong.audio;
      }
      bgmAudio.currentTime = 0;
      if (!isAudioMuted) {
        bgmAudio.play().catch(e => console.log('Audio autoplay prevented:', e));
      }
    }

    const cover = document.getElementById('rhythm-song-cover');
    if (cover) cover.classList.add('song-cover-spin');

    if (window.UsagiSound) UsagiSound.fanfare();
    loop();
  }

  function resumeGame() {
    isPlaying = true;
    isPaused = false;
    const btn = document.getElementById('btn-rhythm-play');
    if (btn) btn.innerText = '⏸️ 暂停演奏';
    const overlay = document.getElementById('rhythm-pause-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (bgmAudio && !isAudioMuted) {
      bgmAudio.play().catch(e => console.log('Resume audio play prevented:', e));
    }
    const cover = document.getElementById('rhythm-song-cover');
    if (cover) cover.classList.add('song-cover-spin');

    if (window.UsagiSound) UsagiSound.pop();
    loop();
  }

  function pauseGame() {
    isPlaying = false;
    isPaused = true;
    if (animId) cancelAnimationFrame(animId);
    const btn = document.getElementById('btn-rhythm-play');
    if (btn) btn.innerText = '▶️ 继续演奏';

    const overlay = document.getElementById('rhythm-pause-overlay');
    if (overlay) overlay.classList.remove('hidden');

    if (bgmAudio) bgmAudio.pause();
    const cover = document.getElementById('rhythm-song-cover');
    if (cover) cover.classList.remove('song-cover-spin');
    if (window.UsagiSound) UsagiSound.pop();
  }

  function onSongEnded() {
    isPlaying = false;
    isPaused = false;
    if (animId) cancelAnimationFrame(animId);
    const btn = document.getElementById('btn-rhythm-play');
    if (btn) btn.innerText = '▶️ 开始演奏';
    const overlay = document.getElementById('rhythm-pause-overlay');
    if (overlay) overlay.classList.add('hidden');
    const cover = document.getElementById('rhythm-song-cover');
    if (cover) cover.classList.remove('song-cover-spin');
    openSettle();
  }

  function toggleAudioMute() {
    isAudioMuted = !isAudioMuted;
    const btn = document.getElementById('btn-rhythm-sound-toggle');
    if (bgmAudio) {
      bgmAudio.muted = isAudioMuted;
    }
    if (btn) {
      btn.innerText = isAudioMuted ? '🔇' : '🔊';
    }
    if (window.UsagiSound) UsagiSound.pop();
  }

  // ------------------------------------------------------------
  // Hit Detection & 5-Perfect Streak FEVER Logic
  // ------------------------------------------------------------
  function hitLane(laneIdx) {
    if (!isPlaying) return;
    laneFlashes[laneIdx] = 12;

    const laneData = LANES[laneIdx];
    if (window.UsagiSound && UsagiSound.pianoTone) {
      UsagiSound.pianoTone(laneData.freq);
    }

    const hitLineY = canvas.height - 75;
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

    const laneW = canvas.width / 4;
    const hitX = laneIdx * laneW + laneW / 2;

    if (closest && minDist < 68) {
      closest.hit = true;
      if (minDist < 28) {
        // PERFECT!
        perfectCount++;
        consecutivePerfects++;
        combo++;
        if (combo > maxCombo) maxCombo = combo;

        const earned = isFever ? 200 : 100;
        score += Math.round(earned * (1 + combo * 0.05));

        showFloatingText(isFever ? '🔥 PERFECT! x2' : 'PERFECT!', hitX, hitLineY - 10, '#ec4899', true);
        spawnExplosiveSparks(hitX, hitLineY, laneData.color, 18);
        screenShake = isFever ? 9 : 5;

        if (window.UsagiSound && UsagiSound.perfectHit) {
          UsagiSound.perfectHit();
        }

        // 5-PERFECT STREAK FEVER CHECK!
        if (consecutivePerfects >= 5) {
          triggerFeverBurst();
        }
      } else {
        // GREAT!
        greatCount++;
        consecutivePerfects = 0; // resets perfect streak, preserves combo
        combo++;
        if (combo > maxCombo) maxCombo = combo;

        const earned = isFever ? 120 : 60;
        score += Math.round(earned * (1 + combo * 0.03));

        showFloatingText(isFever ? 'GREAT! x2' : 'GREAT!', hitX, hitLineY - 10, '#f59e0b', false);
        spawnExplosiveSparks(hitX, hitLineY, '#f59e0b', 10);
      }
    } else {
      // MISS
      handleMiss(hitX, hitLineY);
    }
    updateUI();
  }

  function hitTaiko(type) {
    if (!isPlaying) return;
    drumPulse = 12;

    if (type === 'don') {
      if (window.UsagiSound && UsagiSound.taikoDon) UsagiSound.taikoDon();
    } else if (type === 'ka') {
      if (window.UsagiSound && UsagiSound.taikoKa) UsagiSound.taikoKa();
    } else {
      // Roll
      if (window.UsagiSound && UsagiSound.pop) UsagiSound.pop();
    }

    const hitTargetX = 85;
    const hitTargetY = 160;

    let closest = null;
    let minDist = 999;

    for (const n of notes) {
      if (!n.hit) {
        const dist = Math.abs(n.x - hitTargetX);
        if (dist < minDist) {
          minDist = dist;
          closest = n;
        }
      }
    }

    if (type === 'roll') {
      score += isFever ? 40 : 20;
      spawnExplosiveSparks(hitTargetX, hitTargetY, '#fbbf24', 4);
      updateUI();
      return;
    }

    if (closest && minDist < 68) {
      // Check type match
      const isMatch = (closest.type === type) || (closest.type === 'big' && type === 'don');
      if (isMatch) {
        closest.hit = true;
        if (minDist < 28) {
          perfectCount++;
          consecutivePerfects++;
          combo++;
          if (combo > maxCombo) maxCombo = combo;

          const base = closest.type === 'big' ? 160 : 100;
          const earned = isFever ? base * 2 : base;
          score += Math.round(earned * (1 + combo * 0.05));

          showFloatingText(isFever ? '🔥 咚!! x2' : 'PERFECT 咚!', hitTargetX, hitTargetY - 35, '#ef4444', true);
          spawnExplosiveSparks(hitTargetX, hitTargetY, closest.type === 'ka' ? '#3b82f6' : '#ef4444', 22);
          screenShake = isFever ? 10 : 6;

          if (consecutivePerfects >= 5) {
            triggerFeverBurst();
          }
        } else {
          greatCount++;
          consecutivePerfects = 0;
          combo++;
          if (combo > maxCombo) maxCombo = combo;

          const earned = isFever ? 100 : 50;
          score += Math.round(earned * (1 + combo * 0.03));
          showFloatingText('GREAT!', hitTargetX, hitTargetY - 35, '#f59e0b', false);
          spawnExplosiveSparks(hitTargetX, hitTargetY, '#f59e0b', 12);
        }
      } else {
        handleMiss(hitTargetX, hitTargetY);
      }
    } else {
      handleMiss(hitTargetX, hitTargetY);
    }
    updateUI();
  }

  function handleMiss(x, y) {
    missCount++;
    combo = 0;
    consecutivePerfects = 0;
    breakFever();
    showFloatingText('MISS', x, y, '#9ca3af', false);
  }

  // ------------------------------------------------------------
  // 5-PERFECT STREAK: FEVER EXPLOSION
  // ------------------------------------------------------------
  function triggerFeverBurst() {
    isFever = true;
    feverTimer = 360; // ~6 seconds or until extended

    if (window.UsagiSound && UsagiSound.feverIgnite) {
      UsagiSound.feverIgnite();
    }
    if (window.UsagiSound && UsagiSound.yaha) {
      setTimeout(() => UsagiSound.yaha(), 120);
    }

    // Visual flame border activation
    const canvasBox = document.getElementById('rhythm-canvas-box');
    if (canvasBox) canvasBox.classList.add('rhythm-fever-active');

    const badge = document.getElementById('rhythm-fever-badge');
    if (badge) badge.classList.remove('hidden');

    const overlay = document.getElementById('rhythm-fever-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => { if (overlay) overlay.classList.add('hidden'); }, 2200);
    }

    // Explosion fireworks on canvas
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      const colors = ['#f59e0b', '#ef4444', '#ec4899', '#fbbf24', '#ffedd5'];
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        isStar: Math.random() > 0.4
      });
    }

    // Mascot celebration cheer
    if (window.UsagiVoice && typeof UsagiVoice.speak === 'function') {
      UsagiVoice.speak('哇！芷萱五连Perfect！燃起来啦！🔥🔥🔥');
    }
  }

  function breakFever() {
    isFever = false;
    feverTimer = 0;
    const canvasBox = document.getElementById('rhythm-canvas-box');
    if (canvasBox) canvasBox.classList.remove('rhythm-fever-active');

    const badge = document.getElementById('rhythm-fever-badge');
    if (badge) badge.classList.add('hidden');

    const overlay = document.getElementById('rhythm-fever-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function spawnExplosiveSparks(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.025,
        isStar: Math.random() > 0.5
      });
    }
    // Expanding shockwave ring
    particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 4,
      maxRadius: 40 + Math.random() * 15,
      color,
      alpha: 0.9,
      isRing: true
    });
  }

  function showFloatingText(text, x, y, color, isBig = false) {
    floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: isBig ? 1.4 : 1.0,
      isBig
    });
  }

  // ------------------------------------------------------------
  // Main Game Loop & Physics
  // ------------------------------------------------------------
  function loop() {
    if (!isPlaying) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    spawnTimer++;

    // Spawn parameters based on difficulty & mode
    let spawnCadence = 32;
    let baseSpeed = 5.2;

    if (difficulty === 'easy') {
      spawnCadence = 46;
      baseSpeed = 3.8;
    } else if (difficulty === 'master') {
      spawnCadence = 18;
      baseSpeed = 6.8;
    }

    if (isFever) {
      feverTimer--;
      if (feverTimer <= 0) breakFever();
    }

    if (screenShake > 0) screenShake *= 0.88;

    for (let i = 0; i < 4; i++) {
      if (laneFlashes[i] > 0) laneFlashes[i]--;
    }
    if (drumPulse > 0) drumPulse--;

    const speedScale = speedMultiplier / 2;
    const effectiveSpeed = baseSpeed * speedScale;

    // Spawn notes based on mode
    if (gameMode === 'keys') {
      if (spawnTimer % spawnCadence === 0) {
        const lane = Math.floor(Math.random() * 4);
        notes.push({ lane, y: -25, speed: effectiveSpeed + Math.random() * 0.8 * speedScale, hit: false });

        // Double notes in Master mode or during Fever
        if ((difficulty === 'master' || isFever) && Math.random() < 0.35) {
          const lane2 = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
          notes.push({ lane: lane2, y: -25, speed: effectiveSpeed + Math.random() * 0.8 * speedScale, hit: false });
        }
      }

      for (const n of notes) {
        n.y += n.speed;
      }

      const hitLineY = canvas.height - 75;
      for (const n of notes) {
        if (!n.hit && n.y > hitLineY + 55) {
          n.hit = true;
          handleMiss(n.lane * (canvas.width / 4) + canvas.width / 8, hitLineY);
          updateUI();
        }
      }
      notes = notes.filter(n => n.y < canvas.height + 50 && (!n.hit || n.y < hitLineY + 25));

    } else if (gameMode === 'taiko') {
      // Taiko mode: horizontal flow
      if (spawnTimer % spawnCadence === 0) {
        const rand = Math.random();
        let type = 'don';
        if (rand < 0.45) type = 'don';
        else if (rand < 0.8) type = 'ka';
        else type = 'big';

        notes.push({
          type,
          x: canvas.width + 30,
          y: 160,
          speed: effectiveSpeed * 1.15,
          hit: false
        });
      }

      for (const n of notes) {
        n.x -= n.speed;
      }

      const hitTargetX = 85;
      for (const n of notes) {
        if (!n.hit && n.x < hitTargetX - 55) {
          n.hit = true;
          handleMiss(hitTargetX, 160);
          updateUI();
        }
      }
      notes = notes.filter(n => n.x > -40 && (!n.hit || n.x > hitTargetX - 25));

    } else if (gameMode === 'catch') {
      updateCatchMode(effectiveSpeed, spawnCadence);
    } else if (gameMode === 'circle') {
      updateCircleMode(speedScale, spawnCadence);
    }

    // Update Particles
    for (const p of particles) {
      if (p.isRing) {
        p.radius += 2.8;
        p.alpha -= 0.045;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha -= p.decay;
      }
    }
    particles = particles.filter(p => p.alpha > 0);

    // Update Floating Judgments
    for (const ft of floatingTexts) {
      ft.y -= 1.4;
      ft.alpha -= 0.03;
      if (ft.scale > 1.0) ft.scale -= 0.015;
    }
    floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
  }

  // ------------------------------------------------------------
  // Canvas Rendering (Explosive Neon + Fever Flame Aesthetics)
  // ------------------------------------------------------------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShake > 0.4) {
      const rx = (Math.random() - 0.5) * screenShake * 2;
      const ry = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(rx, ry);
    }

    // Stage Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isFever) {
      bgGrad.addColorStop(0, '#2d0615');
      bgGrad.addColorStop(0.5, '#180a1c');
      bgGrad.addColorStop(1, '#3b1206');
    } else {
      bgGrad.addColorStop(0, '#111827');
      bgGrad.addColorStop(1, '#1e1b2e');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameMode === 'keys') {
      drawKeysMode();
    } else if (gameMode === 'taiko') {
      drawTaikoMode();
    } else if (gameMode === 'catch') {
      drawCatchMode();
    } else if (gameMode === 'circle') {
      drawCircleMode();
    }

    // Render Explosive Particles & Shockwaves
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.isStar) {
        ctx.fillStyle = p.color;
        drawStar(ctx, p.x, p.y, 5, p.size * 1.5, p.size * 0.7);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Floating Text Judgments
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow glow
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    // Fever Flames at bottom if active
    if (isFever) {
      drawFeverFlames();
    }

    ctx.restore();
  }

  function drawKeysMode() {
    const laneW = canvas.width / 4;
    const hitLineY = canvas.height - 75;

    // Lanes
    for (let i = 0; i < 4; i++) {
      const x = i * laneW;

      // Lane flash when hit
      if (laneFlashes[i] > 0) {
        const flashGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        flashGrad.addColorStop(1, LANES[i].color + '55');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(x, 0, laneW, canvas.height);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 0, laneW, canvas.height);
    }

    // Glowing Hit Line
    const lineGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    lineGrad.addColorStop(0, '#f43f5e');
    lineGrad.addColorStop(0.5, isFever ? '#f59e0b' : '#ec4899');
    lineGrad.addColorStop(1, '#10b981');

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = isFever ? 6 : 4;
    ctx.shadowColor = isFever ? '#f59e0b' : '#ec4899';
    ctx.shadowBlur = isFever ? 20 : 10;

    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(canvas.width, hitLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Target receptors at bottom
    for (let i = 0; i < 4; i++) {
      const cx = i * laneW + laneW / 2;
      ctx.strokeStyle = LANES[i].color + (laneFlashes[i] > 0 ? 'ff' : '88');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, hitLineY, 26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LANES[i].key.toUpperCase(), cx, hitLineY);
    }

    // Falling Notes
    for (const n of notes) {
      if (n.hit) continue;
      const x = n.lane * laneW + laneW / 2;

      // Note trail
      const trailGrad = ctx.createLinearGradient(0, n.y - 30, 0, n.y);
      trailGrad.addColorStop(0, 'rgba(0,0,0,0)');
      trailGrad.addColorStop(1, LANES[n.lane].color + '66');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(x - 14, n.y - 30, 28, 30);

      // Note body
      ctx.save();
      ctx.shadowColor = LANES[n.lane].color;
      ctx.shadowBlur = isFever ? 18 : 8;

      ctx.fillStyle = LANES[n.lane].color;
      ctx.beginPath();
      ctx.arc(x, n.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, n.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LANES[n.lane].icon, x, n.y);
      ctx.restore();
    }
  }

  function drawTaikoMode() {
    const hitTargetX = 85;
    const trackY = 160;

    // Horizontal Track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, trackY - 45, canvas.width, 90);

    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, trackY - 45, canvas.width, 90);

    // Target Drum Circle on Left
    const drumScale = 1 + (drumPulse > 0 ? 0.15 : 0);
    ctx.save();
    ctx.translate(hitTargetX, trackY);
    ctx.scale(drumScale, drumScale);

    // Drum Rim
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Drum Center
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Drum Inner Beat Target
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('判定', 0, 0);
    ctx.restore();

    // Usagi drummer dancing above the track!
    const usagiY = trackY - 80;
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐰', hitTargetX, usagiY + Math.sin(Date.now() / 150) * 5);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText('芷萱冲冲冲!', hitTargetX, usagiY - 22);

    // Taiko Notes
    for (const n of notes) {
      if (n.hit) continue;

      ctx.save();
      if (n.type === 'don') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(n.x, trackY, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('咚', n.x, trackY);
      } else if (n.type === 'ka') {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(n.x, trackY, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('咔', n.x, trackY);
      } else {
        // Big Don
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(n.x, trackY, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('大咚', n.x, trackY);
      }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------
  // Mode 3: 🐰 乌萨奇乐动接音符 (Catch Beat)
  // ------------------------------------------------------------
  function updateCatchMode(effectiveSpeed, spawnCadence) {
    basketX += (basketTargetX - basketX) * 0.35;
    if (basketX < 45) basketX = 45;
    if (basketX > canvas.width - 45) basketX = canvas.width - 45;

    if (spawnTimer % spawnCadence === 0) {
      const col = Math.floor(Math.random() * 5);
      const colX = 45 + col * ((canvas.width - 90) / 4);
      const icons = ['🥕', '⭐', '🍓', '💖', '🎵', '🍰'];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      notes.push({
        x: colX,
        y: -25,
        speed: effectiveSpeed * 0.95,
        icon,
        hit: false
      });
    }

    const hitLineY = canvas.height - 65;
    for (const n of notes) {
      n.y += n.speed;
      if (!n.hit && Math.abs(n.y - hitLineY) < 28) {
        if (Math.abs(n.x - basketX) < 42) {
          n.hit = true;
          perfectCount++;
          consecutivePerfects++;
          combo++;
          if (combo > maxCombo) maxCombo = combo;
          const earned = isFever ? 200 : 100;
          score += Math.round(earned * (1 + combo * 0.05));
          showFloatingText(isFever ? '🔥 CAUGHT! x2' : 'CAUGHT! ✨', n.x, hitLineY - 15, '#10b981', true);
          spawnExplosiveSparks(n.x, hitLineY, '#10b981', 16);
          screenShake = isFever ? 8 : 4;
          if (window.UsagiSound && UsagiSound.perfectHit) UsagiSound.perfectHit();
          if (consecutivePerfects >= 5) triggerFeverBurst();
          updateUI();
        }
      } else if (!n.hit && n.y > canvas.height - 15) {
        n.hit = true;
        handleMiss(n.x, hitLineY);
        updateUI();
      }
    }
    notes = notes.filter(n => n.y < canvas.height + 40 && !n.hit);
  }

  function drawCatchMode() {
    const hitLineY = canvas.height - 65;

    for (let c = 0; c < 5; c++) {
      const colX = 45 + c * ((canvas.width - 90) / 4);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, canvas.height);
      ctx.stroke();
    }

    ctx.strokeStyle = isFever ? 'rgba(245, 158, 11, 0.6)' : 'rgba(244, 63, 94, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, hitLineY);
    ctx.lineTo(canvas.width - 20, hitLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const n of notes) {
      if (n.hit) continue;
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = isFever ? 18 : 8;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.icon, n.x, n.y);
      ctx.restore();
    }

    // Usagi Holding Golden Carrot Bowl at basketX
    ctx.save();
    ctx.translate(basketX, hitLineY + 22);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -18, 32, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-28, -20, 56, 5);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 8, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-10, -8, 5, 12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, -8, 5, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-6, 6, 2, 0, Math.PI * 2);
    ctx.arc(6, 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-10, 10, 3, 0, Math.PI * 2);
    ctx.arc(10, 10, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ------------------------------------------------------------
  // Mode 4: 🎯 乌萨奇律动光环 (Circle Beat)
  // ------------------------------------------------------------
  function updateCircleMode(speedScale, spawnCadence) {
    if (spawnTimer % (spawnCadence + 14) === 0) {
      const cx = 60 + Math.random() * (canvas.width - 120);
      const cy = 60 + Math.random() * (canvas.height - 140);
      const colors = ['#f43f5e', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      circles.push({
        x: cx,
        y: cy,
        radius: 26,
        approach: 88,
        shrinkRate: 1.35 * speedScale,
        color,
        hit: false,
        num: (combo % 9) + 1
      });
    }

    for (const c of circles) {
      c.approach -= c.shrinkRate;
      if (!c.hit && c.approach < 16) {
        c.hit = true;
        handleMiss(c.x, c.y);
        updateUI();
      }
    }
    circles = circles.filter(c => !c.hit && c.approach >= 16);
  }

  function hitCircle(clickX, clickY) {
    if (!isPlaying) return;
    if (circles.length === 0) return;

    let closest = null;
    let minDist = 999;
    for (const c of circles) {
      if (c.hit) continue;
      const d = Math.hypot(c.x - clickX, c.y - clickY);
      if (d < 55 && d < minDist) {
        minDist = d;
        closest = c;
      }
    }

    if (!closest) {
      closest = circles[0];
    }

    if (closest) {
      closest.hit = true;
      const diff = Math.abs(closest.approach - closest.radius);
      if (diff < 16) {
        perfectCount++;
        consecutivePerfects++;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        const earned = isFever ? 200 : 100;
        score += Math.round(earned * (1 + combo * 0.05));
        showFloatingText(isFever ? '🔥 PERFECT! x2' : 'PERFECT!', closest.x, closest.y, '#ec4899', true);
        spawnExplosiveSparks(closest.x, closest.y, closest.color, 18);
        screenShake = isFever ? 8 : 4;
        if (window.UsagiSound && UsagiSound.perfectHit) UsagiSound.perfectHit();
        if (consecutivePerfects >= 5) triggerFeverBurst();
      } else if (diff < 34) {
        greatCount++;
        consecutivePerfects = 0;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        const earned = isFever ? 120 : 60;
        score += Math.round(earned * (1 + combo * 0.03));
        showFloatingText('GREAT!', closest.x, closest.y, '#f59e0b', false);
        spawnExplosiveSparks(closest.x, closest.y, '#f59e0b', 10);
      } else {
        handleMiss(closest.x, closest.y);
      }
      updateUI();
    }
  }

  function drawCircleMode() {
    for (const c of circles) {
      if (c.hit) continue;
      ctx.save();
      ctx.shadowColor = c.color;
      ctx.shadowBlur = isFever ? 20 : 10;

      ctx.fillStyle = c.color + '44';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.num, c.x, c.y);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(c.radius, c.approach), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  function drawFeverFlames() {
    const time = Date.now() / 80;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const fx = (canvas.width / 18) * i + Math.sin(time + i) * 6;
      const fy = canvas.height - 5 - Math.cos(time + i * 2) * 22;
      const fRadius = 14 + Math.sin(time + i) * 8;

      const flameGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, fRadius);
      flameGrad.addColorStop(0, 'rgba(255, 230, 100, 0.7)');
      flameGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, fRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  // ------------------------------------------------------------
  // UI & Song Picker Modal Logic
  // ------------------------------------------------------------
  function updateUI() {
    const sEl = document.getElementById('rhythm-score');
    const cEl = document.getElementById('rhythm-combo');
    const pEl = document.getElementById('rhythm-perfect-streak');
    const hEl = document.getElementById('rhythm-high');

    if (sEl) sEl.innerText = score;
    if (cEl) cEl.innerText = combo;
    if (pEl) pEl.innerText = consecutivePerfects;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('usagi_rhythm_high', highScore);
    }
    if (hEl) hEl.innerText = highScore;
  }

  function updateSongCard() {
    const titleEl = document.getElementById('rhythm-song-title');
    const artistEl = document.getElementById('rhythm-song-artist');
    const coverEl = document.getElementById('rhythm-song-cover');

    if (titleEl && currentSong) titleEl.innerText = currentSong.title;
    if (artistEl && currentSong) artistEl.innerText = currentSong.artist;
    if (coverEl && currentSong) coverEl.src = currentSong.cover || 'usagi.png';
  }

  function openSongPicker() {
    const modal = document.getElementById('modal-rhythm-song-picker');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderSongList();
    if (window.UsagiSound) UsagiSound.pop();
  }

  function closeSongPicker() {
    const modal = document.getElementById('modal-rhythm-song-picker');
    if (modal) modal.classList.add('hidden');
  }

  function setSongCategory(cat) {
    currentCategory = cat;
    ['all', 'gf', 'zrz', 'jay', 'cortis'].forEach(c => {
      const btn = document.getElementById(`rhythm-cat-${c}`);
      if (!btn) return;
      if (c === cat) {
        btn.className = 'px-2.5 py-1 rounded-lg font-black bg-pink-500 text-white whitespace-nowrap cursor-pointer shadow-xs';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg font-bold bg-pink-50 hover:bg-pink-100 text-stone-700 whitespace-nowrap cursor-pointer';
      }
    });
    renderSongList();
    if (window.UsagiSound) UsagiSound.pop();
  }

  function filterSongList() {
    renderSongList();
  }

  function renderSongList() {
    const container = document.getElementById('rhythm-song-list-container');
    const searchInput = document.getElementById('rhythm-picker-search');
    if (!container) return;

    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const all = getAllSongs();

    const filtered = all.filter(s => {
      if (currentCategory !== 'all' && s.category !== currentCategory) return false;
      if (!query) return true;
      const haystack = (s.title + ' ' + s.artist + ' ' + (s.keys || []).join(' ')).toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-stone-400 text-xs font-bold">
          没有找到匹配的歌曲呢~ 试试搜索“城外”或“When”🐰
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(song => {
      const isSelected = currentSong && currentSong.id === song.id;
      return `
        <div class="flex items-center justify-between p-2.5 rounded-2xl border transition-all ${isSelected ? 'bg-pink-100/80 border-pink-400 shadow-xs' : 'bg-white hover:bg-pink-50/60 border-stone-200'}">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="${song.cover || 'usagi.png'}" class="w-11 h-11 rounded-xl object-cover border border-pink-200 shadow-2xs flex-shrink-0" onerror="this.src='usagi.png'">
            <div class="truncate">
              <div class="font-black text-stone-800 text-xs sm:text-sm truncate flex items-center gap-1.5">
                <span>${song.title}</span>
                ${isSelected ? '<span class="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black">当前</span>' : ''}
              </div>
              <div class="text-[11px] text-stone-500 truncate">${song.artist}</div>
            </div>
          </div>
          <button type="button" onclick="RhythmGame.selectSong('${song.id}')" class="px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex-shrink-0 ml-2 ${isSelected ? 'bg-rose-500 text-white shadow-xs' : 'bg-stone-100 hover:bg-pink-500 hover:text-white text-stone-700'}">
            ${isSelected ? '正在弹奏 🎶' : '立即选用 ▶️'}
          </button>
        </div>
      `;
    }).join('');
  }

  function selectSong(songId) {
    const all = getAllSongs();
    const song = all.find(s => s.id === songId);
    if (!song) return;

    currentSong = song;
    updateSongCard();
    closeSongPicker();

    if (isPlaying) {
      startGame();
    } else {
      if (bgmAudio && song.audio) {
        bgmAudio.src = song.audio;
      }
    }

    if (window.UsagiSound) UsagiSound.pop();
  }

  // ------------------------------------------------------------
  // Evaluation & Settlement Modal
  // ------------------------------------------------------------
  function openSettle() {
    const modal = document.getElementById('modal-rhythm-settle');
    if (!modal) return;

    const totalNotes = perfectCount + greatCount + missCount;
    const accuracy = totalNotes > 0 ? ((perfectCount * 100 + greatCount * 60) / (totalNotes * 100)) * 100 : 0;

    let rank = 'SSS';
    let title = '神级节奏仙女！💖✨';
    let quote = '“芷萱的手速和节奏感太惊艳啦！乌萨奇为你疯狂打 call~ 💖🐰”';

    if (accuracy >= 98 && missCount === 0) {
      rank = 'SSS';
      title = '全连绝世！神级仙女 👑';
      quote = '“天呐！芷萱这首居然全连通关！简直是音游大魔王！太厉害啦！🥰🎉”';
    } else if (accuracy >= 90) {
      rank = 'SS';
      title = '节奏爆表 · 怦然心动 🌸';
      quote = '“旋律在芷萱指尖跳舞呢！今天也是元气满满的节奏仙女~ 💖”';
    } else if (accuracy >= 80) {
      rank = 'S';
      title = '超赞乐手 · 渐入佳境 🎶';
      quote = '“好棒的演奏！芷萱和乌萨奇的配合越来越默契啦！🐰”';
    } else {
      rank = 'A';
      title = '继续加油 · 甜美伴奏 🌟';
      quote = '“多听几次这首歌，芷萱肯定能拿 SSS 满分！乌萨奇一直陪着你~ 💖”';
    }

    const rankEl = document.getElementById('rhythm-settle-rank');
    const titleEl = document.getElementById('rhythm-settle-title');
    const scoreEl = document.getElementById('rhythm-settle-score');
    const comboEl = document.getElementById('rhythm-settle-combo');
    const quoteEl = document.getElementById('rhythm-settle-quote');

    if (rankEl) rankEl.innerText = rank;
    if (titleEl) titleEl.innerText = title;
    if (scoreEl) scoreEl.innerText = score;
    if (comboEl) comboEl.innerText = maxCombo;
    if (quoteEl) quoteEl.innerText = quote;

    modal.classList.remove('hidden');

    if (window.confettiRain) confettiRain();
    if (window.UsagiSound) UsagiSound.fanfare();
  }

  function closeSettle() {
    const modal = document.getElementById('modal-rhythm-settle');
    if (modal) modal.classList.add('hidden');
  }

  return {
    init,
    togglePlay,
    pause: pauseGame,
    resume: resumeGame,
    switchMode,
    setMode: switchMode,
    setDifficulty,
    setSpeed,
    stepSpeed,
    openCustomSpeedModal,
    closeCustomSpeedModal,
    onSliderInput,
    onNumberInput,
    pickModalPreset,
    applyCustomSpeedFromModal,
    moveBasket,
    hitLane,
    hitTaiko,
    hitCircle,
    openSongPicker,
    closeSongPicker,
    setSongCategory,
    filterSongList,
    selectSong,
    toggleAudioMute,
    openSettle,
    closeSettle,
    triggerFeverBurst
  };
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
  } catch (e) { }
});
