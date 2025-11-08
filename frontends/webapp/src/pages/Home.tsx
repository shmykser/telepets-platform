import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarousel from '@/components/PetCarousel';
import QuickStatsVariants from '@/components/QuickStatsVariants';
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced';
import DialogEnhanced from '@/components/DialogEnhanced';
import StackAndText from '@/components/StackAndText';
import Header from '@/components/Header';
import type { Pet } from '@/types';
import type { StackCard } from '@/components/Stack';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId } from '@/utils';
import { isTelegramWebApp } from '@/utils/telegram';
import { getAvailableStages, formatCreatureJson } from '@/utils/petUtils';

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const calculateCarouselBaseWidth = (viewportWidth: number, availableWidth: number): number => {
  if (viewportWidth < 640) {
    return availableWidth;
  }

  if (viewportWidth < 1024) {
    const target = clampValue(viewportWidth * 0.85, 420, 640);
    return Math.min(availableWidth, target);
  }

  if (viewportWidth < 1440) {
    const target = clampValue(viewportWidth * 0.5, 440, 700);
    return Math.min(availableWidth, target);
  }

  const target = clampValue(viewportWidth * 0.45, 520, 760);
  return Math.min(availableWidth, target);
};

export default function Home() {
  const { pets, totalPets, alivePets, deadPets, isLoading, wallet } = useAllPets();
  const {
    healthUp,
    healthUpWithCost,
    resurrect,
    createPet,
    isCreating,
    isHealthUpLoading,
    isHealthUpWithCostLoading,
    isResurrecting
  } = usePet();
  const userId = useMemo(() => getStoredUserId(), []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [petName, setPetName] = useState('');
  const [selectedPetForStack, setSelectedPetForStack] = useState<Pet | null>(null);

  // Refs для измерения высоты элементов
  const statsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Адаптивные размеры для карусели
  const [carouselSizes, setCarouselSizes] = useState({ baseWidth: 380, cardHeight: 500 });
  const [statsHeight, setStatsHeight] = useState(0);
  const [dockHeight, setDockHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(56); // Начальная высота Header
  const [tgContentSafeAreaBottom, setTgContentSafeAreaBottom] = useState(0); // Telegram content safe area снизу
  // Инициализируем отступы на основе текущей ширины экрана (работает и в браузере, и в Telegram)
  const getInitialPadding = () => {
    if (typeof window === 'undefined') return 6;
    return window.innerWidth < 640 ? 6 : 8;
  };
  const [containerPaddingX, setContainerPaddingX] = useState(getInitialPadding()); // Отступы контейнера (адаптивные)

  // Инициализация Telegram WebApp и получение content safe area
  useEffect(() => {
    const initTelegramSafeArea = () => {
      if (typeof window === 'undefined') return;
      
      const tgWebApp = (window as any).Telegram?.WebApp;
      if (tgWebApp) {
        // Получаем content safe area из Telegram WebApp API
        if (tgWebApp.contentSafeAreaInset) {
          setTgContentSafeAreaBottom(tgWebApp.contentSafeAreaInset.bottom || 0);
        }
        
        // Подписываемся на изменения content safe area
        const handleContentSafeAreaChanged = () => {
          if (tgWebApp.contentSafeAreaInset) {
            setTgContentSafeAreaBottom(tgWebApp.contentSafeAreaInset.bottom || 0);
          }
        };
        
        tgWebApp.onEvent('contentSafeAreaChanged', handleContentSafeAreaChanged);
        
        return () => {
          tgWebApp.offEvent('contentSafeAreaChanged', handleContentSafeAreaChanged);
        };
      } else {
        // Если Telegram WebApp API еще не загружен, пытаемся получить из CSS переменных
        const rootStyle = getComputedStyle(document.documentElement);
        const tgContentBottom = rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom').trim();
        if (tgContentBottom) {
          setTgContentSafeAreaBottom(parseInt(tgContentBottom, 10) || 0);
        }
      }
    };

    // Пытаемся инициализировать сразу
    initTelegramSafeArea();
    
    // Также пытаемся инициализировать после небольшой задержки (на случай, если API еще не загружен)
    const timeoutId = setTimeout(initTelegramSafeArea, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Блокировка вертикальной прокрутки в Telegram WebApp
  useEffect(() => {
    if (!isTelegramWebApp()) {
      return; // В обычном браузере не нужна блокировка
    }

    const touchData = new Map<number, { startY: number; startX: number }>();

    const handleTouchStart = (e: TouchEvent) => {
      // Сохраняем начальные координаты для каждого касания
      Array.from(e.touches).forEach(touch => {
        touchData.set(touch.identifier, {
          startY: touch.clientY,
          startX: touch.clientX
        });
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Блокируем вертикальные свайпы, разрешаем горизонтальные для карусели
      Array.from(e.changedTouches).forEach(touch => {
        const data = touchData.get(touch.identifier);
        if (!data) return;

        const target = e.target as HTMLElement;
        
        // Проверяем, не является ли элемент частью карусели (где нужны горизонтальные свайпы)
        const isCarouselElement = target.closest('[data-carousel]') || 
                                  target.closest('.carousel-container') ||
                                  target.closest('[class*="carousel"]');
        
        const deltaY = Math.abs(touch.clientY - data.startY);
        const deltaX = Math.abs(touch.clientX - data.startX);
        
        if (isCarouselElement) {
          // Для карусели блокируем только если вертикальное движение значительно больше горизонтального
          if (deltaY > deltaX && deltaY > 15) {
            e.preventDefault();
          }
        } else {
          // Для всех остальных элементов блокируем вертикальные свайпы
          if (deltaY > deltaX && deltaY > 5) {
            e.preventDefault();
          }
        }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Удаляем данные о касаниях
      Array.from(e.changedTouches).forEach(touch => {
        touchData.delete(touch.identifier);
      });
    };

    // Блокируем прокрутку колесиком мыши
    const preventWheelScroll = (e: WheelEvent) => {
      // Разрешаем горизонтальную прокрутку для карусели
      const target = e.target as HTMLElement;
      const isCarouselElement = target.closest('[data-carousel]') || 
                                target.closest('.carousel-container') ||
                                target.closest('[class*="carousel"]');
      
      if (!isCarouselElement && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
      }
    };

    // Добавляем обработчики
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    document.addEventListener('wheel', preventWheelScroll, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('wheel', preventWheelScroll);
      touchData.clear();
    };
  }, []);

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
  }, [totalPets, alivePets, deadPets, wallet?.coins, carouselSizes.baseWidth]);

  // Расчет размеров карусели с учетом всех элементов
  // Этот эффект работает одинаково и в браузере, и в Telegram
  useLayoutEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isIPadPro = width >= 1024 && width < 1280 && viewportHeight > 1000;
      
      // Сразу устанавливаем отступы (работает и в браузере, и в Telegram)
      const containerPaddingXValue = width < 640 ? 6 : 8; // Было 16/24, стало 6/8
      setContainerPaddingX(containerPaddingXValue);
      
      // Получаем Telegram content safe area insets (для учета UI элементов Telegram)
      // Используем Telegram WebApp API, если доступно, иначе fallback на стандартные safe area
      let tgContentSafeAreaTop = 0;
      let tgContentSafeAreaBottomValue = 0;
      
      if (typeof window !== 'undefined') {
        // Пытаемся получить из Telegram WebApp API
        const tgWebApp = (window as any).Telegram?.WebApp;
        if (tgWebApp?.contentSafeAreaInset) {
          // Используем Telegram WebApp API (приоритетный способ)
          tgContentSafeAreaTop = tgWebApp.contentSafeAreaInset.top || 0;
          tgContentSafeAreaBottomValue = tgWebApp.contentSafeAreaInset.bottom || 0;
        } else {
          // Fallback: пытаемся получить из CSS переменных, которые Telegram устанавливает
          const rootStyle = getComputedStyle(document.documentElement);
          
          // Пытаемся получить Telegram content safe area из CSS переменных
          const tgContentTop = rootStyle.getPropertyValue('--tg-content-safe-area-inset-top').trim();
          const tgContentBottom = rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom').trim();
          
          if (tgContentTop) {
            tgContentSafeAreaTop = parseInt(tgContentTop, 10) || 0;
          } else {
            // Если Telegram переменных нет, используем стандартные safe area
            tgContentSafeAreaTop = parseInt(
              rootStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 
              10
            );
          }
          
          if (tgContentBottom) {
            tgContentSafeAreaBottomValue = parseInt(tgContentBottom, 10) || 0;
          } else {
            // Если Telegram переменных нет, используем стандартные safe area
            tgContentSafeAreaBottomValue = parseInt(
              rootStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 
              10
            );
          }
        }
      }
      
      // Сохраняем Telegram content safe area bottom для использования в стилях
      setTgContentSafeAreaBottom(tgContentSafeAreaBottomValue);
      
      // Высота Dock (адаптивная) - НЕ включаем tgContentSafeAreaBottom, так как Dock сам учитывает его в позиционировании
      const dockHeightValue = width < 640 ? 60 : 72;
      const dockBottomOffset = width < 640 ? 8 : 16;
      const totalDockHeight = dockHeightValue + dockBottomOffset;
      
      // Сохраняем высоту дока для использования в стилях
      setDockHeight(totalDockHeight);
      
      // Используем измеренную высоту Header (уже включает Telegram content safe area)
      // Если еще не измерена, используем примерное значение
      const effectiveHeaderHeight = headerHeight || (width < 640 ? 56 : width < 1024 ? 60 : 64);
      
      // Для карусели используем еще меньшие отступы (внутренний padding карусели убран)
      const carouselPaddingX = 0; // Убираем внутренний padding карусели
      const gapBetweenSections = width < 640 ? 6 : width < 1024 ? 8 : 12;
      
      // Высота верхней секции (QuickStats + отступы)
      const topSectionHeight = statsHeight + gapBetweenSections;
      
      // Высота индикаторов карусели (примерно 24px: 8px высота + 8px padding сверху + 8px padding снизу)
      const indicatorsHeight = 24;
      
      // Доступная высота для карусели (учитываем Header, QuickStats, Dock, индикаторы и Telegram content safe area снизу)
      // Telegram content safe area снизу будет учтен в paddingBottom контейнера карусели
      const availableHeight = viewportHeight - effectiveHeaderHeight - topSectionHeight - totalDockHeight - indicatorsHeight - tgContentSafeAreaBottomValue;
      
      // Ширина карусели = ширина экрана - padding контейнера - padding карусели
      const carouselWidth = width - containerPaddingXValue * 2 - carouselPaddingX * 2;
      
      const baseWidth = calculateCarouselBaseWidth(width, carouselWidth);
      const minCardHeight = width < 640 ? 300 : width < 1024 ? 400 : isIPadPro ? 500 : 420;

      setCarouselSizes({
        baseWidth,
        cardHeight: Math.max(minCardHeight, availableHeight)
      });
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
  }, [statsHeight, headerHeight, tgContentSafeAreaBottom]);

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

  const handleImageClick = (pet: Pet) => {
    setSelectedPetForStack(pet);
  };

  // Подготовка данных для StackAndText
  const stackCards: StackCard[] = useMemo(() => {
    if (!selectedPetForStack) return [];
    
    // Убеждаемся что у питомца есть user_id (берем из userId если отсутствует)
    const petWithUserId = {
      ...selectedPetForStack,
      user_id: selectedPetForStack.user_id || userId
    };
    
    const stages = getAvailableStages(petWithUserId);
    return stages.map((stage, index) => ({
      id: index + 1,
      img: stage.imageUrl
    }));
  }, [selectedPetForStack, userId]);

  // Получение creature_json для текстового окна
  const creatureText = useMemo(() => {
    if (!selectedPetForStack) return ['Выберите питомца для просмотра информации'];
    
    // Пытаемся получить creature_json из pet (может быть в разных форматах)
    const creatureJson = (selectedPetForStack as any).creature || (selectedPetForStack as any).creature_json;
    return formatCreatureJson(creatureJson);
  }, [selectedPetForStack]);

  const handleCreatePet = (override?: boolean) => {
    const trimmedName = petName.trim();
    if (!trimmedName) return;

    setIsCreateModalOpen(false);
    createPet(
      { name: trimmedName, override: override || false },
      {
        onSettled: () => {
          setPetName('');
        },
        onError: () => {
          // опционально можно вернуть модалку, но оставляем закрытой по требованиям
        }
      }
    );
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
        minHeight: '-webkit-fill-available', // Fallback для Safari
        // Блокируем вертикальную прокрутку в Telegram WebApp
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        touchAction: isTelegramWebApp() ? 'pan-x pinch-zoom' : 'auto' // Разрешаем только горизонтальные свайпы в Telegram
      }}
    >
      {/* Header с кнопкой "Создать питомца" */}
      <Header
        onCreatePet={() => setIsCreateModalOpen(true)}
        isCreateDisabled={isCreating}
      />
      
      <div 
        className="flex-1 flex flex-col overflow-hidden" 
        style={{ 
          paddingTop: `${headerHeight}px`,
          // Уменьшенные отступы для карусели (примерно в 3 раза меньше)
          // Было 16px/24px, стало 6px/8px
          paddingLeft: `${containerPaddingX}px`,
          paddingRight: `${containerPaddingX}px`
        }}
      >
        {/* Верхняя секция: быстрые статусы */}
        <div className="flex-shrink-0 mb-1.5 sm:mb-2 md:mb-3 flex justify-center">
          <div
            ref={statsRef}
            className="w-full"
            style={{
              maxWidth: carouselSizes?.baseWidth ? `${carouselSizes.baseWidth}px` : '100%',
              minWidth: 0
            }}
          >
            <QuickStatsVariants
              stats={{
                totalPets: totalPets || 0,
                alivePets: alivePets || 0,
                deadPets: deadPets || 0,
                coins: wallet?.coins || 0
              }}
              variant={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Карусель питомцев - занимает все доступное пространство */}
        <div 
          className="flex-1 flex items-center justify-center min-h-0 overflow-hidden"
          style={{ 
            paddingBottom: `${dockHeight + tgContentSafeAreaBottom}px`
          }}
        >
          <PetCarousel
            pets={transformedPets}
            onPetSelect={handlePetSelect}
            onHealthUp={handleHealthUp}
            onHealthUpWithCost={handleHealthUpWithCost}
            onPlay={handlePlay}
            onResurrect={handleResurrect}
            onImageClick={handleImageClick}
            wallet={wallet}
            resurrectCost={500}
            baseWidth={carouselSizes?.baseWidth ?? 380}
            cardHeight={carouselSizes?.cardHeight ?? 500}
            autoplay={false}
            pauseOnHover={true}
            loop={false}
            showIndicators={true}
            className="w-full h-full"
            isHealthUpLoading={isHealthUpLoading}
            isHealthUpWithCostLoading={isHealthUpWithCostLoading}
            isResurrecting={isResurrecting}
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

      {/* Модальное окно StackAndText */}
      <DialogEnhanced
        open={selectedPetForStack !== null}
        onClose={() => setSelectedPetForStack(null)}
        variant="glass"
        size="xl"
        fullWidth={true}
        title=""
        description=""
      >
        <StackAndText
          stackCards={stackCards}
          text={creatureText}
          title={selectedPetForStack?.name || 'Информация о питомце'}
          typingSpeed={30}
        />
      </DialogEnhanced>
    </div>
  );
}
