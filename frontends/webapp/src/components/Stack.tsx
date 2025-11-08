import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { cn } from '../utils';
import DialogEnhanced from './DialogEnhanced';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StackCard {
  id: string | number;
  img: string;
  title?: string;
  description?: string;
}

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
}

function CardRotate({ children, onSendToBack, sensitivity }: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_: never, info: { offset: { x: number; y: number } }) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export interface StackProps {
  randomRotation?: boolean;
  sensitivity?: number;
  cardDimensions?: { width: number; height: number };
  sendToBackOnClick?: boolean;
  cardsData?: StackCard[];
  animationConfig?: { stiffness: number; damping: number };
  disableClick?: boolean;
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cardDimensions = { width: 208, height: 208 },
  cardsData = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  disableClick = false
}: StackProps) {
  const [cards, setCards] = useState<StackCard[]>(cardsData);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [modalDragX, setModalDragX] = useState(0);

  // Синхронизируем cards с cardsData при изменении пропсов
  useEffect(() => {
    setCards(cardsData);
  }, [cardsData]);

  const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null;

  const sendToBack = (id: string | number) => {
    setCards(prev => {
      const newCards = [...prev];
      const index = newCards.findIndex(card => card.id === id);
      if (index === -1) return prev;
      const [card] = newCards.splice(index, 1);
      newCards.unshift(card);
      return newCards;
    });
  };

  const handleCardClick = (card: StackCard) => {
    if (disableClick) {
      return;
    }
    if (sendToBackOnClick) {
      sendToBack(card.id);
    } else {
      const index = cards.findIndex(c => c.id === card.id);
      setSelectedCardIndex(index);
    }
  };

  const goToNext = () => {
    if (selectedCardIndex !== null) {
      const nextIndex = (selectedCardIndex + 1) % cards.length;
      setSelectedCardIndex(nextIndex);
    }
  };

  const goToPrevious = () => {
    if (selectedCardIndex !== null) {
      const prevIndex = selectedCardIndex === 0 ? cards.length - 1 : selectedCardIndex - 1;
      setSelectedCardIndex(prevIndex);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (selectedCardIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = selectedCardIndex === 0 ? cards.length - 1 : selectedCardIndex - 1;
        setSelectedCardIndex(prevIndex);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (selectedCardIndex + 1) % cards.length;
        setSelectedCardIndex(nextIndex);
      } else if (e.key === 'Escape') {
        setSelectedCardIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, cards.length]);

  return (
    <>
      <div
        className="relative"
        style={{
          width: cardDimensions.width,
          height: cardDimensions.height,
          perspective: 600
        }}
      >
        {cards.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-sm text-center px-4">
              Изображения загружаются...
            </div>
          </div>
        ) : (
          cards.map((card, index) => {
          const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
          const isTop = index === cards.length - 1;

          return (
            <CardRotate
              key={card.id}
              onSendToBack={() => sendToBack(card.id)}
              sensitivity={sensitivity}
            >
              <motion.div
                onClick={() => handleCardClick(card)}
                animate={{
                  rotateZ: (cards.length - index - 1) * 4 + randomRotate,
                  scale: 1 + index * 0.06 - cards.length * 0.06,
                  transformOrigin: '90% 90%'
                }}
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: animationConfig.stiffness,
                  damping: animationConfig.damping
                }}
                style={{
                  width: cardDimensions.width,
                  height: cardDimensions.height
                }}
                className={disableClick ? '' : 'cursor-pointer'}
              >
                {/* Glassmorphism Card */}
                 <Card
                   className={cn(
                     'rounded-2xl overflow-hidden shadow-2xl',
                     'h-full w-full p-0 relative',
                     'bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90',
                     'backdrop-blur-xl border border-white/20'
                   )}
                 >
                  {/* Frosted glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10" />

                  <CardContent className="p-0 h-full w-full relative">
                    <img
                      src={card.img}
                      alt={card.title || `card-${card.id}`}
                      className="w-full h-full object-contain pointer-events-none bg-gradient-to-br from-gray-900/50 to-gray-800/50"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </CardRotate>
          );
          })
        )}
      </div>

      {/* Modal for image viewing with navigation */}
      <DialogEnhanced
        open={selectedCardIndex !== null}
        onClose={() => setSelectedCardIndex(null)}
        size="xl"
        variant="glass"
      >
        {selectedCard && (
          <div className="relative">
            {/* Navigation arrows */}
            {cards.length > 1 && (
              <>
                <motion.button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Предыдущее изображение"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>

                <motion.button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Следующее изображение"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              </>
            )}

            {/* Image with swipe support */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x > threshold && cards.length > 1) {
                  goToPrevious();
                } else if (info.offset.x < -threshold && cards.length > 1) {
                  goToNext();
                }
                setModalDragX(0);
              }}
              onDrag={(_, info) => {
                setModalDragX(info.offset.x);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedCard.id}
                  src={selectedCard.img}
                  alt={selectedCard.title || `card-${selectedCard.id}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-xl select-none pointer-events-none"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </motion.div>

            {/* Image counter */}
            {cards.length > 1 && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <span className="text-white text-sm font-medium">
                    {selectedCardIndex! + 1} / {cards.length}
                  </span>
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            {cards.length > 1 && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs">
                  Используйте стрелки ← → или свайп для навигации
                </p>
              </div>
            )}
          </div>
        )}
      </DialogEnhanced>

    </>
  );
}

export type { StackCard };

