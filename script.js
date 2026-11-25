/* ===== Utilitaires ===== */
const $ = id => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = v => Math.min(100, Math.max(0, parseInt(v, 10) || 0));
const initialesDe = nom => (nom || 'P').split(/\s+/).filter(Boolean)
  .map(w => w[0]).slice(0, 2).join('').toUpperCase();
const KEY = 'portfolio-draft-musicien';

/* ===== Démarrage ===== */
document.addEventListener('DOMContentLoaded', () => {
  renderAll(getData());
  initNav();
  initReveal();
  initPlayers();
});

// Si l'URL contient ?preview=1, on affiche le brouillon de l'éditeur
function getData() {
  if (new URLSearchParams(location.search).has('preview')) {
    try {
      const draft = localStorage.getItem(KEY);
      if (draft) return JSON.parse(draft);
    } catch (e) { console.warn('Brouillon illisible', e); }
  }
  return PORTFOLIO_DATA;
}

// Affiche ou masque une section et son lien de navigation
function show(id, visible) {
  const s = $(id);
  if (s) s.hidden = !visible;
  document.querySelectorAll(`.nav-links a[href="#${id}"]`).forEach(a => a.hidden = !visible);
}

const periodeTag = (type, extra) => `<span class="period">${esc(type)}${extra ? ' · ' + esc(extra) : ''}</span>`;

/* ===== Rendu du contenu ===== */
function renderAll(d) {
  const p = d.personal || {};
  const initiales = initialesDe(p.nom);

  document.title = `${p.nom || 'Portfolio'}${p.titre ? ' — ' + p.titre.split('|')[0].trim() : ''}`;
  $('logo').textContent = initiales;

  // Accueil
  $('heroNom').textContent = p.nom || '';
  $('heroTagline').textContent = p.tagline || '';
  const roles = (p.titre || '').split('|').map(s => s.trim()).filter(Boolean);
  typeRoles(roles.length ? roles : [''], $('heroTitre'));

  const cv = $('cvBtn');
  cv.hidden = !p.cv;
  if (p.cv) cv.href = p.cv;

  $('heroPhoto').innerHTML = `
    <div class="photo-ring">
      ${p.photo
        ? `<img src="${esc(p.photo)}" alt="${esc(p.nom)}">`
        : `<div class="photo-initials">${esc(initiales)}</div>`}
    </div>`;

  // Citation
  const cit = d.citation || {};
  show('citation', !!cit.texte);
  $('verseText').textContent = cit.texte ? `« ${cit.texte} »` : '';
  $('verseRef').textContent = cit.reference || '';

  // À propos
  $('aboutText').textContent = d.about || '';
  $('aboutInfos').innerHTML = [
    ['Nom', p.nom], ['Localisation', p.localisation], ['Ministère', p.ministere],
    ['Email', p.email], ['Téléphone', p.telephone]
  ].filter(([, v]) => v)
   .map(([k, v]) => `<div class="info-row"><span>${k}</span><span>${esc(v)}</span></div>`)
   .join('');

  // Domaines
  const dom = d.domaines || [];
  show('domaines', dom.length > 0);
  $('domainesGrid').innerHTML = dom.map(x => `
    <article class="card domain reveal">
      <div class="icon">${esc(x.icone || '✦')}</div>
      <h3>${esc(x.titre)}</h3>
      <p>${esc(x.description)}</p>
    </article>`).join('');

  // Musique
  const albums = d.albums || [];
  show('musique', albums.length > 0);
  $('albumsGrid').innerHTML = albums.map(a => `
    <article class="project-card reveal">
      ${a.pochette
        ? `<div class="project-img"><img src="${esc(a.pochette)}" alt="${esc(a.titre)}" loading="lazy"></div>`
        : `<div class="project-img placeholder"><span>♪</span></div>`}
      <div class="project-body">
        ${periodeTag(a.type, a.annee)}
        <h3>${esc(a.titre)}</h3>
        ${a.audio ? `<audio controls preload="none" src="${esc(a.audio)}"></audio>` : ''}
        ${a.lien ? `<a class="project-link" href="${esc(a.lien)}" target="_blank" rel="noopener">Écouter →</a>` : ''}
      </div>
    </article>`).join('');

  // Concerts
  const concerts = d.concerts || [];
  show('concerts', concerts.length > 0);
  $('concertsList').innerHTML = concerts.map(x => `
    <article class="concert reveal">
      <div class="concert-date">${esc(x.date)}</div>
      <div>
        <h3>${esc(x.evenement)}</h3>
        <p class="muted">${esc(x.lieu)}</p>
      </div>
    </article>`).join('');

  // Journalisme & chroniques
  const medias = d.medias || [];
  show('medias', medias.length > 0);
  $('mediasGrid').innerHTML = medias.map(m => `
    <article class="card reveal">
      ${m.image ? `<div class="media-img"><img src="${esc(m.image)}" alt="${esc(m.titre)}" loading="lazy"></div>` : ''}
      ${periodeTag(m.type, m.date)}
      <h3>${esc(m.titre)}</h3>
      <h4>${esc(m.media)}</h4>
      ${m.lien ? `<a class="project-link" href="${esc(m.lien)}" target="_blank" rel="noopener">Lire →</a>` : ''}
    </article>`).join('');

  // Cinéma & théâtre
  const roles2 = d.roles || [];
  show('roles', roles2.length > 0);
  $('rolesGrid').innerHTML = roles2.map(r => `
    <article class="card reveal">
      ${periodeTag(r.type, r.annee)}
      <h3>${esc(r.titre)}</h3>
      <h4>${esc(r.production)}</h4>
      ${r.lien ? `<a class="project-link" href="${esc(r.lien)}" target="_blank" rel="noopener">Voir →</a>` : ''}
    </article>`).join('');

  // Compétences et langues
  const skills = d.skills || [];
  const langues = d.langues || [];
  show('competences', skills.length > 0 || langues.length > 0);
  $('skillsGrid').innerHTML = skills.map(s => {
    const n = pct(s.niveau);
    return `
      <div class="skill reveal">
        <div class="skill-head"><span>${esc(s.nom)}</span><span>${n}%</span></div>
        <div class="skill-bar"><span style="--w:${n}%"></span></div>
      </div>`;
  }).join('');
  $('langTitle').hidden = langues.length === 0;
  $('langList').innerHTML = langues.map(l =>
    `<span class="chip">${esc(l.nom)}${l.niveau ? `<small>${esc(l.niveau)}</small>` : ''}</span>`
  ).join('');

  // Parcours
  const exp = d.experiences || [];
  const form = d.formations || [];
  show('parcours', exp.length > 0 || form.length > 0);
  $('expTimeline').innerHTML = exp.map(x => `
    <article class="timeline-item reveal">
      <span class="dot"></span>
      <div class="card">
        <span class="period">${esc(x.periode)}</span>
        <h3>${esc(x.poste)}</h3>
        <h4>${esc(x.entreprise)}</h4>
        <p>${esc(x.description)}</p>
      </div>
    </article>`).join('');
  $('formTitle').hidden = form.length === 0;
  $('formList').innerHTML = form.map(f => `
    <article class="card reveal">
      <span class="period">${esc(f.periode)}</span>
      <h3>${esc(f.diplome)}</h3>
      <h4>${esc(f.etablissement)}</h4>
    </article>`).join('');

  // Témoignages
  const temoins = d.temoignages || [];
  show('temoignages', temoins.length > 0);
  $('quotesGrid').innerHTML = temoins.map(t => `
    <article class="quote reveal">
      <p>${esc(t.texte)}</p>
      <span>${esc(t.auteur)}</span>
    </article>`).join('');

  // Contact
  $('contactLinks').innerHTML = [
    p.email && `<div class="contact-item"><span class="ci-label">Email</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>`,
    p.telephone && `<div class="contact-item"><span class="ci-label">Téléphone</span><a href="tel:${esc(p.telephone)}">${esc(p.telephone)}</a></div>`,
    p.localisation && `<div class="contact-item"><span class="ci-label">Localisation</span><span class="val">${esc(p.localisation)}</span></div>`
  ].filter(Boolean).join('');

  const reseaux = { youtube: 'YouTube', spotify: 'Spotify', instagram: 'Instagram', facebook: 'Facebook', website: 'Site web' };
  const soc = d.socials || {};
  $('socialLinks').innerHTML = Object.entries(reseaux)
    .filter(([k]) => soc[k])
    .map(([k, label]) => `<a class="social" href="${esc(soc[k])}" target="_blank" rel="noopener">${label}</a>`)
    .join('');

  $('footerText').textContent = `© ${new Date().getFullYear()} ${p.nom || ''}. Tous droits réservés.`;
}

/* ===== Effet machine à écrire ===== */
function typeRoles(roles, el) {
  let i = 0, j = 0, deleting = false;
  (function tick() {
    const word = roles[i % roles.length];
    el.textContent = word.slice(0, j);
    if (!deleting && j < word.length) { j++; setTimeout(tick, 90); }
    else if (!deleting) { deleting = true; setTimeout(tick, 1600); }
    else if (j > 0) { j--; setTimeout(tick, 40); }
    else { deleting = false; i++; setTimeout(tick, 300); }
  })();
}

/* ===== Navigation ===== */
function initNav() {
  const navbar = $('navbar'), links = $('navLinks'), burger = $('burger');
  const liens = links.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  burger.addEventListener('click', () => {
    links.classList.toggle('open');
    burger.classList.toggle('active');
  });
  liens.forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger.classList.remove('active');
  }));

  // Surligne le lien de la section visible
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        liens.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => io.observe(s));
}

/* ===== Apparition au scroll ===== */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ===== Lecteurs audio : un seul extrait à la fois ===== */
function initPlayers() {
  const audios = document.querySelectorAll('audio');
  audios.forEach(a => a.addEventListener('play', () =>
    audios.forEach(o => { if (o !== a) o.pause(); })
  ));
}