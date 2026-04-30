'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DockItem {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
}

interface DockProps {
  items: DockItem[]
  panelHeight?: number
  baseItemSize?: number
  magnification?: number
}

export default function Dock({
  items,
  panelHeight = 80,
  baseItemSize = 50,
  magnification = 70,
}: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseX, setMouseX] = useState<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMouseX(e.clientX - rect.left)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getItemSize = (index: number) => {
    if (hoveredIndex === null || mouseX === null) return baseItemSize
    
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) return magnification
    if (distance === 1) return magnification * 0.7
    if (distance === 2) return magnification * 0.4
    return baseItemSize
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        ref={containerRef}
        className="flex items-center justify-center gap-4 px-6 py-3 rounded-full bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10"
        style={{ height: panelHeight }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="cursor-pointer transition-all"
            animate={{
              scale: hoveredIndex === index ? 1.2 : 1,
              y: hoveredIndex === index ? -10 : 0,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onClick={item.onClick}
            style={{
              width: getItemSize(index),
              height: getItemSize(index),
            }}
          >
            <div
              className="flex items-center justify-center w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-200"
              title={item.label}
            >
              {item.icon}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
