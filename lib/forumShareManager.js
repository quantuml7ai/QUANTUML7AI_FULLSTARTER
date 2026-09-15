// lib/forumShareManager.js
// Client-safe helpers for Forum "Share post" feature.

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const SHARE_TITLE = 'Q-LINE THE FUTURE IS IN YOUR HANDS';
const SHARE_VERSION_PARAM = 'sv';

function normalizeVersion(value, fallback = '1') {
  const out = String(value || '').trim().slice(0, 80);
  return out || fallback;
}

function withQueryParam(rawUrl, key, value) {
  const url = String(rawUrl || '').trim();
  const paramKey = String(key || '').trim();
  const paramValue = String(value || '').trim();
  if (!url || !paramKey || !paramValue) return url;

  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';

  const queryIndex = beforeHash.indexOf('?');
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const queryString = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';

  const params = new URLSearchParams(queryString);
  params.set(paramKey, paramValue);
  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}

function resolveShareVersion() {
  const envVersion =
    (typeof process !== 'undefined' &&
      process?.env &&
      (process.env.NEXT_PUBLIC_META_VERSION ||
        process.env.NEXT_PUBLIC_OG_VERSION ||
        process.env.NEXT_PUBLIC_BUILD_ID ||
        '')) ||
    '';
  if (envVersion) return normalizeVersion(envVersion, '1');

  const clientBuildId =
    (typeof window !== 'undefined' &&
      window?.__NEXT_DATA__ &&
      typeof window.__NEXT_DATA__.buildId === 'string' &&
      window.__NEXT_DATA__.buildId) ||
    '';

  return normalizeVersion(clientBuildId, '1');
}

export function buildCanonicalPostPath(postId) {
  const id = String(postId || '').trim();
  const basePath = `/forum/p/${encodeURIComponent(id)}`;
  return withQueryParam(basePath, SHARE_VERSION_PARAM, resolveShareVersion());
}

export function buildCanonicalPostUrl(postId, origin) {
  const path = buildCanonicalPostPath(postId);
  const envBase =
    (typeof process !== 'undefined' &&
      process?.env &&
      typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' &&
      process.env.NEXT_PUBLIC_SITE_URL) ||
    '';
  const base =
    origin ||
    envBase ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '');
  if (!base) return path;
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

function decodeEntities(s) {
  const str = String(s || '');
  if (!str) return '';
  // Minimal decoding for common entities (enough for meta/share snippets).
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function toPlainText(raw) {
  const s0 = String(raw || '');
  if (!s0) return '';
  // Strip tags conservatively + normalize spaces.
  const noTags = s0.replace(/<[^>]*>/g, ' ');
  const decoded = decodeEntities(noTags);
  const withoutUrls = decoded
    // Remove absolute URLs (http/https), blob URLs and common app schemes.
    .replace(
      /\b(?:https?:\/\/|blob:|tg:\/\/|viber:\/\/|whatsapp:\/\/)[^\s<>'")]+/gi,
      ' '
    )
    // Remove relative uploads paths that often contain media storage details.
    .replace(/\/uploads\/[A-Za-z0-9._\-\/]+/g, ' ');
  return withoutUrls.replace(/\s+/g, ' ').trim();
}

export function truncateOnWord(s, maxLen = 200) {
  const text = String(s || '').trim();
  const lim = clamp(Number(maxLen) || 200, 40, 400);
  if (text.length <= lim) return text;
  const cut = text.slice(0, lim);
  const lastSpace = cut.lastIndexOf(' ');
  const out = (lastSpace >= 40 ? cut.slice(0, lastSpace) : cut).trim();
  return out ? `${out}…` : text.slice(0, lim).trim() + '…';
}

export function buildShareTitle(_post, labels) {
  void _post;
  void labels;
  return SHARE_TITLE;
}

/**
 * IMPORTANT:
 * We intentionally DO NOT pull post body/text into share text by default.
 * If a caller really wants to add custom share text, they must pass it explicitly via opts.text.
 */
function getExplicitShareBody(opts) {
  if (!opts || typeof opts !== 'object') return '';
  // Only accept share body if explicitly passed in options.
  const explicit = typeof opts.text === 'string' ? opts.text : '';
  if (!explicit.trim()) return '';
  const plain = toPlainText(explicit);
  return plain;
}

export function buildShareText(post, opts = {}) {
  const maxLen = Number(opts?.maxLen || 200);

  // Only include body if explicitly provided (opts.text).
  const explicitPlain = getExplicitShareBody(opts);
  const snippet = explicitPlain ? truncateOnWord(explicitPlain, maxLen) : '';

  const title =
    typeof opts?.title === 'string' && opts.title.trim()
      ? String(opts.title).trim()
      : buildShareTitle(post, opts?.labels || null);

  const includeTitle = opts?.includeTitle !== false;

  // If no snippet, keep behavior consistent: return title (not empty).
  if (!snippet) return title;

  return includeTitle ? `${title}\n\n${snippet}` : snippet;
}

export function buildShareSnippet(_post, opts = {}) {
  const maxLen = Number(opts?.maxLen || 220);

  // Only include snippet if explicitly provided (opts.text).
  const explicitPlain = getExplicitShareBody(opts);
  return explicitPlain ? truncateOnWord(explicitPlain, maxLen) : '';
}

export function getShareTargets({ url, text, labels }) {
  const safeUrl = String(url || '').trim();
  const safeText = String(text || '').trim();
  const lab = labels && typeof labels === 'object' ? labels : {};
  const l = (k, fallback) => {
    const v = String(lab?.[k] ?? '').trim();
    return v || fallback;
  };
  const urlEncoded = safeUrl ? encodeURIComponent(safeUrl) : '';
  const textEncoded = safeText ? encodeURIComponent(`${safeText} ${safeUrl}`.trim()) : '';
  const textOnlyEncoded = safeText ? encodeURIComponent(safeText) : '';

  return [
    {
      key: 'tg',
      icon: '/friends/tg.png',
      label: l('tg', 'Telegram'),
      url: safeUrl ? `https://t.me/share/url?url=${urlEncoded}&text=${textOnlyEncoded}` : '',
    },
    {
      key: 'ig',
      icon: '/friends/ig.png',
      label: l('ig', 'Instagram'),
      url: '', // uses native share when possible
    },
    {
      key: 'wa',
      icon: '/friends/wa.png',
      label: l('wa', 'WhatsApp'),
      url: safeUrl ? `https://wa.me/?text=${urlEncoded}` : '',
    },
    {
      key: 'viber',
      icon: '/friends/viber.png',
      label: l('viber', 'Viber'),
      url: safeUrl ? `viber://forward?text=${urlEncoded}` : '',
    },
    {
      key: 'fb',
      icon: '/friends/fb.png',
      label: l('fb', 'Facebook'),
      url: safeUrl ? `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}` : '',
    },
    {
      key: 'x',
      icon: '/friends/x.png',
      label: l('x', 'X'),
      url: safeUrl ? `https://twitter.com/intent/tweet?text=${textEncoded}` : '',
    },
  ];
}

export async function tryNativeShare({ title, text, url }) {
  try {
    if (typeof navigator === 'undefined') return false;
    if (typeof navigator.share !== 'function') return false;
    await navigator.share({
      title: String(title || '').slice(0, 120),
      text: String(text || '').slice(0, 1000),
      url: String(url || ''),
    });
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text) {
  const s = String(text || '');
  if (!s) return { ok: false, method: 'none' };

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    // fallthrough
  }

  try {
    if (typeof document === 'undefined') return { ok: false, method: 'none' };
    const ta = document.createElement('textarea');
    ta.value = s;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    try {
      ta.select();
      ta.setSelectionRange(0, s.length);
      const ok = document.execCommand('copy');
      return { ok: !!ok, method: 'execCommand' };
    } finally {
      try {
        if (typeof ta.remove === 'function') ta.remove();
        else ta.parentNode?.removeChild?.(ta);
      } catch {}
    }
  } catch {
    return { ok: false, method: 'none' };
  }
}

export function safeOpen(url) {
  const u = String(url || '').trim();
  if (!u) return false;
  try {
    window.open(u, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}
