import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type SpringOptions
} from 'framer-motion';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const scale = useTransform(size, [baseItemSize, magnification], [1, 1.2]);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
        scale
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-2xl ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div
          className="absolute -inset-0.5 rounded-2xl opacity-50 blur-lg"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #F472B6 75%, #8B5CF6 100%)',
            backgroundSize: '200% 200%',
            zIndex: -1,
            animation: 'gradientShift 4s ease infinite'
          }}
        />
      </div>
      <div className="relative z-10 flex items-center justify-center">
        {Children.map(children, child =>
          React.isValidElement(child)
            ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
            : child
        )}
      </div>
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -12, scale: 1 }}
          exit={{ opacity: 0, y: 0, scale: 0.8 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className={`${className} absolute -top-10 left-1/2 w-fit whitespace-pre rounded-lg border border-white/20 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl px-3 py-1.5 text-xs text-white shadow-2xl`}
          style={{ x: '-50%' }}
          role="tooltip"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg blur-sm -z-10" />
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
  return (
    <div className={`flex items-center justify-center text-white/90 ${className}`}>
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 72,
  dockHeight = 256,
  baseItemSize = 56
}: DockProps) {
  // Адаптивные размеры для мобильных устройств
  const [isMobile, setIsMobile] = React.useState(false);
  const [screenWidth, setScreenWidth] = React.useState(0);
  
  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Динамические размеры в зависимости от ширины экрана
  const adaptiveBaseItemSize = screenWidth < 360 ? 44 : isMobile ? 48 : baseItemSize;
  const adaptivePanelHeight = screenWidth < 360 ? 60 : isMobile ? 64 : panelHeight;
  const adaptiveMagnification = screenWidth < 360 ? 56 : isMobile ? 60 : magnification;
  const adaptiveGap = screenWidth < 360 ? '6px' : isMobile ? '8px' : '12px';
  const adaptivePaddingX = screenWidth < 360 ? '8px' : isMobile ? '12px' : '20px';
  
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, adaptiveMagnification + adaptiveMagnification / 2 + 4),
    [adaptiveMagnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [adaptivePanelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      onMouseMove={({ pageX }) => {
        isHovered.set(1);
        mouseX.set(pageX);
      }}
      onMouseLeave={() => {
        isHovered.set(0);
        mouseX.set(Infinity);
      }}
      className={`${className} dock-container`}
      style={{
        position: 'fixed',
        bottom: screenWidth < 640 ? 'calc(8px + env(safe-area-inset-bottom, 0px))' : 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        right: 'auto',
        transform: 'translateX(-50%)',
        height: height,
        maxWidth: 'calc(100vw - 16px)',
        width: 'auto',
        minWidth: 'fit-content',
        paddingLeft: adaptivePaddingX,
        paddingRight: adaptivePaddingX,
        paddingBottom: '8px',
        paddingTop: '8px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.85) 50%, rgba(17, 24, 39, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflowX: 'hidden',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
      role="toolbar"
      aria-label="Application dock"
    >
      <div
        className="absolute -inset-0.5 opacity-50 blur-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #F472B6 75%, #8B5CF6 100%)',
          backgroundSize: '200% 200%',
          zIndex: -1,
          animation: 'gradientShift 4s ease infinite',
          borderRadius: '1rem'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" style={{ borderRadius: '1rem' }} />
      <div 
        className="relative z-10 flex items-end shrink-0"
        style={{
          gap: adaptiveGap
        }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={adaptiveMagnification}
            baseItemSize={adaptiveBaseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </div>
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        /* Скрытие scrollbar для dock */
        .dock-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}

