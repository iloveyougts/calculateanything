/* ============================================================
   USAGI ALL-IN-ONE LIFE DASHBOARD - CORE CONTROLLER
   Multi-User Isolated Storage, Calculations & Interactive Logic
   ============================================================ */

// Storage Keys
const USERS_KEY = 'usagi_users_v2';
const SESSION_KEY = 'usagi_active_user_v2';
const getUserDataKey = (username) => `usagi_userdata_${username.toLowerCase()}`;

// Helper: Get local YYYY-MM-DD date string strictly adhering to user's timezone
function getLocalDateStr(dateObj) {
  const d = dateObj ? new Date(dateObj) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Default Template Data for Fresh Users (Clean & Pristine: Zero Fake Data, Real Records Only)
function getDefaultUserData(username) {
  const isGts = (username || '').toLowerCase() === 'gts';
  const isGf = (username || '').toLowerCase().includes('tzi') || (username || '').toLowerCase().includes('shuan') || (username || '').toLowerCase() === 'gantzishuan';
  return {
    profile: {
      username: username || (isGts ? 'gts' : 'GANTZISHUAN'),
      nickname: isGts ? 'kim' : (isGf ? '颜芷萱 (Tzi Shuan) 🌸' : (username || 'kim')),
      motto: isGts ? '乌萨奇冲冲冲！Kim专属测试手账 🐰' : '呀哈！芷萱今天也要开开心心、元气满满！💖',
      avatar: 'usagi_character.png'
    },
    countdowns: [
      { id: 'c_together', title: '💑 我们在一起的日子 (2026-09-05)', targetDate: '2026-09-05', category: '纪念日', icon: '❤️' },
      { id: 'c_anniversary', title: '💖 恋爱一周年纪念日', targetDate: '2027-09-05', category: '纪念日', icon: '💑' },
      { id: 'c_birthday', title: '🎂 芷萱小仙女生日 (11月6日)', targetDate: '2027-11-06', category: '生日', icon: '🎂' }
    ],
    period: {
      cycleLength: 28,
      duration: 5,
      records: []
    },
    expenses: {
      budget: 3500,
      records: []
    },
    health: {
      waterTarget: 4, // 4 glasses = 2000ml (500ml/glass)
      waterPerCup: 500, // 500ml per drink
      waterLogs: {},
      sleepLogs: [],
      weightLogs: []
    },
    moods: [],
    habits: [
      { id: 'h_1', name: '晨起喝一杯温开水 💧', icon: '💧', history: {} },
      { id: 'h_2', name: '早晚护肤 & 润唇做精致仙女 ✨', icon: '✨', history: {} },
      { id: 'h_3', name: '睡前跟男朋友互道晚安 💖', icon: '💑', history: {} },
      { id: 'h_4', name: '每天喝足 2000ml 温水 (4大杯)', icon: '🥛', history: {} },
      { id: 'h_5', name: '看一集乌萨奇开心一下 🐰', icon: '🥕', history: {} }
    ],
    calendarEvents: [],
    notes: [],
    todos: [],
    watchlist: [],
    highlights: [],
    loveLogs: {}
  };
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateStr(d);
}

// Global App State
window.USAGI_APP = {
  currentUser: null,
  data: null,
  charts: {},
  currentExpenseYear: new Date().getFullYear(),
  currentExpenseMonth: new Date().getMonth() + 1, // 1-12 or 'all'
  currentCalendarYear: new Date().getFullYear(),
  currentCalendarMonth: new Date().getMonth() + 1, // 1-12
  selectedCalendarDate: new Date().toISOString().split('T')[0],

  // Cloud Database Integration (Supabase 免费云数据库)
  cloud: {
    client: null,
    url: localStorage.getItem('usagi_cloud_url') || 'https://rlbovlevaddvbuchsxwz.supabase.co',
    key: localStorage.getItem('usagi_cloud_key') || 'sb_publishable_v-jwAI5rZT3nq_kHRfHv5Q_8CdXbbjz',
    isConnected: false,
    cloudUsernameMap: {},

    init: function () {
      this.url = (localStorage.getItem('usagi_cloud_url') || 'https://rlbovlevaddvbuchsxwz.supabase.co').trim();
      this.key = (localStorage.getItem('usagi_cloud_key') || 'sb_publishable_v-jwAI5rZT3nq_kHRfHv5Q_8CdXbbjz').trim();
      if (this.url && this.url.startsWith('http') && this.key && window.supabase) {
        try {
          this.client = window.supabase.createClient(this.url, this.key);
          this.isConnected = true;
          this.updateUIStatus(true);
        } catch (e) {
          console.warn("Supabase init error:", e);
          this.isConnected = false;
          this.updateUIStatus(false);
        }
      } else {
        this.isConnected = false;
        this.updateUIStatus(false);
      }
    },

    saveConfig: function (url, key) {
      url = (url || '').trim();
      key = (key || '').trim();
      localStorage.setItem('usagi_cloud_url', url);
      localStorage.setItem('usagi_cloud_key', key);
      this.init();
      if (this.isConnected) {
        alert("云端数据库连接成功！数据将实时自动同步上云！✨");
      } else if (url && key) {
        alert("已保存配置，正在尝试连接... 🐰");
      } else {
        alert("已切换为纯本地存储模式！🌱");
      }
    },

    updateUIStatus: function (connected) {
      const dot = document.getElementById('cloud-status-dot');
      const text = document.getElementById('cloud-status-text');
      if (dot && text) {
        if (connected) {
          dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block';
          text.innerText = '云端同步中';
          text.className = 'hidden sm:inline text-xs font-bold text-emerald-700';
        } else {
          dot.className = 'w-2.5 h-2.5 rounded-full bg-stone-300 inline-block';
          text.innerText = '本地模式';
          text.className = 'hidden sm:inline text-xs font-bold text-stone-500';
        }
      }
    },

    syncDataToCloud: async function (username, data, password, nickname) {
      if (!this.isConnected || !this.client) return;
      try {
        const u = (username || '').trim();
        const targetUsername = this.cloudUsernameMap[u.toLowerCase()] || u;
        const { error } = await this.client.from('usagi_userdata').upsert({
          username: targetUsername,
          nickname: nickname || '',
          password: password || '',
          data: data,
          updated_at: new Date().toISOString()
        });
        if (error) console.warn("Cloud sync error:", error);
      } catch (e) {
        console.warn("Cloud sync exception:", e);
      }
    },

    pullDataFromCloud: async function (username) {
      if (!this.isConnected || !this.client) return null;
      try {
        const u = (username || '').trim();
        // Support case-insensitive query (matches both GANTZISHUAN and gantzishuan)
        const { data, error } = await this.client
          .from('usagi_userdata')
          .select('*')
          .ilike('username', u)
          .maybeSingle();
        if (error || !data) return null;
        if (data.username) {
          this.cloudUsernameMap[u.toLowerCase()] = data.username;
        }
        return data;
      } catch (e) {
        console.warn("Pull cloud data exception:", e);
        return null;
      }
    }
  },

  // User Auth System - 增强容错，确保永不锁死
  initAuth: async function () {
    try {
      this.cloud.init();
      const users = this.getUsers();
      // Ensure girlfriend's official account exists in local registry
      if (!users['GANTZISHUAN'] && !users['gantzishuan']) {
        users['GANTZISHUAN'] = {
          username: 'GANTZISHUAN',
          password: '520GANTZISHUAN',
          nickname: '颜芷萱 (Tzi Shuan) 🌸',
          createdAt: new Date().toISOString()
        };
        users['gantzishuan'] = users['GANTZISHUAN'];
      }
      // Ensure boyfriend's tester account exists in local registry
      if (!users['gts'] || users['gts'].nickname !== 'kim') {
        users['gts'] = {
          username: 'gts',
          password: '123',
          nickname: 'kim',
          createdAt: new Date().toISOString()
        };
      }
      this.saveUsers(users);

      const session = localStorage.getItem(SESSION_KEY);
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autologin') === '1' && (!session || !users[session])) {
        await this.guestLogin();
        return;
      }

      if (session && users && (users[session] || users[session.toLowerCase()])) {
        await this.loginUser(session);
      } else {
        this.showAuthModal(true);
      }
    } catch (e) {
      console.warn("Auth init error, fallback to login modal:", e);
      this.showAuthModal(true);
    }
  },

  getUsers: function () {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw || raw === 'undefined' || raw === 'null') return {};
      const parsed = JSON.parse(raw);
      return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch (e) {
      console.warn("Corrupt users in localStorage, reset:", e);
      return {};
    }
  },

  saveUsers: function (users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users || {}));
    } catch (e) {
      console.error("Save users error:", e);
    }
  },

  register: function (username, password, nickname) {
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!username || !password) {
      alert("请输入用户名和密码哦！🐰");
      return false;
    }
    try {
      const users = this.getUsers();
      if (users[username]) {
        alert("该账号已经存在啦，直接登录吧！✨");
        return false;
      }
      users[username] = {
        username: username,
        password: password,
        nickname: nickname && nickname.trim() ? nickname.trim() : username,
        createdAt: new Date().toISOString()
      };
      this.saveUsers(users);

      // Initialize user's isolated data
      const initialData = getDefaultUserData(username);
      initialData.profile.nickname = nickname && nickname.trim() ? nickname.trim() : username;
      localStorage.setItem(getUserDataKey(username), JSON.stringify(initialData));

      this.loginUser(username);
      UsagiSound.sparkle();
      confettiRain();
      return true;
    } catch (e) {
      console.error("Register error:", e);
      alert("注册发生错误，请重试！");
      return false;
    }
  },

  login: async function (username, password) {
    const rawUsername = (username || '').trim();
    username = rawUsername.toLowerCase();
    password = (password || '').trim();
    if (!username || !password) {
      alert("请输入用户名和密码哦！🐰");
      return false;
    }

    // Check Cloud DB first if connected (with 3.5s safe timeout so it never hangs)
    if (this.cloud && this.cloud.isConnected) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 3500));
        const cloudRecord = await Promise.race([this.cloud.pullDataFromCloud(rawUsername), timeoutPromise]);
        if (cloudRecord) {
          const cloudPass = (cloudRecord.password || '').trim();
          if (cloudPass && cloudPass !== password) {
            alert("密码不对哦，再仔细检查一下~ 🐰");
            return false;
          }
          // Sync cloud record to local users database
          const users = this.getUsers();
          users[username] = {
            username: username,
            cloudUsername: cloudRecord.username || rawUsername,
            password: password,
            nickname: cloudRecord.nickname || username,
            createdAt: cloudRecord.updated_at || new Date().toISOString()
          };
          if (cloudRecord.username && cloudRecord.username !== username) {
            users[cloudRecord.username] = users[username];
          }
          this.saveUsers(users);

          if (cloudRecord.data && typeof cloudRecord.data === 'object') {
            localStorage.setItem(getUserDataKey(username), JSON.stringify(cloudRecord.data));
            if (cloudRecord.username && cloudRecord.username !== username) {
              localStorage.setItem(getUserDataKey(cloudRecord.username), JSON.stringify(cloudRecord.data));
            }
          }
          await this.loginUser(username);
          UsagiSound.yaha();
          return true;
        }
      } catch (err) {
        console.warn("Cloud login check bypassed/timed out:", err);
      }
    }

    const users = this.getUsers();
    const userRecord = users[username] || users[rawUsername] || users[rawUsername.toLowerCase()] || users[rawUsername.toUpperCase()];
    if (!userRecord) {
      const autoReg = confirm(`未找到账号【${rawUsername}】。\n是否立即使用该密码自动注册并进入手账？✨`);
      if (autoReg) {
        return this.register(rawUsername, password, rawUsername);
      }
      return false;
    }
    const isDemoPass = (username === 'usagi' && (password === '123' || password === '123456'));
    if (userRecord.password !== password && !isDemoPass) {
      alert("密码不对哦，再仔细检查一下~ 🐰");
      return false;
    }
    await this.loginUser(userRecord.username || username);
    UsagiSound.yaha();
    return true;
  },

  guestLogin: async function () {
    // 芷萱免密一键进入 -> 直接秒登颜芷萱正式专属账号 GANTZISHUAN
    const gfUser = 'GANTZISHUAN';
    const gfPass = '520GANTZISHUAN';
    const users = this.getUsers();
    if (!users[gfUser] && !users[gfUser.toLowerCase()]) {
      users[gfUser] = {
        username: gfUser,
        password: gfPass,
        nickname: '颜芷萱 (Tzi Shuan) 🌸',
        createdAt: new Date().toISOString()
      };
      users[gfUser.toLowerCase()] = users[gfUser];
      this.saveUsers(users);
    }
    const ok = await this.login(gfUser, gfPass);
    if (!ok) {
      await this.loginUser(gfUser);
    }
    UsagiSound.yaha();
    confettiRain();
  },

  editProfile: function () {
    if (!this.data) return;
    const currentNick = this.data.profile.nickname || '颜芷萱 (Tzi Shuan) 🌸';
    const newNick = prompt("修改手账专属昵称：", currentNick);
    if (newNick && newNick.trim()) {
      const val = newNick.trim();
      this.data.profile.nickname = val;
      const users = this.getUsers();
      if (users[this.currentUser]) {
        users[this.currentUser].nickname = val;
        this.saveUsers(users);
      }
    }
    const currentMotto = this.data.profile.motto || '呀哈！芷萱今天也要开开心心、元气满满！💖';
    const newMotto = prompt("修改心愿寄语 / 乌萨奇签名：", currentMotto);
    if (newMotto && newMotto.trim()) {
      this.data.profile.motto = newMotto.trim();
    }
    this.saveData();
    this.renderAll();
    UsagiSound.pop();
  },

  loginUser: async function (username) {
    try {
      this.currentUser = username;
      localStorage.setItem(SESSION_KEY, username);

      const userKey = getUserDataKey(username);
      let userData = null;

      // 1. SUPABASE CLOUD-FIRST LOAD: Pull from Supabase cloud first so github update or cache clearing NEVER loses data!
      if (this.cloud && this.cloud.isConnected) {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 2800));
          const cloudRecord = await Promise.race([this.cloud.pullDataFromCloud(username), timeoutPromise]);
          if (cloudRecord && cloudRecord.data && typeof cloudRecord.data === 'object') {
            userData = cloudRecord.data;
            console.log("Successfully fetched latest user records from Supabase Cloud!");
          }
        } catch (e) {
          console.warn("Could not pull from cloud immediately, using local cache:", e);
        }
      }

      // 2. Fallback to localStorage if offline or cloud empty
      if (!userData) {
        try {
          const raw = localStorage.getItem(userKey);
          if (raw && raw !== 'undefined' && raw !== 'null') {
            userData = JSON.parse(raw);
          }
        } catch (err) {
          console.warn("Parse user data error:", err);
        }
      }

      if (!userData || typeof userData !== 'object') {
        userData = getDefaultUserData(username);
        localStorage.setItem(userKey, JSON.stringify(userData));
      }

      // Ensure together & anniversary & birthday countdowns exist and are deduplicated
      userData.countdowns = this.deduplicateCountdowns(userData.countdowns);

      // Ensure calendarEvents array exists (Clean: No mock events injected)
      if (!userData.calendarEvents || !Array.isArray(userData.calendarEvents)) {
        userData.calendarEvents = [];
      }

      // Filter out any mock countdowns, strictly keeping real ones
      userData.countdowns = userData.countdowns.filter(c => {
        if (c.id === 'c_trip' || (c.title && c.title.includes('海岛度假'))) return false;
        return true;
      });

      // Ensure water tracking is configured to 500ml per drink
      if (!userData.health) userData.health = {};
      userData.health.waterPerCup = 500;
      if (!userData.health.waterTarget || userData.health.waterTarget === 8) {
        userData.health.waterTarget = 4;
      }

      // Personalize default profile for initial setup ONLY if no custom nickname is set yet
      if (!userData.profile) userData.profile = {};
      const lowerU = (username || '').toLowerCase();
      // Isolate boyfriend tester (gts -> kim) and girlfriend official account (GANTZISHUAN -> 颜芷萱)
      if (lowerU === 'gts') {
        if (!userData.profile.nickname || userData.profile.nickname.includes('芷萱') || userData.profile.nickname === '乌萨奇饲养员') {
          userData.profile.nickname = 'kim';
        }
        if (!userData.profile.motto || userData.profile.motto.includes('芷萱今天也要') || userData.profile.motto.includes('乌萨奇饲养员')) {
          userData.profile.motto = '乌萨奇冲冲冲！Kim专属测试手账 🐰';
        }
      } else if (lowerU === 'gantzishuan' || lowerU.includes('tzi') || lowerU.includes('shuan')) {
        if (!userData.profile.nickname || userData.profile.nickname === '乌萨奇饲养员' || userData.profile.nickname === 'kim') {
          userData.profile.nickname = '颜芷萱 (Tzi Shuan) 🌸';
        }
        if (!userData.profile.motto || userData.profile.motto.includes('Kim专属测试手账') || userData.profile.motto.includes('乌萨奇饲养员')) {
          userData.profile.motto = '呀哈！芷萱今天也要开开心心、元气满满！💖';
        }
      } else {
        if (!userData.profile.nickname || userData.profile.nickname === '乌萨奇饲养员') {
          userData.profile.nickname = username;
        }
      }

      // SANITIZE: Deep clean any residual Japanese characters from old localStorage cache
      userData = this.sanitizeData(userData);
      this.data = userData;
      this.saveData();

      // Hide Auth Modal & Show App
      const authEl = document.getElementById('auth-modal');
      const appEl = document.getElementById('app-container');
      if (authEl) {
        authEl.classList.add('hidden');
        authEl.classList.remove('flex');
        authEl.style.display = 'none';
      }
      if (appEl) {
        appEl.classList.remove('hidden');
        appEl.classList.add('flex');
        appEl.style.display = 'flex';
      }

      this.renderAll();
      this.startCrossDeviceSync();

      const urlParams = new URLSearchParams(window.location.search);
      const targetTab = urlParams.get('tab');
      if (targetTab) {
        this.switchTab(targetTab);
      } else {
        setTimeout(() => {
          if (window.UsagiPetManager && typeof UsagiPetManager.reactTo === 'function') {
            UsagiPetManager.reactTo('dashboard');
          }
        }, 350);
      }
      const targetSong = urlParams.get('song');
      if (targetSong && typeof window.playSongById === 'function') {
        setTimeout(() => window.playSongById(targetSong), 300);
      }
    } catch (e) {
      console.error("LoginUser critical error:", e);
      const authEl = document.getElementById('auth-modal');
      const appEl = document.getElementById('app-container');
      if (authEl) {
        authEl.classList.add('hidden');
        authEl.classList.remove('flex');
        authEl.style.display = 'none';
      }
      if (appEl) {
        appEl.classList.remove('hidden');
        appEl.classList.add('flex');
        appEl.style.display = 'flex';
      }
    }
  },

  // Cross-Device Real-time Auto-Sync (Phone, PC, Tablet)
  startCrossDeviceSync: function () {
    if (this._syncInterval) clearInterval(this._syncInterval);

    const pullLatestCloud = async () => {
      if (!this.currentUser || !this.cloud || !this.cloud.isConnected) return;
      try {
        const cloudRecord = await this.cloud.pullDataFromCloud(this.currentUser);
        if (cloudRecord && cloudRecord.data && typeof cloudRecord.data === 'object') {
          const remoteStr = JSON.stringify(cloudRecord.data);
          const currentStr = JSON.stringify(this.data);
          if (remoteStr !== currentStr) {
            console.log("☁️ [多设备同步] 检测到其他设备（手机/电脑/平板）有最新记录，正在无缝同步...");
            this.data = this.sanitizeData(cloudRecord.data);
            localStorage.setItem(getUserDataKey(this.currentUser), JSON.stringify(this.data));
            this.renderAll();
          }
        }
      } catch (err) {
        console.warn("Cross-device sync check error:", err);
      }
    };

    // When switching back to this tab or unlocking device
    window.addEventListener('focus', pullLatestCloud);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pullLatestCloud();
    });

    // Background heartbeat polling every 15s
    this._syncInterval = setInterval(pullLatestCloud, 15000);
  },

  sanitizeData: function (obj) {
    if (!obj) return obj;
    try {
      let str = JSON.stringify(obj);
      str = str.replace(/[\u3040-\u30ff]/g, '');
      str = str.replace(/ウラヤハッ！/g, '呀哈！');
      str = str.replace(/草むしり検定/g, '每日目标');
      const cleaned = JSON.parse(str);
      if (cleaned.profile) {
        if (!cleaned.profile.motto || cleaned.profile.motto.includes('每天都要元气满满！')) {
          cleaned.profile.motto = '呀哈！芷萱今天也要开开心心、元气满满！💖';
        }
        cleaned.profile.avatar = 'usagi_character.png';
      }
      // Deduplicate countdowns cleanly and ensure core 3 dates exist
      cleaned.countdowns = this.deduplicateCountdowns(cleaned.countdowns);
      return cleaned;
    } catch (e) {
      return obj;
    }
  },

  logout: function () {
    if (confirm("确定要退出当前账号吗？乌萨奇会想你的哦！🐰")) {
      this.saveData();
      localStorage.removeItem(SESSION_KEY);
      this.currentUser = null;
      this.data = null;
      const appEl = document.getElementById('app-container');
      if (appEl) {
        appEl.classList.add('hidden');
        appEl.classList.remove('flex');
        appEl.style.display = 'none';
      }
      this.showAuthModal(true);
      UsagiSound.pop();
    }
  },

  saveData: function () {
    if (this.currentUser && this.data) {
      localStorage.setItem(getUserDataKey(this.currentUser), JSON.stringify(this.data));
      // Auto-sync to Supabase cloud if connected
      if (this.cloud && this.cloud.isConnected) {
        const users = this.getUsers();
        const pwd = users[this.currentUser] ? users[this.currentUser].password : '';
        const nick = (this.data.profile && this.data.profile.nickname) ? this.data.profile.nickname : this.currentUser;
        this.cloud.syncDataToCloud(this.currentUser, this.data, pwd, nick);
      }
    }
  },

  showAuthModal: function (show) {
    const el = document.getElementById('auth-modal');
    if (!el) return;
    if (show) {
      el.classList.remove('hidden');
      el.classList.add('flex');
      el.style.display = 'flex';
    } else {
      el.classList.add('hidden');
      el.classList.remove('flex');
      el.style.display = 'none';
    }
  },

  // Switch Active Tab
  switchTab: function (tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-pill').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetNav = document.getElementById(`nav-${tabName}`);

    if (targetTab) targetTab.classList.remove('hidden');
    if (targetNav) targetNav.classList.add('active');

    // Update Mobile Horizontal Tab Pills Active State
    document.querySelectorAll('.mobile-tab-pill').forEach(btn => {
      if (btn.getAttribute('data-mobile-tab') === tabName) {
        btn.classList.add('active');
        try { btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch(e){}
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Mobile Bottom Dock Active State
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 乌萨奇智能随场景切换专属状态与对话互动 (保证优先响应，绝不受后续渲染影响)
    try {
      if (window.UsagiPetManager && typeof UsagiPetManager.reactTo === 'function') {
        if (tabName === 'dashboard') UsagiPetManager.reactTo('dashboard');
        else if (tabName === 'period') UsagiPetManager.reactTo('period');
        else if (tabName === 'calendar') UsagiPetManager.reactTo('calendar');
        else if (tabName === 'habits') UsagiPetManager.reactTo('habit');
        else if (tabName === 'expense') UsagiPetManager.reactTo('expense', '乌萨奇小账房戴上眼镜上线啦！快把今天的收支告诉乌萨奇吧~ 💰🥕');
        else if (tabName === 'todos') UsagiPetManager.reactTo('countdown', '乌萨奇正在认真帮芷萱数着每一个期待的心愿倒数哦！⏳💖');
        else if (tabName === 'notes') UsagiPetManager.reactTo('note', '这里是芷萱的灵感秘密花园~ 脑门小灯泡亮起来啦！💡📜');
        else if (tabName === 'highlights') UsagiPetManager.reactTo('highlight', '睡前写下一件今天发生的好事吧~ 魔法星星装进许愿瓶！✨🫙');
        else if (tabName === 'watchlist') UsagiPetManager.reactTo('watchlist', '乌萨奇戴上3D眼镜抱好大桶爆米花啦！芷萱想看什么电影呀~ 🍿🎬');
        else if (tabName === 'cinema') {
          UsagiPetManager.reactTo('watchlist', '乌萨奇戴上3D眼镜抱好大桶爆米花啦！芷萱今天想看什么戏呀~ 🍿🎬');
          const audio = document.getElementById('usagi-audio-engine');
          if (audio && !audio.paused) audio.pause();
        }
        else if (tabName === 'social') UsagiPetManager.reactTo('social', '乌萨奇社交通信小天线启动！网页版小红书、微信、WhatsApp与Instagram已就绪~ 📱🌸');
        else if (tabName === 'music') UsagiPetManager.reactTo('music', '乌萨奇戴上粉色猫耳耳机啦！跟着旋律一起摇摆~ 🎧🎶');
        else if (tabName === 'games') UsagiPetManager.reactTo('game', '芷萱的治愈游乐园开张啦！乌萨奇在旁边全程为你加油助威！🎮🎉');
        else if (tabName === 'health') UsagiPetManager.reactTo('water');
        else if (tabName === 'mood') UsagiPetManager.reactTo('mood', '这里是芷萱的心情与规律树洞~ 无论今天是什么心情，乌萨奇都在这里认真倾听你！🎭💖');
      }
    } catch (e) { console.warn("Pet tab react error:", e); }

    // Trigger tab-specific renders safely
    try {
      if (tabName === 'dashboard') this.renderDashboard();
      if (tabName === 'calendar') this.renderCalendar();
      if (tabName === 'period') this.renderPeriod();
      if (tabName === 'expense') this.renderExpense();
      if (tabName === 'health') this.renderHealth();
      if (tabName === 'habits') this.renderHabits();
      if (tabName === 'notes') this.renderNotes();
      if (tabName === 'todos') this.renderTodos();
      if (tabName === 'watchlist') this.renderWatchlist();
      if (tabName === 'highlights') this.renderHighlights();
      if (tabName === 'social') {
        const savedPhone = localStorage.getItem('usagi_wa_phone');
        const input = document.getElementById('wa-phone-number');
        if (input && savedPhone && !input.value) input.value = savedPhone;
        if (typeof switchSocialSubTab === 'function') {
          switchSocialSubTab((typeof currentActiveSocialApp !== 'undefined' && currentActiveSocialApp) ? currentActiveSocialApp : 'wechat');
        }
      }
      if (tabName === 'games') {
        if (typeof switchGameSubtab === 'function') {
          const activeBtn = document.querySelector('.game-subtab-btn.active');
          if (!activeBtn) switchGameSubtab('fruit');
        }
      }
    } catch (err) {
      console.warn(`Tab render error for ${tabName}:`, err);
    }

    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // RENDER MASTER (Wrapped with multi-level try-catch so it never freezes)
  // --------------------------------------------------------------------------
  renderAll: function () {
    if (!this.data) return;

    try {
      const nickEl = document.getElementById('user-nickname-display');
      if (nickEl) nickEl.innerText = this.data.profile.nickname || this.currentUser;
      const mottoEl = document.getElementById('user-motto-display');
      if (mottoEl) mottoEl.innerText = this.data.profile.motto || '乌萨奇正在为你加油！';
      const avatarContainer = document.getElementById('user-avatar-display');
      if (avatarContainer) {
        avatarContainer.innerHTML = '<img src="usagi_character.png" alt="乌萨奇" class="w-6 h-6 object-contain" />';
      }
    } catch (e) {
      console.warn("Render header error:", e);
    }

    const renderTasks = [
      ['Dashboard', () => this.renderDashboard()],
      ['Calendar', () => this.renderCalendar()],
      ['Period', () => this.renderPeriod()],
      ['Expense', () => this.renderExpense()],
      ['Health', () => this.renderHealth()],
      ['Mood', () => this.renderMood()],
      ['Habits', () => this.renderHabits()],
      ['Notes', () => this.renderNotes()],
      ['Todos', () => this.renderTodos()],
      ['Watchlist', () => this.renderWatchlist()],
      ['Highlights', () => this.renderHighlights()]
    ];

    renderTasks.forEach(([name, taskFn]) => {
      try {
        taskFn();
      } catch (err) {
        console.warn(`Render module ${name} exception:`, err);
      }
    });
  },

  // --------------------------------------------------------------------------
  // 1. DASHBOARD OVERVIEW
  // --------------------------------------------------------------------------
  renderDashboard: function () {
    const today = getLocalDateStr();

    // Period Quick Info
    const periodState = this.calculatePeriodStatus();
    document.getElementById('dash-period-status').innerText = periodState.statusText;
    document.getElementById('dash-period-sub').innerText = periodState.subText;
    document.getElementById('dash-period-badge').className = `badge-kawaii ${periodState.badgeClass}`;

    // Personalized Greeting Banner for 颜芷萱
    const greetingTitleEl = document.getElementById('dash-greeting-title');
    const greetingSubEl = document.getElementById('dash-greeting-sub');
    const nick = (this.data.profile && this.data.profile.nickname) ? this.data.profile.nickname : '芷萱';
    if (greetingTitleEl) {
      greetingTitleEl.innerText = `呀哈！欢迎回到 ${nick} 的专属生活手账！🐰💖`;
    }
    if (greetingSubEl) {
      const hour = new Date().getHours();
      let greetingMsg = '今天又是元气满满的一天，记得喝水完成打卡哦~ ✨';
      if (hour >= 5 && hour < 12) {
        greetingMsg = '早安芷萱！今天也是元气满满的一天，记得喝足 500ml 温水、吃顿元气早餐哦~ ☀️';
      } else if (hour >= 12 && hour < 18) {
        greetingMsg = '下午好芷萱！累了就拍拍乌萨奇，喝口温水放松一下，乌萨奇在为你撑腰！🧋';
      } else if (hour >= 18 && hour < 22) {
        greetingMsg = '晚上好芷萱！今天辛苦啦，写下今天的小确幸，今晚早点休息做个好梦~ 🍲';
      } else {
        greetingMsg = '夜深啦芷萱！早点睡觉做个甜甜的美梦，乌萨奇和最爱你的人陪着你晚安哦~ 🌙';
      }
      if (periodState && (periodState.statusText.includes('经期') || periodState.statusText.includes('黄体'))) {
        greetingMsg = '🌸 芷萱贴心关怀：注意腹部保暖，多喝温开水贴暖宝宝，随时都有乌萨奇陪着你哦~ 💕';
      }
      greetingSubEl.innerText = greetingMsg;
    }

    // Long-Distance Love Count Today
    const loveLogs = this.data.loveLogs || {};
    const loveCount = loveLogs[today] || 0;
    const loveCountEl = document.getElementById('dash-love-count');
    if (loveCountEl) loveCountEl.innerText = loveCount;

    // Expense Quick Info
    const monthlyTotal = this.calculateMonthlyExpense();
    const budget = this.data.expenses.budget || 3000;
    const remaining = Math.max(0, budget - monthlyTotal);
    document.getElementById('dash-expense-spent').innerText = `RM ${monthlyTotal.toFixed(1)}`;
    document.getElementById('dash-expense-remaining').innerText = `剩余 RM ${remaining.toFixed(1)}`;
    const expPercent = Math.min(100, Math.round((monthlyTotal / budget) * 100));
    document.getElementById('dash-expense-bar').style.width = `${expPercent}%`;

    // Water & Sleep Quick Info
    const waterCups = this.data.health.waterLogs[today] || 0;
    const target = this.data.health.waterTarget || 4;
    const perCup = this.data.health.waterPerCup || 500;
    document.getElementById('dash-water-text').innerText = `${waterCups} / ${target} 杯 (${waterCups * perCup}ml)`;
    document.getElementById('dash-water-progress').style.width = `${Math.min(100, (waterCups / target) * 100)}%`;

    // Habit Streak
    const completedHabitsToday = this.data.habits.filter(h => h.history && h.history[today]).length;
    document.getElementById('dash-habit-text').innerText = `${completedHabitsToday} / ${this.data.habits.length} 项已打卡`;

    // Todo Pending
    const pendingTodos = this.data.todos.filter(t => !t.completed).length;
    document.getElementById('dash-todo-count').innerText = `${pendingTodos} 项待完成`;

    // Calendar Today Info
    const todayCalEvents = (this.data.calendarEvents || []).filter(e => e.date === today);
    const calEl = document.getElementById('dash-cal-count');
    const calSub = document.getElementById('dash-cal-sub');
    if (calEl) {
      calEl.innerText = `今日 ${todayCalEvents.length} 项日程记录`;
    }
    if (calSub) {
      if (todayCalEvents.length > 0) {
        calSub.innerText = todayCalEvents.map(e => e.title).join(' · ');
      } else {
        calSub.innerText = '点击前往日历写下今天的记录 🥕';
      }
    }

    // Countdown Nearest
    this.renderDashboardCountdowns();
  },

  renderDashboardCountdowns: function () {
    this.data.countdowns = this.deduplicateCountdowns(this.data.countdowns || []);
    const container = document.getElementById('dash-countdown-list');
    container.innerHTML = '';
    const now = new Date();

    const items = [...(this.data.countdowns || [])].map(c => {
      const diff = Math.ceil((new Date(c.targetDate) - now) / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft: diff };
    });

    if (items.length === 0) {
      container.innerHTML = '<div class="text-sm text-gray-400 py-2">还没有添加倒数日哦~ 🐰</div>';
      return;
    }

    // Sort: together & upcoming anniversary/birthday prioritized
    items.sort((a, b) => {
      const aIsTogether = a.targetDate === '2026-09-05' || (a.title && a.title.includes('在一起'));
      const bIsTogether = b.targetDate === '2026-09-05' || (b.title && b.title.includes('在一起'));
      if (aIsTogether) return -1;
      if (bIsTogether) return 1;
      const aUp = a.daysLeft >= 0 ? 0 : 1;
      const bUp = b.daysLeft >= 0 ? 0 : 1;
      if (aUp !== bUp) return aUp - bUp;
      return a.daysLeft - b.daysLeft;
    });

    items.slice(0, 4).forEach(c => {
      let daysText = '';
      let badgeCls = 'bg-amber-200 text-amber-900';
      const isTogether = c.targetDate === '2026-09-05' || (c.title && c.title.includes('在一起'));

      if (isTogether) {
        const passed = Math.max(0, Math.floor((now - new Date('2026-09-05')) / (1000 * 60 * 60 * 24)));
        daysText = `已相爱 ${passed} 天 ❤️`;
        badgeCls = 'bg-rose-100 text-rose-700 font-bold border border-rose-200';
      } else if (c.daysLeft > 0) {
        daysText = `还有 ${c.daysLeft} 天`;
        if (c.daysLeft <= 10) badgeCls = 'bg-rose-500 text-white animate-pulse';
        else badgeCls = 'bg-pink-100 text-pink-700 border border-pink-200';
      } else if (c.daysLeft === 0) {
        daysText = '就在今天！🎉';
        badgeCls = 'bg-rose-600 text-white animate-bounce';
      } else {
        daysText = `已过去 ${Math.abs(c.daysLeft)} 天`;
        badgeCls = 'bg-stone-100 text-stone-600';
      }

      const div = document.createElement('div');
      div.className = `flex items-center justify-between p-2.5 rounded-xl ${isTogether ? 'bg-gradient-to-r from-pink-50/90 to-rose-50/90 border border-pink-300' : 'bg-amber-50/70 border border-amber-200/60'}`;
      div.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xl">${c.icon || '⏰'}</span>
          <span class="font-bold text-sm text-stone-700">${escapeHtml(c.title)}</span>
        </div>
        <span class="text-xs font-black px-2.5 py-1 rounded-full ${badgeCls}">${daysText}</span>
      `;
      container.appendChild(div);
    });
  },

  // --------------------------------------------------------------------------
  // 1.5. 生活手账日历 (Interactive Calendar & Event Notes)
  // --------------------------------------------------------------------------
  setCalendarYear: function (yr) {
    this.currentCalendarYear = parseInt(yr);
    this.renderCalendar();
    UsagiSound.pop();
  },

  setCalendarMonth: function (mo) {
    this.currentCalendarMonth = parseInt(mo);
    this.renderCalendar();
    UsagiSound.pop();
  },

  prevCalendarMonth: function () {
    if (this.currentCalendarMonth === 1) {
      this.currentCalendarMonth = 12;
      this.currentCalendarYear--;
    } else {
      this.currentCalendarMonth--;
    }
    this.renderCalendar();
    UsagiSound.pop();
  },

  nextCalendarMonth: function () {
    if (this.currentCalendarMonth === 12) {
      this.currentCalendarMonth = 1;
      this.currentCalendarYear++;
    } else {
      this.currentCalendarMonth++;
    }
    this.renderCalendar();
    UsagiSound.pop();
  },

  todayCalendarMonth: function () {
    const d = new Date();
    this.currentCalendarYear = d.getFullYear();
    this.currentCalendarMonth = d.getMonth() + 1;
    this.renderCalendar();
    this.openCalendarDayModal(d.toISOString().split('T')[0]);
    UsagiSound.yaha();
  },

  renderCalendar: function () {
    const year = this.currentCalendarYear;
    const month = this.currentCalendarMonth; // 1 - 12
    const todayStr = new Date().toISOString().split('T')[0];

    // Update Year Input
    const yearInput = document.getElementById('cal-select-year');
    if (yearInput) {
      yearInput.value = year;
    }

    // Update Month Select
    const monthSelect = document.getElementById('cal-select-month');
    if (monthSelect) {
      monthSelect.value = String(month);
    }

    // Update Header Label
    const labelEl = document.getElementById('cal-current-label');
    if (labelEl) {
      labelEl.innerText = `${year}年 ${month}月`;
    }

    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Calculate dates
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    // Map existing records for quick lookup
    const eventsByDate = {};
    (this.data.calendarEvents || []).forEach(e => {
      if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
      eventsByDate[e.date].push(e);
    });

    const expensesByDate = {};
    (this.data.expenses.records || []).forEach(exp => {
      if (exp.type === 'expense') {
        expensesByDate[exp.date] = (expensesByDate[exp.date] || 0) + parseFloat(exp.amount);
      }
    });

    const periodRecords = this.data.period.records || [];

    // Helper to check if date is in period
    const isPeriodDate = (dStr) => {
      return periodRecords.some(r => {
        if (!r.startDate) return false;
        if (r.endDate) {
          return dStr >= r.startDate && dStr <= r.endDate;
        } else {
          return dStr === r.startDate;
        }
      });
    };

    // Total cells = leading prev days + current days + trailing next days
    const totalCells = Math.ceil((firstDayIndex + daysInCurrentMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      let dayNum, isOtherMonth = false, cellDateStr;

      if (i < firstDayIndex) {
        // Prev Month
        dayNum = daysInPrevMonth - firstDayIndex + i + 1;
        isOtherMonth = true;
        const prevMonthVal = month === 1 ? 12 : month - 1;
        const prevYearVal = month === 1 ? year - 1 : year;
        cellDateStr = `${prevYearVal}-${String(prevMonthVal).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else if (i < firstDayIndex + daysInCurrentMonth) {
        // Current Month
        dayNum = i - firstDayIndex + 1;
        cellDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else {
        // Next Month
        dayNum = i - (firstDayIndex + daysInCurrentMonth) + 1;
        isOtherMonth = true;
        const nextMonthVal = month === 12 ? 1 : month + 1;
        const nextYearVal = month === 12 ? year + 1 : year;
        cellDateStr = `${nextYearVal}-${String(nextMonthVal).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }

      const isToday = (cellDateStr === todayStr);
      const dayEvents = eventsByDate[cellDateStr] || [];
      const dayExpense = expensesByDate[cellDateStr];
      const hasPeriod = isPeriodDate(cellDateStr);

      const cell = document.createElement('div');
      cell.className = `calendar-day-cell ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`;
      cell.onclick = () => USAGI_APP.openCalendarDayModal(cellDateStr);

      // Pill color mapping
      const COLOR_MAP = {
        amber: 'bg-amber-100 text-amber-900 border border-amber-300',
        pink: 'bg-rose-100 text-rose-900 border border-rose-300',
        emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        blue: 'bg-blue-100 text-blue-900 border border-blue-300',
        purple: 'bg-purple-100 text-purple-900 border border-purple-300'
      };

      let badgesHtml = '';

      if (hasPeriod) {
        badgesHtml += `<span class="calendar-event-pill bg-rose-200/90 text-rose-900 border border-rose-300">🌸 经期</span>`;
      }
      if (dayExpense) {
        badgesHtml += `<span class="calendar-event-pill bg-amber-100 text-amber-900 font-black">💸 -RM ${dayExpense.toFixed(1)}</span>`;
      }

      dayEvents.slice(0, 3).forEach(ev => {
        const cClass = COLOR_MAP[ev.color] || COLOR_MAP.amber;
        badgesHtml += `
          <span class="calendar-event-pill ${cClass} ${ev.completed ? 'opacity-60 line-through' : ''}">
            <span>${ev.completed ? '✔' : '📌'}</span>
            <span class="truncate">${ev.time ? ev.time + ' ' : ''}${escapeHtml(ev.title)}</span>
          </span>
        `;
      });

      if (dayEvents.length > 3) {
        badgesHtml += `<span class="text-[9px] text-stone-400 font-bold ml-1">+${dayEvents.length - 3} 更多</span>`;
      }

      cell.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          ${isToday ? '<span class="badge-kawaii bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.2">今天</span>' : '<span></span>'}
          <span class="font-black text-xs ${isToday ? 'text-amber-800 text-sm' : isOtherMonth ? 'text-stone-400' : 'text-stone-700'}">${dayNum}</span>
        </div>
        <div class="flex-1 flex flex-col justify-start overflow-hidden">
          ${badgesHtml}
        </div>
      `;

      grid.appendChild(cell);
    }
  },

  openCalendarDayModal: function (dateStr) {
    this.selectedCalendarDate = dateStr;
    const modal = document.getElementById('calendar-day-modal');
    if (!modal) return;

    document.getElementById('cal-modal-date-display').innerText = `📅 ${dateStr} 手账与日程记录`;
    document.getElementById('cal-new-date').value = dateStr;

    // Render Events for that day
    const container = document.getElementById('cal-modal-events-list');
    container.innerHTML = '';

    const events = (this.data.calendarEvents || []).filter(e => e.date === dateStr);

    if (events.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-xs text-stone-400">这一天还没有安排日程，在下方添加一条吧~ 🥕</div>';
    } else {
      events.forEach(ev => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${ev.completed ? 'bg-stone-50 border-stone-200' : 'bg-white border-amber-200 shadow-xs'}`;
        item.innerHTML = `
          <div class="flex items-start gap-2.5">
            <input type="checkbox" ${ev.completed ? 'checked' : ''} onchange="USAGI_APP.toggleCalendarEvent('${ev.id}')" class="checkbox-kawaii mt-0.5" />
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-stone-800 ${ev.completed ? 'line-through text-stone-400' : ''}">${escapeHtml(ev.title)}</span>
                <span class="badge-kawaii bg-amber-100 text-amber-800 text-[10px]">${escapeHtml(ev.category || '生活')}</span>
                ${ev.time ? `<span class="text-xs text-stone-400 font-mono">⏰ ${ev.time}</span>` : ''}
              </div>
              ${ev.content ? `<div class="text-xs text-stone-600 mt-1 whitespace-pre-wrap leading-relaxed">${escapeHtml(ev.content)}</div>` : ''}
            </div>
          </div>
          <button onclick="USAGI_APP.deleteCalendarEvent('${ev.id}')" class="text-stone-300 hover:text-rose-500 text-xs p-1" title="删除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
        container.appendChild(item);
      });
    }

    // Also display expenses on this date
    const dayExpenses = (this.data.expenses.records || []).filter(r => r.date === dateStr);
    const expContainer = document.getElementById('cal-modal-day-expenses');
    if (expContainer) {
      if (dayExpenses.length === 0) {
        expContainer.innerHTML = '<span class="text-xs text-stone-400">当日无支出记录</span>';
      } else {
        expContainer.innerHTML = dayExpenses.map(r => `
          <span class="badge-kawaii bg-amber-50 text-amber-900 border border-amber-200 text-xs">
            ${r.type === 'expense' ? '💸 -RM ' : '💰 +RM '}${parseFloat(r.amount).toFixed(1)} (${escapeHtml(r.category)})
          </span>
        `).join(' ');
      }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    UsagiSound.pop();
  },

  closeCalendarDayModal: function () {
    const modal = document.getElementById('calendar-day-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
    UsagiSound.pop();
  },

  addCalendarEvent: function (date, title, category, time, content, color) {
    if (!title || !title.trim()) {
      alert("请输入事项标题哦！✍️");
      return;
    }
    if (!this.data.calendarEvents) this.data.calendarEvents = [];

    const newEv = {
      id: 'ev_' + Date.now(),
      date: date || this.selectedCalendarDate || new Date().toISOString().split('T')[0],
      title: title.trim(),
      category: category || '生活',
      time: time || '',
      content: (content || '').trim(),
      color: color || 'amber',
      completed: false
    };

    this.data.calendarEvents.unshift(newEv);
    this.saveData();
    this.renderCalendar();
    this.openCalendarDayModal(newEv.date);
    UsagiSound.sparkle();
    confettiRain(15);
  },

  deleteCalendarEvent: function (id) {
    if (!confirm("确定要删除这条日程手账记录吗？此操作无法撤销哦！🐰")) return;
    if (!this.data.calendarEvents) return;
    this.data.calendarEvents = this.data.calendarEvents.filter(e => e.id !== id);
    this.saveData();
    this.renderCalendar();
    this.openCalendarDayModal(this.selectedCalendarDate);
    UsagiSound.pop();
  },

  toggleCalendarEvent: function (id) {
    if (!this.data.calendarEvents) return;
    const ev = this.data.calendarEvents.find(e => e.id === id);
    if (ev) {
      ev.completed = !ev.completed;
      this.saveData();
      this.renderCalendar();
      this.openCalendarDayModal(this.selectedCalendarDate);
      if (ev.completed) {
        UsagiSound.sparkle();
        confettiRain(15);
      } else {
        UsagiSound.pop();
      }
    }
  },

  // --------------------------------------------------------------------------
  // 2. 生理期追踪 (Period Tracker)
  // --------------------------------------------------------------------------
  calculatePeriodStatus: function () {
    if (!this.data) this.data = {};
    if (!this.data.period) this.data.period = { records: [], cycleLength: 28, duration: 5 };
    const records = this.data.period.records || [];
    if (!records || records.length === 0) {
      return {
        statusText: '暂无记录',
        subText: '请记录一次经期开始日期',
        badgeClass: 'bg-stone-200 text-stone-700',
        phase: 'unknown',
        daysUntilNext: 0
      };
    }

    // Sort by latest start date
    const sorted = [...records].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const latest = sorted[0];
    const today = new Date();
    const startDate = new Date(latest.startDate);
    const cycleLen = this.data.period.cycleLength || 28;
    const duration = this.data.period.duration || 5;

    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < duration) {
      return {
        statusText: `经期第 ${diffDays + 1} 天 🌸`,
        subText: '记得多喝温开水，保持腹部温暖哦',
        badgeClass: 'bg-rose-100 text-rose-700 border border-rose-300',
        phase: 'menstrual',
        daysUntilNext: 0
      };
    } else if (diffDays >= duration && diffDays < 12) {
      return {
        statusText: '卵泡期 (黄金期) ✨',
        subText: '精力最充沛的时期，适合运动和学习！',
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        phase: 'follicular',
        daysUntilNext: cycleLen - diffDays
      };
    } else if (diffDays >= 12 && diffDays <= 16) {
      return {
        statusText: '排卵期 🥚',
        subText: '体温可能略有升高，注意情绪起伏',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
        phase: 'ovulation',
        daysUntilNext: cycleLen - diffDays
      };
    } else if (diffDays < cycleLen) {
      const left = cycleLen - diffDays;
      return {
        statusText: `黄体期 (经前) · 距下次 ${left} 天 🍵`,
        subText: '可能有轻微情绪起伏或长痘，规律作息',
        badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300',
        phase: 'luteal',
        daysUntilNext: left
      };
    } else {
      const overdue = diffDays - cycleLen;
      return {
        statusText: `预计已推迟 ${overdue} 天 🐰`,
        subText: '放松心情，不要焦虑，记录新周期吧',
        badgeClass: 'bg-pink-200 text-pink-900 border border-pink-400',
        phase: 'overdue',
        daysUntilNext: 0
      };
    }
  },

  renderPeriod: function () {
    const status = this.calculatePeriodStatus();
    document.getElementById('period-status-banner').innerText = status.statusText;
    document.getElementById('period-tips-text').innerText = status.subText;
    document.getElementById('period-cycle-length-input').value = this.data.period.cycleLength || 28;
    document.getElementById('period-duration-input').value = this.data.period.duration || 5;

    // Render Period History Table
    const list = document.getElementById('period-history-list');
    list.innerHTML = '';
    const records = [...(this.data.period.records || [])].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    if (records.length === 0) {
      list.innerHTML = '<div class="text-center py-6 text-stone-400">还没有记录哦，点击上方新增一次吧~ 🌸</div>';
      return;
    }

    records.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 hover:border-rose-300 transition-all';
      item.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-rose-900">${r.startDate} ${r.endDate ? '~ ' + r.endDate : '(进行中)'}</span>
            <span class="badge-kawaii bg-rose-200 text-rose-800">${r.flow || '正常'}</span>
            <span class="badge-kawaii bg-amber-100 text-amber-800">${escapeHtml(r.pain || '轻微')}</span>
          </div>
          <div class="text-xs text-stone-500 mt-1">${escapeHtml(r.notes || '无特殊症状')}</div>
        </div>
        <button onclick="USAGI_APP.deletePeriodRecord(${idx})" class="text-stone-400 hover:text-red-500 p-2 text-sm">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      list.appendChild(item);
    });
  },

  addPeriodRecord: function (startDate, endDate, flow, pain, notes) {
    if (!startDate) {
      alert("请选择开始日期！🌸");
      return;
    }
    this.data.period.records.push({ startDate, endDate, flow, pain, notes });
    this.saveData();
    this.renderPeriod();
    this.renderDashboard();
    UsagiSound.sparkle();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('period', '特殊生理期乌萨奇带着暖水袋来啦！多喝温水暖和身体，有任何不舒服都找男友和乌萨奇！🧸♨️');
    }
  },

  deletePeriodRecord: function (idx) {
    if (!confirm("确定要删除这条生理期记录吗？此操作无法撤销哦！🐰")) return;
    const sorted = [...this.data.period.records].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const target = sorted[idx];
    this.data.period.records = this.data.period.records.filter(r => r !== target);
    this.saveData();
    this.renderPeriod();
    this.renderDashboard();
    UsagiSound.pop();
  },

  savePeriodSettings: function () {
    const cl = parseInt(document.getElementById('period-cycle-length-input').value) || 28;
    const dur = parseInt(document.getElementById('period-duration-input').value) || 5;
    this.data.period.cycleLength = cl;
    this.data.period.duration = dur;
    this.saveData();
    this.renderPeriod();
    this.renderDashboard();
    UsagiSound.coin();
    alert("生理期周期设置已保存！✨");
  },

  // --------------------------------------------------------------------------
  // 3. 日常开销 (Expense Tracker) - 完整支持按年份、月份筛选统计
  // --------------------------------------------------------------------------
  setExpenseYear: function (yr) {
    this.currentExpenseYear = parseInt(yr);
    this.renderExpense();
    UsagiSound.pop();
  },

  setExpenseMonth: function (mo) {
    this.currentExpenseMonth = mo === 'all' ? 'all' : parseInt(mo);
    this.renderExpense();
    UsagiSound.pop();
  },

  prevExpenseMonth: function () {
    if (this.currentExpenseMonth === 'all') {
      this.currentExpenseMonth = 12;
      this.currentExpenseYear--;
    } else if (this.currentExpenseMonth === 1) {
      this.currentExpenseMonth = 12;
      this.currentExpenseYear--;
    } else {
      this.currentExpenseMonth--;
    }
    this.renderExpense();
    UsagiSound.pop();
  },

  nextExpenseMonth: function () {
    if (this.currentExpenseMonth === 'all') {
      this.currentExpenseMonth = 1;
      this.currentExpenseYear++;
    } else if (this.currentExpenseMonth === 12) {
      this.currentExpenseMonth = 1;
      this.currentExpenseYear++;
    } else {
      this.currentExpenseMonth++;
    }
    this.renderExpense();
    UsagiSound.pop();
  },

  resetExpenseToCurrentMonth: function () {
    const d = new Date();
    this.currentExpenseYear = d.getFullYear();
    this.currentExpenseMonth = d.getMonth() + 1;
    this.renderExpense();
    UsagiSound.pop();
  },

  getFilteredExpenseRecords: function () {
    const yr = this.currentExpenseYear;
    const mo = this.currentExpenseMonth;
    const all = this.data.expenses.records || [];

    if (mo === 'all') {
      const prefix = `${yr}-`;
      return all.filter(r => r.date.startsWith(prefix));
    } else {
      const prefix = `${yr}-${String(mo).padStart(2, '0')}`;
      return all.filter(r => r.date.startsWith(prefix));
    }
  },

  calculateFilteredSummary: function (records) {
    let exp = 0;
    let inc = 0;
    records.forEach(r => {
      const amt = parseFloat(r.amount) || 0;
      if (r.type === 'expense') exp += amt;
      else if (r.type === 'income') inc += amt;
    });
    return {
      expense: exp,
      income: inc,
      balance: inc - exp
    };
  },

  calculateMonthlyExpense: function () {
    // Current real-world month for dashboard overview
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    (this.data.expenses.records || []).forEach(r => {
      if (r.date.startsWith(currentMonthPrefix) && r.type === 'expense') {
        total += parseFloat(r.amount) || 0;
      }
    });
    return total;
  },

  calculateMonthlyIncome: function () {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    (this.data.expenses.records || []).forEach(r => {
      if (r.date.startsWith(currentMonthPrefix) && r.type === 'income') {
        total += parseFloat(r.amount) || 0;
      }
    });
    return total;
  },

  renderExpense: function () {
    const records = this.data.expenses.records || [];
    
    // Update Year Input
    const yearInput = document.getElementById('exp-select-year');
    if (yearInput) {
      yearInput.value = this.currentExpenseYear;
    }

    // Set month selector value
    const monthSelect = document.getElementById('exp-select-month');
    if (monthSelect) {
      monthSelect.value = String(this.currentExpenseMonth);
    }

    // Period indicator badge
    const badge = document.getElementById('exp-period-badge');
    if (badge) {
      const periodLabel = this.currentExpenseMonth === 'all' 
        ? `${this.currentExpenseYear}年 全年账目` 
        : `${this.currentExpenseYear}年 ${this.currentExpenseMonth}月 账目`;
      badge.innerText = periodLabel;
    }

    // Filter records for the chosen period
    const filtered = this.getFilteredExpenseRecords().sort((a, b) => new Date(b.date) - new Date(a.date));
    const summary = this.calculateFilteredSummary(filtered);
    const budget = this.data.expenses.budget || 3500;

    // Update summary cards
    const periodName = this.currentExpenseMonth === 'all' ? '全年' : `${this.currentExpenseMonth}月`;
    const labelOut = document.getElementById('exp-label-out');
    if (labelOut) labelOut.innerText = `${periodName}支出`;
    const labelIn = document.getElementById('exp-label-in');
    if (labelIn) labelIn.innerText = `${periodName}收入`;
    const labelBal = document.getElementById('exp-label-bal');
    if (labelBal) labelBal.innerText = `${periodName}结余`;

    document.getElementById('exp-month-out').innerText = `RM ${summary.expense.toFixed(1)}`;
    document.getElementById('exp-month-in').innerText = `RM ${summary.income.toFixed(1)}`;
    document.getElementById('exp-month-balance').innerText = `RM ${summary.balance.toFixed(1)}`;
    document.getElementById('exp-budget-val').value = budget;

    // Render Records List
    const list = document.getElementById('expense-list-container');
    list.innerHTML = '';

    if (filtered.length === 0) {
      list.innerHTML = `<div class="text-center py-8 text-stone-400">在 ${this.currentExpenseYear}年${this.currentExpenseMonth === 'all' ? '' : this.currentExpenseMonth + '月'} 还没有账单记录哦~ 🥕</div>`;
    } else {
      filtered.forEach(r => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3.5 bg-white/70 rounded-2xl border border-stone-200/60 hover:border-amber-400 transition-all';
        const isExp = r.type === 'expense';
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isExp ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
              ${isExp ? '💸' : '💰'}
            </div>
            <div>
              <div class="font-bold text-stone-800">${escapeHtml(r.category)} <span class="text-xs text-stone-400 font-normal ml-2">${r.date}</span></div>
              <div class="text-xs text-stone-500">${escapeHtml(r.note || '无备注')}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-black text-base ${isExp ? 'text-rose-600' : 'text-emerald-600'}">
              ${isExp ? '-' : '+'}RM ${parseFloat(r.amount).toFixed(2)}
            </span>
            <button onclick="USAGI_APP.deleteExpense('${r.id}')" class="text-stone-300 hover:text-rose-500 text-sm p-1 cursor-pointer" title="删除此笔记录">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
        list.appendChild(item);
      });
    }

    // Render Chart for filtered period
    this.renderExpenseChart(filtered);
  },

  renderExpenseChart: function (filteredRecords) {
    const ctx = document.getElementById('expense-pie-chart');
    if (!ctx) return;

    const records = filteredRecords || this.getFilteredExpenseRecords();

    // Aggregate by category
    const categoryTotals = {};
    records.forEach(r => {
      if (r.type === 'expense') {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + parseFloat(r.amount);
      }
    });

    let labels = Object.keys(categoryTotals);
    let dataVals = Object.values(categoryTotals);

    if (this.charts.expense) {
      this.charts.expense.destroy();
    }

    if (labels.length === 0) {
      labels = ['暂无支出'];
      dataVals = [1];
    }

    this.charts.expense = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataVals,
          backgroundColor: [
            '#FFD43F', '#FF8FA3', '#95D5B2', '#A2D2FF', '#CDB4DB', '#F4A261', '#E76F51', '#B7E4C7', '#D4A373'
          ],
          borderWidth: 2,
          borderColor: '#FFFDF5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Fredoka', size: 11 }, boxWidth: 12 } }
        },
        cutout: '65%'
      }
    });
  },

  addExpense: function (type, category, amount, date, note) {
    if (!amount || amount <= 0) {
      alert("请输入有效金额哦！💰");
      return;
    }
    const newRecord = {
      id: 'exp_' + Date.now(),
      type: type || 'expense',
      category: category || '日常消费',
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      note: note || ''
    };
    this.data.expenses.records.unshift(newRecord);

    // Sync current viewed year/month to match the added expense so user sees it immediately
    if (newRecord.date && newRecord.date.length >= 7) {
      const [y, m] = newRecord.date.split('-').map(Number);
      this.currentExpenseYear = y;
      this.currentExpenseMonth = m;
    }

    this.saveData();
    this.renderExpense();
    this.renderDashboard();
    UsagiSound.coin();
    confettiRain(20);
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('expense', '这笔账乌萨奇认认真真记下啦！芷萱真是持家又可爱的理财小仙女~ 👓💰');
    }
  },

  deleteExpense: function (id) {
    if (!confirm("确定要删除这笔开销/收入记录吗？此操作无法撤销哦！🐰")) return;
    this.data.expenses.records = this.data.expenses.records.filter(r => r.id !== id);
    this.saveData();
    this.renderExpense();
    this.renderDashboard();
    UsagiSound.pop();
  },

  saveBudget: function () {
    const val = parseFloat(document.getElementById('exp-budget-val').value) || 3000;
    this.data.expenses.budget = val;
    this.saveData();
    this.renderExpense();
    this.renderDashboard();
    UsagiSound.coin();
    alert("预算修改成功！🥕");
  },

  // --------------------------------------------------------------------------
  // 4. 健康与身体状态 (Water, Sleep, Weight & Fitness)
  // --------------------------------------------------------------------------
  renderHealth: function () {
    const today = getLocalDateStr();

    // Water tracker
    const cups = this.data.health.waterLogs[today] || 0;
    const target = this.data.health.waterTarget || 4;
    const perCup = this.data.health.waterPerCup || 500;
    document.getElementById('health-water-count').innerText = `${cups} / ${target} 杯`;
    document.getElementById('health-water-ml').innerText = `${cups * perCup} ml`;
    const heightPercent = Math.min(100, (cups / target) * 100);
    document.getElementById('water-glass-fill').style.height = `${heightPercent}%`;

    // Sleep records
    const sleepList = document.getElementById('sleep-history-list');
    sleepList.innerHTML = '';
    const sleepLogs = (this.data.health.sleepLogs || []);

    if (sleepLogs.length === 0) {
      sleepList.innerHTML = '<div class="text-center py-6 text-stone-400 text-xs">暂无睡眠记录，在上方记录昨晚的睡眠吧~ 🌙</div>';
    } else {
      sleepLogs.forEach((s, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3.5 bg-indigo-50/60 hover:bg-indigo-50 rounded-xl border border-indigo-100 text-sm transition-all';
        const qIcon = s.quality === 'great' ? '😴✨' : s.quality === 'good' ? '🌙' : '🥱';
        row.innerHTML = `
          <div class="flex-1 pr-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-indigo-900">${escapeHtml(s.date)}</span>
              <span class="text-xs text-indigo-500 font-mono">${escapeHtml(s.sleepTime)} 入睡 ~ ${escapeHtml(s.wakeTime)} 起床</span>
              <span class="font-bold text-indigo-700 text-xs bg-indigo-100/80 px-2 py-0.5 rounded-full">${s.hours} 小时 ${qIcon}</span>
            </div>
            ${s.note ? `<div class="text-xs text-stone-500 mt-1">${escapeHtml(s.note)}</div>` : ''}
          </div>
          <button onclick="USAGI_APP.deleteSleepLog(${idx})" class="text-stone-300 hover:text-rose-500 p-2 rounded-lg hover:bg-white transition-all cursor-pointer flex-shrink-0" title="删除此条睡眠记录">
            <i class="fa-solid fa-trash-can text-sm"></i>
          </button>
        `;
        sleepList.appendChild(row);
      });
    }

    // Weight & Fitness Chart
    this.renderWeightChart();
  },

  deleteSleepLog: function (idx) {
    if (!confirm("确定要删除这条睡眠打卡记录吗？此操作无法撤销哦！🐰")) return;
    this.data.health.sleepLogs.splice(idx, 1);
    this.saveData();
    this.renderHealth();
    UsagiSound.pop();
  },

  drinkWater: function () {
    const today = getLocalDateStr();
    const cur = this.data.health.waterLogs[today] || 0;
    this.data.health.waterLogs[today] = cur + 1;
    this.saveData();
    this.renderHealth();
    this.renderDashboard();
    UsagiSound.water();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('water');
    }
    const target = this.data.health.waterTarget || 4;
    const perCup = this.data.health.waterPerCup || 500;
    if (this.data.health.waterLogs[today] === target) {
      confettiRain();
      UsagiSound.yaha();
      alert(`太棒啦！今日饮水达标 ${target * perCup}ml！咕噜咕噜~ 🐰💧`);
    }
  },

  resetWater: function () {
    const today = getLocalDateStr();
    this.data.health.waterLogs[today] = 0;
    this.saveData();
    this.renderHealth();
    this.renderDashboard();
    UsagiSound.pop();
  },

  addSleepLog: function (sleepTime, wakeTime, quality, note) {
    if (!sleepTime || !wakeTime) {
      alert("请填写睡觉和起床时间哦~ 🌙");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    // Calculate hours
    let [sh, sm] = sleepTime.split(':').map(Number);
    let [wh, wm] = wakeTime.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = wh * 60 + wm;
    if (endMin <= startMin) endMin += 24 * 60; // crossed midnight
    const hours = parseFloat(((endMin - startMin) / 60).toFixed(1));

    this.data.health.sleepLogs.unshift({
      date: today,
      sleepTime,
      wakeTime,
      hours,
      quality,
      note
    });
    this.saveData();
    this.renderHealth();
    UsagiSound.sparkle();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('sleep');
    }
  },

  addWeightLog: function (weight, exerciseType, duration) {
    if (!weight || weight <= 0) {
      alert("请输入有效的体重数字~ ⚖️");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    this.data.health.weightLogs.push({
      date: today,
      weight: parseFloat(weight),
      exerciseType: exerciseType || '散步',
      duration: parseInt(duration) || 0
    });
    this.saveData();
    this.renderHealth();
    UsagiSound.coin();
  },

  renderWeightChart: function () {
    const ctx = document.getElementById('weight-trend-chart');
    if (!ctx) return;

    const logs = [...(this.data.health.weightLogs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = logs.map(l => l.date.slice(5));
    const dataVals = logs.map(l => l.weight);

    if (this.charts.weight) this.charts.weight.destroy();

    this.charts.weight = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '体重 (kg)',
          data: dataVals,
          borderColor: '#FF8FA3',
          backgroundColor: 'rgba(255, 143, 163, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#FF758F',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false } },
        scales: {
          y: { suggestedMin: 40, suggestedMax: 70 }
        }
      }
    });
  },

  // --------------------------------------------------------------------------
  // 5. 情绪与症状日记 (Mood & Symptom Log)
  // --------------------------------------------------------------------------
  renderMood: function () {
    const list = document.getElementById('mood-history-list');
    list.innerHTML = '';
    const logs = [...(this.data.moods || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    const MOOD_EMOJIS = {
      yaha: { emoji: '🥳', name: '元气爆发 呀哈！', color: 'bg-amber-100 text-amber-900 border-amber-300' },
      ura: { emoji: '🤩', name: '活力拉满！', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
      happy: { emoji: '🥰', name: '开心愉悦', color: 'bg-rose-100 text-rose-900 border-rose-300' },
      calm: { emoji: '😌', name: '平静祥和', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      tired: { emoji: '🥱', name: '略感疲惫', color: 'bg-stone-100 text-stone-800 border-stone-300' },
      emo: { emoji: '🥺', name: '有点郁闷', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
      angry: { emoji: '😤', name: '有点暴躁', color: 'bg-red-100 text-red-900 border-red-300' }
    };

    logs.forEach(m => {
      const meta = MOOD_EMOJIS[m.mood] || { emoji: '🐰', name: m.mood, color: 'bg-amber-50' };
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border ${meta.color} flex flex-col gap-2`;
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${meta.emoji}</span>
            <span class="font-bold">${meta.name}</span>
            <span class="text-xs text-stone-400 ml-2">${m.date}</span>
          </div>
          <button onclick="USAGI_APP.deleteMood('${m.id}')" class="text-stone-300 hover:text-red-500 text-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${(m.symptoms || []).map(s => `<span class="badge-kawaii bg-white/80 text-stone-700 border border-stone-200"># ${escapeHtml(s)}</span>`).join('')}
        </div>
        ${m.note ? `<div class="text-xs text-stone-600 bg-white/60 p-2.5 rounded-xl mt-1">${escapeHtml(m.note)}</div>` : ''}
      `;
      list.appendChild(card);
    });
  },

  addMood: function (moodKey, symptoms, note) {
    const today = new Date().toISOString().split('T')[0];
    const newMood = {
      id: 'mood_' + Date.now(),
      date: today,
      mood: moodKey,
      symptoms: symptoms || [],
      note: note || ''
    };
    this.data.moods.unshift(newMood);
    this.saveData();
    this.renderMood();
    UsagiSound.yaha();
    if (window.UsagiPetManager) {
      if (UsagiPetManager.isMinimized && UsagiPetManager.isMinimized()) {
        UsagiPetManager.expand();
      }
      if (['happy', 'yaha', 'ura'].includes(moodKey)) {
        UsagiPetManager.reactTo('happy');
      } else if (moodKey === 'tired') {
        UsagiPetManager.reactTo('tired');
      } else if (moodKey === 'emo') {
        UsagiPetManager.reactTo('emo');
      } else if (moodKey === 'angry') {
        UsagiPetManager.reactTo('angry');
      } else if (moodKey === 'calm') {
        UsagiPetManager.reactTo('calm');
      } else {
        UsagiPetManager.reactTo('highlight', '平淡也是一种温柔的美好~ 乌萨奇静静陪着芷萱 🍃🍵');
      }
    }
  },

  deleteMood: function (id) {
    if (!confirm("确定要删除这条心情日记吗？此操作无法撤销哦！🐰")) return;
    this.data.moods = this.data.moods.filter(m => m.id !== id);
    this.saveData();
    this.renderMood();
    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // 6. 习惯养成打卡 & 贡献热力图 (Habit Tracker & GitHub-like Heatmap)
  // --------------------------------------------------------------------------
  renderHabits: function () {
    const today = new Date().toISOString().split('T')[0];
    const container = document.getElementById('habit-items-container');
    container.innerHTML = '';

    this.data.habits.forEach(h => {
      const isChecked = h.history && !!h.history[today];
      // calculate streak
      let streak = 0;
      let checkDate = new Date();
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (h.history && h.history[dStr]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const item = document.createElement('div');
      item.className = `flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isChecked ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white/70 border-stone-200'}`;
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="USAGI_APP.toggleHabit('${h.id}')" class="checkbox-kawaii" />
          <div>
            <div class="font-bold text-stone-800 flex items-center gap-2">
              <span>${h.icon || '🌱'}</span>
              <span class="${isChecked ? 'line-through text-stone-400' : ''}">${escapeHtml(h.name)}</span>
            </div>
            <div class="text-xs text-stone-500 mt-0.5">🔥 连续打卡 ${streak} 天</div>
          </div>
        </div>
        <button onclick="USAGI_APP.deleteHabit('${h.id}')" class="text-stone-300 hover:text-red-500 text-sm">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      container.appendChild(item);
    });

    this.renderHeatmap();
  },

  toggleHabit: function (id) {
    const today = new Date().toISOString().split('T')[0];
    const habit = this.data.habits.find(h => h.id === id);
    if (!habit) return;
    if (!habit.history) habit.history = {};

    habit.history[today] = !habit.history[today];
    this.saveData();
    this.renderHabits();
    this.renderDashboard();

    if (habit.history[today]) {
      UsagiSound.sparkle();
      confettiRain(25);
    } else {
      UsagiSound.pop();
    }
  },

  addHabit: function (name, icon) {
    if (!name.trim()) {
      alert("请输入习惯名称哦！🌱");
      return;
    }
    this.data.habits.push({
      id: 'h_' + Date.now(),
      name: name.trim(),
      icon: icon || '✨',
      history: {}
    });
    this.saveData();
    this.renderHabits();
    this.renderDashboard();
    UsagiSound.coin();
  },

  deleteHabit: function (id) {
    if (!confirm("确定要删除这个打卡习惯吗？相关打卡历史也会被删除哦！🐰")) return;
    this.data.habits = this.data.habits.filter(h => h.id !== id);
    this.saveData();
    this.renderHabits();
    this.renderDashboard();
    UsagiSound.pop();
  },

  renderHeatmap: function () {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Generate past 140 days (20 weeks x 7 days)
    const totalDays = 140;
    const now = new Date();
    const days = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];

      // Calculate how many habits completed on dStr
      let count = 0;
      this.data.habits.forEach(h => {
        if (h.history && h.history[dStr]) count++;
      });
      days.push({ date: dStr, count });
    }

    days.forEach(d => {
      const cell = document.createElement('div');
      let lvl = 0;
      if (d.count >= 4) lvl = 4;
      else if (d.count >= 3) lvl = 3;
      else if (d.count >= 2) lvl = 2;
      else if (d.count >= 1) lvl = 1;

      cell.className = `heatmap-cell level-${lvl}`;
      cell.title = `${d.date}: ${d.count} 个习惯完成`;
      grid.appendChild(cell);
    });
  },

  // --------------------------------------------------------------------------
  // 7. 碎片灵感 / 备忘录 (Quick Notes)
  // --------------------------------------------------------------------------
  renderNotes: function () {
    const container = document.getElementById('notes-grid');
    container.innerHTML = '';
    const notes = [...(this.data.notes || [])].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (notes.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center py-10 text-stone-400">还没有写便签呢，记下一颗闪闪发光的灵感吧~ 💡</div>';
      return;
    }

    notes.forEach(n => {
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition-all ${n.pinned ? 'bg-amber-50/90 border-amber-300 shadow-md' : 'bg-white/80 border-stone-200'} flex flex-col justify-between`;
      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-stone-800 text-sm flex items-center gap-1.5">
              ${n.pinned ? '📌' : ''} ${escapeHtml(n.title)}
            </h4>
            <span class="badge-kawaii bg-amber-200 text-amber-900">${escapeHtml(n.tag || '灵感')}</span>
          </div>
          <p class="text-xs text-stone-600 mt-2 whitespace-pre-wrap leading-relaxed">${escapeHtml(n.content)}</p>
        </div>
        <div class="flex items-center justify-between mt-4 pt-2 border-t border-stone-100 text-xs text-stone-400">
          <span>${n.date}</span>
          <div class="flex items-center gap-2">
            <button onclick="USAGI_APP.togglePinNote('${n.id}')" class="hover:text-amber-600" title="置顶">
              <i class="fa-solid fa-thumbtack"></i>
            </button>
            <button onclick="USAGI_APP.deleteNote('${n.id}')" class="hover:text-rose-500" title="删除">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  },

  addNote: function (title, content, tag) {
    if (!title.trim() && !content.trim()) {
      alert("写点东西再保存吧~ 💡");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    this.data.notes.unshift({
      id: 'n_' + Date.now(),
      title: title.trim() || '随手记',
      content: content.trim(),
      tag: tag || '灵感',
      pinned: false,
      date: today
    });
    this.saveData();
    this.renderNotes();
    UsagiSound.sparkle();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('highlight', '芷萱的灵感火花被珍藏好啦！有想法的女孩最迷人~ 💡✨');
    }
  },

  togglePinNote: function (id) {
    const n = this.data.notes.find(x => x.id === id);
    if (n) {
      n.pinned = !n.pinned;
      this.saveData();
      this.renderNotes();
      UsagiSound.pop();
    }
  },

  deleteNote: function (id) {
    if (!confirm("确定要删除这条碎片灵感便签吗？此操作无法撤销哦！🐰")) return;
    this.data.notes = this.data.notes.filter(x => x.id !== id);
    this.saveData();
    this.renderNotes();
    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // 8. 待办清单与倒数日 (To-Do & Countdowns)
  // --------------------------------------------------------------------------
  deduplicateCountdowns: function (list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    let hasTogether = false;
    let hasAnniversary = false;
    let hasBirthday = false;

    list.forEach((c, idx) => {
      if (!c) return;
      const isTogether = c.id === 'c_together' || c.targetDate === '2026-09-05' || (c.title && c.title.includes('在一起'));
      const isAnniv = c.id === 'c_anniversary' || (c.title && c.title.includes('一周年'));
      const isBday = c.id === 'c_birthday' || (c.title && (c.title.includes('芷萱') || c.title.includes('小仙女')) && c.title.includes('生日')) || (c.targetDate === '2027-11-06' && c.title && c.title.includes('生日'));

      if (isTogether) {
        if (!hasTogether) {
          hasTogether = true;
          c.id = 'c_together';
          c.title = '💑 我们在一起的日子 (2026-09-05)';
          c.targetDate = '2026-09-05';
          c.icon = '❤️';
          result.push(c);
        }
        return;
      }
      if (isAnniv) {
        if (!hasAnniversary) {
          hasAnniversary = true;
          c.id = 'c_anniversary';
          c.title = '💖 恋爱一周年纪念日';
          c.targetDate = '2027-09-05';
          c.icon = '💑';
          result.push(c);
        }
        return;
      }
      if (isBday) {
        if (!hasBirthday) {
          hasBirthday = true;
          c.id = 'c_birthday';
          c.title = '🎂 芷萱小仙女生日 (11月6日)';
          c.targetDate = '2027-11-06';
          c.icon = '🎂';
          result.push(c);
        }
        return; // Drop any duplicate birthday!
      }

      // Custom user countdown:
      const safeId = c.id || ('c_' + Date.now() + '_' + idx);
      c.id = safeId;
      const key = (c.title || '').trim() + '::' + (c.targetDate || '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    });

    if (!hasTogether) {
      result.unshift({ id: 'c_together', title: '💑 我们在一起的日子 (2026-09-05)', targetDate: '2026-09-05', category: '纪念日', icon: '❤️' });
    }
    if (!hasAnniversary) {
      result.push({ id: 'c_anniversary', title: '💖 恋爱一周年纪念日', targetDate: '2027-09-05', category: '纪念日', icon: '💑' });
    }
    if (!hasBirthday) {
      result.push({ id: 'c_birthday', title: '🎂 芷萱小仙女生日 (11月6日)', targetDate: '2027-11-06', category: '生日', icon: '🎂' });
    }

    return result;
  },

  renderTodos: function () {
    const list = document.getElementById('todo-list-container');
    list.innerHTML = '';
    const todos = [...(this.data.todos || [])].sort((a, b) => (a.completed ? 1 : -1));

    if (todos.length === 0) {
      list.innerHTML = '<div class="text-center py-6 text-stone-400">今日暂无待办事项，去享受乌萨奇的阳光吧~ ☀️</div>';
    } else {
      todos.forEach(t => {
        const item = document.createElement('div');
        item.className = `flex items-center justify-between p-3 rounded-xl border ${t.completed ? 'bg-stone-50/60 border-stone-200' : 'bg-white border-amber-200'} transition-all`;
        const priBadge = t.priority === 'high' ? 'bg-red-100 text-red-800' : t.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="USAGI_APP.toggleTodo('${t.id}')" class="checkbox-kawaii" />
            <div>
              <span class="font-bold text-sm ${t.completed ? 'line-through text-stone-400' : 'text-stone-800'}">${escapeHtml(t.text)}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge-kawaii ${priBadge}">${t.priority === 'high' ? '重要' : t.priority === 'medium' ? '适中' : '轻松'}</span>
                <span class="text-xs text-stone-400">${t.dueDate || '无截止日'}</span>
              </div>
            </div>
          </div>
          <button onclick="USAGI_APP.deleteTodo('${t.id}')" class="text-stone-300 hover:text-red-500 text-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
        list.appendChild(item);
      });
    }

    // Render Countdowns (clean & deduplicated)
    this.data.countdowns = this.deduplicateCountdowns(this.data.countdowns || []);
    const cList = document.getElementById('countdown-list-container');
    cList.innerHTML = '';
    const now = new Date();

    this.data.countdowns.forEach((c, idx) => {
      const diff = Math.ceil((new Date(c.targetDate) - now) / (1000 * 60 * 60 * 24));
      const card = document.createElement('div');
      const isPast = diff < 0;
      const isTogether = c.targetDate === '2026-09-05' || (c.title && c.title.includes('在一起'));
      const passedDays = isTogether ? Math.max(0, Math.floor((now - new Date('2026-09-05')) / (1000 * 60 * 60 * 24))) : Math.abs(diff);

      card.className = `p-3.5 rounded-2xl ${isTogether ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border-2 border-pink-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'} flex items-center justify-between`;
      let suffix = diff > 0 ? '天后' : diff === 0 ? '就在今天！' : isTogether ? '天 (相爱相伴)' : '天前';
      let numVal = isTogether ? passedDays : (diff >= 0 ? diff : Math.abs(diff));

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 pr-2">
          <span class="text-2xl shrink-0">${c.icon || '⏰'}</span>
          <div class="min-w-0">
            <div class="font-bold text-stone-800 text-sm flex items-center gap-1.5 flex-wrap">
              <span>${escapeHtml(c.title)}</span>
              ${isTogether ? '<span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 whitespace-nowrap">相爱相伴</span>' : ''}
            </div>
            <div class="text-xs text-stone-500 mt-0.5">目标日: ${c.targetDate}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <div class="text-right whitespace-nowrap">
            <span class="text-xl font-black ${isTogether ? 'text-pink-600' : diff < 0 ? 'text-stone-500' : 'text-amber-700'}">${numVal}</span>
            <span class="text-xs block ${isTogether ? 'text-pink-500 font-bold' : diff < 0 ? 'text-stone-400' : 'text-amber-600'}">${suffix}</span>
          </div>
          ${(c.id === 'c_together' || c.id === 'c_anniversary' || c.id === 'c_birthday') ? '' : `
          <button onclick="USAGI_APP.deleteCountdown('${c.id}', ${idx})" class="p-2 -mr-1 text-stone-400 hover:text-red-500 active:text-red-600 rounded-xl hover:bg-red-50 transition-all text-base cursor-pointer" title="删除此项倒数">
            <i class="fa-solid fa-trash-can"></i>
          </button>`}
        </div>
      `;
      cList.appendChild(card);
    });
  },

  addTodo: function (text, priority, dueDate) {
    if (!text.trim()) {
      alert("请输入待办任务内容！✍️");
      return;
    }
    this.data.todos.unshift({
      id: 't_' + Date.now(),
      text: text.trim(),
      priority: priority || 'medium',
      dueDate: dueDate || '',
      completed: false
    });
    this.saveData();
    this.renderTodos();
    this.renderDashboard();
    UsagiSound.pop();
  },

  toggleTodo: function (id) {
    const t = this.data.todos.find(x => x.id === id);
    if (t) {
      t.completed = !t.completed;
      this.saveData();
      this.renderTodos();
      this.renderDashboard();
      if (t.completed) {
        UsagiSound.sparkle();
        confettiRain(20);
      } else {
        UsagiSound.pop();
      }
    }
  },

  deleteTodo: function (id) {
    if (!confirm("确定要删除这条待办任务吗？此操作无法撤销哦！🐰")) return;
    this.data.todos = this.data.todos.filter(x => x.id !== id);
    this.saveData();
    this.renderTodos();
    this.renderDashboard();
    UsagiSound.pop();
  },

  addCountdown: function (title, targetDate, icon) {
    if (!title.trim() || !targetDate) {
      alert("请填写纪念日标题和日期！⏰");
      return;
    }
    this.data.countdowns.push({
      id: 'c_' + Date.now(),
      title: title.trim(),
      targetDate: targetDate,
      icon: icon || '🎉'
    });
    this.saveData();
    this.renderTodos();
    this.renderDashboard();
    UsagiSound.coin();
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('countdown', `哇！心动倒数【${title.trim()}】记录好啦！乌萨奇每天都帮你数着见男友的日子！⏳✈️`);
    }
  },

  deleteCountdown: function (id, index) {
    if (!confirm("确定要删除这个倒数日纪念日吗？此操作无法撤销哦！🐰")) return;
    if (id && id !== 'undefined' && id !== 'null') {
      this.data.countdowns = (this.data.countdowns || []).filter((x, idx) => x.id !== id && idx !== index);
    } else if (typeof index === 'number' && index >= 0) {
      this.data.countdowns.splice(index, 1);
    }
    this.saveData();
    this.renderTodos();
    this.renderDashboard();
    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // 9. 书影音 / 探店 / 购物冷静期清单 (Watchlist & Wishlist)
  // --------------------------------------------------------------------------
  renderWatchlist: function () {
    const list = document.getElementById('watchlist-items-container');
    list.innerHTML = '';
    const items = this.data.watchlist || [];

    if (items.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-stone-400">心愿单空空如也，记下一部电影或者好吃的餐厅吧~ 🎬🍰</div>';
      return;
    }

    items.forEach(w => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-2xl bg-white/80 border border-stone-200 hover:border-amber-300 transition-all flex flex-col justify-between';

      let typeBadge = '🎬 电影/番剧';
      if (w.type === 'food') typeBadge = '🍰 探店美食';
      else if (w.type === 'cooling_shop') typeBadge = '🧊 购物冷静期';
      else if (w.type === 'other' || w.customType) typeBadge = `✨ ${escapeHtml(w.customType || '自定义心愿')}`;
      else if (w.type && w.type !== 'movie') typeBadge = `✨ ${escapeHtml(w.type)}`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between">
            <span class="badge-kawaii bg-amber-100 text-amber-800">${typeBadge}</span>
            <div class="text-amber-500 text-sm">${'★'.repeat(w.rating || 5)}${'☆'.repeat(5 - (w.rating || 5))}</div>
          </div>
          <h4 class="font-bold text-stone-800 text-base mt-2">${escapeHtml(w.title)}</h4>
          ${w.price ? `<div class="text-rose-600 font-black text-sm mt-1">RM ${w.price}</div>` : ''}
          ${w.type === 'cooling_shop' ? `
            <div class="stamp-cooling text-xs p-2 mt-2 flex items-center justify-between">
              <span>❄️ 冷静期倒计时:</span>
              <span class="font-bold text-rose-700">${w.coolingDaysLeft || 3} 天</span>
            </div>
          ` : ''}
          <p class="text-xs text-stone-500 mt-2">${escapeHtml(w.notes || '')}</p>
        </div>
        <div class="flex items-center justify-between mt-4 pt-2 border-t border-stone-100">
          <span class="text-xs ${w.status === 'done' ? 'text-emerald-600 font-bold' : 'text-stone-400'}">
            ${w.status === 'done' ? '✅ 已打卡完成' : '⏳ 心愿清单中'}
          </span>
          <div class="flex items-center gap-2">
            ${w.status !== 'done' ? `<button onclick="USAGI_APP.markWatchlistDone('${w.id}')" class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-bold">打卡</button>` : ''}
            <button onclick="USAGI_APP.deleteWatchlist('${w.id}')" class="text-stone-300 hover:text-red-500 text-sm">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  },

  addWatchlist: function (title, type, rating, price, notes, customType) {
    if (!title.trim()) {
      alert("请输入心愿名称！🎬");
      return;
    }
    this.data.watchlist.unshift({
      id: 'w_' + Date.now(),
      title: title.trim(),
      type: type || 'movie',
      customType: customType || '',
      rating: parseInt(rating) || 5,
      price: price ? parseFloat(price) : null,
      coolingDaysLeft: type === 'cooling_shop' ? 3 : 0,
      status: 'wish',
      notes: notes || ''
    });
    this.saveData();
    this.renderWatchlist();
    UsagiSound.sparkle();
  },

  markWatchlistDone: function (id) {
    const item = this.data.watchlist.find(x => x.id === id);
    if (item) {
      item.status = 'done';
      this.saveData();
      this.renderWatchlist();
      UsagiSound.yaha();
      confettiRain();
    }
  },

  deleteWatchlist: function (id) {
    if (!confirm("确定要删除这项心愿/冷静期清单项目吗？此操作无法撤销哦！🐰")) return;
    this.data.watchlist = this.data.watchlist.filter(x => x.id !== id);
    this.saveData();
    this.renderWatchlist();
    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // 10. 感恩日记 / 每日高光 (Daily Highlight)
  // --------------------------------------------------------------------------
  renderHighlights: function () {
    const container = document.getElementById('highlights-container');
    container.innerHTML = '';
    const list = this.data.highlights || [];

    if (list.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-stone-400">睡前写下一件今天发生的好事吧~ 幸福感会悄悄翻倍哦！✨</div>';
      return;
    }

    list.forEach(hl => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-pink-50 border border-amber-200/80 shadow-sm relative';
      card.innerHTML = `
        <div class="flex items-center justify-between text-xs text-amber-700/80 mb-2">
          <span class="font-bold">✨ ${hl.date}</span>
          <button onclick="USAGI_APP.deleteHighlight('${hl.id}')" class="text-stone-300 hover:text-red-500">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <p class="font-bold text-stone-800 text-sm leading-relaxed">“ ${escapeHtml(hl.text)} ”</p>
        ${hl.gratitude ? `<div class="text-xs text-rose-500 font-semibold mt-2">💌 感恩: ${escapeHtml(hl.gratitude)}</div>` : ''}
      `;
      container.appendChild(card);
    });
  },

  addHighlight: function (text, gratitude) {
    if (!text.trim()) {
      alert("请写下一件今天的好事哦！✨");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    this.data.highlights.unshift({
      id: 'hl_' + Date.now(),
      date: today,
      text: text.trim(),
      gratitude: gratitude.trim()
    });
    this.saveData();
    this.renderHighlights();
    UsagiSound.yaha();
    confettiRain(30);
    if (window.UsagiPetManager) {
      UsagiPetManager.reactTo('highlight', '哇！今天又捕捉到了幸福高光！生活中的甜都被芷萱珍藏在手账里了呢~ 📖💖');
    }
  },

  deleteHighlight: function (id) {
    if (!confirm("确定要删除这条每日高光记录吗？此操作无法撤销哦！🐰")) return;
    this.data.highlights = this.data.highlights.filter(x => x.id !== id);
    this.saveData();
    this.renderHighlights();
    UsagiSound.pop();
  },

  // --------------------------------------------------------------------------
  // EXCEL EXPORT (导出月度或全年手账与财务 Excel 表格，带 UTF-8 BOM，绝不乱码)
  // --------------------------------------------------------------------------
  exportToExcel: function (year, month, type = 'expense') {
    year = parseInt(year) || this.currentExpenseYear || new Date().getFullYear();
    const isAllMonth = (month === 'all');
    const monthLabel = isAllMonth ? `${year}年全年总览` : `${year}年${String(month).padStart(2, '0')}月`;
    let csvRows = [];
    let filename = '';

    if (type === 'expense') {
      let recs = this.data.expenses.records || [];
      recs = recs.filter(r => r.date && r.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        recs = recs.filter(r => r.date.slice(5, 7) === mStr);
      }
      recs.sort((a, b) => new Date(b.date) - new Date(a.date));

      let totalExpense = 0;
      let totalIncome = 0;
      recs.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        if (r.type === 'income') totalIncome += amt;
        else totalExpense += amt;
      });

      csvRows.push(['乌萨奇生活手账 - 财务收支明细对账单']);
      csvRows.push(['账单周期', monthLabel]);
      csvRows.push(['导出时间', new Date().toLocaleString()]);
      csvRows.push(['手账用户', this.data.profile.nickname || this.currentUser]);
      csvRows.push([]);
      csvRows.push(['序号', '日期', '收支类型', '消费/收入分类', '金额 (RM)', '备注说明', '记录编号']);

      recs.forEach((r, idx) => {
        csvRows.push([
          idx + 1,
          r.date,
          r.type === 'income' ? '收入 (+)' : '支出 (-)',
          r.category || '未分类',
          parseFloat(r.amount).toFixed(2),
          r.note || '',
          r.id
        ]);
      });

      csvRows.push([]);
      csvRows.push(['=== 周期统计汇总 ===', '', '', '', '', '', '']);
      csvRows.push(['总支出 (RM)', `RM ${totalExpense.toFixed(2)}`, '', '', '', '', '']);
      csvRows.push(['总收入 (RM)', `RM ${totalIncome.toFixed(2)}`, '', '', '', '', '']);
      csvRows.push(['净结余 (RM)', `RM ${(totalIncome - totalExpense).toFixed(2)}`, '', '', '', '', '']);
      csvRows.push(['当前月度预算 (RM)', `RM ${parseFloat(this.data.expenses.budget || 0).toFixed(2)}`, '', '', '', '', '']);

      filename = `乌萨奇手账_${monthLabel}_开销财务账单.csv`;

    } else if (type === 'calendar') {
      let events = this.data.calendarEvents || [];
      events = events.filter(e => e.date && e.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        events = events.filter(e => e.date.slice(5, 7) === mStr);
      }
      events.sort((a, b) => new Date(b.date) - new Date(a.date));

      csvRows.push(['乌萨奇生活手账 - 日历日程手账记录表']);
      csvRows.push(['统计周期', monthLabel]);
      csvRows.push(['导出时间', new Date().toLocaleString()]);
      csvRows.push([]);
      csvRows.push(['序号', '手账日期', '安排时间', '分类标签', '事项标题', '详细随笔记事', '完成状态']);

      events.forEach((e, idx) => {
        csvRows.push([
          idx + 1,
          e.date,
          e.time || '全天',
          e.category || '生活',
          e.title,
          e.content || '',
          e.completed ? '已打勾完成' : '待处理'
        ]);
      });

      filename = `乌萨奇手账_${monthLabel}_日历日程表.csv`;

    } else if (type === 'health') {
      let sleep = this.data.health.sleepLogs || [];
      sleep = sleep.filter(s => s.date && s.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        sleep = sleep.filter(s => s.date.slice(5, 7) === mStr);
      }
      sleep.sort((a, b) => new Date(b.date) - new Date(a.date));

      csvRows.push(['乌萨奇生活手账 - 睡眠作息与健康打卡表']);
      csvRows.push(['统计周期', monthLabel]);
      csvRows.push(['导出时间', new Date().toLocaleString()]);
      csvRows.push([]);
      csvRows.push(['序号', '打卡日期', '入睡时间', '起床时间', '睡眠总时长 (小时)', '睡眠感受', '睡前随笔备注']);

      sleep.forEach((s, idx) => {
        const qName = s.quality === 'great' ? '极好' : s.quality === 'good' ? '良好' : '较差';
        csvRows.push([
          idx + 1,
          s.date,
          s.sleepTime,
          s.wakeTime,
          s.hours,
          qName,
          s.note || ''
        ]);
      });

      filename = `乌萨奇手账_${monthLabel}_睡眠健康打卡表.csv`;

    } else {
      // type === 'all_overview': Comprehensive Multi-module Sheet
      csvRows.push(['乌萨奇生活手账 - 全能生活仪表盘综合总表']);
      csvRows.push(['统计周期', monthLabel]);
      csvRows.push(['导出时间', new Date().toLocaleString()]);
      csvRows.push(['手账用户', this.data.profile.nickname || this.currentUser]);
      csvRows.push([]);

      // Section 1: Expenses
      csvRows.push(['【一、财务开销与收入明细】', '', '', '', '']);
      csvRows.push(['序号', '日期', '收支类型', '消费分类', '金额 (RM)', '备注说明']);
      let recs = (this.data.expenses.records || []).filter(r => r.date && r.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        recs = recs.filter(r => r.date.slice(5, 7) === mStr);
      }
      recs.sort((a, b) => new Date(b.date) - new Date(a.date));
      let totalExpense = 0, totalIncome = 0;
      recs.forEach((r, idx) => {
        const amt = parseFloat(r.amount) || 0;
        if (r.type === 'income') totalIncome += amt; else totalExpense += amt;
        csvRows.push([idx + 1, r.date, r.type === 'income' ? '收入 (+)' : '支出 (-)', r.category || '未分类', amt.toFixed(2), r.note || '']);
      });
      csvRows.push(['统计支出 (RM)', `RM ${totalExpense.toFixed(2)}`, '统计收入 (RM)', `RM ${totalIncome.toFixed(2)}`, '净结余 (RM)', `RM ${(totalIncome - totalExpense).toFixed(2)}`]);
      csvRows.push([]);

      // Section 2: Calendar Events
      csvRows.push(['【二、日历生活日程与随笔备忘】', '', '', '', '']);
      csvRows.push(['序号', '日期', '时间', '分类', '事项标题', '详细随笔', '状态']);
      let events = (this.data.calendarEvents || []).filter(e => e.date && e.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        events = events.filter(e => e.date.slice(5, 7) === mStr);
      }
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      events.forEach((e, idx) => {
        csvRows.push([idx + 1, e.date, e.time || '全天', e.category || '生活', e.title, e.content || '', e.completed ? '已完成' : '待处理']);
      });
      csvRows.push([]);

      // Section 3: Sleep logs
      csvRows.push(['【三、作息与睡眠打卡】', '', '', '', '']);
      csvRows.push(['序号', '日期', '入睡时间', '起床时间', '时长(小时)', '睡眠质量', '备注']);
      let sleep = (this.data.health.sleepLogs || []).filter(s => s.date && s.date.startsWith(String(year)));
      if (!isAllMonth) {
        const mStr = String(month).padStart(2, '0');
        sleep = sleep.filter(s => s.date.slice(5, 7) === mStr);
      }
      sleep.sort((a, b) => new Date(b.date) - new Date(a.date));
      sleep.forEach((s, idx) => {
        csvRows.push([idx + 1, s.date, s.sleepTime, s.wakeTime, s.hours, s.quality, s.note || '']);
      });

      filename = `乌萨奇手账_${monthLabel}_综合生活总表.csv`;
    }

    // Convert csvRows to CSV string with \uFEFF BOM for Excel compatibility
    const csvContent = "\uFEFF" + csvRows.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '""';
        const str = String(cell).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    UsagiSound.sparkle();
    confettiRain(25);
  },

  // --------------------------------------------------------------------------
  // DATA BACKUP & RESTORE (JSON Export / Import)
  // --------------------------------------------------------------------------
  exportDataJSON: function () {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `usagi_life_backup_${this.currentUser}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    UsagiSound.sparkle();
  },

  importDataJSON: function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (confirm("导入将覆盖当前用户的所有数据，确定要继续吗？")) {
          this.data = imported;
          this.saveData();
          this.renderAll();

      const urlParams = new URLSearchParams(window.location.search);
      const targetTab = urlParams.get('tab');
      if (targetTab) {
        this.switchTab(targetTab);
      } else {
        setTimeout(() => {
          if (window.UsagiPetManager && typeof UsagiPetManager.reactTo === 'function') {
            UsagiPetManager.reactTo('dashboard');
          }
        }, 350);
      }
      const targetSong = urlParams.get('song');
      if (targetSong && typeof window.playSongById === 'function') {
        setTimeout(() => window.playSongById(targetSong), 300);
      }
          alert("数据导入成功！✨");
          UsagiSound.yaha();
        }
      } catch (err) {
        alert("文件解析失败，请确保是有效的 JSON 备份文件！");
      }
    };
    reader.readAsText(file);
  }
};

// Simple HTML escaping utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Confetti Particle Burst
function confettiRain(count = 50) {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: count,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD43F', '#FF8FA3', '#95D5B2', '#A2D2FF', '#FFFFFF']
    });
  }
}
window.confettiRain = confettiRain;

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  USAGI_APP.initAuth();
});
