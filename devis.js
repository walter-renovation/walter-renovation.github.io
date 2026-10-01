/* Page « Demande de devis » — réutilise WEB3FORMS_KEY et CONTACT_EMAIL définis dans script.js */
(() => {
  const form = document.getElementById("devis-form");
  if (!form) return;
  const statusEl = document.getElementById("dp-status");
  const done = document.getElementById("dp-done");
  const btn = form.querySelector('[type="submit"]');

  const rules = {
    travaux: () => form.querySelectorAll('[name="travaux"]:checked').length > 0,
    commune: () => form.commune.value.trim().length > 1,
    nom: () => form.nom.value.trim().length > 1,
    telephone: () => form.telephone.value.replace(/[^\d+]/g, "").length >= 10,
    email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()),
    rgpd: () => form.rgpd.checked,
  };

  function mark(name, bad) {
    const err = form.querySelector(`[data-err="${name}"]`);
    err.classList.toggle("show", bad);
    const field = err.closest(".field");
    if (field) field.classList.toggle("bad", bad);
  }

  // l'erreur disparaît dès que le champ est corrigé
  ["input", "change"].forEach((type) =>
    form.addEventListener(type, (e) => {
      const rule = rules[e.target.name];
      if (rule && rule()) mark(e.target.name, false);
    })
  );

  function setStatus(msg, kind = "") {
    statusEl.textContent = msg;
    statusEl.className = "dp-status " + kind;
  }

  function finish(message) {
    if (message) document.getElementById("dp-done-msg").textContent = message;
    [...form.children].forEach((el) => { if (el !== done) el.hidden = true; });
    done.hidden = false;
    done.classList.add("is-active");
    done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    done.focus({ preventScroll: true });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return;

    let first = null;
    for (const [name, ok] of Object.entries(rules)) {
      const bad = !ok();
      mark(name, bad);
      if (bad && !first) first = name;
    }
    if (first) {
      const target = form.querySelector(`[name="${first}"]`);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      setStatus("Quelques champs sont à compléter.", "ko");
      return;
    }

    const d = new FormData(form);
    const v = {
      travaux: d.getAll("travaux").join(", "),
      bien: d.get("bien") || "Non précisé",
      surface: d.get("surface") ? d.get("surface") + " m²" : "Non précisée",
      commune: d.get("commune").trim(),
      delai: d.get("delai") || "Non précisé",
      budget: d.get("budget") || "Non précisé",
      message: d.get("message").trim() || "(aucun détail)",
      nom: d.get("nom").trim(),
      telephone: d.get("telephone").trim(),
      email: d.get("email").trim(),
      contact: d.get("contact"),
    };
    const subject = `Devis ${v.travaux} · ${v.commune} · ${v.nom}`;

    // pas encore de clé Web3Forms : la messagerie du visiteur s'ouvre avec la demande pré-remplie
    if (!WEB3FORMS_KEY) {
      const body = [
        `Travaux : ${v.travaux}`, `Type de bien : ${v.bien}`, `Surface : ${v.surface}`,
        `Commune : ${v.commune}`, `Démarrage : ${v.delai}`, `Budget : ${v.budget}`, "", v.message, "",
        `Nom : ${v.nom}`, `Téléphone : ${v.telephone}`, `E-mail : ${v.email}`, `Recontacter par : ${v.contact}`,
      ].join("\n");
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return finish("Votre messagerie s’ouvre avec la demande prête : il ne reste qu’à l’envoyer.");
    }

    btn.disabled = true;
    setStatus("Envoi en cours…");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: "Site Robert Walter Rénovation", replyto: v.email, ...v }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      form.reset();
      finish();
    } catch {
      setStatus(`L’envoi a échoué. Appelez-moi ou écrivez à ${CONTACT_EMAIL}.`, "ko");
    } finally {
      btn.disabled = false;
    }
  });
})();
