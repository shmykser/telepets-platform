# Скрипт для настройки Cloudflare R2 бакета на использование Presigned URLs через AWS CLI (PowerShell)
# Использование: .\setup_r2_presigned_urls.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Настройка R2 бакета для Presigned URLs" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI установлен: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка: AWS CLI не установлен" -ForegroundColor Red
    Write-Host "Установите AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Запрос параметров R2
Write-Host "Введите параметры Cloudflare R2:" -ForegroundColor Yellow
$R2_ACCOUNT_ID = Read-Host "Account ID"
$R2_ACCESS_KEY_ID = Read-Host "Access Key ID"
$R2_SECRET_ACCESS_KEY = Read-Host "Secret Access Key" -AsSecureString
$R2_BUCKET = Read-Host "Bucket Name"

# Конвертация SecureString в обычную строку
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($R2_SECRET_ACCESS_KEY)
$R2_SECRET_ACCESS_KEY_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Формирование endpoint URL
$R2_ENDPOINT = "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Настройка AWS CLI профиля для R2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Создание/обновление AWS CLI профиля для R2
$PROFILE_NAME = "r2-cloudflare"

Write-Host "Создание профиля AWS CLI: $PROFILE_NAME"

aws configure set aws_access_key_id "$R2_ACCESS_KEY_ID" --profile "$PROFILE_NAME"
aws configure set aws_secret_access_key "$R2_SECRET_ACCESS_KEY_PLAIN" --profile "$PROFILE_NAME"
aws configure set region "auto" --profile "$PROFILE_NAME"

Write-Host "✓ Профиль $PROFILE_NAME создан" -ForegroundColor Green
Write-Host ""

# Проверка доступа к бакету
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Проверка доступа к бакету" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$testResult = aws s3 ls --endpoint-url "$R2_ENDPOINT" --profile "$PROFILE_NAME" "s3://$R2_BUCKET" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Доступ к бакету $R2_BUCKET подтвержден" -ForegroundColor Green
} else {
    Write-Host "✗ Ошибка доступа к бакету $R2_BUCKET" -ForegroundColor Red
    Write-Host "Проверьте правильность параметров" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Информация о бакете" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Получение информации о бакете
Write-Host "Список объектов в бакете (первые 10):" -ForegroundColor Yellow
aws s3 ls --endpoint-url "$R2_ENDPOINT" --profile "$PROFILE_NAME" "s3://$R2_BUCKET" | Select-Object -First 10

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Тестирование генерации Presigned URL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Поиск первого объекта для теста
$firstObjectLine = aws s3 ls --endpoint-url "$R2_ENDPOINT" --profile "$PROFILE_NAME" "s3://$R2_BUCKET" | Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($firstObjectLine)) {
    Write-Host "⚠ Бакет пуст, пропускаем тест presigned URL" -ForegroundColor Yellow
} else {
    $FIRST_OBJECT = ($firstObjectLine -split '\s+')[-1]
    Write-Host "Тестирование с объектом: $FIRST_OBJECT" -ForegroundColor Yellow
    Write-Host ""
    
    # Генерация presigned URL
    $PRESIGNED_URL = aws s3 presign `
        --endpoint-url "$R2_ENDPOINT" `
        --profile "$PROFILE_NAME" `
        "s3://$R2_BUCKET/$FIRST_OBJECT" `
        --expires-in 3600
    
    Write-Host "✓ Presigned URL сгенерирован:" -ForegroundColor Green
    Write-Host "$PRESIGNED_URL" -ForegroundColor Cyan
    Write-Host ""
    
    # Тест доступа к presigned URL
    Write-Host "Тестирование доступа к presigned URL..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$PRESIGNED_URL" -Method Head -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Presigned URL работает (HTTP $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "⚠ Presigned URL вернул HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Ошибка при тестировании: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Это может быть нормально, если объект требует специальных заголовков" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Настройка завершена!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Обновите файл .env в директории backend/:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   R2_USE_SIGNED_URLS=true" -ForegroundColor White
Write-Host "   R2_SIGNED_URL_TTL=86400" -ForegroundColor White
Write-Host "   R2_ACCOUNT_ID=$R2_ACCOUNT_ID" -ForegroundColor White
Write-Host "   R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID" -ForegroundColor White
Write-Host "   R2_SECRET_ACCESS_KEY=<ваш_secret_key>" -ForegroundColor White
Write-Host "   R2_ENDPOINT=$R2_ENDPOINT" -ForegroundColor White
Write-Host "   R2_BUCKET=$R2_BUCKET" -ForegroundColor White
Write-Host "   # Уберите или закомментируйте R2_PUBLIC_BASE_URL если используете presigned URLs" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Для использования AWS CLI с R2 используйте:" -ForegroundColor Yellow
Write-Host "   aws s3 <command> --endpoint-url $R2_ENDPOINT --profile $PROFILE_NAME s3://$R2_BUCKET/..." -ForegroundColor White
Write-Host ""
Write-Host "3. Для генерации presigned URL:" -ForegroundColor Yellow
Write-Host "   aws s3 presign --endpoint-url $R2_ENDPOINT --profile $PROFILE_NAME s3://$R2_BUCKET/<object-key> --expires-in 3600" -ForegroundColor White
Write-Host ""

