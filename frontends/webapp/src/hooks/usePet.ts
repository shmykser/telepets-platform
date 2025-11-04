import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, economyApi } from '@/lib/api'
import { getStoredUserId } from '@/utils'
import { useMemo } from 'react'

// Упрощенная версия без WebSocket
function notifySuccess(message: string) {
  console.log('Success:', message)
}

function notifyError(message: string) {
  console.error('Error:', message)
}

export function usePet() {
  const queryClient = useQueryClient()
  const userId = useMemo(() => getStoredUserId(), [])

  const {
    data: pet,
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['pet', userId], queryFn: () => petApi.getSummary(userId),
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    retry: 2,
    staleTime: 5000,
    gcTime: 60000,
  })

  const createPetMutation = useMutation({
    mutationFn: ({ name, override = false }: { name: string; override?: boolean }) => petApi.createPet(userId, name, override),
    onSuccess: (data) => {
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
        }
        const pets = Array.isArray(oldData.pets) ? [...oldData.pets, newPet] : [newPet]
        return {
          ...oldData,
          pets,
          total_pets: (oldData.total_pets || 0) + 1,
          alive_pets: (oldData.alive_pets || 0) + 1,
        }
      })
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
        const status = error?.response?.status
        const detail = error?.response?.data?.detail
        if (status === 400 && typeof detail === 'string') {
          throw new Error(detail)
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
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
      queryClient.invalidateQueries({ queryKey: ['pet', userId] })
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] })
      notifySuccess(data.message)
    },
    onError: (error: any) => {
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
        const data = await economyApi.resurrectPet(userIdLocal, petName)
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
      }
    },
    isCreating: createPetMutation.isPending,
    isHealthUpLoading: healthUpMutation.isPending,
    isHealthUpWithCostLoading: healthUpWithCostMutation.isPending,
  }
}

export function useAllPets() {
  const userId = useMemo(() => getStoredUserId(), [])

  const {
    data: petsData,
    isLoading,
    error,
  } = useQuery({ queryKey: ['allPets', userId], queryFn: () => petApi.getAllPets(userId),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    retry: 2,
    staleTime: 2000,
    gcTime: 300000,
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

