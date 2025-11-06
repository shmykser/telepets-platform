import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarousel from '@/components/PetCarousel';
import QuickStatsVariants from '@/components/QuickStatsVariants';
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced';
import DialogEnhanced from '@/components/DialogEnhanced';
import Header from '@/components/Header';
import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId } from '@/utils';

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
  const [headerHeight, setHeaderHeight] = useState(56); // Начальная высота Header

  // Измеряем высоту QuickStatsVariants и Header
  useLayoutEffect(() => {
    const updateHeights = () => {
      if (statsRef.current) {
        const height = statsRef.current.getBoundingClientRect().height;
        setStatsHeight(height);
      }
      
      // Измеряем реальную высоту Header (включая safe area)
      const headerElement = document.querySelector('header');
      if (headerElement) {
        const height = headerElement.getBoundingClientRect().height;
        setHeaderHeight(height);
      }
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, [totalPets, alivePets, deadPets, wallet?.coins]);

  // Расчет размеров карусели с учетом всех элементов
  useLayoutEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isIPadPro = width >= 1024 && width < 1280 && viewportHeight > 1000;
      
      // Получаем Telegram content safe area insets (для учета UI элементов Telegram)
      // Используем Telegram WebApp API, если доступно, иначе fallback на стандартные safe area
      let tgContentSafeAreaTop = 0;
      let tgContentSafeAreaBottom = 0;
      
      if (typeof window !== 'undefined') {
        // Пытаемся получить из Telegram WebApp API
        const tgWebApp = (window as any).Telegram?.WebApp;
        if (tgWebApp?.contentSafeAreaInset) {
          tgContentSafeAreaTop = tgWebApp.contentSafeAreaInset.top || 0;
          tgContentSafeAreaBottom = tgWebApp.contentSafeAreaInset.bottom || 0;
        } else {
          // Fallback: пытаемся получить из CSS переменных или стандартных safe area
          const rootStyle = getComputedStyle(document.documentElement);
          tgContentSafeAreaTop = parseInt(
            rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || 
            rootStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 
            10
          );
          tgContentSafeAreaBottom = parseInt(
            rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom') || 
            rootStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 
            10
          );
        }
      }
      
      // Высота Dock (адаптивная)
      const dockHeightValue = width < 640 ? 60 : 72;
      const dockBottomOffset = width < 640 ? 8 : 16;
      const totalDockHeight = dockHeightValue + dockBottomOffset + tgContentSafeAreaBottom;
      
      // Сохраняем высоту дока для использования в стилях
      setDockHeight(totalDockHeight);
      
      // Используем измеренную высоту Header (уже включает Telegram content safe area)
      // Если еще не измерена, используем примерное значение
      const effectiveHeaderHeight = headerHeight || (width < 640 ? 56 : width < 1024 ? 60 : 64);
      
      // Отступы
      const paddingX = width < 640 ? 16 : 24;
      const gapBetweenSections = width < 640 ? 6 : width < 1024 ? 8 : 12;
      
      // Высота верхней секции (QuickStats + отступы)
      const topSectionHeight = statsHeight + gapBetweenSections;
      
      // Высота индикаторов карусели (примерно 24px: 8px высота + 8px padding сверху + 8px padding снизу)
      const indicatorsHeight = 24;
      
      // Доступная высота для карусели (учитываем Header, QuickStats, Dock и индикаторы)
      const availableHeight = viewportHeight - effectiveHeaderHeight - topSectionHeight - totalDockHeight - indicatorsHeight;
      
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
    
    // Обработка изменения размеров окна
    window.addEventListener('resize', updateSizes);
    
    // Обработка изменения Telegram content safe area (если доступно)
    const tgWebApp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tgWebApp) {
      tgWebApp.onEvent('contentSafeAreaChanged', updateSizes);
    }
    
    return () => {
      window.removeEventListener('resize', updateSizes);
      if (tgWebApp) {
        tgWebApp.offEvent('contentSafeAreaChanged', updateSizes);
      }
    };
  }, [statsHeight, headerHeight]);

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
      {/* Header с кнопкой "Создать питомца" */}
      <Header onCreatePet={() => setIsCreateModalOpen(true)} />
      
      <div 
        className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6" 
        style={{ 
          paddingTop: `${headerHeight}px`
        }}
      >
        {/* Верхняя секция: быстрые статусы */}
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
            variant={1}
          />
        </div>

        {/* Карусель питомцев - занимает все доступное пространство */}
        <div 
          className="flex-1 flex items-center justify-center min-h-0 overflow-hidden"
          style={{ 
            paddingBottom: `${dockHeight}px` 
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
