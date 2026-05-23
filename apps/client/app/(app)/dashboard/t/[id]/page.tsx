import { ChatConversation } from "@/components/app/ChatConversation"

export default async function TravailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatConversation travailId={id} />
}
