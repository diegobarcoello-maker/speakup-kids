/* ============================================================
   SpeakUp Kids — Inglés para niños de 3 a 10 años
   Una sola página, sin backend, sin dependencias.

   Principios de diseño (esto no es la app de adultos en pequeño):
   · Nada de leer para poder jugar. Se oye y se toca.
   · No se puede perder. No hay vidas, ni reloj, ni "incorrecto".
   · Zonas táctiles enormes: dedos de tres años.
   · Todo el audio se sintetiza en el aparato → funciona sin datos.
   · Los ajustes viven detrás de una puerta que un niño no abre.
   ============================================================ */
(function () {
'use strict';

/* ══════════════ 1. UTILIDADES ══════════════ */
const $  = s => document.querySelector(s);
const app = () => document.getElementById('app');
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function mezcla(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
const alAzar = a => a[Math.floor(Math.random() * a.length)];
function hoyClave() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function espera(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ══════════════ 2. ESTADO ══════════════ */
const CLAVE = 'speakupkids.v1';
const POR_DEFECTO = {
  tramo: null,
  estrellas: 0,
  stickers: {},          // mundoId -> true
  hechos: {},            // 'mundo:juego' -> { estrellas, fecha }
  conocidas: {},         // palabra en inglés -> nº de aciertos
  dia: '',
  segundosHoy: 0,
  dias: {},              // 'YYYY-MM-DD' -> segundos jugados
  ajustes: {
    voz: '',
    velocidad: 0.8,      // más lento que un adulto: el oído infantil lo necesita
    sonidos: true,
    tema: 'auto',
    limite: 0,           // minutos al día; 0 = sin límite
    mostrarTexto: true   // ver la palabra escrita bajo el dibujo
  }
};

let S = cargar();

function cargar() {
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) return JSON.parse(JSON.stringify(POR_DEFECTO));
    const o = JSON.parse(bruto);
    const m = Object.assign({}, JSON.parse(JSON.stringify(POR_DEFECTO)), o);
    m.ajustes = Object.assign({}, POR_DEFECTO.ajustes, o.ajustes || {});
    return m;
  } catch (e) {
    return JSON.parse(JSON.stringify(POR_DEFECTO));
  }
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) {}
}
function nuevoDia() {
  const h = hoyClave();
  if (S.dia !== h) { S.dia = h; S.segundosHoy = 0; guardar(); }
}

const mundosDe = t => MUNDOS.filter(m => m.tramo === t);
const mundoPorId = id => MUNDOS.find(m => m.id === id) || null;
const tramoPorId = id => TRAMOS.find(t => t.id === id) || null;
const juegoHecho = (mu, ju) => !!S.hechos[mu + ':' + ju];
const mundoCompleto = mu => JUEGOS.every(j => juegoHecho(mu, j.id));

function anotar(mundoId, juegoId, estrellas) {
  S.hechos[mundoId + ':' + juegoId] = { estrellas: estrellas, fecha: hoyClave() };
  S.estrellas += estrellas;
  if (mundoCompleto(mundoId)) S.stickers[mundoId] = true;
  guardar();
}
function acierto(en) { S.conocidas[en] = (S.conocidas[en] || 0) + 1; }
/* Para elegir qué preguntar: primero lo que menos se ha acertado. */
function porFlojera(items) {
  return items.slice().sort((a, b) => (S.conocidas[a.en] || 0) - (S.conocidas[b.en] || 0));
}
function palabrasAprendidas() { return Object.keys(S.conocidas).filter(k => S.conocidas[k] >= 3).length; }

/* ══════════════ 3. VOZ ══════════════ */
const Voz = {
  lista: [],
  refrescar() {
    try { Voz.lista = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { Voz.lista = []; }
  },
  inglesas() { return Voz.lista.filter(v => /^en/i.test(v.lang || '')); },
  elegida() {
    const ing = Voz.inglesas();
    if (!ing.length) return null;
    if (S.ajustes.voz) { const v = ing.find(v => v.voiceURI === S.ajustes.voz); if (v) return v; }
    // se prefiere una voz local (no necesita internet) y de EE. UU.
    return ing.find(v => v.localService && /en[-_]US/i.test(v.lang))
        || ing.find(v => /en[-_]US/i.test(v.lang))
        || ing.find(v => v.localService)
        || ing[0];
  },
  parar() { try { speechSynthesis.cancel(); } catch (e) {} },
  di(texto, alTerminar) {
    if (!window.speechSynthesis) { if (alTerminar) alTerminar(); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      const v = Voz.elegida();
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
      u.rate = Math.max(0.5, Math.min(1.2, S.ajustes.velocidad || 0.8));
      u.pitch = 1.15;                       // un pelín más agudo: suena más amable
      let listo = false;
      const fin = () => { if (listo) return; listo = true; if (alTerminar) alTerminar(); };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1200 + texto.length * 130);   // red de seguridad si el motor se cuelga
      speechSynthesis.speak(u);
    } catch (e) { if (alTerminar) alTerminar(); }
  }
};
if (window.speechSynthesis) {
  Voz.refrescar();
  try { speechSynthesis.onvoiceschanged = Voz.refrescar; } catch (e) {}
}

/* ══════════════ 4. SONIDOS ══════════════
   Sintetizados con Web Audio: cero archivos, cero descargas,
   funcionan igual sin conexión.                              */
const Son = {
  ctx: null,
  arranca() {
    if (!S.ajustes.sonidos) return null;
    try {
      if (!Son.ctx) Son.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (Son.ctx.state === 'suspended') Son.ctx.resume();
      return Son.ctx;
    } catch (e) { return null; }
  },
  nota(f, t0, dur, vol, forma) {
    const c = Son.ctx; if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = forma || 'triangle';
    o.frequency.setValueAtTime(f, c.currentTime + t0);
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol == null ? 0.16 : vol, c.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.02);
  },
  toc()  { if (!Son.arranca()) return; Son.nota(660, 0, .07, .09, 'sine'); },
  bien() { if (!Son.arranca()) return; [[784,0],[988,.09],[1319,.18]].forEach(([f,t]) => Son.nota(f, t, .22, .15)); },
  casi() { if (!Son.arranca()) return; Son.nota(300, 0, .13, .11, 'sine'); Son.nota(240, .1, .16, .09, 'sine'); },
  fiesta() {
    if (!Son.arranca()) return;
    [523,659,784,1047,1319].forEach((f, i) => Son.nota(f, i * .1, .45, .15));
    Son.nota(1568, .55, .7, .12);
  }
};

/* ══════════════ 5. CONFETI ══════════════ */
const Confeti = {
  lienzo: null, ctx: null, piezas: [], anim: 0,
  lanza(ms) {
    const l = document.getElementById('confeti'); if (!l) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Confeti.lienzo = l; l.classList.add('on');
    l.width = innerWidth; l.height = innerHeight;
    Confeti.ctx = l.getContext('2d');
    const col = ['#FF9F1C', '#2E86DE', '#16A75C', '#EF476F', '#7C5CDB', '#FFD166'];
    Confeti.piezas = Array.from({ length: 90 }, () => ({
      x: Math.random() * l.width, y: -20 - Math.random() * l.height * .5,
      w: 7 + Math.random() * 7, h: 9 + Math.random() * 9,
      vy: 2 + Math.random() * 3.4, vx: -1.3 + Math.random() * 2.6,
      r: Math.random() * 6.28, vr: -.15 + Math.random() * .3,
      c: col[Math.floor(Math.random() * col.length)]
    }));
    cancelAnimationFrame(Confeti.anim);
    const fin = Date.now() + (ms || 2600);
    (function paso() {
      const c = Confeti.ctx, l = Confeti.lienzo; if (!c || !l) return;
      c.clearRect(0, 0, l.width, l.height);
      Confeti.piezas.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r);
        c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      });
      if (Date.now() < fin) Confeti.anim = requestAnimationFrame(paso);
      else { c.clearRect(0, 0, l.width, l.height); l.classList.remove('on'); }
    })();
  }
};

/* ══════════════ 6. AVISOS ══════════════ */
let tostadaT = 0;
function tostada(txt) {
  const v = document.querySelector('.tostada'); if (v) v.remove();
  const d = document.createElement('div');
  d.className = 'tostada'; d.textContent = txt; d.setAttribute('role', 'status');
  document.body.appendChild(d);
  clearTimeout(tostadaT);
  tostadaT = setTimeout(() => d.remove(), 2600);
}

/* ══════════════ 7. TIEMPO DE PANTALLA ══════════════ */
const Tiempo = {
  reloj: 0,
  arranca() {
    clearInterval(Tiempo.reloj);
    Tiempo.reloj = setInterval(() => {
      if (document.hidden) return;
      nuevoDia();
      S.segundosHoy += 5;
      S.dias[S.dia] = (S.dias[S.dia] || 0) + 5;
      guardar();
      if (Tiempo.agotado() && V.pantalla !== 'stop') { V.pantalla = 'stop'; pinta(); }
    }, 5000);
  },
  agotado() {
    const lim = S.ajustes.limite || 0;
    return lim > 0 && S.segundosHoy >= lim * 60;
  },
  minutosHoy() { return Math.round((S.segundosHoy || 0) / 60); }
};

/* ══════════════ 8. ENRUTADOR ══════════════ */
const V = {
  pantalla: 'portada',   // portada · mapa · mundo · juego · premio · album · stop
  mundo: null,
  juego: null,
  j: null,               // estado interno del juego en curso
  premio: null
};

function irA(p, extra) {
  Voz.parar();
  V.pantalla = p;
  Object.assign(V, extra || {});
  scrollTo(0, 0);
  pinta();
}

function tema() {
  const t = S.ajustes.tema;
  if (t === 'claro' || t === 'oscuro') document.documentElement.setAttribute('data-tema', t);
  else document.documentElement.removeAttribute('data-tema');
}

function pinta() {
  tema();
  nuevoDia();
  const raiz = app();
  let html = '';

  if (Tiempo.agotado() && V.pantalla !== 'stop') V.pantalla = 'stop';
  // si el adulto amplía o quita el límite, se sale de la pantalla de despedida
  if (V.pantalla === 'stop' && !Tiempo.agotado()) V.pantalla = S.tramo ? 'mapa' : 'portada';

  if      (V.pantalla === 'stop')    html = vistaStop();
  else if (!S.tramo)                 html = vistaPortada();
  else if (V.pantalla === 'portada') html = vistaPortada();
  else if (V.pantalla === 'mapa')    html = vistaMapa();
  else if (V.pantalla === 'mundo')   html = vistaMundo();
  else if (V.pantalla === 'juego')   html = vistaJuego();
  else if (V.pantalla === 'premio')  html = vistaPremio();
  else if (V.pantalla === 'album')   html = vistaAlbum();
  else                               html = vistaMapa();

  raiz.innerHTML = '<div class="vista">' + html + '</div>';
  pintaBarra();
  trasPintar();
}

function pintaBarra() {
  const barra = $('#topbar'), medio = $('#topbar-mid'), atras = $('#btn-atras');
  const enPortada = V.pantalla === 'portada' || !S.tramo;
  barra.hidden = V.pantalla === 'stop';
  atras.hidden = enPortada;

  if (V.pantalla === 'juego' && V.j && V.j.total) {
    const pc = Math.round((V.j.paso / V.j.total) * 100);
    medio.innerHTML = '<div class="progreso" role="progressbar" aria-label="Progreso del juego" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pc + '%"></i></div>';
  } else if (enPortada) {
    medio.innerHTML = '<span class="titulo-barra">SpeakUp Kids</span>';
  } else {
    medio.innerHTML = '<span class="estrellas-barra" title="Estrellas ganadas">⭐ ' + S.estrellas + '</span>';
  }
}

function trasPintar() {
  const j = V.j;
  if (V.pantalla === 'juego' && j && j.auto) { j.auto = false; setTimeout(() => Juego.dilo_o_pregunta(), 420); }
}

/* ══════════════ 9. MASCOTA ══════════════
   Un personaje sencillo, dibujado a mano en SVG.
   Tres caras: piensa, feliz, anima.                          */
function mascota(cara) {
  const boca = cara === 'feliz'
    ? '<path d="M44 76q16 18 32 0" stroke="#2B2540" stroke-width="5" fill="none" stroke-linecap="round"/>'
    : cara === 'anima'
      ? '<ellipse cx="60" cy="80" rx="11" ry="9" fill="#2B2540"/>'
      : '<path d="M46 79q14 10 28 0" stroke="#2B2540" stroke-width="5" fill="none" stroke-linecap="round"/>';
  const ojos = cara === 'feliz'
    ? '<path d="M37 55q8-9 16 0M67 55q8-9 16 0" stroke="#2B2540" stroke-width="5" fill="none" stroke-linecap="round"/>'
    : '<circle cx="45" cy="55" r="9.5" fill="#fff"/><circle cx="75" cy="55" r="9.5" fill="#fff"/>' +
      '<circle cx="46" cy="57" r="4.6" fill="#2B2540"/><circle cx="76" cy="57" r="4.6" fill="#2B2540"/>';
  return '<svg class="mascota ' + (cara === 'feliz' ? 'feliz' : 'piensa') + '" viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle cx="60" cy="62" r="46" fill="#FFD166" stroke="none"/>' +
    '<circle cx="30" cy="70" r="6.5" fill="#FF9EB5" stroke="none" opacity=".9"/>' +
    '<circle cx="90" cy="70" r="6.5" fill="#FF9EB5" stroke="none" opacity=".9"/>' +
    '<path d="M60 16v-8M60 8a5 5 0 1 0 .01 0" stroke="#FF8A3D" stroke-width="4" fill="#FF8A3D"/>' +
    ojos + boca + '</svg>';
}

/* ══════════════ 10. PORTADA ══════════════ */
function vistaPortada() {
  let h = '<h1>¿Quién va a jugar?</h1>' +
          '<p class="sub">Elige la edad. Cada una tiene sus propios juegos.</p><div class="tramos">';
  TRAMOS.forEach(t => {
    const n = mundosDe(t.id).filter(m => m.activo).length;
    h += '<button class="tramo' + (t.activo ? '' : ' pronto') + '" data-c="' + t.color + '" type="button" ' +
         'data-act="' + (t.activo ? 'tramo' : 'nada') + '" data-id="' + t.id + '"' + (t.activo ? '' : ' aria-disabled="true"') + '>' +
         '<span class="em" aria-hidden="true">' + t.emoji + '</span><span>' +
         '<b>' + esc(t.nombre) + '</b>' +
         '<span class="edad">' + esc(t.edad) + ' · ' + esc(t.lema) + '</span>' +
         '<span class="d">' + esc(t.desc) + '</span></span>' +
         (t.activo ? '' : '<span class="cinta">Pronto</span>') +
         '</button>';
  });
  h += '</div>';
  h += App.tarjeta(false);
  h += '<p class="nota">Interfaz en español, aprendizaje en inglés. Funciona sin conexión. ' +
       'Los ajustes y el progreso están en la rueda ⚙️ de arriba, detrás de una puerta para adultos.</p>';
  return h;
}

/* ══════════════ 11. MAPA DE MUNDOS ══════════════ */
function vistaMapa() {
  const t = tramoPorId(S.tramo) || TRAMOS[0];
  const ms = mundosDe(t.id);
  const gan = Object.keys(S.stickers).length;
  let h = '<h1>' + t.emoji + ' ' + esc(t.nombre) + '</h1>' +
          '<p class="sub">Elige un mundo para jugar.</p><div class="mundos">';
  ms.forEach(m => {
    const listo = mundoCompleto(m.id);
    const hechos = JUEGOS.filter(j => juegoHecho(m.id, j.id)).length;
    h += '<button class="mundo' + (m.activo ? '' : ' bloqueado') + '" data-c="' + m.color + '" type="button" ' +
         'data-act="' + (m.activo ? 'mundo' : 'pronto') + '" data-id="' + m.id + '">' +
         (listo ? '<span class="listo" aria-hidden="true">🏅</span>' : '') +
         (m.activo ? '' : '<span class="candado" aria-hidden="true">🔒</span>') +
         '<span class="em" aria-hidden="true">' + m.emoji + '</span>' +
         '<b>' + esc(m.nombre) + '</b>' +
         '<span class="n">' + (m.activo ? hechos + ' de ' + JUEGOS.length + ' juegos' : 'Pronto') + '</span>' +
         '</button>';
  });
  h += '</div>';
  h += '<h2>Mi álbum</h2>' +
       '<button class="juego" type="button" data-act="album">' +
       '<span class="em" aria-hidden="true">📔</span><span>' +
       '<b>' + gan + ' pegatina' + (gan === 1 ? '' : 's') + '</b>' +
       '<span class="p">Termina un mundo entero y ganas la suya</span></span>' +
       '<span class="ok" aria-hidden="true">›</span></button>';
  /* La instalación vive también aquí: tras el primer uso la app arranca
     en el mapa, y si el botón solo estuviera en la portada nadie lo vería. */
  h += App.tarjeta(false);
  h += '<p class="nota">¿Otra edad? Toca la flecha ‹ de arriba.</p>';
  return h;
}

/* ══════════════ 12. UN MUNDO ══════════════ */
function vistaMundo() {
  const m = mundoPorId(V.mundo); if (!m) return vistaMapa();
  let h = '<div class="cabecera-mundo"><span class="em" aria-hidden="true">' + m.emoji + '</span>' +
          '<h1>' + esc(m.nombre) + '</h1>' +
          '<p class="sub">' + m.items.length + ' palabras en inglés</p></div><div class="juegos">';
  JUEGOS.forEach(j => {
    const r = S.hechos[m.id + ':' + j.id];
    h += '<button class="juego" type="button" data-act="juego" data-id="' + j.id + '">' +
         '<span class="em" aria-hidden="true">' + j.emoji + '</span><span>' +
         '<b>' + esc(j.nombre) + '</b><span class="p">' + esc(j.pista) + '</span></span>' +
         '<span class="ok" aria-hidden="true">' + (r ? '⭐'.repeat(r.estrellas) : '›') + '</span>' +
         '</button>';
  });
  h += '</div>';
  if (mundoCompleto(m.id)) {
    h += '<p class="nota">🏅 Mundo terminado. Se puede repetir todas las veces que quiera: repetir es justo lo que hace que se quede.</p>';
  }
  return h;
}

/* ══════════════ 13. JUEGOS ══════════════ */
const Juego = {

  empieza(juegoId) {
    const m = mundoPorId(V.mundo); if (!m) return;
    V.juego = juegoId;
    Son.arranca();                      // el primer toque desbloquea el audio en iOS

    if (juegoId === 'descubre') {
      V.j = { tipo: 'descubre', items: m.items.slice(), tocadas: {}, paso: 0, total: m.items.length };
    }
    else if (juegoId === 'escucha') {
      const total = Math.min(8, m.items.length);
      const objetivos = mezcla(porFlojera(m.items).slice(0, Math.max(total, 6))).slice(0, total);
      V.j = { tipo: 'escucha', items: m.items, ronda: null, cola: objetivos, paso: 0, total: total, limpias: 0, fallos: 0, auto: true };
      Juego.siguienteEscucha(true);
    }
    else if (juegoId === 'parejas') {
      const n = Math.min(4, m.items.length);
      const elegidas = mezcla(porFlojera(m.items).slice(0, Math.max(n, 6))).slice(0, n);
      const cartas = mezcla(elegidas.concat(elegidas).map((it, i) => ({ uid: i, it: it, abierta: false, hecha: false })));
      V.j = { tipo: 'parejas', cartas: cartas, abiertas: [], intentos: 0, hechas: 0, paso: 0, total: n, bloqueado: false };
    }
    else if (juegoId === 'dilo') {
      const n = Math.min(6, m.items.length);
      const lista = mezcla(porFlojera(m.items).slice(0, Math.max(n, 8))).slice(0, n);
      V.j = { tipo: 'dilo', lista: lista, i: 0, paso: 0, total: n, grabando: false, blob: null, auto: true };
    }
    irA('juego');
  },

  /* al entrar en una pantalla que debe hablar sola */
  dilo_o_pregunta() {
    const j = V.j; if (!j) return;
    if (j.tipo === 'escucha' && j.ronda) Juego.suena();
    if (j.tipo === 'dilo') Juego.diloEscucha();
  },

  /* ---------- ESCUCHA Y TOCA ---------- */
  siguienteEscucha(silencioso) {
    const j = V.j, m = mundoPorId(V.mundo);
    if (!j.cola.length) { Juego.terminaEscucha(); return; }
    const objetivo = j.cola.shift();
    const otros = mezcla(m.items.filter(x => x.en !== objetivo.en)).slice(0, 2);
    j.ronda = { objetivo: objetivo, opciones: mezcla([objetivo].concat(otros)), errores: 0, resuelta: false };
    j.paso = j.total - j.cola.length - 1;
    if (!silencioso) { pinta(); setTimeout(Juego.suena, 380); }
  },
  suena() {
    const j = V.j; if (!j || !j.ronda) return;
    const b = document.querySelector('.altavoz');
    if (b) b.classList.add('sonando');
    Voz.di(j.ronda.objetivo.en, () => { const x = document.querySelector('.altavoz'); if (x) x.classList.remove('sonando'); });
  },
  eligeEscucha(en, boton) {
    const j = V.j; if (!j || !j.ronda || j.ronda.resuelta) return;
    const r = j.ronda;
    if (en === r.objetivo.en) {
      r.resuelta = true;
      boton.classList.add('bien');
      Son.bien(); acierto(en);
      if (r.errores === 0) j.limpias++;
      const t = $('#instruccion'); if (t) t.textContent = alAzar(BIEN);
      const car = document.querySelector('.mascota');
      if (car) { car.classList.remove('piensa'); car.classList.add('feliz'); }
      guardar();
      setTimeout(() => { j.paso++; Juego.siguienteEscucha(); }, 1000);
    } else {
      r.errores++; j.fallos++;
      Son.casi();
      boton.classList.add('mal');
      setTimeout(() => { boton.classList.remove('mal'); boton.classList.add('apaga'); boton.disabled = true; }, 420);
      const t = $('#instruccion'); if (t) t.textContent = alAzar(CASI);
      setTimeout(() => {
        Juego.suena();
        if (r.errores >= 2) {
          const ok = document.querySelector('.opcion[data-en="' + CSS.escape(r.objetivo.en) + '"]');
          if (ok) ok.classList.add('pista');
        }
      }, 700);
    }
  },
  terminaEscucha() {
    const j = V.j;
    const ratio = j.total ? j.limpias / j.total : 1;
    const est = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    Juego.cierra(est);
  },

  /* ---------- PAREJAS ---------- */
  voltea(uid) {
    const j = V.j; if (!j || j.bloqueado) return;
    const c = j.cartas.find(x => x.uid === uid);
    if (!c || c.hecha || c.abierta) return;
    c.abierta = true;
    Son.toc();
    Voz.di(c.it.en);
    j.abiertas.push(c);
    pinta();

    if (j.abiertas.length === 2) {
      j.intentos++;
      j.bloqueado = true;
      const [a, b] = j.abiertas;
      if (a.it.en === b.it.en) {
        setTimeout(() => {
          a.hecha = b.hecha = true;
          j.abiertas = []; j.hechas++; j.paso = j.hechas; j.bloqueado = false;
          Son.bien(); acierto(a.it.en); guardar();
          pinta();
          if (j.hechas >= j.total) {
            const est = j.intentos <= j.total + 2 ? 3 : j.intentos <= j.total * 2 + 2 ? 2 : 1;
            setTimeout(() => Juego.cierra(est), 700);
          }
        }, 750);
      } else {
        setTimeout(() => {
          a.abierta = b.abierta = false; j.abiertas = []; j.bloqueado = false;
          Son.casi(); pinta();
        }, 1200);
      }
    }
  },

  /* ---------- DILO TÚ ---------- */
  diloEscucha() {
    const j = V.j; if (!j) return;
    const it = j.lista[j.i]; if (!it) return;
    const b = document.querySelector('.altavoz');
    if (b) b.classList.add('sonando');
    Voz.di(it.en, () => { const x = document.querySelector('.altavoz'); if (x) x.classList.remove('sonando'); });
  },
  async grabar() {
    const j = V.j; if (!j) return;
    if (j.grabando) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) { j.sinMicro = true; pinta(); return; }
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(flujo);
      const trozos = [];
      mr.ondataavailable = e => { if (e.data && e.data.size) trozos.push(e.data); };
      mr.onstop = () => {
        flujo.getTracks().forEach(t => t.stop());
        j.blob = new Blob(trozos, { type: mr.mimeType || 'audio/webm' });
        j.grabando = false;
        pinta();
        setTimeout(Juego.reproduce, 250);
      };
      j.grabando = true; j.blob = null; j.mr = mr;
      mr.start();
      pinta();
      setTimeout(() => { try { if (mr.state === 'recording') mr.stop(); } catch (e) {} }, 3000);
    } catch (e) {
      j.sinMicro = true; j.grabando = false;
      tostada('Sin micrófono. Puedes seguir repitiendo en voz alta.');
      pinta();
    }
  },
  reproduce() {
    const j = V.j; if (!j || !j.blob) return;
    try {
      const a = new Audio(URL.createObjectURL(j.blob));
      a.play();
    } catch (e) {}
  },
  diloSiguiente() {
    const j = V.j; if (!j) return;
    acierto(j.lista[j.i].en); guardar();
    j.i++; j.paso = j.i; j.blob = null;
    if (j.i >= j.lista.length) { Juego.cierra(3); return; }
    j.auto = true; pinta();
  },

  /* ---------- FIN DE UN JUEGO ---------- */
  cierra(estrellas) {
    const m = mundoPorId(V.mundo);
    const yaTenia = mundoCompleto(m.id);
    anotar(m.id, V.juego, estrellas);
    const completo = !yaTenia && mundoCompleto(m.id);
    V.premio = { estrellas: estrellas, completo: completo, mundo: m.id };
    if (completo) { Son.fiesta(); Confeti.lanza(3200); }
    else { Son.bien(); Confeti.lanza(1500); }
    irA('premio');
  }
};

/* ---------- vistas de cada juego ---------- */
function vistaJuego() {
  const j = V.j, m = mundoPorId(V.mundo);
  if (!j || !m) return vistaMapa();
  if (j.tipo === 'descubre') return vistaDescubre(j, m);
  if (j.tipo === 'escucha')  return vistaEscucha(j);
  if (j.tipo === 'parejas')  return vistaParejas(j);
  if (j.tipo === 'dilo')     return vistaDilo(j);
  return vistaMapa();
}

function vistaDescubre(j, m) {
  const n = Object.keys(j.tocadas).length;
  let h = '<div class="escenario">' + mascota(n >= j.total ? 'feliz' : 'piensa') +
    '<p class="instruccion" id="instruccion">Toca cada dibujo y escucha<small>' + n + ' de ' + j.total + '</small></p>' +
    '<div class="descubre">';
  j.items.forEach(it => {
    h += '<button class="ficha' + (j.tocadas[it.en] ? ' tocada' : '') + '" type="button" data-act="descubre" data-en="' + esc(it.en) + '">' +
         '<span class="em" aria-hidden="true">' + it.emoji + '</span>' +
         '<span class="en">' + esc(it.en) + '</span>' +
         (S.ajustes.mostrarTexto ? '<span class="es">' + esc(it.es) + '</span>' : '') +
         '</button>';
  });
  h += '</div>';
  h += '<button class="bt" type="button" data-act="fin-descubre"' + (n < j.total ? ' disabled' : '') + '>' +
       (n < j.total ? 'Faltan ' + (j.total - n) : '¡Listo! 🎉') + '</button></div>';
  return h;
}

function vistaEscucha(j) {
  if (!j.ronda) return '<div class="escenario centro">' + mascota('feliz') + '<p class="instruccion">Un momento…</p></div>';
  const r = j.ronda;
  let h = '<div class="escenario centro">' + mascota(r.resuelta ? 'feliz' : 'piensa') +
    '<button class="altavoz" type="button" data-act="repite" aria-label="Escuchar la palabra otra vez">🔊</button>' +
    '<p class="instruccion" id="instruccion">¿Cuál es?<small>Toca el altavoz para oírlo otra vez</small></p>' +
    '<div class="opciones">';
  r.opciones.forEach(o => {
    h += '<button class="opcion" type="button" data-act="elige" data-en="' + esc(o.en) + '" aria-label="Opción">' +
         '<span aria-hidden="true">' + o.emoji + '</span></button>';
  });
  h += '</div></div>';
  return h;
}

function vistaParejas(j) {
  let h = '<div class="escenario centro">' + mascota(j.hechas >= j.total ? 'feliz' : 'piensa') +
    '<p class="instruccion" id="instruccion">Encuentra las parejas<small>' + j.hechas + ' de ' + j.total + '</small></p>' +
    '<div class="tablero">';
  j.cartas.forEach(c => {
    const cl = 'carta' + (c.abierta ? ' abierta' : '') + (c.hecha ? ' hecha' : '');
    h += '<button class="' + cl + '" type="button" data-act="voltea" data-uid="' + c.uid + '" aria-label="Carta">' +
         '<span class="cara"><span class="a" aria-hidden="true">?</span>' +
         '<span class="b" aria-hidden="true">' + c.it.emoji + '</span></span></button>';
  });
  h += '</div></div>';
  return h;
}

function vistaDilo(j) {
  const it = j.lista[j.i]; if (!it) return '';
  let h = '<div class="escenario centro">' +
    '<span class="dilo-palabra" aria-hidden="true">' + it.emoji + '</span>' +
    '<div style="text-align:center"><div class="dilo-en">' + esc(it.en) + '</div>' +
    '<div class="dilo-es">' + esc(it.es) + '</div></div>' +
    '<p class="instruccion" id="instruccion">' +
    (j.grabando ? '¡Dilo ahora! 🎙️' : j.blob ? '¡Escúchate!' : 'Escucha y repítelo') +
    '<small>' + (j.i + 1) + ' de ' + j.total + '</small></p>' +
    '<div class="fila-dilo" style="justify-content:center;gap:18px">' +
      '<button class="altavoz" type="button" data-act="dilo-oir" aria-label="Escuchar la palabra">🔊</button>' +
      (j.sinMicro ? '' :
        '<button class="rec' + (j.grabando ? ' grabando' : '') + '" type="button" data-act="' +
        (j.blob && !j.grabando ? 'dilo-play' : 'dilo-rec') + '" aria-label="' +
        (j.blob && !j.grabando ? 'Escuchar mi voz' : 'Grabar mi voz') + '">' +
        (j.grabando ? '⏺️' : j.blob ? '▶️' : '🎤') + '</button>') +
    '</div>' +
    '<button class="bt" type="button" data-act="dilo-sig">' + (j.i + 1 >= j.total ? '¡Terminé! 🎉' : 'Siguiente ›') + '</button>' +
    (j.sinMicro ? '<p class="nota" style="text-align:center">Aquí no hay micrófono disponible. Escucha y repite en voz alta: funciona igual de bien.</p>' : '') +
    '</div>';
  return h;
}

/* ══════════════ 14. PREMIO ══════════════ */
function vistaPremio() {
  const p = V.premio || { estrellas: 3 };
  const m = mundoPorId(p.mundo || V.mundo);
  let h = '<div class="premio">';
  if (p.completo && m) {
    h += '<span class="sticker" aria-hidden="true">' + m.sticker + '</span>' +
         '<h1>¡Mundo terminado!</h1>' +
         '<p class="sub">Ganaste la pegatina de ' + esc(m.nombre) + ' para tu álbum.</p>';
  } else {
    h += mascota('feliz') + '<h1>' + alAzar(BIEN) + '</h1>';
  }
  h += '<div class="estrellas-premio" aria-label="' + p.estrellas + ' estrellas">' +
       Array.from({ length: 3 }, (_, i) => '<i>' + (i < p.estrellas ? '⭐' : '☆') + '</i>').join('') + '</div>';
  h += '<p class="sub">Tienes ' + S.estrellas + ' estrellas en total.</p>';
  h += '<button class="bt" type="button" data-act="otra">Jugar otra vez 🔁</button>' +
       '<div style="height:10px"></div>' +
       '<button class="bt fantasma" type="button" data-act="al-mundo">Elegir otro juego</button>';
  h += '</div>';
  return h;
}

/* ══════════════ 15. ÁLBUM ══════════════ */
function vistaAlbum() {
  const t = tramoPorId(S.tramo);
  const lista = MUNDOS.filter(m => !t || m.tramo === t.id);
  const gan = lista.filter(m => S.stickers[m.id]).length;
  let h = '<h1>📔 Mi álbum</h1><p class="sub">' + gan + ' de ' + lista.length + ' pegatinas. Se gana una al terminar los cuatro juegos de un mundo.</p><div class="album">';
  lista.forEach(m => {
    const tiene = !!S.stickers[m.id];
    h += '<div class="pegatina ' + (tiene ? 'tiene' : 'no') + '" title="' + esc(m.nombre) + '" aria-label="' + esc(m.nombre) + (tiene ? ' conseguida' : ' por conseguir') + '">' +
         (tiene ? m.sticker : '❔') + '</div>';
  });
  h += '</div>';
  h += '<h2>Palabras que ya sabe</h2>' +
       '<div class="metricas"><div class="metrica"><b>' + palabrasAprendidas() + '</b><span>palabras</span></div>' +
       '<div class="metrica"><b>' + S.estrellas + '</b><span>estrellas</span></div>' +
       '<div class="metrica"><b>' + Object.keys(S.hechos).length + '</b><span>juegos</span></div></div>';
  return h;
}

/* ══════════════ 16. SE ACABÓ EL TIEMPO ══════════════ */
function vistaStop() {
  return '<div class="stop"><span class="em" aria-hidden="true">🌙</span>' +
    '<h1>Por hoy ya está</h1>' +
    '<p class="sub">Jugaste ' + Tiempo.minutosHoy() + ' minutos. Mañana seguimos.</p>' +
    '<button class="bt fantasma" type="button" data-act="padres">Soy el adulto ⚙️</button></div>';
}

/* ══════════════ 17. ZONA DE FAMILIA ══════════════
   Detrás de una operación que un niño de 3 a 10 no resuelve
   de un toque. No es una caja fuerte: es una puerta.        */
const Padres = {
  abierta: false, desbloqueada: false, reto: null, tecleado: '',

  abre() {
    Padres.abierta = true;
    if (!Padres.desbloqueada) {
      const a = 6 + Math.floor(Math.random() * 8), b = 5 + Math.floor(Math.random() * 8);
      Padres.reto = { a: a, b: b, r: a * b };
      Padres.tecleado = '';
    }
    Padres.pinta();
  },
  cierra() { Padres.abierta = false; $('#capa').innerHTML = ''; pinta(); },

  tecla(v) {
    if (v === 'x') Padres.tecleado = Padres.tecleado.slice(0, -1);
    else if (Padres.tecleado.length < 4) Padres.tecleado += v;
    if (Padres.tecleado.length >= String(Padres.reto.r).length) {
      if (Number(Padres.tecleado) === Padres.reto.r) { Padres.desbloqueada = true; Son.bien(); }
      else { Son.casi(); Padres.tecleado = ''; tostada('No es esa. Prueba otra vez.'); }
    }
    Padres.pinta();
  },

  pinta() {
    const capa = $('#capa');
    if (!Padres.abierta) { capa.innerHTML = ''; return; }
    capa.innerHTML = '<div class="capa" data-act="cerrar-capa"><div class="hoja" role="dialog" aria-modal="true" aria-label="Zona de familia">' +
      '<div class="asa"></div>' + (Padres.desbloqueada ? Padres.panel() : Padres.puerta()) + '</div></div>';
  },

  puerta() {
    const r = Padres.reto;
    let h = '<div class="puerta"><h2 style="margin-top:0">Zona de familia</h2>' +
      '<p class="sub">Para entrar, resuelve: <b>' + r.a + ' × ' + r.b + '</b></p>' +
      '<div class="num" aria-live="polite">' + (Padres.tecleado || '—') + '</div><div class="teclado">';
    ['1','2','3','4','5','6','7','8','9','x','0','ok'].forEach(t => {
      h += '<button class="tecla" type="button" data-act="tecla" data-v="' + t + '">' +
           (t === 'x' ? '⌫' : t === 'ok' ? '✓' : t) + '</button>';
    });
    h += '</div><div style="height:14px"></div>' +
         '<button class="bt fantasma" type="button" data-act="cerrar-padres">Volver al juego</button></div>';
    return h;
  },

  panel() {
    const a = S.ajustes;
    const dias = Object.keys(S.dias).sort().slice(-7);
    const semana = dias.reduce((s, d) => s + (S.dias[d] || 0), 0);
    const ing = Voz.inglesas();

    let h = '<h2 style="margin-top:4px">Zona de familia</h2>';

    h += '<div class="metricas">' +
      '<div class="metrica"><b>' + palabrasAprendidas() + '</b><span>palabras</span></div>' +
      '<div class="metrica"><b>' + Tiempo.minutosHoy() + '\'</b><span>hoy</span></div>' +
      '<div class="metrica"><b>' + Math.round(semana / 60) + '\'</b><span>últimos 7 días</span></div>' +
      '</div>';

    /* tiempo de pantalla */
    h += '<div class="fila"><div><b>Tiempo al día</b><span class="d">Cuando se acaba, la app se despide sola.</span></div>' +
      '<select data-act="set" data-k="limite">' +
      [0, 5, 10, 15, 20, 30].map(v => '<option value="' + v + '"' + (a.limite === v ? ' selected' : '') + '>' +
        (v === 0 ? 'Sin límite' : v + ' min') + '</option>').join('') + '</select></div>';

    /* voz */
    h += '<div class="fila"><div><b>Voz en inglés</b><span class="d">' +
      (ing.length ? ing.length + ' voces disponibles en este aparato' : 'Este aparato no ofrece voces en inglés') +
      '</span></div><select data-act="set" data-k="voz">' +
      '<option value="">Automática</option>' +
      ing.map(v => '<option value="' + esc(v.voiceURI) + '"' + (a.voz === v.voiceURI ? ' selected' : '') + '>' +
        esc(v.name) + '</option>').join('') + '</select></div>';

    h += '<div class="fila"><div><b>Velocidad</b><span class="d">Más lento se entiende mejor a estas edades.</span></div>' +
      '<select data-act="set" data-k="velocidad">' +
      [['0.65','Muy lento'],['0.8','Lento'],['0.95','Normal'],['1.1','Rápido']].map(([v, n]) =>
        '<option value="' + v + '"' + (String(a.velocidad) === v ? ' selected' : '') + '>' + n + '</option>').join('') +
      '</select></div>';

    h += '<div class="fila"><div><b>Probar la voz</b><span class="d">Escucha cómo suena antes de dársela.</span></div>' +
      '<button class="bt fantasma" style="width:auto;min-height:48px;padding:10px 18px;white-space:nowrap" type="button" data-act="prueba-voz">🔊 Probar</button></div>';

    /* interruptores */
    h += Padres.fila('sonidos', 'Efectos de sonido', 'Los premios y los avisos suenan.');
    h += Padres.fila('mostrarTexto', 'Mostrar la traducción', 'La palabra en español bajo el dibujo, en Descubre.');

    h += '<div class="fila"><div><b>Aspecto</b><span class="d">Para jugar de noche sin deslumbrar.</span></div>' +
      '<select data-act="set" data-k="tema">' +
      [['auto','Automático'],['claro','Claro'],['oscuro','Oscuro']].map(([v, n]) =>
        '<option value="' + v + '"' + (a.tema === v ? ' selected' : '') + '>' + n + '</option>').join('') +
      '</select></div>';

    h += '<div class="fila"><div><b>Empezar de cero</b><span class="d">Borra estrellas, pegatinas y progreso.</span></div>' +
      '<button class="bt fantasma" style="width:auto;min-height:48px;padding:10px 18px;white-space:nowrap;color:var(--fresa);border-color:var(--fresa)" type="button" data-act="reinicia">Borrar</button></div>';

    h += App.tarjeta(true);

    h += '<p class="nota">Todo se guarda solo en este aparato. No se envía nada a ningún servidor y no hace falta ninguna cuenta. ' +
      'SpeakUp Kids no tiene publicidad, ni compras, ni enlaces a internet dentro del juego.</p>';

    h += '<div style="height:8px"></div><button class="bt" type="button" data-act="cerrar-padres">Volver al juego</button>';
    return h;
  },

  fila(clave, titulo, desc) {
    const on = !!S.ajustes[clave];
    return '<div class="fila"><div><b>' + titulo + '</b><span class="d">' + desc + '</span></div>' +
      '<button class="interruptor" type="button" role="switch" aria-checked="' + on + '" aria-label="' + titulo + '" data-act="toggle" data-k="' + clave + '"></button></div>';
  }
};

/* ══════════════ 18. ACCIONES ══════════════ */
document.addEventListener('click', function (ev) {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  /* la capa de padres */
  if (act === 'cerrar-capa') { if (ev.target === el) Padres.cierra(); return; }
  if (act === 'cerrar-padres') { Padres.cierra(); return; }
  if (act === 'tecla') { Padres.tecla(el.dataset.v); return; }
  if (act === 'toggle') {
    S.ajustes[el.dataset.k] = !S.ajustes[el.dataset.k]; guardar(); Son.toc(); Padres.pinta(); return;
  }
  if (act === 'prueba-voz') { Voz.di('Hello! Let us play in English.'); return; }
  if (act === 'reinicia') {
    if (confirm('¿Borrar todo el progreso? Esto no se puede deshacer.')) {
      S = JSON.parse(JSON.stringify(POR_DEFECTO)); guardar();
      Padres.cierra(); irA('portada');
    }
    return;
  }
  if (act === 'padres') { Son.arranca(); Padres.abre(); return; }
  if (act === 'instalar') { App.instalar(); return; }

  /* navegación */
  if (act === 'nada' || act === 'pronto') { Son.toc(); tostada('Este todavía está en construcción 🚧'); return; }
  if (act === 'tramo')  { Son.toc(); S.tramo = el.dataset.id; guardar(); irA('mapa'); return; }
  if (act === 'mundo')  { Son.toc(); irA('mundo', { mundo: el.dataset.id }); return; }
  if (act === 'album')  { Son.toc(); irA('album'); return; }
  if (act === 'juego')  { Juego.empieza(el.dataset.id); return; }
  if (act === 'otra')   { Juego.empieza(V.juego); return; }
  if (act === 'al-mundo') { irA('mundo'); return; }

  /* juegos */
  if (act === 'descubre') {
    const j = V.j; if (!j) return;
    const en = el.dataset.en;
    const it = j.items.find(x => x.en === en); if (!it) return;
    document.querySelectorAll('.ficha.sonando').forEach(x => x.classList.remove('sonando'));
    el.classList.add('sonando');
    Voz.di(it.en, () => el.classList.remove('sonando'));
    if (!j.tocadas[en]) {
      j.tocadas[en] = true; acierto(en); guardar();
      el.classList.add('tocada');
      const n = Object.keys(j.tocadas).length;
      j.paso = n;
      const barra = document.querySelector('.progreso i');
      if (barra) barra.style.width = Math.round((n / j.total) * 100) + '%';
      const t = $('#instruccion');
      if (t) t.innerHTML = (n >= j.total ? '¡Los tocaste todos!' : 'Toca cada dibujo y escucha') + '<small>' + n + ' de ' + j.total + '</small>';
      if (n >= j.total) { const b = document.querySelector('[data-act="fin-descubre"]'); if (b) { b.disabled = false; b.textContent = '¡Listo! 🎉'; } }
    }
    return;
  }
  if (act === 'fin-descubre') { Juego.cierra(3); return; }
  if (act === 'repite') { Juego.suena(); return; }
  if (act === 'elige')  { Juego.eligeEscucha(el.dataset.en, el); return; }
  if (act === 'voltea') { Juego.voltea(Number(el.dataset.uid)); return; }
  if (act === 'dilo-oir')  { Juego.diloEscucha(); return; }
  if (act === 'dilo-rec')  { Juego.grabar(); return; }
  if (act === 'dilo-play') { Juego.reproduce(); return; }
  if (act === 'dilo-sig')  { Juego.diloSiguiente(); return; }
});

/* selects de la zona de familia */
document.addEventListener('change', function (ev) {
  const el = ev.target.closest('[data-act="set"]'); if (!el) return;
  const k = el.dataset.k;
  let v = el.value;
  if (k === 'limite') v = Number(v);
  if (k === 'velocidad') v = Number(v);
  S.ajustes[k] = v; guardar();
  if (k === 'tema') tema();
  if (k === 'voz' || k === 'velocidad') Voz.di('Hello!');
  Padres.pinta();
});

/* botones fijos de la barra */
document.addEventListener('DOMContentLoaded', () => {
  $('#btn-padres').addEventListener('click', () => { Son.arranca(); Padres.abre(); });
  $('#btn-atras').addEventListener('click', () => {
    Son.toc();
    if (V.pantalla === 'juego' || V.pantalla === 'premio') irA('mundo');
    else if (V.pantalla === 'mundo' || V.pantalla === 'album') irA('mapa');
    else irA('portada');
  });
});

/* Escape cierra la hoja de familia */
document.addEventListener('keydown', e => { if (e.key === 'Escape' && Padres.abierta) Padres.cierra(); });

/* ══════════════ 19. INSTALAR Y FUNCIONAR SIN CONEXIÓN ══════════════
   Mismo criterio que en la app de adultos: la app se instala de
   verdad en la pantalla de inicio y se actualiza sola. Aquí hay
   una cautela extra: nunca se recarga a mitad de un juego, que
   para un niño de cuatro años es que «se rompió».              */

const Actualizacion = {
  reg: null, esperando: null, pedida: false, ultima: 0,

  init(reg) {
    Actualizacion.reg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) Actualizacion.lista(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing; if (!nuevo) return;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) Actualizacion.lista(nuevo);
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!Actualizacion.pedida) return;
      Actualizacion.pedida = false;
      location.reload();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') Actualizacion.busca();
    });
    window.addEventListener('focus', Actualizacion.busca);
    setInterval(Actualizacion.busca, 30 * 60 * 1000);
  },

  busca() {
    if (!Actualizacion.reg) return;
    const ahora = Date.now();
    if (ahora - Actualizacion.ultima < 60000) return;
    Actualizacion.ultima = ahora;
    Actualizacion.reg.update().catch(() => {});
  },

  /* jugando no se toca nada: se espera al próximo arranque */
  jugando() { return V.pantalla === 'juego' || Padres.abierta; },

  lista(sw) {
    Actualizacion.esperando = sw;
    if (Actualizacion.jugando()) return;
    Actualizacion.aplica();
  },

  aplica() {
    const sw = Actualizacion.esperando; if (!sw) return;
    Actualizacion.esperando = null;
    Actualizacion.pedida = true;
    try { sw.postMessage('saltar-espera'); }
    catch (e) { Actualizacion.pedida = false; location.reload(); }
  }
};

const App = {
  invitacion: null,     // el evento que Chrome guarda para poder instalar
  instalada: false,
  esIOS: false,
  esAndroid: false,

  init() {
    const ua = navigator.userAgent;
    App.esIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    App.esAndroid = /Android/.test(ua);
    /* Chrome en iPhone no puede instalar apps web: solo Safari. */
    App.esChromeIOS = App.esIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    /* Navegador de dentro de otra app (WhatsApp, Instagram, Facebook…):
       jamás ofrece instalar. Es la causa nº 1 de "no me sale el botón". */
    App.enApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Twitter|MicroMessenger|TikTok|; wv\)/i.test(ua);
    App.instalada = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                    window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      App.invitacion = e;
      pinta();
      if (Padres.abierta) Padres.pinta();
    });
    window.addEventListener('appinstalled', () => {
      App.invitacion = null; App.instalada = true;
      tostada('SpeakUp Kids instalada. Búscala en la pantalla de inicio.');
      pinta();
    });

    const seguro = location.protocol === 'https:' || location.hostname === 'localhost';
    if ('serviceWorker' in navigator && seguro) {
      window.addEventListener('load', () => {
        /* updateViaCache 'none' obliga a pedir sw.js a la red siempre;
           sin esto la app tarda hasta diez minutos en enterarse de que
           hay versión nueva. */
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
          .then(reg => Actualizacion.init(reg))
          .catch(() => {});
      });
    }
  },

  async instalar() {
    if (!App.invitacion) return;
    App.invitacion.prompt();
    try {
      const r = await App.invitacion.userChoice;
      if (r && r.outcome === 'accepted') tostada('Instalando…');
    } catch (e) {}
    App.invitacion = null;
    pinta();
    if (Padres.abierta) Padres.pinta();
  },

  /* Tarjeta de instalación, adaptada a lo que permita cada navegador.
     compacta = versión para la hoja de la zona de familia.          */
  /* ¿estamos dentro de un iframe? (una vista previa, no la app real) */
  embebido() { try { return window.self !== window.top; } catch (e) { return true; } },

  tarjeta(compacta) {
    const caja = (titulo, cuerpo) =>
      '<div class="instalar' + (compacta ? ' compacta' : '') + '">' +
      '<h3>📲 ' + titulo + '</h3>' + cuerpo + '</div>';

    if (App.embebido()) {
      return caja('Para instalarla como app',
        '<p>Esto es una vista previa. Ábrela en su propia dirección web y podrás añadirla a la pantalla de inicio, con su icono y funcionando sin internet.</p>');
    }

    if (App.instalada) {
      if (compacta) return caja('App instalada',
        '<p>Está funcionando como aplicación: pantalla completa y sin conexión.</p>');
      return '';
    }

    if (App.invitacion) {
      return caja('Instálala en el teléfono',
        '<p>Queda con su icono, a pantalla completa y sin barra de navegador. Y funciona sin internet: en el carro, en la sala de espera, donde sea.</p>' +
        '<button class="bt" type="button" data-act="instalar">Instalar SpeakUp Kids</button>');
    }

    /* Navegador de dentro de otra app: no hay instalación posible ahí. */
    if (App.enApp) {
      return caja('Ábrela en tu navegador',
        '<p>Estás viéndola dentro de otra aplicación, y desde ahí ningún navegador permite instalar.</p>' +
        '<ol class="pasos">' +
          '<li>Toca el menú <b>⋮</b> o <b>···</b> de esta pantalla.</li>' +
          '<li>Elige <b>Abrir en Chrome</b> o <b>Abrir en el navegador</b>' + (App.esIOS ? ' / <b>Abrir en Safari</b>' : '') + '.</li>' +
          '<li>Ahí ya te aparecerá la opción de instalar.</li>' +
        '</ol><p class="fino">También puedes copiar la dirección y pegarla directamente en el navegador.</p>');
    }

    if (App.esChromeIOS) {
      return caja('Cámbiate a Safari',
        '<p>En iPhone y iPad, solo Safari puede instalar aplicaciones web. Chrome y Firefox no tienen esa opción, por decisión de Apple.</p>' +
        '<ol class="pasos">' +
          '<li>Copia esta dirección y ábrela en <b>Safari</b>.</li>' +
          '<li>Toca <b>Compartir</b>, el cuadrado con la flecha hacia arriba.</li>' +
          '<li>Baja y elige <b>Añadir a pantalla de inicio</b>.</li>' +
        '</ol>');
    }

    if (App.esIOS) {
      return caja('Instálala en el iPhone o iPad',
        '<ol class="pasos">' +
          '<li>Ábrela en <b>Safari</b> (en iPhone, Chrome no puede instalar apps web).</li>' +
          '<li>Toca <b>Compartir</b>, el cuadrado con la flecha hacia arriba.</li>' +
          '<li>Baja y elige <b>Añadir a pantalla de inicio</b>.</li>' +
          '<li>Toca <b>Añadir</b>.</li>' +
        '</ol><p class="fino">Queda con su icono, a pantalla completa y funcionando sin internet.</p>');
    }

    if (App.esAndroid) {
      return caja('Instálala en el Android',
        '<ol class="pasos">' +
          '<li>Toca los <b>tres puntos</b> ⋮ arriba a la derecha de Chrome.</li>' +
          '<li>Elige <b>Añadir a pantalla de inicio</b> (o <b>Instalar aplicación</b>).</li>' +
          '<li>Confirma con <b>Instalar</b> o <b>Añadir</b>.</li>' +
        '</ol><p class="fino">Si no aparece: juega un minuto y vuelve a abrir el menú. Y asegúrate de estar en Chrome, no en el navegador de WhatsApp o Instagram — desde ahí nunca sale.</p>');
    }

    return caja('Instálala en la computadora',
      '<ol class="pasos">' +
        '<li>En Chrome o Edge, busca el icono de <b>instalar</b> en la barra de direcciones, a la derecha (una pantalla con una flecha).</li>' +
        '<li>Si no está, abre el menú <b>⋮</b> → <b>Enviar, guardar y compartir</b> → <b>Instalar página como aplicación</b>.</li>' +
      '</ol><p class="fino">En ventanas de incógnito no se puede instalar, y tampoco se guarda el progreso. Firefox de escritorio no instala apps web.</p>');
  }
};

/* ══════════════ 20. ARRANQUE ══════════════ */
function arranca() {
  nuevoDia();
  tema();
  App.init();
  Tiempo.arranca();
  if (!S.tramo) V.pantalla = 'portada'; else V.pantalla = 'mapa';
  pinta();
  setTimeout(() => {
    const a = document.getElementById('arranque');
    if (a) { a.classList.add('fuera'); setTimeout(() => a.remove(), 600); }
  }, 900);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
else arranca();

/* Se expone lo mínimo, por si quieres depurar desde la consola */
window.SpeakUpKids = { estado: () => S, ver: V, voz: Voz, app: App, instalar: () => App.instalar() };

})();
