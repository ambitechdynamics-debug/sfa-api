"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChatConversation } from "@/components/app/ChatConversation"

function ChatPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? undefined

  return <ChatConversation initialPrompt={q} />
}

export default function NewChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  )
}
