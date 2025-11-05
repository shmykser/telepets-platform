import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface FormCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
}

export default function FormCard({
  title,
  description,
  children,
  onClose,
  className = '',
  variant = 'default'
}: FormCardProps) {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x, y });
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        className={`rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/5 overflow-hidden ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {(title || onClose) && (
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-400 mt-2">{description}</p>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </motion.div>
    );
  }

  if (variant === 'glass') {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onMouseMove={handleMouseMove}
      >
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
            {(title || onClose) && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {title && (
                    <h3 className="text-2xl font-black text-white">{title}</h3>
                  )}
                  {onClose && (
                    <motion.button
                      onClick={onClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-gray-400 mt-2">{description}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>

        {/* CSS animation */}
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className={`rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {(title || onClose) && (
        <div className="p-6 pb-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-400 mt-2">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

