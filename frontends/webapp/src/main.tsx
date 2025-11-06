import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { setStoredUserId, setStoredUsername } from './utils'
import { initTelegramWebApp } from './utils/telegram'

if (!localStorage.getItem('user_id')) {
  setStoredUserId('273065571');
}
if (!localStorage.getItem('username')) {
  setStoredUsername('Shmykser');
}

// Инициализация Telegram WebApp
// Устанавливаем цвет заголовка в цвет фона, чтобы кнопка "Закрыть" была менее заметной
// Кнопку "Закрыть" нельзя скрыть или переименовать - это системная кнопка Telegram
initTelegramWebApp({
  headerColor: '#0a0a0a', // Темный цвет, совпадающий с фоном
  backgroundColor: '#0a0a0a',
  enableClosingConfirmation: false, // Можно включить, если нужно подтверждение при закрытии
  hideHeader: true, // Делаем заголовок менее заметным, устанавливая его цвет в цвет фона
});

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

