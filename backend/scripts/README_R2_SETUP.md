# Настройка Cloudflare R2 для использования Presigned URLs

## Описание

Этот скрипт настраивает Cloudflare R2 бакет для использования Presigned URLs через AWS CLI.

## Предварительные требования

1. **AWS CLI установлен**
   - Windows: `winget install Amazon.AWSCLI` или скачайте с https://aws.amazon.com/cli/
   - Linux/Mac: `pip install awscli` или используйте пакетный менеджер

2. **Учетные данные Cloudflare R2**
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Имя бакета

## Получение учетных данных R2

1. Войдите в панель управления Cloudflare
2. Перейдите в **R2** → **Manage R2 API Tokens**
3. Создайте новый API токен с правами:
   - Object Read & Write
   - Object Admin (опционально)
4. Сохраните:
   - Account ID
   - Access Key ID
   - Secret Access Key

## Использование

### Linux/Mac (Bash)

```bash
cd telepets-platform/backend/scripts
chmod +x setup_r2_presigned_urls.sh
./setup_r2_presigned_urls.sh
```

### Windows (PowerShell)

```powershell
cd telepets-platform\backend\scripts
.\setup_r2_presigned_urls.ps1
```

## Что делает скрипт

1. **Проверяет наличие AWS CLI**
2. **Создает AWS CLI профиль** `r2-cloudflare` для работы с R2
3. **Проверяет доступ к бакету**
4. **Тестирует генерацию Presigned URL**
5. **Выводит инструкции** по настройке `.env` файла

## Ручная настройка (альтернатива)

Если вы предпочитаете настроить вручную:

### 1. Настройка AWS CLI профиля

```bash
aws configure --profile r2-cloudflare
```

Введите:
- AWS Access Key ID: `<ваш R2 Access Key ID>`
- AWS Secret Access Key: `<ваш R2 Secret Access Key>`
- Default region name: `auto`
- Default output format: `json` (или оставьте пустым)

### 2. Проверка доступа к бакету

```bash
aws s3 ls \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>
```

### 3. Тестирование Presigned URL

```bash
aws s3 presign \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/<object-key> \
  --expires-in 3600
```

## Настройка .env файла

После выполнения скрипта обновите файл `.env` в директории `backend/`:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET=your_bucket_name

# Использование Presigned URLs
R2_USE_SIGNED_URLS=true
R2_SIGNED_URL_TTL=86400  # 24 часа в секундах

# Закомментируйте или удалите, если используете presigned URLs
# R2_PUBLIC_BASE_URL=https://your-custom-domain.com
```

## Полезные команды AWS CLI для R2

### Список объектов в бакете

```bash
aws s3 ls \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/
```

### Загрузка файла

```bash
aws s3 cp local-file.txt \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/remote-file.txt
```

### Скачивание файла

```bash
aws s3 cp \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/remote-file.txt \
  local-file.txt
```

### Генерация Presigned URL для чтения

```bash
aws s3 presign \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/object-key \
  --expires-in 3600
```

### Генерация Presigned URL для загрузки

```bash
aws s3 presign \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2-cloudflare \
  s3://<bucket-name>/object-key \
  --expires-in 3600
```

## Проверка работы

После настройки проверьте, что все работает:

1. **Проверьте доступ к бакету:**
   ```bash
   aws s3 ls --endpoint-url <endpoint> --profile r2-cloudflare s3://<bucket>/
   ```

2. **Сгенерируйте тестовый Presigned URL:**
   ```bash
   aws s3 presign --endpoint-url <endpoint> --profile r2-cloudflare s3://<bucket>/<object> --expires-in 3600
   ```

3. **Откройте URL в браузере** - должно загрузиться изображение

4. **Проверьте работу backend:**
   - Запустите backend
   - Проверьте endpoint `/pet-images/{user_id}/{pet_name}`
   - Должен вернуться presigned URL или проксированное изображение

## Примечания

- **Presigned URLs имеют ограниченное время жизни** (TTL), после истечения они становятся недействительными
- **Не храните presigned URLs в БД** - генерируйте их на лету при запросе
- **R2 использует S3-совместимый API**, поэтому большинство команд AWS CLI работают
- **Профиль AWS CLI** сохраняется в `~/.aws/credentials` (Linux/Mac) или `%USERPROFILE%\.aws\credentials` (Windows)

## Решение проблем

### Ошибка: "Unable to locate credentials"

Убедитесь, что профиль создан правильно:
```bash
aws configure list --profile r2-cloudflare
```

### Ошибка: "Access Denied"

Проверьте:
- Правильность Access Key ID и Secret Access Key
- Права доступа API токена в Cloudflare
- Правильность имени бакета

### Ошибка: "Invalid endpoint"

Проверьте формат endpoint URL:
- Должен быть: `https://<account-id>.r2.cloudflarestorage.com`
- Account ID должен быть правильным

### Presigned URL не работает

- Проверьте, что объект существует в бакете
- Убедитесь, что URL не истек (проверьте `X-Amz-Expires` в URL)
- Попробуйте сгенерировать новый URL

