import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import React from 'react';
import type { Pet } from '@/types';

export interface PetCarouselEnhancedProps {
  pets: Pet[];
  onPetSelect?: (pet: Pet) => void;
  onHealthUp?: (pet: Pet) => void;
  onHealthUpWithCost?: (pet: Pet) => void;
  onPlay?: (pet: Pet) => void;
  onResurrect?: (pet: Pet) => void;
  wallet?: { coins: number };
  resurrectCost?: number;
  baseWidth?: number;
  cardHeight?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  className?: string;
}

const DRAG_BUFFER = 50;
const VELOCITY_THRESHOLD = 500;
const GAP = 32;

// Глобальный кэш для загруженных изображений
const imageCache = new Set<string>();

// Интерфейс для пропсов PetCard
interface PetCardProps {
  pet: Pet;
  index: number;
  itemWidth: number;
  adaptiveCardHeight: number;
  trackItemOffset: number;
  x: any; // MotionValue
  hoveredCardId: string | null;
  setHoveredCardId: (id: string | null) => void;
  onPetSelect?: (pet: Pet) => void;
  onHealthUp?: (pet: Pet) => void;
  onHealthUpWithCost?: (pet: Pet) => void;
  onPlay?: (pet: Pet) => void;
  onResurrect?: (pet: Pet) => void;
  wallet?: { coins: number };
  resurrectCost: number;
}

// Выносим PetCard за пределы основного компонента для правильной работы React.memo
const PetCard = React.memo(({ 
  pet, 
  index, 
  itemWidth, 
  adaptiveCardHeight, 
  trackItemOffset, 
  x,
  hoveredCardId,
  setHoveredCardId,
  onPetSelect,
  onHealthUp,
  onHealthUpWithCost,
  onPlay,
  onResurrect,
  wallet,
  resurrectCost
}: PetCardProps) => {
  const isCardHovered = hoveredCardId === pet.id?.toString();
  const imgRef = useRef<HTMLImageElement>(null);
  
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [75, 0, -75];
  const carouselRotateY = useTransform(x, range, outputRange, { clamp: false });

  // Мемоизируем image_url для стабильности
  const imageUrl = useMemo(() => pet.image_url, [pet.image_url]);

  // Предзагружаем изображение в кэш при первом рендере
  useEffect(() => {
    if (imageUrl && !imageCache.has(imageUrl)) {
      imageCache.add(imageUrl);
      const img = new Image();
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCardId(null);
  }, [setHoveredCardId]);

  const isDead = pet.status === 'dead';
  const health = pet.health ?? 0;
  const healthPercentage = Math.max(0, Math.min(100, health));

  const getStageInfo = (stage?: string) => {
    switch (stage) {
      case 'egg': return { emoji: '🥚', name: 'Яйцо', color: 'from-blue-500/20 to-purple-500/20' };
      case 'baby': return { emoji: '👶', name: 'Детеныш', color: 'from-pink-500/20 to-rose-500/20' };
      case 'adult': return { emoji: '🐾', name: 'Взрослый', color: 'from-green-500/20 to-emerald-500/20' };
      default: return { emoji: '❓', name: 'Неизвестно', color: 'from-gray-500/20 to-slate-500/20' };
    }
  };

  const getHealthStatus = () => {
    if (isDead || healthPercentage === 0) {
      return 'Критическое состояние';
    } else if (healthPercentage > 70) {
      return 'Отличное здоровье';
    } else if (healthPercentage > 40) {
      return 'Среднее здоровье';
    } else {
      return 'Критическое состояние';
    }
  };

  const stageInfo = getStageInfo(pet.state);
  const healthStatus = getHealthStatus();

  return (
    <motion.div
      className="relative shrink-0 cursor-pointer"
      style={{
        width: itemWidth,
        height: adaptiveCardHeight,
        rotateY: carouselRotateY,
        transformStyle: 'preserve-3d',
        zIndex: isCardHovered ? 50 : 1,
        overflow: 'visible',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
      onMouseEnter={() => setHoveredCardId(pet.id?.toString() ?? null)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onPetSelect?.(pet)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >

      <motion.div
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border border-white/10"
        style={{ 
          transformStyle: 'preserve-3d',
          height: '100%',
          overflowY: 'hidden',
          overflowX: 'hidden'
        }}
        animate={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className={`absolute inset-0 bg-gradient-to-br ${stageInfo.color} opacity-20`} />
        

        <div className="relative w-full h-[65%] overflow-hidden rounded-t-3xl">
          {imageUrl ? (
            <motion.div
              className="w-full h-full"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              style={{ 
                originX: 0.5, 
                originY: 0.5,
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt={pet.name || 'Pet'}
                className="w-full h-full object-cover rounded-t-3xl"
                style={{ 
                  opacity: 1,
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  imageRendering: 'auto',
                  display: 'block',
                  visibility: 'visible',
                  contentVisibility: 'auto',
                  containIntrinsicSize: 'auto'
                }}
                loading={imageCache.has(imageUrl) ? 'eager' : 'lazy'}
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.parentElement?.querySelector('.fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                onLoad={(e) => {
                  // Убеждаемся, что изображение загружено и отображается
                  const img = e.target as HTMLImageElement;
                  img.style.opacity = '1';
                  img.style.display = 'block';
                  img.style.visibility = 'visible';
                  // Добавляем в кэш после успешной загрузки
                  if (imageUrl) {
                    imageCache.add(imageUrl);
                  }
                }}
              />
            </motion.div>
          ) : null}
          <div 
            className="fallback absolute inset-0 flex items-center justify-center text-[10vmin] bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-3xl"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            {stageInfo.emoji}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="absolute top-[65%] left-0 right-0 bottom-0 px-4 sm:px-6 pt-3 sm:pt-4 pb-0.5 sm:pb-1 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent flex flex-col justify-start rounded-b-3xl">

          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1 sm:mb-2">
              <span>Здоровье</span>
              <span className="text-white font-semibold">{healthPercentage}/100</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  healthPercentage > 70 ? 'bg-green-500' :
                  healthPercentage > 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{healthStatus}</p>
          </div>

          {isDead ? (
            <motion.button
              className="w-full px-4 py-3 rounded-lg text-sm sm:text-base font-semibold relative overflow-hidden text-white min-h-[44px] flex items-center justify-center gap-2"
              style={{
                backgroundImage: wallet && wallet.coins >= resurrectCost
                  ? 'linear-gradient(90deg, #ec4899, #f43f5e, #dc2626, #ec4899)'
                  : 'linear-gradient(90deg, #6b7280, #4b5563, #374151, #6b7280)',
                backgroundSize: wallet && wallet.coins >= resurrectCost ? '200% 100%' : '100% 100%',
                opacity: wallet && wallet.coins >= resurrectCost ? 1 : 0.6,
                cursor: wallet && wallet.coins >= resurrectCost ? 'pointer' : 'not-allowed'
              }}
              animate={wallet && wallet.coins >= resurrectCost ? { backgroundPosition: ['0%', '100%', '0%'] } : {}}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              whileHover={wallet && wallet.coins >= resurrectCost ? { scale: 1.02 } : {}}
              whileTap={wallet && wallet.coins >= resurrectCost ? { scale: 0.98 } : {}}
              disabled={!wallet || wallet.coins < resurrectCost}
              onClick={(e) => {
                e.stopPropagation();
                if (wallet && wallet.coins >= resurrectCost && onResurrect) {
                  onResurrect(pet);
                }
              }}
            >
              <span className="text-lg">✨</span>
              <span className="relative z-10">Воскресить питомца</span>
              <span className="relative z-10 text-xs sm:text-sm opacity-90">{resurrectCost} монет</span>
            </motion.button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <motion.button
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold relative overflow-hidden text-white min-h-[44px]"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHealthUp?.(pet);
                }}
              >
                <span className="relative z-10">Бесплатно</span>
              </motion.button>
              <motion.button
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold relative overflow-hidden text-white min-h-[44px]"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e, #a855f7)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHealthUpWithCost?.(pet);
                }}
              >
                <span className="relative z-10">10 монет</span>
              </motion.button>
              <motion.button
                className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold relative overflow-hidden text-white min-h-[44px] min-w-[44px]"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #10b981, #34d399, #06b6d4, #10b981)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(pet);
                }}
              >
                <span className="relative z-10">🎮</span>
              </motion.button>
            </div>
          )}
        </div>

      </motion.div>

      {/* Передний слой с бейджами и текстом - выдвинут вперед, прямые дети motion.div с rotateY */}
      {/* Бейдж здоровья справа */}
      <div 
        className="absolute right-7"
        style={{
          top: '7%',
          transform: 'translateZ(80px)',
          filter: 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.9))',
          zIndex: 20
        }}
      >
        <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border ${
          isDead 
            ? 'bg-red-500/30 border-red-500/50' 
            : 'bg-green-500/30 border-green-500/50'
        }`}
        style={{
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <span className="text-white text-xs font-semibold">
            {isDead ? '💀 Мёртв' : `❤️ ${healthPercentage}%`}
          </span>
        </div>
      </div>

      {/* Бейдж с именем и стадией слева */}
      <div 
        className="absolute left-7 flex items-center gap-2 sm:gap-3"
        style={{
          top: '7%',
          transform: 'translateZ(80px)',
          filter: 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.9))',
          zIndex: 20
        }}
      >
        <div 
          className="px-3 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20"
          style={{
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span className="text-white text-lg">{stageInfo.emoji}</span>
        </div>
        <div className="flex flex-col">
          <h3 
            className="text-white text-base sm:text-lg font-bold leading-tight"
            style={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8), 1px -1px 2px rgba(0, 0, 0, 0.8), -1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
            {pet.name}
          </h3>
          <p 
            className="text-gray-300 text-xs leading-tight"
            style={{
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8), 1px -1px 2px rgba(0, 0, 0, 0.8), -1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
            {stageInfo.name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для React.memo
  // Возвращает true если НЕ нужно ре-рендерить (пропсы одинаковые)
  const petUnchanged = 
    prevProps.pet.id === nextProps.pet.id &&
    prevProps.pet.image_url === nextProps.pet.image_url &&
    prevProps.pet.name === nextProps.pet.name &&
    prevProps.pet.health === nextProps.pet.health &&
    prevProps.pet.status === nextProps.pet.status &&
    prevProps.pet.state === nextProps.pet.state;
  
  const indexUnchanged = prevProps.index === nextProps.index;
  const itemWidthUnchanged = prevProps.itemWidth === nextProps.itemWidth;
  const heightUnchanged = prevProps.adaptiveCardHeight === nextProps.adaptiveCardHeight;
  const offsetUnchanged = prevProps.trackItemOffset === nextProps.trackItemOffset;
  const hoveredUnchanged = prevProps.hoveredCardId === nextProps.hoveredCardId;
  
  // Не ре-рендерим если все пропсы не изменились
  return petUnchanged && indexUnchanged && itemWidthUnchanged && heightUnchanged && offsetUnchanged && hoveredUnchanged;
});

export default function PetCarouselEnhanced({
  pets = [],
  onPetSelect,
  onHealthUp,
  onHealthUpWithCost,
  onPlay,
  onResurrect,
  wallet,
  resurrectCost = 500,
  baseWidth = 380,
  cardHeight = 500,
  autoplay = false,
  autoplayDelay = 4000,
  pauseOnHover = true,
  showIndicators = true,
  className = ''
}: PetCarouselEnhancedProps): React.JSX.Element {
  // Адаптивная ширина: полная ширина экрана минус отступы на мобильных
  const [containerWidth, setContainerWidth] = React.useState(baseWidth);
  const [adaptiveCardHeight, setAdaptiveCardHeight] = React.useState(cardHeight);
  const isMobile = containerWidth < 640;
  
  React.useEffect(() => {
    const updateWidth = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isIPadPro = viewportWidth >= 1024 && viewportWidth < 1280 && viewportHeight > 1000;
      
      if (viewportWidth < 640) {
        // Мобильные устройства: используем переданную baseWidth напрямую
        // baseWidth уже учитывает отступы главной страницы
        setContainerWidth(baseWidth);
        setAdaptiveCardHeight(450); // Меньшая высота на мобильных
      } else if (viewportWidth >= 640 && viewportWidth < 1024) {
        // Планшеты (iPad и т.д.): используем переданную baseWidth
        setContainerWidth(baseWidth);
        setAdaptiveCardHeight(550); // Большая высота на планшетах
      } else if (isIPadPro) {
        // iPad Pro: используем переданные размеры (они уже рассчитаны с учетом максимальной высоты)
        setContainerWidth(baseWidth);
        setAdaptiveCardHeight(cardHeight); // Используем переданную высоту, которая уже рассчитана как максимальная
      } else {
        // Десктоп: используем базовую ширину
        setContainerWidth(baseWidth);
        setAdaptiveCardHeight(cardHeight);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [baseWidth, cardHeight]);
  
  const viewportWidthForItem = typeof window !== 'undefined' ? window.innerWidth : 0;
  const isTabletForItem = viewportWidthForItem >= 640 && viewportWidthForItem < 1024;
  // Уменьшаем padding на мобильных для лучшего центрирования
  const containerPadding = containerWidth < 640 ? 8 : (isTabletForItem ? 20 : 20);
  
  // На всех устройствах используем containerWidth минус padding
  const itemWidth = containerWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pets.length);
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, pets.length]);

  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  // Расчет для центрирования (используется в dragConstraints и handleDragEnd)
  // Центрируем активную карточку в видимой области контейнера для всех размеров экрана
  const visibleContainerWidth = containerWidth - containerPadding * 2;
  const centerOffsetForCalc = (visibleContainerWidth / 2) - (itemWidth / 2);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentX = x.get();
    // Учитываем центрирование при расчете targetX
    const targetX = -(currentIndex * trackItemOffset) - centerOffsetForCalc;
    const draggedDistance = currentX - targetX;
    
    let targetIndex = currentIndex;
    
    if (Math.abs(draggedDistance) > DRAG_BUFFER || Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (draggedDistance < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
        targetIndex = Math.min(currentIndex + 1, pets.length - 1);
      } else if (draggedDistance > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
        targetIndex = Math.max(currentIndex - 1, 0);
      }
    } else {
      // Учитываем центрирование при расчете nearestIndex
      const adjustedX = currentX + centerOffsetForCalc;
      const nearestIndex = Math.round(-adjustedX / trackItemOffset);
      targetIndex = Math.max(0, Math.min(nearestIndex, pets.length - 1));
    }
    
    setCurrentIndex(targetIndex);
  };

  const dragConstraints = {
    left: -trackItemOffset * (pets.length - 1) - centerOffsetForCalc,
    right: -centerOffsetForCalc
  };

  // Предзагрузка изображений для соседних карточек
  useEffect(() => {
    const preloadImages = () => {
      const indicesToPreload = [
        currentIndex - 1,
        currentIndex,
        currentIndex + 1
      ].filter(idx => idx >= 0 && idx < pets.length);

      indicesToPreload.forEach(idx => {
        const pet = pets[idx];
        if (pet?.image_url && !imageCache.has(pet.image_url)) {
          // Используем объект Image для предзагрузки
          const img = new Image();
          img.src = pet.image_url;
          imageCache.add(pet.image_url);
        }
      });
    };

    preloadImages();
  }, [currentIndex, pets]);

  // Мемоизируем вычисляемые значения для стабильности пропсов
  const memoizedItemWidth = useMemo(() => itemWidth, [itemWidth]);
  const memoizedAdaptiveCardHeight = useMemo(() => adaptiveCardHeight, [adaptiveCardHeight]);
  const memoizedTrackItemOffset = useMemo(() => trackItemOffset, [trackItemOffset]);
  
  // Мемоизируем setHoveredCardId для стабильности
  const setHoveredCardIdMemo = useCallback((id: string | null) => {
    setHoveredCardId(id);
  }, []);

  // Мемоизируем callback функции для стабильности пропсов
  const handlePetSelect = useCallback((pet: Pet) => {
    onPetSelect?.(pet);
  }, [onPetSelect]);

  const handleHealthUp = useCallback((pet: Pet) => {
    onHealthUp?.(pet);
  }, [onHealthUp]);

  const handleHealthUpWithCost = useCallback((pet: Pet) => {
    onHealthUpWithCost?.(pet);
  }, [onHealthUpWithCost]);

  const handlePlay = useCallback((pet: Pet) => {
    onPlay?.(pet);
  }, [onPlay]);

  const handleResurrect = useCallback((pet: Pet) => {
    onResurrect?.(pet);
  }, [onResurrect]);

  if (pets.length === 0) {
    return <div className={`text-center text-gray-400 ${className}`}>Нет питомцев</div>;
  }

  // Используем уже вычисленный centerOffsetForCalc для центрирования
  const adjustedX = x;

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full mx-auto ${className}`}
      style={{
        maxWidth: '100%',
        padding: `0 ${containerPadding}px`,
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      {/* Контейнер с perspective - как .scene в 3d-ui.html */}
      <div className="relative" style={{ padding: '10px 0', maxWidth: '100%', overflow: 'visible', perspective: '1200px', perspectiveOrigin: 'center center' }}>
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{
            gap: `${GAP}px`,
            transformStyle: 'preserve-3d',
            x: adjustedX,
            width: 'max-content'
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * trackItemOffset) - centerOffsetForCalc }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 40,
            restDelta: 0.5
          }}
        >
          {pets.map((pet, index) => (
            <PetCard 
              key={pet.id ?? pet.name ?? index} 
              pet={pet} 
              index={index}
              itemWidth={memoizedItemWidth}
              adaptiveCardHeight={memoizedAdaptiveCardHeight}
              trackItemOffset={memoizedTrackItemOffset}
              x={x}
              hoveredCardId={hoveredCardId}
              setHoveredCardId={setHoveredCardIdMemo}
              onPetSelect={handlePetSelect}
              onHealthUp={handleHealthUp}
              onHealthUpWithCost={handleHealthUpWithCost}
              onPlay={handlePlay}
              onResurrect={handleResurrect}
              wallet={wallet}
              resurrectCost={resurrectCost}
            />
          ))}
        </motion.div>
      </div>

      {showIndicators && pets.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-2">
          {pets.map((_, index) => (
            <motion.button
              key={index}
              className="carousel-indicator relative rounded-full transition-all duration-200"
              style={{
                width: currentIndex === index ? '12px' : '6px',
                height: '6px',
                padding: '0',
                backgroundColor: currentIndex === index ? '#a855f7' : '#4b5563',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentIndex(index)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

