#!/bin/bash

# Скрипт для настройки Cloudflare R2 бакета на использование Presigned URLs через AWS CLI
# Использование: ./setup_r2_presigned_urls.sh

set -e

echo "=========================================="
echo "Настройка R2 бакета для Presigned URLs"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Ошибка: AWS CLI не установлен${NC}"
    echo "Установите AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI установлен${NC}"
echo ""

# Запрос параметров R2
echo "Введите параметры Cloudflare R2:"
read -p "Account ID: " R2_ACCOUNT_ID
read -p "Access Key ID: " R2_ACCESS_KEY_ID
read -sp "Secret Access Key: " R2_SECRET_ACCESS_KEY
echo ""
read -p "Bucket Name: " R2_BUCKET

# Формирование endpoint URL
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo ""
echo "=========================================="
echo "Настройка AWS CLI профиля для R2"
echo "=========================================="
echo ""

# Создание/обновление AWS CLI профиля для R2
PROFILE_NAME="r2-cloudflare"

echo "Создание профиля AWS CLI: ${PROFILE_NAME}"

aws configure set aws_access_key_id "${R2_ACCESS_KEY_ID}" --profile "${PROFILE_NAME}"
aws configure set aws_secret_access_key "${R2_SECRET_ACCESS_KEY}" --profile "${PROFILE_NAME}"
aws configure set region "auto" --profile "${PROFILE_NAME}"

echo -e "${GREEN}✓ Профиль ${PROFILE_NAME} создан${NC}"
echo ""

# Проверка доступа к бакету
echo "=========================================="
echo "Проверка доступа к бакету"
echo "=========================================="
echo ""

if aws s3 ls --endpoint-url "${R2_ENDPOINT}" --profile "${PROFILE_NAME}" "s3://${R2_BUCKET}" &> /dev/null; then
    echo -e "${GREEN}✓ Доступ к бакету ${R2_BUCKET} подтвержден${NC}"
else
    echo -e "${RED}✗ Ошибка доступа к бакету ${R2_BUCKET}${NC}"
    echo "Проверьте правильность параметров"
    exit 1
fi

echo ""
echo "=========================================="
echo "Информация о бакете"
echo "=========================================="
echo ""

# Получение информации о бакете
echo "Список объектов в бакете (первые 10):"
aws s3 ls --endpoint-url "${R2_ENDPOINT}" --profile "${PROFILE_NAME}" "s3://${R2_BUCKET}" | head -10

echo ""
echo "=========================================="
echo "Тестирование генерации Presigned URL"
echo "=========================================="
echo ""

# Поиск первого объекта для теста
FIRST_OBJECT=$(aws s3 ls --endpoint-url "${R2_ENDPOINT}" --profile "${PROFILE_NAME}" "s3://${R2_BUCKET}" | head -1 | awk '{print $4}')

if [ -z "$FIRST_OBJECT" ]; then
    echo -e "${YELLOW}⚠ Бакет пуст, пропускаем тест presigned URL${NC}"
else
    echo "Тестирование с объектом: ${FIRST_OBJECT}"
    echo ""
    
    # Генерация presigned URL
    PRESIGNED_URL=$(aws s3 presign \
        --endpoint-url "${R2_ENDPOINT}" \
        --profile "${PROFILE_NAME}" \
        "s3://${R2_BUCKET}/${FIRST_OBJECT}" \
        --expires-in 3600)
    
    echo -e "${GREEN}✓ Presigned URL сгенерирован:${NC}"
    echo "${PRESIGNED_URL}"
    echo ""
    
    # Тест доступа к presigned URL
    echo "Тестирование доступа к presigned URL..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${PRESIGNED_URL}")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Presigned URL работает (HTTP ${HTTP_CODE})${NC}"
    else
        echo -e "${YELLOW}⚠ Presigned URL вернул HTTP ${HTTP_CODE}${NC}"
        echo "Это может быть нормально, если объект требует специальных заголовков"
    fi
fi

echo ""
echo "=========================================="
echo "Настройка завершена!"
echo "=========================================="
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Обновите файл .env в директории backend/:"
echo ""
echo "   R2_USE_SIGNED_URLS=true"
echo "   R2_SIGNED_URL_TTL=86400"
echo "   R2_ACCOUNT_ID=${R2_ACCOUNT_ID}"
echo "   R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}"
echo "   R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}"
echo "   R2_ENDPOINT=${R2_ENDPOINT}"
echo "   R2_BUCKET=${R2_BUCKET}"
echo "   # Уберите или закомментируйте R2_PUBLIC_BASE_URL если используете presigned URLs"
echo ""
echo "2. Для использования AWS CLI с R2 используйте:"
echo "   aws s3 <command> --endpoint-url ${R2_ENDPOINT} --profile ${PROFILE_NAME} s3://${R2_BUCKET}/..."
echo ""
echo "3. Для генерации presigned URL:"
echo "   aws s3 presign --endpoint-url ${R2_ENDPOINT} --profile ${PROFILE_NAME} s3://${R2_BUCKET}/<object-key> --expires-in 3600"
echo ""

