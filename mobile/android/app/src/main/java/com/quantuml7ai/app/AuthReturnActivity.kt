package com.quantuml7ai.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class AuthReturnActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleReturn()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleReturn()
    }

    private fun handleReturn() {
        val uri = intent?.data
        if (uri?.scheme.equals("quantuml7ai", ignoreCase = true)) {
            when (uri?.host?.lowercase()) {
                "push-link" -> {
                    val nonce = uri.getQueryParameter("nonce").orEmpty()
                    if (nonce.isNotBlank()) {
                        NativePushRegistrar.claim(applicationContext, nonce) { linked ->
                            openTrustedWebApp(if (linked) "?ql7NativePush=linked" else "?ql7NativePush=retry")
                        }
                        return
                    }
                }
                "push-unlink" -> NativePushRegistrar.unlink(applicationContext)
            }
        }
        openTrustedWebApp()
    }

    private fun openTrustedWebApp(suffix: String = "") {
        startActivity(
            Intent(this, QuantumLauncherActivity::class.java)
                .setData(Uri.parse("${BuildConfig.MAIN_URL}$suffix"))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        )
        finish()
    }
}
