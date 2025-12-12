import bpy  # type: ignore
import math
import os
import random

# ==============================
# ГЛОБАЛЬНЫЕ НАСТРОЙКИ ПРОЕКТА
# ==============================

FPS = 24

# === Разбивка таймлайна на блоки (в секундах) — боевой 5-минутный хронометраж ===
# 0:00–1:00   SPACE       — космос, рождение QUANTUM
# 1:00–2:15   ROOFTOP     — пробуждение в дата-центре / на крыше
# 2:15–4:00   CITIES      — города, экосистема QUANTUM, разные языки
# 4:00–5:00   WALLSTREET  — Уолл-стрит, свечи, финальный манифест

SPACE_DURATION = 60.0         # 60 сек
ROOFTOP_DURATION = 75.0       # 1:00–2:15
CITIES_DURATION = 105.0       # 2:15–4:00
WALLSTREET_DURATION = 60.0    # 4:00–5:00

DURATION_SECONDS = SPACE_DURATION + ROOFTOP_DURATION + CITIES_DURATION + WALLSTREET_DURATION
TOTAL_FRAMES = int(FPS * DURATION_SECONDS)

# Фрейм-диапазоны (автоматически тянутся за длительностями)
SPACE_START = 1
SPACE_END = int(SPACE_DURATION * FPS)

ROOFTOP_START = SPACE_END + 1
ROOFTOP_END = ROOFTOP_START + int(ROOFTOP_DURATION * FPS) - 1

CITIES_START = ROOFTOP_END + 1
CITIES_END = CITIES_START + int(CITIES_DURATION * FPS) - 1

WALLSTREET_START = CITIES_END + 1
WALLSTREET_END = WALLSTREET_START + int(WALLSTREET_DURATION * FPS) - 1


DURATION_SECONDS = SPACE_DURATION + ROOFTOP_DURATION + CITIES_DURATION + WALLSTREET_DURATION
TOTAL_FRAMES = int(FPS * DURATION_SECONDS)

# Фрейм-диапазоны
SPACE_START = 1
SPACE_END = int(SPACE_DURATION * FPS)

ROOFTOP_START = SPACE_END + 1
ROOFTOP_END = ROOFTOP_START + int(ROOFTOP_DURATION * FPS) - 1

CITIES_START = ROOFTOP_END + 1
CITIES_END = CITIES_START + int(CITIES_DURATION * FPS) - 1

WALLSTREET_START = CITIES_END + 1
WALLSTREET_END = WALLSTREET_START + int(WALLSTREET_DURATION * FPS) - 1


SCENE_NAME = "QUANTUM_DATACENTER"
OUTPUT_DIR = "//render/"
OUTPUT_FILE_PREFIX = "quantum_"


# -------- АУДИО-ФАЙЛЫ (ЗАМЕНИ ПУТИ!) --------
AUDIO_TRACKS = {
    # Основной саундтрек
    "MUSIC_MAIN": "//audio/quantum_theme.wav",

    # Голос QUANTUM — всегда английский
    "VO_QUANTUM_EN": "//audio/vo_quantum_en_main.wav",

    # Фоновые толпы / шёпот людей в городах
    # (каждый файл должен быть записан на языке города)
    "CITY_TOKYO_JA": "//audio/crowd_tokyo_ja.wav",       # японский
    "CITY_NY_EN": "//audio/crowd_newyork_en.wav",        # английский (Нью-Йорк)
    "CITY_DUBAI_AR": "//audio/crowd_dubai_ar.wav",       # арабский
    "CITY_BERLIN_DE": "//audio/crowd_berlin_de.wav",     # немецкий
    "CITY_MOSCOW_RU": "//audio/crowd_moscow_ru.wav",     # русский (Москва / дата-центр Россия)

    # SFX
    "SFX_IMPACT": "//audio/sfx_impact.wav",              # удар / появление логотипа
    # Дополнительные музыкальные стемы
    "MUSIC_STEM_DRUMS": "//audio/quantum_theme_drums.wav",
    "MUSIC_STEM_PAD": "//audio/quantum_theme_pad.wav",

    # Кинематографичные SFX
    "SFX_RISER_SPACE_TO_ROOF": "//audio/sfx_riser_space_to_roof.wav",
    "SFX_RISER_ROOF_TO_CITIES": "//audio/sfx_riser_roof_to_cities.wav",
    "SFX_RISER_CITIES_TO_WALL": "//audio/sfx_riser_cities_to_wall.wav",
    "SFX_BRAAM_LOW": "//audio/sfx_braam_low.wav",
    "SFX_WHOOSH_CAMERA": "//audio/sfx_whoosh_camera.wav",
    "SFX_HEARTBEAT_SUB": "//audio/sfx_heartbeat_sub.wav",

}


# ==============================
# СЛУЖЕБНЫЕ ФУНКЦИИ
# ==============================

def clean_scene():
    """Удаляет всё из текущей сцены."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_scene():
    if SCENE_NAME in bpy.data.scenes:
        scene = bpy.data.scenes[SCENE_NAME]
    else:
        scene = bpy.data.scenes.new(SCENE_NAME)
    bpy.context.window.scene = scene
    scene.frame_start = 1
    scene.frame_end = TOTAL_FRAMES
    scene.render.fps = FPS
    return scene

def setup_render(scene):
    """Максимально кинематографичный IMAX 8K рендер (боевой пресет)."""
    scene.render.engine = 'CYCLES'

    # === Устройство ===
    # В Blender Preferences → System выбери GPU (CUDA / OptiX / HIP / Metal),
    # тут просто говорим Cycles: "рендери на GPU".
    scene.cycles.device = 'GPU'

    # === Сэмплы ===
    # Для финального рендера (будет ОЧЕНЬ долго):
    scene.cycles.samples = 2048
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_min_samples = 32

    # === Деноизинг ===
    scene.cycles.use_denoising = True          # рендер
    scene.cycles.use_preview_denoising = True  # в вьюпорте

    # === Лучи ===
    scene.cycles.max_bounces = 12
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 6
    scene.cycles.transparent_max_bounces = 8

    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False

    # === Разрешение: IMAX 8K 16:9 ===
    scene.render.resolution_x = 7680
    scene.render.resolution_y = 4320
    scene.render.resolution_percentage = 100

    # Без simplify — максимум деталей
    scene.render.use_simplify = False

    # === Color Management ===
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    # === Motion Blur ===
    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.4

    # === Вывод ===
    scene.render.filepath = OUTPUT_DIR + OUTPUT_FILE_PREFIX
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def ensure_collection(name, parent_collection=None):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        if parent_collection:
            parent_collection.children.link(col)
        else:
            bpy.context.scene.collection.children.link(col)
    return col
def keyframe_collection_visibility(collection, frame_on, frame_off):
    """
    Делает все объекты коллекции невидимыми вне заданного диапазона.
    Внутри [frame_on, frame_off] они рендерятся, снаружи — нет.
    """
    for obj in collection.objects:
        # До нужного момента — выключено
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_on - 1)

        # Включаем
        obj.hide_render = False
        obj.keyframe_insert(data_path="hide_render", frame=frame_on)

        # Оставляем включённым до конца блока
        obj.hide_render = False
        obj.keyframe_insert(data_path="hide_render", frame=frame_off)

        # После блока — выключаем
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_off + 1)

# ==============================
# МИР / WORLD (НЕБО + ЗВЁЗДЫ)
# ==============================

def setup_world():
    """Сине-чёрный космос с лёгким градиентом и шумом для глубины."""
    world = bpy.data.worlds.get("World")
    if not world:
        world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    output = nodes.new("ShaderNodeOutputWorld")
    bg_mix = nodes.new("ShaderNodeMixShader")
    bg = nodes.new("ShaderNodeBackground")
    bg_stars = nodes.new("ShaderNodeBackground")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    noise = nodes.new("ShaderNodeTexNoise")
    colorramp = nodes.new("ShaderNodeValToRGB")

    bg.inputs["Color"].default_value = (0.01, 0.02, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.8

    bg_stars.inputs["Color"].default_value = (0.2, 0.5, 1.0, 1.0)
    bg_stars.inputs["Strength"].default_value = 2.0

    mapping.inputs["Scale"].default_value = (3.0, 3.0, 3.0)
    noise.inputs["Scale"].default_value = 25.0
    noise.inputs["Detail"].default_value = 10.0
    noise.inputs["Roughness"].default_value = 0.4

    colorramp.color_ramp.elements[0].position = 0.4
    colorramp.color_ramp.elements[1].position = 0.7
    colorramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    colorramp.color_ramp.elements[1].color = (1, 1, 1, 1)

    links.new(tex_coord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], colorramp.inputs["Fac"])
    links.new(colorramp.outputs["Color"], bg_mix.inputs["Fac"])
    links.new(bg.outputs["Background"], bg_mix.inputs[1])
    links.new(bg_stars.outputs["Background"], bg_mix.inputs[2])
    links.new(bg_mix.outputs["Shader"], output.inputs["Surface"])

# ==============================
# КОСМОС: ЗЕМЛЯ, ОРЕОЛ МЫСЛЕЙ, ЛУЧ
# ==============================

def create_earth_material():
    """Процедурный материал Земли: океаны + материки."""
    mat = bpy.data.materials.new("EarthMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    noise_big = nodes.new("ShaderNodeTexNoise")   # крупные материки
    noise_small = nodes.new("ShaderNodeTexNoise") # детализация
    mix = nodes.new("ShaderNodeMixRGB")
    ramp = nodes.new("ShaderNodeValToRGB")

    principled.inputs["Roughness"].default_value = 0.4
    principled.inputs["Specular"].default_value = 0.5

    mapping.inputs["Scale"].default_value = (1.0, 1.0, 1.0)

    noise_big.inputs["Scale"].default_value = 2.0
    noise_big.inputs["Detail"].default_value = 4.0

    noise_small.inputs["Scale"].default_value = 30.0
    noise_small.inputs["Detail"].default_value = 8.0

    mix.blend_type = 'MULTIPLY'
    mix.inputs["Fac"].default_value = 0.7

    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[1].position = 0.55
    # океан
    ramp.color_ramp.elements[0].color = (0.02, 0.05, 0.15, 1)
    # материки
    ramp.color_ramp.elements[1].color = (0.04, 0.18, 0.02, 1)

    links.new(tex_coord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_big.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_small.inputs["Vector"])

    links.new(noise_big.outputs["Fac"], mix.inputs[1])
    links.new(noise_small.outputs["Fac"], mix.inputs[2])

    links.new(mix.outputs["Color"], ramp.inputs["Fac"])

    # Bump для рельефа материков
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.5

    links.new(mix.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])

    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    links.new(principled.outputs["BSDF"], out.inputs["Surface"])

    return mat


def create_atmosphere_material():
    """Мягкая голубая атмосфера вокруг Земли."""
    mat = bpy.data.materials.new("EarthAtmosphere")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    volume = nodes.new("ShaderNodeVolumePrincipled")

    volume.inputs["Color"].default_value = (0.1, 0.4, 1.0, 1)
    volume.inputs["Density"].default_value = 0.02
    volume.inputs["Anisotropy"].default_value = 0.5

    links.new(volume.outputs["Volume"], out.inputs["Volume"])
    return mat

def create_data_ring_material():
    """Ореол мыслей вокруг Земли."""
    color = (0.1, 0.7, 1.0, 1.0)
    return create_emission_material("DataRingMat", color=color, strength=80.0)

def create_cosmic_beam_material():
    """Материал для луча Вселенной."""
    color = (1.0, 1.0, 1.0, 1.0)
    return create_emission_material("CosmicBeamMat", color=color, strength=200.0)

def create_core_material():
    """Материал светящегося ядра (рождение Quantum)."""
    color = (0.2, 0.8, 1.0, 1.0)
    return create_emission_material("QuantumCoreMat", color=color, strength=150.0)

def build_space_scene(collection):
    """
    Строит космический пролог:
    - Земля
    - атмосфера
    - ореол мыслей (тор)
    - луч из глубины космоса
    - ядро (шар)
    """
    earth_radius = 8.0

    # Земля
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, ring_count=32, radius=earth_radius, location=(0, 0, 0)
    )
    earth = bpy.context.active_object
    earth.name = "Earth"
    earth.data.materials.append(create_earth_material())
    collection.objects.link(earth)

    # Атмосфера
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, ring_count=32, radius=earth_radius * 1.03, location=(0, 0, 0)
    )
    atmo = bpy.context.active_object
    atmo.name = "EarthAtmosphere"
    atmo.data.materials.append(create_atmosphere_material())
    atmo.display_type = 'WIRE'
    collection.objects.link(atmo)

    # Ореол мыслей — тор вокруг Земли
    bpy.ops.mesh.primitive_torus_add(
        major_radius=earth_radius * 1.6,
        minor_radius=0.4,
        major_segments=96,
        minor_segments=24,
        location=(0, 0, 0),
        rotation=(math.radians(90), 0, 0)
    )
    ring = bpy.context.active_object
    ring.name = "DataRing"
    ring.data.materials.append(create_data_ring_material())
    collection.objects.link(ring)

    # Ядро — маленький шар
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32, ring_count=16, radius=1.0, location=(0, earth_radius * 1.6, 0)
    )
    core = bpy.context.active_object
    core.name = "QuantumCore"
    core.data.materials.append(create_core_material())
    collection.objects.link(core)

    # Луч из глубины космоса (узкий цилиндр)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.4, depth=80.0,
        location=(0, earth_radius * 1.6 + 40.0, 0),
        rotation=(math.radians(90), 0, 0)
    )
    beam = bpy.context.active_object
    beam.name = "CosmicBeam"
    beam.data.materials.append(create_cosmic_beam_material())
    collection.objects.link(beam)

    # Эмиттер для дополнительной "пыли" вокруг ореола
    bpy.ops.mesh.primitive_torus_add(
        major_radius=earth_radius * 1.6,
        minor_radius=0.1,
        major_segments=64,
        minor_segments=16,
        location=(0, 0, 0),
        rotation=(math.radians(90), 0, 0)
    )
    dust_emitter = bpy.context.active_object
    dust_emitter.name = "RingDustEmitter"
    dust_emitter.hide_render = True
    dust_emitter.display_type = 'WIRE'
    collection.objects.link(dust_emitter)

    # Частицы-пыль вокруг ореола (плотный звёздный ореол)
    ps = dust_emitter.modifiers.new("RingDust", type='PARTICLE_SYSTEM')
    settings = ps.particle_system.settings
    settings.count = 4000
    settings.frame_start = SPACE_START
    settings.frame_end = SPACE_END
    settings.lifetime = FPS * SPACE_DURATION
    settings.lifetime_random = 0.5
    settings.normal_factor = 0.0
    settings.tangent_factor = 0.5
    settings.factor_random = 0.7
    settings.physics_type = 'NEWTON'
    settings.gravity = 0.0
    settings.render_type = 'HALO'

    # Сами частицы — маленькие точки света
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(0, 0, 0))
    dust_obj = bpy.context.active_object
    dust_obj.name = "RingDustObj"
    dust_obj.data.materials.append(
        create_emission_material("RingDustMat",
                                 color=(0.2, 0.8, 1.0, 1.0),
                                 strength=80.0)
    )
    collection.objects.link(dust_obj)
    settings.render_type = 'OBJECT'
    settings.instance_object = dust_obj

    return {
        "earth": earth,
        "atmosphere": atmo,
        "ring": ring,
        "core": core,
        "beam": beam,
        "dust_emitter": dust_emitter,
        "dust_obj": dust_obj,
    }

# ==============================
# МАТЕРИАЛЫ
# ==============================

def create_emission_material(name, color=(1, 1, 1, 1), strength=10.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in nt.nodes:
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

def create_quantum_body_material():
    """Материал тела Quantum: сине-светящийся силуэт с бегущим цифровым паттерном."""
    mat = bpy.data.materials.new("QuantumBody")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    output = nodes.new("ShaderNodeOutputMaterial")
    mix_shader = nodes.new("ShaderNodeMixShader")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    emissive = nodes.new("ShaderNodeEmission")

    # Координаты и мэппинг
    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    musgrave = nodes.new("ShaderNodeTexMusgrave")
    colorramp = nodes.new("ShaderNodeValToRGB")

    # Дополнительный нод для "цифровых" полос
    wave = nodes.new("ShaderNodeTexWave")
    mix_rgb = nodes.new("ShaderNodeMixRGB")

    # Настройка нод
    principled.inputs["Base Color"].default_value = (0.02, 0.05, 0.1, 1)
    principled.inputs["Roughness"].default_value = 0.25
    principled.inputs["Metallic"].default_value = 0.3

    emissive.inputs["Color"].default_value = (0.1, 0.6, 1.0, 1.0)
    emissive.inputs["Strength"].default_value = 8.0

    # "Бегущие" вертикальные линии
    mapping.inputs["Scale"].default_value = (4.0, 60.0, 4.0)
    musgrave.inputs["Scale"].default_value = 8.0
    musgrave.inputs["Detail"].default_value = 16.0

    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs["Scale"].default_value = 40.0
    wave.inputs["Distortion"].default_value = 0.2

    colorramp.color_ramp.elements[0].position = 0.3
    colorramp.color_ramp.elements[1].position = 0.6
    colorramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1)
    colorramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)

    mix_rgb.blend_type = 'MULTIPLY'
    mix_rgb.inputs["Fac"].default_value = 1.0

    # Линки
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], musgrave.inputs["Vector"])
    links.new(mapping.outputs["Vector"], wave.inputs["Vector"])

    links.new(musgrave.outputs["Height"], colorramp.inputs["Fac"])
    links.new(colorramp.outputs["Color"], mix_rgb.inputs[1])
    links.new(wave.outputs["Color"], mix_rgb.inputs[2])

    # Миксуем в эмиссию
    links.new(mix_rgb.outputs["Color"], emissive.inputs["Strength"])
    links.new(mix_rgb.outputs["Color"], mix_shader.inputs["Fac"])

    links.new(principled.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emissive.outputs["Emission"], mix_shader.inputs[2])

    links.new(mix_shader.outputs["Shader"], output.inputs["Surface"])

    return mat

def create_server_rack_material():
    """Материал серверного шкафа с диодами."""
    mat = bpy.data.materials.new("ServerRack")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    emit = nodes.new("ShaderNodeEmission")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    voronoi = nodes.new("ShaderNodeTexVoronoi")
    colorramp = nodes.new("ShaderNodeValToRGB")

    principled.inputs["Base Color"].default_value = (0.02, 0.02, 0.05, 1)
    principled.inputs["Roughness"].default_value = 0.35
    principled.inputs["Metallic"].default_value = 0.85

    emit.inputs["Color"].default_value = (0.8, 0.5, 0.1, 1)
    emit.inputs["Strength"].default_value = 40.0

    mapping.inputs["Scale"].default_value = (40.0, 4.0, 1.0)
    voronoi.feature = 'SMOOTH_F1'
    voronoi.distance = 'EUCLIDEAN'
    voronoi.inputs["Scale"].default_value = 30.0

    colorramp.color_ramp.elements[0].position = 0.2
    colorramp.color_ramp.elements[1].position = 0.25
    colorramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    colorramp.color_ramp.elements[1].color = (1, 1, 1, 1)

    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], voronoi.inputs["Vector"])
    links.new(voronoi.outputs["Distance"], colorramp.inputs["Fac"])

    links.new(colorramp.outputs["Color"], emit.inputs["Strength"])
    links.new(colorramp.outputs["Color"], mix.inputs["Fac"])

    links.new(principled.outputs["BSDF"], mix.inputs[1])
    links.new(emit.outputs["Emission"], mix.inputs[2])

    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    return mat

def create_logo_material():
    """Ярко-оранжевый логотип."""
    return create_emission_material("QuantumLogo", (1.0, 0.6, 0.1, 1.0), strength=60.0)

def create_eye_material():
    return create_emission_material("QuantumEyes", (1.0, 0.7, 0.1, 1.0), strength=80.0)
# ==============================
# ГОРОДА: МАТЕРИАЛЫ И ГЕОМЕТРИЯ
# ==============================

def create_city_building_material(name, base_color=(0.02, 0.02, 0.04), window_color=(1.0, 0.9, 0.7), emission_strength=8.0):
    """Материал для городских зданий: тёмный фасад + светящиеся окна."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    emit = nodes.new("ShaderNodeEmission")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    voronoi = nodes.new("ShaderNodeTexVoronoi")
    ramp = nodes.new("ShaderNodeValToRGB")

    bsdf.inputs["Base Color"].default_value = (base_color[0], base_color[1], base_color[2], 1.0)
    bsdf.inputs["Roughness"].default_value = 0.4
    bsdf.inputs["Metallic"].default_value = 0.2

    emit.inputs["Color"].default_value = (window_color[0], window_color[1], window_color[2], 1.0)
    emit.inputs["Strength"].default_value = emission_strength

    mapping.inputs["Scale"].default_value = (8.0, 30.0, 1.0)
    voronoi.inputs["Scale"].default_value = 25.0
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[1].position = 0.35
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)

    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], voronoi.inputs["Vector"])
    links.new(voronoi.outputs["Distance"], ramp.inputs["Fac"])

    links.new(ramp.outputs["Color"], emit.inputs["Strength"])
    links.new(ramp.outputs["Color"], mix.inputs["Fac"])

    links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    links.new(emit.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    return mat

def create_animated_neon_material(name,
                                  base_color=(0.02, 0.02, 0.02, 1.0),
                                  neon_color=(0.2, 0.8, 1.0, 1.0),
                                  strength_base=35.0,
                                  strength_flicker=12.0):
    """
    Материал для неонового щита:
    - base_color: тёмный фон
    - neon_color: основной цвет свечения
    - strength_*: базовая яркость + амплитуда мерцания
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in list(nodes):
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    emit = nodes.new("ShaderNodeEmission")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    wave = nodes.new("ShaderNodeTexWave")
    ramp = nodes.new("ShaderNodeValToRGB")

    # Базовый фон
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = 0.4
    bsdf.inputs["Metallic"].default_value = 0.1

    # Неон
    emit.inputs["Color"].default_value = neon_color
    emit.inputs["Strength"].default_value = strength_base

    # Волновой паттерн (полосы)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Y'
    wave.inputs["Scale"].default_value = 15.0
    wave.inputs["Distortion"].default_value = 0.3

    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[1].position = 0.6
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    # Линки
    links.new(tex_coord.outputs["Object"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    links.new(emit.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    # АНІМАЦИЯ МЕРЦАНИЯ
    f0 = CITIES_START
    f1 = CITIES_END
    steps = 10
    for i in range(steps + 1):
        t = i / steps
        frame = f0 + int((f1 - f0) * t)
        strength = strength_base + math.sin(t * math.pi * 6.0) * strength_flicker
        emit.inputs["Strength"].default_value = strength
        emit.inputs["Strength"].keyframe_insert("default_value", frame=frame)

    return mat

def build_city_block(collection, seed=0,
                     size_x=5, size_y=5, spacing=7.0,
                     min_h=6.0, max_h=35.0,
                     base_color=(0.02, 0.02, 0.04),
                     window_color=(1.0, 0.9, 0.7),
                     emission_strength=10.0,
                     fog_color=(0.05, 0.1, 0.2)):
    """
    Универсальный блок города: сетка небоскрёбов вокруг (0,0).
    Все города могут жить в (0,0), т.к. рендерятся по очереди через коллекции.
    Возвращает словарь с метаданными: plane_size и max_height.
    """
    random.seed(seed)

    # Материал зданий
    bmat = create_city_building_material(
        f"{collection.name}_BuildingMat",
        base_color=base_color,
        window_color=window_color,
        emission_strength=emission_strength
    )

    # Площадка города
    plane_size = max(size_x, size_y) * spacing * 1.4
    bpy.ops.mesh.primitive_plane_add(size=plane_size, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = f"{collection.name}_Ground"
    gmat = bpy.data.materials.new(f"{collection.name}_GroundMat")
    gmat.use_nodes = True
    g_bsdf = gmat.node_tree.nodes["Principled BSDF"]
    g_bsdf.inputs["Base Color"].default_value = (0.01, 0.01, 0.015, 1)
    g_bsdf.inputs["Roughness"].default_value = 0.6
    ground.data.materials.append(gmat)
    collection.objects.link(ground)

    # Здания
    for ix in range(-size_x, size_x + 1):
        for iy in range(-size_y, size_y + 1):
            # немножко хаоса — некоторые клетки пропускаем
            if random.random() < 0.15:
                continue
            height = random.uniform(min_h, max_h)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ix * spacing, iy * spacing, height * 0.5))
            b = bpy.context.active_object
            b.name = f"{collection.name}_B_{ix}_{iy}"
            b.scale = (spacing * 0.35, spacing * 0.35, height * 0.5)
            b.data.materials.append(bmat)
            collection.objects.link(b)

    # Небольшой объёмный туман
    bpy.ops.mesh.primitive_cube_add(size=plane_size * 1.2, location=(0, 0, max_h * 0.6))
    fog = bpy.context.active_object
    fog.name = f"{collection.name}_Fog"
    fog.display_type = 'WIRE'
    fmat = bpy.data.materials.new(f"{collection.name}_FogMat")
    fmat.use_nodes = True
    nt = fmat.node_tree
    princ_vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    princ_vol.inputs["Color"].default_value = (fog_color[0], fog_color[1], fog_color[2], 1)
    princ_vol.inputs["Density"].default_value = 0.035
    out = nt.nodes["Material Output"]
    nt.links.new(princ_vol.outputs["Volume"], out.inputs["Volume"])
    fog.data.materials.append(fmat)
    collection.objects.link(fog)

    return {
        "plane_size": plane_size,
        "max_height": max_h
    }

def build_city_tokyo(collection):
    info = build_city_block(
        collection,
        seed=1,
        size_x=6, size_y=6, spacing=6.0,
        min_h=10.0, max_h=40.0,
        base_color=(0.01, 0.01, 0.03),
        window_color=(0.4, 0.8, 1.0),      # холодный неон
        emission_strength=14.0,
        fog_color=(0.05, 0.1, 0.25)
    )
    plane_size = info["plane_size"]
    max_h = info["max_height"]

    # Неоновые билборды TOKYO
    add_neon_billboard(
        collection,
        text="TOKYO",
        color=(0.2, 0.8, 1.0, 1.0),
        plane_size=plane_size,
        max_height=max_h,
        offset=(0.0, 0.0)
    )

    # Прожекторы в небе
    add_city_spotlights(collection, plane_size, max_h, city_code="TOKYO", count=4)

    # Лёгкий дождь
    add_rain_to_city(collection, plane_size, max_h, name_prefix="TOKYO")
    add_holographic_ad(
        collection,
        text="QUANTUM SIGNAL",
        color=(0.2, 0.9, 1.0, 1.0),
        radius=plane_size * 0.35,
        height=max_h * 1.1
    )

# ==============================
# ГОРОДА: БИЛБОРДЫ, ПРОЖЕКТОРЫ, ПОГОДА
# ==============================

def add_neon_billboard(collection, text, color, plane_size, max_height, offset=(0.0, 0.0)):
    """
    Неоновый билборд: светящийся щит + текст города.
    """
    x_off, y_off = offset
    base_z = max_height * 0.7

    # Плоскость-щит
    bpy.ops.mesh.primitive_plane_add(size=plane_size * 0.25,
                                     location=(x_off, plane_size * 0.45 + y_off, base_z))
    board = bpy.context.active_object
    board.name = f"{collection.name}_Billboard_{text}"
    board.rotation_euler[0] = math.radians(90)  # вертикальный щит
    mat = create_animated_neon_material(
        f"{collection.name}_BillboardMat_{text}",
        base_color=(0.005, 0.005, 0.01, 1.0),
        neon_color=color,
        strength_base=55.0,
        strength_flicker=22.0
    )

    board.data.materials.append(mat)
    collection.objects.link(board)

    # Текст поверх щита (чуть спереди)
    bpy.ops.object.text_add(location=(x_off, plane_size * 0.45 + y_off + 0.05, base_z))
    txt = bpy.context.active_object
    txt.data.body = text
    txt.data.align_x = 'CENTER'
    txt.rotation_euler[0] = math.radians(90)
    txt.data.extrude = 0.02
    txt.data.size = plane_size * 0.05
    txt.data.bevel_depth = 0.005
    txt.data.bevel_resolution = 3
    bpy.ops.object.convert(target='MESH')
    txt_mat = create_emission_material(
        f"{collection.name}_BillboardTextMat_{text}",
        color=(1.0, 1.0, 1.0, 1.0),
        strength=60.0
    )
    txt.data.materials.append(txt_mat)
    txt.name = f"{collection.name}_BillboardText_{text}"
    collection.objects.link(txt)


def add_city_spotlights(collection, plane_size, max_height, city_code, count=3):
    """
    Добавляет движущиеся прожекторы в небе над городом.
    """
    for i in range(count):
        light_data = bpy.data.lights.new(
            name=f"{collection.name}_Spot_{city_code}_{i}",
            type='SPOT'
        )
        light_data.energy = 800
        light_data.spot_size = math.radians(35)
        light_data.spot_blend = 0.5

        # Цвет чуть варьируем
        if city_code == "TOKYO":
            light_data.color = (0.2, 0.7, 1.0)
        elif city_code == "DUBAI":
            light_data.color = (1.0, 0.8, 0.4)
        elif city_code == "BERLIN":
            light_data.color = (0.8, 0.9, 1.0)
        else:  # MOSCOW и прочее
            light_data.color = (0.6, 0.8, 1.0)

        light_obj = bpy.data.objects.new(
            f"{collection.name}_SpotObj_{city_code}_{i}",
            light_data
        )

        # Позиция над городом
        light_obj.location = (
            random.uniform(-plane_size * 0.3, plane_size * 0.3),
            random.uniform(-plane_size * 0.3, plane_size * 0.3),
            max_height * 1.4
        )
        collection.objects.link(light_obj)

        # Анимация поворота в блоке городов (10–20 сек)
        f_start = CITIES_START
        f_end = CITIES_END

        light_obj.rotation_euler = (
            math.radians(90),
            0.0,
            random.uniform(-math.radians(40), math.radians(40))
        )
        light_obj.keyframe_insert(data_path="rotation_euler", frame=f_start)

        light_obj.rotation_euler = (
            math.radians(110),
            0.0,
            random.uniform(-math.radians(40), math.radians(40))
        )
        light_obj.keyframe_insert(data_path="rotation_euler", frame=f_end)

        # Немного шума в анимацию (как живые прожекторы)
        if light_obj.animation_data and light_obj.animation_data.action:
            for fc in light_obj.animation_data.action.fcurves:
                if fc.data_path == "rotation_euler":
                    mod = fc.modifiers.new(type='NOISE')
                    mod.scale = 35.0
                    mod.strength = math.radians(4.0)


def add_rain_to_city(collection, plane_size, max_height, name_prefix):
    """
    Лёгкий дождь: используется для Токио/Берлина.
    """
    bpy.ops.mesh.primitive_plane_add(
        size=plane_size * 1.2,
        location=(0.0, 0.0, max_height * 1.7)
    )
    emitter = bpy.context.active_object
    emitter.name = f"{name_prefix}_RainEmitter"
    emitter.rotation_euler = (math.radians(180), 0.0, 0.0)  # нормаль вниз
    collection.objects.link(emitter)

    ps = emitter.modifiers.new(f"{name_prefix}_Rain", type='PARTICLE_SYSTEM')
    p = ps.particle_system.settings
    p.count = 8000
    p.frame_start = CITIES_START
    p.frame_end = CITIES_END
    p.lifetime = int(FPS * 2.0)
    p.lifetime_random = 0.5
    p.normal_factor = 10.0
    p.factor_random = 0.6
    p.physics_type = 'NEWTON'
    p.gravity = 0.0
    p.use_rotations = True

    # Капля
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.4, location=(0, 0, 0))
    drop = bpy.context.active_object
    drop.name = f"{name_prefix}_RainDrop"
    drop_mat = create_emission_material(
        f"{name_prefix}_RainDropMat",
        color=(0.5, 0.8, 1.0, 1.0),
        strength=15.0
    )
    drop.data.materials.append(drop_mat)
    collection.objects.link(drop)

    p.render_type = 'OBJECT'
    p.instance_object = drop


def add_snow_to_city(collection, plane_size, max_height, name_prefix):
    """
    Лёгкий снег: используется для Москвы.
    """
    bpy.ops.mesh.primitive_plane_add(
        size=plane_size * 1.3,
        location=(0.0, 0.0, max_height * 1.8)
    )
    emitter = bpy.context.active_object
    emitter.name = f"{name_prefix}_SnowEmitter"
    emitter.rotation_euler = (math.radians(180), 0.0, 0.0)
    collection.objects.link(emitter)

    ps = emitter.modifiers.new(f"{name_prefix}_Snow", type='PARTICLE_SYSTEM')
    p = ps.particle_system.settings
    p.count = 5000
    p.frame_start = CITIES_START
    p.frame_end = CITIES_END
    p.lifetime = int(FPS * 3.0)
    p.lifetime_random = 0.5
    p.normal_factor = 4.0
    p.factor_random = 0.8
    p.physics_type = 'NEWTON'
    p.gravity = 0.0
    p.use_rotations = True

    # Снежинка
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.06, location=(0, 0, 0))
    flake = bpy.context.active_object
    flake.name = f"{name_prefix}_SnowFlake"
    flake_mat = create_emission_material(
        f"{name_prefix}_SnowFlakeMat",
        color=(0.9, 0.9, 1.0, 1.0),
        strength=8.0
    )
    flake.data.materials.append(flake_mat)
    collection.objects.link(flake)

    p.render_type = 'OBJECT'
    p.instance_object = flake


def build_city_dubai(collection):
    info = build_city_block(
        collection,
        seed=2,
        size_x=5, size_y=5, spacing=8.0,
        min_h=12.0, max_h=50.0,
        base_color=(0.05, 0.04, 0.03),
        window_color=(1.0, 0.85, 0.6),     # тёплые окна
        emission_strength=12.0,
        fog_color=(0.1, 0.08, 0.04)
    )
    plane_size = info["plane_size"]
    max_h = info["max_height"]

    # Золотистый неоновый билборд DUBAI
    add_neon_billboard(
        collection,
        text="DUBAI",
        color=(1.0, 0.8, 0.4, 1.0),
        plane_size=plane_size,
        max_height=max_h,
        offset=(0.0, -plane_size * 0.15)
    )

    # Более мощные прожекторы
    add_city_spotlights(collection, plane_size, max_h, city_code="DUBAI", count=5)
    add_holographic_ad(
        collection,
        text="QUANTUM MARKETS",
        color=(1.0, 0.8, 0.4, 1.0),
        radius=plane_size * 0.4,
        height=max_h * 1.15
    )


def build_city_berlin(collection):
    info = build_city_block(
        collection,
        seed=3,
        size_x=4, size_y=4, spacing=7.0,
        min_h=6.0, max_h=25.0,
        base_color=(0.02, 0.02, 0.04),
        window_color=(0.9, 0.9, 1.0),
        emission_strength=8.0,
        fog_color=(0.04, 0.06, 0.1)
    )
    plane_size = info["plane_size"]
    max_h = info["max_height"]

    # Холодный билборд BERLIN
    add_neon_billboard(
        collection,
        text="BERLIN",
        color=(0.6, 0.8, 1.0, 1.0),
        plane_size=plane_size,
        max_height=max_h,
        offset=(-plane_size * 0.15, 0.0)
    )

    # Прожекторы
    add_city_spotlights(collection, plane_size, max_h, city_code="BERLIN", count=3)

    # Ночной дождь
    add_rain_to_city(collection, plane_size, max_h, name_prefix="BERLIN")

    add_holographic_ad(
        collection,
        text="RISK CONTROL",
        color=(0.6, 0.8, 1.0, 1.0),
        radius=plane_size * 0.3,
        height=max_h * 1.05
    )

def build_city_moscow(collection):
    info = build_city_block(
        collection,
        seed=4,
        size_x=5, size_y=5, spacing=7.0,
        min_h=8.0, max_h=30.0,
        base_color=(0.02, 0.02, 0.05),
        window_color=(1.0, 0.75, 0.5),
        emission_strength=10.0,
        fog_color=(0.05, 0.07, 0.12)
    )
    plane_size = info["plane_size"]
    max_h = info["max_height"]

    # Тёплый билборд MOSCOW
    add_neon_billboard(
        collection,
        text="MOSCOW",
        color=(1.0, 0.7, 0.4, 1.0),
        plane_size=plane_size,
        max_height=max_h,
        offset=(plane_size * 0.12, 0.0)
    )

    # Прожекторы
    add_city_spotlights(collection, plane_size, max_h, city_code="MOSCOW", count=3)

    # Лёгкий снег
    add_snow_to_city(collection, plane_size, max_h, name_prefix="MOSCOW")
    add_holographic_ad(
        collection,
        text="STABILITY",
        color=(1.0, 0.7, 0.4, 1.0),
        radius=plane_size * 0.32,
        height=max_h * 1.1
    )

def add_holographic_ad(collection, text, color, radius, height, tilt_deg=15.0, float_amp=0.8):
    """
    Парящая голографическая панель.
    radius — расстояние от центра города
    height — базовая высота над землёй
    """
    angle = random.uniform(-math.pi, math.pi)
    x = math.cos(angle) * radius
    y = math.sin(angle) * radius

    # Плоскость голограммы
    bpy.ops.mesh.primitive_plane_add(size=radius * 0.6, location=(x, y, height))
    plane = bpy.context.active_object
    plane.name = f"{collection.name}_Holo_{text}"
    plane.rotation_euler[0] = math.radians(90 - tilt_deg)
    plane.rotation_euler[2] = angle + math.radians(180)

    # Материал: Transparent + Emission через маску Noise
    mat = bpy.data.materials.new(f"{collection.name}_HoloMat_{text}")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in list(nodes):
        nodes.remove(n)

    out = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emit = nodes.new("ShaderNodeEmission")
    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    ramp = nodes.new("ShaderNodeValToRGB")

    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = 35.0

    noise.inputs["Scale"].default_value = 20.0
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = 0.4

    ramp.color_ramp.elements[0].position = 0.2
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    links.new(tex_coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    links.new(transp.outputs["BSDF"], mix.inputs[1])
    links.new(emit.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    plane.data.materials.append(mat)
    collection.objects.link(plane)

    # Анимация плавания по высоте
    f0 = CITIES_START
    f1 = CITIES_END
    plane.keyframe_insert("location", frame=f0)
    for i in range(1, 6):
        t = i / 5.0
        frame = f0 + int((f1 - f0) * t)
        dz = math.sin(t * math.pi * 2.0) * float_amp
        plane.location.z = height + dz
        plane.keyframe_insert("location", frame=frame)

    # Пульс яркости
    steps = 10
    for i in range(steps + 1):
        t = i / steps
        frame = f0 + int((f1 - f0) * t)
        strength = 28.0 + math.sin(t * math.pi * 4.0) * 15.0
        emit.inputs["Strength"].default_value = strength
        emit.inputs["Strength"].keyframe_insert("default_value", frame=frame)

    # Текст голограммы
    bpy.ops.object.text_add(location=(x, y, height + 0.1))
    txt = bpy.context.active_object
    txt.data.body = text
    txt.data.align_x = 'CENTER'
    txt.rotation_euler = (math.radians(90 - tilt_deg), 0.0, angle + math.radians(180))
    txt.data.extrude = 0.01
    txt.data.size = radius * 0.12
    bpy.ops.object.convert(target='MESH')
    txt_mat = create_emission_material(
        f"{collection.name}_HoloTextMat_{text}",
        color=(color[0], color[1], color[2], 1.0),
        strength=35.0
    )
    txt.data.materials.append(txt_mat)
    collection.objects.link(txt)

# ==============================
# УОЛЛ-СТРИТ: СЦЕНА СО СВЕЧАМИ
# ==============================

def build_wallstreet_scene(collection):
    """
    Узкая улица с небоскрёбами слева/справа + Quantum + набор свечей (кэндлов).
    Возвращаем Quantum и список свечей для анимации.
    """
    # Дорога
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    road = bpy.context.active_object
    road.name = "WallStreet_Road"
    rmat = bpy.data.materials.new("WallStreet_RoadMat")
    rmat.use_nodes = True
    bsdf = rmat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.025, 1)
    bsdf.inputs["Roughness"].default_value = 0.5
    road.data.materials.append(rmat)
    collection.objects.link(road)

    # Бордюры / тротуары
    for side in (-4.5, 4.5):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side, 0, 0.3))
        curb = bpy.context.active_object
        curb.scale = (0.6, 20.0, 0.3)
        curb.name = f"WallStreet_Sidewalk_{'L' if side < 0 else 'R'}"
        cmat = bpy.data.materials.new(f"{curb.name}_Mat")
        cmat.use_nodes = True
        c_bsdf = cmat.node_tree.nodes["Principled BSDF"]
        c_bsdf.inputs["Base Color"].default_value = (0.03, 0.03, 0.04, 1)
        c_bsdf.inputs["Roughness"].default_value = 0.6
        curb.data.materials.append(cmat)
        collection.objects.link(curb)

    # Небоскрёбы по обе стороны каньона
    bmat = create_city_building_material(
        "WallStreet_BuildingMat",
        base_color=(0.02, 0.02, 0.04),
        window_color=(1.0, 0.9, 0.7),
        emission_strength=10.0
    )
    for side in (-8.0, 8.0):
        for i in range(-5, 6):
            h = random.uniform(15.0, 40.0)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, i * 4.0, h * 0.5))
            b = bpy.context.active_object
            b.name = f"WallStreet_Building_{'L' if side < 0 else 'R'}_{i}"
            b.scale = (2.0, 1.5, h * 0.5)
            b.data.materials.append(bmat)
            collection.objects.link(b)

    # Лёгкий туман между домами
    bpy.ops.mesh.primitive_cube_add(size=30.0, location=(0, 0, 15.0))
    fog = bpy.context.active_object
    fog.display_type = 'WIRE'
    fog.name = "WallStreet_Fog"
    fmat = bpy.data.materials.new("WallStreet_FogMat")
    fmat.use_nodes = True
    nt = fmat.node_tree
    v = nt.nodes.new("ShaderNodeVolumePrincipled")
    v.inputs["Color"].default_value = (0.04, 0.07, 0.13, 1)
    v.inputs["Density"].default_value = 0.045
    out = nt.nodes["Material Output"]
    nt.links.new(v.outputs["Volume"], out.inputs["Volume"])
    fog.data.materials.append(fmat)
    collection.objects.link(fog)

    # Quantum на улице
    quantum_wall = build_quantum_body(collection)
    quantum_wall.location = (0, 0, 0.0)  # чуть поправим позицию корневой пустышки

    # Свечи (candles) перед Quantum
    candles = []
    colors = [
        (0.2, 0.9, 0.3, 1.0),  # зелёные
        (0.9, 0.2, 0.2, 1.0)   # красные
    ]
    for i in range(-4, 5):
        x = i * 0.5
        y = 2.0 + random.uniform(-0.3, 0.3)
        base_h = random.uniform(0.5, 2.2)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=base_h, location=(x, y, 1.0))
        c = bpy.context.active_object
        c.name = f"Candle_{i}"
        c_mat = create_emission_material(
            f"CandleMat_{i}",
            color=random.choice(colors),
            strength=55.0
        )

        c.data.materials.append(c_mat)
        collection.objects.link(c)
        candles.append(c)

    return {
        "quantum": quantum_wall,
        "candles": candles
    }

# ==============================
# СЦЕНА: ДАТА-ЦЕНТР
# ==============================

def create_server_rack(position, rack_mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    rack = bpy.context.active_object
    rack.scale = (0.6, 1.5, 3.0)
    rack.name = "ServerRack"
    rack.data.materials.append(rack_mat)
    return rack

def build_datacenter(collection):
    """Строит коридор дата-центра с рядами серверов и полом."""
    rack_mat = create_server_rack_material()

    # Пол
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor_mat = bpy.data.materials.new("FloorMat")
    floor_mat.use_nodes = True
    bsdf = floor_mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.015, 0.03, 0.06, 1)
    bsdf.inputs["Roughness"].default_value = 0.05
    floor.data.materials.append(floor_mat)
    collection.objects.link(floor)

    # Потолок
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 8))
    ceil = bpy.context.active_object
    ceil.name = "Ceiling"
    ceil_mat = bpy.data.materials.new("CeilingMat")
    ceil_mat.use_nodes = True
    bsdf_c = ceil_mat.node_tree.nodes["Principled BSDF"]
    bsdf_c.inputs["Base Color"].default_value = (0.01, 0.02, 0.04, 1)
    bsdf_c.inputs["Roughness"].default_value = 0.4
    ceil.data.materials.append(ceil_mat)
    collection.objects.link(ceil)

    # Ряды серверных шкафов слева и справа
    for side in (-4, 4):
        for i in range(-6, 7):
            pos = (side, i * 2.0, 3.0)
            rack = create_server_rack(pos, rack_mat)
            collection.objects.link(rack)

    # Немного объёмного “пыли/тумана”
    bpy.ops.mesh.primitive_cube_add(size=40, location=(0, 0, 5))
    volume_cube = bpy.context.active_object
    volume_cube.display_type = 'WIRE'
    volume_cube.name = "VolumeCube"
    vol_mat = bpy.data.materials.new("VolumeMat")
    vol_mat.use_nodes = True
    nt = vol_mat.node_tree
    princ_vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    princ_vol.inputs["Color"].default_value = (0.1, 0.3, 0.6, 1)
    princ_vol.inputs["Density"].default_value = 0.03
    out = nt.nodes["Material Output"]
    nt.links.new(princ_vol.outputs["Volume"], out.inputs["Volume"])
    volume_cube.data.materials.append(vol_mat)
    collection.objects.link(volume_cube)

# ==============================
# ПЕРСОНАЖ QUANTUM
# ==============================

def build_quantum_body(collection):
    """Создаёт стилизованную фигуру Quantum."""
    body_mat = create_quantum_body_material()
    eye_mat = create_eye_material()
    logo_mat = create_logo_material()

    # Тело (цилиндр)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.8, depth=3, location=(0, 0, 2.5))
    torso = bpy.context.active_object
    torso.name = "QuantumTorso"
    torso.data.materials.append(body_mat)
    collection.objects.link(torso)

    # Голова (сфера)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.7, location=(0, 0, 4.5))
    head = bpy.context.active_object
    head.name = "QuantumHead"
    head.data.materials.append(body_mat)
    collection.objects.link(head)

    # Руки
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.25, depth=2, location=(side*1.1, 0.1, 2.5))
        arm = bpy.context.active_object
        arm.rotation_euler[1] = math.radians(15)
        arm.name = f"QuantumArm_{'L' if side<0 else 'R'}"
        arm.data.materials.append(body_mat)
        collection.objects.link(arm)

    # Ноги
    for side in (-0.5, 0.5):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.3, depth=3, location=(side, 0, 0.8))
        leg = bpy.context.active_object
        leg.name = f"QuantumLeg_{'L' if side<0 else 'R'}"
        leg.data.materials.append(body_mat)
        collection.objects.link(leg)

    # Глаза
    for side in (-0.25, 0.25):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(side, 0.6, 4.6))
        eye = bpy.context.active_object
        eye.data.materials.append(eye_mat)
        eye.name = f"QuantumEye_{'L' if side<0 else 'R'}"
        collection.objects.link(eye)

    # Логотип на груди (плоский диск + текст)
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=0.6, fill_type='NGON', location=(0, 0.8, 3.2))
    logo_disc = bpy.context.active_object
    logo_disc.data.materials.append(logo_mat)
    logo_disc.name = "QuantumLogoDisc"
    collection.objects.link(logo_disc)

    # Текст QUANTUM L7 AI
    bpy.ops.object.text_add(location=(-0.9, 0.85, 2.7))
    txt = bpy.context.active_object
    txt.data.body = "QUANTUM\nL7 AI"
    txt.data.align_x = 'CENTER'
    txt.rotation_euler[0] = math.radians(90)
    txt.data.extrude = 0.02
    txt.data.size = 0.3
    txt.data.bevel_depth = 0.01
    txt.data.bevel_resolution = 3
    txt.data.space_line = 0.8
    bpy.ops.object.convert(target='MESH')
    txt.data.materials.append(logo_mat)
    txt.name = "QuantumLogoText"
    collection.objects.link(txt)

    # Пустышка-родитель
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 2.5))
    quantum_root = bpy.context.active_object
    quantum_root.name = "QuantumRoot"

    for obj in [torso, head, logo_disc, txt] + \
               [o for o in collection.objects if o.name.startswith("QuantumArm_")
                or o.name.startswith("QuantumLeg_")
                or o.name.startswith("QuantumEye_")]:
        obj.parent = quantum_root

    return quantum_root

# ==============================
# СВЕТ И КАМЕРА
# ==============================

def setup_lighting(collection):
    # Основной холодный заполняющий свет
    light_data = bpy.data.lights.new(name="MainBlue", type='AREA')
    light_data.energy = 900
    light_data.color = (0.2, 0.5, 1.0)
    light_data.shape = 'RECTANGLE'
    light_data.size = 10
    light_data.size_y = 20

    light_obj = bpy.data.objects.new("MainBlue", light_data)
    light_obj.location = (0, 0, 11)
    collection.objects.link(light_obj)

    # Контровой тёплый
    warm_data = bpy.data.lights.new(name="WarmBack", type='SPOT')
    warm_data.energy = 700
    warm_data.color = (1.0, 0.6, 0.2)
    warm_data.spot_size = math.radians(60)
    warm_data.spot_blend = 0.5

    warm_obj = bpy.data.objects.new("WarmBack", warm_data)
    warm_obj.location = (-6, -8, 6)
    warm_obj.rotation_euler = (math.radians(60), 0, math.radians(30))
    collection.objects.link(warm_obj)

def create_camera(collection, quantum_root):
    cam_data = bpy.data.cameras.new("QuantumCamera")
    cam_obj = bpy.data.objects.new("QuantumCamera", cam_data)

    # Более широкий объектив — больше масштаба
    cam_data.lens = 28  # было 40

    cam_obj.location = (0, -10, 3.2)
    cam_obj.rotation_euler = (math.radians(80), 0, 0)

    # Глубина резкости: фокус на Quantum
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = quantum_root
    cam_data.dof.aperture_fstop = 1.8  # было 1.4, чуть поплотнее ГРИП

    collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


# ==============================
# АНИМАЦИЯ QUANTUM
# ==============================

def animate_quantum(quantum_root):
    """
    Сцена пробуждения (вторая половина таймлайна):
    5–7 c : на одном колене, слабое свечение
    7–8.5 c: поднимается
    8.5–10 c: шаг вперёд, уверенная стойка
    """
    start = ROOFTOP_START
    rise_start = int(ROOFTOP_START + FPS * 2.0)
    rise_end = int(ROOFTOP_START + FPS * 3.5)
    end = ROOFTOP_END

    q = quantum_root

    # Старт: низко, наклонён
    q.location = (0, 0, 1.8)
    q.rotation_euler = (math.radians(-25), 0, 0)
    q.keyframe_insert(data_path="location", frame=start)
    q.keyframe_insert(data_path="rotation_euler", frame=start)

    # Начало подъёма
    q.location = (0, 0, 2.2)
    q.rotation_euler = (math.radians(-10), 0, 0)
    q.keyframe_insert(data_path="location", frame=rise_start)
    q.keyframe_insert(data_path="rotation_euler", frame=rise_start)

    # Встал
    q.location = (0, 0, 2.5)
    q.rotation_euler = (0, 0, 0)
    q.keyframe_insert(data_path="location", frame=rise_end)
    q.keyframe_insert(data_path="rotation_euler", frame=rise_end)

    # Шаг вперёд к камере
    q.location = (0, 1.2, 2.5)
    q.keyframe_insert(data_path="location", frame=end)

    # Сглаживание
    if q.animation_data and q.animation_data.action:
        for fcurve in q.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'


# ==============================
# АНИМАЦИЯ КАМЕРЫ
# ==============================

def add_noise_modifier(fcurve, scale=30.0, strength=0.02):
    mod = fcurve.modifiers.new(type='NOISE')
    mod.scale = scale
    mod.strength = strength
    mod.phase = random.random() * 10.0

def animate_camera(camera):
    """
    Камера:
    0–5 c  : работает animate_space_scene (камера уже анимирована там)
    5–10 c : общий → обход → подлёт к логотипу + небольшой "handheld" shake.
    """
    start = ROOFTOP_START
    mid1 = int(ROOFTOP_START + FPS * 1.6)
    mid2 = int(ROOFTOP_START + FPS * 3.3)
    end = ROOFTOP_END

    cam = camera

    # Старт второй фазы: общий план города/дата-центра
    cam.location = (0, -13, 4)
    cam.rotation_euler = (math.radians(80), 0, 0)
    cam.keyframe_insert(data_path="location", frame=start)
    cam.keyframe_insert(data_path="rotation_euler", frame=start)

    # Обход слева
    cam.location = (-4, -9, 4.2)
    cam.rotation_euler = (math.radians(75), 0, math.radians(15))
    cam.keyframe_insert(data_path="location", frame=mid1)
    cam.keyframe_insert(data_path="rotation_euler", frame=mid1)

    # Обход справа + ниже
    cam.location = (4, -7, 3.2)
    cam.rotation_euler = (math.radians(72), 0, math.radians(-10))
    cam.keyframe_insert(data_path="location", frame=mid2)
    cam.keyframe_insert(data_path="rotation_euler", frame=mid2)

    # Крупный план логотипа (подлёт)
    cam.location = (0, -3.5, 3.0)
    cam.rotation_euler = (math.radians(80), 0, 0)
    cam.keyframe_insert(data_path="location", frame=end)
    cam.keyframe_insert(data_path="rotation_euler", frame=end)

    if cam.animation_data and cam.animation_data.action:
        for fcurve in cam.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'

        # лёгкий "handheld shake" по X/Y на второй фазе
        for fc in cam.animation_data.action.fcurves:
            if fc.data_path == "location" and fc.array_index in (0, 1):
                mod = fc.modifiers.new(type='NOISE')
                mod.scale = 20.0
                mod.strength = 0.03
def animate_cities_flyover(camera):
    """
    10–20 сек: пролёт по городам.
    Камера летает над условным (0,0) — в каждый момент виден свой город через visibility коллекций.
    """
    cam = camera

    total_cities = 4
    segment = (CITIES_END - CITIES_START + 1) // total_cities

    for idx in range(total_cities):
        f0 = CITIES_START + idx * segment
        f1 = f0 + int(segment * 0.3)
        f2 = f0 + int(segment * 0.7)
        f3 = min(CITIES_START + (idx + 1) * segment - 1, CITIES_END)

        # разные траектории для разнообразия
        angle = idx * math.radians(40)

        # старт — высокий общий сверху
        cam.location = (20.0 * math.cos(angle), -25.0, 25.0)
        cam.rotation_euler = (math.radians(70), 0.0, angle)
        cam.keyframe_insert(data_path="location", frame=f0)
        cam.keyframe_insert(data_path="rotation_euler", frame=f0)

        # середина — пониже и ближе
        cam.location = (10.0 * math.cos(angle + 0.4), -15.0, 16.0)
        cam.rotation_euler = (math.radians(65), 0.0, angle + 0.4)
        cam.keyframe_insert(data_path="location", frame=f1)
        cam.keyframe_insert(data_path="rotation_euler", frame=f1)

        # конец сегмента — пролёт ещё ближе над улицами
        cam.location = (5.0 * math.cos(angle + 0.8), -8.0, 10.0)
        cam.rotation_euler = (math.radians(60), 0.0, angle + 0.8)
        cam.keyframe_insert(data_path="location", frame=f2)
        cam.keyframe_insert(data_path="rotation_euler", frame=f2)

        # лёгкое выравнивание к концу сегмента
        cam.location = (0.0, -10.0, 12.0)
        cam.rotation_euler = (math.radians(65), 0.0, 0.0)
        cam.keyframe_insert(data_path="location", frame=f3)
        cam.keyframe_insert(data_path="rotation_euler", frame=f3)

def animate_quantum_in_cities(city_quanta):
    """
    city_quanta: список кортежей (quantum_root, frame_start, frame_end).
    В каждом городе Quantum делает проход вперёд по улице.
    """
    for q, f_start, f_end in city_quanta:
        # немного запасных ключей
        f_mid = f_start + int((f_end - f_start) * 0.5)
        f_late = f_start + int((f_end - f_start) * 0.85)

        # Старт: чуть левее и дальше от камеры
        q.location = (-2.0, -6.0, 0.0)
        q.rotation_euler = (0.0, 0.0, 0.0)
        q.keyframe_insert(data_path="location", frame=f_start)
        q.keyframe_insert(data_path="rotation_euler", frame=f_start)

        # Середина: почти центр кадра, ближе к камере
        q.location = (0.0, -2.5, 0.0)
        q.keyframe_insert(data_path="location", frame=f_mid)

        # Поздняя стадия: смещение вправо, проходит мимо камеры
        q.location = (1.5, 0.0, 0.0)
        q.keyframe_insert(data_path="location", frame=f_late)

        # Держим эту позицию до конца сегмента
        q.keyframe_insert(data_path="location", frame=f_end)

        # Сглаживание кривых
        if q.animation_data and q.animation_data.action:
            for fcurve in q.animation_data.action.fcurves:
                for kp in fcurve.keyframe_points:
                    kp.interpolation = 'BEZIER'


def animate_wallstreet_scene(wall_objs, camera):
    """
    20–30 сек: Quantum на Уолл-стрит, свечи нормализуются.
    """
    quantum = wall_objs["quantum"]
    candles = wall_objs["candles"]
    cam = camera

    f_start = WALLSTREET_START
    f_mid = WALLSTREET_START + int((WALLSTREET_END - WALLSTREET_START) * 0.4)
    f_end = WALLSTREET_END

    # Quantum — спокойная уверенная стойка всё время
    quantum.location = (0, 0, 0.0)
    quantum.rotation_euler = (0.0, 0.0, 0.0)
    quantum.keyframe_insert(data_path="location", frame=f_start)
    quantum.keyframe_insert(data_path="rotation_euler", frame=f_start)
    quantum.keyframe_insert(data_path="location", frame=f_end)
    quantum.keyframe_insert(data_path="rotation_euler", frame=f_end)

    # Свечи: хаос → выравнивание
    for c in candles:
        # начальный хаос по высоте
        start_scale = random.uniform(0.5, 2.5)
        c.scale = (1.0, 1.0, start_scale)
        c.keyframe_insert(data_path="scale", frame=f_start)

        # середина — движение к нормализации
        mid_scale = (start_scale + 1.3) * 0.5
        c.scale = (1.0, 1.0, mid_scale)
        c.keyframe_insert(data_path="scale", frame=f_mid)

        # финал — все примерно одной высоты
        c.scale = (1.0, 1.0, 1.3)
        c.keyframe_insert(data_path="scale", frame=f_end)

    # Камера: подлёт к улице и к свечам

    # Вход в каньон
    cam.location = (0.0, -25.0, 18.0)
    cam.rotation_euler = (math.radians(70), 0.0, 0.0)
    cam.keyframe_insert(data_path="location", frame=f_start)
    cam.keyframe_insert(data_path="rotation_euler", frame=f_start)

    # На уровне Quantum, общий с перспективой
    cam.location = (0.0, -10.0, 6.0)
    cam.rotation_euler = (math.radians(75), 0.0, 0.0)
    cam.keyframe_insert(data_path="location", frame=f_mid)
    cam.keyframe_insert(data_path="rotation_euler", frame=f_mid)

    # Крупный план свечей и логотипа
    cam.location = (0.0, -3.0, 4.0)
    cam.rotation_euler = (math.radians(80), 0.0, 0.0)
    cam.keyframe_insert(data_path="location", frame=f_end)
    cam.keyframe_insert(data_path="rotation_euler", frame=f_end)

    # Немного "handheld" шума в финале
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            if fc.data_path == "location" and fc.array_index in (0, 1):
                mod = fc.modifiers.new(type='NOISE')
                mod.scale = 18.0
                mod.strength = 0.04

def animate_space_scene(space_objs, camera):
    """
    Анимация космоса 0–5 секунд:
    0–2 c  : ореол вращается, мысли собираются
    2–3.5 c: луч "сканирует" ореол, ядро формируется
    3.5–5 c: ядро сжимается в луч, уходящий к камере/Земле,
             камера делает лёгкий долли-ин.
    """
    earth = space_objs["earth"]
    ring = space_objs["ring"]
    core = space_objs["core"]
    beam = space_objs["beam"]

    # -------- Ключевые кадры по времени --------
    f_start = SPACE_START
    f_rot = int(SPACE_START + FPS * 2.0)
    f_beam_on = int(SPACE_START + FPS * 3.0)
    f_core_full = int(SPACE_START + FPS * 3.5)
    f_transition = SPACE_END

    # Земля слегка вращается
    earth.rotation_euler = (0, 0, 0)
    earth.keyframe_insert("rotation_euler", frame=f_start)
    earth.rotation_euler = (0, math.radians(10), math.radians(40))
    earth.keyframe_insert("rotation_euler", frame=f_transition)

    # Ореол крутится быстрее
    ring.rotation_euler = (math.radians(90), 0, 0)
    ring.keyframe_insert("rotation_euler", frame=f_start)
    ring.rotation_euler = (math.radians(90), 0, math.radians(360))
    ring.keyframe_insert("rotation_euler", frame=f_rot)

    # Ядро: появляется позже
    core.scale = (0.0, 0.0, 0.0)
    core.keyframe_insert("scale", frame=f_start)
    core.scale = (1.0, 1.0, 1.0)
    core.keyframe_insert("scale", frame=f_core_full)

    # Луч: появляется с задержкой
    beam.scale = (1.0, 0.0, 1.0)  # глубина 0
    beam.keyframe_insert("scale", frame=f_start)
    beam.scale = (1.0, 1.0, 1.0)
    beam.keyframe_insert("scale", frame=f_beam_on)

    # После формирования ядра ореол "схлопывается"
    ring.scale = (1.0, 1.0, 1.0)
    ring.keyframe_insert("scale", frame=f_core_full)
    ring.scale = (0.2, 0.2, 0.2)
    ring.keyframe_insert("scale", frame=f_transition)

    # Камера: орбитальный пролёт вокруг Земли с dolly-in
    cam = camera
    cam.location = (0, -45, 18)
    cam.rotation_euler = (math.radians(70), 0, 0)
    cam.keyframe_insert("location", frame=f_start)
    cam.keyframe_insert("rotation_euler", frame=f_start)

    cam.location = (18, -35, 16)
    cam.rotation_euler = (math.radians(65), 0, math.radians(25))
    cam.keyframe_insert("location", frame=f_rot)
    cam.keyframe_insert("rotation_euler", frame=f_rot)

    cam.location = (0, -30, 14)
    cam.rotation_euler = (math.radians(70), 0, 0)
    cam.keyframe_insert("location", frame=f_transition)
    cam.keyframe_insert("rotation_euler", frame=f_transition)

    # Немного "дрожания" камеры, чтобы было живо
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            if fc.data_path == "location":
                mod = fc.modifiers.new(type='NOISE')
                mod.scale = 40.0
                mod.strength = 0.05

# ==============================
# ЧАСТИЦЫ / СВЕТОВЫЕ ЧАСТИЦЫ
# ==============================

def add_energy_particles(collection, quantum_root):
    """Добавляет вокруг Quantum светящиеся частицы."""
    # Сфера-эмиттер вокруг персонажа
    bpy.ops.mesh.primitive_ico_sphere_add(radius=3.5, location=(0, 0.5, 3))
    emitter = bpy.context.active_object
    emitter.name = "EnergyEmitter"
    collection.objects.link(emitter)

    # Материал (невидимый)
    mat = bpy.data.materials.new("EmitterMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Alpha"].default_value = 0.0
    emitter.data.materials.append(mat)

    # Частицы
    ps = emitter.modifiers.new("EnergyParticles", type='PARTICLE_SYSTEM')
    psettings = ps.particle_system.settings
    psettings.count = 4500
    # частицы весь блок пробуждения
    psettings.frame_start = ROOFTOP_START
    psettings.frame_end = ROOFTOP_END
    psettings.lifetime = int(FPS * 3.5)

    psettings.render_type = 'HALO'
    psettings.physics_type = 'NEWTON'
    psettings.normal_factor = 0.0
    psettings.factor_random = 0.6
    psettings.tangent_factor = 0.5
    psettings.gravity = 0
    psettings.use_rotations = True

    # Светящийся объект-частица
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(0, 0, 0))
    p_obj = bpy.context.active_object
    p_obj.name = "EnergyParticleObj"
    p_mat = create_emission_material("EnergyParticleMat",
                                     color=(0.2, 0.8, 1.0, 1),
                                     strength=120.0)
    p_obj.data.materials.append(p_mat)
    collection.objects.link(p_obj)

    psettings.render_type = 'OBJECT'
    psettings.instance_object = p_obj

# ==============================
# КОМПОЗИТИНГ
# ==============================

def setup_compositor(scene):
    scene.use_nodes = True
    nt = scene.node_tree
    nodes = nt.nodes
    links = nt.links

    for n in nodes:
        nodes.remove(n)

    render_layers = nodes.new("CompositorNodeRLayers")

    # Bloom/Glare
    glare = nodes.new("CompositorNodeGlare")
    glare.glare_type = 'FOG_GLOW'
    glare.quality = 'HIGH'
    glare.mix = 0.4
    glare.size = 9
    glare.threshold = 0.4

    # Лёгкий виньет + цветокор
    rgb_curves = nodes.new("CompositorNodeCurveRGB")
    rgb_curves.mapping.curves[3].points.new(0.2, 0.15)  # чуть затемнить края

    # Фильм-грейн через шум
    noise_tex = nodes.new("CompositorNodeTexNoise")
    noise_tex.inputs["Scale"].default_value = 150.0
    noise_tex.inputs["Detail"].default_value = 2.0
    noise_tex.inputs["Roughness"].default_value = 0.5

    mix_grain = nodes.new("CompositorNodeMixRGB")
    mix_grain.blend_type = 'OVERLAY'
    mix_grain.inputs["Fac"].default_value = 0.08

    composite = nodes.new("CompositorNodeComposite")
    viewer = nodes.new("CompositorNodeViewer")

    links.new(render_layers.outputs["Image"], glare.inputs["Image"])
    links.new(glare.outputs["Image"], rgb_curves.inputs["Image"])

    links.new(rgb_curves.outputs["Image"], mix_grain.inputs[1])
    links.new(noise_tex.outputs["Color"], mix_grain.inputs[2])

    links.new(mix_grain.outputs["Color"], composite.inputs["Image"])
    links.new(mix_grain.outputs["Color"], viewer.inputs["Image"])

# ==============================
# ЗВУК (VSE)
# ==============================

def add_sound_track(scene, name, filepath, channel, frame_start):
    abs_path = bpy.path.abspath(filepath)
    if not os.path.exists(abs_path):
        print(f"[АУДИО] Файл {name} не найден по пути: {abs_path}")
        return None

    if not scene.sequence_editor:
        scene.sequence_editor_create()
    seq = scene.sequence_editor

    snd = seq.sequences.new_sound(
        name=name,
        filepath=filepath,
        channel=channel,
        frame_start=frame_start
    )
    print(f"[АУДИО] Добавлен трек {name}: {filepath} @ frame {frame_start}")
    return snd
def add_fading_sound_track(scene, name, filepath, channel,
                           frame_start, frame_peak, frame_end,
                           vol_start=0.0, vol_peak=1.0, vol_end=0.0):
    """
    Обёртка над add_sound_track с автоматическим fade-in / fade-out по громкости.
    - frame_start: с какого кадра начнётся звук
    - frame_peak: к какому кадру выйдем на максимальную громкость
    - frame_end: к какому кадру заглушим (volume → vol_end)
    """
    strip = add_sound_track(scene, name, filepath, channel, frame_start)
    if not strip:
        return None

    # Начало — тихо
    strip.volume = vol_start
    strip.keyframe_insert(data_path="volume", frame=frame_start)

    # Пик — громко
    strip.volume = vol_peak
    strip.keyframe_insert(data_path="volume", frame=frame_peak)

    # Конец — снова тише
    strip.volume = vol_end
    strip.keyframe_insert(data_path="volume", frame=frame_end)

    return strip

def setup_audio(scene):
    """
    Аудио-схема по сценарию:

    0–5  сек (SPACE):
        - музыка
        - лёгкие голоса разных городов (как мысли человечества)

    5–10 сек (ROOFTOP):
        - музыка
        - голос Quantum (англ.)

    10–20 сек (CITIES FLYOVER):
        - музыка
        - для каждого города — его локальная толпа на языке страны

    20–30 сек (WALL STREET):
        - музыка
        - Quantum (EN)
        - толпа Нью-Йорка / Уолл-стрит (EN)
    """
    # --- МУЗЫКА ---
    music = add_sound_track(
        scene,
        name="MUSIC_MAIN",
        filepath=AUDIO_TRACKS["MUSIC_MAIN"],
        channel=1,
        frame_start=1
    )
    if music:
        # Базовый уровень
        music.volume = 0.9
        music.keyframe_insert("volume", frame=SPACE_START)

        # Чуть тише в момент активного VO QUANTUM (ROOFTOP + финал)
        music.volume = 0.75
        music.keyframe_insert("volume", frame=ROOFTOP_START)
        music.volume = 0.75
        music.keyframe_insert("volume", frame=WALLSTREET_START)

        # Чуть выше в блоке городов (там много толп, меньше VO)
        music.volume = 0.95
        music.keyframe_insert("volume", frame=CITIES_START)

        # Финальные 10 сек — лёгкий выход
        music.volume = 0.7
        music.keyframe_insert("volume", frame=WALLSTREET_END)

    # --- ДОПОЛНИТЕЛЬНЫЕ МУЗ. СЛОИ (STEMS) ---
    drums = add_sound_track(
        scene,
        name="MUSIC_STEM_DRUMS",
        filepath=AUDIO_TRACKS["MUSIC_STEM_DRUMS"],
        channel=3,
        frame_start=1
    )
    if drums:
        # тихий старт, раскачка к городам, лёгкий спад под финал
        drums.volume = 0.0
        drums.keyframe_insert("volume", frame=SPACE_START)
        drums.volume = 0.6
        drums.keyframe_insert("volume", frame=ROOFTOP_START)
        drums.volume = 1.0
        drums.keyframe_insert("volume", frame=CITIES_START)
        drums.volume = 0.7
        drums.keyframe_insert("volume", frame=WALLSTREET_START)
        drums.volume = 0.4
        drums.keyframe_insert("volume", frame=WALLSTREET_END)

    pad = add_sound_track(
        scene,
        name="MUSIC_STEM_PAD",
        filepath=AUDIO_TRACKS["MUSIC_STEM_PAD"],
        channel=4,
        frame_start=1
    )
    if pad:
        pad.volume = 0.4
        pad.keyframe_insert("volume", frame=SPACE_START)
        pad.volume = 0.7
        pad.keyframe_insert("volume", frame=ROOFTOP_START)
        pad.volume = 0.8
        pad.keyframe_insert("volume", frame=CITIES_START)
        pad.volume = 0.6
        pad.keyframe_insert("volume", frame=WALLSTREET_START)
        pad.volume = 0.3
        pad.keyframe_insert("volume", frame=WALLSTREET_END)

    # Основной английский монолог QUANTUM — один файл на весь фильм.
    quantum_vo = add_sound_track(
        scene,
        name="VO_QUANTUM_EN",
        filepath=AUDIO_TRACKS["VO_QUANTUM_EN"],
        channel=2,
        frame_start=ROOFTOP_START  # сразу, как мы падаем из космоса в дата-центр
    )
    if quantum_vo:
        quantum_vo.volume = 1.15


    # --- ФОН: ГОРОДА В КОСМОСЕ (0–5 секунд), как мысли человечества ---
    def sec_to_frame(t: float) -> int:
        return int(t * FPS)

    # TOKYO (японский) — ранний шёпот
    add_fading_sound_track(
        scene,
        name="CITY_TOKYO_JA_SPACE",
        filepath=AUDIO_TRACKS["CITY_TOKYO_JA"],
        channel=5,
        frame_start=sec_to_frame(5.0),
        frame_peak=sec_to_frame(12.0),
        frame_end=sec_to_frame(20.0),
        vol_start=0.0,
        vol_peak=0.8,
        vol_end=0.0
    )

    # NEW YORK (английский)
    add_fading_sound_track(
        scene,
        name="CITY_NY_EN_SPACE",
        filepath=AUDIO_TRACKS["CITY_NY_EN"],
        channel=6,
        frame_start=sec_to_frame(18.0),
        frame_peak=sec_to_frame(26.0),
        frame_end=sec_to_frame(34.0),
        vol_start=0.0,
        vol_peak=0.8,
        vol_end=0.0
    )

    # DUBAI (арабский)
    add_fading_sound_track(
        scene,
        name="CITY_DUBAI_AR_SPACE",
        filepath=AUDIO_TRACKS["CITY_DUBAI_AR"],
        channel=7,
        frame_start=sec_to_frame(30.0),
        frame_peak=sec_to_frame(38.0),
        frame_end=sec_to_frame(46.0),
        vol_start=0.0,
        vol_peak=0.8,
        vol_end=0.0
    )


    # BERLIN + MOSCOW — ближе к концу пролога
    add_fading_sound_track(
        scene,
        name="CITY_BERLIN_DE_SPACE",
        filepath=AUDIO_TRACKS["CITY_BERLIN_DE"],
        channel=8,
        frame_start=sec_to_frame(40.0),
        frame_peak=sec_to_frame(48.0),
        frame_end=sec_to_frame(56.0),
        vol_start=0.0,
        vol_peak=0.7,
        vol_end=0.0
    )


    add_fading_sound_track(
        scene,
        name="CITY_MOSCOW_RU_SPACE",
        filepath=AUDIO_TRACKS["CITY_MOSCOW_RU"],
        channel=9,
        frame_start=sec_to_frame(44.0),
        frame_peak=sec_to_frame(52.0),
        frame_end=sec_to_frame(60.0),
        vol_start=0.0,
        vol_peak=0.7,
        vol_end=0.0
    )

    # --- SFX удара / логотипа --- (переход SPACE → ROOFTOP)
    impact_frame = SPACE_END  # 5 сек на 24 fps
    impact = add_sound_track(
        scene,
        name="SFX_IMPACT",
        filepath=AUDIO_TRACKS["SFX_IMPACT"],
        channel=10,
        frame_start=impact_frame
    )
    if impact:
        impact.volume = 1.2
    # --- RISERS НА ПЕРЕХОДАХ МЕЖДУ БЛОКАМИ ---
    add_fading_sound_track(
        scene,
        name="SFX_RISER_SPACE_TO_ROOF",
        filepath=AUDIO_TRACKS["SFX_RISER_SPACE_TO_ROOF"],
        channel=16,
        frame_start=SPACE_END - int(FPS * 1.5),
        frame_peak=SPACE_END,
        frame_end=ROOFTOP_START + int(FPS * 0.5),
        vol_start=0.0,
        vol_peak=1.0,
        vol_end=0.0
    )

    add_fading_sound_track(
        scene,
        name="SFX_RISER_ROOF_TO_CITIES",
        filepath=AUDIO_TRACKS["SFX_RISER_ROOF_TO_CITIES"],
        channel=17,
        frame_start=ROOFTOP_END - int(FPS * 1.5),
        frame_peak=ROOFTOP_END,
        frame_end=CITIES_START + int(FPS * 0.5),
        vol_start=0.0,
        vol_peak=1.0,
        vol_end=0.0
    )

    add_fading_sound_track(
        scene,
        name="SFX_RISER_CITIES_TO_WALL",
        filepath=AUDIO_TRACKS["SFX_RISER_CITIES_TO_WALL"],
        channel=18,
        frame_start=CITIES_END - int(FPS * 1.5),
        frame_peak=CITIES_END,
        frame_end=WALLSTREET_START + int(FPS * 0.5),
        vol_start=0.0,
        vol_peak=1.0,
        vol_end=0.0
    )

    # --- НИЗКИЙ BRAAM В НАЧАЛЕ КАЖДОГО БЛОКА ---
    for name, frame in [
        ("BRAAM_SPACE", SPACE_START),
        ("BRAAM_ROOF", ROOFTOP_START),
        ("BRAAM_CITIES", CITIES_START),
        ("BRAAM_WALL", WALLSTREET_START),
    ]:
        add_fading_sound_track(
            scene,
            name=name,
            filepath=AUDIO_TRACKS["SFX_BRAAM_LOW"],
            channel=19,
            frame_start=frame,
            frame_peak=frame + int(FPS * 0.2),
            frame_end=frame + int(FPS * 0.8),
            vol_start=0.0,
            vol_peak=1.0,
            vol_end=0.0
        )

    # --- WHOOSH ПОД КРУПНЫЕ ДВИЖЕНИЯ КАМЕРЫ ---
    for f in [
        ROOFTOP_START,              # старт облёта дата-центра
        ROOFTOP_START + int(FPS*1.6),
        ROOFTOP_START + int(FPS*3.3),
        WALLSTREET_START,           # вход в каньон
        WALLSTREET_START + int((WALLSTREET_END - WALLSTREET_START) * 0.4),
    ]:
        add_fading_sound_track(
            scene,
            name=f"WHOOSH_{f}",
            filepath=AUDIO_TRACKS["SFX_WHOOSH_CAMERA"],
            channel=20,
            frame_start=f - int(FPS * 0.3),
            frame_peak=f,
            frame_end=f + int(FPS * 0.3),
            vol_start=0.0,
            vol_peak=0.9,
            vol_end=0.0
        )

    # --- HEARTBEAT SUB В МОМЕНТЫ НАПРЯЖЕНИЯ ---
    # Пробуждение Quantum
    add_fading_sound_track(
        scene,
        name="HEARTBEAT_ROOF",
        filepath=AUDIO_TRACKS["SFX_HEARTBEAT_SUB"],
        channel=21,
        frame_start=ROOFTOP_START,
        frame_peak=ROOFTOP_START + int((ROOFTOP_END - ROOFTOP_START) * 0.5),
        frame_end=ROOFTOP_END,
        vol_start=0.0,
        vol_peak=0.7,
        vol_end=0.2
    )

    # Финал Уолл-стрит
    add_fading_sound_track(
        scene,
        name="HEARTBEAT_WALL",
        filepath=AUDIO_TRACKS["SFX_HEARTBEAT_SUB"],
        channel=22,
        frame_start=WALLSTREET_START,
        frame_peak=WALLSTREET_START + int((WALLSTREET_END - WALLSTREET_START) * 0.6),
        frame_end=WALLSTREET_END,
        vol_start=0.0,
        vol_peak=0.8,
        vol_end=0.0
    )

    # --- ГОРОДА 10–20 секунд: у каждого свой язык в своём сегменте ---
    cities_count = 4
    city_segment = (CITIES_END - CITIES_START + 1) // cities_count

    # TOKYO сегмент
    tokyo_start = CITIES_START
    tokyo_peak = tokyo_start + int(city_segment * 0.3)
    tokyo_end = tokyo_start + city_segment - 1
    add_fading_sound_track(
        scene,
        name="CITY_TOKYO_JA_FLY",
        filepath=AUDIO_TRACKS["CITY_TOKYO_JA"],
        channel=11,
        frame_start=tokyo_start,
        frame_peak=tokyo_peak,
        frame_end=tokyo_end,
        vol_start=0.0,
        vol_peak=0.9,
        vol_end=0.1
    )

    # DUBAI сегмент
    dubai_start = tokyo_end + 1
    dubai_peak = dubai_start + int(city_segment * 0.3)
    dubai_end = dubai_start + city_segment - 1
    add_fading_sound_track(
        scene,
        name="CITY_DUBAI_AR_FLY",
        filepath=AUDIO_TRACKS["CITY_DUBAI_AR"],
        channel=12,
        frame_start=dubai_start,
        frame_peak=dubai_peak,
        frame_end=dubai_end,
        vol_start=0.0,
        vol_peak=0.9,
        vol_end=0.1
    )

    # BERLIN сегмент
    berlin_start = dubai_end + 1
    berlin_peak = berlin_start + int(city_segment * 0.3)
    berlin_end = berlin_start + city_segment - 1
    add_fading_sound_track(
        scene,
        name="CITY_BERLIN_DE_FLY",
        filepath=AUDIO_TRACKS["CITY_BERLIN_DE"],
        channel=13,
        frame_start=berlin_start,
        frame_peak=berlin_peak,
        frame_end=berlin_end,
        vol_start=0.0,
        vol_peak=0.9,
        vol_end=0.1
    )

    # MOSCOW сегмент
    moscow_start = berlin_end + 1
    moscow_peak = moscow_start + int(city_segment * 0.3)
    moscow_end = min(moscow_start + city_segment - 1, CITIES_END)
    add_fading_sound_track(
        scene,
        name="CITY_MOSCOW_RU_FLY",
        filepath=AUDIO_TRACKS["CITY_MOSCOW_RU"],
        channel=14,
        frame_start=moscow_start,
        frame_peak=moscow_peak,
        frame_end=moscow_end,
        vol_start=0.0,
        vol_peak=0.9,
        vol_end=0.1
    )

    # --- УОЛЛ-СТРИТ 20–30 секунд: Нью-Йоркская толпа (английский) ---
    ws_start = WALLSTREET_START
    ws_peak = ws_start + int((WALLSTREET_END - WALLSTREET_START) * 0.35)
    ws_end = WALLSTREET_END

    add_fading_sound_track(
        scene,
        name="CITY_NY_EN_WALLSTREET",
        filepath=AUDIO_TRACKS["CITY_NY_EN"],
        channel=15,
        frame_start=ws_start,
        frame_peak=ws_peak,
        frame_end=ws_end,
        vol_start=0.0,
        vol_peak=0.9,
        vol_end=0.3
    )

# ==============================
# ГЛАВНАЯ ФУНКЦИЯ
# ==============================

def main():
    clean_scene()
    scene = create_scene()
    setup_render(scene)
    setup_world()

    # Коллекции
    space_col = ensure_collection("SPACE_SCENE")
    rooftop_col = ensure_collection("ROOFTOP_SCENE")
    tokyo_col = ensure_collection("CITY_TOKYO_SCENE")
    dubai_col = ensure_collection("CITY_DUBAI_SCENE")
    berlin_col = ensure_collection("CITY_BERLIN_SCENE")
    moscow_col = ensure_collection("CITY_MOSCOW_SCENE")
    wallstreet_col = ensure_collection("WALLSTREET_SCENE")

    # --- КОСМОС (пролог) ---
    space_objs = build_space_scene(space_col)

    # --- ДАТА-ЦЕНТР / КРЫША + Quantum (пробуждение) ---
    build_datacenter(rooftop_col)
    quantum_root = build_quantum_body(rooftop_col)
    setup_lighting(rooftop_col)

    # Камера одна на всё шоу
    camera = create_camera(rooftop_col, quantum_root)

    # --- ГОРОДА ---
    build_city_tokyo(tokyo_col)
    build_city_dubai(dubai_col)
    build_city_berlin(berlin_col)
    build_city_moscow(moscow_col)

    # Quantum в каждом городе (проход по улице)
    qt_tokyo = build_quantum_body(tokyo_col)
    qt_dubai = build_quantum_body(dubai_col)
    qt_berlin = build_quantum_body(berlin_col)
    qt_moscow = build_quantum_body(moscow_col)

    # --- УОЛЛ-СТРИТ + Quantum + свечи ---
    wall_objs = build_wallstreet_scene(wallstreet_col)

    # Анимации:
    # 0–5 c  : космос
    animate_space_scene(space_objs, camera)

    # 5–10 c : пробуждение Quantum в дата-центре
    animate_quantum(quantum_root)
    animate_camera(camera)  # облет в дата-центре (вторая половина первой 10-сек доли)

    # 10–20 c: пролёт по городам
    animate_cities_flyover(camera)

    # 20–30 c: Уолл-стрит, свечи нормализуются
    animate_wallstreet_scene(wall_objs, camera)

    # Частицы вокруг Quantum в дата-центре
    add_energy_particles(rooftop_col, quantum_root)

    # Видимость блоков по таймлайну
    keyframe_collection_visibility(space_col, SPACE_START, SPACE_END)
    keyframe_collection_visibility(rooftop_col, ROOFTOP_START, ROOFTOP_END)

    # Города по очереди в блоке CITIES + собираем сегменты для анимации Quantum
    city_cols = [tokyo_col, dubai_col, berlin_col, moscow_col]
    city_quanta = [qt_tokyo, qt_dubai, qt_berlin, qt_moscow]
    city_segments = []

    city_segment = (CITIES_END - CITIES_START + 1) // len(city_cols)
    for idx, (col, q) in enumerate(zip(city_cols, city_quanta)):
        c_start = CITIES_START + idx * city_segment
        c_end = min(CITIES_START + (idx + 1) * city_segment - 1, CITIES_END)
        keyframe_collection_visibility(col, c_start, c_end)
        city_segments.append((q, c_start, c_end))

    # Анимация прохода Quantum в каждом городе
    animate_quantum_in_cities(city_segments)

    # Уолл-стрит в финале
    keyframe_collection_visibility(wallstreet_col, WALLSTREET_START, WALLSTREET_END)

    # Композитинг
    setup_compositor(scene)

    # Аудио (музыка + VO + SFX + голоса городов)
    setup_audio(scene)

    print("Сцена Quantum (космос + дата-центр + города + Уолл-стрит) создана. Готово к рендеру.")


if __name__ == "__main__":
    main()


