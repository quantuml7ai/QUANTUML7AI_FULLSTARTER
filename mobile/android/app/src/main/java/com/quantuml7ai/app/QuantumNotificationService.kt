package com.quantuml7ai.app

import android.app.Notification
import android.app.NotificationManager
import android.os.Build
import com.google.androidbrowserhelper.trusted.DelegationService

class QuantumNotificationService : DelegationService() {
    override fun onNotifyNotificationWithChannel(
        platformTag: String,
        platformId: Int,
        notification: Notification,
        channelName: String,
    ): Boolean {
        // В каждой ветке хранится свой непрочитанный счётчик, а лаунчер получает общую сумму.
        val sourceCount = notification.extras
            ?.getCharSequence(Notification.EXTRA_TEXT)
            ?.toString()
            ?.trim()
            ?.let { text -> Regex("""\d{1,4}""").findAll(text).lastOrNull()?.value?.toIntOrNull() }
            ?.coerceAtLeast(0)
            ?: 0
        rememberSourceCount(platformTag, sourceCount)

        val badgeAwareNotification = Notification.Builder
            .recoverBuilder(this, notification)
            .setBadgeIconType(Notification.BADGE_ICON_SMALL)
            .setNumber(sourceCount)
            .setOnlyAlertOnce(true)
            .build()

        val delivered = super.onNotifyNotificationWithChannel(
            platformTag,
            platformId,
            badgeAwareNotification,
            channelName,
        )
        if (delivered) {
            enableChannelBadge(badgeAwareNotification)
            refreshActiveBadgeNumbers()
        }
        return delivered
    }

    override fun onCancelNotification(platformTag: String, platformId: Int) {
        super.onCancelNotification(platformTag, platformId)
        val preferences = getSharedPreferences(BADGE_PREFERENCES, MODE_PRIVATE)
        preferences.edit().remove(sourceKey(platformTag)).commit()
        refreshActiveBadgeNumbers()
    }

    private fun rememberSourceCount(platformTag: String, count: Int) {
        val preferences = getSharedPreferences(BADGE_PREFERENCES, MODE_PRIVATE)
        val activeTags = notificationManager().activeNotifications
            .mapNotNull { it.tag }
            .toSet()
        val editor = preferences.edit()
        preferences.all.keys
            .filter { it.startsWith(SOURCE_KEY_PREFIX) }
            .filter { key -> key != sourceKey(platformTag) && key.removePrefix(SOURCE_KEY_PREFIX) !in activeTags }
            .forEach(editor::remove)
        if (count > 0) editor.putInt(sourceKey(platformTag), count)
        else editor.remove(sourceKey(platformTag))
        editor.commit()
    }

    private fun enableChannelBadge(notification: Notification) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = notificationManager()
        val channel = manager.getNotificationChannel(notification.channelId) ?: return
        if (!channel.canShowBadge()) {
            channel.setShowBadge(true)
            manager.createNotificationChannel(channel)
        }
    }

    private fun refreshActiveBadgeNumbers() {
        val manager = notificationManager()
        val preferences = getSharedPreferences(BADGE_PREFERENCES, MODE_PRIVATE)
        manager.activeNotifications.forEach { active ->
            val sourceCount = preferences.getInt(sourceKey(active.tag ?: ""), 0).coerceAtLeast(0)
            val refreshed = Notification.Builder
                .recoverBuilder(this, active.notification)
                .setBadgeIconType(Notification.BADGE_ICON_SMALL)
                .setNumber(sourceCount)
                .setOnlyAlertOnce(true)
                .build()
            manager.notify(active.tag, active.id, refreshed)
        }
    }

    private fun notificationManager(): NotificationManager {
        return getSystemService(NotificationManager::class.java)
    }

    private fun sourceKey(platformTag: String): String = "$SOURCE_KEY_PREFIX$platformTag"

    private companion object {
        const val BADGE_PREFERENCES = "quantum_notification_badges"
        const val SOURCE_KEY_PREFIX = "source:"
    }
}
