import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarousel from '@/components/PetCarousel';
import QuickStatsVariants from '@/components/QuickStatsVariants';
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId, isTelegramWebApp, getTelegramHeaderHeight } from '@/utils';

export default function Home() {
  const { pets, totalPets, alivePets, deadPets, isLoading, wallet } = useAllPets();
  const { healthUp, healthUpWithCost, resurrect, createPet, isCreating } = usePet();
  const userId = useMemo(() => getStoredUserId(), []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [petName, setPetName] = useState('');

  // Refs для измерения высоты элементов
  const statsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Адаптивные размеры для карусели
  const [carouselSizes, setCarouselSizes] = useState({ baseWidth: 380, cardHeight: 500 });
  const [statsHeight, setStatsHeight] = useState(0);
  const [dockHeight, setDockHeight] = useState(0);

  // Измеряем высоту QuickStatsVariants
  useLayoutEffect(() => {
    const updateStatsHeight = () => {
      if (statsRef.current) {
        const height = statsRef.current.getBoundingClientRect().height;
        setStatsHeight(height);
      }
    };

    updateStatsHeight();
    window.addEventListener('resize', updateStatsHeight);
    return () => window.removeEventListener('resize', updateStatsHeight);
  }, [totalPets, alivePets, deadPets, wallet?.coins]);

  // Расчет размеров карусели с учетом всех элементов
  useLayoutEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isIPadPro = width >= 1024 && width < 1280 && viewportHeight > 1000;
      
      // Учитываем safe-area-insets для Telegram WebApp
      const safeAreaTop = typeof window !== 'undefined' 
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) 
        : 0;
      const safeAreaBottom = typeof window !== 'undefined' 
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10) 
        : 0;
      
      // Высота header Telegram WebApp (если открыто в Telegram)
      const telegramHeaderHeight = isTelegramWebApp() ? getTelegramHeaderHeight() : 0;
      
      // Высота Dock (адаптивная)
      const dockHeightValue = width < 640 ? 60 : 72;
      const dockBottomOffset = width < 640 ? 8 : 16;
      const totalDockHeight = dockHeightValue + dockBottomOffset + safeAreaBottom;
      
      // Сохраняем высоту дока для использования в стилях
      setDockHeight(totalDockHeight);
      
      // Отступы: safe-area-top + высота header Telegram (если в Telegram WebApp)
      const paddingTop = safeAreaTop + telegramHeaderHeight;
      const paddingX = width < 640 ? 16 : 24;
      const gapBetweenSections = width < 640 ? 6 : width < 1024 ? 8 : 12;
      
      // Высота верхней секции (QuickStats + отступы)
      const topSectionHeight = statsHeight + gapBetweenSections;
      
      // Высота индикаторов карусели (примерно 24px: 8px высота + 8px padding сверху + 8px padding снизу)
      const indicatorsHeight = 24;
      
      // Доступная высота для карусели (учитываем индикаторы, чтобы они не скрывались за доком)
      const availableHeight = viewportHeight - paddingTop - topSectionHeight - totalDockHeight - indicatorsHeight;
      
      if (width < 640) {
        // Мобильные устройства (< 640px)
        setCarouselSizes({ 
          baseWidth: width - paddingX * 2,
          cardHeight: Math.max(300, availableHeight) // Минимальная высота 300px
        });
      } else if (width >= 640 && width < 1024) {
        // Планшеты (640px - 1023px)
        setCarouselSizes({ 
          baseWidth: width - paddingX * 2,
          cardHeight: Math.max(400, availableHeight)
        });
      } else if (isIPadPro) {
        // iPad Pro (1024px ширина, высота > 1000px)
        setCarouselSizes({ 
          baseWidth: Math.min(700, width - paddingX * 2),
          cardHeight: Math.max(500, availableHeight)
        });
      } else if (width >= 1024 && width < 1280) {
        // Небольшие десктопы (1024px - 1279px, но не iPad Pro)
        setCarouselSizes({ 
          baseWidth: 420,
          cardHeight: Math.max(400, availableHeight)
        });
      } else {
        // Большие десктопы (>= 1280px)
        setCarouselSizes({ 
          baseWidth: 480,
          cardHeight: Math.max(450, availableHeight)
        });
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [statsHeight]);

  // Подготовка данных питомцев с изображениями
  // Мемоизируем с стабильными ссылками на изображения
  const transformedPets: Pet[] = useMemo(() => {
    return pets.map(pet => {
      // Используем существующий image_url если он есть, иначе генерируем
      const imageUrl = pet.image_url || (pet.name && userId 
        ? buildUrl.petImage(userId, pet.name) + (pet.state ? `?stage=${pet.state}` : '')
        : undefined);
      
      return {
        ...pet,
        image_url: imageUrl
      };
    });
  }, [pets, userId]);

  // Обработчики действий
  const handleHealthUp = (pet: Pet) => {
    if (pet.name) {
    healthUp(pet.name);
    }
  };

  const handleHealthUpWithCost = (pet: Pet) => {
    if (pet.name) {
    healthUpWithCost(pet.name);
    }
  };

  const handlePlay = (pet: Pet) => {
    console.log('Play with pet:', pet.name);
  };

  const handlePetSelect = (pet: Pet) => {
    console.log('Selected pet:', pet.name);
  };

  const handleResurrect = (pet: Pet) => {
    if (pet.name) {
      resurrect(pet.name);
    }
  };

  const handleCreatePet = (override?: boolean) => {
    if (petName.trim()) {
      createPet({ name: petName.trim(), override: override || false });
      setPetName('');
      setIsCreateModalOpen(false);
    }
  };

  const handleCancelCreate = () => {
    setPetName('');
    setIsCreateModalOpen(false);
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="h-dvh bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] flex items-center justify-center px-4 overflow-hidden">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Пустое состояние
  if (!totalPets || transformedPets.length === 0) {
    return (
      <div className="h-dvh bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] flex items-center justify-center px-4 overflow-hidden">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Нет питомцев</h2>
          <p className="text-gray-400">Создайте своего первого питомца</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-dvh bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] overflow-hidden flex flex-col"
      style={{ 
        maxWidth: '100vw',
        height: '100dvh', // Fallback для браузеров без поддержки dvh
        minHeight: '-webkit-fill-available' // Fallback для Safari
      }}
    >
      <div 
        className="flex-1 flex flex-col px-4 sm:px-6" 
        style={{ 
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isTelegramWebApp() ? getTelegramHeaderHeight() : 0}px)`,
          overflowX: 'hidden',
          overflowY: 'visible'
        }}
      >
        {/* Верхняя секция: быстрые статусы и кнопка создания */}
        <div 
          ref={statsRef}
          className="flex-shrink-0 mb-1.5 sm:mb-2 md:mb-3"
        >
          <QuickStatsVariants
            stats={{
              totalPets: totalPets || 0,
              alivePets: alivePets || 0,
              deadPets: deadPets || 0,
              coins: wallet?.coins || 0
            }}
            onCreatePet={() => setIsCreateModalOpen(true)}
            variant={1}
          />
        </div>

        {/* Карусель питомцев - занимает все доступное пространство */}
        <div 
          className="flex-1 flex items-center justify-center min-h-0"
          style={{ 
            paddingBottom: `${dockHeight}px`,
            overflowY: 'visible',
            overflowX: 'hidden'
          }}
        >
          <PetCarousel
            pets={transformedPets}
            onPetSelect={handlePetSelect}
            onHealthUp={handleHealthUp}
            onHealthUpWithCost={handleHealthUpWithCost}
            onPlay={handlePlay}
            onResurrect={handleResurrect}
            wallet={wallet}
            resurrectCost={500}
            baseWidth={carouselSizes?.baseWidth ?? 380}
            cardHeight={carouselSizes?.cardHeight ?? 500}
            autoplay={false}
            pauseOnHover={true}
            loop={false}
            showIndicators={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Модальное окно создания питомца */}
      <DialogEnhanced
        open={isCreateModalOpen}
        onClose={handleCancelCreate}
        variant="glass"
        size="md"
      >
        <CreatePetFormEnhanced
          petName={petName}
          setPetName={setPetName}
          onCreate={handleCreatePet}
          onCancel={handleCancelCreate}
          isCreating={isCreating}
          canCreateFree={true}
          walletCoins={wallet?.coins}
          paidCost={0}
        />
      </DialogEnhanced>
    </div>
  );
}
