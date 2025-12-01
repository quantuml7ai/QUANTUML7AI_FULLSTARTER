# make_icons_shaders.py
import json
import os
import zipfile
import hashlib
import colorsys
import math
from dataclasses import dataclass
from typing import Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import moderngl

# ============================================================
#                НАСТРОЙКИ РЕНДЕРА ИКОНКИ
# ============================================================

EXPORT_SIZE = 256       # размер итоговой иконки
SCALE = 2               # рендерим крупнее и даунскейлим для сглаживания
IMG_SIZE = EXPORT_SIZE * SCALE
CIRCLE_MARGIN = 24 * SCALE
BASE_FONT_SIZE = 64 * SCALE
OUTPUT_DIR = "icons"
ZIP_NAME = "battlecoin_icons_shaders.zip"

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
    base: Tuple[int, int, int]


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
    base = hsl_to_rgb(base_hue, 0.75, 0.25)

    return Palette(
        ring=ring,
        inner_dark=inner_dark,
        inner_mid=inner_mid,
        inner_light=inner_light,
        text_glow=text_glow,
        accent=accent,
        secondary=secondary,
        base=base,
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
#                      ХЕЛПЕРЫ ТЕКСТА
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
    но всегда контрастные.
    """
    if category == "major":
        return (255, 245, 220, 255)  # тёплый почти белый
    if category == "stable":
        return (220, 245, 255, 255)  # холодный белый
    if category == "meme":
        return (255, 235, 255, 255)  # легкий розовый
    if category == "defi":
        return (235, 245, 255, 255)
    return (240, 248, 255, 255)


def draw_ticker_text_two_lines(
    img: Image.Image,
    base: str,
    quote: str,
    palette: Palette,
    category: str,
):
    """
    Верхняя строка: тикер (BTC, ETH…)
    Нижняя строка: USDT.
    Больше НИКАКИХ прямоугольников: только мягкая круговая тень
    и свечение, всё внутри монеты.
    """
    draw = ImageDraw.Draw(img)

    cx, cy = IMG_SIZE // 2, IMG_SIZE // 2
    r_text = IMG_SIZE // 2 - CIRCLE_MARGIN + int(4 * SCALE)

    # — тёмная круговая «линза» под текст (чтобы не сливался с фоном)
    mask = Image.new("L", img.size, 0)
    mdraw = ImageDraw.Draw(mask)
    lens_r = int(r_text * 0.65)
    bbox = (cx - lens_r, cy - lens_r, cx + lens_r, cy + lens_r)
    mdraw.ellipse(bbox, fill=220)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=16 * SCALE))

    dim_layer = Image.new(
        "RGBA",
        img.size,
        (0, 0, 0, 200),
    )
    img.alpha_composite(dim_layer, mask=mask)

    # --- Текст ---
    max_text_width = int(IMG_SIZE * 0.68)

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

    top_y = cy - total_height // 2 - 2 * SCALE
    base_x = cx - base_w // 2
    base_y = top_y

    # рассчитываем, чтобы текст точно не вылез за круг
    # (по сути ограничиваем радиус текст-бокса)
    max_radius_for_text = r_text - 6 * SCALE
    half_diag = 0.5 * math.sqrt(base_w * base_w + total_height * total_height)
    if half_diag > max_radius_for_text and half_diag > 0:
        k = max_radius_for_text / half_diag
        # если вдруг — уменьшаем размер шрифта и пересчитываем
        new_base_size = max(int(BASE_FONT_SIZE * k), int(24 * SCALE))
        base_font = fit_text_font(draw, base, max_text_width, new_base_size)
        base_bbox = draw.textbbox((0, 0), base, font=base_font)
        base_w = base_bbox[2] - base_bbox[0]
        base_h = base_bbox[3] - base_bbox[1]
        if quote and quote_font:
            quote_font = fit_text_font(draw, quote, max_text_width, int(new_base_size * 0.6))
            quote_bbox = draw.textbbox((0, 0), quote, font=quote_font)
            quote_w = quote_bbox[2] - quote_bbox[0]
            quote_h = quote_bbox[3] - quote_bbox[1]
        total_height = base_h + (quote_h + 6 * SCALE if quote else 0)
        top_y = cy - total_height // 2 - 2 * SCALE
        base_x = cx - base_w // 2
        base_y = top_y

    main_col = text_main_color(category)
    dark_stroke = (0, 0, 0, 255)
    glow_col = (*palette.text_glow, 230)

    # толстый чёрный stroke
    stroke_offsets = [
        (-2 * SCALE, 0), (2 * SCALE, 0),
        (0, -2 * SCALE), (0, 2 * SCALE),
        (-2 * SCALE, -2 * SCALE), (2 * SCALE, -2 * SCALE),
        (-2 * SCALE, 2 * SCALE), (2 * SCALE, 2 * SCALE),
    ]
    for dx, dy in stroke_offsets:
        draw.text((base_x + dx, base_y + dy), base, font=base_font, fill=dark_stroke)

    # неон
    for dx, dy in [(-1 * SCALE, 0), (1 * SCALE, 0), (0, -1 * SCALE), (0, 1 * SCALE)]:
        draw.text((base_x + dx, base_y + dy), base, font=base_font, fill=glow_col)

    # основной текст
    draw.text((base_x, base_y), base, font=base_font, fill=main_col)

    if quote and quote_font:
        quote_x = cx - quote_w // 2
        quote_y = base_y + base_h + 6 * SCALE

        for dx, dy in stroke_offsets:
            draw.text((quote_x + dx, quote_y + dy), quote, font=quote_font, fill=dark_stroke)

        quote_glow = (*palette.text_glow, 215)
        for dx, dy in [(-1 * SCALE, 0), (1 * SCALE, 0), (0, -1 * SCALE), (0, 1 * SCALE)]:
            draw.text((quote_x + dx, quote_y + dy), quote, font=quote_font, fill=quote_glow)

        draw.text((quote_x, quote_y), quote, font=quote_font, fill=main_col)


# ============================================================
#                        GLSL ШЕЙДЕР
# ============================================================

VERT_SHADER = """
#version 330

in vec2 in_pos;
out vec2 v_uv;

void main() {
    v_uv = in_pos * 0.5 + 0.5;      // -1..1 -> 0..1
    gl_Position = vec4(in_pos, 0.0, 1.0);
}
"""

FRAG_SHADER = """
#version 330

in vec2 v_uv;
out vec4 f_color;


uniform vec3  u_color_main;
uniform vec3  u_color_accent;
uniform vec3  u_color_ring;
uniform vec3  u_color_secondary;
uniform float u_seed;
uniform int   u_variant;   // 0 major, 1 stable, 2 meme, 3 defi, 4 default

// ------------------------------------------------------------
//                 ХЕЛПЕРЫ ШЕЙДЕРА (noise / shapes)
// ------------------------------------------------------------

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

// плавный step с контролем толщины
float sstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// маленькие блёстки
float star(vec2 p, float scale) {
    p *= scale;
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float n = hash21(ip);
    float d = length(fp - 0.5);
    float m = smoothstep(0.5, 0.0, d);

    return m * n;
}

// ------------------------------------------------------------
//                      ОСНОВНОЙ ШЕЙДЕР
// ------------------------------------------------------------

void main() {
    vec2 uv = v_uv;
    vec2 centered = (uv - 0.5) * 2.0;    // [-1;1]
    float r = length(centered);
    float angle = atan(centered.y, centered.x);

    // маска круга
    float circle = 1.0 - sstep(1.0, 1.01, r);  // 0 снаружи, 1 внутри

    if (circle <= 0.0) {
        f_color = vec4(0.0);
        return;
    }

    // базовый радиальный градиент монеты
    float inner = 1.0 - r;
    inner = clamp(inner, 0.0, 1.0);

    float inner_core = sstep(0.10, 0.75, 1.0 - r);
    float edge      = sstep(0.80, 0.98, r);

    vec3 base = mix(u_color_main * 0.25, u_color_main, inner_core);
    base += 0.15 * u_color_secondary * (1.0 - inner_core);

    // шум слегка модулирует яркость
    float n = noise(centered * 3.5 + u_seed * 2.1);
    base *= 0.85 + 0.25 * n;

    // более тёмный центр под текст
    float text_zone = sstep(0.0, 0.70, r) * (1.0 - sstep(0.35, 0.80, r));
    base *= mix(0.35, 1.0, 1.0 - text_zone);

    // периферийное свечение
    float rimBright = sstep(0.82, 1.02, r);
    base += rimBright * u_color_secondary * 0.25;

    vec3 col = base;

    // --------------------------------------------------------
    //                 ВНУТРЕННЯЯ ГРИД-СЕТКА
    // --------------------------------------------------------
    float grid = 0.0;
    {
        vec2 g = centered * 4.0;
        float lineX = abs(fract(g.x + 0.5) - 0.5) / fwidth(g.x);
        float lineY = abs(fract(g.y + 0.5) - 0.5) / fwidth(g.y);
        float gx = exp(-lineX * 1.2);
        float gy = exp(-lineY * 1.2);
        grid = clamp(gx + gy, 0.0, 1.0);
    }

    // --------------------------------------------------------
    //                 ЛУЧИ / ОРБИТЫ / РЕЖИМЫ
    // --------------------------------------------------------
    float rays = 0.0;
    float orbits = 0.0;
    float bits = 0.0;
    float circuits = 0.0;

    // общие параметры
    float rayCount = 8.0;
    float rayIdx = floor((angle + 3.14159) / (6.28318 / rayCount));

    // major: сильные лучи, насыщенные орбиты
    if (u_variant == 0) {
        float a0 = rayIdx * (6.28318 / rayCount);
        float dA = abs(angle - a0);
        float rayMask = exp(-pow(dA * 10.0, 2.0)) * (1.0 - sstep(0.0, 0.20, r));
        rays = rayMask;

        float ring1 = 1.0 - abs(r - 0.55) / 0.02;
        float ring2 = 1.0 - abs(r - 0.78) / 0.03;
        orbits = clamp(ring1, 0.0, 1.0) + clamp(ring2, 0.0, 1.0);
    }
    // stable: аккуратная сетка и тихие орбиты
    else if (u_variant == 1) {
        float ring1 = 1.0 - abs(r - 0.52) / 0.02;
        float ring2 = 1.0 - abs(r - 0.75) / 0.02;
        orbits = clamp(ring1, 0.0, 1.0) + clamp(ring2, 0.0, 1.0);
    }
    // meme: бинарный дождь и блёстки
    else if (u_variant == 2) {
        float band = 1.0 - abs(r - 0.50) / 0.20;
        bits = band * (0.4 + 0.6 * noise(vec2(angle * 4.0, r * 5.0 + u_seed)));
    }
    // defi: линии-трейсы
    else if (u_variant == 3) {
        float ring = 1.0 - abs(r - 0.65) / 0.12;
        circuits = ring;
    }
    // default: всего по чуть-чуть
    else {
        float ring1 = 1.0 - abs(r - 0.60) / 0.04;
        orbits = clamp(ring1, 0.0, 1.0);
        rays   = 0.3 * (1.0 - sstep(0.0, 0.25, r));
    }

    // --------------------------------------------------------
    //                    МЕЛКИЕ СВЕТЛЯЧКИ
    // --------------------------------------------------------
    float sparkle = star(centered * 3.2 + u_seed * 4.0, 4.0);
    sparkle *= (1.0 - sstep(0.72, 1.02, r));   // не вылезаем за край

    // --------------------------------------------------------
    //              СОБИРАЕМ ВСЁ ВМЕСТЕ
    // --------------------------------------------------------
    vec3 accent = u_color_accent;
    vec3 ringColor = u_color_ring;

    col += grid * accent * 0.25;
    col += rays * accent * 0.6;
    col += orbits * accent * 0.5;
    col += bits * accent * 0.6;
    col += circuits * accent * 0.4;
    col += sparkle * vec3(1.0);

    // обод монеты (более яркое кольцо по краю)
    float rim = sstep(0.86, 0.99, r);
    col = mix(col, ringColor * 1.4, rim);

    // лёгкая виньетка по краю, чтобы центр был читаемый
    float vignette = sstep(0.65, 1.0, r);
    col *= mix(1.15, 0.6, vignette);

    col = clamp(col, 0.0, 1.0);
    f_color = vec4(col, circle);
}
"""


# ============================================================
#               ИНИЦИАЛИЗАЦИЯ OpenGL / MODERNGL
# ============================================================

_ctx = moderngl.create_standalone_context()
_prog = _ctx.program(vertex_shader=VERT_SHADER, fragment_shader=FRAG_SHADER)

# full-screen quad
_quad_vertices = np.array(
    [
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
    ],
    dtype="f4",
)
_vbo = _ctx.buffer(_quad_vertices.tobytes())
_vao = _ctx.simple_vertex_array(_prog, _vbo, "in_pos")


# ============================================================
#                 ГЕНЕРАЦИЯ ОДНОЙ ИКОНКИ
# ============================================================

def variant_index(category: str) -> int:
    if category == "major":
        return 0
    if category == "stable":
        return 1
    if category == "meme":
        return 2
    if category == "defi":
        return 3
    return 4


def render_symbol_icon(sym: str, out_path: str):
    """
    Рисуем одну иконку для заданного тикера (шейдер + текст).
    Шейдер рисует монету, поверх PIL-ом дорисовываем текст.
    """
    palette = palette_for_symbol(sym)
    base, quote = split_symbol(sym)
    category = classify_symbol(sym, base)
    rng = SymbolRng(sym)  # пока не нужен, но пусть останется для будущих фишек

    # --------------------------------------------------------
    #                 ШЕЙДЕР: РЕНДЕР МОНЕТЫ
    # --------------------------------------------------------
    # RGBA-текстура IMG_SIZE x IMG_SIZE
    tex = _ctx.texture((IMG_SIZE, IMG_SIZE), 4)
    fbo = _ctx.framebuffer(color_attachments=[tex])
    fbo.use()
    _ctx.clear(0.0, 0.0, 0.0, 0.0)

    # Юниформы — только те, что реально объявлены в FRAG_SHADER
    base_col = tuple(c / 255.0 for c in palette.base)
    accent_col = tuple(c / 255.0 for c in palette.accent)
    ring_col = tuple(c / 255.0 for c in palette.ring)
    sec_col = tuple(c / 255.0 for c in palette.secondary)

    _prog["u_color_main"].value = base_col
    _prog["u_color_accent"].value = accent_col
    _prog["u_color_ring"].value = ring_col
    _prog["u_color_secondary"].value = sec_col
    _prog["u_seed"].value = float(hash(sym) & 0xFFFF) / 65535.0
    _prog["u_variant"].value = variant_index(category)

    # рисуем фуллскрин-квад
    _vao.render(moderngl.TRIANGLE_STRIP)

    # читаем текстуру в байты
    # В твоей версии moderngl Texture.read принимает максимум viewport / alignment
    data = tex.read(alignment=1)

    # собираем Pillow-картинку
    img = Image.frombytes("RGBA", (IMG_SIZE, IMG_SIZE), data)
    # OpenGL-координаты перевёрнуты по Y
    img = img.transpose(Image.FLIP_TOP_BOTTOM)

    # --------------------------------------------------------
    #                      ТЕКСТ
    # --------------------------------------------------------
    draw_ticker_text_two_lines(img, base, quote, palette, category)

    # лёгкая внешняя подсветка уже отрисована шейдером,
    # чуть усиливаем мягким блюром по альфе
    outer = img.filter(ImageFilter.GaussianBlur(radius=2 * SCALE))
    img = Image.alpha_composite(outer, img)

    # даунскейл до итогового размера
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
