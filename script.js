/* ============================================================
   RÉGLAGES — à remplir avant la mise en ligne
   Envoi des demandes par Web3Forms (gratuit, sans serveur) :
   s'inscrire sur https://web3forms.com avec l'adresse qui doit
   recevoir les devis, puis coller la clé reçue ci-dessous.
   Tant que la clé est vide, la dernière étape ouvre la
   messagerie du visiteur avec la demande pré-remplie.
   ============================================================ */
const WEB3FORMS_KEY = "";
const CONTACT_EMAIL = "contact@bastion-renovation.fr";

document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- vidéo de fond (désactivée si économie de données ou animations réduites) ---------- */
const video = document.getElementById("hero-video");
const saveData = navigator.connection && navigator.connection.saveData;
if (video && !reduceMotion && !saveData) {
  let heroVisible = true;
  const play = () => { if (heroVisible && !document.hidden) video.play().catch(() => {}); };

  // fichier léger (≈ 2 Mo) : version 540p sur petit écran
  video.src = window.matchMedia("(max-width: 900px)").matches ? video.dataset.srcSmall : video.dataset.src;
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

/* ---------- mini-jeu : rénover « Tout refaire. » lettre par lettre ---------- */
(() => {
  const title = document.getElementById("title");
  const hero = document.querySelector(".hero");
  const layer = document.getElementById("shards");
  const hint = document.getElementById("hint");
  if (!title || !layer) return;

  const OLD = "#958f83"; // teinte de l'ancien enduit
  const rand = (a, b) => a + Math.random() * (b - a);

  // chaque lettre devient un bloc qu'on peut rénover
  title.querySelectorAll(".line > span").forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach((c) => {
      const ch = document.createElement("span");
      ch.className = c === "." ? "ch dot" : "ch"; // le point reste en vert fluo, hors jeu
      ch.textContent = c;
      line.append(ch);
    });
  });
  const letters = [...title.querySelectorAll(".ch:not(.dot)")];

  /* --- aspect « usé » : enduit terne, taches, fissures, éclats, peints DANS la lettre --- */
  function age(ch) {
    const w = ch.offsetWidth, h = ch.offsetHeight;
    let shapes = "";
    for (let i = 0; i < 5; i++) {
      shapes += `<ellipse cx="${rand(0, w).toFixed(1)}" cy="${rand(0, h).toFixed(1)}" rx="${rand(w * 0.15, w * 0.45).toFixed(1)}" ry="${rand(h * 0.06, h * 0.2).toFixed(1)}" fill="${Math.random() < 0.6 ? "#7b776d" : "#c4bfb3"}" opacity="${rand(0.35, 0.7).toFixed(2)}"/>`;
    }
    for (let k = 0; k < 2; k++) {
      let x = rand(w * 0.2, w * 0.8), y = rand(h * 0.15, h * 0.5);
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let j = 0; j < 5; j++) { x += rand(-w * 0.18, w * 0.18); y += h * rand(0.06, 0.14); d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      shapes += `<path d="${d}" fill="none" stroke="#3b3934" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    for (let i = 0; i < 3; i++) {
      shapes += `<circle cx="${rand(0, w).toFixed(1)}" cy="${rand(0, h).toFixed(1)}" r="${rand(2, 6).toFixed(1)}" fill="#24231f"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}</svg>`;
    ch.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), linear-gradient(${OLD}, ${OLD})`;
    ch.style.backgroundSize = `${w}px ${h}px, 100% 100%`;
    ch.classList.remove("fresh");
    ch.classList.add("worn");
  }
  // on vieillit le titre une fois les polices chargées (tailles exactes)
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => letters.forEach(age));
  setTimeout(() => title.classList.add("intro-done", "is-game"), reduceMotion ? 0 : 1300);

  /* --- moteur de particules (plaques d'enduit, gouttes de peinture) --- */
  const parts = [];
  let running = false;
  function loop(now) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const dt = Math.min((now - p.last) / 1000, 0.05);
      p.last = now; p.age += dt;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const fade = Math.max(0, Math.min(1, (p.life - p.age) / 0.4));
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) scale(${p.s ? 0.4 + 0.6 * fade : 1})`;
      p.el.style.opacity = fade;
      if (p.age >= p.life) { p.el.remove(); parts.splice(i, 1); }
    }
    if (parts.length) requestAnimationFrame(loop); else running = false;
  }
  function launch(p) {
    p.last = performance.now(); p.age = 0; parts.push(p);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  // l'ancien enduit se détache en plaques
  function strip(ch, cx, cy) {
    const hr = hero.getBoundingClientRect(), r = ch.getBoundingClientRect();
    const w = ch.offsetWidth, h = ch.offsetHeight;
    const left = r.left + r.width / 2 - w / 2 - hr.left, top = r.top + r.height / 2 - h / 2 - hr.top;
    const ix = Math.max(w * 0.2, Math.min(w * 0.8, cx - (left + hr.left)));
    const iy = Math.max(h * 0.2, Math.min(h * 0.8, cy - (top + hr.top)));
    const cs = getComputedStyle(ch);
    const n = 5, perim = 2 * (w + h), pts = [];
    for (let k = 0; k < n; k++) {
      const t = ((((k + rand(-0.3, 0.3)) / n) * perim) + perim) % perim;
      if (t < w) pts.push([t, 0]);
      else if (t < w + h) pts.push([w, t - w]);
      else if (t < 2 * w + h) pts.push([w - (t - w - h), h]);
      else pts.push([0, h - (t - 2 * w - h)]);
    }
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % n];
      const el = document.createElement("span");
      el.className = "shard";
      el.textContent = ch.firstChild.textContent;
      Object.assign(el.style, {
        width: w + "px", height: h + "px", color: OLD,
        font: cs.font, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight,
        clipPath: `polygon(${ix}px ${iy}px, ${a[0]}px ${a[1]}px, ${b[0]}px ${b[1]}px)`,
        transformOrigin: `${(ix + a[0] + b[0]) / 3}px ${(iy + a[1] + b[1]) / 3}px`,
      });
      layer.append(el);
      const mx = (a[0] + b[0]) / 2 - ix, my = (a[1] + b[1]) / 2 - iy, m = Math.hypot(mx, my) || 1;
      const sp = rand(40, 120); // les plaques tombent plus qu'elles n'explosent
      launch({ el, x: left, y: top, vx: (mx / m) * sp, vy: (my / m) * sp - rand(40, 140), g: 2100, r: 0, vr: rand(-200, 200), life: rand(1, 1.5) });
    }
  }

  // un seul rouleau, plus discret, passe sur le mot entier
  function roll(word) {
    const hr = hero.getBoundingClientRect();
    const rs = word.map((ch) => ch.getBoundingClientRect());
    const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.right));
    const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.bottom));
    const el = document.createElement("span");
    el.className = "roller";
    el.style.width = right - left + 10 + "px";
    el.style.left = left - hr.left - 5 + "px";
    el.style.top = top - hr.top + "px";
    layer.append(el);
    el.animate(
      [
        { transform: "translateY(-8px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 0.9, offset: 0.15 },
        { transform: `translateY(${bottom - top - 8}px)`, opacity: 0.9, offset: 0.8 },
        { transform: `translateY(${bottom - top}px)`, opacity: 0 },
      ],
      { duration: 560, easing: "cubic-bezier(.45, 0, .3, 1)" }
    ).onfinish = () => el.remove();
    // deux ou trois gouttes seulement
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        const d = document.createElement("i");
        d.className = "drop";
        const sz = rand(3, 6);
        d.style.width = sz + "px";
        d.style.height = sz * 1.3 + "px";
        layer.append(d);
        launch({ el: d, x: left - hr.left + rand(0, right - left), y: bottom - hr.top - 4, vx: rand(-20, 20), vy: rand(-20, 30), g: 1200, r: 0, vr: 0, life: rand(0.4, 0.7), s: true });
      }
    }, 440);
  }

  // un clic sur une lettre repeint tout le mot (« Tout », puis « refaire »)
  function renovate(ch, cx, cy) {
    if (!ch || !ch.classList.contains("worn")) return;
    const word = [...ch.parentElement.querySelectorAll(".ch.worn")];
    hint.classList.add("is-used");
    if (!reduceMotion) {
      word.forEach((l) => strip(l, cx, cy));
      roll(word);
    }
    word.forEach((l) => {
      l.classList.remove("worn");
      l.style.removeProperty("background-image");
      l.style.removeProperty("background-size");
      l.classList.add("fresh");
    });
    if (letters.every((l) => !l.classList.contains("worn"))) title.classList.remove("is-game"); // terminé : il reste propre
  }

  // clic sur un mot, ou glisser le rouleau dessus
  let painting = false;
  const letterAt = (x, y) => document.elementFromPoint(x, y)?.closest("#title .ch:not(.dot)");
  title.addEventListener("pointerdown", (e) => {
    if (!title.classList.contains("is-game")) return;
    const ch = e.target.closest(".ch:not(.dot)");
    if (!ch) return;
    e.preventDefault();
    painting = true;
    renovate(ch, e.clientX, e.clientY);
  });
  window.addEventListener("pointermove", (e) => {
    if (painting) renovate(letterAt(e.clientX, e.clientY), e.clientX, e.clientY);
  });
  ["pointerup", "pointercancel"].forEach((t) => window.addEventListener(t, () => (painting = false)));
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
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: "Site Bastion Rénovation", ...d }),
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
