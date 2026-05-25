import { UserNewWorkspace } from "@/components/app/user-new/Workspace"

export default async function TravailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <UserNewWorkspace travailId={id} />
}
