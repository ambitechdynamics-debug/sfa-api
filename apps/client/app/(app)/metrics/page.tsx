import { redirect } from "next/navigation"

export default function LegacyMetricsPage() {
  redirect("/dashboard/metrics")
}
