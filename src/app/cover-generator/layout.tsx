import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "智能封面",
}

export default function CoverGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
