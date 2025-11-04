import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  Coins, 
  History, 
  Settings, 
  User,
  Store
} from 'lucide-react'
import Dock, { DockItemData } from './Dock'
import { useAllPets } from '@/hooks/usePet'

interface LayoutNewProps {
  children: React.ReactNode
}

export default function LayoutNew({ children }: LayoutNewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  useAllPets()

  const dockItems: DockItemData[] = [
    { 
      icon: <Home className="w-6 h-6" />, 
      label: 'Главная', 
      onClick: () => navigate('/') 
    },
    { 
      icon: <Store className="w-6 h-6" />, 
      label: 'Рынок', 
      onClick: () => navigate('/market') 
    },
    { 
      icon: <Coins className="w-6 h-6" />, 
      label: 'Экономика', 
      onClick: () => navigate('/economy') 
    },
    { 
      icon: <History className="w-6 h-6" />, 
      label: 'История', 
      onClick: () => navigate('/history') 
    },
    { 
      icon: <User className="w-6 h-6" />, 
      label: 'Админка', 
      onClick: () => navigate('/admin') 
    },
    { 
      icon: <Settings className="w-6 h-6" />, 
      label: 'Настройки', 
      onClick: () => navigate('/settings') 
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] relative">
      {/* Main content with padding for dock */}
      <main className="pb-24 px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Dock navigation */}
      <Dock items={dockItems} />
    </div>
  )
}
