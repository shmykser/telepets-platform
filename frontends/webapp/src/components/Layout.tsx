import { useNavigate, useLocation } from 'react-router-dom';
import Dock from './Dock';
import ClickSpark from './ClickSpark';
import { Home, Store, Coins, History, User, Settings } from 'lucide-react';
import type { DockItemData } from './Dock';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const dockItems: DockItemData[] = [
    {
      icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Главная',
      onClick: () => navigate('/')
    },
    {
      icon: <Store className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Рынок',
      onClick: () => navigate('/market')
    },
    {
      icon: <Coins className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Экономика',
      onClick: () => navigate('/economy')
    },
    {
      icon: <History className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'История',
      onClick: () => navigate('/history')
    },
    {
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Админка',
      onClick: () => navigate('/admin')
    },
    {
      icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Настройки',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="min-h-screen" style={{ position: 'relative' }}>
      {/* Глобальный эффект вспышек при кликах */}
      <ClickSpark />
      {children}
      <Dock items={dockItems} />
    </div>
  );
}

