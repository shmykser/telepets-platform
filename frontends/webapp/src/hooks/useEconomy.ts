import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { economyApi, marketApi, authApi } from '@/lib/api'
import { getStoredUserId } from '@/utils'
import { notifySuccess, notifyError } from '@/components/Notification'
import { useMemo } from 'react'
import type { Auction } from '@/types'
import { usePetWebSocket } from './usePetWebSocket' // Для интеграции с WebSocket

export function useWallet() {
  const userId = useMemo(() => getStoredUserId(), [])
  const { isConnected: isWebSocketConnected } = usePetWebSocket()

  const {
    data: wallet,
    isLoading,
    error,
  } = useQuery({ queryKey: ['wallet', userId], queryFn: () => economyApi.getWallet(userId),
    // Отключаем polling если WebSocket подключен - обновления придут мгновенно через wallet_updated
    refetchInterval: isWebSocketConnected ? false : 10000, // Refetch every 10 seconds только если WS не подключен
    refetchIntervalInBackground: false,
    retry: 2,
    // При WebSocket данные всегда свежие
    staleTime: isWebSocketConnected ? Infinity : 5000, // Data is fresh for 5 seconds или бесконечно при WS
    gcTime: 300000, // Cache for 5 минут
  })

  return {
    wallet,
    isLoading,
    error,
  }
}

export function useTransactions(limit: number = 20) {
  const userId = useMemo(() => getStoredUserId(), [])

  const {
    data: transactionsData,
    isLoading,
    error,
  } = useQuery({ queryKey: ['transactions', userId, limit], queryFn: () => economyApi.getTransactions(userId, limit), {
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  }})

  return {
    transactions: transactionsData?.transactions || [],
    total: transactionsData?.total || 0,
    isLoading,
    error,
  }
}

export function useUserStats() {
  const userId = useMemo(() => getStoredUserId(), [])

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({ queryKey: ['userStats', userId], queryFn: () => economyApi.getUserStats(userId), {
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  }})

  return {
    stats,
    isLoading,
    error,
  }
}

export function useActionCosts() {
  const {
    data: actionCosts,
    isLoading,
    error,
  } = useQuery({ queryKey: ['actionCosts'], queryFn: () => economyApi.getActionCosts(), {
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 2,
  }})

  return {
    actionCosts,
    isLoading,
    error,
  }
}

export function useDailyLogin() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])

  const dailyLoginMutation = useMutation({
    mutationFn: () => economyApi.claimDailyLogin(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
      notifySuccess(`Получено ${data.reward_amount} монет!`)
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка получения награды')
    },
  })

  return {
    claimDailyLogin: dailyLoginMutation.mutate,
    isClaiming: dailyLoginMutation.isPending,
  }
}

export function usePurchaseCoins() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])

  const purchaseMutation = useMutation({
    mutationFn: ({ packageId }: { packageId: string }) => economyApi.purchaseCoins(userId, packageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
      notifySuccess(`Куплено ${data.coins_added} монет!`)
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка покупки монет')
    },
  })

  return {
    purchaseCoins: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
  }
} 

// Баланс монет с умной резолюцией источника
// Приоритет: явное значение -> live кошелёк (useWallet) -> кэш allPets -> неизвестно
export function useCoinBalance(explicitCoins?: number) {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])

  // 1) Явное значение имеет приоритет
  const explicit = typeof explicitCoins === 'number' ? explicitCoins : undefined

  // 2) Live-кошелёк из /economy кошелька
  const { wallet } = useWallet()
  const liveCoins = typeof wallet?.coins === 'number' ? wallet!.coins : undefined

  // 3) Фолбэк: кэш из ['allPets', userId]
  const allPetsData: any = queryClient.getQueryData(['allPets', userId])
  const cachedCoins = typeof allPetsData?.wallet?.coins === 'number' ? allPetsData.wallet.coins : undefined

  const coins = explicit ?? liveCoins ?? cachedCoins

  const canAfford = (cost: number) => {
    if (typeof cost !== 'number' || Number.isNaN(cost)) return true
    if (typeof coins !== 'number') return true // неизвестно — не блокируем кнопку
    return coins >= cost
  }

  return { coins, canAfford }
}

// ====== РЫНОК / АУКЦИОНЫ ======

export function useAuctions(status: string = 'active', page: number = 1, pageSize: number = 20) {
  const { isConnected: isWebSocketConnected } = usePetWebSocket() // Проверяем подключение WebSocket

  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ['auctions', status, page, pageSize], 
    queryFn: () => marketApi.listAuctions({ status, page, page_size: pageSize }), 
    // Отключаем polling если WebSocket подключен - обновления придут через WebSocket
    refetchInterval: isWebSocketConnected ? false : 30000, // Обновляем раз в 30 секунд только если WS не подключен
    staleTime: isWebSocketConnected ? Infinity : 15000, // При WebSocket данные всегда свежие
    gcTime: 300000, // Cache for 5 минут
  })
  return { auctions: (data?.items || []) as Auction[], page: data?.page || page, pageSize: data?.page_size || pageSize, isLoading, error, refetch }
}

export function usePlaceBid() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])
  const mutation = useMutation({
    mutationFn: async ({ auctionId, amount }: { auctionId: number; amount: number }) => {
      let token = localStorage.getItem('auth_token')
      if (!token) {
        const username = localStorage.getItem('username') ?? undefined
        const res = await authApi.issueToken(userId, username)
        token = res.access_token
        localStorage.setItem('auth_token', token)
      }
      return marketApi.placeBid({ auction_id: auctionId, amount })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] })
      notifySuccess('Ставка принята')
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка ставки')
    },
  })
  return { placeBid: mutation.mutate, isPlacing: mutation.isPending }
}

export function useCreateAuction() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])
  const mutation = useMutation({
    mutationFn: async ({ petId, startPrice, durationSeconds, buyNowPrice }: { petId: number; startPrice: number; durationSeconds?: number; buyNowPrice?: number }) => {
      let token = localStorage.getItem('auth_token')
      if (!token) {
        const username = localStorage.getItem('username') ?? undefined
        const res = await authApi.issueToken(userId, username)
        token = res.access_token
        localStorage.setItem('auth_token', token)
      }
      return marketApi.createAuction({ pet_id: petId, start_price: startPrice, duration_seconds: durationSeconds, buy_now_price: buyNowPrice } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] })
      notifySuccess('Аукцион создан')
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка создания аукциона')
    },
  })
  return { createAuction: mutation.mutate, isCreating: mutation.isPending }
}

export function useBuyNow() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])
  const mutation = useMutation({
    mutationFn: async ({ auctionId }: { auctionId: number }) => {
      let token = localStorage.getItem('auth_token')
      if (!token) {
        const username = localStorage.getItem('username') ?? undefined
        const res = await authApi.issueToken(userId, username)
        token = res.access_token
        localStorage.setItem('auth_token', token)
      }
      return marketApi.buyNow({ auction_id: auctionId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] })
      notifySuccess('Покупка выполнена')
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка покупки')
    },
  })
  return { buyNow: mutation.mutate, isBuying: mutation.isPending }
}

