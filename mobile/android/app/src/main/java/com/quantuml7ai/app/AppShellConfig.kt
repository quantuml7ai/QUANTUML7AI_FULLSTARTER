package com.quantuml7ai.app

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

data class AppShellConfig(
    val minAndroidBuild: Int,
    val maintenanceMode: Boolean,
    val forceUpdate: Boolean,
    val softUpdate: Boolean,
    val paymentMode: String,
    val mainUrl: String,
    val allowedDomains: Set<String>,
    val externalPaymentDomains: Set<String>,
    val walletSchemes: Set<String>,
    val remoteKillSwitches: Map<String, Boolean>,
    val supportUrl: String,
    val privacyUrl: String,
    val termsUrl: String
)

object AndroidShellDefaults {
    val allowedDomains = setOf("quantuml7ai.com", "www.quantuml7ai.com")
    val walletSchemes = setOf(
        "wc",
        "metamask",
        "trust",
        "rainbow",
        "cbwallet",
        "phantom",
        "ton",
        "tonkeeper"
    )
    val externalPaymentDomains = setOf(
        "nowpayments.io",
        "www.nowpayments.io",
        "api.nowpayments.io",
        "widget.nowpayments.io"
    )
    private val walletHosts = setOf(
        "walletconnect.com",
        "secure.walletconnect.org",
        "reown.com",
        "metamask.app.link",
        "link.trustwallet.com",
        "go.cb-w.com",
        "rnbwapp.com",
        "phantom.app",
        "tonkeeper.com"
    )

    fun safeDefault() = AppShellConfig(
        minAndroidBuild = 1,
        maintenanceMode = false,
        forceUpdate = false,
        softUpdate = false,
        paymentMode = "review_pending",
        mainUrl = BuildConfig.MAIN_URL,
        allowedDomains = allowedDomains,
        externalPaymentDomains = externalPaymentDomains,
        walletSchemes = walletSchemes,
        remoteKillSwitches = emptyMap(),
        supportUrl = "https://www.quantuml7ai.com/contact",
        privacyUrl = "https://www.quantuml7ai.com/privacy",
        termsUrl = "https://www.quantuml7ai.com/privacy"
    )

    fun isKnownWalletHost(host: String?): Boolean {
        val normalized = host?.lowercase(Locale.US) ?: return false
        return walletHosts.any { normalized == it || normalized.endsWith(".$it") }
    }
}

class UrlPolicy(initialConfig: AppShellConfig = AndroidShellDefaults.safeDefault()) {
    @Volatile
    private var config = initialConfig

    fun update(next: AppShellConfig) {
        config = next
    }

    fun current(): AppShellConfig = config

    fun isTrustedWebUrl(url: String?): Boolean {
        val uri = parse(url) ?: return false
        return uri.scheme.equals("https", ignoreCase = true) && isTrustedHost(uri.host)
    }

    fun isTrustedRootUrl(url: String?): Boolean {
        val uri = parse(url) ?: return false
        val path = uri.path.orEmpty()
        return isTrustedWebUrl(url) && (path.isEmpty() || path == "/")
    }

    fun isTrustedHost(host: String?): Boolean {
        val normalized = host?.lowercase(Locale.US) ?: return false
        return config.allowedDomains.any { normalized == it.lowercase(Locale.US) }
    }

    fun isAppReturnUrl(url: String?): Boolean {
        val uri = parse(url) ?: return false
        val scheme = uri.scheme?.lowercase(Locale.US)
        val host = uri.host?.lowercase(Locale.US)
        return scheme == APP_RETURN_SCHEME && host in APP_RETURN_HOSTS
    }

    fun isExternalOAuthUrl(url: String?): Boolean {
        val uri = parse(url) ?: return false
        if (!uri.scheme.equals("https", ignoreCase = true)) return false
        val host = uri.host?.lowercase(Locale.US) ?: return false
        return EXTERNAL_OAUTH_HOSTS.any { host == it || host.endsWith(".$it") }
    }

    fun shouldOpenExternal(url: String?): Boolean {
        val uri = parse(url) ?: return false
        if (isBlockedByKillSwitch(uri)) return false
        val scheme = uri.scheme?.lowercase(Locale.US)
        if (scheme != null && scheme != "http" && scheme != "https") {
            return scheme in config.walletSchemes
        }
        val host = uri.host?.lowercase(Locale.US)
        return (host != null && host in config.externalPaymentDomains) || AndroidShellDefaults.isKnownWalletHost(host)
    }

    fun isBlockedByKillSwitch(url: String?): Boolean {
        val uri = parse(url) ?: return false
        return isBlockedByKillSwitch(uri)
    }

    fun isNativeBridgeEnabled(): Boolean = config.remoteKillSwitches["nativeBridge"] != true

    fun isHttpUrl(url: String?): Boolean {
        val scheme = parse(url)?.scheme?.lowercase(Locale.US)
        return scheme == "http" || scheme == "https"
    }

    private fun isBlockedByKillSwitch(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase(Locale.US)
        val host = uri.host?.lowercase(Locale.US)
        if (config.remoteKillSwitches["walletLinks"] == true) {
            if ((scheme != null && scheme in config.walletSchemes) || AndroidShellDefaults.isKnownWalletHost(host)) {
                return true
            }
        }
        if (config.remoteKillSwitches["paymentLinks"] == true && host != null && host in config.externalPaymentDomains) {
            return true
        }
        if (config.remoteKillSwitches["androidWebView"] == true && isTrustedHost(host)) return true
        return false
    }

    private fun parse(url: String?): Uri? = try {
        if (url.isNullOrBlank()) null else Uri.parse(url)
    } catch (_: Throwable) {
        null
    }

    private companion object {
        const val APP_RETURN_SCHEME = "quantuml7ai"
        val APP_RETURN_HOSTS = setOf("wc", "auth")
        val EXTERNAL_OAUTH_HOSTS = setOf("accounts.google.com")
    }
}

class AppShellConfigRepository(private val context: Context) {
    private val prefs = context.getSharedPreferences("quantum_app_shell_config", Context.MODE_PRIVATE)

    fun cachedOrDefault(): AppShellConfig {
        val raw = prefs.getString(KEY_CONFIG, null) ?: return AndroidShellDefaults.safeDefault()
        return parse(raw) ?: AndroidShellDefaults.safeDefault()
    }

    fun refreshAsync(onResult: (AppShellConfig) -> Unit) {
        Thread {
            val next = fetch() ?: cachedOrDefault()
            onResult(next)
        }.start()
    }

    private fun fetch(): AppShellConfig? {
        var connection: HttpURLConnection? = null
        return try {
            connection = URL(BuildConfig.CONFIG_URL).openConnection() as HttpURLConnection
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            connection.requestMethod = "GET"
            connection.setRequestProperty("Accept", "application/json")
            if (connection.responseCode !in 200..299) return null
            val raw = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            prefs.edit().putString(KEY_CONFIG, raw).apply()
            parse(raw)
        } catch (_: Throwable) {
            null
        } finally {
            connection?.disconnect()
        }
    }

    private fun parse(raw: String): AppShellConfig? = try {
        val root = JSONObject(raw)
        val shell = root.optJSONObject("appShell") ?: root
        val fallback = AndroidShellDefaults.safeDefault()
        AppShellConfig(
            minAndroidBuild = shell.optInt("minAndroidBuild", fallback.minAndroidBuild),
            maintenanceMode = shell.optBoolean("maintenanceMode", fallback.maintenanceMode),
            forceUpdate = shell.optBoolean("forceUpdate", fallback.forceUpdate),
            softUpdate = shell.optBoolean("softUpdate", fallback.softUpdate),
            paymentMode = shell.optString("paymentMode", fallback.paymentMode),
            mainUrl = shell.optString("mainUrl", fallback.mainUrl),
            allowedDomains = readStringSet(shell.optJSONArray("allowedDomains"), fallback.allowedDomains),
            externalPaymentDomains = readStringSet(
                shell.optJSONArray("externalPaymentDomains"),
                fallback.externalPaymentDomains
            ),
            walletSchemes = readStringSet(shell.optJSONArray("walletSchemes"), fallback.walletSchemes),
            remoteKillSwitches = readBooleanMap(shell.optJSONObject("remoteKillSwitches")),
            supportUrl = shell.optString("supportUrl", fallback.supportUrl),
            privacyUrl = shell.optString("privacyUrl", fallback.privacyUrl),
            termsUrl = shell.optString("termsUrl", fallback.termsUrl)
        )
    } catch (_: Throwable) {
        null
    }

    private fun readStringSet(array: JSONArray?, fallback: Set<String>): Set<String> {
        if (array == null) return fallback
        val result = linkedSetOf<String>()
        for (i in 0 until array.length()) {
            val value = array.optString(i).trim().lowercase(Locale.US)
            if (value.isNotEmpty()) result.add(value)
        }
        return if (result.isEmpty()) fallback else result
    }

    private fun readBooleanMap(obj: JSONObject?): Map<String, Boolean> {
        if (obj == null) return emptyMap()
        val result = linkedMapOf<String, Boolean>()
        val keys = obj.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            result[key] = obj.optBoolean(key, false)
        }
        return result
    }

    private companion object {
        const val KEY_CONFIG = "last_valid_config"
    }
}
