"use client"

import { useEffect, useRef } from "react"

export default function HouseDotAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    const dotSize = 3
    const spacing = 6
    const cols = Math.floor(canvas.width / spacing)
    const rows = Math.floor(canvas.height / spacing)

    const dotOffsets = new Map<string, { offsetX: number; offsetY: number; phase: number }>()

    function isInsideHouse(col: number, row: number): boolean {
      const centerX = cols / 2
      const centerY = rows / 2

      const x = col - centerX + 50
      const y = row - centerY + 20

      // Roof (triangular top)
      if (y >= -40 && y <= 10) {
        const roofTop = -40
        const roofBottom = 10
        const roofHeight = roofBottom - roofTop
        const currentHeight = y - roofTop
        const roofWidth = (currentHeight / roofHeight) * 60 + 5

        if (x >= 50 - roofWidth && x <= 50 + roofWidth) {
          return true
        }
      }

      // Main house body (rectangular)
      if (y >= 10 && y <= 80) {
        if (x >= 10 && x <= 90) {
          return true
        }
      }

      // Chimney
      if (y >= -25 && y <= 15) {
        if (x >= 75 && x <= 85) {
          return true
        }
      }

      return false
    }

    function isPositionInHouse(col: number, row: number, offsetX: number, offsetY: number): boolean {
      const newCol = col + offsetX / spacing
      const newRow = row + offsetY / spacing
      return isInsideHouse(Math.round(newCol), Math.round(newRow))
    }

    // Animation state
    let animationFrame = 0
    const maxFrames = 120

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate animation progress
      const time = Date.now() * 0.001

      // Draw dots
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing
          const y = row * spacing

          // Check if this position should have a dot (part of house shape)
          const isHouseDot = isInsideHouse(col, row)

          if (isHouseDot) {
            const dotKey = `${col}-${row}`

            if (!dotOffsets.has(dotKey)) {
              dotOffsets.set(dotKey, {
                offsetX: (Math.random() - 0.5) * 2,
                offsetY: (Math.random() - 0.5) * 2,
                phase: Math.random() * Math.PI * 2,
              })
            }

            const dotData = dotOffsets.get(dotKey)!

            const moveRadius = 1
            const randomX = Math.sin(time * 0.6 + dotData.phase) * moveRadius + dotData.offsetX
            const randomY = Math.cos(time * 0.8 + dotData.phase + 1) * moveRadius + dotData.offsetY

            let finalX = x
            let finalY = y

            if (isPositionInHouse(col, row, randomX, randomY)) {
              finalX = x + randomX
              finalY = y + randomY
            }

            const flickerSpeed1 = Math.sin(time * 2.5 + dotData.phase) > 0.2 ? 1 : 0
            const flickerSpeed2 = Math.sin(time * 1.8 + dotData.phase + 1) > 0.4 ? 1 : 0

            // Combine different flicker patterns for variety
            const isVisible = flickerSpeed1 || flickerSpeed2
            const opacity = isVisible ? 1 : 0

            if (opacity > 0) {
              ctx.fillStyle = "rgba(0, 0, 0, 1)" // Solid black when visible
              ctx.fillRect(finalX - dotSize / 2, finalY - dotSize / 2, dotSize, dotSize)
            }
          } else {
            if (Math.random() < 0.08) {
              const backgroundOpacity = 0.01 + Math.random() * 0.02
              ctx.fillStyle = `rgba(0, 0, 0, ${backgroundOpacity})`
              ctx.fillRect(x - dotSize * 0.2, y - dotSize * 0.2, dotSize * 0.4, dotSize * 0.4)
            }
          }
        }
      }

      animationFrame = (animationFrame + 1) % maxFrames
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
    }
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ filter: "contrast(1.5) brightness(0.9)" }} />
    </div>
  )
}