import { redirect } from "next/navigation"

export default function Home() {
  // 本地版本：直接重定向到 dashboard
  redirect("/dashboard")
}
