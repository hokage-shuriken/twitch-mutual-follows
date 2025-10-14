# Twitch Mutual Follows

Браузерное расширение для отображения общих подписок между пользователями Twitch.

## Установка

**Chrome:**
```
1. chrome://extensions/
2. Developer mode → ON
3. Load unpacked → выберите директорию extension/
```

**Firefox:**
```
1. about:debugging#/runtime/this-firefox
2. Load Temporary Add-on → выберите extension/manifest.json
```

## Использование

1. Откройте Twitch и зайдите в чат
2. Кликните на ник пользователя
3. В карточке появится блок "Общие фолловы"
4. Кликните на аватарки → полный список

## Технологии

- Manifest V2 (Chrome/Firefox)
- Content Scripts + Background Script
- Shadow DOM
- Twitch GraphQL API

## Лицензия

Apache License, Version 2.0.
