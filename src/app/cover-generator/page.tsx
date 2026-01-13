"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { CoverGenerator } from "@/components/cover-generator"

export default function CoverGeneratorPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <CoverGenerator />
      </main>
    </div>
  )
}
