"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const TESTIMONIALS = [
  { text: "Un gain de temps fou pour mes affiches.", lang: "FR", author: "Marc" },
  { text: "The AI understands graphic design rules.", lang: "EN", author: "Sarah" },
  { text: "Los flyers de mi restaurante se ven genial.", lang: "ES", author: "Carlos" },
  { text: "Einfach zu bedienen, tolle Ergebnisse.", lang: "DE", author: "Elena" },
  { text: "Incredibile! Menu creato in 2 minuti.", lang: "IT", author: "Luca" },
  { text: "デザインの質が非常に高いです。", lang: "JP", author: "Yuki" },
  { text: "أفضل أداة لتصميم الملصقات بسرعة.", lang: "AR", author: "Omar" },
  { text: "Muito fácil de usar no dia a dia.", lang: "PT", author: "Ana" },
  { text: "Prachtige posters in een handomdraai.", lang: "NL", author: "Bram" },
]

export function FloatingTestimonials() {
  const [items, setItems] = useState<Array<{
    id: string;
    text: string;
    lang: string;
    author: string;
    side: "left" | "right";
    y: number;
    delay: number;
  }>>([])

  useEffect(() => {
    // On génère 3 "slots" de témoignages
    const generateItems = () => {
      const newItems = Array.from({ length: 3 }, (_, i) => {
        const t = TESTIMONIALS[Math.floor(Math.random() * TESTIMONIALS.length)]
        return {
          ...t,
          id: Math.random().toString(36).substr(2, 9),
          side: Math.random() > 0.5 ? ("left" as const) : ("right" as const),
          y: 20 + Math.random() * 60, // Position verticale entre 20% et 80%
          delay: i * 2.5, // Décalage pour ne pas qu'ils arrivent tous en même temps
        }
      })
      setItems(newItems)
    }

    generateItems()
  }, [])

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map((item) => (
        <TestimonialItem key={item.id} item={item} onComplete={(oldId) => {
          // Remplacer le témoignage terminé par un nouveau
          setItems(prev => prev.map(p => {
            if (p.id === oldId) {
              const t = TESTIMONIALS[Math.floor(Math.random() * TESTIMONIALS.length)]
              return {
                ...t,
                id: Math.random().toString(36).substr(2, 9),
                side: Math.random() > 0.5 ? "left" : "right",
                y: 20 + Math.random() * 60,
                delay: 0
              }
            }
            return p
          }))
        }} />
      ))}
    </div>
  )
}

function TestimonialItem({ item, onComplete }: { item: any, onComplete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: item.side === "left" ? -120 : 120, 
        y: 100,
        scale: 0.8 
      }}
      animate={{ 
        opacity: 0.5, 
        x: item.side === "left" ? 30 : -30, 
        y: -150, // Monte sur une grande distance
        scale: 1 
      }}
      transition={{ 
        duration: 10 + Math.random() * 5, 
        delay: item.delay,
        ease: "linear"
      }}
      onAnimationComplete={() => onComplete(item.id)}
      style={{
        position: "absolute",
        left: item.side === "left" ? "4%" : "auto",
        right: item.side === "right" ? "4%" : "auto",
        top: `${item.y}%`,
        padding: "10px 16px",
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-3)",
        boxShadow: "var(--sh-2)",
        color: "var(--ink-1)",
        fontSize: 12,
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        backdropFilter: "blur(6px)",
        maxWidth: 200,
        whiteSpace: "normal",
      }}
    >
      <div style={{ fontStyle: "italic", lineHeight: 1.3 }}>"{item.text}"</div>
      <div style={{ 
        fontSize: 10, 
        color: "var(--acc)", 
        display: "flex", 
        justifyContent: "space-between",
        marginTop: 2,
        opacity: 0.8 
      }}>
        <span style={{ fontWeight: 500 }}>{item.author}</span>
        <span style={{ fontWeight: 700 }}>{item.lang}</span>
      </div>
    </motion.div>
  )
}
