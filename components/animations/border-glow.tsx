'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface BorderGlowProps {
  children: React.ReactNode
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  edgeSensitivity?: number
  coneSpread?: number
  colors?: string[]
  animated?: boolean
}

export default function BorderGlow({
  children,
  glowColor = '59 130 246',
  backgroundColor = '#000',
  borderRadius = 20,
  glowRadius = 30,
  glowIntensity = 1,
  edgeSensitivity = 30,
  coneSpread = 25,
  colors = ['#3b82f6'],
  animated = true,
}: BorderGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && isHovering) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isHovering])

  const gradientAngle = Math.atan2(mousePosition.y - 100, mousePosition.x - 100) * (180 / Math.PI)

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ borderRadius: `${borderRadius}px` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `conic-gradient(from ${gradientAngle}deg, ${colors.join(', ')})`,
          opacity: isHovering ? glowIntensity : 0.3,
          padding: '2px',
        }}
        animate={
          animated && isHovering
            ? {
                opacity: [glowIntensity, glowIntensity * 0.7, glowIntensity],
              }
            : {}
        }
        transition={animated ? { duration: 2, repeat: Infinity } : {}}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none blur-xl"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(${glowColor}, ${glowIntensity}), transparent)`,
          opacity: isHovering ? 0.6 : 0,
        }}
        animate={
          animated && isHovering
            ? {
                opacity: [0.6, 0.3, 0.6],
              }
            : {}
        }
        transition={animated ? { duration: 3, repeat: Infinity } : {}}
      />

      {/* Content */}
      <div
        className="relative z-10"
        style={{
          backgroundColor,
          borderRadius: `calc(${borderRadius}px - 2px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
