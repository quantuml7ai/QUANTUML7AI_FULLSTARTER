import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import RuntimePassportPanel from '../../../src/shared/runtime/passports/runtimePassportPanel.jsx';
import { buildSamplePassport, fileText } from '../../support/runtimeGovernance.js';

const SURFACE_CASES = [
  ['components/ForumBootSplash.jsx', ['forum-boot-splash', '/load/load.mp4', 'onDone']],
  ['app/forum/features/feed/components/PostMediaStack.jsx', ['VideoMediaComponent', 'QCastPlayerComponent', 'data-forum-media="youtube"']],
  ['app/forum/features/media/components/VideoMedia.jsx', ['data-forum-video', 'IntersectionObserver', 'mutedEventName']],
  ['app/forum/features/media/components/QCastPlayer.jsx', ['buildQCastControlBars', "mutedEventName = 'forum:media-mute'", 'data-forum-media="qcast"']],
  ['app/forum/ForumAds.js', ['MEDIA_MUTED_EVENT', 'interleaveAds', 'AdsCoordinator']],
  ['components/AuthNavClient.jsx', ['auth:ok', 'open-auth', 'useWeb3Modal']],
  ['components/TopBar.js', ['AuthNavClient', 'LanguageSwitcher', 'nav-orbit']],
  ['components/ScrollTopPulse.js', ['requestAnimationFrame', 'passive: true', 'SCROLL_PX_PER_SEC']],
  ['components/BgAudio.js', ['site-media-play', 'touchstart', 'preload="metadata"']],
  ['components/InviteFriendProvider.jsx', ['InviteFriendPopup', 'readUnifiedAccountId', '/api/referral/link']],
  ['components/QCoinDropFX.jsx', ['requestAnimationFrame', 'auth:ok', '/api/qcoin/drop']],
  ['app/about/page.js', ['about-hero-poster', '/branding/about-poster.jpg', 'data-anim="1"']],
  ['app/ads/home.js', ['checkVideoDuration', 'MAX_VIDEO_SECONDS', 'ads-chart-container']],
];

describe('runtime component surfaces', () => {
  test('runtime passport panel renders a human-readable snapshot', () => {
    render(React.createElement(RuntimePassportPanel, { passport: buildSamplePassport() }));

    expect(screen.getByText('Runtime Passport')).toBeInTheDocument();
    expect(screen.getByText('/forum')).toBeInTheDocument();
    expect(screen.getByText('forum-feed-mobile')).toBeInTheDocument();
    expect(screen.getByText('1 / 1 / 0')).toBeInTheDocument();
  });

  for (const [relPath, patterns] of SURFACE_CASES) {
    test(`${relPath} keeps the stage 0 observable surface`, () => {
      const text = fileText(relPath);
      for (const pattern of patterns) {
        expect(text).toContain(pattern);
      }
    });
  }
});
