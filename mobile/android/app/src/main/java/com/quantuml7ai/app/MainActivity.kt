package com.quantuml7ai.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.provider.MediaStore
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File

class MainActivity : ComponentActivity() {
    private lateinit var rootView: FrameLayout
    private lateinit var webView: WebView
    private lateinit var offlineLayer: View
    private lateinit var offlineTitle: TextView
    private lateinit var offlineBody: TextView
    private lateinit var retryButton: Button

    private val configRepository by lazy { AppShellConfigRepository(this) }
    private val urlPolicy = UrlPolicy()

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val pendingCaptureUris = mutableListOf<Uri>()
    private var pendingPermissionRequest: PermissionRequest? = null
    private var pendingPermissionResources: Array<String> = emptyArray()
    private var pendingGeolocationOrigin: String? = null
    private var pendingGeolocationCallback: GeolocationPermissions.Callback? = null
    private var pendingMobileReturnUrl: String? = null
    private var popupWebView: WebView? = null
    private var didPause = false

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback ?: return@registerForActivityResult
        val captureUris = pendingCaptureUris.toList()
        pendingCaptureUris.clear()
        val uris = if (result.resultCode == Activity.RESULT_OK) {
            WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
                ?: captureUris.firstOrNull { uri -> runCatching { contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length > 0 } == true }.getOrDefault(false) }
                    ?.let { arrayOf(it) }
        } else {
            null
        }
        callback.onReceiveValue(uris)
        filePathCallback = null
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val request = pendingPermissionRequest
        if (request != null) {
            val resources = pendingPermissionResources
            pendingPermissionRequest = null
            pendingPermissionResources = emptyArray()
            if (grants.values.all { it }) {
                request.grant(resources)
            } else {
                request.deny()
            }
            return@registerForActivityResult
        }

        val geolocationOrigin = pendingGeolocationOrigin
        val geolocationCallback = pendingGeolocationCallback
        if (geolocationOrigin != null && geolocationCallback != null) {
            val allowed = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            pendingGeolocationOrigin = null
            pendingGeolocationCallback = null
            geolocationCallback.invoke(geolocationOrigin, allowed, false)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#020812")
        window.navigationBarColor = Color.parseColor("#020812")

        urlPolicy.update(configRepository.cachedOrDefault())
        buildLayout()
        configureWebView()
        configureBack()
        refreshRemoteConfig()

        val incomingUrl = intent?.dataString
        if (urlPolicy.isAppReturnUrl(incomingUrl) || urlPolicy.isTrustedWebUrl(incomingUrl)) {
            pendingMobileReturnUrl = incomingUrl
        }
        val initialUrl = incomingUrl?.takeIf { urlPolicy.isTrustedWebUrl(it) } ?: BuildConfig.MAIN_URL
        webView.loadUrl(initialUrl)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val url = intent.dataString
        when {
            urlPolicy.isTrustedWebUrl(url) -> {
                hideShellState()
                if (isCurrentPageTrusted() && urlPolicy.isTrustedRootUrl(url)) {
                    notifyWebResume(url!!)
                } else {
                    pendingMobileReturnUrl = url
                    webView.loadUrl(url!!)
                }
            }
            urlPolicy.isAppReturnUrl(url) -> {
                hideShellState()
                if (isCurrentPageTrusted()) {
                    notifyWebResume(url!!)
                } else {
                    pendingMobileReturnUrl = url
                    webView.loadUrl(BuildConfig.MAIN_URL)
                }
            }
            !url.isNullOrBlank() -> openExternalUrl(url)
        }
    }

    override fun onResume() {
        super.onResume()
        if (didPause && ::webView.isInitialized && isCurrentPageTrusted()) {
            notifyWebResume("quantuml7ai://auth/lifecycle-resume")
        }
        didPause = false
    }

    override fun onPause() {
        didPause = true
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onStop() {
        CookieManager.getInstance().flush()
        super.onStop()
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        filePathCallback = null
        pendingCaptureUris.clear()
        pendingPermissionRequest?.deny()
        pendingPermissionRequest = null
        pendingPermissionResources = emptyArray()
        pendingGeolocationCallback?.invoke(pendingGeolocationOrigin ?: "", false, false)
        pendingGeolocationOrigin = null
        pendingGeolocationCallback = null
        closePopupWebView(notifyMain = false)
        CookieManager.getInstance().flush()
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("QuantumL7Android")
            webView.destroy()
        }
        super.onDestroy()
    }

    fun isCurrentPageTrusted(): Boolean = urlPolicy.isTrustedWebUrl(webView.url)

    fun openExternalUrl(url: String?) {
        val uri = try {
            Uri.parse(url)
        } catch (_: Throwable) {
            null
        } ?: return

        try {
            val intent = Intent(Intent.ACTION_VIEW, uri)
                .addCategory(Intent.CATEGORY_BROWSABLE)
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, getString(R.string.blocked_url), Toast.LENGTH_SHORT).show()
        }
    }

    private fun buildLayout() {
        rootView = FrameLayout(this)
        rootView.setBackgroundColor(Color.parseColor("#020812"))

        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#020812"))
        rootView.addView(webView, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

        offlineLayer = buildShellStateView()
        offlineLayer.visibility = View.GONE
        rootView.addView(offlineLayer, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

        setContentView(rootView)
    }

    private fun buildShellStateView(): View {
        val container = FrameLayout(this)
        container.setBackgroundColor(Color.parseColor("#020812"))

        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(24), dp(28), dp(24), dp(28))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#0B2032"), Color.parseColor("#06111F"))
            ).apply {
                cornerRadius = dp(26).toFloat()
                setStroke(dp(1), Color.parseColor("#4FEAFF"))
            }
        }

        offlineTitle = TextView(this).apply {
            text = getString(R.string.offline_title)
            setTextColor(Color.WHITE)
            textSize = 22f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }

        offlineBody = TextView(this).apply {
            text = getString(R.string.offline_body)
            setTextColor(Color.parseColor("#D7ECFF"))
            textSize = 15f
            gravity = Gravity.CENTER
            setPadding(0, dp(14), 0, dp(18))
        }

        retryButton = Button(this).apply {
            text = getString(R.string.retry)
            setTextColor(Color.WHITE)
            background = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(Color.parseColor("#123E50"), Color.parseColor("#30224D"))
            ).apply {
                cornerRadius = dp(999).toFloat()
                setStroke(dp(1), Color.parseColor("#FFD45A"))
            }
            setOnClickListener {
                hideShellState()
                webView.reload()
            }
        }

        panel.addView(offlineTitle, LinearLayout.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        panel.addView(offlineBody, LinearLayout.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        panel.addView(retryButton, LinearLayout.LayoutParams(dp(180), dp(48)))

        val lp = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        ).apply {
            leftMargin = dp(22)
            rightMargin = dp(22)
        }
        container.addView(panel, lp)
        return container
    }

    private fun configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        CookieManager.getInstance().setAcceptCookie(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = true
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            safeBrowsingEnabled = true
            setGeolocationEnabled(true)
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            userAgentString = "$userAgentString QuantumL7AIApp/${BuildConfig.SHELL_VERSION} Android build/${BuildConfig.VERSION_CODE}"
        }

        webView.addJavascriptInterface(NativeBridge(this, urlPolicy), "QuantumL7Android")
        webView.webViewClient = quantumWebViewClient()
        webView.webChromeClient = quantumWebChromeClient()
    }

    private fun quantumWebViewClient() = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (!request.isForMainFrame) return false
            val target = request.url.toString()
            return when {
                urlPolicy.isBlockedByKillSwitch(target) -> {
                    Toast.makeText(this@MainActivity, getString(R.string.blocked_url), Toast.LENGTH_SHORT).show()
                    true
                }
                urlPolicy.isTrustedWebUrl(target) -> false
                urlPolicy.shouldOpenExternal(target) || urlPolicy.isHttpUrl(target) -> {
                    openExternalUrl(target)
                    true
                }
                else -> {
                    Toast.makeText(this@MainActivity, getString(R.string.blocked_url), Toast.LENGTH_SHORT).show()
                    true
                }
            }
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (urlPolicy.isTrustedWebUrl(url)) {
                hideShellState()
                pendingMobileReturnUrl?.let {
                    pendingMobileReturnUrl = null
                    notifyWebResume(it)
                }
            }
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            if (request.isForMainFrame) showOffline()
        }

        override fun onReceivedHttpError(
            view: WebView,
            request: WebResourceRequest,
            errorResponse: WebResourceResponse
        ) {
            if (request.isForMainFrame && errorResponse.statusCode >= 500) showOffline()
        }

        override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
            handler.cancel()
            showOffline()
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            recreateWebViewAfterRendererLoss()
            showOffline()
            return true
        }
    }

    private fun quantumWebChromeClient() = object : WebChromeClient() {
        override fun onCreateWindow(
            view: WebView,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message
        ): Boolean {
            if (!isUserGesture || !isCurrentPageTrusted()) return false
            val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
            closePopupWebView(notifyMain = false)

            val popup = createAuthPopupWebView()
            popupWebView = popup
            rootView.addView(
                popup,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )
            transport.webView = popup
            resultMsg.sendToTarget()
            return true
        }

        override fun onCloseWindow(window: WebView) {
            closePopupWebView(window)
        }

        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<Uri>>,
            fileChooserParams: FileChooserParams
        ): Boolean {
            this@MainActivity.filePathCallback?.onReceiveValue(null)
            this@MainActivity.filePathCallback = filePathCallback
            return try {
                filePickerLauncher.launch(buildFileChooserIntent(fileChooserParams))
                true
            } catch (_: Throwable) {
                this@MainActivity.filePathCallback = null
                pendingCaptureUris.clear()
                filePathCallback.onReceiveValue(null)
                false
            }
        }

        override fun onPermissionRequest(request: PermissionRequest) {
            if (!urlPolicy.isTrustedHost(request.origin.host)) {
                request.deny()
                return
            }
            val mediaResources = request.resources.filter { resource ->
                resource == PermissionRequest.RESOURCE_VIDEO_CAPTURE ||
                    resource == PermissionRequest.RESOURCE_AUDIO_CAPTURE
            }.toTypedArray()

            val permissions = mediaResources.mapNotNull { resource ->
                when (resource) {
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
                    PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
                    else -> null
                }
            }.distinct()

            if (permissions.isEmpty()) {
                request.deny()
                return
            }

            val missing = permissions.filter {
                ContextCompat.checkSelfPermission(this@MainActivity, it) != PackageManager.PERMISSION_GRANTED
            }
            if (missing.isEmpty()) {
                request.grant(mediaResources)
            } else {
                pendingPermissionRequest?.takeIf { it !== request }?.deny()
                pendingPermissionRequest = request
                pendingPermissionResources = mediaResources
                permissionLauncher.launch(missing.toTypedArray())
            }
        }

        override fun onGeolocationPermissionsShowPrompt(
            origin: String,
            callback: GeolocationPermissions.Callback
        ) {
            val host = runCatching { Uri.parse(origin).host }.getOrNull()
            if (!urlPolicy.isTrustedHost(host)) {
                callback.invoke(origin, false, false)
                return
            }

            val permissions = arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
            val missing = permissions.filter {
                ContextCompat.checkSelfPermission(this@MainActivity, it) != PackageManager.PERMISSION_GRANTED
            }

            if (missing.isEmpty()) {
                callback.invoke(origin, true, false)
            } else {
                pendingGeolocationCallback
                    ?.takeIf { it !== callback }
                    ?.invoke(pendingGeolocationOrigin ?: "", false, false)
                pendingGeolocationOrigin = origin
                pendingGeolocationCallback = callback
                permissionLauncher.launch(missing.toTypedArray())
            }
        }

        override fun onGeolocationPermissionsHidePrompt() {
            pendingGeolocationOrigin = null
            pendingGeolocationCallback = null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createAuthPopupWebView(): WebView {
        return WebView(this).apply {
            setBackgroundColor(Color.parseColor("#020812"))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                allowFileAccessFromFileURLs = false
                allowUniversalAccessFromFileURLs = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                safeBrowsingEnabled = true
                setSupportMultipleWindows(false)
                javaScriptCanOpenWindowsAutomatically = false
                userAgentString = webView.settings.userAgentString
            }
            CookieManager.getInstance().setAcceptCookie(true)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            }
            webViewClient = authPopupWebViewClient()
            webChromeClient = object : WebChromeClient() {
                override fun onCloseWindow(window: WebView) {
                    closePopupWebView(window)
                }
            }
        }
    }

    private fun authPopupWebViewClient() = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (!request.isForMainFrame) return false
            val target = request.url.toString()
            return when {
                urlPolicy.isBlockedByKillSwitch(target) -> {
                    Toast.makeText(this@MainActivity, getString(R.string.blocked_url), Toast.LENGTH_SHORT).show()
                    true
                }
                urlPolicy.isAppReturnUrl(target) -> {
                    closePopupWebView(view)
                    notifyWebResume(target)
                    true
                }
                urlPolicy.isExternalOAuthUrl(target) -> {
                    openExternalUrl(target)
                    true
                }
                urlPolicy.isHttpUrl(target) -> false
                urlPolicy.shouldOpenExternal(target) -> {
                    openExternalUrl(target)
                    true
                }
                else -> {
                    Toast.makeText(this@MainActivity, getString(R.string.blocked_url), Toast.LENGTH_SHORT).show()
                    true
                }
            }
        }

        override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
            handler.cancel()
            closePopupWebView(view)
        }
    }

    private fun closePopupWebView(window: WebView? = popupWebView, notifyMain: Boolean = true) {
        val popup = popupWebView ?: return
        if (window != null && window !== popup) return
        popupWebView = null
        runCatching {
            rootView.removeView(popup)
            popup.stopLoading()
            popup.destroy()
        }
        CookieManager.getInstance().flush()
        if (notifyMain && ::webView.isInitialized && isCurrentPageTrusted()) {
            notifyWebResume("quantuml7ai://auth/popup-closed")
        }
    }

    private fun buildFileChooserIntent(fileChooserParams: WebChromeClient.FileChooserParams): Intent {
        val baseIntent = fileChooserParams.createIntent()
        val captureIntents = buildCaptureIntents(fileChooserParams)

        if (captureIntents.isEmpty()) return baseIntent

        return Intent.createChooser(baseIntent, getString(R.string.app_name)).apply {
            putExtra(Intent.EXTRA_INITIAL_INTENTS, captureIntents.toTypedArray())
        }
    }

    private fun buildCaptureIntents(fileChooserParams: WebChromeClient.FileChooserParams): List<Intent> {
        val acceptTypes = fileChooserParams.acceptTypes
            .filter { it.isNotBlank() }
            .map { it.lowercase() }
        val captureEnabled = fileChooserParams.isCaptureEnabled
        val wantsImage = acceptTypes.isEmpty() || acceptTypes.any { it == "*/*" || it.startsWith("image/") }
        val wantsVideo = acceptTypes.isEmpty() || acceptTypes.any { it == "*/*" || it.startsWith("video/") }
        val wantsAudio = acceptTypes.any { it == "*/*" || it.startsWith("audio/") }
        val intents = mutableListOf<Intent>()

        if (wantsImage || captureEnabled) {
            createCaptureIntent(MediaStore.ACTION_IMAGE_CAPTURE, "capture-image", ".jpg")?.let { intents.add(it) }
        }
        if (wantsVideo || captureEnabled) {
            createCaptureIntent(MediaStore.ACTION_VIDEO_CAPTURE, "capture-video", ".mp4")?.let { intents.add(it) }
        }
        if (wantsAudio || captureEnabled) {
            Intent(MediaStore.Audio.Media.RECORD_SOUND_ACTION).takeIf { it.resolveActivity(packageManager) != null }
                ?.let { intents.add(it) }
        }

        return intents
    }

    private fun createCaptureIntent(action: String, prefix: String, suffix: String): Intent? {
        val intent = Intent(action)
        if (intent.resolveActivity(packageManager) == null) return null

        val file = File.createTempFile(prefix, suffix, externalCacheDir ?: cacheDir)
        val uri = FileProvider.getUriForFile(this, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
        pendingCaptureUris.add(uri)

        return intent.apply {
            putExtra(MediaStore.EXTRA_OUTPUT, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        }
    }

    private fun configureBack() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (popupWebView != null) {
                    closePopupWebView()
                    return
                }
                if (offlineLayer.visibility == View.VISIBLE) {
                    hideShellState()
                    return
                }
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun refreshRemoteConfig() {
        configRepository.refreshAsync { config ->
            runOnUiThread {
                urlPolicy.update(config)
                if (config.forceUpdate || BuildConfig.VERSION_CODE < config.minAndroidBuild) {
                    showShellState(
                        title = getString(R.string.force_update_title),
                        body = getString(R.string.force_update_body),
                        canRetry = false
                    )
                } else if (config.maintenanceMode) {
                    showShellState(
                        title = getString(R.string.maintenance_title),
                        body = getString(R.string.maintenance_body),
                        canRetry = true
                    )
                } else if (config.remoteKillSwitches["androidWebView"] == true) {
                    showShellState(
                        title = getString(R.string.maintenance_title),
                        body = getString(R.string.maintenance_body),
                        canRetry = false
                    )
                }
            }
        }
    }

    private fun showOffline() {
        showShellState(
            title = getString(R.string.offline_title),
            body = getString(R.string.offline_body),
            canRetry = true
        )
    }

    private fun showShellState(title: String, body: String, canRetry: Boolean) {
        offlineTitle.text = title
        offlineBody.text = body
        retryButton.visibility = if (canRetry) View.VISIBLE else View.GONE
        offlineLayer.visibility = View.VISIBLE
    }

    private fun hideShellState() {
        offlineLayer.visibility = View.GONE
    }

    private fun recreateWebViewAfterRendererLoss() {
        if (!::rootView.isInitialized) return
        runCatching {
            rootView.removeView(webView)
            webView.destroy()
        }
        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#020812"))
        rootView.addView(
            webView,
            0,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        configureWebView()
        webView.loadUrl(BuildConfig.MAIN_URL)
    }

    private fun notifyWebResume(sourceUrl: String) {
        if (!::webView.isInitialized || !isCurrentPageTrusted()) return
        val source = JSONObject.quote(sourceUrl)
        notifyWebSurfaceResume(webView, source)
        popupWebView?.let { notifyWebSurfaceResume(it, source) }
    }

    private fun notifyWebSurfaceResume(target: WebView, quotedSourceUrl: String) {
        target.post {
            if (!::webView.isInitialized) return@post
            target.evaluateJavascript(
                """
                try {
                  window.__QL7_MOBILE_RETURN_URL__ = $quotedSourceUrl;
                  window.dispatchEvent(new CustomEvent('ql7:mobile-return', { detail: { url: $quotedSourceUrl } }));
                  window.dispatchEvent(new Event('focus'));
                  window.dispatchEvent(new Event('online'));
                  document.dispatchEvent(new Event('visibilitychange'));
                } catch (e) {}
                """.trimIndent(),
                null
            )
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
