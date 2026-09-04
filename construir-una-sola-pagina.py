"""Junta index.html + styles.css + data.js + app.js en una sola página.

Sirve para dos cosas:
  · probar la app desde un enlace, sin instalar ni clonar nada;
  · publicarla como Artifact para verla en el móvil al instante.

La versión buena, la que va a GitHub Pages, es la de archivos sueltos:
se cachea mejor y se edita sin reconstruir nada.
"""
import re
import pathlib

base = pathlib.Path(__file__).parent
lee = lambda n: (base / n).read_text(encoding="utf-8")

html = lee("index.html")
css = lee("styles.css")
data = lee("data.js")
app = lee("app.js")

# el service worker no existe en una sola página
app = app.replace("navigator.serviceWorker.register('sw.js')",
                  "Promise.reject(new Error('sin sw en la versión de una sola página'))")

cuerpo = re.search(r"<body>(.*)</body>", html, re.S).group(1)
# fuera las etiquetas <script src=...>: el código va incrustado más abajo
cuerpo = re.sub(r'\s*<script src="[^"]+"></script>', "", cuerpo)

salida = (
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    '<title>SpeakUp Kids</title>\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap">\n'
    "<style>\n" + css + "\n</style>\n"
    + cuerpo.strip() + "\n"
    "<script>\n" + data + "\n</script>\n"
    "<script>\n" + app + "\n</script>\n"
)

destino = base / "speakup-kids-una-pagina.html"
destino.write_text(salida, encoding="utf-8")
print("→", destino, len(salida), "bytes")
