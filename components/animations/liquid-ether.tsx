'use client'

import React, { useRef, useEffect, useState } from 'react'

interface LiquidEtherProps {
  colors?: string[]
  mouseForce?: number
  cursorSize?: number
  isViscous?: boolean
  viscous?: number
  iterationsViscous?: number
  iterationsPoisson?: number
  resolution?: number
  isBounce?: boolean
  autoDemo?: boolean
  autoSpeed?: number
  autoIntensity?: number
  takeoverDuration?: number
  autoResumeDelay?: number
  autoRampDuration?: number
  color0?: string
  color1?: string
  color2?: string
}

export default function LiquidEther({
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
  mouseForce = 20,
  cursorSize = 100,
  isViscous = true,
  viscous = 30,
  resolution = 0.5,
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
}: LiquidEtherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Animation state
    let animationFrameId: number
    let time = 0

    // Grid for simulation
    const gridResolution = Math.max(1, Math.floor(10 * resolution))
    const gridWidth = Math.ceil(canvas.width / gridResolution)
    const gridHeight = Math.ceil(canvas.height / gridResolution)

    // Create particle grid
    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = []
    for (let i = 0; i < gridWidth; i++) {
      for (let j = 0; j < gridHeight; j++) {
        particles.push({
          x: i * gridResolution,
          y: j * gridResolution,
          vx: 0,
          vy: 0,
        })
      }
    }

    const animate = () => {
      time += autoSpeed

      // Clear canvas
      ctx.fillStyle = '#060010'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update particles with mouse influence
      particles.forEach((p) => {
        // Auto demo mode
        if (autoDemo) {
          const autoX = (Math.sin(time * 0.5) * canvas.width) / 2 + canvas.width / 2
          const autoY = (Math.cos(time * 0.3) * canvas.height) / 2 + canvas.height / 2

          const dx = autoX - p.x
          const dy = autoY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < cursorSize) {
            const angle = Math.atan2(dy, dx)
            p.vx += Math.cos(angle) * autoIntensity
            p.vy += Math.sin(angle) * autoIntensity
          }
        } else {
          // Mouse influence
          const dx = mousePos.x - p.x
          const dy = mousePos.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < cursorSize) {
            const angle = Math.atan2(dy, dx)
            p.vx += Math.cos(angle) * mouseForce * 0.1
            p.vy += Math.sin(angle) * mouseForce * 0.1
          }
        }

        // Damping
        p.vx *= 0.95
        p.vy *= 0.95

        // Bounds
        if (isViscous) {
          p.vx = Math.max(-viscous, Math.min(viscous, p.vx))
          p.vy = Math.max(-viscous, Math.min(viscous, p.vy))
        }

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Bounce
        if (p.x < 0) p.x = 0
        if (p.x > canvas.width) p.x = canvas.width
        if (p.y < 0) p.y = 0
        if (p.y > canvas.height) p.y = canvas.height
      })

      // Render mesh
      for (let i = 0; i < gridWidth - 1; i++) {
        for (let j = 0; j < gridHeight - 1; j++) {
          const idx = i * gridHeight + j
          const p1 = particles[idx]
          const p2 = particles[(i + 1) * gridHeight + j]
          const p3 = particles[i * gridHeight + (j + 1)]

          if (p1 && p2 && p3) {
            // Color based on gradient
            const colorIndex = Math.floor((j / gridHeight) * colors.length)
            const color = colors[Math.min(colorIndex, colors.length - 1)]

            // Draw triangles
            ctx.fillStyle = color
            ctx.globalAlpha = 0.7

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(p3.x, p3.y)
            ctx.fill()
          }
        }
      }

      ctx.globalAlpha = 1

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [colors, mouseForce, cursorSize, isViscous, viscous, autoDemo, autoSpeed, autoIntensity])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
