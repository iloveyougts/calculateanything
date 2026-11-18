/* ============================================================
   USAGI WANDERING DESKTOP PET & KAWAII MINI-GAMES ARCADE ENGINE
   Dedicated to 颜芷萱 (GAN TZI SHUAN)
   ============================================================ */

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
        speak('✨ 专属陪伴', '芷萱今天也要开开心心，元气满满！呀哈！💖');
      }, 1200);
    }
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
    container.style.bottom = isMobile ? 'calc(96px + env(safe-area-inset-bottom, 16px))' : '24px';

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

  function speak(tag, message) {
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
        'state-watchlist', 'state-music',
        'state-game_cheer', 'state-happy', 'state-yaha', 'state-ura', 'state-mood',
        'state-expense', 'state-countdown',
        'state-love_hug', 'state-calm'
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
        'usagi-bookkeeping', 'usagi-counting', 'usagi-calm'
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
        'state-watchlist', 'state-music',
        'state-game_cheer', 'state-happy', 'state-yaha', 'state-ura', 'state-mood',
        'state-expense', 'state-countdown',
        'state-love_hug', 'state-calm'
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
        'usagi-bookkeeping', 'usagi-counting', 'usagi-calm'
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
    } else if (['dashboard', 'overview'].includes(event)) {
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
      speak(cfg.tag, q);
      return;
    }

    const item = IDLE_REMINDERS[Math.floor(Math.random() * IDLE_REMINDERS.length)];
    speak(item.tag, item.text);
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
   7. MINI-GAMES SUBTAB SWITCHER (游乐园子页面切换)
   ============================================================ */
function switchGameSubtab(subtab) {
  const tabs = ['fruit', 'memory', 'fish', 'gacha', 'whack'];

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
  if (subtab === 'memory') MemoryGame.init();
  if (subtab === 'fish') WoodenFishGame.init();
  if (subtab === 'gacha') GachaGame.init();
  if (subtab === 'whack') WhackGame.init();

  if (window.UsagiSound) UsagiSound.pop();
}
window.switchGameSubtab = switchGameSubtab;


/* ============================================================
   8. AUTO INITIALIZER ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  UsagiPetManager.init();
  FruitGame.init();
  MemoryGame.init();
  WoodenFishGame.init();
  GachaGame.init();
  WhackGame.init();

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
