const WORDS = ["BEEP BEEP", "HONK", "VROOM", "TOOT", "ZOOM", "NYOOM"];

const CARS = [
  { body: "#7dffa8", cabin: "#e8fbff", trim: "#1b2a4a", wheel: "#222" },
  { body: "#7ad7ff", cabin: "#fff7d6", trim: "#1b2a4a", wheel: "#222" },
  { body: "#ffb3e6", cabin: "#ffffff", trim: "#1b2a4a", wheel: "#222" },
  { body: "#ffe08a", cabin: "#fff", trim: "#1b2a4a", wheel: "#222" },
  { body: "#ffb347", cabin: "#e8fbff", trim: "#1b2a4a", wheel: "#222" },
  { body: "#c9a7ff", cabin: "#fff", trim: "#1b2a4a", wheel: "#222" }
];

function carSvg(c) {
  return `<svg viewBox="0 0 160 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="80" cy="78" rx="62" ry="6" fill="rgba(27,42,74,0.18)"/>
    <path d="M22 58 L34 38 Q40 28 54 28 L92 28 Q108 28 116 40 L138 58 Z" fill="${c.body}" stroke="${c.trim}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M48 30 L58 18 H96 L108 30 Z" fill="${c.cabin}" stroke="${c.trim}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="18" y="54" width="124" height="16" rx="8" fill="${c.body}" stroke="${c.trim}" stroke-width="3"/>
    <circle cx="46" cy="70" r="12" fill="${c.wheel}" stroke="${c.trim}" stroke-width="3"/>
    <circle cx="46" cy="70" r="5" fill="#ffe08a"/>
    <circle cx="114" cy="70" r="12" fill="${c.wheel}" stroke="${c.trim}" stroke-width="3"/>
    <circle cx="114" cy="70" r="5" fill="#ffe08a"/>
    <circle cx="28" cy="60" r="4" fill="#fff59d" stroke="${c.trim}" stroke-width="2"/>
    <rect x="124" y="56" width="8" height="6" rx="2" fill="#ff6b6b" stroke="${c.trim}" stroke-width="2"/>
  </svg>`;
}

let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function blip(frequency, start, dur, type = "square", gain = 0.08) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function honk(kind = "beep") {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;
  if (kind === "honk") {
    blip(392, t, 0.22, "square", 0.09);
    blip(494, t, 0.22, "square", 0.07);
  } else {
    blip(523, t, 0.09, "square", 0.09);
    blip(659, t, 0.09, "square", 0.07);
    blip(523, t + 0.14, 0.09, "square", 0.09);
    blip(659, t + 0.14, 0.09, "square", 0.07);
  }
}

function say(x, y, text) {
  const el = document.createElement("div");
  el.className = "bubble";
  el.textContent = text || WORDS[Math.floor(Math.random() * WORDS.length)];
  el.style.left = Math.max(8, Math.min(window.innerWidth - 120, x)) + "px";
  el.style.top = Math.max(8, y) + "px";
  document.getElementById("speech").appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function spawnTraffic() {
  const layer = document.getElementById("traffic");
  const count = window.matchMedia("(max-width: 640px)").matches ? 5 : 8;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (let i = 0; i < count; i++) {
    const car = document.createElement("button");
    car.type = "button";
    car.className = "racer";
    car.innerHTML = carSvg(CARS[i % CARS.length]);
    const goingRight = i % 2 === 0;
    const top = 12 + ((i * 11) % 68);
    const dur = 7 + (i % 5) * 2.2;
    const delay = -(i * 1.7);
    car.style.top = top + "vh";
    if (!reduced) {
      car.style.animation = `${goingRight ? "drive-right" : "drive-left"} ${dur}s linear ${delay}s infinite`;
    } else {
      car.style.left = (8 + i * 12) + "vw";
    }
    car.addEventListener("click", (e) => {
      honk(Math.random() > 0.45 ? "beep" : "honk");
      say(e.clientX - 20, e.clientY - 30);
    });
    layer.appendChild(car);
  }
}

function unlock() {
  ctx();
  honk("beep");
  document.getElementById("unlock").classList.add("is-off");
}

document.getElementById("unlockBtn").addEventListener("click", unlock);

["navHonk", "bigHonk", "fabHonk", "heroCoin"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", (e) => {
    ctx();
    honk(id === "bigHonk" || id === "fabHonk" ? "beep" : "honk");
    const r = el.getBoundingClientRect();
    say(r.left + r.width / 2, r.top);
    e.stopPropagation();
  });
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const btn = document.getElementById("copyBtn");
  try {
    await navigator.clipboard.writeText("0xCAR0000000000000000000000000000000000001");
    btn.textContent = "Copied!!";
    honk("beep");
    setTimeout(() => { btn.textContent = "Copy"; }, 1400);
  } catch {
    btn.textContent = "Oops";
  }
});

spawnTraffic();

setInterval(() => {
  if (!audioCtx || audioCtx.state !== "running") return;
  if (document.hidden) return;
  if (Math.random() > 0.55) return;
  honk(Math.random() > 0.5 ? "beep" : "honk");
  say(40 + Math.random() * (window.innerWidth - 80), 80 + Math.random() * 220);
}, 4200);
