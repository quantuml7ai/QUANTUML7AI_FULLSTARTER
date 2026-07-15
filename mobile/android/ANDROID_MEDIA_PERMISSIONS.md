# Android Media And Device Permissions

Android shell поддерживает только те системные разрешения, которые нужны Web Core проекта Quantum L7 AI: медиа-загрузка, камера, микрофон и геолокация. Бизнес-логика форума, профилей, QCoin, MetaMarket, Q-Cast и других модулей остаётся внутри web-приложения.

## Разрешения

- `CAMERA` - фото, видео, аватары, медиа-публикации, Q-Cast и будущие WebRTC-сценарии.
- `RECORD_AUDIO` - голосовые функции, Q-Cast, запись медиа и будущие WebRTC-сценарии.
- `MODIFY_AUDIO_SETTINGS` - системная настройка аудиомаршрута для более стабильной записи WebRTC/MediaRecorder в WebView и эмуляторах.
- `ACCESS_FINE_LOCATION` - точная геолокация, если доверенная web-страница проекта явно запросит её через WebView.
- `ACCESS_COARSE_LOCATION` - приблизительная геолокация как более мягкий вариант для Android permission flow.
- `READ_MEDIA_IMAGES` - выбор изображений на Android 13+.
- `READ_MEDIA_VIDEO` - выбор видео на Android 13+.
- `READ_EXTERNAL_STORAGE` с `maxSdkVersion=32` - совместимость со старыми версиями Android.

## Поведение

- File picker запускается только после действия пользователя внутри WebView.
- Для `input capture` shell добавляет системные camera/video/audio intents и отдаёт результат обратно в WebView callback.
- Камера, микрофон и геолокация выдаются только trusted host проекта.
- Любой unknown origin получает отказ через `deny()` / `callback(false)`.
- Если пользователь отменил picker, web callback получает `null`.
- Shell не загружает файлы сам и не подменяет upload API.
- Геолокация не сохраняется постоянно: решение пользователя не принудительно запоминается оболочкой.

## Проверка

1. Фото из галереи.
2. Видео из галереи.
3. Отмена picker.
4. Camera allow/deny.
5. Microphone allow/deny.
6. Прямая запись фото/видео/аудио через `input capture`.
7. Geolocation allow/deny на trusted page.
8. Q-Cast / voice / forum media.
9. Возврат после background/foreground без потери WebView state.
