import { redirect } from "next/navigation"

export default async function LegacyCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value)
  }

  redirect(`/dashboard/create${query.toString() ? `?${query.toString()}` : ""}`)
}
