# 📤 Инструкция по коммиту и push изменений

## Что было изменено

1. ✅ Создан `.github/workflows/deploy-frontends.yml` - GitHub Actions для автодеплоя
2. ✅ Обновлен `frontends/webapp/vite.config.ts` - настройка для GitHub Pages
3. ✅ Обновлен `frontends/games/vite.config.js` - настройка для GitHub Pages
4. ✅ Создана документация по настройке

## Команды для коммита

```bash
# Перейти в директорию проекта
cd telepets-platform

# Проверить статус
git status

# Добавить все изменения
git add .

# Сделать коммит
git commit -m "feat: setup GitHub Pages deployment for frontends

- Add GitHub Actions workflow for automatic deployment
- Configure Vite for GitHub Pages (webapp & games)
- Add deployment documentation"

# Запушить в master
git push origin master
```

## Альтернативный вариант (пошагово)

```bash
# Добавить только новые файлы
git add .github/workflows/deploy-frontends.yml
git add GITHUB_PAGES_SETUP.md
git add COMMIT_AND_PUSH.md

# Добавить измененные файлы
git add frontends/webapp/vite.config.ts
git add frontends/games/vite.config.js

# Коммит
git commit -m "feat: setup GitHub Pages deployment"

# Push
git push origin master
```

## Проверка после push

1. Открыть: https://github.com/shmykser/telepets-platform/actions
2. Должен запуститься workflow "Deploy Frontends to GitHub Pages"
3. Дождаться завершения (~3-5 минут)

## Если возникли ошибки

### Ошибка: Permission denied

```bash
# Проверить что вы залогинены
git config user.name
git config user.email

# Если нет, настроить
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Ошибка: Updates were rejected

```bash
# Сначала подтянуть изменения
git pull origin master --rebase

# Затем запушить
git push origin master
```

### Ошибка: Authentication failed

Если используете HTTPS:
```bash
# Настроить GitHub CLI
gh auth login

# Или использовать SSH
git remote set-url origin git@github.com:shmykser/telepets-platform.git
```

## Следующие шаги после push

1. ✅ Дождаться завершения GitHub Action
2. ⚙️ Настроить GitHub Pages в Settings (см. [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md))
3. 🎮 Проверить работу фронтендов
4. 📱 Настроить Telegram WebApp

Удачи! 🚀

