"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { playNavSound, initAudio } from '@/lib/sounds';

export const AnimatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    initAudio();
    if (prevPathRef.current !== pathname) {
      playNavSound();
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedLayout;
