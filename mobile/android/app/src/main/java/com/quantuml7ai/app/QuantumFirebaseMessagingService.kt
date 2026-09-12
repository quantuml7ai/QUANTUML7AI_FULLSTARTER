package com.quantuml7ai.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class QuantumFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        NativePushRegistrar.refresh(applicationContext, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val source = data["source"].orEmpty().ifBlank { "system" }
        val isSync = data["action"] == "sync"
        if (isSync && data["count"] == "0") {
            notificationManager().cancel(source, notificationId(source))
            return
        }

        val count = data["count"]?.toIntOrNull()?.coerceAtLeast(0) ?: 0
        val channelId = "ql7_$source"
        ensureChannel(channelId, data["title"].orEmpty().ifBlank { getString(R.string.app_name) })
        val route = data["url"].orEmpty().takeIf { it.startsWith("/") } ?: "/"
        val destination = Uri.parse("${BuildConfig.MAIN_URL}$route")
        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId(source),
            Intent(this, QuantumLauncherActivity::class.java)
                .setData(destination)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(data["title"].orEmpty().ifBlank { getString(R.string.app_name) })
            .setContentText(data["body"].orEmpty())
            .setStyle(NotificationCompat.BigTextStyle().bigText(data["body"].orEmpty()))
            .setContentIntent(pendingIntent)
            // Уведомление живет до фактического прочтения контента, а не только до нажатия.
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setSilent(isSync)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(if (source == "messenger_replies") NotificationCompat.PRIORITY_DEFAULT else NotificationCompat.PRIORITY_HIGH)
            .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
            // Каждый источник хранит собственное число; совместимые лаунчеры сами складывают активные ветки.
            .setNumber(count)
            .build()
        notificationManager().notify(source, notificationId(source), notification)
    }

    private fun ensureChannel(id: String, title: String) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = notificationManager()
        if (manager.getNotificationChannel(id) != null) return
        manager.createNotificationChannel(
            NotificationChannel(id, title, NotificationManager.IMPORTANCE_HIGH).apply {
                enableLights(true)
                lightColor = Color.CYAN
                enableVibration(true)
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PRIVATE
            },
        )
    }

    private fun notificationManager(): NotificationManager = getSystemService(NotificationManager::class.java)

    private fun notificationId(source: String): Int = 31_000 + (source.hashCode() and 0x0fff)
}
