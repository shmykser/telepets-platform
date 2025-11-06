import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import React from 'react';
import type { Pet } from '@/types';

export interface PetCarouselProps {
  pets?: Pet[];
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
  loop?: boolean;
  showIndicators?: boolean;
  className?: string;
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 32;
const SPRING_OPTIONS = { type: 'spring' as const, stiffness: 300, damping: 30 };

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
  effectiveTransition: any;
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
  resurrectCost,
  effectiveTransition
}: PetCardProps) => {
  const isCardHovered = hoveredCardId === pet.id?.toString();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // ЛОГИКА ПОВОРОТОВ ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ!
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [90, 0, -90];
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
      className="relative shrink-0 cursor-pointer overflow-hidden cursor-grab active:cursor-grabbing"
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
      transition={effectiveTransition}
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
                  const img = e.target as HTMLImageElement;
                  img.style.opacity = '1';
                  img.style.display = 'block';
                  img.style.visibility = 'visible';
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

      {/* Передний слой с бейджами и текстом */}
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
  
  return petUnchanged && indexUnchanged && itemWidthUnchanged && heightUnchanged && offsetUnchanged && hoveredUnchanged;
});

export default function PetCarousel({
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
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  showIndicators = true,
  className = ''
}: PetCarouselProps): React.JSX.Element {
  // ЛОГИКА ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ!
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const carouselItems = loop ? [...pets, pets[0]] : pets;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev === pets.length - 1 && loop) {
            return prev + 1;
          }
          if (prev === carouselItems.length - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, loop, pets.length, carouselItems.length, pauseOnHover]);

  // ЛОГИКА ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ!
  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  // ЛОГИКА ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ!
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === pets.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(prev => Math.min(prev + 1, carouselItems.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(pets.length - 1);
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  // ЛОГИКА ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ!
  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0
        }
      };

  if (pets.length === 0) {
    return <div className={`text-center text-gray-400 ${className}`}>Нет питомцев</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden p-4 ${className}`}
      style={{
        width: `${baseWidth}px`,
        maxWidth: '100%'
      }}
    >
      {/* ЛОГИКА ИЗ CAROUSEL.TSX - НЕ МЕНЯТЬ! */}
      <motion.div
        className="flex"
        drag="x"
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          transformStyle: 'preserve-3d',
          x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((pet, index) => (
          <PetCard
            key={pet.id ?? pet.name ?? index}
            pet={pet}
            index={index}
            itemWidth={itemWidth}
            adaptiveCardHeight={cardHeight}
            trackItemOffset={trackItemOffset}
            x={x}
            hoveredCardId={hoveredCardId}
            setHoveredCardId={setHoveredCardId}
            onPetSelect={onPetSelect}
            onHealthUp={onHealthUp}
            onHealthUpWithCost={onHealthUpWithCost}
            onPlay={onPlay}
            onResurrect={onResurrect}
            wallet={wallet}
            resurrectCost={resurrectCost}
            effectiveTransition={effectiveTransition}
          />
        ))}
      </motion.div>
      
      {showIndicators && pets.length > 1 && (
        <div className="flex w-full justify-center">
          <div className="mt-4 flex w-[150px] justify-between px-8">
            {pets.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 w-2 rounded-full cursor-pointer transition-colors duration-150 ${
                  currentIndex % pets.length === index
                    ? 'bg-[#333333]'
                    : 'bg-[rgba(51,51,51,0.4)]'
                }`}
                animate={{
                  scale: currentIndex % pets.length === index ? 1.2 : 1
                }}
                onClick={() => setCurrentIndex(index)}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

