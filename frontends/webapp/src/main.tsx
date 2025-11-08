import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { getStoredUserId, getStoredUsername } from './utils'
import { initTelegramWebApp } from './utils/telegram'
import { settings } from './config/settings'

getStoredUserId()
getStoredUsername()

// Инициализация Telegram WebApp
// Устанавливаем цвет заголовка в цвет фона, чтобы кнопка "Закрыть" была менее заметной
// Кнопку "Закрыть" нельзя скрыть или переименовать - это системная кнопка Telegram
initTelegramWebApp(settings.telegram);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.DEV ? '' : '/telepets-platform'}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

