/* ============================================================
   USAGI KAWAII SYNTHESIZER SOUND ENGINE (Web Audio API)
   Zero external dependencies, instant response, kawaii sound effects!
   ============================================================ */

const UsagiSound = (function () {
  let audioCtx = null;
  let isMuted = localStorage.getItem('usagi_muted') === 'true';

  function initCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (isMuted) return;
    try {
      initCtx();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  return {
    pop: function () {
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    },

    coin: function () {
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    },

    water: function () {
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    },

    sparkle: function () {
      if (isMuted) return;
      initCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          playTone(freq, 'sine', 0.2, 0.08);
        }, i * 55);
      });
    },

    yaha: function () {
      // Usagi's energetic celebratory "YAHA!" fanfare chord
      if (isMuted) return;
      initCtx();
      const chords = [
        [523.25, 659.25, 783.99], // C
        [587.33, 739.99, 880.00], // D
        [659.25, 830.61, 987.77], // E
        [1046.50, 1318.51, 1567.98] // High C
      ];
      chords.forEach((chord, i) => {
        setTimeout(() => {
          chord.forEach(freq => playTone(freq, 'triangle', 0.22, 0.09));
        }, i * 90);
      });
    },

    woodenFish: function () {
      // 真实佛系高保真沉香木鱼敲击声学物理合成 (Tok! 空灵厚重空腔共鸣)
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;

      // 1. 木槌敲击硬木瞬间的高频清脆瞬态脉冲 (Mallet contact click)
      const clickOsc = audioCtx.createOscillator();
      const clickGain = audioCtx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1600, now);
      clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
      clickGain.gain.setValueAtTime(0.45, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      clickOsc.connect(clickGain);
      clickGain.connect(audioCtx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.026);

      // 2. 木鱼中空腹腔的主体浑厚共鸣 (Hollow wooden body cavity resonance)
      const bodyOsc = audioCtx.createOscillator();
      const bodyGain = audioCtx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(435, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(395, now + 0.18);
      bodyGain.gain.setValueAtTime(0.68, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(audioCtx.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.23);

      // 3. 檀木木质泛音 (Wood grain acoustic overtones)
      const toneOsc = audioCtx.createOscillator();
      const toneGain = audioCtx.createGain();
      toneOsc.type = 'triangle';
      toneOsc.frequency.setValueAtTime(840, now);
      toneOsc.frequency.exponentialRampToValueAtTime(680, now + 0.09);
      toneGain.gain.setValueAtTime(0.25, now);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      toneOsc.connect(toneGain);
      toneGain.connect(audioCtx.destination);
      toneOsc.start(now);
      toneOsc.stop(now + 0.11);

      // 4. 空灵空间尾音扩散 (Subtle ambient warmth)
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(220, now);
      subGain.gain.setValueAtTime(0.20, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      subOsc.connect(subGain);
      subGain.connect(audioCtx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.29);
    },

    hammerSmash: function (isHitMonster = true) {
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;

      // 1. 重锤猛击低频冲击波 (Heavy mallet thump)
      const thumpOsc = audioCtx.createOscillator();
      const thumpGain = audioCtx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(260, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
      thumpGain.gain.setValueAtTime(0.55, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(audioCtx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.16);

      // 2. 趣味卡通冲击声 (Comic impact crack / squeak)
      const crackOsc = audioCtx.createOscillator();
      const crackGain = audioCtx.createGain();
      crackOsc.type = isHitMonster ? 'sawtooth' : 'sine';
      crackOsc.frequency.setValueAtTime(isHitMonster ? 880 : 540, now);
      crackOsc.frequency.exponentialRampToValueAtTime(isHitMonster ? 180 : 320, now + 0.08);
      crackGain.gain.setValueAtTime(isHitMonster ? 0.35 : 0.25, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      crackOsc.connect(crackGain);
      crackGain.connect(audioCtx.destination);
      crackOsc.start(now);
      crackOsc.stop(now + 0.10);
    },

    hit: function () {
      if (isMuted) return;
      initCtx();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    },

    gacha: function () {
      if (isMuted) return;
      initCtx();
      [320, 420, 520, 680, 880, 1046].forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 'triangle', 0.08, 0.14);
        }, idx * 55);
      });
    },

    fanfare: function () {
      if (isMuted) return;
      initCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          playTone(freq, 'sine', 0.25, 0.15);
        }, i * 75);
      });
    },

    boing: function () {
      // Elastic cartoon spring bounce sound (when Usagi hits screen walls / bounces)
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.28);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } catch (e) {}
    },

    whoosh: function () {
      // Flying through the air when thrown
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    },

    pianoTone: function (freq = 523.25) {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } catch (e) {}
    },

    feverIgnite: function () {
      // Explosive Fever Mode ignition (5-Perfect streak!)
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        // Rising power-up synth
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Celebratory sparkle chime chords
        [659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
          setTimeout(() => playTone(f, 'triangle', 0.25, 0.12), i * 40);
        });
      } catch (e) {}
    },

    taikoDon: function () {
      // Deep bass punchy Taiko Drum DON!
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    },

    taikoKa: function () {
      // High-pitched crisp Taiko Rim KA!
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    },

    perfectHit: function () {
      // Crisp sparkling chime for PERFECT hit
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1174.66, now); // D6
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } catch (e) {}
    },

    // 乌萨奇从高处跌落的可爱惊叫 + 着地冲击音效
    tossLand: function (impactForce = 1.0) {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const force = Math.min(1.5, Math.max(0.3, impactForce));

        // 1. 着地冲击低频震动 (地面震荡感)
        const impactOsc = audioCtx.createOscillator();
        const impactGain = audioCtx.createGain();
        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(180 * force, now);
        impactOsc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
        impactGain.gain.setValueAtTime(0.4 * force, now);
        impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        impactOsc.connect(impactGain);
        impactGain.connect(audioCtx.destination);
        impactOsc.start(now);
        impactOsc.stop(now + 0.21);

        // 2. 卡通弹性回弹音 (Boing squish)
        const boingOsc = audioCtx.createOscillator();
        const boingGain = audioCtx.createGain();
        boingOsc.type = 'sine';
        boingOsc.frequency.setValueAtTime(220, now + 0.04);
        boingOsc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
        boingOsc.frequency.exponentialRampToValueAtTime(340, now + 0.22);
        boingGain.gain.setValueAtTime(0.18 * force, now + 0.04);
        boingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        boingOsc.connect(boingGain);
        boingGain.connect(audioCtx.destination);
        boingOsc.start(now + 0.04);
        boingOsc.stop(now + 0.31);

        // 3. 可爱星星散落音 (高频碎闪)
        [1046.50, 1318.51, 1567.98].forEach((freq, i) => {
          setTimeout(() => playTone(freq, 'sine', 0.12, 0.06 * force), 60 + i * 35);
        });
      } catch (e) {}
    },

    // 乌萨奇飞行中可爱的呼呼声
    tossFlying: function () {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    },

    // ============================================================
    // 卡通高空跌落与眩晕眼冒金星音效系统 (超滑稽搞笑卡通声学物理)
    // ============================================================

    // 1. 卡通下落滑音口哨 (Cartoon Slide Whistle Falling: 呜——优——滑落)
    fallSlideWhistle: function () {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const duration = 0.85;

        // 主哨音 (高音快速往下滑降)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + duration);

        // 微颤音 (滑音哨特有的气流震荡)
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(12, now);
        lfoGain.gain.setValueAtTime(18, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + duration);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.24, now + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    },

    // 2. 卡通触地搞笑扁压与橡胶叫声 (Splat + Squeak + Boink)
    cartoonSplatBoink: function (intensity = 1.0) {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const force = Math.min(1.5, Math.max(0.4, intensity));

        // 扁压低频重击 (Thud)
        const thudOsc = audioCtx.createOscillator();
        const thudGain = audioCtx.createGain();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(240 * force, now);
        thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.16);
        thudGain.gain.setValueAtTime(0.55 * force, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        thudOsc.connect(thudGain);
        thudGain.connect(audioCtx.destination);
        thudOsc.start(now);
        thudOsc.stop(now + 0.19);

        // 卡通搞笑挤压尖叫 (Rubber Duck Squeak)
        const squeakOsc = audioCtx.createOscillator();
        const squeakGain = audioCtx.createGain();
        squeakOsc.type = 'sine';
        squeakOsc.frequency.setValueAtTime(650, now + 0.03);
        squeakOsc.frequency.exponentialRampToValueAtTime(1450, now + 0.09);
        squeakOsc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
        squeakGain.gain.setValueAtTime(0.25 * force, now + 0.03);
        squeakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        squeakOsc.connect(squeakGain);
        squeakGain.connect(audioCtx.destination);
        squeakOsc.start(now + 0.03);
        squeakOsc.stop(now + 0.23);

        // 弹簧余震 (Cartoon Spring Boing)
        const boingOsc = audioCtx.createOscillator();
        const boingGain = audioCtx.createGain();
        boingOsc.type = 'sine';
        boingOsc.frequency.setValueAtTime(280, now + 0.1);
        boingOsc.frequency.exponentialRampToValueAtTime(720, now + 0.22);
        boingOsc.frequency.exponentialRampToValueAtTime(360, now + 0.38);
        boingGain.gain.setValueAtTime(0.18 * force, now + 0.1);
        boingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        boingOsc.connect(boingGain);
        boingGain.connect(audioCtx.destination);
        boingOsc.start(now + 0.1);
        boingOsc.stop(now + 0.43);
      } catch (e) {}
    },

    // 3. 卡通眩晕眼冒金星与小鸟转圈声 (Dizzy Warble & Tweety Birds)
    dizzyStarsWarble: function () {
      if (isMuted) return;
      try {
        initCtx();
        const now = audioCtx.currentTime;
        const duration = 1.35;

        // 眩晕波动主音 (Wobble-wobble-wobble 旋转眩晕声)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);

        // 5.5Hz 经典卡通头晕震颤 LFO
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(5.8, now);
        lfoGain.gain.setValueAtTime(75, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + duration);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);

        // 伴随可爱小鸟唧唧啾啾叫与金星碎响 (Tweety Birds chirp / Sparkles)
        const birdNotes = [1760, 2093, 2349, 1975, 2637, 2093];
        birdNotes.forEach((f, idx) => {
          setTimeout(() => {
            if (isMuted) return;
            const bNow = audioCtx.currentTime;
            const bOsc = audioCtx.createOscillator();
            const bGain = audioCtx.createGain();
            bOsc.type = 'sine';
            bOsc.frequency.setValueAtTime(f, bNow);
            bOsc.frequency.exponentialRampToValueAtTime(f * 1.15, bNow + 0.04);
            bOsc.frequency.exponentialRampToValueAtTime(f * 0.9, bNow + 0.1);
            bGain.gain.setValueAtTime(0.07, bNow);
            bGain.gain.exponentialRampToValueAtTime(0.001, bNow + 0.11);
            bOsc.connect(bGain);
            bGain.connect(audioCtx.destination);
            bOsc.start(bNow);
            bOsc.stop(bNow + 0.12);
          }, idx * 170);
        });
      } catch (e) {}
    },

    // 4. 阿尼亚专属哇酷哇酷欢呼音 (Anya Waku Waku Celebration Fanfare)
    anyaWakuWaku: function () {
      if (isMuted) return;
      try {
        initCtx();
        const notes = [659.25, 783.99, 987.77, 1318.51];
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, 'triangle', 0.18, 0.12), i * 65);
        });
      } catch (e) {}
    },

    toggleMute: function () {
      isMuted = !isMuted;
      localStorage.setItem('usagi_muted', isMuted);
      return isMuted;
    },

    isMuted: function () {
      return isMuted;
    }
  };
})();
window.UsagiSound = UsagiSound;
