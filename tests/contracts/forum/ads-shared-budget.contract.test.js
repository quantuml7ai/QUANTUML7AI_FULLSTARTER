import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

describe('ads shared budget contract', () => {
  test('content owner outranks ad owner and forum ad concurrency stays capped', () => {
    const engine = createBudgetEngine({ routeProfiles });
    const winner = engine.evaluateOwnerConflict({
      profileId: 'forum-feed-mobile',
      candidates: [
        { runtimeId: 'ad:1', ownerType: 'ad', lastActivityAt: 1 },
        { runtimeId: 'content:1', ownerType: 'content', lastActivityAt: 1 },
      ],
    });

    expect(winner.runtimeId).toBe('content:1');
    expect(routeProfiles['forum-feed-mobile'].allowedAdPlayers).toBeLessThanOrEqual(1);
    expect(routeProfiles['forum-feed-desktop'].allowedAdPlayers).toBeLessThanOrEqual(1);
  });

  test('global site ad selection and media rotation can only commit outside the viewport', () => {
    const src = read('app/ads.js');
    const sharedAdCard = read('app/forum/ForumAds.js');

    expect(src).toContain('const selectedAdUrlRef = useRef(null);');
    expect(src).toContain('const isInViewportRef = useRef(true);');
    expect(src).toContain('const pendingAdRepickRef = useRef(false);');
    expect(src).toContain('if (selectedAdUrlRef.current && isInViewportRef.current) {');
    expect(src).toContain('pendingAdRepickRef.current = true;');
    expect(src).toContain('if (!inViewport && pendingAdRepickRef.current) {');
    expect(src).toContain('repickAdUrl();');

    const rotationStart = src.indexOf('const schedule = () => {', src.indexOf('const rotateMin = Number(conf.ROTATE_MIN || 1);'));
    const rotationEnd = src.indexOf('return () => { if (timer) clearTimeout(timer); };', rotationStart);
    const rotationBlock = src.slice(rotationStart, rotationEnd);
    expect(rotationStart).toBeGreaterThanOrEqual(0);
    expect(rotationEnd).toBeGreaterThan(rotationStart);
    expect(rotationBlock).toContain('repickAdUrl();');
    expect(rotationBlock).not.toContain('resolveCurrentAdUrl(');
    expect(rotationBlock).not.toContain('setUrl(');
    expect(src.match(/resolveCurrentAdUrl\(/g)).toHaveLength(2);
    expect(src.match(/setUrl\(/g)).toHaveLength(2);

    expect(src).toContain('key={`site-ad:${internalSlotKey}:${adMountRevision}`}');
    expect(src).toContain('freezeMediaForMount');
    expect(sharedAdCard).toContain('if (freezeForMount) return undefined;');
    expect(sharedAdCard).toContain('const timer = setInterval(pickNext, rotateMs);');
  });
});
