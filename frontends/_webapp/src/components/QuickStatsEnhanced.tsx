import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Coins, Users, Skull } from 'lucide-react';

export interface QuickStatsEnhancedProps {
  stats: {
    totalPets?: number;
    alivePets?: number;
    deadPets?: number;
    coins?: number;
  };
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function QuickStatsEnhanced({
  stats,
  columns = 4,
  className = ''
}: QuickStatsEnhancedProps) {
  const gridCols = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const statItems = [
    {
      key: 'totalPets',
      label: 'Всего',
      value: stats.totalPets ?? 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400'
    },
    {
      key: 'alivePets',
      label: 'Живых',
      value: stats.alivePets ?? 0,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      iconColor: 'text-pink-400'
    },
    {
      key: 'deadPets',
      label: 'Мёртвых',
      value: stats.deadPets ?? 0,
      icon: Skull,
      color: 'from-gray-600 to-gray-700',
      iconColor: 'text-gray-400'
    },
    {
      key: 'coins',
      label: 'Монеты',
      value: stats.coins ?? 0,
      icon: Coins,
      color: 'from-yellow-500 to-amber-500',
      iconColor: 'text-yellow-400'
    }
  ].slice(0, columns);

  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            className="relative rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

            {/* Frosted glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative p-6 text-center">
              <motion.div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-20 mb-4`}
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className={`w-6 h-6 ${item.iconColor}`} />
              </motion.div>
              
              <motion.div
                className="text-3xl font-black text-white mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
              >
                {item.value}
              </motion.div>
              
              <p className="text-sm text-gray-400 font-medium">{item.label}</p>
            </div>

            {/* Hover glow */}
            <motion.div
              className={`absolute -inset-1 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-xl -z-10`}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
