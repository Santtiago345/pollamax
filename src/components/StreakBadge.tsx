"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

type StreakType = 'exact' | 'winner' | null;

export default function StreakBadge({ type, count, small = false }: { type: StreakType; count: number; small?: boolean }) {
  const controls = useAnimation();

  useEffect(() => {
    // Animación breve al cambiar la racha
    controls.start({ scale: [1, 1.12, 1], rotate: [0, 3, 0], transition: { duration: 0.45 } });
  }, [count, type, controls]);

  if (!type || count <= 0) return <span className={`text-[11px] text-zinc-500 ${small ? '' : ''}`}>Sin racha</span>;

  const isExact = type === 'exact';
  const bg = isExact ? 'bg-emerald-500/8' : 'bg-red-500/8';
  const color = isExact ? 'text-emerald-300' : 'text-red-300';

  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={controls}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${bg} ${color}`}
      title={isExact ? `Racha de marcadores: x${count}` : `Racha de ganadores: x${count}`}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
      </svg>
      <span className="leading-none">{isExact ? `E x${count}` : `G x${count}`}</span>
    </motion.span>
  );
}
