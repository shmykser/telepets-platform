import { useNavigate, useLocation } from 'react-router-dom';
import Dock from './Dock';
import ClickSpark from './ClickSpark';
import Header from './Header';
import { Home, Store, Coins, History, User, Settings } from 'lucide-react';
import type { DockItemData } from './Dock';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const dockItems: DockItemData[] = [
    {
      icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Главная',
      onClick: () => navigate('/')
    },
    {
      icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Рынок',
      onClick: () => navigate('/market')
    },
    {
      icon: <Coins className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Экономика',
      onClick: () => navigate('/economy')
    },
    {
      icon: <History className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'История',
      onClick: () => navigate('/history')
    },
    {
      icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Админка',
      onClick: () => navigate('/admin')
    },
    {
      icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Настройки',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="min-h-screen" style={{ position: 'relative' }}>
      {/* Глобальный эффект вспышек при кликах */}
      <ClickSpark />
      {/* Header будет рендериться только на странице Home через children */}
      {children}
      <Dock items={dockItems} />
    </div>
  );
}

