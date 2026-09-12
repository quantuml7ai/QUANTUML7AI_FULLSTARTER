# LDPlayer Debug Testing

Этот чеклист нужен, чтобы собрать debug APK Android Shell и быстро поставить его
в LDPlayer. Он не меняет Web Core и не требует release-keystore.

## 1. Проверить окружение

```powershell
cd mobile/android
.\tools\android-doctor.ps1
```

Нужно, чтобы были доступны:

- JDK 17+;
- Android SDK;
- Gradle или Gradle Wrapper;
- `adb` из Android SDK Platform Tools или из папки LDPlayer.

Если Android Studio установлена, самый простой путь: открыть `mobile/android`
как Android-проект и дать Studio синхронизировать Gradle.

## 2. Собрать debug APK

Через helper:

```powershell
cd mobile/android
.\tools\build-debug-apk.ps1
```

Или напрямую:

```powershell
cd mobile/android
gradle :app:assembleDebug
```

Если добавлен Gradle Wrapper:

```powershell
cd mobile/android
.\gradlew.bat :app:assembleDebug
```

Ожидаемый APK:

```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Debug APK подписывается стандартным debug-сертификатом Android и подходит для
LDPlayer / emulator testing.

## 3. Установить в LDPlayer

Запустить LDPlayer, затем:

```powershell
cd mobile/android
.\tools\install-ldplayer.ps1
```

Если `adb` не найден, передать путь:

```powershell
.\tools\install-ldplayer.ps1 -AdbPath "C:\Users\YOUR_USER\AppData\Local\Android\Sdk\platform-tools\adb.exe"
```

Для LDPlayer также может использоваться `adb.exe` из папки самого LDPlayer.

## 4. Что проверить внутри LDPlayer

1. Приложение открывает `https://www.quantuml7ai.com`.
2. Нет белого flash на cold start.
3. Back идёт по WebView history.
4. Forum, Quantum Wallet, MetaMarket, Messenger и Academy открываются.
5. Авторизация не теряется после background / foreground.
6. Media picker открывается и корректно отменяется.
7. Unknown domain не загружается внутри WebView.
8. Wallet/payment links уходят во внешний intent.
9. Offline state появляется без падения приложения.

## 5. Если APK не собирается

- Проверить `local.properties` или `ANDROID_HOME`.
- Установить Android SDK Platform 35 и Build Tools через Android Studio.
- Проверить JDK 17+.
- Если нет Gradle, открыть проект в Android Studio или создать wrapper по
  инструкции `GRADLE_WRAPPER.md`.
