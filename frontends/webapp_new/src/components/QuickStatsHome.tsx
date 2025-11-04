import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Coins, Users, Skull } from 'lucide-react';

export interface QuickStatsHomeProps {
  totalPets?: number;
  alivePets?: number;
  deadPets?: number;
  coins?: number;
  className?: string;
  layout?: 'grid-2x2' | 'grid-1x4';
}

export default function QuickStatsHome({
  totalPets = 0,
  alivePets = 0,
  deadPets = 0,
  coins = 0,
  className = '',
  layout = 'grid-2x2'
}: QuickStatsHomeProps) {
  const stats = [
    {
      key: 'totalPets',
      label: 'Всего',
      value: totalPets,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400'
    },
    {
      key: 'alivePets',
      label: 'Живых',
      value: alivePets,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      iconColor: 'text-pink-400'
    },
    {
      key: 'deadPets',
      label: 'Мёртвых',
      value: deadPets,
      icon: Skull,
      color: 'from-gray-600 to-gray-700',
      iconColor: 'text-gray-400'
    },
    {
      key: 'coins',
      label: 'Монеты',
      value: coins,
      icon: Coins,
      color: 'from-yellow-500 to-amber-500',
      iconColor: 'text-yellow-400'
    }
  ];

  const gridCols = layout === 'grid-1x4' ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4';
  
  return (
    <div className={`grid ${gridCols} gap-1 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.key}
            className="relative rounded-lg bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden group aspect-square"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

            {/* Frosted glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-1 text-center">
              <motion.div
                className={`inline-flex p-1 rounded-md bg-gradient-to-br ${stat.color} bg-opacity-20 mb-0.5`}
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </motion.div>
              
              <motion.div
                className="text-sm font-black text-white mb-0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
              >
                {stat.value}
              </motion.div>
              
              <p className="text-[10px] text-gray-400 font-medium leading-tight">{stat.label}</p>
            </div>

            {/* Hover glow */}
            <motion.div
              className={`absolute -inset-0.5 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 blur-md -z-10`}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

