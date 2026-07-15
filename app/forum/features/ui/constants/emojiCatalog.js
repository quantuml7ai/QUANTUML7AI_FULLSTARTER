// Forum emoji/icon catalog extracted from ForumRoot for modular ownership

export const ICONS = '👦 👧 🧑 🧑‍🦱 🧑‍🦰 🧑‍🦳 🧑‍🦲 🧔 🧕 🧑‍🎓 🧑‍💻 🧑‍🚀 🕵️ 🦸 🦹 🧑‍✈️ 🧑‍🎤 🤖 👺 👻 👽 😼 😺 😾 🦊 🐼 🐻 🐨 🐯 🐸'.split(' ')

// ---------- Helpers ----------
const _dedupe = (arr) => Array.from(new Set(arr.filter(Boolean)))
const _split = (s) => _dedupe(s.trim().split(/\s+/))
const _mkFlag = (iso2) => {
  const A = 0x1F1E6 // REGIONAL INDICATOR A
  return String.fromCodePoint(...iso2.toUpperCase().split('').map(c => A + (c.charCodeAt(0) - 65)))
}

// ---------- Data pools ----------
const FLAG_ISO = _split(`
🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️
`).map(_mkFlag)

const CLOCKS = _split('🕐 🕜 🕑 🕝 🕒 🕞 🕓 🕟 🕔 🕠 🕕 🕡 🕖 🕢 🕗 🕣 🕘 🕤 🕙 🕥 🕚 🕦 🕛 🕧')
const KEYPADS = _split('0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ *️⃣ #️⃣ 🔟')
const ARROWS = _split('⬆️ ⬇️ ⬅️ ➡️ ↗️ ↘️ ↙️ ↖️ ↩️ ↪️ ⤴️ ⤵️ 🔼 🔽 ▶️ ◀️ ⏩ ⏪ ⏫ ⏬')

const SEED_SMILEYS = _split(`
  😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 😐 😑 😶 🙄
  😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥱 😤 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 🤯
  😵 😵‍💫 😴 🤤 🤧 🤮 🤢 🤒 🤕 🤠 😎 🤓 🥸 🤥 🤫 🤭 🫢 🫣 🤔 🫡 🤗 🫶 😶‍🌫️ 😮‍💨 😮‍💫
  👻 💀 ☠️ 👽 👾 🤖 🎃
`)
const SEED_HANDS = _split(`
  👍 👎 👊 ✊ 🤛 🤜 ✋ 🤚 🖐 🖖 👋 🤙 💪 🙏 🤝 👏 🙌 🤲 👐 🫶
  👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 ☝️ 👆 👇 👉 👈 ✍️
  🤜🏻 🤜🏼 🤜🏽 🤜🏾 🤜🏿  👍🏻 👍🏼 👍🏽 👍🏾 👍🏿  👋🏻 👋🏼 👋🏽 👋🏾 👋🏿
`)
const SEED_PEOPLE = _split(`
  👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵
  🧔 🧔‍♂️ 🧔‍♀️ 👱 👱‍♂️ 👱‍♀️ 👨‍🦰 👩‍🦰 👨‍🦱 👩‍🦱 👨‍🦳 👩‍🦳 👨‍🦲 👩‍🦲
  👮 👮‍♂️ 👮‍♀️ 👷 👷‍♂️ 👷‍♀️ 💂 💂‍♂️ 💂‍♀️ 🕵️ 🕵️‍♂️ 🕵️‍♀️
  👨‍⚕️ 👩‍⚕️ 👨‍🎓 👩‍🎓 👨‍🏫 👩‍🏫 👨‍⚖️ 👩‍⚖️ 👨‍🌾 👩‍🌾
  👨‍🍳 👩‍🍳 👨‍🔧 👩‍🔧 👨‍🏭 👩‍🏭 👨‍💼 👩‍💼 👨‍🔬 👩‍🔬 👨‍💻 👩‍💻
  👨‍🎤 👩‍🎤 👨‍🎨 👩‍🎨 👨‍✈️ 👩‍✈️ 👨‍🚀 👩‍🚀 👨‍🚒 👩‍🚒
  🤵 👰 🤵‍♂️ 👰‍♀️ 👩‍❤️‍👨 👨‍❤️‍👨 👩‍❤️‍👩 💑 💏
  🤱 🧑‍🍼 👩‍🍼 👨‍🍼 👯 👯‍♂️ 👯‍♀️ 💃 🕺 🕴️
  🧘 🧘‍♂️ 🧘‍♀️ 🏃 🏃‍♂️ 🏃‍♀️ 🚶 🚶‍♂️ 🚶‍♀️
  🧎 🧎‍♂️ 🧎‍♀️ 🧍 🧍‍♂️ 🧍‍♀️
  🧑‍🦽 👨‍🦽 👩‍🦽 🧑‍🦼 👨‍🦼 👩‍🦼
`)
const SEED_ANIMALS = _split(`
  🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊
  🐒 🦍 🦧 🦮 🐕 🐩 🐺 🐈 🐈‍⬛
  🐴 🦄 🐎 🐂 🐃 🐄 🐖 🐗 🐏 🐑 🐐 🦌
  🐘 🦣 🦏 🦛 🦒 🐫 🐪 🐿️ 🦫 🦦 🦥 🦨
  🐍 🦎 🐢 🐊 🐉 🐲
  🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🦑 🦐 🦞 🦀 🪼
  🐚 🐌 🦋 🐛 🐜 🐝 🪲 🦗 🕷️ 🕸️ 🦂 🪳 🪰 🪱 🐾
`)
const SEED_FOOD = _split(`
  🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝
  🍅 🍆 🥑 🥦 🥬 🧄 🧅 🥔 🥕 🌽 🫑 🥒 🫘 🥜 🌰
  🍞 🥐 🥖 🫓 🥨 🥯 🧇 🥞 🧀
  🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥘 🍲
  🍛 🍣 🍱 🥟 🥠 🥡 🍜 🍝 🍚 🍥
  🍰 🎂 🧁 🍮 🍨 🍧 🍦 🍩 🍪 🍫 🍬 🍭 🍯
  ☕ 🍵 🧉 🧋 🥤 🥛 🍶 🍺 🍻 🍷 🥂 🍸 🍹 🍾
`)
const SEED_ACTIVITIES = _split(`
  ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🪀 🏓 🏸 🥅 🥊 🥋 🥏 🪁
  ⛳ 🏌️ 🏌️‍♂️ 🏌️‍♀️ 🏇 🧗 🧗‍♂️ 🧗‍♀️
  🚴 🚴‍♂️ 🚴‍♀️ 🚵 🚵‍♂️ 🚵‍♀️ 🛼 ⛸️ 🎿 ⛷️ 🏂
  🎣 🏹 🤿 🛶 🚣 🚣‍♂️ 🚣‍♀️
  🎽 🎖️ 🏆 🥇 🥈 🥉
  🎟️ 🎭 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🎸 🪗
  🎮 🕹️ 🎲 ♟️ 🧩 🧸 🎯 🎳 🎰
`)
const SEED_TRAVEL = _split(`
  🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🚚 🚛 🚜 🛻
  🛵 🏍️ 🚲 🛴 🦽 🦼
  ✈️ 🛫 🛬 🛩️ 🚁 🚀 🛸
  ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 🛶
  🚂 🚆 🚇 🚊 🚉 🚝 🚞 🚈 🚅 🚄
  🛰️ 🛗 🛝 🛤️ 🛣️ 🗺️
  🏙️ 🏗️ 🏭 🏠 🏡 🏘️ 🏚️ 🏥 🏦 🏫 🏛️ 🕌 🛕 ⛪ 🕍
  🗽 🗼 🗿 🏰 🏯 ⛩️ 🌉
`)
const SEED_OBJECTS = _split(`
  ⌚ 📱 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀
  📷 📸 🎥 📹 📼 📡 📺 📻
  🔊 🔉 🔈 🔇 🧭 ⏱️ ⏲️ ⏰ ⏳ ⌛
  🔋 🔌 💡 🔦 🕯️ 🧯 🔧 🔨 ⚒️ 🛠️ 🧱 ⚙️ 🪛 🪚 🪜 ⚗️ 🧪 🧫 🧬 🔬 🔭
  💊 💉 🩹 🩺 🩻
  🧰 🧲 🧵 🧶 🪡 🪢
  📦 📫 📮 📬 📭 📪 📩 ✉️ 📧
  📰 📖 📚 📒 📓 📔 📕 📗 📘 📙 📑 🔖
  ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 📎 🖇️ 📐 📏 📌 📍
  🔒 🔓 🔑 🗝️ 🧿 🪬
  💼 🎒 🧳 🛍️ 👝 👛 👜 👓 🕶️ 🥽
  🧴 🧼 🪥 🧻 🧽 🪣
`)
const SEED_SYMBOLS = _split(`
  ❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹
  💬 💭 🗯️ 💢 💥 💦 💨 ✨ ⭐ 🌟 💫 🎇 🎆
  🔥 ⚡ ❄️ 💧 🌈 ☀️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ 🌨️ 🌪️ 🌫️ 🌙 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔
  ♻️ ♾️ ⛔ 🚫 ❌ ✅ ☑️ ✔️ ➕ ➖ ➗ ✖️
  ™️ ©️ ®️ ℹ️ Ⓜ️ 🅿️ 🆘 🆗 🆒 🆕 🆙 🆚 🆓
  🔞 🚸 ⚠️ ☢️ ☣️ 🔰 🔱 ♠️ ♥️ ♦️ ♣️ 🎴 🀄
  🔯 ✡️ ☪️ ☮️ ☯️ ✝️ ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓
  🧿 🔅 🔆 🛑 ⛳ 🚩 🏁 🎌
`)

// Дополнение для объёма (стрелки/цифры/часы/флаги)
const EXTRA = _dedupe([...CLOCKS, ...KEYPADS, ...ARROWS, ...FLAG_ISO])

// ---------- Итог: категории с отдельными i18n-ключами ----------
export const EMOJI = [
  { k: 'smileys', title: 'forum_emoji_cat_smileys', list: _dedupe([...SEED_SMILEYS]) },
  { k: 'hands', title: 'forum_emoji_cat_hands', list: _dedupe([...SEED_HANDS]) },
  { k: 'people', title: 'forum_emoji_cat_people', list: _dedupe([...SEED_PEOPLE]) },
  { k: 'animals', title: 'forum_emoji_cat_animals', list: _dedupe([...SEED_ANIMALS]) },
  { k: 'food', title: 'forum_emoji_cat_food', list: _dedupe([...SEED_FOOD]) },
  { k: 'activities', title: 'forum_emoji_cat_activities', list: _dedupe([...SEED_ACTIVITIES]) },
  { k: 'travel', title: 'forum_emoji_cat_travel', list: _dedupe([...SEED_TRAVEL]) },
  { k: 'objects', title: 'forum_emoji_cat_objects', list: _dedupe([...SEED_OBJECTS]) },
  { k: 'symbols', title: 'forum_emoji_cat_symbols', list: _dedupe([...SEED_SYMBOLS, ...EXTRA]) },
  { k: 'flags', title: 'forum_emoji_cat_flags', list: _dedupe([...FLAG_ISO]) },
]
