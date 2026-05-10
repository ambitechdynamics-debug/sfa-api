"use client"

import { Icon } from "@/components/ui/Icon"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function AiPromptPanel() {
  const router = useRouter()
  const [placeholder, setPlaceholder] = useState("")
  const fullText = "Qu'avez-vous en tête ?"

  useEffect(() => {
    let index = 0
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        setPlaceholder(fullText.slice(0, index))
        index++
        if (index > fullText.length) {
          clearInterval(timer)
        }
      }, 35)
      return () => clearInterval(timer)
    }, 800)
    return () => clearTimeout(delay)
  }, [])

  const handleRedirect = () => {
    router.push("/login")
  }

  return (
    <div className="anim-fade-up" style={{
      width: "100%",
      maxWidth: 960,
      margin: "40px auto 80px",
      padding: "0 20px",
      position: "relative",
      zIndex: 20,
      animationDelay: "500ms"
    }}>
      <div 
        className="anim-border-glow"
        style={{
          background: "var(--bg-1)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 32,
          display: "flex",
          flexDirection: "column",
          minHeight: 190,
          overflow: "hidden"
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--line-1)" }}>
          <button 
            onClick={handleRedirect}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 24px",
              background: "var(--bg-2)",
              border: "none",
              color: "var(--ink-0)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              borderRight: "1px solid var(--line-1)"
            }}
          >
            <Icon name="wand" size={16} />
            Création
          </button>
          <button 
            onClick={handleRedirect}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 24px",
              background: "transparent",
              border: "none",
              color: "var(--ink-2)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-0)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-2)"}
          >
            <Icon name="layout" size={16} />
            Flux de travail
          </button>
        </div>

        {/* Input Area */}
        <div style={{ flex: 1, padding: "20px 24px" }}>
          <textarea 
            placeholder={placeholder}
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              color: "var(--ink-0)",
              fontSize: 18,
              resize: "none",
              outline: "none",
              fontFamily: "inherit"
            }}
          />
        </div>

        {/* Bottom Bar */}
        <div style={{ 
          padding: "16px 24px", 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          {/* Left Buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button 
              onClick={handleRedirect}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--bg-2)",
                border: "1px solid var(--line-1)",
                color: "var(--ink-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-3)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Icon name="plus" size={18} />
            </button>
            <button 
              onClick={handleRedirect}
              style={{
                height: 36,
                borderRadius: 18,
                padding: "0 16px",
                background: "var(--bg-2)",
                border: "1px solid var(--line-1)",
                color: "var(--ink-1)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-3)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Icon name="user" size={16} />
              Agents IA
              <Icon name="plus" size={12} style={{ opacity: 0.6 }} />
            </button>
          </div>

          {/* Right Buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button 
              onClick={handleRedirect}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                color: "var(--ink-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-0)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-2)"}
            >
              <Icon name="layers" size={20} />
            </button>
            <button 
              onClick={handleRedirect}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--acc)",
                border: "none",
                color: "var(--acc-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "var(--sh-acc)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Icon name="send" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
