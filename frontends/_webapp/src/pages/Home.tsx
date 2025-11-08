import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import PetCarousel from '../../src_old/components/PetCarousel'
import { usePet, useAllPets } from '@/hooks/usePet'
import { useWallet, useActionCosts } from '@/hooks/useEconomy'
import { getStoredUserId } from '@/utils'
import { notifyError } from '@/components/Notification'
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced'
import QuickStatsEnhanced from '@/components/QuickStatsEnhanced'
import WelcomeEnhanced from '@/components/WelcomeEnhanced'
import AllDeadEnhanced from '@/components/AllDeadEnhanced'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function Home() {
  const alignedWidthClass = 'w-full max-w-[480px]';
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [petName, setPetName] = useState('')
  const [isCreatingPending, setIsCreatingPending] = useState(false)
  const [lastCreatedName, setLastCreatedName] = useState<string | null>(null)
  const prevPetsCountRef = useRef<number>(0)
  const [hadAliveAtCreate, setHadAliveAtCreate] = useState<boolean | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  
  const {
    pet,
    isLoading,
    error,
    createPet,
    healthUp,
    healthUpWithCost,
    resurrect,
    isCreating,
    isHealthUpLoading,
    isHealthUpWithCostLoading,
  } = usePet()

  // Открывать форму создания, если пришли со state.create=true
  useEffect(() => {
    const st: any = (location && (location as any).state) || {}
    if (st && st.create) {
      setShowCreateForm(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const { pets: allPets, isLoading: allLoading, wallet } = useAllPets()
  const { wallet: liveWallet } = useWallet()
  const { actionCosts } = useActionCosts()

  // Снимаем индикатор, когда появился созданный питомец/увеличился список
  useEffect(() => {
    if (!isCreatingPending) return
    if (lastCreatedName && Array.isArray(allPets) && allPets.some((p: any) => p.name === lastCreatedName)) {
      setIsCreatingPending(false)
      setLastCreatedName(null)
      setHadAliveAtCreate(null)
      return
    }
    if (Array.isArray(allPets) && allPets.length > prevPetsCountRef.current) {
      setIsCreatingPending(false)
      setLastCreatedName(null)
      setHadAliveAtCreate(null)
      return
    }
    if (hadAliveAtCreate === false && pet && pet.status === 'success') {
      setIsCreatingPending(false)
      setLastCreatedName(null)
      setHadAliveAtCreate(null)
    }
  }, [isCreatingPending, pet, allPets, lastCreatedName, hadAliveAtCreate])

  useEffect(() => {
    if (Array.isArray(allPets)) {
      prevPetsCountRef.current = allPets.length
    }
  }, [allPets?.length])

  const handleCreatePet = (override = false) => {
    if (!petName.trim()) {
      notifyError('Введите имя питомца')
      return
    }
    setIsCreatingPending(true)
    const name = petName.trim()
    setLastCreatedName(name)
    const hasAliveNow = Array.isArray(allPets) && allPets.some((p: any) => (p.status || p.life_status) !== 'dead')
    setHadAliveAtCreate(hasAliveNow)
    createPet({ name, override })
    setPetName('')
    setShowCreateForm(false)
  }

  const hasAnyData = (Array.isArray(allPets) && allPets.length > 0) || pet

  // Loading state
  if (isLoading && allLoading && !hasAnyData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="text-red-400" />
            <h3 className="text-xl font-bold text-white">Ошибка загрузки</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Не удалось загрузить информацию о питомце. Возможно, у вас еще нет питомца.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Создать питомца
          </button>
        </div>
        {showCreateForm && (
          <div className="mt-6">
            <CreatePetFormEnhanced
              petName={petName}
              setPetName={setPetName}
              onCreate={handleCreatePet}
              onCancel={() => setShowCreateForm(false)}
              isCreating={isCreating}
              canCreateFree={true}
              walletCoins={liveWallet?.coins ?? wallet?.coins}
              paidCost={(actionCosts?.action_costs as any)?.paid_pet ?? 500}
            />
          </div>
        )}
      </div>
    )
  }

  const hasPetsData = Array.isArray(allPets) && allPets.length > 0

  // No pets state
  if ((!pet || pet.status === 'no_pets') && !hasPetsData && !allLoading) {
    if (showCreateForm) {
      return (
        <div className="max-w-2xl mx-auto">
          <CreatePetFormEnhanced
            petName={petName}
            setPetName={setPetName}
            onCreate={handleCreatePet}
            onCancel={() => setShowCreateForm(false)}
            isCreating={isCreating}
            canCreateFree={true}
            walletCoins={liveWallet?.coins ?? wallet?.coins}
            paidCost={(actionCosts?.action_costs as any)?.paid_pet ?? 500}
          />
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto">
        <WelcomeEnhanced 
          onCreateClick={() => setShowCreateForm(true)} 
          message={pet?.message} 
        />
      </div>
    )
  }

  const allDead = pet?.status === 'all_dead'
  const hasAlive = Array.isArray(allPets) && allPets.some((p: any) => (p.status || p.life_status) !== 'dead')

  return (
    <div className="space-y-6">
      {/* All dead banner */}
      {allDead && !showCreateForm && !isCreatingPending && !hasAlive && (
        <div className="max-w-2xl mx-auto">
          <AllDeadEnhanced
            totals={{ total_pets: pet?.total_pets || 0, dead_pets: pet?.dead_pets || 0 }}
            message={pet?.message}
            onCreateClick={() => setShowCreateForm(true)}
          />
        </div>
      )}

      {/* Creating pending indicator */}
      {isCreatingPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 shadow-2xl">
            <LoadingSpinner size="lg" />
            <p className="text-white mt-4 text-lg font-semibold">Создаём питомца…</p>
          </div>
        </div>
      )}

      {/* Create Pet Form */}
      {showCreateForm && (
        <div className="max-w-2xl mx-auto">
          <CreatePetFormEnhanced
            petName={petName}
            setPetName={setPetName}
            onCreate={handleCreatePet}
            onCancel={() => setShowCreateForm(false)}
            isCreating={isCreating}
            canCreateFree={(() => {
              const alive = allPets.filter((p: any) => p.status !== 'dead')
              return alive.length === 0 || alive.every((p: any) => p.state === 'adult')
            })()}
            walletCoins={liveWallet?.coins ?? wallet?.coins}
            paidCost={(actionCosts?.action_costs as any)?.paid_pet ?? 500}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex justify-center">
        <QuickStatsEnhanced
          stats={{
            totalPets: pet?.total_pets || (hasPetsData ? allPets.length : 0) || 0,
            alivePets: pet?.alive_pets || (hasPetsData ? allPets.filter((p: any) => (p.status || p.life_status) !== 'dead').length : 0) || 0,
            deadPets: pet?.dead_pets || (hasPetsData ? allPets.filter((p: any) => (p.status || p.life_status) === 'dead').length : 0) || 0,
            coins: pet?.wallet?.coins || liveWallet?.coins || wallet?.coins || 0,
          }}
          columns={4}
          className={alignedWidthClass}
        />
      </div>

      {/* Pet Carousel - using old component temporarily */}
      {!allLoading && hasPetsData && (
        <div className="flex justify-center">
          <div className={alignedWidthClass}>
            <PetCarousel
              pets={allPets}
              onSelect={() => {}}
              onHealthUp={(name) => healthUp(name)}
              onHealthUpWithCost={(name) => healthUpWithCost(name)}
              onResurrect={(name) => resurrect(name)}
              isHealthUpLoading={isHealthUpLoading}
              isHealthUpWithCostLoading={isHealthUpWithCostLoading}
              walletCoins={liveWallet?.coins ?? wallet?.coins}
              actionCosts={actionCosts?.action_costs as any}
            />
          </div>
        </div>
      )}
    </div>
  )
}
