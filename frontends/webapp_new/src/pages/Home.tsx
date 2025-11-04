import { useMemo, useState, useEffect } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarouselEnhanced from '@/components/PetCarouselEnhanced';
import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId } from '@/utils';

export default function Home() {
  const { pets, totalPets, isLoading, wallet } = useAllPets();
  const { healthUp, healthUpWithCost, resurrect } = usePet();
  const userId = useMemo(() => getStoredUserId(), []);
  
  // Адаптивные размеры для карусели
  const [carouselSizes, setCarouselSizes] = useState({ baseWidth: 380, cardHeight: 500 });

  useEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        // Мобильные устройства (< 640px)
        setCarouselSizes({ 
          baseWidth: width - 32, // минус padding px-4
          cardHeight: 380 
        });
      } else if (width >= 640 && width < 1024) {
        // Планшеты (640px - 1023px)
        setCarouselSizes({ 
          baseWidth: width - 48, // минус padding sm:px-6
          cardHeight: 450 
        });
      } else if (width >= 1024 && width < 1280) {
        // Небольшие десктопы (1024px - 1279px)
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
  const transformedPets: Pet[] = useMemo(() => {
    return pets.map(pet => ({
      ...pet,
      image_url: pet.image_url || (pet.name && userId 
        ? buildUrl.petImage(userId, pet.name) + (pet.state ? `?stage=${pet.state}` : '')
        : undefined)
    }));
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
      className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] px-4 sm:px-6 overflow-x-hidden"
      style={{ 
        paddingTop: '1rem', 
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', 
        minHeight: '100vh', 
        maxWidth: '100vw' 
      }}
    >
      <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Карусель питомцев */}
        <div className="w-full">
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
    </div>
  );
}
