import { CheckEmailForm } from "@/components/auth/CheckEmailForm"

type CheckEmailPageProps = {
  searchParams: Promise<{ email?: string }> | { email?: string }
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams
  return <CheckEmailForm email={params.email?.trim() ?? ""} />
}
