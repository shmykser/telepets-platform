import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import React from 'react';
import type { Pet } from '@/types';

export interface PetCarouselEnhancedProps {
  pets: Pet[];
  onPetSelect?: (pet: Pet) => void;
  onHealthUp?: (pet: Pet) => void;
  onHealthUpWithCost?: (pet: Pet) => void;
  onPlay?: (pet: Pet) => void;
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

export default function PetCarouselEnhanced({
  pets = [],
  onPetSelect,
  onHealthUp,
  onHealthUpWithCost,
  onPlay,
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
      if (viewportWidth < 640) {
        // Мобильные устройства: используем ширину экрана минус отступы (px-4 = 16px * 2)
        // Учитываем также padding контейнера карусели
        const availableWidth = viewportWidth - 32; // px-4 на главной странице
        const carouselPadding = 16; // padding карусели
        setContainerWidth(availableWidth - carouselPadding * 2);
        setAdaptiveCardHeight(450); // Меньшая высота на мобильных
      } else {
        setContainerWidth(baseWidth);
        setAdaptiveCardHeight(cardHeight);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [baseWidth, cardHeight]);
  
  const containerPadding = containerWidth < 640 ? 16 : 20;
  const itemWidth = Math.min(containerWidth - containerPadding * 2, window.innerWidth - 64);
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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentX = x.get();
    const targetX = -(currentIndex * trackItemOffset);
    const draggedDistance = currentX - targetX;
    
    let targetIndex = currentIndex;
    
    if (Math.abs(draggedDistance) > DRAG_BUFFER || Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (draggedDistance < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
        targetIndex = Math.min(currentIndex + 1, pets.length - 1);
      } else if (draggedDistance > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
        targetIndex = Math.max(currentIndex - 1, 0);
      }
    } else {
      const nearestIndex = Math.round(-currentX / trackItemOffset);
      targetIndex = Math.max(0, Math.min(nearestIndex, pets.length - 1));
    }
    
    setCurrentIndex(targetIndex);
  };

  const dragConstraints = {
    left: -trackItemOffset * (pets.length - 1),
    right: 0
  };

  const PetCard = ({ pet, index }: { pet: Pet; index: number }) => {
    const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
    const isCardHovered = hoveredCardId === pet.id?.toString();
    
    const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
    const outputRange = [75, 0, -75];
    const carouselRotateY = useTransform(x, range, outputRange, { clamp: false });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const glowX = ((e.clientX - rect.left) / rect.width) * 100;
      const glowY = ((e.clientY - rect.top) / rect.height) * 100;
      setGlowPosition({ x: glowX, y: glowY });
    };

    const handleMouseLeave = () => {
      setHoveredCardId(null);
      setGlowPosition({ x: 50, y: 50 });
    };

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

    const stageInfo = getStageInfo(pet.state);

    return (
      <motion.div
        className="relative shrink-0 cursor-pointer"
        style={{
          width: itemWidth,
          height: adaptiveCardHeight,
          rotateY: carouselRotateY,
          transformStyle: 'preserve-3d',
          zIndex: isCardHovered ? 50 : 1,
          overflow: 'visible'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHoveredCardId(pet.id?.toString() ?? null)}
        onMouseLeave={handleMouseLeave}
        onClick={() => onPetSelect?.(pet)}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Glow эффект снаружи, чтобы не обрезался, но не выходит за границы карусели */}
        <div
          className="absolute rounded-3xl opacity-75 blur-xl pointer-events-none"
          style={{
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            background: `linear-gradient(135deg, #60A5FA 0%, #34D399 25%, #A78BFA 50%, #F472B6 75%, #60A5FA 100%)`,
            backgroundSize: '200% 200%',
            animation: 'gradientShift 4s ease infinite',
            backgroundPosition: `${glowPosition.x}% ${glowPosition.y}%`,
            opacity: isCardHovered ? 1 : 0.6,
            transition: 'opacity 0.3s ease',
            zIndex: -1
          }}
        />

        <motion.div
          className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border border-white/10"
          style={{ 
            transformStyle: 'preserve-3d',
            height: '100%',
            overflowY: 'hidden',
            overflowX: 'hidden'
          }}
          animate={{
            boxShadow: isCardHovered 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.3)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className={`absolute inset-0 bg-gradient-to-br ${stageInfo.color} opacity-20`} />
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 pointer-events-none"
            animate={{ opacity: isCardHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative w-full h-[60%] overflow-hidden">
            {pet.image_url ? (
              <motion.img
                src={pet.image_url}
                alt={pet.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="fallback absolute inset-0 flex items-center justify-center text-[10vmin] bg-gradient-to-br from-gray-800 to-gray-900"
              style={{ display: pet.image_url ? 'none' : 'flex' }}
            >
              {stageInfo.emoji}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border ${
                isDead 
                  ? 'bg-red-500/30 border-red-500/50' 
                  : 'bg-green-500/30 border-green-500/50'
              }`}>
                <span className="text-white text-xs font-semibold">
                  {isDead ? '💀 Мёртв' : `❤️ ${healthPercentage}%`}
                </span>
              </div>
            </div>

            <div className="absolute top-4 left-4">
              <div className="px-3 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20">
                <span className="text-white text-lg">{stageInfo.emoji}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent flex flex-col">
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{pet.name}</h3>
            <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">{stageInfo.name}</p>

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
            </div>

            {!isDead && (
              <div className="flex gap-2 flex-shrink-0">
                <motion.button
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold relative overflow-hidden text-white min-h-[44px]"
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
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
                    background: 'linear-gradient(90deg, #a855f7, #ec4899, #f43f5e, #a855f7)',
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
                    background: 'linear-gradient(90deg, #10b981, #34d399, #06b6d4, #10b981)',
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

          <AnimatePresence>
            {isCardHovered && (
              <motion.div
                className="absolute inset-0 blur-2xl opacity-40 -z-10"
                style={{
                  background: `linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(168, 85, 247, 0.5) 100%)`
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  if (pets.length === 0) {
    return <div className={`text-center text-gray-400 ${className}`}>Нет питомцев</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full mx-auto ${className}`}
      style={{
        maxWidth: containerWidth < 640 ? '100%' : `${baseWidth}px`,
        padding: `${containerPadding}px`,
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <div className="relative" style={{ padding: '10px 0', maxWidth: '100%', overflow: 'hidden' }}>
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{
            gap: `${GAP}px`,
            perspective: 1200,
            perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
            transformStyle: 'preserve-3d',
            x,
            width: 'max-content'
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * trackItemOffset) }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 40,
            restDelta: 0.5
          }}
        >
          {pets.map((pet, index) => (
            <PetCard key={pet.id ?? index} pet={pet} index={index} />
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

