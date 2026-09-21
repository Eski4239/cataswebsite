// FadeUp — scroll-triggered fade-in animation wrapper using framer-motion.
// `data-fade` lets CSS force the final state for "reduce motion" visitors and when JavaScript is off (see globals.css and the layout).
'use client';
import {motion} from 'framer-motion';
import type {ReactNode} from 'react';

export function FadeUp({children, delay = 0}: {children: ReactNode; delay?: number}) {
  return (
    <motion.div
      data-fade=""
      initial={{opacity: 0, y: 16}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.8, delay, ease: [0.22, 1, 0.36, 1]}}
    >
      {children}
    </motion.div>
  );
}
