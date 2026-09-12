package com.quantuml7ai.app

import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import org.json.JSONObject

class NativeBridge(
    private val activity: MainActivity,
    private val urlPolicy: UrlPolicy
) {
    @JavascriptInterface
    fun getAppInfo(): String {
        if (!urlPolicy.isNativeBridgeEnabled()) return "{}"
        return JSONObject()
            .put("platform", "android")
            .put("appVersion", BuildConfig.VERSION_NAME)
            .put("buildNumber", BuildConfig.VERSION_CODE)
            .put("shellVersion", BuildConfig.SHELL_VERSION)
            .put("environment", BuildConfig.ENVIRONMENT)
            .put("webViewEngineVersion", Build.VERSION.RELEASE)
            .toString()
    }

    @JavascriptInterface
    fun nativeShare(text: String?, title: String?) {
        if (!urlPolicy.isNativeBridgeEnabled()) return
        if (!activity.isCurrentPageTrusted()) return
        val payload = text?.take(MAX_BRIDGE_TEXT) ?: return
        activity.runOnUiThread {
            val intent = Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, payload)
            activity.startActivity(Intent.createChooser(intent, title ?: activity.getString(R.string.app_name)))
        }
    }

    @JavascriptInterface
    fun haptic() {
        if (!urlPolicy.isNativeBridgeEnabled()) return
        if (!activity.isCurrentPageTrusted()) return
        activity.runOnUiThread {
            val vibrator = activity.getSystemService(Vibrator::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(24, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(24)
            }
        }
    }

    @JavascriptInterface
    fun openExternal(url: String?) {
        if (!urlPolicy.isNativeBridgeEnabled()) return
        if (!activity.isCurrentPageTrusted()) return
        if (urlPolicy.isBlockedByKillSwitch(url)) return
        if (urlPolicy.shouldOpenExternal(url) || urlPolicy.isHttpUrl(url)) {
            activity.runOnUiThread { activity.openExternalUrl(url) }
        }
    }

    @JavascriptInterface
    fun getSafeAreaInsets(): String {
        if (!urlPolicy.isNativeBridgeEnabled()) return "{}"
        return JSONObject()
            .put("top", 0)
            .put("right", 0)
            .put("bottom", 0)
            .put("left", 0)
            .toString()
    }

    private companion object {
        const val MAX_BRIDGE_TEXT = 4096
    }
}
