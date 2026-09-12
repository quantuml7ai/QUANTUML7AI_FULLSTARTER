package com.quantuml7ai.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import com.google.androidbrowserhelper.trusted.LauncherActivity

class QuantumLauncherActivity : LauncherActivity() {
    private var notificationPermissionRequestedThisSession = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Если logout произошёл без сети, повторяем защищённую отвязку при следующем запуске.
        NativePushRegistrar.retryPendingUnlink(applicationContext)
        requestNotificationPermission()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        if (notificationPermissionRequestedThisSession) return
        // После нового запуска снова проверяем отозванное разрешение. Android сам не покажет
        // системный диалог повторно, если пользователь запретил его навсегда.
        notificationPermissionRequestedThisSession = true
        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_REQUEST)
    }

    private companion object {
        const val NOTIFICATION_PERMISSION_REQUEST = 107
    }
}
