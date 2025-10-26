# 📡 Руководство по Эндпоинтам и Портам

## 📊 Таблица портов и эндпоинтов

| Сервис | Dev Mode | Prod Mode | Описание |
|--------|----------|-----------|----------|
| **WebApp (React)** | `http://localhost:3001` | `http://localhost:8080/` | Основное приложение Telepets |
| **Games (Phaser)** | `http://localhost:5174/games/` | `http://localhost:8080/games/` | Игровой движок (Pet Thief, Egg Defense) |
| **Backend API** | `http://localhost:3000` (direct)<br/>`http://localhost:8080/api` (via Nginx) | `http://localhost:8080/api` | FastAPI backend |
| **Pet Images** | `http://localhost:8080/pet-images` | `http://localhost:8080/pet-images` | Изображения питомцев |
| **Nginx (Gateway)** | `http://localhost:8080` | `http://localhost:8080` | Reverse proxy & static files |

---

## 🗂️ Структура конфигурации

### **Централизованный конфиг**
Все эндпоинты определены в **ОДНОМ месте**:

```
telepets-platform/frontends/webapp/src/config/endpoints.ts
```

### **Vite конфигурации (только порты dev серверов)**

1. **WebApp:** `webapp/vite.config.ts`
   - Dev server: `port: 3001`
   - Прокси для API: `/api` → `http://127.0.0.1:3000`

2. **Games:** `games/vite.config.js`
   - Dev server: `port: 5174`
   - Base path: `/games/`

### **Nginx конфигурация (prod routing)**

`infra/nginx.conf`
- Порт: `80` (внутри Docker, маппится на `8080`)
- Routes:
  - `/` → WebApp static
  - `/games/` → Games static
  - `/api/` → Backend proxy
  - `/pet-images/` → Backend proxy

---

## 🎯 Использование централизованного конфига

### **1. Импорт конфига**

```typescript
import { CONFIG, buildUrl, ENV_INFO } from '@/config/endpoints'
```

### **2. Получение URL игры**

```typescript
// ✅ ПРАВИЛЬНО
const gameUrl = buildUrl.game({
  pet_name: 'Fluffy',
  user_id: '12345',
  game_type: 'pet_thief'
})
// Dev:  http://localhost:5174/games/?pet_name=Fluffy&user_id=12345&game_type=pet_thief
// Prod: /games/?pet_name=Fluffy&user_id=12345&game_type=pet_thief

// ❌ НЕПРАВИЛЬНО (hardcoded)
const gameUrl = `http://localhost:5174/games/?pet_name=${name}...`
```

### **3. Получение URL API**

```typescript
// ✅ ПРАВИЛЬНО
import { CONFIG } from '@/config/endpoints'

const api = axios.create({
  baseURL: CONFIG.api.url // Auto: dev or prod
})

// ❌ НЕПРАВИЛЬНО (hardcoded)
const api = axios.create({
  baseURL: 'http://localhost:8080/api'
})
```

### **4. Получение URL изображения питомца**

```typescript
// ✅ ПРАВИЛЬНО
const imageUrl = buildUrl.petImage('12345', 'Fluffy')
// Dev:  http://localhost:8080/pet-images/12345/Fluffy
// Prod: /pet-images/12345/Fluffy

// ❌ НЕПРАВИЛЬНО (hardcoded)
const imageUrl = `http://localhost:8080/pet-images/${userId}/${petName}`
```

---

## 🔧 Примеры миграции

### **До:**
```typescript
// PetThiefGame.tsx
const isDev = import.meta.env.DEV
const gamesBaseUrl = isDev ? 'http://localhost:5174' : ''
const gameUrl = `${gamesBaseUrl}/games/?pet_name=${name}...`
```

### **После:**
```typescript
// PetThiefGame.tsx
import { buildUrl } from '@/config/endpoints'

const gameUrl = buildUrl.game({
  pet_name: name,
  user_id: userId,
  game_type: 'pet_thief'
})
```

---

## 🌐 Режимы окружения

### **Development (npm run dev)**
- WebApp: `localhost:3001` (Vite HMR)
- Games: `localhost:5174` (Vite HMR)
- API: `localhost:8080/api` (через Nginx) или `localhost:3000` (прямой доступ)
- Hot Module Replacement ✅
- Source maps ✅

### **Production (Docker + Nginx)**
- Все: `localhost:8080` (или домен prod)
- WebApp: `/` → статика из `/usr/share/nginx/html/webapp/`
- Games: `/games/` → статика из `/usr/share/nginx/html/games/`
- API: `/api/` → proxy to `backend:8000`
- Минификация ✅
- Кэширование ✅

---

## 📝 Правила работы с эндпоинтами

### ✅ DO (Делай)
1. **Используй централизованный конфиг** `@/config/endpoints`
2. **Используй утилиты** `buildUrl.*` для построения URL
3. **Проверяй в обоих режимах** (dev и prod)
4. **Используй относительные пути** в prod когда возможно

### ❌ DON'T (Не делай)
1. **НЕ хардкодь URL** напрямую в компонентах
2. **НЕ дублируй** конфигурацию портов
3. **НЕ смешивай** dev и prod логику в одном месте
4. **НЕ используй** `import.meta.env.VITE_API_URL` напрямую

---

## 🧪 Проверка конфигурации

### **В Dev режиме:**
```typescript
import { ENV_INFO } from '@/config/endpoints'

console.log('Current environment:', ENV_INFO)
// {
//   isDev: true,
//   isProd: false,
//   mode: 'development',
//   apiUrl: 'http://localhost:8080/api',
//   gamesUrl: 'http://localhost:5174'
// }
```

### **Проверка URL:**
```typescript
import { buildUrl } from '@/config/endpoints'

console.log('Game URL:', buildUrl.game({ pet_name: 'Test' }))
console.log('API URL:', buildUrl.api('pets/summary'))
console.log('Pet Image:', buildUrl.petImage('123', 'Fluffy'))
```

---

## 🔄 Обновление конфигурации

### **Изменение порта Dev сервера:**

1. **WebApp:** Изменить в `webapp/vite.config.ts`
   ```typescript
   server: {
     port: 3001, // <- Здесь
   }
   ```

2. **Обновить** `webapp/src/config/endpoints.ts`
   ```typescript
   const DEV_CONFIG = {
     webapp: {
       port: 3001, // <- Здесь
     }
   }
   ```

3. **Перезапустить** dev server
   ```bash
   npm run dev
   ```

### **Изменение Prod endpoint:**

Только через **Nginx конфигурацию** `infra/nginx.conf`:
```nginx
location /api/ {
    proxy_pass http://backend/;
    # ...
}
```

Относительные пути в `endpoints.ts` не требуют изменений.

---

## 🚨 Troubleshooting

### **Игра не загружается (404)**
- ✅ Проверь порт games сервера: `netstat -an | grep 5174`
- ✅ Проверь `buildUrl.game()` возвращает правильный URL
- ✅ В dev должен быть `http://localhost:5174/games/...`
- ✅ В prod должен быть `/games/...`

### **API 404/CORS ошибки**
- ✅ Проверь `CONFIG.api.url` в консоли
- ✅ В dev через Nginx: `http://localhost:8080/api`
- ✅ В prod относительный путь: `/api`
- ✅ Проверь Vite proxy конфигурацию

### **Изображения не загружаются**
- ✅ Проверь `buildUrl.petImage()` возвращает правильный URL
- ✅ Backend должен отдавать файлы на `/pet-images/{user_id}/{pet_name}`
- ✅ Nginx должен проксировать `/pet-images/` к backend

---

## 📚 См. также

- [Vite Configuration](https://vitejs.dev/config/)
- [Nginx Proxy Configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Axios Instance Creation](https://axios-http.com/docs/instance)

---

**Дата обновления:** 2025-10-26
**Автор:** Automated Configuration System

