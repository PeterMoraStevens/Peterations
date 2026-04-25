/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { motion } from 'framer-motion'
import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const LIGHT_STRIPS = ['#fef08a', '#bbf7d0', '#fbcfe8']
const DARK_STRIPS  = ['#7a6a00', '#1d5c39', '#7a1f4a']
const DELAYS = [0, 0.1, 0.2]

export default function BlogTemplate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? DARK_STRIPS : LIGHT_STRIPS

  return (
    <>
      {mounted && colors.map((color, i) => (
        <motion.div
          key={i}
          initial={{ y: '100%' }}
          animate={{ y: [null, '0%', '-100%'] }}
          transition={{
            duration: 1,
            delay: DELAYS[i],
            times: [0, 0.4, 1],
            ease: ['easeIn', 'easeOut'],
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: `${(i / 3) * 100}%`,
            width: `${100 / 3}%`,
            height: '150dvh',
            backgroundColor: color,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.75 }}
      >
        {children}
      </motion.div>
    </>
  )
}
