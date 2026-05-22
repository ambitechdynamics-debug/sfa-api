"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChatConversation } from "@/components/app/ChatConversation"

function ChatPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? undefined
  const type = searchParams.get("type") ?? undefined

  return <ChatConversation initialPrompt={q} initialType={type} />
}

export default function NewChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  )
}
