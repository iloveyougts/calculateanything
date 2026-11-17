/* ============================================================
   USAGI FLOATING PARTICLES - ULTRA SMOOTH & HIGH PERFORMANCE
   GPU Accelerated, Low Overhead, Silky 60fps
   ============================================================ */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-particles-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width, height;
  let particles = [];
  let isEnabled = true;
  let lastTime = 0;

  const usagiImg = new Image();
  usagiImg.src = 'usagi_character.png';

  const ICONS = ['🥕', '✨', '🌸', '⭐', '💖', '🍰'];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -30;
      this.isImage = Math.random() < 0.2;
      this.size = this.isImage ? (Math.random() * 12 + 22) : (Math.random() * 10 + 12);
      this.speedY = Math.random() * 0.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 0.8;
      this.char = ICONS[Math.floor(Math.random() * ICONS.length)];
      this.opacity = Math.random() * 0.35 + 0.2;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotSpeed;

      if (this.y > height + 35 || this.x < -35 || this.x > width + 35) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x | 0, this.y | 0);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;

      if (this.isImage && usagiImg.complete && usagiImg.naturalWidth > 0) {
        ctx.drawImage(usagiImg, (-this.size / 2) | 0, (-this.size / 2) | 0, this.size | 0, (this.size * 1.15) | 0);
      } else {
        ctx.font = `${this.size | 0}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.char, 0, 0);
      }
      ctx.restore();
    }
  }

  // Optimized lightweight count: only 12-16 particles
  const count = Math.min(15, Math.max(8, Math.floor(window.innerWidth / 90)));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  // Interactive Click Particle Burst (点击任意位置绽放爱心、胡萝卜、闪光特效)
  window.addEventListener('click', function (e) {
    // Avoid interfering with inputs
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    const burstIcons = ['💖', '🥕', '✨', '⭐', '🌸', '🐰'];
    for (let i = 0; i < 6; i++) {
      const p = new Particle();
      p.x = e.clientX + (Math.random() - 0.5) * 16;
      p.y = e.clientY + (Math.random() - 0.5) * 16;
      p.speedY = -(Math.random() * 2.2 + 1.2); // Float upwards
      p.speedX = (Math.random() - 0.5) * 2.5;
      p.opacity = 0.95;
      p.size = Math.random() * 8 + 14;
      p.char = burstIcons[Math.floor(Math.random() * burstIcons.length)];
      p.isImage = Math.random() < 0.25;
      particles.push(p);

      // Clean up after 1.6 seconds
      setTimeout(() => {
        const idx = particles.indexOf(p);
        if (idx > -1) particles.splice(idx, 1);
      }, 1600);
    }
  }, { passive: true });

  function loop(timestamp) {
    if (isEnabled) {
      // Throttle to 60fps max
      if (timestamp - lastTime >= 15) {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();
        }
        lastTime = timestamp;
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.toggleParticles = function () {
    isEnabled = !isEnabled;
    if (!isEnabled) {
      ctx.clearRect(0, 0, width, height);
    }
    return isEnabled;
  };
})();
