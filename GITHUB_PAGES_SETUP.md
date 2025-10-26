# 🚀 Настройка GitHub Pages для Telepets Platform

## ✅ Что уже сделано

1. ✅ Создан GitHub Actions workflow: `.github/workflows/deploy-frontends.yml`
2. ✅ Обновлена конфигурация Vite для WebApp
3. ✅ Обновлена конфигурация Vite для Games

## 📋 Что нужно сделать

### Шаг 1: Включить GitHub Pages

1. Открыть: https://github.com/shmykser/telepets-platform/settings/pages

2. В разделе **"Build and deployment"**:
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages` → `/ (root)` → Save
   
   ⚠️ **Важно:** Branch `gh-pages` создастся автоматически после первого запуска GitHub Action

### Шаг 2: Настроить переменные окружения (опционально)

1. Открыть: https://github.com/shmykser/telepets-platform/settings/secrets/actions

2. Нажать **"New repository secret"**

3. Добавить секрет:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://telepets-api.onrender.com` (или ваш API URL)
   - Нажать **"Add secret"**

### Шаг 3: Запустить деплой

Вариант A: Автоматически при push
```bash
git add .
git commit -m "feat: setup GitHub Pages deployment"
git push origin master
```

Вариант B: Вручную через интерфейс
1. Открыть: https://github.com/shmykser/telepets-platform/actions
2. Выбрать **"Deploy Frontends to GitHub Pages"**
3. Нажать **"Run workflow"** → **"Run workflow"**

### Шаг 4: Дождаться завершения

1. Открыть: https://github.com/shmykser/telepets-platform/actions
2. Следить за прогрессом (обычно 3-5 минут)
3. Дождаться зеленой галочки ✅

### Шаг 5: Проверить результат

После успешного деплоя ваши фронтенды будут доступны по адресам:

- **WebApp:** https://shmykser.github.io/telepets-platform/
- **Games:** https://shmykser.github.io/telepets-platform/games/

Также доступны конкретные игры:
- **Egg Defense:** https://shmykser.github.io/telepets-platform/games/
- **Pet Thief:** https://shmykser.github.io/telepets-platform/games/petthief.html

---

## 🔧 Проверка работы

### 1. Проверить WebApp

```bash
curl -I https://shmykser.github.io/telepets-platform/
```

Ожидаемый результат: `200 OK`

### 2. Проверить Games

```bash
curl -I https://shmykser.github.io/telepets-platform/games/
```

Ожидаемый результат: `200 OK`

### 3. Открыть в браузере

WebApp:
```
https://shmykser.github.io/telepets-platform/
```

Games:
```
https://shmykser.github.io/telepets-platform/games/
```

### 4. Проверить консоль браузера

Открыть DevTools (F12) и проверить:
- ✅ Нет ошибок загрузки
- ✅ Все ассеты загружаются
- ✅ API запросы идут на правильный URL

---

## 🎯 Настройка Telegram WebApp

После успешного деплоя настроить бота:

### 1. Открыть @BotFather в Telegram

### 2. Настроить Menu Button

```
/mybots
→ Выбрать вашего бота
→ Bot Settings
→ Menu Button
→ URL: https://shmykser.github.io/telepets-platform/
→ Button text: 🎮 Играть
```

### 3. Проверить в Telegram

1. Открыть бота
2. Нажать кнопку Menu "🎮 Играть"
3. Должно открыться WebApp

---

## 🔄 Автоматический деплой

Теперь при каждом push в branch `master` с изменениями в папке `frontends/`:

1. GitHub Action автоматически запустится
2. Соберет оба фронтенда
3. Задеплоит на GitHub Pages
4. Обновленная версия будет доступна через 3-5 минут

### Мониторинг деплоя

Следить за статусом:
- https://github.com/shmykser/telepets-platform/actions

---

## 🐛 Troubleshooting

### Проблема: GitHub Pages не включается

**Решение:**
1. Убедитесь что репозиторий публичный
2. Или у вас GitHub Pro/Enterprise для приватных репозиториев

### Проблема: 404 после деплоя

**Решение:**
1. Проверить что branch `gh-pages` существует
2. Проверить что в Settings → Pages выбран правильный branch
3. Подождать 5-10 минут (DNS кеширование)

### Проблема: WebApp открывается но не работает

**Решение:**
1. Открыть консоль браузера (F12)
2. Проверить ошибки CORS
3. Убедиться что `VITE_API_URL` указывает на правильный backend
4. Проверить что backend настроил CORS для GitHub Pages URL

### Проблема: Ошибка в GitHub Action

**Решение:**
1. Открыть https://github.com/shmykser/telepets-platform/actions
2. Кликнуть на failed job
3. Посмотреть логи ошибки
4. Обычно проблема в:
   - Отсутствующие зависимости в package.json
   - Ошибки сборки TypeScript
   - Проблемы с путями

---

## 📊 Структура деплоя

После деплоя на GitHub Pages структура будет:

```
https://shmykser.github.io/telepets-platform/
├── index.html              # WebApp (React)
├── assets/                 # WebApp assets
├── favicon.svg            # WebApp favicon
│
└── games/                  # Games (Phaser)
    ├── index.html          # Меню игр
    ├── petthief.html      # Pet Thief игра
    ├── assets/            # Game assets
    └── petthief-direct.js # Direct launch script
```

---

## 🎉 Готово!

Теперь ваши фронтенды автоматически деплоятся на GitHub Pages!

**URLs:**
- WebApp: https://shmykser.github.io/telepets-platform/
- Games: https://shmykser.github.io/telepets-platform/games/

**Следующие шаги:**
1. Настроить backend на Render (см. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))
2. Настроить CORS в backend для GitHub Pages URL
3. Настроить Telegram WebApp через @BotFather

**Полная инструкция:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

Удачи! 🚀🐾

