import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { petApi } from '@/lib/api'
import type { Pet } from '@/types'
import { getStoredUserId } from '@/utils'
import { notifyError, notifySuccess } from '@/components/Notification'

interface ApplyArgs {
  actionKey: string
  value?: number
  metadata?: Record<string, unknown>
  successMessage?: string
}

export function useCharacteristicAction(pet?: Pet) {
  const userId = useMemo(() => getStoredUserId(), [])

  const mutation = useMutation({
    mutationFn: async ({ actionKey, value, metadata }: ApplyArgs) => {
      if (!pet?.id) {
        throw new Error('Питомец не найден')
      }
      if (!userId) {
        throw new Error('user_id отсутствует')
      }
      return petApi.applyCharacteristicAction(userId, pet.id, {
        action_key: actionKey,
        value,
        metadata,
      })
    },
    onSuccess: (_data, variables) => {
      if (variables.successMessage) {
        notifySuccess(variables.successMessage)
      }
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || error?.message || 'Ошибка обновления характеристики'
      notifyError(detail)
    },
  })

  return mutation
}

