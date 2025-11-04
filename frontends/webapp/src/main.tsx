import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { setStoredUserId, setStoredUsername } from './utils'

if (!localStorage.getItem('user_id')) {
  setStoredUserId('273065571');
}
if (!localStorage.getItem('username')) {
  setStoredUsername('Shmykser');
}

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

