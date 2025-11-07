import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import Stack from './Stack';
import type { StackCard } from './Stack';
import GlassmorphismTextWindow from './GlassmorphismTextWindow';
import { cn } from '../utils';

export interface StackAndTextProps {
  stackCards?: StackCard[];
  text?: string | string[];
  title?: string;
  typingSpeed?: number;
  className?: string;
}

export default function StackAndText({
  stackCards,
  text = 'Добро пожаловать!',
  title = 'Текстовое окно',
  typingSpeed = 30,
  className = ''
}: StackAndTextProps) {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const [cardDimensions, setCardDimensions] = useState({ width: 240, height: 320 });

  // Адаптивные размеры карточек на основе доступной высоты контейнера
  useLayoutEffect(() => {
    const updateCardDimensions = () => {
      if (stackContainerRef.current) {
        const containerHeight = stackContainerRef.current.clientHeight;
        const containerWidth = stackContainerRef.current.clientWidth;
        
        // Вычисляем размеры карточек с учетом доступного пространства
        // Оставляем отступы (примерно 10% сверху и снизу)
        const availableHeight = containerHeight * 0.9;
        const availableWidth = containerWidth * 0.9;
        
        // Сохраняем пропорции карточек (240:320 = 3:4)
        const aspectRatio = 3 / 4;
        
        // Вычисляем размеры на основе доступной высоты
        let cardHeight = Math.min(availableHeight, availableWidth / aspectRatio);
        let cardWidth = cardHeight * aspectRatio;
        
        // Минимальные и максимальные размеры
        cardHeight = Math.max(280, Math.min(cardHeight, 600));
        cardWidth = cardHeight * aspectRatio;
        
        setCardDimensions({ width: Math.round(cardWidth), height: Math.round(cardHeight) });
      }
    };

    updateCardDimensions();
    window.addEventListener('resize', updateCardDimensions);
    
    // Используем ResizeObserver для отслеживания изменений размера контейнера
    const resizeObserver = new ResizeObserver(updateCardDimensions);
    if (stackContainerRef.current) {
      resizeObserver.observe(stackContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateCardDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x, y });
  };

  return (
    <motion.div
      className={cn('relative w-full h-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseMove={handleMouseMove}
    >
      <div className="flex flex-col lg:flex-row items-stretch justify-center gap-2 lg:gap-3 h-full w-full">
        {/* Stack Component - 60% ширины */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[60%] lg:flex-[0.6] h-full flex items-center justify-center"
          ref={stackContainerRef}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Stack
              randomRotation={true}
              disableClick={true}
              cardDimensions={cardDimensions}
              cardsData={stackCards}
            />
          </div>
        </motion.div>

        {/* Text Window Component - 40% ширины */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full lg:w-[40%] lg:flex-[0.4] px-3 pb-3 flex flex-col"
        >
          <GlassmorphismTextWindow
            text={text}
            title={title}
            typingSpeed={typingSpeed}
            pauseDuration={2000}
            showCursor={true}
            loop={true}
            className="h-full"
          />
        </motion.div>
      </div>

      {/* CSS animation for gradient shift */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </motion.div>
  );
}

