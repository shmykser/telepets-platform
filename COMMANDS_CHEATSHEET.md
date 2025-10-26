# 🔧 Шпаргалка команд Telepets Platform

> Быстрый справочник по часто используемым командам

---

## 🏠 Локальная разработка

### Backend

```bash
# Установка зависимостей
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Создание .env
cp ../.env.production.example .env
# Отредактировать .env

# Миграции
alembic upgrade head                    # Применить все миграции
alembic downgrade -1                    # Откатить последнюю
alembic revision --autogenerate -m "msg"  # Создать новую миграцию
alembic current                         # Текущая версия БД
alembic history                         # История миграций

# Запуск
uvicorn main:app --reload --port 3000   # Development
uvicorn main:app --host 0.0.0.0 --port 8000  # Production-like

# Debug режим
uvicorn main:app --reload --log-level debug
```

### Frontend WebApp

```bash
cd frontends/webapp

# Установка
npm install
# или
npm ci  # использовать в CI/CD

# Разработка
npm run dev           # Запуск dev сервера (порт 3001)
npm run build         # Сборка production
npm run preview       # Предпросмотр production сборки
npm run lint          # Проверка кода

# Очистка
rm -rf node_modules dist
npm install
```

### Frontend Games

```bash
cd frontends/games

# Установка и запуск
npm install
npm run dev           # Запуск dev сервера (порт 3002)
npm run build         # Сборка production
npm run preview       # Предпросмотр

# Тестирование конкретной игры
npm run dev -- --open /petthief.html
```

---

## 🐳 Docker (локально)

```bash
# Из директории infra/
cd infra

# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Пересборка
docker-compose up -d --build

# Логи
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres

# Перезапуск отдельного сервиса
docker-compose restart backend

# Выполнить команду в контейнере
docker-compose exec backend bash
docker-compose exec backend python -c "print('test')"

# Миграции в контейнере
docker-compose exec backend alembic upgrade head

# Очистка
docker-compose down -v  # удалит volumes (БД)
```

---

## 📦 Git

### Основные команды

```bash
# Клонирование
git clone https://github.com/your-username/telepets-platform.git
cd telepets-platform

# Статус
git status
git log --oneline -10

# Изменения
git add .
git commit -m "feat: add new feature"
git push

# Ветки
git checkout -b feature/new-feature
git checkout main
git branch -a
git branch -d feature/old-feature

# Синхронизация
git pull
git fetch --all
```

### Создание репозиториев для деплоя

```bash
# Backend
cd telepets-platform/backend
git init
git add .
git commit -m "Initial commit: Backend"
git remote add origin https://github.com/your-username/telepets-backend.git
git branch -M main
git push -u origin main

# WebApp
cd ../frontends/webapp
git init
git add .
git commit -m "Initial commit: WebApp"
git remote add origin https://github.com/your-username/telepets-webapp.git
git branch -M main
git push -u origin main

# Games
cd ../games
git init
git add .
git commit -m "Initial commit: Games"
git remote add origin https://github.com/your-username/telepets-games.git
git branch -M main
git push -u origin main
```

---

## 🔑 Генерация ключей

### SECRET_KEY для Backend

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### SSH Key для GitHub

```bash
# Генерация
ssh-keygen -t ed25519 -C "your_email@example.com"

# Добавление в ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Копирование публичного ключа
cat ~/.ssh/id_ed25519.pub
# Вставить в GitHub → Settings → SSH Keys
```

---

## 🗄️ База данных

### PostgreSQL (локально)

```bash
# Подключение
psql -U telepets -d telepets

# Backup
pg_dump -U telepets telepets > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U telepets -d telepets < backup.sql

# Экспорт конкретной таблицы
pg_dump -U telepets -d telepets -t pets > pets_backup.sql
```

### SQLite (разработка)

```bash
# Открыть БД
sqlite3 telepets_dev.db

# Команды в sqlite3
.tables                 # Список таблиц
.schema pets           # Схема таблицы
SELECT * FROM pets;    # Запрос
.quit                  # Выход

# Backup
cp telepets_dev.db telepets_dev_backup_$(date +%Y%m%d).db

# Экспорт в SQL
sqlite3 telepets_dev.db .dump > backup.sql
```

### Render PostgreSQL

```bash
# Экспорт через Render Dashboard
# Database → Actions → Download Snapshot

# Или через CLI (установить Render CLI)
render db export telepets-db > backup.sql

# Подключение напрямую (External URL из Dashboard)
psql postgresql://user:password@dpg-xxxxx-a.frankfurt-postgres.render.com/telepets
```

---

## 🧪 Тестирование

### API тестирование (curl)

```bash
# Health check
curl https://telepets-api.onrender.com/monitoring/health

# Metrics
curl https://telepets-api.onrender.com/monitoring/metrics

# Создание питомца
curl -X POST "http://localhost:3000/create?user_id=123456&name=TestPet"

# Получение summary
curl "http://localhost:3000/summary?user_id=123456"

# С авторизацией (JWT)
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" \
  https://telepets-api.onrender.com/profile

# POST с JSON
curl -X POST https://telepets-api.onrender.com/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### API тестирование (HTTPie)

```bash
# Установка
pip install httpie

# Примеры
http GET https://telepets-api.onrender.com/monitoring/health
http POST http://localhost:3000/create user_id=123456 name=TestPet
http GET http://localhost:3000/summary user_id==123456
```

---

## 📊 Мониторинг и логи

### Render

```bash
# Render CLI (установка)
brew install render  # Mac
# или через npm
npm install -g @render-oss/cli

# Логи
render logs telepets-api
render logs telepets-api --tail 100
render logs telepets-api --follow

# Статус
render services list
render service get telepets-api
```

### Локальные логи

```bash
# Backend логи
tail -f backend/app.log

# Nginx логи (Docker)
docker-compose logs -f nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🚀 Деплой

### Render (автоматический)

```bash
# Просто push в main branch
git add .
git commit -m "fix: update feature"
git push

# Render автоматически задеплоит изменения
# Проверить статус: https://dashboard.render.com
```

### GitHub Pages (автоматический)

```bash
# Просто push в main branch
cd frontends/webapp
git add .
git commit -m "feat: new UI"
git push

# GitHub Action автоматически соберёт и задеплоит
# Проверить: https://github.com/your-username/telepets-webapp/actions
```

### Ручной деплой (если нужно)

```bash
# Frontend сборка и деплой вручную
cd frontends/webapp
npm run build

# Использовать gh-pages package
npm install -g gh-pages
gh-pages -d dist
```

---

## 🔧 Troubleshooting

### Очистка кэшей

```bash
# NPM cache
npm cache clean --force

# Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Docker cache
docker system prune -a
docker volume prune
```

### Переустановка зависимостей

```bash
# Python
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Node.js
rm -rf node_modules package-lock.json
npm install
```

### Проверка портов

```bash
# Проверить занят ли порт
lsof -i :3000      # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Убить процесс на порту
kill -9 $(lsof -ti :3000)  # Mac/Linux
```

### Проверка переменных окружения

```bash
# Linux/Mac
env | grep TELEGRAM
printenv DATABASE_URL

# Загрузить .env в текущую сессию
set -a; source .env; set +a

# Windows
set
echo %TELEGRAM_BOT_TOKEN%
```

---

## 📱 Telegram Bot

### BotFather команды

```
/newbot          - Создать нового бота
/mybots          - Управление ботами
/setcommands     - Настроить команды
/setdescription  - Описание бота
/setabouttext    - Краткое описание
/setuserpic      - Аватар бота
/deletebot       - Удалить бота

# WebApp
/newapp          - Создать Web App
/myapps          - Мои Web Apps
/editapp         - Редактировать Web App

# Menu Button
Bot Settings → Menu Button
# Указать URL вашего WebApp
```

---

## 🎯 Быстрые команды

### Полный перезапуск локально

```bash
# Backend
cd backend
deactivate || true
source venv/bin/activate
alembic upgrade head
uvicorn main:app --reload &

# Frontend
cd ../frontends/webapp
npm run dev &

# Games
cd ../games
npm run dev &

# Проверка
curl http://localhost:3000/monitoring/health
open http://localhost:3001
```

### Проверка production

```bash
# Backend
curl https://telepets-api.onrender.com/monitoring/health

# Frontend
curl -I https://your-username.github.io/telepets-webapp/

# Полная проверка
open https://t.me/your_bot  # Telegram
```

---

## 💡 Полезные алиасы (добавить в .bashrc/.zshrc)

```bash
# Telepets aliases
alias tp-backend='cd ~/telepets-platform/backend && source venv/bin/activate'
alias tp-webapp='cd ~/telepets-platform/frontends/webapp'
alias tp-games='cd ~/telepets-platform/frontends/games'

alias tp-start-backend='tp-backend && uvicorn main:app --reload'
alias tp-start-webapp='tp-webapp && npm run dev'
alias tp-start-games='tp-games && npm run dev'

alias tp-logs-render='render logs telepets-api --follow'
alias tp-health='curl https://telepets-api.onrender.com/monitoring/health | jq'

# Git shortcuts
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline -10'
```

---

## 📚 Ссылки на документацию

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Render Docs](https://render.com/docs)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp Docs](https://core.telegram.org/bots/webapps)

---

**Сохраните этот файл для быстрого доступа к командам! 🚀**

