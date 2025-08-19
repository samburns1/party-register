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
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    const dotSize = 2
    const spacing = 3
    const cols = Math.floor(canvas.width / spacing)
    const rows = Math.floor(canvas.height / spacing)

    const dotOffsets = new Map<string, { offsetX: number; offsetY: number; phase: number }>()

    function isInsideHouse(col: number, row: number): boolean {
      const centerX = cols / 2
      const centerY = rows / 2

      const x = col - centerX
      const y = row - centerY

      const isInBody = y >= 10 && y <= 40 && x >= -25 && x <= 25

      const roofHeight = 20 // Height of triangle
      const roofBase = 25 // Half-width of triangle base

      const isInRoof = y >= -20 && y <= 10 && Math.abs(x) <= roofBase * ((y + 20) / roofHeight)

      return isInBody || isInRoof
    }

    function isPositionInHouse(col: number, row: number, offsetX: number, offsetY: number): boolean {
      const newCol = col + offsetX / spacing
      const newRow = row + offsetY / spacing
      return isInsideHouse(Math.round(newCol), Math.round(newRow))
    }

    let animationFrame = 0
    const maxFrames = 120

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const time = Date.now() * 0.001

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing
          const y = row * spacing

          const isHouseDot = isInsideHouse(col, row)

          if (isHouseDot) {
            const dotKey = `${col}-${row}`

            if (!dotOffsets.has(dotKey)) {
              dotOffsets.set(dotKey, {
                offsetX: (Math.random() - 0.5) * 1,
                offsetY: (Math.random() - 0.5) * 1,
                phase: Math.random() * Math.PI * 2,
              })
            }

            const dotData = dotOffsets.get(dotKey)!

            const moveRadius = 0.5
            const randomX = Math.sin(time * 0.4 + dotData.phase) * moveRadius + dotData.offsetX
            const randomY = Math.cos(time * 0.6 + dotData.phase + 1) * moveRadius + dotData.offsetY

            const finalX = x + randomX
            const finalY = y + randomY

            const flicker1 = Math.sin(time * 3 + dotData.phase) > 0.1 ? 1 : 0
            const flicker2 = Math.sin(time * 2.2 + dotData.phase + 2) > 0.3 ? 1 : 0
            const flicker3 = Math.sin(time * 1.5 + dotData.phase + 4) > 0.5 ? 1 : 0

            const isVisible = flicker1 || flicker2 || flicker3

            if (isVisible) {
              ctx.fillStyle = "rgba(0, 0, 0, 1)"
              ctx.fillRect(finalX - dotSize / 2, finalY - dotSize / 2, dotSize, dotSize)
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
    <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}