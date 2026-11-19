import re

rhythm_code = '''/* ============================================================
   6.7. GAME 12: 🎹 乌萨奇心动音游狂欢节 (Kawaii Rhythm Festival)
   支持 40+ 首全量本地 MP3 原曲自选 · 5-PERFECT 炸裂燃火 FEVER 模式 · 4轨落键 & 太鼓达人双模
   ============================================================ */
const RhythmGame = (function () {
  let canvas = null, ctx = null;
  let isPlaying = false;
  let animId = null;
  let gameMode = 'keys'; // 'keys' (4轨落键) or 'taiko' (太鼓达人)
  let difficulty = 'normal'; // 'easy', 'normal', 'master'

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

    updateUI();
  }

  function handleKeyInput(e) {
    if (!isPlaying) return;
    const k = e.key.toLowerCase();
    if (gameMode === 'keys') {
      if (k === 'd') hitLane(0);
      else if (k === 'f') hitLane(1);
      else if (k === 'j') hitLane(2);
      else if (k === 'k') hitLane(3);
    } else {
      // Taiko mode
      if (k === 'f' || k === 'j') hitTaiko('don');
      else if (k === 'd' || k === 'k') hitTaiko('ka');
      else if (k === ' ') hitTaiko('roll');
    }
  }

  function switchMode(mode) {
    gameMode = mode;
    const btnKeys = document.getElementById('rhythm-mode-btn-keys');
    const btnTaiko = document.getElementById('rhythm-mode-btn-taiko');
    const cKeys = document.getElementById('rhythm-controls-keys');
    const cTaiko = document.getElementById('rhythm-controls-taiko');

    if (mode === 'keys') {
      if (btnKeys) { btnKeys.className = 'px-3 py-1 text-xs font-black rounded-lg transition-all bg-white text-rose-600 shadow-xs cursor-pointer'; }
      if (btnTaiko) { btnTaiko.className = 'px-3 py-1 text-xs font-bold rounded-lg transition-all text-stone-600 hover:text-rose-500 cursor-pointer'; }
      if (cKeys) cKeys.classList.remove('hidden');
      if (cTaiko) cTaiko.classList.add('hidden');
    } else {
      if (btnTaiko) { btnTaiko.className = 'px-3 py-1 text-xs font-black rounded-lg transition-all bg-white text-rose-600 shadow-xs cursor-pointer'; }
      if (btnKeys) { btnKeys.className = 'px-3 py-1 text-xs font-bold rounded-lg transition-all text-stone-600 hover:text-rose-500 cursor-pointer'; }
      if (cKeys) cKeys.classList.add('hidden');
      if (cTaiko) cTaiko.classList.remove('hidden');
    }
    notes = [];
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
    } else {
      startGame();
    }
  }

  function startGame() {
    isPlaying = true;
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

  function pauseGame() {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    const btn = document.getElementById('btn-rhythm-play');
    if (btn) btn.innerText = '▶️ 继续演奏';

    if (bgmAudio) bgmAudio.pause();
    const cover = document.getElementById('rhythm-song-cover');
    if (cover) cover.classList.remove('song-cover-spin');
  }

  function onSongEnded() {
    pauseGame();
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

    // Spawn notes
    if (gameMode === 'keys') {
      if (spawnTimer % spawnCadence === 0) {
        const lane = Math.floor(Math.random() * 4);
        notes.push({ lane, y: -25, speed: baseSpeed + Math.random() * 0.8, hit: false });

        // Double notes in Master mode or during Fever
        if ((difficulty === 'master' || isFever) && Math.random() < 0.35) {
          const lane2 = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
          notes.push({ lane: lane2, y: -25, speed: baseSpeed + Math.random() * 0.8, hit: false });
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

    } else {
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
          speed: baseSpeed * 1.15,
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
    } else {
      drawTaikoMode();
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
    switchMode,
    setDifficulty,
    hitLane,
    hitTaiko,
    openSongPicker,
    closeSongPicker,
    setSongCategory,
    filterSongList,
    selectSong,
    toggleAudioMute,
    openSettle,
    closeSettle
  };
})();
window.RhythmGame = RhythmGame;
'''

with open(r'C:\Users\Ksloh\Downloads\usagii\games.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to replace old RhythmGame
pattern = re.compile(r'/\* ============================================================\s+6\.7\.\s+GAME 12:.*?\bwindow\.RhythmGame\s*=\s*RhythmGame;', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(rhythm_code.strip(), content, count=1)
    with open(r'C:\Users\Ksloh\Downloads\usagii\games.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Replaced RhythmGame in games.js")
else:
    print("ERROR: Pattern not matched in games.js")
