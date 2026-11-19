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
