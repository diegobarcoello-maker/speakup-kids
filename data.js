/* ============================================================
   SpeakUp Kids — Contenido

   Interfaz en español (para el niño y para quien le acompaña)
   Aprendizaje en inglés.

   TRAMOS: la edad manda. Un niño de 3 años y uno de 10 no
   comparten ni las mecánicas ni el contenido, así que cada
   tramo es un curso distinto, no un nivel del mismo curso.

   MUNDOS: unidades temáticas. Cada palabra lleva su emoji,
   que hace de dibujo: pesa cero, funciona sin conexión y se
   ve nativo en cualquier móvil.
   ============================================================ */

const TRAMOS = [
  {
    id: 'peques',
    nombre: 'Peques',
    edad: '3 a 5 años',
    emoji: '🧸',
    color: 'hierba',
    lema: 'Escuchar y tocar',
    desc: 'Sin leer y sin escribir. El niño oye la palabra y toca el dibujo.',
    activo: true
  },
  {
    id: 'medianos',
    nombre: 'Medianos',
    edad: '6 a 8 años',
    emoji: '🚀',
    color: 'cielo',
    lema: 'Sonidos y primeras letras',
    desc: 'La palabra empieza a verse escrita. Fonética, letra a letra.',
    activo: false
  },
  {
    id: 'grandes',
    nombre: 'Grandes',
    edad: '9 a 10 años',
    emoji: '🏆',
    color: 'uva',
    lema: 'Frases e historias',
    desc: 'Frases cortas, mini-historias y hablar de verdad.',
    activo: false
  }
];

/* ── MUNDOS ──────────────────────────────────────────────────
   activo: true  → jugable
   activo: false → se ve en el mapa con candado ("Pronto")     */

const MUNDOS = [

  /* ---------- PEQUES · 3 a 5 años ---------- */
  {
    id: 'animals', tramo: 'peques', nombre: 'Animales', emoji: '🐘',
    color: 'hierba', activo: true, sticker: '🦁',
    items: [
      { en: 'dog',      es: 'perro',    emoji: '🐶' },
      { en: 'cat',      es: 'gato',     emoji: '🐱' },
      { en: 'bird',     es: 'pájaro',   emoji: '🐦' },
      { en: 'fish',     es: 'pez',      emoji: '🐟' },
      { en: 'cow',      es: 'vaca',     emoji: '🐮' },
      { en: 'horse',    es: 'caballo',  emoji: '🐴' },
      { en: 'pig',      es: 'cerdo',    emoji: '🐷' },
      { en: 'duck',     es: 'pato',     emoji: '🦆' },
      { en: 'frog',     es: 'rana',     emoji: '🐸' },
      { en: 'bear',     es: 'oso',      emoji: '🐻' },
      { en: 'lion',     es: 'león',     emoji: '🦁' },
      { en: 'monkey',   es: 'mono',     emoji: '🐵' }
    ]
  },
  {
    id: 'colors', tramo: 'peques', nombre: 'Colores', emoji: '🎨',
    color: 'fresa', activo: true, sticker: '🌈',
    items: [
      { en: 'red',    es: 'rojo',     emoji: '🔴' },
      { en: 'blue',   es: 'azul',     emoji: '🔵' },
      { en: 'green',  es: 'verde',    emoji: '🟢' },
      { en: 'yellow', es: 'amarillo', emoji: '🟡' },
      { en: 'orange', es: 'naranja',  emoji: '🟠' },
      { en: 'purple', es: 'morado',   emoji: '🟣' },
      { en: 'brown',  es: 'café',     emoji: '🟤' },
      { en: 'black',  es: 'negro',    emoji: '⚫' },
      { en: 'white',  es: 'blanco',   emoji: '⚪' },
      { en: 'pink',   es: 'rosado',   emoji: '🌸' }
    ]
  },
  {
    id: 'food', tramo: 'peques', nombre: 'Comida', emoji: '🍎',
    color: 'sol', activo: true, sticker: '🍓',
    items: [
      { en: 'apple',  es: 'manzana', emoji: '🍎' },
      { en: 'banana', es: 'banana',  emoji: '🍌' },
      { en: 'bread',  es: 'pan',     emoji: '🍞' },
      { en: 'milk',   es: 'leche',   emoji: '🥛' },
      { en: 'water',  es: 'agua',    emoji: '💧' },
      { en: 'egg',    es: 'huevo',   emoji: '🥚' },
      { en: 'rice',   es: 'arroz',   emoji: '🍚' },
      { en: 'cheese', es: 'queso',   emoji: '🧀' },
      { en: 'cake',   es: 'pastel',  emoji: '🍰' },
      { en: 'soup',   es: 'sopa',    emoji: '🍲' }
    ]
  },
  {
    id: 'numbers', tramo: 'peques', nombre: 'Números', emoji: '🔢',
    color: 'cielo', activo: true, sticker: '🎯',
    items: [
      { en: 'one',   es: 'uno',    emoji: '1️⃣' },
      { en: 'two',   es: 'dos',    emoji: '2️⃣' },
      { en: 'three', es: 'tres',   emoji: '3️⃣' },
      { en: 'four',  es: 'cuatro', emoji: '4️⃣' },
      { en: 'five',  es: 'cinco',  emoji: '5️⃣' },
      { en: 'six',   es: 'seis',   emoji: '6️⃣' },
      { en: 'seven', es: 'siete',  emoji: '7️⃣' },
      { en: 'eight', es: 'ocho',   emoji: '8️⃣' },
      { en: 'nine',  es: 'nueve',  emoji: '9️⃣' },
      { en: 'ten',   es: 'diez',   emoji: '🔟' }
    ]
  },
  {
    id: 'family', tramo: 'peques', nombre: 'Mi familia', emoji: '👨‍👩‍👧',
    color: 'uva', activo: true, sticker: '❤️',
    items: [
      { en: 'mom',     es: 'mamá',    emoji: '👩' },
      { en: 'dad',     es: 'papá',    emoji: '👨' },
      { en: 'baby',    es: 'bebé',    emoji: '👶' },
      { en: 'sister',  es: 'hermana', emoji: '👧' },
      { en: 'brother', es: 'hermano', emoji: '👦' },
      { en: 'grandma', es: 'abuela',  emoji: '👵' },
      { en: 'grandpa', es: 'abuelo',  emoji: '👴' },
      { en: 'friend',  es: 'amigo',   emoji: '🧑‍🤝‍🧑' }
    ]
  },
  {
    id: 'body', tramo: 'peques', nombre: 'Mi cuerpo', emoji: '🖐️',
    color: 'fresa', activo: true, sticker: '⭐',
    items: [
      { en: 'hand',  es: 'mano',   emoji: '🖐️' },
      { en: 'foot',  es: 'pie',    emoji: '🦶' },
      { en: 'eye',   es: 'ojo',    emoji: '👁️' },
      { en: 'nose',  es: 'nariz',  emoji: '👃' },
      { en: 'mouth', es: 'boca',   emoji: '👄' },
      { en: 'ear',   es: 'oreja',  emoji: '👂' },
      { en: 'arm',   es: 'brazo',  emoji: '💪' },
      { en: 'tooth', es: 'diente', emoji: '🦷' }
    ]
  },

  /* ---------- MEDIANOS · 6 a 8 (aún no) ---------- */
  { id: 'school',  tramo: 'medianos', nombre: 'La escuela', emoji: '🎒', color: 'cielo', activo: false, sticker: '📘', items: [] },
  { id: 'actions', tramo: 'medianos', nombre: 'Acciones',   emoji: '🏃', color: 'hierba', activo: false, sticker: '⚡', items: [] },
  { id: 'letters', tramo: 'medianos', nombre: 'Los sonidos', emoji: '🔤', color: 'sol', activo: false, sticker: '🔠', items: [] },

  /* ---------- GRANDES · 9 a 10 (aún no) ---------- */
  { id: 'stories', tramo: 'grandes', nombre: 'Mini-historias', emoji: '📖', color: 'uva', activo: false, sticker: '📚', items: [] },
  { id: 'talk',    tramo: 'grandes', nombre: 'Habla conmigo', emoji: '💬', color: 'cielo', activo: false, sticker: '🎤', items: [] }
];

/* ── JUEGOS de cada mundo, en orden ──────────────────────────
   Diseñados para quien todavía no lee:
   1. descubre → tocar y oír, sin poder fallar. Calienta.
   2. escucha  → oye la palabra, toca el dibujo. El núcleo.
   3. parejas  → memoria; cada carta que se voltea repite la palabra.
   4. dilo     → se graba y se escucha. Sin puntaje, sin juicio.   */

const JUEGOS = [
  { id: 'descubre', nombre: 'Descubre',  emoji: '👀', pista: 'Toca cada dibujo y escucha' },
  { id: 'escucha',  nombre: 'Escucha',   emoji: '👂', pista: 'Escucha y toca el correcto' },
  { id: 'parejas',  nombre: 'Parejas',   emoji: '🃏', pista: 'Encuentra las parejas iguales' },
  { id: 'dilo',     nombre: 'Dilo tú',   emoji: '🎤', pista: 'Grábate diciéndolo' }
];

/* Frases de ánimo. Nunca se dice "mal": se dice "casi". */
const BIEN = ['¡Muy bien!', '¡Genial!', '¡Eso es!', '¡Perfecto!', '¡Bravo!', '¡Lo tienes!', '¡Qué crack!', '¡Sí señor!'];
const CASI = ['Casi… escucha otra vez', 'Ese no. ¡Prueba de nuevo!', 'Uy, ese no. Otra vez', 'Casi lo tienes'];

/* Stickers del álbum: se gana uno al terminar un mundo */
const TODOS_STICKERS = MUNDOS.map(m => ({ id: m.id, emoji: m.sticker, nombre: m.nombre }));
