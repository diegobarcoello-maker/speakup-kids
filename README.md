# SpeakUp Kids

Inglés para niños de 3 a 10 años. Interfaz en español, aprendizaje en inglés.
Aplicación web instalable (PWA), sin backend, sin dependencias y sin conexión obligatoria.

Hermana pequeña de [SpeakUp](https://diegobarcoello-maker.github.io/speakup/), la app de
inglés A1–B2 con enfoque en negocios. Comparte la filosofía —todo en el navegador, todo
gratis de operar— pero **no comparte el contenido**: un niño de tres años no lee, no
escribe y no entiende una explicación gramatical, así que la capa pedagógica es otra.

---

## Cómo publicarlo

Repositorio nuevo, independiente. Mismo procedimiento que SpeakUp.

1. **Descomprimir este zip.** Android e iPhone lo hacen solos desde la app
   Archivos: tocar el `.zip` y elegir «Extraer» / «Descomprimir».
2. **Crear el repositorio.** github.com → `+` → *New repository* →
   nombre `speakup-kids` → **Public** → *Create repository*.
3. **Subir los archivos.** En el repo vacío: *uploading an existing file* →
   seleccionar **todos** los archivos de la carpeta a la vez (no la carpeta:
   los archivos sueltos, para que `index.html` quede en la raíz) → *Commit changes*.
4. **Encender Pages.** *Settings* → *Pages* → **Source: Deploy from a branch** →
   **Branch: `main` / `(root)`** → *Save*.
5. Esperar entre uno y dos minutos. Queda en:

   ```
   https://diegobarcoello-maker.github.io/speakup-kids/
   ```

Ese enlace es público y funciona en cualquier operador, cualquier red y cualquier
teléfono. No hay servidor, no hay cuenta y no hay costo.

> `README.md`, `hacer-iconos.py` y `construir-una-sola-pagina.py` pueden subirse
> también: son documentación y herramientas, no estorban a la app.

### Instalarla como app

Igual que SpeakUp. Al abrir el enlace, la propia app ofrece el botón
**«Instalar SpeakUp Kids»** en la portada cuando el navegador lo permite, y si no,
muestra los pasos del sistema. También están en **⚙️ → Zona de familia**.

- **Android / Chrome:** botón «Instalar», o menú ⋮ → *Instalar aplicación*.
- **iPhone / Safari:** Compartir → *Añadir a pantalla de inicio*.

Queda con su icono, a pantalla completa, sin barra de navegador y funcionando sin
internet. La app se actualiza sola cuando subes una versión nueva al repo — pero
nunca a mitad de un juego: espera al siguiente arranque.

---

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Esqueleto: splash, barra superior, contenedor y capas |
| `styles.css` | Tokens de color, modo claro/oscuro y todos los componentes |
| `data.js` | Contenido: tramos de edad, mundos temáticos, palabras y juegos |
| `app.js` | Motor completo: estado, voz, sonidos, juegos, zona de familia |
| `sw.js` | Service worker: la app funciona sin conexión |
| `manifest.json` | Instalación como app |
| `icon-*.png` | Iconos, generados por `hacer-iconos.py` |
| `hacer-iconos.py` | Regenera los iconos desde código (necesita Pillow) |
| `construir-una-sola-pagina.py` | Junta todo en un único `.html` para probar por enlace |

---

## Decisiones de diseño

**Tres tramos de edad, no niveles.** Un niño de 3 y uno de 10 no comparten mecánicas.
`peques` (3–5) es el único activo; `medianos` (6–8) y `grandes` (9–10) están definidos
en `data.js` y aparecen en la portada marcados como «Pronto».

**Sin leer para poder jugar.** En Peques todo entra por el oído y sale por el dedo.
La palabra escrita se muestra, pero nunca hace falta para avanzar.

**No se puede perder.** No hay vidas, ni reloj, ni «incorrecto». Un fallo apaga esa
opción y repite el audio; al segundo fallo, la respuesta correcta late para guiar.
Nunca se dice «mal»: se dice «casi».

**Los dibujos son emoji.** Pesan cero, no tienen licencia que revisar, funcionan sin
conexión y se ven nativos en cualquier teléfono. Cuando haya ilustraciones propias
en SVG, se cambia el campo `emoji` de `data.js` por `svg` sin tocar el motor.

**Todo el audio se sintetiza en el aparato.** La voz usa la Web Speech API del sistema;
los premios y avisos son osciladores de Web Audio. Cero archivos de sonido, cero
descargas, cero costo por uso.

**Grabarse en vez de puntuar la pronunciación.** El reconocimiento de voz falla mucho
con voces infantiles y calificar mal desanima. En «Dilo tú» el niño se graba y se
escucha: la comparación la hace su propio oído, sin juicio.

**Los ajustes viven detrás de una puerta.** La rueda ⚙️ pide resolver una multiplicación
antes de abrir la zona de familia. No es una caja fuerte, es una puerta: suficiente
para que no la cruce solo quien todavía no multiplica.

**Cero red durante el juego.** No hay anuncios, ni compras, ni enlaces salientes, ni
cuentas, ni IA. Todo el progreso se guarda en `localStorage` del propio aparato.

---

## Estructura del contenido

Añadir un mundo nuevo es añadir un objeto a `MUNDOS` en `data.js`:

```js
{
  id: 'food', tramo: 'peques', nombre: 'Comida', emoji: '🍎',
  color: 'sol',            // hierba · cielo · fresa · sol · uva
  activo: true,            // false = aparece con candado
  sticker: '🍓',           // se gana al terminar los 4 juegos
  items: [
    { en: 'apple', es: 'manzana', emoji: '🍎' }
  ]
}
```

Los cuatro juegos (`descubre`, `escucha`, `parejas`, `dilo`) funcionan con cualquier
mundo que tenga al menos 6 palabras. No hay que tocar `app.js`.

---

## Estado actual

Los tres tramos jugables. **14 mundos, 154 palabras, 64 juegos.**

| Tramo | Mundos | Palabras | Juegos por mundo |
|---|---|---|---|
| Peques 3–5 | Animales, Colores, Comida, Números, Mi familia, Mi cuerpo | 58 | 4 |
| Medianos 6–8 | La escuela, Acciones, La ropa, El clima | 48 | 5 |
| Grandes 9–10 | La ciudad, Deportes, Viajar, Los trabajos | 48 | 5 |

**Los cinco juegos:**

1. **Descubre** — toca cada dibujo y lo oyes. No se puede fallar; calienta.
2. **Escucha** — oyes la palabra, tocas el dibujo. El núcleo del método.
3. **Léelo** — *solo 6–10 años.* Ves la palabra **escrita**, sin audio, y tocas el
   dibujo. Hay un botón para oírla si se atasca. Es lo que separa a quien ya lee.
4. **Parejas** — memoria; cada carta que se voltea repite la palabra en voz alta.
5. **Dilo tú** — se graba y se escucha. Sin puntaje y sin juicio.

Terminar todos los juegos de un mundo da su pegatina. Catorce pegatinas en total.

También: portada con selección de edad, álbum, zona de familia (métricas, límite de
tiempo diario, voz, velocidad, tema, reinicio), modo claro y oscuro, instalable
como app y funcionando sin conexión.

## Lo siguiente

1. Fonética real para Medianos: qué sonido hace cada letra, formar la palabra
   arrastrando letras. Necesita una mecánica nueva, no solo vocabulario.
2. Mini-historias y conversación para Grandes.
3. Perfiles: varios niños en el mismo aparato.
4. Ilustraciones SVG propias sustituyendo los emoji, mundo por mundo.
