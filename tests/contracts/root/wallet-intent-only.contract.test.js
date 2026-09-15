import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('wallet intent only contract', () => {
  test('wallet-capable profiles forbid wallet runtime before user intent', () => {
    for (const profileId of ['forum-feed-mobile', 'auth-light', 'wallet-ready', 'ads-preview']) {
      expect(routeProfiles[profileId].allowWalletRuntimeBeforeIntent).toBe(false);
    }
  });


  test('keeps the persistent host normally but restores intent-mounted guest OAuth on Safari', () => {
    const runtime = fs.readFileSync(path.join(process.cwd(), 'components/WalletRuntimeBridge.jsx'), 'utf8');
    const accountProbe = runtime.slice(
      runtime.indexOf('function RuntimeAccountProbe()'),
      runtime.indexOf('function RuntimeController('),
    );
    const prepareEffect = runtime.slice(
      runtime.indexOf('runtimePrepareScheduled: true'),
      runtime.indexOf("window.addEventListener('auth:logout'"),
    );

    expect(runtime).toContain('RUNTIME_PREPARE_IDLE_TIMEOUT_MS = 700');
    expect(runtime).toContain('function isSafariOAuthBrowser()');
    expect(runtime).toContain('if (isSafariOAuthBrowser() && !hasStoredWalletIdentity())');
    expect(runtime).toContain("lastDoneReason: 'safari_guest_lazy_runtime'");
    expect(runtime.indexOf('if (isSafariOAuthBrowser() && !hasStoredWalletIdentity())')).toBeLessThan(
      runtime.indexOf('singleton.prepareScheduled = true'),
    );
    expect(runtime).toContain('ACCOUNT_PROVIDER_RESTORE_WAIT_MS = 5000');
    expect(runtime).toContain('HOST_DISCONNECT_CONFIRM_MS = 700');
    expect(runtime).toContain('getStoredWalletSession,');
    expect(runtime).toContain('ACCOUNT_RESTORE_VISIBLE_TIMEOUT_MS = 3500');
    expect(runtime).toContain('ACCOUNT_RESTORE_POLL_MS = 50');
    expect(runtime).toContain('ACCOUNT_RESTORE_REOPEN_SETTLE_MS = 120');
    expect(runtime).toContain('window.requestIdleCallback(prepare, { timeout: RUNTIME_PREPARE_IDLE_TIMEOUT_MS })');
    expect(runtime).toContain('const ready = ensureRuntimeReady()');
    expect(runtime).toContain('setHostSingleton((prev) => prev || ready)');
    expect(runtime).toContain("lastDoneReason: 'runtime_prepared'");
    expect(runtime).toContain('function WalletRuntimeHost({ singleton, request, finish })');
    expect(runtime).toContain('<RuntimeAccountProbe />');
    expect(runtime).toContain('reconnectOnMount={hasStoredWalletIdentity()}');
    expect(runtime).toContain("accountRestoreSource: 'persistent_wagmi_provider'");
    expect(runtime).toContain("lastDoneReason: 'account_restore_wait_provider'");
    expect(runtime).toContain('{request ? (');
    expect(runtime).not.toContain("from 'wagmi/actions'");
    expect(runtime).not.toContain('ensureStoredConnectorRestore');
    expect(runtime).not.toContain('reconnectOnMount={false}');
    expect(runtime).not.toContain('const hadConnectedRef');
    expect(runtime).not.toContain("lastDoneReason: 'disconnect_logout'");
    expect(runtime).not.toContain("finish('disconnect_logout')");
    expect(accountProbe).toContain('const wasConnectedRef = useRef(false)');
    expect(accountProbe).toContain('const disconnectConfirmTimerRef = useRef(0)');
    expect(accountProbe).toContain("lastDoneReason: 'wallet_disconnect_pending'");
    expect(accountProbe).toContain("lastDoneReason: 'confirmed_wallet_disconnect'");
    expect(accountProbe).toContain('await logoutStoredWalletSession()');
    expect(accountProbe).toContain("latestStatus !== 'disconnected'");
    expect(runtime).toContain("window.addEventListener('ql7:wallet-runtime:logout', onLogout)");
    expect(runtime).toContain('await logoutStoredWalletSession()');
    expect(runtime).toContain('const QL7_AUTH_LOGOUT_REASONS = new Set([');
    expect(runtime).toContain('if (!isQl7AuthLogoutEvent(event))');
    expect(runtime).toContain("lastDoneReason: 'external_auth_logout_ignored'");
    expect(runtime).not.toContain("view: 'Account'");
    expect(runtime).not.toContain('ACCOUNT_VIEW_RESTORE_DELAY_MS');
    expect(runtime).toContain('status: accountStatus');
    expect(runtime).toContain("lastDoneReason: 'account_restore_hidden_open'");
    expect(runtime).toContain("lastDoneReason: 'account_restore_hydrated_hidden'");
    expect(runtime).toContain("lastDoneReason: 'account_restore_reopen'");
    expect(runtime).toContain("lastDoneReason: 'account_restored'");
    expect(runtime).toContain("lastDoneReason: 'account_restore_unavailable'");
    expect(runtime).toContain('setWalletRestoreHidden(true)');
    expect(runtime).toContain('setWalletRestoreHidden(false)');
    expect(runtime).toContain('accountRestoreReopeningRef.current = true');
    expect(runtime).not.toContain('ACCOUNT_RESTORE_BOOTSTRAP_MS');
    expect(runtime).not.toContain('ACCOUNT_RESTORE_TIMEOUT_MS');
    expect(prepareEffect).not.toContain('setRequest(');
    expect(prepareEffect).not.toContain('open(');
    expect(prepareEffect).toContain('setHostSingleton((prev) => prev || ready)');

    const authNav = fs.readFileSync(path.join(process.cwd(), 'components/AuthNavClient.jsx'), 'utf8');
    expect(authNav).toContain('function isWalletRuntimeInteractionActive()');
    expect(authNav).toContain('if (isWalletRuntimeInteractionActive()) return');
    expect(authNav).toContain('status?.runtimeActive');
    expect(authNav).toContain('status?.accountRestorePending');
  });

});
