"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

type StreakType = 'exact' | 'winner' | null;

export default function StreakBadge({ type, count, small = false }: { type: StreakType; count: number; small?: boolean }) {
  const hasStreak = type && count > 0;
  const isExact = type === 'exact';
  const controls = useAnimation();

  useEffect(() => {
    if (hasStreak) {
      controls.start({ scale: [1, 1.12, 1], rotate: [0, 3, 0], transition: { duration: 0.45 } });
    }
  }, [count, type, controls, hasStreak]);

  const bg = hasStreak ? (isExact ? 'bg-emerald-500/10' : 'bg-red-500/10') : 'bg-zinc-800/30';
  const color = hasStreak ? (isExact ? 'text-emerald-300' : 'text-red-300') : 'text-zinc-600';

  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={hasStreak ? controls : { scale: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${bg} ${color}`}
      title={hasStreak ? (isExact ? `Racha de marcadores: x${count}` : `Racha de ganadores: x${count}`) : 'Sin racha'}
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
