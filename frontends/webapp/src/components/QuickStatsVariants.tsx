import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coins, PawPrint, Skull, Plus, Sparkles } from 'lucide-react';

export interface QuickStatsVariantsProps {
  stats: {
    totalPets?: number;
    alivePets?: number;
    deadPets?: number;
    coins?: number;
  };
  onCreatePet?: () => void;
  variant?: 1 | 2 | 3 | 4;
  className?: string;
}

interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  gradient: string;
  iconColor: string;
}

const statItems: StatItem[] = [
  {
    key: 'totalPets',
    label: 'Всего',
    value: 0,
    icon: PawPrint,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
    iconColor: 'text-blue-300'
  },
  {
    key: 'alivePets',
    label: 'Живых',
    value: 0,
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    gradient: 'from-pink-500/20 via-rose-500/20 to-pink-500/20',
    iconColor: 'text-pink-300'
  },
  {
    key: 'deadPets',
    label: 'Мёртвых',
    value: 0,
    icon: Skull,
    color: 'from-gray-600 to-gray-700',
    gradient: 'from-gray-600/20 via-gray-700/20 to-gray-600/20',
    iconColor: 'text-gray-200'
  },
  {
    key: 'coins',
    label: 'Монеты',
    value: 0,
    icon: Coins,
    color: 'from-yellow-500 to-amber-500',
    gradient: 'from-yellow-500/20 via-amber-500/20 to-yellow-500/20',
    iconColor: 'text-yellow-300'
  }
];

// Tooltip component для карточек статистики
function StatTooltip({ 
  label, 
  isVisible, 
  onClose 
}: { 
  label: string; 
  isVisible: boolean; 
  onClose: () => void;
}) {
  useEffect(() => {
    if (isVisible) {
      // Определяем, мобильное ли устройство (touch events)
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (isMobile) {
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: 0, scale: 0.8 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className="absolute -top-10 left-1/2 w-fit whitespace-nowrap rounded-lg border border-white/20 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl px-3 py-1.5 text-xs text-white shadow-2xl z-50"
          style={{ transform: 'translateX(-50%)' }}
          role="tooltip"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg blur-sm -z-10" />
          <div className="text-gray-200 font-medium">{label}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Variant 1: Компактный glassmorphism
function Variant1({ stats, onCreatePet }: QuickStatsVariantsProps) {
  const items = statItems.map(item => ({
    ...item,
    value: stats[item.key as keyof typeof stats] ?? 0
  }));

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isTooltipVisible = activeTooltip === item.key;

          const handleMouseEnter = () => {
            setActiveTooltip(item.key);
          };

          const handleMouseLeave = () => {
            setActiveTooltip(null);
          };

          const handleTouchStart = () => {
            setActiveTooltip(item.key);
          };

          const handleClick = () => {
            // На мобильных показываем tooltip при клике
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (isMobile) {
              setActiveTooltip(item.key);
            }
          };

          return (
            <motion.div
              key={item.key}
              className="relative rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-visible group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onClick={handleClick}
            >
              {/* Tooltip */}
              <StatTooltip
                label={item.label}
                isVisible={isTooltipVisible}
                onClose={() => setActiveTooltip(null)}
              />

              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity rounded-lg sm:rounded-xl`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-lg sm:rounded-xl" />
              
              <div className="relative p-2 sm:p-3 text-center">
                <motion.div
                  className={`inline-flex p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-br ${item.color} bg-opacity-30 mb-1.5 sm:mb-2 relative`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon 
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor} drop-shadow-lg`} 
                    strokeWidth={2.5}
                  />
                  {/* Subtle glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 blur-sm rounded-md sm:rounded-lg -z-10`} />
                </motion.div>
                
                <motion.div
                  className="text-sm sm:text-base font-black text-white mb-0.5 sm:mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                >
                  {item.value}
                </motion.div>
                
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium hidden sm:block">{item.label}</p>
              </div>

              <motion.div
                className={`absolute -inset-1 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-xl -z-10 rounded-lg sm:rounded-xl`}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}
      </div>

      {onCreatePet && (
        <motion.button
          onClick={onCreatePet}
          className="w-full relative rounded-xl bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-rose-600/90 backdrop-blur-xl border border-white/20 overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 group-hover:opacity-30 transition-opacity" />
          <div className="relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="text-sm sm:text-base font-semibold text-white">Создать питомца</span>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </div>
        </motion.button>
      )}
    </div>
  );
}

// Variant 2: Расширенный с градиентами и анимациями
function Variant2({ stats, onCreatePet }: QuickStatsVariantsProps) {
  const items = statItems.map(item => ({
    ...item,
    value: stats[item.key as keyof typeof stats] ?? 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              className="relative rounded-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-2xl border border-white/10 overflow-hidden group"
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.08, rotateY: 5, z: 50 }}
              style={{ perspective: 1000 }}
            >
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{ backgroundSize: '200% 200%' }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative p-5 sm:p-6">
                <motion.div
                  className={`inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-40 mb-4 shadow-lg relative`}
                  whileHover={{ 
                    rotate: [0, -15, 15, -15, 0],
                    scale: 1.1
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon 
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${item.iconColor} drop-shadow-lg`} 
                    strokeWidth={2.5}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-25 blur-md rounded-xl -z-10`} />
                </motion.div>
                
                <motion.div
                  className="text-2xl sm:text-3xl font-black text-white mb-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                >
                  {item.value}
                </motion.div>
                
                <p className="text-sm sm:text-base text-gray-300 font-semibold">{item.label}</p>
              </div>

              {/* Glow effect */}
              <motion.div
                className={`absolute -inset-2 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-30 blur-2xl -z-10`}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          );
        })}
      </div>

      {onCreatePet && (
        <motion.button
          onClick={onCreatePet}
          className="w-full relative rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 backdrop-blur-xl border border-white/30 overflow-hidden group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-rose-400/30"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
          
          <div className="relative flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 py-4 sm:py-5">
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <span className="text-base sm:text-lg font-bold text-white">Создать нового питомца</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
          </div>
        </motion.button>
      )}
    </div>
  );
}

// Variant 3: Минималистичный с акцентом на числа
function Variant3({ stats, onCreatePet }: QuickStatsVariantsProps) {
  const items = statItems.map(item => ({
    ...item,
    value: stats[item.key as keyof typeof stats] ?? 0
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              className="relative rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-white/5 overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div className="relative p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon 
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor} drop-shadow-md`} 
                    strokeWidth={2.5}
                  />
                </div>
                
                <motion.div
                  className="text-2xl sm:text-3xl font-black text-white mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.2, type: 'spring', stiffness: 300 }}
                >
                  {item.value}
                </motion.div>
                
                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">{item.label}</p>
              </div>

              {/* Subtle hover effect */}
              <motion.div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100`}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}
      </div>

      {onCreatePet && (
        <motion.button
          onClick={onCreatePet}
          className="w-full relative rounded-lg bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
            <span className="text-sm sm:text-base font-semibold text-white/90">Создать питомца</span>
          </div>
        </motion.button>
      )}
    </div>
  );
}

// Variant 4: Карточки с hover эффектами и 3D tilt
function Variant4({ stats, onCreatePet }: QuickStatsVariantsProps) {
  const items = statItems.map(item => ({
    ...item,
    value: stats[item.key as keyof typeof stats] ?? 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              className="relative rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-800/85 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden group cursor-pointer"
              initial={{ opacity: 0, rotateX: -20 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                rotateX: 5,
                z: 50
              }}
              style={{ 
                perspective: 1000,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* 3D tilt effect background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20`}
                transition={{ duration: 0.3 }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative p-5 sm:p-6" style={{ transform: 'translateZ(20px)' }}>
                <motion.div
                  className={`inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-35 mb-4 relative`}
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.15
                  }}
                  transition={{ duration: 0.6, type: 'spring' }}
                >
                  <Icon 
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor} drop-shadow-lg`} 
                    strokeWidth={2.5}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 blur-md rounded-xl -z-10`} />
                </motion.div>
                
                <motion.div
                  className="text-2xl sm:text-3xl font-black text-white mb-2"
                  initial={{ scale: 0, rotateX: -90 }}
                  animate={{ scale: 1, rotateX: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                >
                  {item.value}
                </motion.div>
                
                <p className="text-sm sm:text-base text-gray-300 font-semibold">{item.label}</p>
              </div>

              {/* 3D glow effect */}
              <motion.div
                className={`absolute -inset-3 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-25 blur-2xl -z-10`}
                transition={{ duration: 0.4 }}
                style={{ transform: 'translateZ(-50px)' }}
              />
            </motion.div>
          );
        })}
      </div>

      {onCreatePet && (
        <motion.button
          onClick={onCreatePet}
          className="w-full relative rounded-2xl bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-rose-600/90 backdrop-blur-xl border border-white/20 overflow-hidden group"
          initial={{ opacity: 0, rotateX: -15 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ 
            scale: 1.02,
            rotateY: 2,
            rotateX: 2,
            y: -3
          }}
          whileTap={{ scale: 0.98 }}
          style={{ 
            perspective: 1000,
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-rose-400/20 group-hover:opacity-40"
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 py-4 sm:py-5" style={{ transform: 'translateZ(20px)' }}>
            <motion.div
              whileHover={{ rotate: 90, scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <span className="text-base sm:text-lg font-bold text-white">Создать питомца</span>
            <motion.div
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
          </div>
        </motion.button>
      )}
    </div>
  );
}

export default function QuickStatsVariants({
  stats,
  onCreatePet,
  variant = 1,
  className = ''
}: QuickStatsVariantsProps) {
  const variants = {
    1: Variant1,
    2: Variant2,
    3: Variant3,
    4: Variant4
  };

  const VariantComponent = variants[variant];

  return (
    <div className={className}>
      <VariantComponent stats={stats} onCreatePet={onCreatePet} variant={variant} />
    </div>
  );
}

