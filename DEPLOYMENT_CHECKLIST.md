# Чеклист деплоя на Production

## ✅ Выполнено

- [x] Анализ всех изменений между dev и production
- [x] Добавлена зависимость `boto3>=1.34.0` в requirements.txt
- [x] Все изменения закоммичены
- [x] Код запушен в origin/master
- [x] Создана документация по деплою (DEPLOYMENT_PLAN_PROD.md)
- [x] Создан справочник переменных окружения (ENV_VARIABLES_PROD.md)

## 🔄 Требуется выполнить вручную

### 1. Настройка переменных окружения в Render

**Важно:** Все переменные нужно добавить в Render Dashboard → Ваш Backend сервис → Environment

#### Cloudflare R2 (обязательно):
```
R2_ACCOUNT_ID=<ваш-account-id>
R2_ACCESS_KEY_ID=<ваш-access-key-id>
R2_SECRET_ACCESS_KEY=<ваш-secret-access-key>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=<имя-бакета>
R2_USE_SIGNED_URLS=true
R2_SIGNED_URL_TTL=3600
```

**Как получить:**
1. Зайдите в Cloudflare Dashboard → R2
2. Создайте bucket (если еще не создан)
3. Перейдите в "Manage R2 API Tokens"
4. Создайте API Token с правами Read/Write
5. Скопируйте Account ID, Access Key ID и Secret Access Key

#### Replicate (обязательно):
```
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=<ваш-replicate-token>
REPLICATE_MODEL=black-forest-labs/flux-1.1-pro
REPLICATE_TIMEOUT=180
REPLICATE_POLL_INTERVAL=2
```

**Как получить:**
1. Зайдите на https://replicate.com
2. Войдите в аккаунт
3. Перейдите в Settings → API tokens
4. Создайте новый API token
5. Скопируйте токен

#### База данных и миграции:
```
ENVIRONMENT=production
RUN_MIGRATIONS_ON_STARTUP=true
SKIP_DB_ON_STARTUP=false
```

**Проверьте существующие:**
- `DATABASE_URL` - должен быть установлен (Supabase connection string)
- `TELEGRAM_BOT_TOKEN` - должен быть установлен
- `SECRET_KEY` - должен быть установлен

### 2. Применение миграций БД

Миграции применятся автоматически при старте сервиса, если `RUN_MIGRATIONS_ON_STARTUP=true`.

**Проверка миграций:**
После деплоя проверьте логи Render, что миграции применились:
- Ищите сообщения типа "INFO [alembic.runtime.migration] Running upgrade ..."
- Должны быть применены:
  - `add_pet_image_urls_20251030` (добавление URL полей)
  - `drop_pet_image_b64_20251030` (удаление base64 полей)

**Ручное применение (если требуется):**
Если миграции не применились автоматически, можно применить вручную через Supabase Dashboard:
1. Зайдите в Supabase Dashboard → SQL Editor
2. Выполните SQL из миграций (см. файлы в `backend/alembic/versions/`)

### 3. Проверка после деплоя

После деплоя проверьте:

1. **Health endpoint:**
   ```bash
   curl https://your-render-service.onrender.com/monitoring/health
   ```
   Должен вернуть `200 OK`

2. **Логи Render:**
   - Нет ошибок при старте
   - Миграции применены успешно
   - Нет ошибок подключения к R2
   - Нет ошибок подключения к Replicate

3. **Генерация изображения:**
   - Создайте нового питомца
   - Проверьте, что изображение генерируется
   - Проверьте, что изображение загружается в R2
   - Проверьте, что URL изображения возвращается в API

4. **Игра EggDefense:**
   - Откройте карточку питомца в состоянии "egg"
   - Проверьте, что кнопка игры доступна
   - Проверьте, что игра запускается

### 4. Деплой Frontend (если требуется)

Frontend деплоится отдельно (GitHub Pages или другой хостинг).

**Проверьте:**
- Конфигурацию API endpoints в `frontends/webapp/src/config/endpoints.ts`
- URL должен указывать на production API

## 📝 Важные заметки

### Обратная совместимость
- Старые изображения в base64 останутся в БД, но не будут использоваться
- Новые изображения будут генерироваться через Replicate и сохраняться в R2
- При первом запросе изображения оно будет сгенерировано и загружено в R2

### Откат изменений
Если что-то пошло не так:
1. Можно временно вернуться на HuggingFace, установив `GENERATION_PROVIDER=hf`
2. Но R2 storage уже требуется для новых изображений
3. Миграции БД необратимы (base64 поля удалены)

### Мониторинг
После деплоя следите за:
- Использованием R2 storage (стоимость)
- Использованием Replicate API (стоимость)
- Логами ошибок в Render
- Производительностью API

## 🆘 Troubleshooting

### Ошибка подключения к R2
- Проверьте правильность R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- Проверьте правильность R2_ENDPOINT (должен быть `https://<account-id>.r2.cloudflarestorage.com`)
- Проверьте, что bucket существует

### Ошибка подключения к Replicate
- Проверьте правильность REPLICATE_API_TOKEN
- Проверьте, что токен активен
- Проверьте, что модель доступна

### Ошибки миграций
- Проверьте подключение к БД (DATABASE_URL)
- Проверьте логи миграций в Render
- Если миграции не применились, примените вручную через Supabase Dashboard

### Изображения не генерируются
- Проверьте логи на наличие ошибок Replicate
- Проверьте, что REPLICATE_API_TOKEN установлен
- Проверьте квоты Replicate API

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи Render Dashboard → Logs
2. Проверьте документацию в `DEPLOYMENT_PLAN_PROD.md` и `ENV_VARIABLES_PROD.md`
3. Проверьте переменные окружения в Render Dashboard → Environment

