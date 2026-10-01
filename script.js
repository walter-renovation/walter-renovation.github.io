/* ============================================================
   RÉGLAGES — à remplir avant la mise en ligne
   Envoi des demandes par Web3Forms (gratuit, sans serveur) :
   s'inscrire sur https://web3forms.com avec l'adresse qui doit
   recevoir les devis, puis coller la clé reçue ci-dessous.
   Tant que la clé est vide, la dernière étape ouvre la
   messagerie du visiteur avec la demande pré-remplie.
   ============================================================ */
const WEB3FORMS_KEY = "";
const CONTACT_EMAIL = "contact@bastion-demolition.fr";

document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- vidéo de fond (ordinateur uniquement, pour épargner les forfaits mobiles) ---------- */
const video = document.getElementById("hero-video");
const saveData = navigator.connection && navigator.connection.saveData;
if (video && !reduceMotion && !saveData && window.matchMedia("(min-width: 900px)").matches) {
  let heroVisible = true;
  const play = () => { if (heroVisible && !document.hidden) video.play().catch(() => {}); };

  video.src = video.dataset.src;
  video.loop = true;
  video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });
  // filet de sécurité : certains navigateurs (Brave notamment) ratent la boucle d'un long fichier distant
  video.addEventListener("ended", () => { video.currentTime = 0; play(); });
  video.addEventListener("pause", () => { if (heroVisible && !document.hidden) setTimeout(play, 300); });
  video.addEventListener("stalled", play);
  // relance si l'image reste figée
  let last = -1;
  setInterval(() => {
    if (!heroVisible || document.hidden) return;
    if (video.currentTime === last) {
      if (video.duration && video.currentTime > video.duration - 0.5) video.currentTime = 0;
      play();
    }
    last = video.currentTime;
  }, 2000);
  // pause hors écran (économie de batterie), reprise au retour
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    heroVisible ? play() : video.pause();
  }).observe(document.querySelector(".hero"));
  document.addEventListener("visibilitychange", play);
  play();
}

/* ---------- en-tête qui se pose, parallaxe et fondu du hero ---------- */
const header = document.querySelector(".top");
const media = document.getElementById("hero-media");
const heroIn = document.querySelector(".hero__in");
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  header.classList.toggle("is-scrolled", y > 40);
  if (media && heroIn && !reduceMotion && y < vh * 1.1) {
    media.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
    const k = Math.min(y / (vh * 0.7), 1);
    heroIn.style.opacity = String(1 - k);
    heroIn.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
  }
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

/* ---------- découpage des titres en mots (ou en caractères) ---------- */
document.querySelectorAll("[data-split]").forEach((el) => {
  const chars = el.dataset.split === "chars";
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        const parts = chars ? [...child.textContent] : child.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(chars ? " " : part); return; }
          const w = document.createElement("span");
          w.className = "w";
          const inner = document.createElement("span");
          inner.textContent = part;
          inner.style.setProperty("--i", i++);
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  if (!el.hasAttribute("aria-label") && !chars) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  walk(el);
});

/* ---------- fondus à l'entrée ET à la sortie, dans les deux sens ---------- */
const revealables = document.querySelectorAll("[data-reveal], [data-split]");
document.querySelectorAll(".panel[data-reveal]").forEach((p, i) => p.style.setProperty("--d", `${i * 0.12}s`));

function setState(el, entry) {
  if (entry.isIntersecting) {
    el.classList.add("is-in");
    el.classList.remove("is-above");
  } else {
    el.classList.remove("is-in");
    // sorti par le haut : il s'efface vers le haut ; par le bas : vers le bas
    el.classList.toggle("is-above", entry.boundingClientRect.top < 0);
  }
}

if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => setState(e.target, e)),
    { threshold: 0.12, rootMargin: "-4% 0px -6% 0px" });
  // les panneaux sont entièrement masqués au départ : on surveille leur conteneur
  revealables.forEach((el) => { if (!el.classList.contains("panel")) io.observe(el); });
  const panels = document.querySelector(".panels");
  if (panels) new IntersectionObserver(([e]) => panels.querySelectorAll(".panel").forEach((p) => setState(p, e)),
    { threshold: 0.2 }).observe(panels);
} else {
  revealables.forEach((el) => el.classList.add("is-in"));
}

/* ---------- mini-jeu : démolir « Place nette. » lettre par lettre ---------- */
(() => {
  const title = document.getElementById("title");
  const hero = document.querySelector(".hero");
  const layer = document.getElementById("shards");
  const hint = document.getElementById("hint");
  const rebuild = document.getElementById("rebuild");
  if (!title || !layer) return;

  // chaque lettre devient un bloc qu'on peut frapper
  title.querySelectorAll(".line > span").forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach((c) => {
      const ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = c;
      line.append(ch);
    });
  });
  const letters = [...title.querySelectorAll(".ch")];
  setTimeout(() => title.classList.add("intro-done", "is-game"), reduceMotion ? 0 : 1300);

  const rand = (a, b) => a + Math.random() * (b - a);
  const parts = []; // éclats et poussière en mouvement
  let running = false;

  function loop(now) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const dt = Math.min((now - p.last) / 1000, 0.05);
      p.last = now;
      p.age += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      const fade = Math.max(0, Math.min(1, (p.life - p.age) / 0.45));
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) scale(${p.s ? 0.4 + 0.6 * fade : 1})`;
      p.el.style.opacity = fade;
      if (p.age >= p.life) { p.el.remove(); parts.splice(i, 1); }
    }
    if (parts.length) requestAnimationFrame(loop); else running = false;
  }
  function launch(p) {
    p.last = performance.now();
    p.age = 0;
    parts.push(p);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function dust(cx, cy, n) {
    if (reduceMotion) return;
    const h = hero.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      el.className = "dust";
      const size = rand(3, 8);
      el.style.width = el.style.height = size + "px";
      if (Math.random() < 0.25) el.style.background = "#8f8b82";
      layer.append(el);
      launch({ el, x: cx - h.left, y: cy - h.top, vx: rand(-320, 320), vy: rand(-520, -120), g: 1600, r: rand(0, 90), vr: rand(-360, 360), life: rand(0.6, 1.2), s: true });
    }
  }

  // fissures dessinées DANS la lettre : on peint le texte avec un fond (couleur + fissures) découpé sur les glyphes
  function crack(ch, cx, cy) {
    const w = ch.offsetWidth, hgt = ch.offsetHeight;
    const r = ch.getBoundingClientRect();
    const ix = Math.max(w * 0.2, Math.min(w * 0.8, cx - r.left));
    const iy = Math.max(hgt * 0.25, Math.min(hgt * 0.75, cy - r.top));
    let paths = "";
    const rays = 4 + Math.floor(Math.random() * 2);
    for (let k = 0; k < rays; k++) {
      const a = (k / rays) * Math.PI * 2 + rand(-0.5, 0.5);
      const len = Math.max(w, hgt) * rand(0.45, 0.9);
      let d = `M${ix.toFixed(1)} ${iy.toFixed(1)}`;
      for (let j = 1; j <= 5; j++) {
        const t = (len * j) / 5;
        d += ` L${(ix + Math.cos(a) * t + rand(-5, 5)).toFixed(1)} ${(iy + Math.sin(a) * t + rand(-5, 5)).toFixed(1)}`;
      }
      paths += `<path d="${d}"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}"><g fill="none" stroke="#0e0e0d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g><circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="5" fill="#0e0e0d"/></svg>`;
    ch.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), linear-gradient(#e2dfd7, #e2dfd7)`;
    ch.style.backgroundSize = `${w}px ${hgt}px, 100% 100%`;
    ch.classList.add("cracked");
  }

  function shatter(ch, cx, cy) {
    if (reduceMotion) return;
    const h = hero.getBoundingClientRect();
    const r = ch.getBoundingClientRect();
    const w = ch.offsetWidth, hgt = ch.offsetHeight;
    const left = r.left + r.width / 2 - w / 2 - h.left;
    const top = r.top + r.height / 2 - hgt / 2 - h.top;
    const ix = Math.max(w * 0.2, Math.min(w * 0.8, cx - (left + h.left)));
    const iy = Math.max(hgt * 0.2, Math.min(hgt * 0.8, cy - (top + h.top)));
    const cs = getComputedStyle(ch);
    const tilt = parseFloat(ch.style.getPropertyValue("--tilt")) || 0;

    // points répartis sur le contour de la lettre, reliés au point d'impact
    const n = 9, perim = 2 * (w + hgt), pts = [];
    for (let k = 0; k < n; k++) {
      let t = ((k + rand(-0.3, 0.3)) / n) * perim;
      t = (t + perim) % perim;
      if (t < w) pts.push([t, 0]);
      else if (t < w + hgt) pts.push([w, t - w]);
      else if (t < 2 * w + hgt) pts.push([w - (t - w - hgt), hgt]);
      else pts.push([0, hgt - (t - 2 * w - hgt)]);
    }
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % n];
      const el = document.createElement("span");
      el.className = "shard";
      el.textContent = ch.firstChild.textContent;
      Object.assign(el.style, {
        width: w + "px", height: hgt + "px",
        font: cs.font, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight,
        clipPath: `polygon(${ix}px ${iy}px, ${a[0]}px ${a[1]}px, ${b[0]}px ${b[1]}px)`,
        transformOrigin: `${(ix + a[0] + b[0]) / 3}px ${(iy + a[1] + b[1]) / 3}px`,
      });
      layer.append(el);
      const mx = (a[0] + b[0]) / 2 - ix, my = (a[1] + b[1]) / 2 - iy;
      const m = Math.hypot(mx, my) || 1;
      const sp = rand(180, 480);
      launch({ el, x: left, y: top, vx: (mx / m) * sp + rand(-60, 60), vy: (my / m) * sp - rand(200, 450), g: 2300, r: tilt, vr: rand(-420, 420), life: rand(1.3, 2) });
    }
  }

  function shake() {
    if (reduceMotion) return;
    title.classList.remove("shake");
    void title.offsetWidth;
    title.classList.add("shake");
  }

  title.addEventListener("pointerdown", (e) => {
    const ch = e.target.closest(".ch");
    if (!ch || !title.classList.contains("is-game") || ch.classList.contains("gone")) return;
    e.preventDefault();
    hint.classList.add("is-used");
    shake();
    if (!ch.dataset.hits) {
      ch.dataset.hits = "1";
      crack(ch, e.clientX, e.clientY);
      ch.style.setProperty("--tilt", `${rand(4, 9) * (Math.random() < 0.5 ? -1 : 1)}deg`);
      ch.classList.add("hit1");
      dust(e.clientX, e.clientY, 8);
    } else {
      shatter(ch, e.clientX, e.clientY);
      ch.classList.add("gone");
      dust(e.clientX, e.clientY, 18);
      if (letters.every((l) => l.classList.contains("gone"))) setTimeout(() => (rebuild.hidden = false), 700);
    }
  });

  rebuild.addEventListener("click", () => {
    rebuild.hidden = true;
    letters.forEach((ch, i) => {
      delete ch.dataset.hits;
      ch.classList.remove("hit1", "gone");
      ch.style.removeProperty("--tilt");
      ch.classList.remove("cracked");
      ch.style.removeProperty("background-image");
      ch.style.removeProperty("background-size");
      ch.style.setProperty("--rd", `${i * 0.06}s`);
      ch.classList.add("drop");
      ch.addEventListener("animationend", () => ch.classList.remove("drop"), { once: true });
    });
  });
})();

/* ---------- formulaire en 3 étapes ---------- */
if (document.getElementById("wizard")) {
const form = document.getElementById("wizard");
const steps = [...form.querySelectorAll(".step")];
const bar = document.getElementById("bar");
const count = document.getElementById("count");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const nav = document.getElementById("nav");
const LAST = 3;
let current = 1;

const valid = {
  1: () => !!form.querySelector('[name="travaux"]:checked'),
  2: () => form.commune.value.trim().length > 1,
  3: () => form.nom.value.trim().length > 1 && form.telephone.value.replace(/[^\d+]/g, "").length >= 10,
};

function show(n) {
  current = n;
  steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));
  form.querySelectorAll(".err").forEach((e) => e.classList.remove("show"));
  const done = n > LAST;
  bar.style.transform = `scaleX(${Math.min(n, LAST) / LAST})`;
  count.textContent = done ? "Demande envoyée" : `Étape ${n} sur ${LAST}`;
  prev.hidden = n === 1 || done;
  nav.hidden = done;
  next.textContent = n === LAST ? "Envoyer ma demande" : "Continuer";
  const target = done ? steps.find((s) => s.dataset.step === "4") : steps[n - 1].querySelector("input");
  if (target && document.activeElement !== document.body) target.focus({ preventScroll: true });
}

// étape 1 : un clic (souris ou doigt) sur un choix passe directement à la suite ;
// au clavier, les flèches changent juste la sélection
let keyboard = false;
const step1 = steps[0];
step1.addEventListener("keydown", () => (keyboard = true));
step1.addEventListener("change", () => {
  if (!keyboard) setTimeout(() => show(2), 220);
  keyboard = false;
});

prev.addEventListener("click", () => show(current - 1));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.botcheck.checked) return;
  if (!valid[current]()) {
    form.querySelector(`.err[data-for="${current}"]`).classList.add("show");
    return;
  }
  if (current < LAST) return show(current + 1);
  await send();
});

async function send() {
  const d = Object.fromEntries(new FormData(form));
  delete d.botcheck;
  d.surface = d.surface || "Non précisée";
  const subject = `Devis ${d.travaux} · ${d.commune.trim()} · ${d.nom.trim()}`;

  if (!WEB3FORMS_KEY) {
    const body = `Chantier : ${d.travaux}\nCommune : ${d.commune}\nSurface : ${d.surface}\n\nNom : ${d.nom}\nTéléphone : ${d.telephone}\n\n${d.message || ""}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById("done-msg").textContent = "Votre messagerie s’ouvre avec la demande prête : il ne reste qu’à l’envoyer.";
    return show(LAST + 1);
  }

  next.disabled = true;
  next.textContent = "Envoi…";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: "Site Bastion Démolition", ...d }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    form.reset();
    show(LAST + 1);
  } catch {
    const err = form.querySelector('.err[data-for="3"]');
    err.textContent = "L’envoi a échoué. Appelez-moi au 06 00 00 00 00.";
    err.classList.add("show");
    next.textContent = "Réessayer";
  } finally {
    next.disabled = false;
  }
}

show(1);
}
