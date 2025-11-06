import { useMemo, useState, useEffect } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarouselEnhanced from '@/components/PetCarouselEnhanced';
import QuickStatsVariants from '@/components/QuickStatsVariants';
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId } from '@/utils';

export default function Home() {
  const { pets, totalPets, alivePets, deadPets, isLoading, wallet } = useAllPets();
  const { healthUp, healthUpWithCost, resurrect, createPet, isCreating } = usePet();
  const userId = useMemo(() => getStoredUserId(), []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [petName, setPetName] = useState('');

  // Адаптивные размеры для карусели
  const [carouselSizes, setCarouselSizes] = useState({ baseWidth: 380, cardHeight: 500 });

  useEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isIPadPro = width >= 1024 && width < 1280 && height > 1000;
      
      // Учитываем safe-area-insets для Telegram WebApp
      const safeAreaTop = typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) : 0;
      const safeAreaBottom = typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10) : 0;
      
      if (width < 640) {
        // Мобильные устройства (< 640px) - оптимизировано для Telegram WebApp
        const availableHeight = height - safeAreaTop - safeAreaBottom - 140; // Уменьшено с учетом компактных статусов
        setCarouselSizes({ 
          baseWidth: width - 16, // Уменьшено padding для большего пространства
          cardHeight: Math.min(360, availableHeight) // Адаптивная высота
        });
      } else if (width >= 640 && width < 1024) {
        // Планшеты (640px - 1023px)
        setCarouselSizes({ 
          baseWidth: width - 48, // минус padding sm:px-6
          cardHeight: 450 
        });
      } else if (isIPadPro) {
        // iPad Pro (1024px ширина, высота > 1000px) - используем максимальную высоту
        const topSectionHeight = 140; // Уменьшено с учетом компактных статусов
        const paddingTop = 16; // paddingTop
        const paddingBottom = 80; // paddingBottom + dock
        const gap = 24; // отступы между секциями
        const maxCardHeight = height - topSectionHeight - paddingTop - paddingBottom - gap;
        setCarouselSizes({ 
          baseWidth: Math.min(700, width - 96), // Широкая карточка, но с отступами
          cardHeight: Math.max(600, maxCardHeight) // Используем максимальную доступную высоту
        });
      } else if (width >= 1024 && width < 1280) {
        // Небольшие десктопы (1024px - 1279px, но не iPad Pro)
        setCarouselSizes({ 
          baseWidth: 420, 
          cardHeight: 420 
        });
      } else {
        // Большие десктопы (>= 1280px)
        setCarouselSizes({ 
          baseWidth: 480, 
          cardHeight: 500 
        });
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] flex items-center justify-center px-4">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Пустое состояние
  if (!totalPets || transformedPets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] flex items-center justify-center px-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Нет питомцев</h2>
          <p className="text-gray-400">Создайте своего первого питомца</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] px-4 sm:px-6 overflow-x-hidden flex flex-col"
      style={{ 
        minHeight: '-webkit-fill-available',
        maxWidth: '100vw' 
      }}
    >
      <div className="max-w-7xl mx-auto w-full overflow-x-hidden flex flex-col flex-1">
        {/* Верхняя секция: быстрые статусы и кнопка создания */}
        <div className="mb-3 sm:mb-4 md:mb-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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

        {/* Карусель питомцев */}
        <div className="w-full flex-1 flex items-center justify-center min-h-0">
          <PetCarouselEnhanced
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
            showIndicators={true}
            className="w-full"
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
