"""Genera los iconos de SpeakUp Kids sin depender de ningún archivo externo.
Dibuja la mascota con formas simples: se ve nítida a cualquier tamaño."""
from PIL import Image, ImageDraw

W = 1024


def fondo(d, margen, radio, con_fondo=True):
    if not con_fondo:
        return
    # degradado naranja → rosa, pintado a franjas
    for y in range(W):
        t = y / W
        c = (int(255 - 5 * t), int(138 - 31 * t), int(61 + 96 * t))
        d.line([(0, y), (W, y)], fill=c)


def mascota(d, cx, cy, r):
    amarillo = (255, 209, 102)
    tinta = (43, 37, 64)
    rosa = (255, 158, 181)

    # antena
    d.line([(cx, cy - r - int(r * .30)), (cx, cy - r + int(r * .06))],
           fill=(255, 138, 61), width=int(r * .10))
    ra = int(r * .13)
    d.ellipse([cx - ra, cy - r - int(r * .44), cx + ra, cy - r - int(r * .44) + 2 * ra],
              fill=(255, 138, 61))

    # cara
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=amarillo)

    # mejillas
    rm = int(r * .15)
    for sx in (-1, 1):
        mx = cx + sx * int(r * .66)
        my = cy + int(r * .18)
        d.ellipse([mx - rm, my - rm, mx + rm, my + rm], fill=rosa)

    # ojos
    ro, rp = int(r * .21), int(r * .10)
    for sx in (-1, 1):
        ox = cx + sx * int(r * .33)
        oy = cy - int(r * .15)
        d.ellipse([ox - ro, oy - ro, ox + ro, oy + ro], fill=(255, 255, 255))
        d.ellipse([ox - rp + int(sx * r * .02), oy - rp + int(r * .04),
                   ox + rp + int(sx * r * .02), oy + rp + int(r * .04)], fill=tinta)

    # sonrisa
    bw = int(r * .12)
    caja = [cx - int(r * .40), cy + int(r * .04), cx + int(r * .40), cy + int(r * .62)]
    d.arc(caja, start=15, end=165, fill=tinta, width=bw)


def hacer(nombre, tam, escala_mascota=0.62, con_fondo=True):
    img = Image.new("RGB", (W, W), (255, 138, 61))
    d = ImageDraw.Draw(img)
    fondo(d, 0, 0, con_fondo)
    r = int(W * escala_mascota / 2)
    mascota(d, W // 2, int(W * 0.53), r)
    img = img.resize((tam, tam), Image.LANCZOS)
    img.save(nombre)
    print("→", nombre, tam)


hacer("icon-1024.png", 1024)
hacer("icon-512.png", 512)
hacer("icon-192.png", 192)
hacer("apple-touch-icon.png", 180)
# maskable: la mascota más pequeña, para que el recorte circular no la muerda
hacer("icon-maskable-512.png", 512, escala_mascota=0.46)
