import React from 'react';
import { motion } from 'framer-motion';
import FormCard from './FormCard';
import ButtonVariant1 from './ButtonVariant1';
import { Skull, Heart } from 'lucide-react';

export interface AllDeadEnhancedProps {
  totals: { total_pets: number; dead_pets: number };
  message?: string;
  onCreateClick: () => void;
  variant?: 'default' | 'glass' | 'minimal';
}

export default function AllDeadEnhanced({
  totals,
  message = 'Все ваши питомцы умерли. Создайте нового!',
  onCreateClick,
  variant = 'glass'
}: AllDeadEnhancedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <FormCard
        title="Все питомцы умерли"
        description={message}
        variant={variant}
      >
        <div className="text-center space-y-6 py-4">
          {/* Animated skull */}
          <motion.div
            className="relative"
            animate={{
              y: [0, -5, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="text-8xl">💀</div>
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">Всего</span>
              </div>
              <div className="text-2xl font-bold text-white">{totals.total_pets}</div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Skull className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-400">Мёртвых</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{totals.dead_pets}</div>
            </div>
          </div>

          {/* Action button */}
          <ButtonVariant1
            onClick={onCreateClick}
            size="lg"
            className="w-full"
          >
            Создать нового питомца
          </ButtonVariant1>
        </div>
      </FormCard>
    </motion.div>
  );
}
