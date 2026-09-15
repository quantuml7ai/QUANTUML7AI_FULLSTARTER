package com.quantuml7ai.app

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import kotlin.concurrent.thread

object NativePushRegistrar {
    private const val PREFERENCES = "quantum_native_push"
    private const val DEVICE_ID = "device_id"
    private const val DEVICE_SECRET = "device_secret"
    private const val PENDING_UNLINK = "pending_unlink"

    fun claim(context: Context, nonce: String, onComplete: (Boolean) -> Unit) {
        if (!firebaseAvailable(context) || nonce.isBlank()) {
            onComplete(false)
            return
        }
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            // Новый подтвержденный link всегда переносит текущий FCM-токен на текущий аккаунт.
            register(context.applicationContext, token, nonce, onComplete = onComplete)
        }.addOnFailureListener { onComplete(false) }
    }

    fun refresh(context: Context, token: String) {
        val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
        val deviceId = preferences.getString(DEVICE_ID, "").orEmpty()
        val secret = preferences.getString(DEVICE_SECRET, "").orEmpty()
        if (deviceId.isBlank() || secret.isBlank()) return
        register(context.applicationContext, token, "", deviceId, secret)
    }

    fun unlink(context: Context) {
        val appContext = context.applicationContext
        val preferences = appContext.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
        val deviceId = preferences.getString(DEVICE_ID, "").orEmpty()
        val secret = preferences.getString(DEVICE_SECRET, "").orEmpty()
        if (deviceId.isBlank() || secret.isBlank()) {
            preferences.edit().clear().apply()
            return
        }
        preferences.edit().putBoolean(PENDING_UNLINK, true).apply()
        thread(name = "ql7-fcm-unlink") {
            val payload = JSONObject().put("deviceId", deviceId).put("secret", secret)
            val result = postJson("${BuildConfig.MAIN_URL}/api/push/native/unlink", payload)
            if (result?.optBoolean("ok") == true || result?.optString("error") == "invalid_native_push_device") {
                preferences.edit().clear().apply()
            }
        }
    }

    fun retryPendingUnlink(context: Context) {
        val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
        if (preferences.getBoolean(PENDING_UNLINK, false)) unlink(context)
    }

    private fun firebaseAvailable(context: Context): Boolean {
        return runCatching {
            FirebaseApp.getApps(context).isNotEmpty() || FirebaseApp.initializeApp(context) != null
        }.getOrDefault(false)
    }

    private fun register(
        context: Context,
        token: String,
        nonce: String,
        deviceId: String = "",
        secret: String = "",
        onComplete: ((Boolean) -> Unit)? = null,
    ) {
        if (token.isBlank()) {
            onComplete?.invoke(false)
            return
        }
        thread(name = "ql7-fcm-register") {
            val success = runCatching {
                val payload = JSONObject()
                    .put("token", token)
                    .put("appVersion", BuildConfig.VERSION_NAME)
                    .put("model", "${Build.MANUFACTURER} ${Build.MODEL}".trim())
                if (deviceId.isNotBlank() && secret.isNotBlank()) {
                    payload.put("deviceId", deviceId).put("secret", secret)
                } else {
                    payload.put("nonce", nonce)
                }
                val result = postJson("${BuildConfig.MAIN_URL}/api/push/native/register", payload)
                if (result?.optBoolean("ok") == true && result.optString("deviceId").isNotBlank()) {
                    context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                        .edit()
                        .putString(DEVICE_ID, result.optString("deviceId"))
                        .putString(DEVICE_SECRET, result.optString("secret"))
                        .putBoolean(PENDING_UNLINK, false)
                        .apply()
                }
                result?.optBoolean("ok") == true
            }.getOrDefault(false)
            if (onComplete != null) {
                Handler(Looper.getMainLooper()).post { onComplete(success) }
            }
        }
    }

    private fun postJson(endpoint: String, payload: JSONObject): JSONObject? {
        return runCatching {
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 12_000
            connection.readTimeout = 12_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use {
                it.write(payload.toString().toByteArray(StandardCharsets.UTF_8))
            }
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            connection.disconnect()
            JSONObject(body)
        }.getOrNull()
    }
}
