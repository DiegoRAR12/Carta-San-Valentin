const pages = [...document.querySelectorAll(".page")];
let current = 0;
let isAnimating = false;

/* ---------- Audio ---------- */
const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
let musicOn = false;

if (music) {
  music.volume = 0.15; // volumen suave por default
}

musicBtn?.addEventListener("click", async () => {
  if(!music) return;

  try{
    if(!musicOn){
      await music.play();
      musicOn = true;
      musicBtn.classList.add("playing");
      musicBtn.textContent = "⏸ Música";
    } else {
      music.pause();
      musicOn = false;
      musicBtn.classList.remove("playing");
      musicBtn.textContent = "▶ Música";
    }
  } catch (err){
    console.log("No se pudo reproducir:", err);
  }
});

/* ---------- Z-INDEX ---------- */
function setupZIndex(){
  const n = pages.length;
  pages.forEach((p, i) => (p.style.zIndex = String(n - i)));
}

/* ---------- Typewriter ---------- */
function runTypewriter(el, speed = 16){
  if(!el) return;

  if(!el.dataset.fulltext){
    el.dataset.fulltext = el.textContent.trim();
  }

  const full = el.dataset.fulltext;
  el.textContent = "";
  el.classList.add("typewriter-caret");

  let i = 0;
  function tick(){
    if(!pages[current] || !pages[current].contains(el)) return;
    el.textContent = full.slice(0, i);
    i++;
    if(i <= full.length) setTimeout(tick, speed);
    else el.classList.remove("typewriter-caret");
  }
  tick();
}

/* ---------- Confetti ---------- */
const canvas = document.getElementById("confetti");
const ctx = canvas?.getContext("2d");

let fxRAF = null;          // id del requestAnimationFrame actual
let fxStop = null;         // función para detener el efecto actual

function stopCanvasFX(){
  if (fxRAF) cancelAnimationFrame(fxRAF);
  fxRAF = null;
  if (typeof fxStop === "function") fxStop();
  fxStop = null;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resize(){
  if(!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function burstConfetti(intensity = 160){
  stopCanvasFX();
  if(!canvas || !ctx) return;

  confetti = Array.from({length:intensity}, () => ({
    x: canvas.width * (0.35 + Math.random()*0.30),
    y: canvas.height * 0.18 + Math.random()*20,
    r: 2 + Math.random()*5,
    vx: -2 + Math.random()*4,
    vy: 2 + Math.random()*5,
    a: Math.random()*Math.PI*2,
    life: 70 + Math.floor(Math.random()*50)
  }));

  function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.a += 0.12;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.globalAlpha = Math.max(0, p.life/110);
      ctx.fillStyle = `hsl(${(p.x + p.y) % 360} 90% 65%)`;
      ctx.fillRect(-p.r, -p.r, p.r*2.6, p.r*2.6);
      ctx.restore();
    });

    confetti = confetti.filter(p => p.life > 0 && p.y < canvas.height + 50);
    if(confetti.length > 0) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  tick();
}

function burstFireworksHearts(durationMs = 5200){
  if(!canvas || !ctx) return;

  stopCanvasFX(); // <- clave anti-freeze

  const rockets = [];
  const hearts = [];
  const rand = (a,b) => a + Math.random()*(b-a);

  const W = canvas.width;
  const H = canvas.height;

  // corazón dibujado en canvas
  function drawHeart(x, y, size, rot, alpha){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    const s = size;
    ctx.moveTo(0, s*0.35);
    ctx.bezierCurveTo(0, 0, -s*0.5, 0, -s*0.5, s*0.35);
    ctx.bezierCurveTo(-s*0.5, s*0.7, 0, s*0.95, 0, s*1.15);
    ctx.bezierCurveTo(0, s*0.95, s*0.5, s*0.7, s*0.5, s*0.35);
    ctx.bezierCurveTo(s*0.5, 0, 0, 0, 0, s*0.35);
    ctx.closePath();

    const hue = rand(330, 355);
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function spawnRocket(){
    rockets.push({
      x: rand(W*0.12, W*0.88),
      y: H + 20,
      vx: rand(-0.7, 0.7),
      vy: rand(-11.5, -14.0),
      life: rand(40, 65),
      exploded: false
    });
  }

  function explode(r){
    const count = Math.floor(rand(16, 26)); // controlado (no se traba)
    for(let i=0;i<count;i++){
      hearts.push({
        x: r.x,
        y: r.y,
        vx: rand(-3.2, 3.2),
        vy: rand(-3.2, 2.2),
        g: 0.08,
        rot: rand(0, Math.PI*2),
        vr: rand(-0.12, 0.12),
        size: rand(7, 13),
        life: rand(70, 110),
        maxLife: 110
      });
    }
  }

  const start = performance.now();
  let lastSpawn = 0;

  // permite detener desde stopCanvasFX
  fxStop = () => {
    rockets.length = 0;
    hearts.length = 0;
  };

  function frame(t){
    ctx.clearRect(0,0,W,H);

    // spawns durante duración
    if(t - start < durationMs){
      if(t - lastSpawn > 140){ // un poco menos frecuente
        spawnRocket();
        lastSpawn = t;
      }
    }

    // rockets
    for(const r of rockets){
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.12;
      r.life -= 1;

      // trail
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "rgba(255,77,141,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.vx*4, r.y - r.vy*4);
      ctx.stroke();
      ctx.restore();

      if(!r.exploded && (r.life <= 0 || r.y < H*0.28)){
        r.exploded = true;
        explode(r);
      }
    }

    // limpia rockets
    for(let i=rockets.length-1;i>=0;i--){
      if(rockets[i].exploded && rockets[i].life < -12) rockets.splice(i,1);
    }

    // hearts
    for(const p of hearts){
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      p.life -= 1;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      drawHeart(p.x, p.y, p.size, p.rot, alpha);
    }

    // limpia hearts
    for(let i=hearts.length-1;i>=0;i--){
      if(hearts[i].life <= 0 || hearts[i].y > H + 60) hearts.splice(i,1);
    }

    const still = (t - start < durationMs) || rockets.length || hearts.length;
    if(still){
      fxRAF = requestAnimationFrame(frame);
    }else{
      stopCanvasFX();
    }
  }

  fxRAF = requestAnimationFrame(frame);
}


/* ---------- Efectos por página ---------- */
function applyPageEffects(pageEl){
  if(!pageEl) return;

  const tw = pageEl.querySelector(".typewriter");
  if(tw) runTypewriter(tw, 16);

  if(pageEl.querySelector(".pop-card.fireworks")){
    burstConfetti(220);
  }
}

/* ---------- Reset limpio ---------- */
function hardResetTo(target){
  pages.forEach(p => {
    p.classList.remove("active", "turned", "flipping");
    p.style.transform = "";
  });

  current = target;
  pages[current].classList.add("active");
  isAnimating = false;
  applyPageEffects(pages[current]);
}

/* ---------- Flip ---------- */
function goTo(target){
  if(isAnimating) return;
  if(target < 0 || target >= pages.length) return;
  if(target === current) return;

  // salto grande: reset limpio (evita bugs)
  if(Math.abs(target - current) > 1){
    hardResetTo(target);
    return;
  }

  isAnimating = true;

  const from = pages[current];
  const to = pages[target];
  const forward = target > current;

  to.classList.add("active");

  const maxZ = 9999;
  const oldFromZ = from.style.zIndex;
  const oldToZ = to.style.zIndex;

  if(forward){
    from.style.zIndex = String(maxZ);
    from.classList.add("flipping");
    void from.offsetWidth;
    from.style.transform = "rotateY(-180deg)";

    from.addEventListener("transitionend", function onEnd(e){
      if(e.propertyName !== "transform") return;
      from.removeEventListener("transitionend", onEnd);

      from.classList.remove("active", "flipping");
      from.classList.add("turned");
      from.style.zIndex = oldFromZ;

      current = target;
      applyPageEffects(pages[current]);
      isAnimating = false;
    });

  } else {
    to.style.zIndex = String(maxZ);
    to.classList.add("flipping");
    to.classList.remove("turned");

    to.style.transform = "rotateY(-180deg)";
    void to.offsetWidth;
    to.style.transform = "rotateY(0deg)";

    to.addEventListener("transitionend", function onEnd(e){
      if(e.propertyName !== "transform") return;
      to.removeEventListener("transitionend", onEnd);

      from.classList.remove("active");
      to.classList.remove("flipping");
      to.style.zIndex = oldToZ;
      to.style.transform = "";

      current = target;
      applyPageEffects(pages[current]);
      isAnimating = false;
    });
  }
}

function next(){ goTo(current + 1); }
function prev(){ goTo(current - 1); }

/* ---------- UI ---------- */
document.getElementById("startBtn")?.addEventListener("click", async () => {
  if(music){
    music.currentTime = 41;  // segundo exacto
    music.volume = 0.15;
    try { await music.play(); } catch {}
    musicOn = true;
    musicBtn?.classList.add("playing");
    if(musicBtn) musicBtn.textContent = "⏸ Música";
  }
  next();
});

document.getElementById("restartBtn")?.addEventListener("click", () => hardResetTo(0));
document.getElementById("confettiBtn")?.addEventListener("click", () => {
  burstFireworksHearts(5200);
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if(!btn) return;
  if(btn.dataset.action === "next") next();
  if(btn.dataset.action === "prev") prev();
});

document.addEventListener("keydown", (e) => {
  if(e.key === "ArrowRight") next();
  if(e.key === "ArrowLeft") prev();
});

/* ---------- Lengüeta lateral (slide tab) ---------- */
function initSlideTabs(){
  const items = document.querySelectorAll("[data-photo-slide]");

  items.forEach(el => {
    const handle = el.querySelector(".slide-handle");
    if(!handle) return;

    handle.addEventListener("click", () => el.classList.toggle("open"));

    let startX = 0;
    let dragging = false;

    handle.addEventListener("pointerdown", e => {
      dragging = true;
      startX = e.clientX;
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener("pointermove", e => {
      if(!dragging) return;
      const dx = e.clientX - startX;
      if(dx > 60) el.classList.add("open");
      if(dx < -60) el.classList.remove("open");
    });

    function end(){ dragging = false; }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });
}

/* ---------- init ---------- */
setupZIndex();
hardResetTo(0);
initSlideTabs();

