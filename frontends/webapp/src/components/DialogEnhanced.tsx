import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface DialogEnhancedProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'minimal';
  className?: string;
}

export default function DialogEnhanced({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'glass',
  className = ''
}: DialogEnhancedProps) {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x, y });
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className={`relative w-full ${getSizeStyles()} pointer-events-auto ${className}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onMouseMove={handleMouseMove}
            >
              {variant === 'glass' ? (
                <>
                  {/* Animated gradient border */}
                  <div
                    className="absolute -inset-0.5 rounded-3xl opacity-75 blur-xl"
                    style={{
                      backgroundImage: `linear-gradient(
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

                  {/* Glassmorphism container */}
                  <div className="relative rounded-3xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border border-white/10 overflow-hidden">
                    {/* Frosted glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    {/* Content */}
                    <div className="relative p-6">
                      {(title || description) && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between">
                            {title && (
                              <h2 className="text-2xl font-black text-white">{title}</h2>
                            )}
                            <motion.button
                              onClick={onClose}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-5 h-5 text-gray-400" />
                            </motion.button>
                          </div>
                          {description && (
                            <p className="text-sm text-gray-400 mt-2">{description}</p>
                          )}
                        </div>
                      )}
                      {children}
                    </div>
                  </div>
                </>
              ) : variant === 'minimal' ? (
                <div className="relative rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/10 overflow-hidden">
                  {(title || description) && (
                    <div className="p-6 pb-4 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                        <button
                          onClick={onClose}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      {description && (
                        <p className="text-sm text-gray-400 mt-2">{description}</p>
                      )}
                    </div>
                  )}
                  <div className="p-6">{children}</div>
                </div>
              ) : (
                <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 overflow-hidden">
                  {(title || description) && (
                    <div className="p-6 pb-4 border-b border-gray-700/50">
                      <div className="flex items-center justify-between">
                        {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                        <button
                          onClick={onClose}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      {description && (
                        <p className="text-sm text-gray-400 mt-2">{description}</p>
                      )}
                    </div>
                  )}
                  <div className="p-6">{children}</div>
                </div>
              )}

              {/* CSS animation for glass variant */}
              {variant === 'glass' && (
                <style>{`
                  @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                  }
                `}</style>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

