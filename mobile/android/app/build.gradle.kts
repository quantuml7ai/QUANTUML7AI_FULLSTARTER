plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

import java.util.Properties

val rootGoogleServicesConfigured = file("google-services.json").exists()
val releaseGoogleServicesConfigured = file("src/release/google-services.json").exists()
val debugGoogleServicesConfigured = file("src/debug/google-services.json").exists()
val googleServicesConfigured = rootGoogleServicesConfigured ||
    releaseGoogleServicesConfigured ||
    debugGoogleServicesConfigured

if (googleServicesConfigured) {
    apply(plugin = "com.google.gms.google-services")
    afterEvaluate {
        // Один build-type Firebase-конфиг не должен ломать сборку другого build-type.
        if (!rootGoogleServicesConfigured && !debugGoogleServicesConfigured) {
            tasks.matching { it.name == "processDebugGoogleServices" }.configureEach { enabled = false }
        }
        if (!rootGoogleServicesConfigured && !releaseGoogleServicesConfigured) {
            tasks.matching { it.name == "processReleaseGoogleServices" }.configureEach { enabled = false }
        }
    }
}

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use(::load)
    }
}

android {
    namespace = "com.quantuml7ai.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.quantuml7ai.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 107
        versionName = "1.0.7"

        buildConfigField("String", "MAIN_URL", "\"https://www.quantuml7ai.com\"")
        buildConfigField("String", "CONFIG_URL", "\"https://www.quantuml7ai.com/api/app-shell/config\"")
        buildConfigField("String", "SHELL_VERSION", "\"3.0\"")
        buildConfigField("String", "ENVIRONMENT", "\"production\"")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
    implementation(platform("com.google.firebase:firebase-bom:34.14.0"))
    implementation("com.google.firebase:firebase-messaging")
}
