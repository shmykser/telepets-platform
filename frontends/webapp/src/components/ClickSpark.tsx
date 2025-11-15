import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

interface SparkParticle {
  id: string
  dx: number
  dy: number
  delay: number
  color: string
}

interface SparkBurst {
  id: string
  x: number
  y: number
  particles: SparkParticle[]
}

function createParticles(count = 10): SparkParticle[] {
  const colors = ['#ffffff', '#e9d5ff', '#c7d2fe', '#a7f3d0', '#fef3c7']
  const particles: SparkParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const distance = 30 + Math.random() * 40
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    particles.push({
      id: `${Date.now()}-${i}`,
      dx,
      dy,
      delay: Math.random() * 0.05,
      color: colors[i % colors.length],
    })
  }
  return particles
}

const IS_ENABLED = false;

export default function ClickSpark() {
  if (!IS_ENABLED) {
    return null;
  }

  const [bursts, setBursts] = useState<SparkBurst[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      setBursts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          x,
          y,
          particles: createParticles(12),
        },
      ])
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // Автоочистка вспышек
  useEffect(() => {
    if (bursts.length === 0) return
    const timer = setTimeout(() => setBursts((prev) => prev.slice(1)), 700)
    return () => clearTimeout(timer)
  }, [bursts])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden
    >
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute"
          style={{ left: burst.x, top: burst.y }}
        >
          {burst.particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute block rounded-full"
              style={{ width: 4, height: 4, backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: p.delay }}
            />
          ))}
        </div>
      ))}
    </div>,
    document.body
  )
}

