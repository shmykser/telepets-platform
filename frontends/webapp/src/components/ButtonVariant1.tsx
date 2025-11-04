import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonVariant1Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function ButtonVariant1({
  variant = 'default',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: ButtonVariant1Props) {
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: 'bg-gradient-to-r from-gray-700/50 to-gray-600/50',
          hover: 'hover:from-gray-700 hover:to-gray-600',
          border: 'border border-gray-600/50'
        };
      case 'destructive':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-rose-600',
          hover: 'hover:from-red-700 hover:to-rose-700',
          border: ''
        };
      case 'outline':
        return {
          bg: 'bg-transparent',
          hover: 'hover:bg-white/5',
          border: 'border border-white/20'
        };
      case 'ghost':
        return {
          bg: 'bg-transparent',
          hover: 'hover:bg-white/5',
          border: ''
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600',
          hover: 'hover:from-blue-700 hover:via-purple-700 hover:to-pink-700',
          border: '',
          animatedBg: true
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-base';
      default:
        return 'px-5 py-3 text-sm';
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <motion.button
      className={`
        relative rounded-xl font-semibold text-white overflow-hidden
        ${styles.bg} ${styles.border} ${sizeStyles}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : styles.hover}
        transition-all duration-200 ${className}
      `}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      style={{
        background: variant === 'default' && !isDisabled
          ? 'linear-gradient(90deg, #2563eb, #9333ea, #ec4899, #2563eb)'
          : undefined,
        backgroundSize: variant === 'default' && !isDisabled ? '200% 100%' : undefined
      }}
      animate={
        variant === 'default' && !isDisabled
          ? {
              backgroundPosition: ['0%', '100%', '0%']
            }
          : {}
      }
      transition={{
        backgroundPosition: {
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }
      }}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon && iconPosition === 'left' ? (
          <span>{icon}</span>
        ) : null}
        {children}
        {icon && iconPosition === 'right' && !loading && (
          <span>{icon}</span>
        )}
      </span>

      {/* Ripple effect on click */}
      {!isDisabled && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-xl"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{
            scale: 2,
            opacity: [1, 0],
            transition: { duration: 0.4 }
          }}
        />
      )}
    </motion.button>
  );
}

