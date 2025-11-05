import React from 'react';
import { motion } from 'framer-motion';
import FormCard from './FormCard';
import Button from './Button';
import { Sparkles } from 'lucide-react';

export interface WelcomeEnhancedProps {
  onCreateClick: () => void;
  message?: string;
  variant?: 'default' | 'glass' | 'minimal';
}

export default function WelcomeEnhanced({
  onCreateClick,
  message = 'Создайте своего первого питомца и начните увлекательное путешествие!',
  variant = 'glass'
}: WelcomeEnhancedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <FormCard
        title="Добро пожаловать в Telepets!"
        description={message}
        variant={variant}
      >
        <div className="text-center space-y-6 py-4">
          <motion.div
            className="text-8xl"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            🥚
          </motion.div>

          <Button
            onClick={onCreateClick}
            size="lg"
            icon={<Sparkles className="w-5 h-5" />}
            className="w-full"
          >
            Создать питомца
          </Button>
        </div>
      </FormCard>
    </motion.div>
  );
}

