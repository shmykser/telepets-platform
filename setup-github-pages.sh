#!/bin/bash
# Скрипт для настройки GitHub Pages через GitHub CLI

echo "🚀 Настройка GitHub Pages для telepets-platform..."

# Проверка что gh установлен
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI не установлен!"
    echo "Установите: https://cli.github.com/"
    exit 1
fi

# Проверка авторизации
if ! gh auth status &> /dev/null; then
    echo "❌ Не авторизованы в GitHub CLI"
    echo "Выполните: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI готов"

# Включение GitHub Pages через API
echo "⚙️ Включение GitHub Pages..."

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/shmykser/telepets-platform/pages \
  -f source[branch]=gh-pages \
  -f source[path]=/

if [ $? -eq 0 ]; then
    echo "✅ GitHub Pages включен!"
    echo "📍 URL: https://shmykser.github.io/telepets-platform/"
else
    echo "⚠️ Возможно Pages уже включен или нужны права администратора"
    echo "Попробуйте настроить вручную: https://github.com/shmykser/telepets-platform/settings/pages"
fi

echo ""
echo "🎉 Готово! Теперь сделайте push:"
echo "   git add ."
echo "   git commit -m 'feat: setup GitHub Pages'"
echo "   git push origin master"

