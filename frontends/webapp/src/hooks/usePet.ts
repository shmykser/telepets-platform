import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, economyApi } from '@/lib/api'
import { getStoredUserId } from '@/utils'
import { useMemo, useState } from 'react'
import { usePetWebSocket } from './usePetWebSocket'
import { notifySuccess, notifyError } from '@/components/Notification'

export function usePet() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])
  const { isConnected: isWebSocketConnected } = usePetWebSocket()
  const [isResurrecting, setIsResurrecting] = useState(false)

  const {
    data: pet,
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['pet', userId], queryFn: () => petApi.getSummary(userId),
    // Отключаем polling если WebSocket подключен
    refetchInterval: isWebSocketConnected ? false : 10000, // Refetch every 10 seconds только если WS не подключен
    refetchIntervalInBackground: false,
    retry: 2,
    // При WebSocket данные всегда свежие, увеличиваем staleTime
    staleTime: isWebSocketConnected ? Infinity : 5000, // Data is fresh for 5 seconds
    gcTime: 60000, // Cache for 1 minute
  })

  const createPetMutation = useMutation({
    mutationFn: ({ name, override = false }: { name: string; override?: boolean }) => petApi.createPet(userId, name, override),
    onSuccess: (data) => {
      // Мгновенно добавляем питомца в список для карусели
      queryClient.setQueryData({ queryKey: ['allPets', userId] }, (oldData: any) => {
        if (!oldData) return oldData
        const createdAt = new Date().toISOString()
        const newPet = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          state: (data.state as any) || 'egg',
          health: data.health,
          image_url: data.image_url,
          status: 'alive',
          created_at: createdAt,
          updated_at: createdAt,
          wallet: data.wallet,
          total_pets: oldData.total_pets, // не используется на уровне элемента
        }
        const pets = Array.isArray(oldData.pets) ? [...oldData.pets, newPet] : [newPet]
        return {
          ...oldData,
          pets,
          total_pets: (oldData.total_pets || 0) + 1,
          alive_pets: (oldData.alive_pets || 0) + 1,
        }
      })
      // Актуализируем агрегаты и кошелёк с сервера
      queryClient.invalidateQueries({ queryKey: ['pet', userId] })
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
      notifySuccess('Питомец создан!')
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка создания питомца')
    },
  })

  const healthUpMutation = useMutation({
    mutationFn: (petName?: string) => petApi.healthUp(userId, petName),
    onSuccess: (data, variables) => {
      // Мгновенно обновляем список питомцев (карусель) без ожидания refetch
      queryClient.setQueryData({ queryKey: ['allPets', userId] }, (oldData: any) => {
        if (!oldData?.pets) return oldData
        const updatedPets = oldData.pets.map((p: any) => {
          if (p.id === data.pet_id || (variables && p.name === variables)) {
            return {
              ...p,
              health: data.health,
              state: data.stage || p.state,
              updated_at: new Date().toISOString(),
            }
          }
          return p
        })
        return { ...oldData, pets: updatedPets }
      })
      // Агрегированное резюме обновим через refetch
      queryClient.invalidateQueries({ queryKey: ['pet', userId] })
      notifySuccess(data.message)
    },
    onError: (error: any) => {
      notifyError(error.response?.data?.detail || 'Ошибка увеличения здоровья')
    },
  })

  const healthUpWithCostMutation = useMutation({
    mutationFn: async (petName?: string) => {
      try {
        return await petApi.healthUpWithCost(userId, petName)
      } catch (error: any) {
        // Локально обработаем 400, чтобы не бросать в консоль
        const status = error?.response?.status
        const detail = error?.response?.data?.detail
        if (status === 400 && typeof detail === 'string') {
          throw new Error(detail)
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Мгновенное обновление карточек
      queryClient.setQueryData({ queryKey: ['allPets', userId] }, (oldData: any) => {
        if (!oldData?.pets) return oldData
        const updatedPets = oldData.pets.map((p: any) => {
          if (p.id === data.pet_id || (variables && p.name === variables)) {
            return {
              ...p,
              health: data.health,
              state: data.stage || p.state,
              updated_at: new Date().toISOString(),
            }
          }
          return p
        })
        return { ...oldData, pets: updatedPets }
      })
      // Баланс и агрегаты подтянем отдельными инвалидациями
      queryClient.invalidateQueries({ queryKey: ['pet', userId] })
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
      notifySuccess(data.message)
    },
    onError: (error: any) => {
      // Локальный UX: покажем текст, но без бросания ошибки наружу
      const detail = error?.message || error?.response?.data?.detail
      notifyError(detail || 'Ошибка увеличения здоровья')
    },
  })

  return {
    pet,
    isLoading,
    error,
    refetch,
    createPet: createPetMutation.mutate,
    healthUp: healthUpMutation.mutate,
    healthUpWithCost: healthUpWithCostMutation.mutate,
    resurrect: async (petName: string) => {
      const userIdLocal = userId
      try {
        setIsResurrecting(true)
        const data = await economyApi.resurrectPet(userIdLocal, petName)
        // Обновляем allPets и wallet
        queryClient.setQueryData({ queryKey: ['allPets', userIdLocal] }, (oldData: any) => {
          if (!oldData?.pets) return oldData
          const updatedPets = oldData.pets.map((p: any) => {
            if (p.name === petName) {
              return { ...p, status: 'alive', health: data.pet.health, updated_at: new Date().toISOString() }
            }
            return p
          })
          return { ...oldData, pets: updatedPets }
        })
        queryClient.invalidateQueries({ queryKey: ['wallet', userIdLocal] })
        notifySuccess('Питомец воскрешен')
      } catch (e: any) {
        notifyError(e?.response?.data?.detail || e?.message || 'Ошибка воскрешения')
      } finally {
        setIsResurrecting(false)
      }
    },
    isCreating: createPetMutation.isPending,
    isHealthUpLoading: healthUpMutation.isPending,
    isHealthUpWithCostLoading: healthUpWithCostMutation.isPending,
    isResurrecting,
  }
}

export function useAllPets() {
  const userId = useMemo(() => getStoredUserId(), [])
  const { isConnected: isWebSocketConnected } = usePetWebSocket()

  const {
    data: petsData,
    isLoading,
    error,
  } = useQuery({ queryKey: ['allPets', userId], queryFn: () => petApi.getAllPets(userId),
    // Отключаем polling если WebSocket подключен - обновления придут мгновенно
    refetchInterval: isWebSocketConnected ? false : 5000, // Refetch every 5 seconds только если WS не подключен
    refetchIntervalInBackground: false, // Не опрашиваем в фоне даже без WS
    retry: 2,
    // При WebSocket данные всегда свежие
    staleTime: isWebSocketConnected ? Infinity : 2000, // Data is fresh for 2 seconds
    gcTime: 300000, // Cache for 5 минут
  })

  return {
    pets: petsData?.pets || [],
    wallet: petsData?.wallet,
    totalPets: petsData?.total_pets || 0,
    alivePets: petsData?.alive_pets || 0,
    deadPets: petsData?.dead_pets || 0,
    isLoading,
    error,
  }
}

