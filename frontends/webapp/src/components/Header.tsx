import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onCreatePet?: () => void;
}

export default function Header({ onCreatePet }: HeaderProps) {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 sm:py-3"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
        background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.8) 70%, transparent 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      {/* Левая часть - место для кнопки "Закрыть" Telegram (оставляем пустым, чтобы не перекрывать) */}
      <div className="w-20 sm:w-24 flex-shrink-0" />
      
      {/* Центральная часть - кнопка "Создать питомца" */}
      {onCreatePet && (
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={onCreatePet}
            className="relative rounded-lg bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-rose-600/90 backdrop-blur-xl border border-white/20 overflow-hidden group h-6 sm:h-6 md:h-8 w-40 sm:w-44 md:w-52 max-w-[calc(100%-2rem)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex items-center justify-center gap-1 sm:gap-1 px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 h-full">
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white flex-shrink-0" />
              <span className="text-[0.6875rem] sm:text-xs md:text-sm font-semibold text-white truncate">Создать питомца</span>
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white/80 flex-shrink-0" />
            </div>
          </motion.button>
        </div>
      )}
      
      {/* Правая часть - место для кнопок меню Telegram (оставляем пустым, чтобы не перекрывать) */}
      <div className="w-20 sm:w-24 flex-shrink-0" />
    </header>
  );
}

