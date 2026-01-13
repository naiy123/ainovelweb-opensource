"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { HumanizeTool } from "@/components/humanize/humanize-tool"

export default function HumanizePage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <HumanizeTool />
      </main>
    </div>
  )
}
