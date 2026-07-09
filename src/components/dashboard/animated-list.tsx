'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { motion } from 'motion/react';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  /** Remount + stagger only when this key changes (e.g. storage selection), not on filter tweaks */
  animateKey?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
} as const;

/** Lightweight stagger wrapper for dashboard asset rows — no layout animations to avoid scroll jank. */
export default function AnimatedList({ children, className, animateKey }: AnimatedListProps) {
  return (
    <motion.div
      key={animateKey}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        return (
          <motion.div key={child.key ?? undefined} variants={itemVariants} layout={false}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
