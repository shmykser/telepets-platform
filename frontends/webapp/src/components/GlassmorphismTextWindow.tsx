import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import TextType from './TextType';

export interface GlassmorphismTextWindowProps {
  text?: string | string[];
  title?: string;
  className?: string;
  typingSpeed?: number;
  pauseDuration?: number;
  textColors?: string[];
  showCursor?: boolean;
  loop?: boolean;
}

export default function GlassmorphismTextWindow({
  text = 'Добро пожаловать в мир анимаций!',
  title = 'Текстовое окно',
  className = '',
  typingSpeed = 50,
  pauseDuration = 2000,
  textColors = [],
  showCursor = true,
  loop = true
}: GlassmorphismTextWindowProps) {
  const [glowPosition, setGlowPosition] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x, y });
  };

  return (
    <motion.div
      className={`relative w-full max-w-2xl flex flex-col ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-75 blur-xl"
        style={{
          background: `linear-gradient(
            135deg,
            #60A5FA 0%,
            #34D399 25%,
            #A78BFA 50%,
            #F472B6 75%,
            #60A5FA 100%
          )`,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 4s ease infinite',
          backgroundPosition: `${glowPosition.x}% ${glowPosition.y}%`
        }}
      />

      {/* Glassmorphism card */}
      {/* min-height: padding (2rem*2) + заголовок (1.5rem) + отступ заголовка (1.5rem) + 4 строки текста (1.125rem*1.625*4) = 14.3125rem ≈ 229px */}
      <Card className="relative rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-[14.3125rem]">
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Content */}
        <CardContent className="relative p-8 flex-1 flex flex-col">
          {/* Title */}
          {title && (
            <motion.h3
              className="text-2xl font-bold text-white mb-6 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
          )}

          {/* Text content with typing animation */}
          <div className="relative z-10 flex-1 flex flex-col">
            <TextType
              text={text}
              className="text-white text-lg leading-relaxed"
              typingSpeed={typingSpeed}
              pauseDuration={pauseDuration}
              textColors={textColors}
              showCursor={showCursor}
              loop={loop}
              cursorClassName="text-purple-400"
              cursorCharacter="|"
            />
          </div>
        </CardContent>
      </Card>

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

