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
      /* Icônes officielles des réseaux */
    const ICONES = {
      youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path fill="#fff" d="M9.6 15.6V8.4L15.8 12z"/></svg>`,
      instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGrad)"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="#fff"/></svg>`,
      facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M16.7 15.5l.5-3.3h-3.2V10c0-.9.4-1.8 1.9-1.8h1.5V5.4s-1.4-.2-2.7-.2c-2.7 0-4.5 1.6-4.5 4.6v2.7H7v3.3h3.1V24h3.8v-8.5z"/></svg>`,
      spotify: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1DB954"/><g fill="none" stroke="#0a0e1a" stroke-width="2" stroke-linecap="round"><path d="M5.5 9.5c4-1.3 9.5-1 13 1"/><path d="M6.5 13c3.5-1 8-.7 11 1"/><path d="M7.5 16.2c2.8-.8 6-.5 8.5.9"/></g></svg>`,
      website: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>`
    };

    const RESEAUX = [
      ['youtube', 'YouTube'],
      ['instagram', 'Instagram'],
      ['facebook', 'Facebook'],
      ['spotify', 'Spotify'],
      ['website', 'Site web']
    ];

    // Ajoute https:// si l'utilisateur a tapé une adresse sans protocole
    const lienComplet = u => /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : 'https://' + u;

    // Affiche les boutons des réseaux (dans la section contact et le pied de page)
    function renderSocials(soc) {
      const html = RESEAUX
        .filter(([k]) => soc[k])
        .map(([k, label]) => `
          <a class="social social-${k}" href="${esc(lienComplet(soc[k]))}" target="_blank" rel="noopener noreferrer" title="${label}">
            <span class="social-ico">${ICONES[k]}</span>
            <span>${label}</span>
          </a>`).join('');
      $('socialLinks').innerHTML = html;
      $('footerSocials').innerHTML = html;
    }

    // Extrait l'identifiant d'une vidéo YouTube (watch, youtu.be, shorts, embed)
    function youtubeId(url = '') {
      const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
      return m ? m[1] : '';
    }

    // Affiche l'extrait : lecteur YouTube si lien YouTube, sinon lecteur vidéo local
    function renderClip(c) {
      const hasClip = !!c.video;
      show('clip', hasClip);
      if (!hasClip) {
        $('clipPlayer').innerHTML = '';
        return;
      }
      const yt = youtubeId(c.video);
      $('clipPlayer').innerHTML = yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(c.titre || 'Extrait vidéo')}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
        : `<video controls playsinline preload="metadata" ${c.poster ? `poster="${esc(c.poster)}"` : ''} src="${esc(c.video)}"></video>`;
      $('clipTitre').textContent = c.titre || '';
      $('clipTitre').hidden = !c.titre;
      $('clipDesc').textContent = c.description || '';
    }

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
