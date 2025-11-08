import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Stack from './Stack';
import type { StackCard } from './Stack';
import GlassmorphismTextWindow from './GlassmorphismTextWindow';
import { cn } from '../utils';
import { getTelegramWebApp, isTelegramWebApp } from '../utils/telegram';

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
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const [cardDimensions, setCardDimensions] = useState({ width: 240, height: 320 });
  const [contentSafeAreaInset, setContentSafeAreaInset] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  // Инициализация и отслеживание Telegram content safe area insets
  useEffect(() => {
    if (!isTelegramWebApp()) return;

    const tgWebApp = getTelegramWebApp();
    if (!tgWebApp) return;

    // Получаем начальные значения safe area insets
    const updateSafeAreaInset = () => {
      if (tgWebApp?.contentSafeAreaInset) {
        setContentSafeAreaInset({
          top: tgWebApp.contentSafeAreaInset.top || 0,
          bottom: tgWebApp.contentSafeAreaInset.bottom || 0,
          left: tgWebApp.contentSafeAreaInset.left || 0,
          right: tgWebApp.contentSafeAreaInset.right || 0,
        });
      } else {
        // Fallback: пытаемся получить из CSS переменных
        const rootStyle = getComputedStyle(document.documentElement);
        setContentSafeAreaInset({
          top: parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || '0', 10),
          bottom: parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom') || '0', 10),
          left: parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-left') || '0', 10),
          right: parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-right') || '0', 10),
        });
      }
    };

    updateSafeAreaInset();

    // Подписываемся на изменения content safe area
    if (tgWebApp.onEvent) {
      tgWebApp.onEvent('contentSafeAreaChanged', updateSafeAreaInset);
    }

    return () => {
      if (tgWebApp?.offEvent) {
        tgWebApp.offEvent('contentSafeAreaChanged', updateSafeAreaInset);
      }
    };
  }, []);

  // Адаптивные размеры карточек на основе доступной высоты контейнера
  useLayoutEffect(() => {
    const updateCardDimensions = () => {
      if (stackContainerRef.current) {
        const containerHeight = stackContainerRef.current.clientHeight;
        const containerWidth = stackContainerRef.current.clientWidth;
        
        // Учитываем Telegram content safe area insets
        const safeAreaTop = contentSafeAreaInset.top || 0;
        const safeAreaBottom = contentSafeAreaInset.bottom || 0;
        const safeAreaLeft = contentSafeAreaInset.left || 0;
        const safeAreaRight = contentSafeAreaInset.right || 0;
        
        // Вычисляем размеры карточек с учетом доступного пространства и safe area
        // Оставляем отступы (примерно 10% сверху и снизу) + safe area
        const availableHeight = containerHeight * 0.9 - safeAreaTop - safeAreaBottom;
        const availableWidth = containerWidth * 0.9 - safeAreaLeft - safeAreaRight;
        
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

    // Подписываемся на Telegram viewportChanged событие для обновления размеров
    const tgWebApp = getTelegramWebApp();
    if (tgWebApp?.onEvent) {
      tgWebApp.onEvent('viewportChanged', updateCardDimensions);
    }

    return () => {
      window.removeEventListener('resize', updateCardDimensions);
      resizeObserver.disconnect();
      if (tgWebApp?.offEvent) {
        tgWebApp.offEvent('viewportChanged', updateCardDimensions);
      }
    };
  }, [contentSafeAreaInset]);

  return (
    <motion.div
      className={cn('relative w-full h-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-4 lg:gap-3 h-full w-full">
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
          className="w-full lg:w-[40%] lg:flex-[0.4] px-4 pb-4 flex flex-col items-center"
        >
          <div className="w-full max-w-[540px]">
            <GlassmorphismTextWindow
              text={text}
              title={title}
              typingSpeed={typingSpeed}
              pauseDuration={2000}
              showCursor={true}
              loop={true}
              className="h-full"
            />
          </div>
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

