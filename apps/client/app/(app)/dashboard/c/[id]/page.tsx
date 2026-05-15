import { ChatConversation } from "@/components/app/ChatConversation"

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatConversation conversationId={id} />
}
