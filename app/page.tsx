// File: pages/index.tsx
"use client"

import dynamic from 'next/dynamic'
import { useRef, useEffect, useState } from 'react'
import { GroceryManagerComponent } from './components/groceries'
import p5Types from "p5"

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

export default function Home() {
  const groceryManagerRef = useRef<HTMLDivElement>(null)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number }>>([])

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)
    p5.background(0)

    // Initialize particles
    const newParticles = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        vx: p5.random(-1, 1),
        vy: p5.random(-1, 1)
      })
    }
    setParticles(newParticles)
  }

  const draw = (p5: p5Types) => {
    p5.background(0, 10)

    p5.stroke(255, 50)
    p5.strokeWeight(1)

    particles.forEach((particle, index) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < 0 || particle.x > p5.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > p5.height) particle.vy *= -1

      particles.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex) {
          const d = p5.dist(particle.x, particle.y, otherParticle.x, otherParticle.y)
          if (d < 100) {
            p5.line(particle.x, particle.y, otherParticle.x, otherParticle.y)
          }
        }
      })
    })

    setParticles([...particles])
  }

  useEffect(() => {
    if (groceryManagerRef.current) {
      groceryManagerRef.current.style.position = 'relative'
      groceryManagerRef.current.style.zIndex = '1'
    }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Sketch setup={setup} draw={draw} className="absolute top-0 left-0" />
      <div ref={groceryManagerRef} className="absolute top-0 left-0 w-full h-full overflow-auto">
        <GroceryManagerComponent />
      </div>
    </div>
  )
}