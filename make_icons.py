import json
import os
import zipfile
import hashlib
import colorsys
import math
from dataclasses import dataclass
from typing import Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ============================================================
#                НАСТРОЙКИ РЕНДЕРА ИКОНКИ
# ============================================================

EXPORT_SIZE = 256       # размер итоговой иконки
SCALE = 2               # рендерим крупнее и даунскейлим для сглаживания
IMG_SIZE = EXPORT_SIZE * SCALE
CIRCLE_MARGIN = 24 * SCALE
BASE_FONT_SIZE = 64 * SCALE
OUTPUT_DIR = "icons"
ZIP_NAME = "battlecoin_icons.zip"

BACKGROUND_ALPHA = 0    # за монетой фон прозрачный


# ============================================================
#                ЗАГРУЗКА СПИСКА ТИКЕРОВ
# ============================================================

with open("symbols.json", "r", encoding="utf-8") as f:
    data = json.load(f)

symbols = [s["symbol"].upper() for s in data.get("symbols", [])]
print(f"Нашёл {len(symbols)} тикеров")


# ============================================================
#                УТИЛИТЫ ШРИФТА
# ============================================================

def get_font(size: int) -> ImageFont.FreeTypeFont:
    """
    Пытаемся взять жирный читабельный шрифт.
    На Windows подхватываем Arial/Segoe, на Linux — DejaVu.
    """
    search_paths = [
        # Linux / Mac
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/Library/Fonts/Arial.ttf",
        # Windows
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
    ]
    for path in search_paths:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


# ============================================================
#           РАБОТА С ЦВЕТОМ И ПАЛИТРОЙ ДЛЯ ТИКЕРА
# ============================================================

def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
    """h — 0..360, s,l — 0..1 → (r,g,b) 0..255"""
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l, s)
    return int(r * 255), int(g * 255), int(b * 255)


def lerp_color(c1: Tuple[int, int, int], c2: Tuple[int, int, int], t: float) -> Tuple[int, int, int]:
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t),
    )


@dataclass
class Palette:
    ring: Tuple[int, int, int]
    inner_dark: Tuple[int, int, int]
    inner_mid: Tuple[int, int, int]
    inner_light: Tuple[int, int, int]
    text_glow: Tuple[int, int, int]
    accent: Tuple[int, int, int]
    secondary: Tuple[int, int, int]


def palette_for_symbol(sym: str) -> Palette:
    """
    Детерминированно генерируем цветовую схему для тикера.
    """
    h_raw = int(hashlib.md5(sym.encode("utf-8")).hexdigest()[:8], 16)
    base_hue = h_raw % 360
    accent_hue = (base_hue + 40) % 360
    secondary_hue = (base_hue + 200) % 360

    ring = hsl_to_rgb(base_hue, 0.88, 0.60)
    inner_dark = hsl_to_rgb((base_hue + 330) % 360, 0.85, 0.10)
    inner_mid = hsl_to_rgb((base_hue + 350) % 360, 0.82, 0.18)
    inner_light = hsl_to_rgb((base_hue + 15) % 360, 0.92, 0.30)
    text_glow = hsl_to_rgb(base_hue, 0.96, 0.82)
    accent = hsl_to_rgb(accent_hue, 0.92, 0.65)
    secondary = hsl_to_rgb(secondary_hue, 0.80, 0.45)

    return Palette(
        ring=ring,
        inner_dark=inner_dark,
        inner_mid=inner_mid,
        inner_light=inner_light,
        text_glow=text_glow,
        accent=accent,
        secondary=secondary,
    )


# ============================================================
#        ДЕТЕРМИНИРОВАННЫЙ «ПСЕВДО-РАНДОМ» ДЛЯ ТИКЕРА
# ============================================================

class SymbolRng:
    """
    Повторяемый «рандом» для каждого тикера (LCG на хеше).
    """
    def __init__(self, sym: str):
        seed = int(hashlib.md5(sym.encode("utf-8")).hexdigest(), 16)
        self.state = seed & ((1 << 48) - 1)

    def rand(self) -> float:
        a = 25214903917
        c = 11
        m = 1 << 48
        self.state = (a * self.state + c) % m
        return self.state / m

    def choice(self, seq):
        idx = int(self.rand() * len(seq)) % len(seq)
        return seq[idx]


# ============================================================
#        КЛАССИФИКАЦИЯ ТИКЕРА ПО ТИПУ (СТИЛИ)
# ============================================================

MAJORS = {
    "BTC", "ETH", "BNB", "SOL", "XRP", "LTC", "TRX",
    "ADA", "DOGE", "TON", "DOT", "NEAR", "AVAX",
}
STABLE_BASES = {
    "USDT", "USDC", "FDUSD", "TUSD", "DAI", "EURS",
    "EUR", "AEUR", "EURT", "USD", "USDD", "USDP", "XUSD",
}
MEME_KEYWORDS = ["DOGE", "PEPE", "SHIB", "FLOKI", "BONK", "MEME", "BABY", "CAT", "DOG", "HAMSTER", "HMSTR"]
DEFI_KEYWORDS = ["SWAP", "DEX", "BANK", "LEND", "YFI", "UNI", "SUSHI", "AAVE", "COMP", "CAKE"]


def classify_symbol(full: str, base: str) -> str:
    """
    Возвращает одну из категорий:
    "major", "stable", "meme", "defi", "default"
    """
    b = base.upper()
    f = full.upper()

    if b in MAJORS:
        return "major"

    if b in STABLE_BASES or f in {b + "USDT", "USD1USDT"}:
        return "stable"

    for kw in MEME_KEYWORDS:
        if kw in f:
            return "meme"

    for kw in DEFI_KEYWORDS:
        if kw in f:
            return "defi"

    return "default"


# ============================================================
#                      ХЕЛПЕРЫ РИСОВАНИЯ
# ============================================================

def draw_rounded_rect(draw: ImageDraw.ImageDraw, bbox, radius, fill=None, outline=None, width=1):
    """
    Примитив «скруглённый прямоугольник» — для плашки текста.
    """
    x1, y1, x2, y2 = bbox
    r = radius
    if r <= 0:
        draw.rectangle(bbox, fill=fill, outline=outline, width=width)
        return

    # центральная часть
    draw.rectangle((x1 + r, y1, x2 - r, y2), fill=fill)
    draw.rectangle((x1, y1 + r, x2, y2 - r), fill=fill)

    # четыре угла-дуги
    draw.pieslice((x1, y1, x1 + 2*r, y1 + 2*r), 180, 270, fill=fill)
    draw.pieslice((x2 - 2*r, y1, x2, y1 + 2*r), 270, 360, fill=fill)
    draw.pieslice((x1, y2 - 2*r, x1 + 2*r, y2), 90, 180, fill=fill)
    draw.pieslice((x2 - 2*r, y2 - 2*r, x2, y2), 0, 90, fill=fill)

    if outline is not None and width > 0:
        # простой контур по периметру
        draw.rounded_rectangle(bbox, radius=r, outline=outline, width=width)


# ============================================================
#                  СЛОИ МОНЕТЫ / СПЕЦЭФФЕКТЫ
# ============================================================

def draw_outer_glow(base_img: Image.Image, palette: Palette, cx: int, cy: int, r: int):
    """
    Внешнее размазанное свечение монеты (на отдельном слое).
    """
    glow = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)

    ring = palette.ring
    for i_mul, alpha in [(1.35, 45), (1.18, 80), (1.05, 120)]:
        rr = int(r * i_mul)
        bbox = (cx - rr, cy - rr, cx + rr, cy + rr)
        col = (ring[0], ring[1], ring[2], alpha)
        gdraw.ellipse(bbox, fill=col)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=14 * SCALE))
    base_img.alpha_composite(glow)


def draw_inner_shadow(base_img: Image.Image, cx: int, cy: int, r: int):
    """
    Лёгкая внутренняя тень (чтобы центр был чуть темнее и текст выделялся).
    """
    shadow = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)

    inner_r = int(r * 0.95)
    bbox = (cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r)
    sdraw.ellipse(bbox, fill=(0, 0, 0, 140))

    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=18 * SCALE))
    base_img.alpha_composite(shadow)


def draw_radial_coin(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int):
    """
    Внутренняя монета: многослойный радиальный градиент + бликовый овал.
    """
    for i in range(r, 0, -1):
        t = i / r
        if t > 0.8:
            color = palette.inner_dark
        elif t > 0.45:
            color = lerp_color(palette.inner_mid, palette.inner_dark, (t - 0.45) / 0.35)
        else:
            color = lerp_color(palette.inner_light, palette.inner_mid, t / 0.45)

        bbox = (cx - i, cy - i, cx + i, cy + i)
        draw.ellipse(bbox, fill=color)

    # лёгкое центральное высветление
    highlight_r = int(r * 0.42)
    highlight_color = (*palette.inner_light, 90)
    bbox = (cx - highlight_r, cy - int(highlight_r * 0.7),
            cx + highlight_r, cy + int(highlight_r * 0.4))
    draw.ellipse(bbox, fill=highlight_color)


def draw_neon_ring(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int):
    """
    Неоновое кольцо + внутреннее светящееся кольцо.
    """
    ring = palette.ring

    # двойное свечение
    for offset, alpha, width in [(4 * SCALE, 70, 5 * SCALE), (2 * SCALE, 150, 3 * SCALE)]:
        c = (ring[0], ring[1], ring[2], alpha)
        bbox = (cx - r - offset, cy - r - offset, cx + r + offset, cy + r + offset)
        draw.ellipse(bbox, outline=c, width=width)

    # основной контур
    bbox = (cx - r, cy - r, cx + r, cy + r)
    draw.ellipse(bbox, outline=(ring[0], ring[1], ring[2], 255), width=3 * SCALE)

    # внутреннее кольцо-подсветка
    inner_r = int(r * 0.82)
    bbox = (cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r)
    col = (*palette.secondary, 160)
    draw.ellipse(bbox, outline=col, width=2 * SCALE)


def draw_rim_notches(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Насечка по ободу.
    """
    segments = 28 + int(rng.rand() * 18)
    notch_len = 7 * SCALE
    notch_width = 2 * SCALE

    for i in range(segments):
        t = i / segments
        angle = 2 * math.pi * t + (rng.rand() - 0.5) * 0.05
        inner = r - notch_len
        outer = r + 1 * SCALE

        x1 = cx + inner * math.cos(angle)
        y1 = cy + inner * math.sin(angle)
        x2 = cx + outer * math.cos(angle)
        y2 = cy + outer * math.sin(angle)

        c = (*palette.accent, 185)
        draw.line((x1, y1, x2, y2), fill=c, width=notch_width)


def draw_circuit_traces(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Кибер-трейсы: ломанные линии с узлами.
    """
    trace_count = 7 + int(rng.rand() * 7)
    for _ in range(trace_count):
        base_angle = rng.rand() * 2 * math.pi
        inner_r = r * (0.28 + rng.rand() * 0.18)
        mid_r = r * (0.48 + rng.rand() * 0.18)
        outer_r = r * (0.76 + rng.rand() * 0.08)

        points = []
        for rr in (inner_r, mid_r, outer_r):
            a = base_angle + (rng.rand() - 0.5) * 0.30
            x = cx + rr * math.cos(a)
            y = cy + rr * math.sin(a)
            points.append((x, y))

        color_main = (*palette.accent, 190)
        draw.line(points, fill=color_main, width=2 * SCALE)

        # узлы
        for (x, y) in points:
            node_r = 2 * SCALE + int(rng.rand() * 2 * SCALE)
            node_color = (*palette.text_glow, 220)
            draw.ellipse(
                (x - node_r, y - node_r, x + node_r, y + node_r),
                fill=node_color,
            )


def draw_particles(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Мелкие «звёздочки» / частицы.
    """
    count = 40 + int(rng.rand() * 40)

    for _ in range(count):
        dx = (rng.rand() * 2 - 1) * r
        dy = (rng.rand() * 2 - 1) * r
        if dx * dx + dy * dy > r * r:
            continue

        x = cx + dx
        y = cy + dy
        size = (rng.rand() * 2.7 + 0.6) * SCALE

        dist = math.sqrt(dx * dx + dy * dy) / r
        alpha = int(230 * (1 - dist * 0.7))
        col = (*palette.text_glow, alpha)

        draw.ellipse(
            (x - size, y - size, x + size, y + size),
            fill=col,
        )


def draw_inner_rings(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Внутренние тонкие кольца.
    """
    ring_count = 2 + int(rng.rand() * 3)
    for i in range(ring_count):
        t = 0.32 + 0.16 * i + rng.rand() * 0.06
        rr = int(r * t)
        alpha = 70 + int(90 * rng.rand())
        col = (*palette.secondary, alpha)
        bbox = (cx - rr, cy - rr, cx + rr, cy + rr)
        draw.ellipse(bbox, outline=col, width=1 * SCALE)


def draw_hologram_grid(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Лёгкая голографическая сетка внутри монеты.
    """
    step = 18 * SCALE
    col = (*palette.secondary, 55)

    for dx in range(-r, r + 1, step):
        draw.line((cx + dx, cy - r, cx + dx, cy + r), fill=col, width=1)
    for dy in range(-r, r + 1, step):
        draw.line((cx - r, cy + dy, cx + r, cy + dy), fill=col, width=1)


def draw_light_rays(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Радиальные лучи (для топ-коинов).
    """
    ray_count = 8
    for i in range(ray_count):
        angle = 2 * math.pi * i / ray_count + rng.rand() * 0.1
        inner_r = r * 0.4
        outer_r = r * 1.1

        x1 = cx + inner_r * math.cos(angle)
        y1 = cy + inner_r * math.sin(angle)
        x2 = cx + outer_r * math.cos(angle + 0.04)
        y2 = cy + outer_r * math.sin(angle + 0.04)
        x3 = cx + outer_r * math.cos(angle - 0.04)
        y3 = cy + outer_r * math.sin(angle - 0.04)

        poly = [ (x1, y1), (x2, y2), (x3, y3) ]
        col = (*palette.accent, 70)
        draw.polygon(poly, fill=col)


def draw_orbit_arcs(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Орбиты — дуги вокруг центра.
    """
    orbit_count = 3 + int(rng.rand() * 3)
    for i in range(orbit_count):
        rr = int(r * (0.45 + 0.1 * i + rng.rand() * 0.04))
        start = int(rng.rand() * 360)
        end = start + int(140 + rng.rand() * 120)
        alpha = 80 + int(60 * rng.rand())
        col = (*palette.accent, alpha)
        bbox = (cx - rr, cy - rr, cx + rr, cy + rr)
        draw.arc(bbox, start=start, end=end, fill=col, width=2 * SCALE)


def draw_binary_rain(draw: ImageDraw.ImageDraw, palette: Palette, cx: int, cy: int, r: int, rng: SymbolRng):
    """
    Столбики из 0/1 — матричный «дождь» внутри монеты.
    """
    font = get_font(10 * SCALE)
    count = 14 + int(rng.rand() * 10)

    for _ in range(count):
        angle = rng.rand() * 2 * math.pi
        inner_r = r * (0.15 + rng.rand() * 0.2)
        length = r * (0.3 + rng.rand() * 0.4)
        steps = int(length / (12 * SCALE))

        for s in range(steps):
            rr = inner_r + s * (12 * SCALE)
            x = cx + rr * math.cos(angle)
            y = cy + rr * math.sin(angle)

            # ближе к краю — прозрачнее
            dist = rr / r
            alpha = int(180 * (1 - dist * 0.8))
            ch = rng.choice(["0", "1"])
            col = (*palette.text_glow, alpha)
            draw.text((x, y), ch, font=font, fill=col)


# ============================================================
#                   ТЕКСТ: ТИКЕР + USDT
# ============================================================

def split_symbol(sym: str) -> Tuple[str, str]:
    """
    BTCUSDT → (BTC, USDT)
    Если тикер не оканчивается на USDT — нижняя строка пустая.
    """
    if sym.endswith("USDT") and len(sym) > 4:
        base = sym[:-4]
        quote = "USDT"
        return base, quote
    return sym, ""


def fit_text_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, base_size: int) -> ImageFont.FreeTypeFont:
    """
    Подбираем размер шрифта так, чтобы текст влезал по ширине.
    """
    size = base_size
    while size > 14 * SCALE:
        fnt = get_font(size)
        bbox = draw.textbbox((0, 0), text, font=fnt)
        tw = bbox[2] - bbox[0]
        if tw <= max_width:
            return fnt
        size -= 2 * SCALE
    return get_font(size)


def text_main_color(category: str) -> Tuple[int, int, int, int]:
    """
    Немного разные оттенки текста для разных типов монет,
    но всегда очень контрастные.
    """
    if category == "major":
        return (255, 245, 220, 255)  # тёплый почти белый
    if category == "stable":
        return (220, 245, 255, 255)  # холодный белый
    if category == "meme":
        return (255, 235, 255, 255)  # розовато-белый
    if category == "defi":
        return (235, 245, 255, 255)
    return (240, 248, 255, 255)


def draw_ticker_text_two_lines(
    draw: ImageDraw.ImageDraw,
    base: str,
    quote: str,
    palette: Palette,
    cx: int,
    cy: int,
    category: str,
):
    """
    Верхняя строка: тикер (BTC, ETH…)
    Нижняя строка: USDT.
    Под ними — тёмная плашка, чтобы текст не сливался с фоном.
    """
    max_text_width = int(IMG_SIZE * 0.72)

    base_font = fit_text_font(draw, base, max_text_width, BASE_FONT_SIZE)
    base_bbox = draw.textbbox((0, 0), base, font=base_font)
    base_w = base_bbox[2] - base_bbox[0]
    base_h = base_bbox[3] - base_bbox[1]

    if quote:
        quote_font = fit_text_font(draw, quote, max_text_width, int(BASE_FONT_SIZE * 0.60))
        quote_bbox = draw.textbbox((0, 0), quote, font=quote_font)
        quote_w = quote_bbox[2] - quote_bbox[0]
        quote_h = quote_bbox[3] - quote_bbox[1]
    else:
        quote_font = None
        quote_w = quote_h = 0

    total_height = base_h + (quote_h + 6 * SCALE if quote else 0)

    # общий блок текста чуть выше геометрического центра
    top_y = cy - total_height // 2 - 4 * SCALE
    base_x = cx - base_w // 2
    base_y = top_y

    # --- Плашка под текст ---
    panel_pad_x = 24 * SCALE
    panel_pad_y = 10 * SCALE
    panel_w = max(base_w, quote_w) + 2 * panel_pad_x
    panel_h = total_height + 2 * panel_pad_y

    panel_x1 = cx - panel_w // 2
    panel_y1 = cy - panel_h // 2 - 4 * SCALE
    panel_x2 = panel_x1 + panel_w
    panel_y2 = panel_y1 + panel_h

    panel_radius = 18 * SCALE
    panel_fill = (5, 8, 20, 190)      # тёмный фон
    panel_outline = (0, 0, 0, 220)

    draw_rounded_rect(
        draw,
        (panel_x1, panel_y1, panel_x2, panel_y2),
        radius=panel_radius,
        fill=panel_fill,
        outline=panel_outline,
        width=1 * SCALE,
    )

    # лёгкий ободок по краю плашки в цвет акцента
    border_col = (*palette.accent, 130)
    draw.rounded_rectangle(
        (panel_x1 + 1 * SCALE, panel_y1 + 1 * SCALE,
         panel_x2 - 1 * SCALE, panel_y2 - 1 * SCALE),
        radius=panel_radius,
        outline=border_col,
        width=1 * SCALE,
    )

    # --- Рисуем основной текст ---

    main_col = text_main_color(category)
    dark_stroke = (0, 0, 0, 255)
    glow_col = (*palette.text_glow, 235)

    # чёрный «fat stroke»
    stroke_offsets = [
        (-2 * SCALE, 0), (2 * SCALE, 0),
        (0, -2 * SCALE), (0, 2 * SCALE),
        (-2 * SCALE, -2 * SCALE), (2 * SCALE, -2 * SCALE),
        (-2 * SCALE, 2 * SCALE), (2 * SCALE, 2 * SCALE),
    ]
    for dx, dy in stroke_offsets:
        draw.text((base_x + dx, base_y + dy), base, font=base_font, fill=dark_stroke)

    # неоновый слой
    for dx, dy in [(-1 * SCALE, 0), (1 * SCALE, 0), (0, -1 * SCALE), (0, 1 * SCALE)]:
        draw.text((base_x + dx, base_y + dy), base, font=base_font, fill=glow_col)

    # основной текст
    draw.text((base_x, base_y), base, font=base_font, fill=main_col)

    if quote and quote_font:
        quote_x = cx - quote_w // 2
        quote_y = base_y + base_h + 6 * SCALE

        for dx, dy in stroke_offsets:
            draw.text((quote_x + dx, quote_y + dy), quote, font=quote_font, fill=dark_stroke)

        quote_glow = (*palette.text_glow, 210)
        for dx, dy in [(-1 * SCALE, 0), (1 * SCALE, 0), (0, -1 * SCALE), (0, 1 * SCALE)]:
            draw.text((quote_x + dx, quote_y + dy), quote, font=quote_font, fill=quote_glow)

        draw.text((quote_x, quote_y), quote, font=quote_font, fill=main_col)


# ============================================================
#                   ГЕНЕРАЦИЯ ИКОНКИ ДЛЯ ТИКЕРА
# ============================================================

def render_symbol_icon(sym: str, out_path: str):
    """
    Рисуем одну иконку для заданного тикера.
    """
    img = Image.new("RGBA", (IMG_SIZE, IMG_SIZE), (0, 0, 0, BACKGROUND_ALPHA))
    draw = ImageDraw.Draw(img)

    cx, cy = IMG_SIZE // 2, IMG_SIZE // 2
    r = IMG_SIZE // 2 - CIRCLE_MARGIN

    palette = palette_for_symbol(sym)
    rng = SymbolRng(sym)

    base, quote = split_symbol(sym)
    category = classify_symbol(sym, base)

    # 0. внешний glow
    draw_outer_glow(img, palette, cx, cy, r)

    # 1. внутренняя монета
    draw_radial_coin(draw, palette, cx, cy, r - 4 * SCALE)

    # 1.5 внутренняя тень
    draw_inner_shadow(img, cx, cy, r - 6 * SCALE)

    # 2. категория-специфические слои
    if category == "major":
        draw_light_rays(draw, palette, cx, cy, r - 6 * SCALE, rng)
        draw_orbit_arcs(draw, palette, cx, cy, r - 10 * SCALE, rng)
        draw_inner_rings(draw, palette, cx, cy, r - 8 * SCALE, rng)
    elif category == "stable":
        draw_hologram_grid(draw, palette, cx, cy, int(r * 0.92), rng)
        draw_orbit_arcs(draw, palette, cx, cy, r - 8 * SCALE, rng)
        draw_inner_rings(draw, palette, cx, cy, r - 10 * SCALE, rng)
    elif category == "meme":
        draw_binary_rain(draw, palette, cx, cy, r - 8 * SCALE, rng)
        draw_particles(draw, palette, cx, cy, r - 8 * SCALE, rng)
        draw_inner_rings(draw, palette, cx, cy, r - 6 * SCALE, rng)
    elif category == "defi":
        draw_circuit_traces(draw, palette, cx, cy, r - 10 * SCALE, rng)
        draw_orbit_arcs(draw, palette, cx, cy, r - 8 * SCALE, rng)
        draw_inner_rings(draw, palette, cx, cy, r - 6 * SCALE, rng)
    else:
        draw_inner_rings(draw, palette, cx, cy, r - 8 * SCALE, rng)
        draw_orbit_arcs(draw, palette, cx, cy, r - 9 * SCALE, rng)

    # 3. универсальные трейсы / частицы
    draw_circuit_traces(draw, palette, cx, cy, r - 12 * SCALE, rng)
    draw_particles(draw, palette, cx, cy, r - 10 * SCALE, rng)

    # 4. насечки по краю
    draw_rim_notches(draw, palette, cx, cy, r, rng)

    # 5. неоновое кольцо
    draw_neon_ring(draw, palette, cx, cy, r)

    # 6. текст
    draw_ticker_text_two_lines(draw, base, quote, palette, cx, cy, category)

    # 7. даунскейл до итогового размера для идеального сглаживания
    try:
        resample = Image.Resampling.LANCZOS
    except AttributeError:
        resample = Image.LANCZOS

    img_final = img.resize((EXPORT_SIZE, EXPORT_SIZE), resample=resample)
    img_final.save(out_path, format="PNG")


# ============================================================
#                     ОСНОВНОЙ ЦИКЛ
# ============================================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

for sym in symbols:
    filename = f"{sym}.png"
    path = os.path.join(OUTPUT_DIR, filename)
    render_symbol_icon(sym, path)
    print("Сделал", filename)

# ============================================================
#                   УПАКОВКА В ZIP
# ============================================================

zip_path = ZIP_NAME
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for fname in os.listdir(OUTPUT_DIR):
        if fname.lower().endswith(".png"):
            z.write(os.path.join(OUTPUT_DIR, fname), arcname=fname)

print("Готово! Архив:", zip_path)
