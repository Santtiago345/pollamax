"use client";

import React from 'react';
import { motion } from 'framer-motion';

type StreakType = 'exact' | 'winner' | null;

export default function StreakBadge({ type, count, small = false }: { type: StreakType; count: number; small?: boolean }) {
  const hasStreak = type && count > 0;
  const isExact = type === 'exact';

  const bg = hasStreak ? (isExact ? 'bg-emerald-500/10' : 'bg-red-500/10') : 'bg-zinc-800/30';
  const color = hasStreak ? (isExact ? 'text-emerald-300' : 'text-red-300') : 'text-zinc-600';

  return (
    <motion.span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${bg} ${color} cursor-pointer`}
      title={hasStreak ? (isExact ? `Racha de marcadores: x${count}` : `Racha de ganadores: x${count}`) : 'Sin racha'}
      animate={hasStreak ? {
        scale: [1, 1.08, 1],
        opacity: [1, 0.85, 1],
      } : { scale: 1, opacity: 1 }}
      transition={hasStreak ? {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : { duration: 0 }}
    >
      <svg className={`h-3 w-3 ${!hasStreak ? 'opacity-30' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
      </svg>
      {hasStreak ? (
        <span className="leading-none">{isExact ? `E x${count}` : `G x${count}`}</span>
      ) : (
        <span className="leading-none text-zinc-600">0</span>
      )}
    </motion.span>
  );
}
