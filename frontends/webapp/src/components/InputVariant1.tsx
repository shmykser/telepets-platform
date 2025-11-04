import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputVariant1Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
}

export default function InputVariant1({
  label,
  error,
  success,
  helperText,
  icon,
  className = '',
  ...props
}: InputVariant1Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x, y });
  };

  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-300 block">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Animated gradient border */}
        <div
          className={`absolute -inset-0.5 rounded-xl opacity-60 blur-sm transition-opacity ${
            isFocused 
              ? hasError 
                ? 'opacity-100' 
                : hasSuccess 
                ? 'opacity-100'
                : 'opacity-80'
              : 'opacity-0'
          }`}
          style={{
            background: hasError
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : hasSuccess
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : `linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)`,
            backgroundSize: '200% 200%',
            backgroundPosition: `${glowPosition.x}% ${glowPosition.y}%`
          }}
        />

        {/* Glassmorphism input container */}
        <div
          className="relative rounded-xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border border-white/10 overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          {/* Frosted glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {/* Input wrapper */}
          <div className="relative flex items-center">
            {icon && (
              <div className="absolute left-4 text-gray-400 z-10">
                {icon}
              </div>
            )}
            
            <motion.input
              type="text"
              className={`
                w-full px-4 py-3 bg-transparent text-white placeholder:text-gray-500
                text-sm font-medium outline-none transition-all
                ${icon ? 'pl-12' : ''}
                ${hasError ? 'text-red-300' : ''}
                ${hasSuccess ? 'text-green-300' : ''}
              `}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              initial={false}
              animate={{
                scale: isFocused ? 1.01 : 1
              }}
              transition={{ duration: 0.2 }}
              {...props}
            />

            {/* Status icons */}
            {(hasError || hasSuccess) && (
              <motion.div
                className="absolute right-4 z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {hasError ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Helper text or error */}
        {(helperText || error) && (
          <motion.p
            className={`text-xs mt-1 ${
              hasError ? 'text-red-400' : 'text-gray-400'
            }`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    </div>
  );
}

