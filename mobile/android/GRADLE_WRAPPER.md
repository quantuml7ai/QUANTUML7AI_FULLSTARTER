# Gradle Wrapper Policy

В репозитории сейчас нет `gradlew` и `gradle/wrapper/gradle-wrapper.jar`.
Это сделано осознанно: wrapper jar нельзя создавать вручную или добавлять
непроверенным бинарником.

## Как добавить wrapper правильно

На машине с установленным Gradle:

```powershell
cd mobile/android
gradle wrapper --gradle-version 8.10.2
```

После генерации проверить:

- `gradlew`
- `gradlew.bat`
- `gradle/wrapper/gradle-wrapper.properties`
- `gradle/wrapper/gradle-wrapper.jar`

## Проверка

```powershell
cd mobile/android
./gradlew :app:assembleDebug
./gradlew :app:bundleRelease
```

## Важно

- Не хранить keystore рядом с wrapper.
- Не менять Gradle version без Android Gradle Plugin compatibility check.
- Не подменять wrapper jar файлами из непонятного источника.
